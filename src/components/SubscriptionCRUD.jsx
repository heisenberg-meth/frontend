import { useState, useEffect } from "react";
import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";
import { useAuth } from "../hooks/useAuth";
import { ShieldCheck, Loader2, Sparkles } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import "../styles/SubscriptionCRUD.css";
import { loadRazorpay } from "../utils/razorpay";

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
    price: { monthly: 299, annual: 2990 },
    features: ["Unlimited Medicines", "Basic Analytics", "Up to 3 users"],
    missing: ["Advanced Reports", "AI Features"],
    color: "var(--info)",
  },
  {
    id: "pro-monthly",
    name: "MedAssist Pro",
    price: { monthly: 499, annual: 4990 },
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

  const refreshSubscriptionData = async () => {
    try {
      const [subRes, payRes] = await Promise.all([
        api.get(API_ROUTES.SUBSCRIPTIONS_STATUS),
        api.get(API_ROUTES.PAYMENTS_HISTORY),
      ]);

      setSubscription(subRes.data?.data || subRes.data);

      setPaymentHistory(payRes.data?.data || payRes.data || []);
    } catch (err) {
      console.error("Failed to load canonical subscription:", err);

      showToast("Could not verify subscription status", "error");
    }
  };

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
      } catch (err) {
        console.error(err);

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
    };
  }, [showToast]);

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    setUpgrading(true);
    try {
      const amount =
        billingCycle === "annual"
          ? selectedPlan.price.annual * 12
          : selectedPlan.price.monthly;

      const response = await api.post(API_ROUTES.PAYMENTS_CREATE_ORDER, {
        amount: Number(amount),
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        billingCycle,
      });

      console.log("RAW RESPONSE =", response.data);
      const { key, order } = response.data;

      if (!order || !order.id) {
        throw new Error("Invalid order received from backend");
      }

      const options = {
        key: key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Viyan MedAssist",
        description: `Professional Subscription: ${selectedPlan.name}`,
        order_id: order.id,
        handler: async function (rzpResponse) {
          console.log("PAYMENT SUCCESS =", rzpResponse);
          try {
            await api.post(API_ROUTES.PAYMENTS_VERIFY, rzpResponse);
            showToast("Payment verified. Subscription activated!", "success");
            await refreshUser();
            await refreshSubscriptionData();
          } catch (verErr) {
            console.error("Verification failed:", verErr);
            showToast(
              "Payment verification failed. Please contact support.",
              "error",
            );
          }
        },
        prefill: {
          name: user?.fullName || user?.username || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#4fdbc8",
        },
      };

      console.log("FULL RAZORPAY OPTIONS", JSON.stringify(options, null, 2));

      const cleanOptions = Object.fromEntries(
        Object.entries(options).filter(([v]) => v !== undefined),
      );

      const loaded = await loadRazorpay();
      if (!loaded) {
        showToast("Failed to load payment gateway. Please try again.", "error");
        setUpgrading(false);
        return;
      }

      const rzp = new window.Razorpay(cleanOptions);
      rzp.on("payment.failed", function (response) {
        console.error("PAYMENT FAILED =", response.error);
        showToast(`Payment failed: ${response.error.description}`, "error");
      });
      rzp.open();

      setShowConfirmModal(false);
      setSelectedPlan(null);
    } catch (err) {
      console.error(err);
      showToast("Payment failed", "error");
    } finally {
      setUpgrading(false);
    }
  };

  const initiateUpgrade = (plan) => {
    if (plan.id === subscription?.planId) return;
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const isPending = !subscription || subscription?.status === "PENDING";
  const isTrial = subscription?.isTrial === true;
  const isExpired = subscription?.isExpired === true;
  const expiryDate = subscription?.expiresAt;
  const daysLeft = subscription ? subscription.daysRemaining : null;

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
            <h3>{subscription?.planName || "No Plan"}</h3>
            <span
              className={`sub-status-badge ${(subscription?.status || "pending").toLowerCase()}`}
            >
              {subscription?.status || "PENDING"}
            </span>
          </div>
          {(isTrial || isPending) && !isExpired && (
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
        <div className="sub-current-details">
          <div className="sub-detail-item">
            <label>Amount</label>
            <span>{isTrial ? "Free" : `₹${subscription?.price || 0}/mo`}</span>
          </div>
          <div className="sub-detail-item">
            <label>Expires</label>
            <span>
              {expiryDate ? new Date(expiryDate).toLocaleDateString() : "—"}
            </span>
          </div>
          <div className="sub-detail-item">
            <label>Remaining</label>
            <span
              style={{
                color: daysLeft <= 7 ? "var(--danger)" : "var(--success)",
              }}
            >
              {daysLeft !== null ? `${daysLeft} days` : "—"}
            </span>
          </div>
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
