import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowLeft, Zap, Star } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import api from "../api";
import { API_ROUTES } from "../constants/api.routes";

const DEFAULT_PLANS_META = {
  free: {
    description: "Full access to all features. No payment required.",
    icon: Zap,
    highlight: false,
    badge: "EVALUATION",
    duration: "28 Days Free",
    features: [
      "28 Days Free Access",
      "Full Platform Access",
      "Inventory & Batch Tracking",
      "Billing & POS System",
      "Reports & Analytics",
      "Email Support",
      "1 Branch",
    ],
  },
  "free-trial": {
    description: "Full access to all features. No payment required.",
    icon: Zap,
    highlight: false,
    badge: "EVALUATION",
    duration: "28 Days Free",
    features: [
      "28 Days Free Access",
      "Full Platform Access",
      "Inventory & Batch Tracking",
      "Billing & POS System",
      "Reports & Analytics",
      "Email Support",
      "1 Branch",
    ],
  },
  paid: {
    description: "Full pharmacy operations & advanced reporting suite.",
    icon: Star,
    highlight: true,
    badge: "RECOMMENDED",
    duration: "/month",
    features: [
      "Everything in Free Tier",
      "Unlimited Batches & Records",
      "Advanced PDF & CSV Reports",
      "Multi-Branch Readiness",
      "24/7 Priority Support",
      "Inventory Management",
      "Billing & POS",
      "Reports & Analytics",
      "10,000 Batch Records",
      "PDF Reports",
      "Priority Support",
      "Ongoing access",
    ],
  },
  starter: {
    description: "Perfect for small pharmacies getting started.",
    icon: Star,
    highlight: true,
    badge: "POPULAR",
    duration: "/month",
    features: [
      "Everything in Free Tier",
      "Unlimited Batches & Records",
      "Advanced PDF & CSV Reports",
      "Multi-Branch Readiness",
      "24/7 Priority Support",
      "Inventory Management",
      "Billing & POS",
      "Reports & Analytics",
      "10,000 Batch Records",
      "PDF Reports",
      "Priority Support",
      "Ongoing access",
    ],
  },
};

