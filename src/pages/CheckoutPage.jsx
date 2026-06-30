import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { loadRazorpay } from "../utils/razorpay";
import api from "../api";
import { API_ROUTES } from "../constants/api.routes";

const ALLOWED_CALLBACK_HOSTS = ["127.0.0.1", "localhost"];

function isValidCallback(url) {
  try {
    const parsed = new URL(url);
    return ALLOWED_CALLBACK_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

function extractParams(searchParams) {
  return {
    orderId: searchParams.get("orderId")?.trim(),
    key: searchParams.get("key")?.trim(),
    amount: searchParams.get("amount")?.trim(),
    currency: searchParams.get("currency")?.trim(),
    callback: searchParams.get("callback")?.trim(),
  };
}

export default function CheckoutPage() {
  const [params] = useSearchParams();
  const [loadState, setLoadState] = useState("idle");
  const [loadError, setLoadError] = useState(null);

  const { orderId, key, amount, currency, callback } = useMemo(
    () => extractParams(params),
    [params],
  );

  const paramError = useMemo(() => {
    if (!orderId || !key || !amount || !currency || !callback) {
      return "Invalid payment request. Missing required parameters.";
    }
    if (!isValidCallback(callback)) {
      return "Request rejected. Invalid callback URL.";
    }
    return null;
  }, [orderId, key, amount, currency, callback]);

  useEffect(() => {
    if (paramError) return;

    let cancelled = false;

    const launch = async () => {
      setLoadState("loading");

      const loaded = await loadRazorpay();
      if (cancelled) return;

      if (!loaded) {
        setLoadState("error");
        setLoadError("Unable to load payment gateway. Please try again later.");
        return;
      }

      setLoadState("launching");

      let isSuccess = false;

      const options = {
        key,
        order_id: orderId,
        name: "Viyan MedAssist",
        description: "Subscription Upgrade",
        theme: { color: "#4fdbc8" },
        handler: async function (response) {
          isSuccess = true;
          console.log(
            "[Razorpay] Handler (success callback) invoked. Response:",
            response,
          );

          setLoadState("verifying");

          try {
            console.log("[Razorpay] Verifying payment with backend...");
            const verifyRes = await api.post(API_ROUTES.PAYMENTS_VERIFY, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const data = verifyRes.data;
            console.log("[Razorpay] Verification success:", data);

            const baseUrl = callback.replace(/\/+$/, "");
            const redirectUrl =
              baseUrl +
              "/callback" +
              "?razorpay_payment_id=" +
              encodeURIComponent(response.razorpay_payment_id || "") +
              "&razorpay_order_id=" +
              encodeURIComponent(response.razorpay_order_id || "") +
              "&razorpay_signature=" +
              encodeURIComponent(response.razorpay_signature || "");

            console.log(
              "[Razorpay] Redirecting to success callback URL:",
              redirectUrl,
            );
            // Use replace to avoid back-button loops in the desktop webview
            window.location.replace(redirectUrl);
          } catch (err) {
            console.error("[Razorpay] Verification error:", err);
            setLoadState("error");
            setLoadError(
              err.message || "Failed to verify payment with server.",
            );
          }
        },
        modal: {
          ondismiss() {
            console.log(
              "[Razorpay] modal.ondismiss event fired. isSuccess =",
              isSuccess,
            );
            if (!isSuccess) {
              const baseUrl = callback.replace(/\/+$/, "");
              const cancelUrl = baseUrl + "/cancel";
              console.trace(
                "[Razorpay] Redirecting to cancel URL from modal.ondismiss:",
                cancelUrl,
              );
              window.location.replace(cancelUrl);
            }
          },
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (failResponse) => {
          console.error(
            "[Razorpay] payment.failed event fired. Response:",
            failResponse,
          );
          const baseUrl = callback.replace(/\/+$/, "");
          const cancelUrl = baseUrl + "/cancel";
          console.trace(
            "[Razorpay] Redirecting to cancel URL from payment.failed:",
            cancelUrl,
          );
          window.location.replace(cancelUrl);
        });

        console.log("[Razorpay] Checkout opened for order:", orderId);
        console.log("[CheckoutPage] No frontend timeout logic configured.");
        rzp.open();
      } catch (err) {
        console.error("[Razorpay] Initialization error:", err);
        setLoadState("error");
        setLoadError("Unable to launch payment gateway.");
      }
    };

    launch();

    return () => {
      cancelled = true;
    };
  }, [paramError, orderId, key, amount, currency, callback]);

  const isError = paramError || loadState === "error";
  const message = paramError || loadError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] text-white">
      <div className="text-center max-w-sm px-6">
        {!isError && (
          <>
            <div className="w-12 h-12 border-4 border-[#4fdbc8]/20 border-t-[#4fdbc8] rounded-full animate-spin mx-auto mb-6" />
            <p className="text-gray-300 text-sm">
              {loadState === "verifying"
                ? "Verifying secure payment..."
                : loadState === "launching"
                  ? "Opening secure payment gateway..."
                  : "Preparing payment..."}
            </p>
          </>
        )}

        {isError && (
          <>
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-400 text-2xl">!</span>
            </div>
            <p className="text-gray-300 text-sm mb-6">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[#4fdbc8] text-[#0a0f1e] rounded-lg font-bold text-sm hover:brightness-110 transition-all"
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}
