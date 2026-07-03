import { useNavigate } from "react-router-dom";
import { Check, ArrowLeft, Zap, Star, Crown, Building2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const PLANS = [
  {
    id: "free-trial",
    name: "Free Trial",
    price: 0,
    duration: "28 Days Free",
    description: "Full access to all features. No payment required.",
    icon: Zap,
    highlight: false,
    badge: "EVALUATION",
    features: [
      "Full Platform Access",
      "Inventory Management",
      "Billing & POS",
      "Reports & Analytics",
      "Barcode & QR",
      "Email Support",
      "Up to 5 Users",
      "1 Branch",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 999,
    duration: "/month",
    description: "Perfect for small pharmacies getting started.",
    icon: Star,
    highlight: false,
    badge: null,
    features: [
      "Everything in Free Trial",
      "Up to 3 Users",
      "2 Branches",
      "10,000 Batch Records",
      "PDF Reports",
      "Priority Support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 2999,
    duration: "/month",
    description: "For growing pharmacies that need more power.",
    icon: Crown,
    highlight: true,
    badge: "POPULAR",
    features: [
      "Everything in Starter",
      "Up to 10 Users",
      "5 Branches",
      "50,000 Batch Records",
      "Excel & PDF Reports",
      "Premium Analytics",
      "Priority Support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 9999,
    duration: "/month",
    description: "Unlimited scale for pharmacy networks.",
    icon: Building2,
    highlight: false,
    badge: "UNLIMITED",
    features: [
      "Everything in Professional",
      "Unlimited Users",
      "Unlimited Branches",
      "Unlimited Batch Records",
      "Advanced Reports",
      "Premium Analytics",
      "Dedicated Support",
      "Custom Integrations",
    ],
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelectPlan = (planId) => {
    sessionStorage.setItem("selectedPlanId", planId);
    if (user) {
      // Logged-in user selecting a plan — go to checkout or plans
      navigate("/plans");
    } else {
      // New user — go to signup with plan
      navigate(`/signup?plan=${planId}`);
    }
  };

  return (
    <div className="dark bg-[var(--bg-dark)] min-h-screen text-on-surface font-['Manrope'] antialiased">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-[var(--bg-dark)]/90 backdrop-blur-md border-b border-[var(--surface)] shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
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
              className="lp-btn-ghost text-sm"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="lp-btn-ghost text-sm"
            >
              Log In
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-3 block">
            Choose Your Plan
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-3 tracking-tight">
            Select the Right Plan
            <br />
            <span className="text-primary">for Your Pharmacy</span>
          </h1>
          <p className="text-base text-on-surface-variant max-w-xl mx-auto opacity-80">
            Start with a free trial, then choose a plan that fits your business.
            Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative bg-[var(--surface-container)]/50 backdrop-blur-sm border rounded-2xl p-6 flex flex-col transition-all hover:shadow-2xl group ${
                  plan.highlight
                    ? "border-primary/60 hover:shadow-primary/10"
                    : "border-[var(--surface)] hover:border-primary/30 hover:shadow-primary/5"
                }`}
              >
                {plan.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase ${
                      plan.highlight
                        ? "bg-primary text-black"
                        : "bg-[var(--surface)] text-on-surface-variant"
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="mb-5">
                  <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--surface)] w-fit mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-on-surface">
                      {plan.price === 0 ? "Free" : `₹${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-on-surface-variant">
                        {plan.duration}
                      </span>
                    )}
                  </div>
                  {plan.price === 0 && (
                    <span className="text-xs text-on-surface-variant">
                      {plan.duration}
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-sm text-on-surface-variant">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? "bg-primary text-black hover:shadow-lg hover:shadow-primary/20"
                      : "bg-[var(--surface)] text-on-surface hover:bg-primary/10 border border-[var(--surface)] hover:border-primary/30"
                  }`}
                >
                  {plan.price === 0 ? "Start Free Trial" : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-10">
          <p className="text-sm text-on-surface-variant opacity-70">
            All plans include a 28-day free trial. No credit card required to start.
            Cancel anytime.
          </p>
        </div>
      </main>
    </div>
  );
}
