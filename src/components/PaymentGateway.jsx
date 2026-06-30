import { useState, useRef, useEffect, useCallback } from "react";
import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";
import { loadRazorpay } from "../utils/razorpay";
import { safeNumber } from "../utils/number.js";

export default function PaymentGateway({ user, onPaymentComplete, amount }) {
  const [status, setStatus] = useState("checkout");
  const [method, setMethod] = useState("card");
  const [paymentError, setPaymentError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const razorpayRef = useRef(null);
  const pollRef = useRef(null);
  const authorizedRef = useRef(false);
  const MAX_RETRIES = 3;
  const isProcessingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (razorpayRef.current) {
        try {
          razorpayRef.current.close();
        } catch (e) {
          void e;
        }
        razorpayRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const handlePay = useCallback(async () => {
    if (isProcessingRef.current || status === "processing") return;
    if (retryCount >= MAX_RETRIES) {
      setPaymentError("Maximum retry attempts reached.");
      return;
    }

    isProcessingRef.current = true;

    try {
      setPaymentError(null);
      setStatus("processing");
      authorizedRef.current = false;

      if (razorpayRef.current) {
        try {
          razorpayRef.current.close();
        } catch (e) {
          void e;
        }
        razorpayRef.current = null;
      }

      const orderRes = await api.post(API_ROUTES.PAYMENTS_CREATE_ORDER, {
        amount: safeNumber(amount) || 1,
        planName: "Subscription",
        _ts: Date.now(),
      });

      const { key, order } = orderRes.data;
      if (!order || !order.id) throw new Error("Invalid order received");

      const finalKey = key || import.meta.env.VITE_RAZORPAY_KEY_ID || "";
      if (
        !finalKey ||
        finalKey === "undefined" ||
        finalKey.trim() === "" ||
        !order.id
      ) {
        setPaymentError("Payment setup incomplete: missing key or order_id");
        setStatus("checkout");
        isProcessingRef.current = false;
        return;
      }

      const prefill = {};
      const name = user?.fullName || user?.username;
      if (name) prefill.name = name;
      if (user?.email) prefill.email = user.email;
      if (user?.phone) prefill.contact = user.phone;

      const options = {
        key: finalKey,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Viyan MedAssist",
        description: "Professional License",
        order_id: order.id,
        handler: async (response) => {
          try {
            setStatus("processing");
            authorizedRef.current = true;
            await api.post(API_ROUTES.PAYMENTS_VERIFY, response);

            let attempts = 0;
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(async () => {
              attempts++;
              try {
                const res = await api.get(
                  `${API_ROUTES.PAYMENTS_STATUS}?orderId=${order.id}`,
                );
                if (res.data?.paymentStatus === "SUCCESS") {
                  clearInterval(pollRef.current);
                  setStatus("success");
                  isProcessingRef.current = false;
                } else if (
                  res.data?.paymentStatus === "FAILED" ||
                  attempts > 15
                ) {
                  clearInterval(pollRef.current);
                  setPaymentError(
                    "Payment verification timed out. If money was deducted, it will be refunded or manually activated.",
                  );
                  setStatus("checkout");
                  isProcessingRef.current = false;
                }
              } catch (e) {
                if (attempts > 15) {
                  clearInterval(pollRef.current);
                  setPaymentError(
                    "Payment verification timed out. If money was deducted, it will be refunded or manually activated.",
                  );
                  setStatus("checkout");
                  isProcessingRef.current = false;
                }
                console.log(e);
              }
            }, 2000);
          } catch (err) {
            console.error("Payment Verification Error:", err);
            setPaymentError(
              "Payment received but verification failed. Our team has been notified. Please do not make another payment.",
            );
            setStatus("checkout");
            isProcessingRef.current = false;
          }
        },
        theme: {
          color: "#4fdbc8",
        },
        modal: {
          ondismiss: function () {
            if (!authorizedRef.current) {
              setStatus("checkout");
              isProcessingRef.current = false;
              if (pollRef.current) {
                clearInterval(pollRef.current);
              }
            }
          },
        },
      };

      if (Object.keys(prefill).length > 0) {
        options.prefill = prefill;
      }

      const loaded = await loadRazorpay();
      if (!loaded) {
        setPaymentError("Failed to load payment gateway. Please try again.");
        setStatus("checkout");
        isProcessingRef.current = false;
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (failResponse) {
        console.error("Razorpay Payment Failed:", failResponse);
        setPaymentError(
          `Payment failed: ${failResponse.error?.description || "Unknown error"}`,
        );
        setStatus("checkout");
        isProcessingRef.current = false;
      });
      razorpayRef.current = rzp;
      rzp.open();
    } catch (error) {
      setRetryCount((prev) => prev + 1);
      setStatus("checkout");
      const errorMessage =
        typeof error.response?.data?.error === "string"
          ? error.response.data.error
          : error.response?.data?.error?.message ||
            error.message ||
            "Initialization failed";
      setPaymentError(errorMessage);
      isProcessingRef.current = false;
    }
  }, [user, amount, retryCount, status]);

  if (status === "success") {
    return (
      <div className="dark bg-[var(--bg-dark)] min-h-screen flex items-center justify-center p-6 font-['Manrope']">
        <div className="bg-[var(--surface)] border border-[var(--surface)] rounded-2xl p-12 max-w-md w-full text-center shadow-2xl animate-in">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <span
              className="material-symbols-outlined text-primary text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h2 className="text-3xl font-bold text-on-surface mb-4">
            Licensing Authorized
          </h2>
          <p className="text-on-surface-variant mb-10">
            Your facility has been upgraded successfully.
          </p>
          <button
            onClick={onPaymentComplete}
            className="w-full bg-primary text-[var(--bg-dark)] py-4 rounded-xl font-extrabold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-3"
          >
            <span>Enter Dashboard</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dark bg-[var(--bg-dark)] h-screen text-on-surface font-['Manrope'] antialiased overflow-y-auto">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-[var(--bg-dark)]/90 backdrop-blur-md border-b border-[var(--surface)] shadow-xl">
        <div className="flex items-center gap-3">
          <img
            src="/viyan_logo.webp"
            alt="Viyan MedAssist"
            className="h-10 w-auto"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
            System Live
          </span>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-5/12 lg:w-4/12">
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--surface)] p-6 sticky top-24 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 text-on-surface">
                Order Summary
              </h3>
              <div className="flex items-center justify-between py-4 border-b border-[var(--surface)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">
                      medical_services
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Subscription</p>
                    <p className="text-xs text-on-surface-variant">
                      Annual Subscription
                    </p>
                  </div>
                </div>
                <p className="font-bold text-primary">₹{amount}</p>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>₹{amount}.00</span>
                </div>
                <div className="pt-4 border-t border-[var(--surface)] flex justify-between items-center">
                  <span className="text-lg font-bold text-on-surface">
                    Total
                  </span>
                  <span className="text-3xl font-extrabold text-primary">
                    ₹{amount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-7/12 lg:w-8/12">
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--surface)] p-8 shadow-2xl">
              <h2 className="text-3xl font-bold mb-8 text-on-surface">
                Complete Payment
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <button
                  onClick={() => setMethod("card")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === "card" ? "border-primary bg-primary/10 text-primary" : "border-[var(--surface)] bg-[var(--bg-dark)] text-on-surface-variant"}`}
                >
                  <span className="material-symbols-outlined text-3xl mb-1">
                    credit_card
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Card
                  </span>
                </button>
                <button
                  onClick={() => setMethod("upi")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === "upi" ? "border-primary bg-primary/10 text-primary" : "border-[var(--surface)] bg-[var(--bg-dark)] text-on-surface-variant"}`}
                >
                  <span className="material-symbols-outlined text-3xl mb-1">
                    account_balance
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    UPI
                  </span>
                </button>
                <button
                  onClick={() => setMethod("qr")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === "qr" ? "border-primary bg-primary/10 text-primary" : "border-[var(--surface)] bg-[var(--bg-dark)] text-on-surface-variant"}`}
                >
                  <span className="material-symbols-outlined text-3xl mb-1">
                    qr_code_2
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    QR Code
                  </span>
                </button>
              </div>

              <div className="p-6 bg-[var(--surface)] rounded-xl border border-primary/20 text-center">
                <p className="text-on-surface-variant text-sm mb-6 italic">
                  Razorpay secure checkout will launch to handle your{" "}
                  {method.toUpperCase()} payment safely.
                </p>
                {paymentError && (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid #EF4444",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginBottom: "12px",
                      color: "#EF4444",
                      fontSize: "13px",
                    }}
                  >
                    {paymentError}
                  </div>
                )}
                <button
                  onClick={handlePay}
                  disabled={status === "processing"}
                  className="w-full bg-primary hover:brightness-110 text-[var(--bg-dark)] font-extrabold py-5 rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {status === "processing"
                    ? "Initializing..."
                    : `Pay ₹${amount} Now`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
