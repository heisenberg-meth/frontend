import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";
import { useAuth } from "../hooks/useAuth";
import { ShieldCheck, Loader2, Sparkles } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { loadRazorpay } from "../utils/razorpay";
import { safeNumber } from "../utils/number.js";

function Spinner({ size = 14 }) {
  return (
    <Loader2 size={size} style={{ animation: "spin 0.8s linear infinite" }} />
  );
}

const PLANS = [
  {
    id: "free-trial",
    name: "Free Trial",
    price: { monthly: 0, annual: 0 },
    features: ["28-day free trial", "Full feature access", "Up to 5 users"],
    missing: ["AI Analytics", "Multi-branch support"],
    color: "var(--info)",
  },
  {
    id: "basic-monthly",
    name: "MedAssist Basic",
    price: { monthly: 1, annual: 1 },
    features: ["Unlimited Medicines", "Basic Analytics", "Up to 3 users"],
    missing: ["Advanced Reports", "AI Features"],
    color: "var(--info)",
  },
  {
    id: "pro-monthly",
    name: "MedAssist Pro",
    price: { monthly: 999, annual: 9990 },
    features: [
      "Unlimited Medicines",
      "Advanced Analytics",
      "Priority Support",
      "Up to 10 users",
    ],
    missing: [],
    color: "var(--primary)",
    popular: true,
  },
];