export default function PricingPage() {
  const navigate = useNavigate();
  const { user, refreshUser, showToast } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPlans() {
      try {
        const res = await api.get(API_ROUTES.AUTH_PLANS);
        const fetchedData = res.data?.data || res.data || [];
        if (Array.isArray(fetchedData) && fetchedData.length > 0) {
          const enriched = fetchedData.map((p) => {
            const meta =
              DEFAULT_PLANS_META[p.id] ||
              (p.price === 0
                ? DEFAULT_PLANS_META.free
                : DEFAULT_PLANS_META.paid);
            return {
              ...p,
              duration: meta.duration,
              description: meta.description,
              icon: meta.icon,
              highlight: meta.highlight,
              badge: meta.badge,
              features: meta.features,
            };
          });
          if (isMounted) setPlans(enriched);
        } else {
          fallbackPlans();
        }
      } catch (err) {
        console.error("Failed to load plans from API", err);
        fallbackPlans();
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    function fallbackPlans() {
      if (!isMounted) return;
      setPlans([
        {
          id: "free",
          name: "Free Tier",
          price: 0,
          currency: "INR",
          duration: "28 Days Free",
          description: DEFAULT_PLANS_META.free.description,
          icon: DEFAULT_PLANS_META.free.icon,
          highlight: false,
          badge: DEFAULT_PLANS_META.free.badge,
          features: DEFAULT_PLANS_META.free.features,
        },
        {
          id: "paid",
          name: "Paid Plan",
          price: 599,
          currency: "INR",
          duration: "/month",
          description: DEFAULT_PLANS_META.paid.description,
          icon: DEFAULT_PLANS_META.paid.icon,
          highlight: true,
          badge: DEFAULT_PLANS_META.paid.badge,
          features: DEFAULT_PLANS_META.paid.features,
        },
      ]);
    }

    loadPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectPlan = async (plan) => {
    const planId = plan.id;
    const isFree =
      plan.price === 0 || planId === "free" || planId === "free-trial";
    sessionStorage.setItem("selectedPlanId", planId);

    if (user) {
      if (isFree) {
        try {
          await api.post(API_ROUTES.SUBSCRIPTIONS_TRIAL);
          if (refreshUser) await refreshUser();
          if (showToast)
            showToast("Free plan activated successfully", "success");
          navigate("/dashboard", { replace: true });
        } catch (err) {
          // Trial may already be active - refresh user and proceed to dashboard
          console.error("Free plan activation error:", err);
          if (refreshUser) await refreshUser();
          navigate("/dashboard", { replace: true });
        }
      } else {
        navigate("/payment");
      }
    } else {
      navigate(`/signup?plan=${planId}`);
    }
  };

  return (
    <div className="dark:bg-[#0c1321] bg-slate-50 min-h-screen overflow-y-auto text-slate-800 dark:text-slate-100 font-sans antialiased scroll-smooth pb-12">
      {/* Background blobs for premium dark/light glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-20%] w-150 h-150 rounded-full bg-emerald-500/10 blur-[120px] dark:bg-emerald-500/5" />
        <div className="absolute top-[20%] right-[-10%] w-125 h-125 rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-500/5" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/85 dark:bg-[#0c1321]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/55 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            aria-label="Action"
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src="/viyan_logo.webp"
            alt="Viyan MedAssist"
            className="h-10 w-auto"
          />
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer font-semibold bg-white dark:bg-[#151b2a]"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-sm px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer font-semibold bg-white dark:bg-[#151b2a]"
            >
              Log In
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-32 pb-24 px-6 max-w-6xl mx-auto flex flex-col justify-center min-h-screen z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-4 block">
            Choose Your Plan
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
            Select the Right Plan
            <br />
            <span className="text-emerald-600 dark:text-emerald-400">
              for Your Pharmacy
            </span>
          </h1>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Start with a 28-day free trial, then choose a plan that fits your
            business. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Plan Cards Grid */}
        {loading ? (
          <div className="flex justify-center items-center min-h-75">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full px-4 items-stretch">
            {plans.map((plan) => {
              const Icon = plan.icon || Zap;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between bg-white dark:bg-[#151b2a] border rounded-3xl p-8 md:p-10 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl group ${
                    plan.highlight
                      ? "border-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.08)] dark:shadow-[0_10px_30px_rgba(79,219,200,0.05)]"
                      : "border-slate-200 dark:border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                  }`}
                >
                  {plan.badge && (
                    <div
                      className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm ${
                        plan.highlight
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    {/* Icon & Title */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/40 transition-transform group-hover:scale-110">
                        <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                          {plan.price === 0
                            ? "Free Access"
                            : "Paid Subscription"}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                          {plan.price === 0 ? "Free" : `₹${plan.price}`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-base text-slate-400 dark:text-slate-500 font-semibold">
                            {plan.duration}
                          </span>
                        )}
                      </div>
                      {plan.price === 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1 block">
                          {plan.duration}
                        </span>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-10">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Included Features
                      </p>
                      {plan.features?.map((feature, i) => (
                        <div
                          key={`${plan.id}-feat-${i}`}
                          className="flex items-start gap-3"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300 leading-tight">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition duration-300 cursor-pointer shadow-md ${
                      plan.highlight
                        ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-[0_8px_24px_rgba(16,185,129,0.25)] hover:scale-[1.01]"
                        : "bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white border border-slate-200 dark:border-slate-700/60"
                    }`}
                  >
                    {plan.price === 0
                      ? "Start Free Trial"
                      : `Choose ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Note */}
        <div className="text-center mt-16">
          <p className="text-sm text-slate-400 dark:text-slate-500 opacity-90 max-w-md mx-auto leading-relaxed">
            All plans include a 28-day free trial. No credit card required to
            start. Cancel anytime.
          </p>
        </div>
      </main>
    </div>
  );
}
