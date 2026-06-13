import { useState, useEffect } from "react";
import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

export default function PaymentRecoveryModal({ onRecovered, onClose }) {
  const [status, setStatus] = useState("checking");
  const [paymentState, setPaymentState] = useState(null);
  const [error, setError] = useState(null);

  const checkPendingPayment = async () => {
    setStatus("checking");
    const pendingOrderId = sessionStorage.getItem("pending_payment_order");
    if (!pendingOrderId) {
      setStatus("none");
      return;
    }

    try {
      const res = await api.get(API_ROUTES.PAYMENTS_STATUS, {
        params: { orderId: pendingOrderId },
      });

      if (res.data?.success && res.data?.data) {
        const state = res.data.data;
        setPaymentState(state);

        if (state.status === "SUCCESS" || state.status === "CAPTURED") {
          setStatus("completed");
          sessionStorage.removeItem("pending_payment_order");
          return;
        }

        if (
          state.status === "FAILED" ||
          state.status === "EXPIRED" ||
          state.status === "CANCELLED"
        ) {
          setStatus("failed");
          sessionStorage.removeItem("pending_payment_order");
          return;
        }

        setStatus("pending");
      } else {
        setStatus("none");
        sessionStorage.removeItem("pending_payment_order");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setStatus("none");
        sessionStorage.removeItem("pending_payment_order");
      } else {
        setStatus("error");
        setError(err.response?.data?.error || err.message);
      }
    }
  };

  useEffect(() => {
    const runCheck = async () => {
      await checkPendingPayment();
    };
    runCheck();
  }, []);

  const handleRecover = async () => {
    if (!paymentState?.orderId) return;

    setStatus("recovering");
    try {
      const res = await api.post(
        `${API_ROUTES.PAYMENTS_RECOVER}/${paymentState.orderId}`,
      );
      if (res.data?.success) {
        setStatus("recovered");
        sessionStorage.removeItem("pending_payment_order");
        setTimeout(() => {
          if (onRecovered) onRecovered(res.data.data);
        }, 1500);
      }
    } catch (err) {
      setStatus("failed");
      setError(err.response?.data?.error || "Recovery failed");
    }
  };

  const handleDismiss = () => {
    sessionStorage.removeItem("pending_payment_order");
    setStatus("none");
    if (onClose) onClose();
  };

  if (status === "none") return null;

  return (
    <div className="sys-modal-overlay">
      <div className="sys-modal" style={{ maxWidth: 420 }}>
        {status === "checking" && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <div className="pay-spinner" />
            <p style={{ marginTop: 16, color: "var(--sys-text-muted)" }}>
              Checking for pending payments...
            </p>
          </div>
        )}

        {status === "completed" && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <div className="pay-success-anim">
              <svg className="pay-checkmark" viewBox="0 0 52 52">
                <circle
                  className="pay-checkmark-circle"
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                />
                <path
                  className="pay-checkmark-check"
                  fill="none"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
            <h3 style={{ marginTop: 16 }}>Payment Completed!</h3>
            <p
              style={{
                color: "var(--sys-text-muted)",
                fontSize: 13,
                marginTop: 8,
              }}
            >
              Your previous payment was successful.
            </p>
            <button
              className="sys-btn-fill"
              style={{ marginTop: 24, width: "100%" }}
              onClick={() => {
                if (onRecovered) onRecovered(paymentState);
              }}
            >
              Continue
            </button>
          </div>
        )}

        {status === "pending" && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, color: "var(--sys-teal)" }}
            >
              pending_actions
            </span>
            <h3 style={{ marginTop: 16 }}>Pending Payment Found</h3>
            <p
              style={{
                color: "var(--sys-text-muted)",
                fontSize: 13,
                marginTop: 8,
              }}
            >
              You have an incomplete payment of ₹{paymentState?.amount}. Would
              you like to recover it?
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                className="sys-btn-fill"
                style={{ flex: 1 }}
                onClick={handleRecover}
              >
                Recover Payment
              </button>
              <button
                className="sys-btn-outline"
                style={{ flex: 1 }}
                onClick={handleDismiss}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {status === "recovering" && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <div className="pay-spinner" />
            <p style={{ marginTop: 16, color: "var(--sys-text-muted)" }}>
              Recovering payment session...
            </p>
          </div>
        )}

        {status === "recovered" && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, color: "#10B981" }}
            >
              check_circle
            </span>
            <h3 style={{ marginTop: 16 }}>Payment Recovered!</h3>
            <p
              style={{
                color: "var(--sys-text-muted)",
                fontSize: 13,
                marginTop: 8,
              }}
            >
              Your payment session has been restored.
            </p>
          </div>
        )}

        {status === "failed" && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, color: "#EF4444" }}
            >
              error
            </span>
            <h3 style={{ marginTop: 16 }}>Payment Failed</h3>
            <p
              style={{
                color: "var(--sys-text-muted)",
                fontSize: 13,
                marginTop: 8,
              }}
            >
              {typeof error === "string" ? error : error?.message || String(error) || "Your previous payment did not go through."}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                className="sys-btn-fill"
                style={{ flex: 1 }}
                onClick={handleDismiss}
              >
                Try Again
              </button>
              <button
                className="sys-btn-outline"
                style={{ flex: 1 }}
                onClick={() => {
                  sessionStorage.removeItem("pending_payment_order");
                  if (onClose) onClose();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, color: "#F59E0B" }}
            >
              warning
            </span>
            <h3 style={{ marginTop: 16 }}>Unable to Check</h3>
            <p
              style={{
                color: "var(--sys-text-muted)",
                fontSize: 13,
                marginTop: 8,
              }}
            >
              {typeof error === "string" ? error : error?.message || String(error) || "Could not verify payment status. You can proceed."}
            </p>
            <button
              className="sys-btn-outline"
              style={{ marginTop: 24, width: "100%" }}
              onClick={() => {
                sessionStorage.removeItem("pending_payment_order");
                if (onClose) onClose();
              }}
            >
              Continue Anyway
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