export default function SubscriptionCRUD({ showToast, user }) {
  const { refreshUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [upgrading, setUpgrading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const pollRef = useRef(null);
  const authorizedRef = useRef(false);

  const refreshSubscriptionData = useCallback(async () => {
    try {
      const [subRes, payRes] = await Promise.all([
        api.get(API_ROUTES.SUBSCRIPTIONS_STATUS),
        api.get(API_ROUTES.PAYMENTS_HISTORY),
      ]);

      setSubscription(subRes.data?.data || subRes.data);

      setPaymentHistory(payRes.data?.data || payRes.data || []);
    } catch {
      showToast("Could not verify subscription status", "error");
    }
  }, [showToast]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);

        const [subRes, payRes] = await Promise.all([
          api.get(API_ROUTES.SUBSCRIPTIONS_STATUS),
          api.get(API_ROUTES.PAYMENTS_HISTORY),
        ]);

        if (!mounted) return;

        setSubscription(subRes.data?.data || subRes.data);

        setPaymentHistory(payRes.data?.data || payRes.data || []);
      } catch {
        if (mounted) {
          showToast("Could not verify subscription status", "error");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [showToast]);

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    setUpgrading(true);
    authorizedRef.current = false;
    try {
      const amount =
        billingCycle === "annual"
          ? selectedPlan.price.annual * 12
          : selectedPlan.price.monthly;

      const response = await api.post(API_ROUTES.PAYMENTS_CREATE_ORDER, {
        amount: safeNumber(amount),
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        billingCycle,
      });

      const { key, order } = response.data;

      const rzpKey = key || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!rzpKey) {
        throw new Error("Missing Razorpay Configuration");
      }

      if (!order.id) {
        throw new Error("Invalid order received from backend (missing ID)");
      }

      if (!order.amount || !order.currency) {
        throw new Error("Invalid order amount or currency");
      }

      const prefill = {};
      const name = user?.fullName || user?.username;
      if (name) prefill.name = name;
      if (user?.email) prefill.email = user.email;
      if (user?.phone) prefill.contact = user.phone;

      const options = {
        key: rzpKey,
        amount: order.amount,
        currency: order.currency,
        name: "Viyan MedAssist",
        description: `Professional Subscription: ${selectedPlan.name}`,
        order_id: order.id,
        handler: async function (rzpResponse) {
          try {
            authorizedRef.current = true;
            await api.post(API_ROUTES.PAYMENTS_VERIFY, rzpResponse);
            showToast("Payment processing... please wait", "info");

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
                  showToast(
                    "Payment verified. Subscription activated!",
                    "success",
                  );
                  await refreshUser();
                  await refreshSubscriptionData();
                  setUpgrading(false);
                } else if (
                  res.data?.paymentStatus === "FAILED" ||
                  attempts > 15
                ) {
                  clearInterval(pollRef.current);
                  showToast(
                    "Payment verification timed out. If money was deducted, it will be refunded or manually activated.",
                    "error",
                  );
                  setUpgrading(false);
                }
              } catch (e) {
                if (attempts > 15) {
                  clearInterval(pollRef.current);
                  showToast("Payment verification timed out.", "error");
                  setUpgrading(false);
                }
                console.log(e);
              }
            }, 2000);
          } catch (err) {
            console.error("Payment Verification Error", err);
            showToast(
              "Payment received but verification failed. Our team has been notified. Please do not make another payment.",
              "error",
            );
            setUpgrading(false);
          }
        },
        theme: {
          color: "#4fdbc8",
        },
        modal: {
          ondismiss: function () {
            if (!authorizedRef.current) {
              setUpgrading(false);
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
        showToast(
          "Unable to connect to Razorpay. Please check your internet connection and try again.",
          "error",
        );
        setUpgrading(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (failResponse) {
        console.error("Razorpay Payment Failed:", failResponse);
        showToast(
          `Payment failed: ${failResponse.error?.description || "Unknown error"}`,
          "error",
        );
      });
      rzp.open();

      setShowConfirmModal(false);
      setSelectedPlan(null);
    } catch (err) {
      console.error("Payment Initialization Error:", err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Unable to initialize payment. Please contact support if the problem persists.";
      showToast(msg, "error");
      setUpgrading(false);
    }
  };

  const initiateUpgrade = (plan) => {
    if (plan.id === subscription?.planId) return;
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const isPending = !subscription || subscription?.status === "PENDING";
  const isTrial =
    subscription?.isTrial === true || subscription?.status === "TRIAL";
  const isExpired =
    subscription?.isExpired === true || subscription?.status === "EXPIRED";

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center" }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="sub-container">
      <div className="sub-header">
        <div className="sub-title-group">
          <h2>Subscription Management</h2>
          <p>Manage your MedAssist plan and payment history.</p>
        </div>
      </div>

      <div className="sub-current-card">
        <div className="sub-current-header">
          <div
            className="sub-current-icon"
            style={{
              background: "var(--primary-container)",
              color: "var(--primary)",
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div className="sub-current-info">
            {subscription?.status === "ACTIVE" ? (
              <>
                <div
                  className="ent-label"
                  style={{ fontSize: "1.2rem", fontWeight: "bold" }}
                >
                  {subscription.planName}
                </div>
                <div
                  className="ent-price"
                  style={{ color: "var(--text-muted)", marginTop: "4px" }}
                >
                  ₹{subscription.price}/mo
                </div>
                <span
                  className="sub-status-badge active"
                  style={{ marginTop: "8px", display: "inline-block" }}
                >
                  ACTIVE
                </span>
              </>
            ) : isTrial ? (
              <>
                <div
                  className="ent-label"
                  style={{ fontSize: "1.2rem", fontWeight: "bold" }}
                >
                  Free Trial
                </div>
                <div
                  className="ent-price"
                  style={{ color: "var(--text-muted)", marginTop: "4px" }}
                >
                  {subscription.daysRemaining} days remaining
                </div>
                <span
                  className="sub-status-badge trial"
                  style={{ marginTop: "8px", display: "inline-block" }}
                >
                  TRIAL
                </span>
              </>
            ) : isExpired ? (
              <>
                <div
                  className="ent-label"
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    color: "#ef4444",
                  }}
                >
                  Subscription Expired
                </div>
                <div
                  className="ent-price"
                  style={{ color: "var(--text-muted)", marginTop: "4px" }}
                >
                  Upgrade to continue using MedAssist
                </div>
                <span
                  className="sub-status-badge expired"
                  style={{
                    marginTop: "8px",
                    display: "inline-block",
                    background: "#ef4444",
                    color: "#fff",
                  }}
                >
                  EXPIRED
                </span>
              </>
            ) : (
              <>
                <div
                  className="ent-label"
                  style={{ fontSize: "1.2rem", fontWeight: "bold" }}
                >
                  No Plan
                </div>
                <span
                  className="sub-status-badge pending"
                  style={{ marginTop: "8px", display: "inline-block" }}
                >
                  {subscription?.status || "PENDING"}
                </span>
              </>
            )}
          </div>
          {(isTrial || isPending || isExpired) && (
            <button
              className="sub-upgrade-btn"
              onClick={() =>
                initiateUpgrade(
                  PLANS.find((p) => p.id === "basic-monthly") || PLANS[1],
                )
              }
            >
              <Sparkles size={16} /> Upgrade
            </button>
          )}
        </div>
      </div>

      <div className="sub-plans-section">
        <h3>Available Plans</h3>
        <div className="sub-billing-toggle">
          <button
            className={billingCycle === "monthly" ? "active" : ""}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </button>
          <button
            className={billingCycle === "annual" ? "active" : ""}
            onClick={() => setBillingCycle("annual")}
          >
            Annual
          </button>
        </div>
        <div className="sub-plans-grid">
          {PLANS.filter((p) => p.id !== "free-trial").map((plan) => (
            <div
              key={plan.id}
              className={`sub-plan-card ${plan.id === subscription?.planId ? "current" : ""}`}
              style={{ "--plan-color": plan.color }}
            >
              <div className="sub-plan-name">{plan.name}</div>
              <div className="sub-plan-price">
                ₹
                {billingCycle === "monthly"
                  ? plan.price.monthly
                  : plan.price.annual}
                /mo
              </div>
              <button
                className="sub-plan-btn"
                onClick={() => initiateUpgrade(plan)}
                disabled={plan.id === subscription?.planId}
              >
                {plan.id === subscription?.planId ? "Current Plan" : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sub-payment-section">
        <h3>History</h3>
        <table className="sub-payment-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>DATE</th>
              <th>PLAN</th>
              <th>AMOUNT</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.map((pay) => (
              <tr key={pay.id}>
                <td>{pay.id}</td>
                <td>
                  {new Date(pay.date || pay.createdAt).toLocaleDateString()}
                </td>
                <td>{pay.plan}</td>
                <td>₹{pay.amount}</td>
                <td>
                  <span className={`sub-payment-status ${pay.status}`}>
                    {pay.status?.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleUpgrade}
        title={`Upgrade to ${selectedPlan?.name}`}
        loading={upgrading}
      />
    </div>
  );
}
