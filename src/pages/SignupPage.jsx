import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Lock,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Zap,
  Star,
  Crown,
  Building2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const PLAN_META = {
  "free-trial": {
    name: "Free Trial",
    price: 0,
    duration: "28 Days Free",
    icon: Zap,
    color: "#6c63ff",
  },
  starter: {
    name: "Starter",
    price: 999,
    duration: "/month",
    icon: Star,
    color: "#3ecfcf",
  },
  professional: {
    name: "Professional",
    price: 2999,
    duration: "/month",
    icon: Crown,
    color: "#f093fb",
  },
  enterprise: {
    name: "Enterprise",
    price: 9999,
    duration: "/month",
    icon: Building2,
    color: "#4facfe",
  },
};

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, user } = useAuth();

  const planId =
    searchParams.get("plan") ||
    sessionStorage.getItem("selectedPlanId") ||
    "free-trial";
  const plan = PLAN_META[planId] || PLAN_META["free-trial"];
  const PlanIcon = plan.icon;

  const [form, setForm] = useState({
    fullName: "",
    shopName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Persist selected plan
  useEffect(() => {
    sessionStorage.setItem("selectedPlanId", planId);
  }, [planId]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getFingerprint = () => {
    try {
      const { userAgent, language, hardwareConcurrency, deviceMemory } =
        navigator;
      const { width, height, colorDepth } = window.screen;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx.fillText("viyan-medassist-fingerprint", 2, 17);
      const canvasHash = canvas.toDataURL().slice(-50);
      return btoa(
        `${userAgent}-${language}-${hardwareConcurrency}-${deviceMemory}-${width}x${height}-${colorDepth}-${timezone}-${canvasHash}`,
      );
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = form.email.trim();
    const password = form.password.trim();

    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!form.shopName.trim()) {
      setError("Pharmacy name is required.");
      return;
    }
    if (!email || !validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least 1 uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least 1 lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least 1 number.");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain at least 1 special character.");
      return;
    }
    if (password !== form.confirmPassword.trim()) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        email: email.toLowerCase(),
        password,
        fullName: form.fullName.trim(),
        shopName: form.shopName.trim(),
        confirmPassword: form.confirmPassword.trim(),
        role: "owner",
        fingerprint: getFingerprint(),
        selectedPlanId: planId,
      });

      // Route based on subscription status
      if (result?.subscriptionStatus === "PENDING") {
        // Paid plan — needs checkout
        navigate("/checkout");
      } else {
        // Free trial or free plan — go to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      const errData = err.response?.data;
      const message =
        typeof errData?.error?.message === "string"
          ? errData.error.message
          : typeof errData?.message === "string"
            ? errData.message
            : typeof errData?.error === "string"
              ? errData.error
              : typeof err.message === "string"
                ? err.message
                : "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  return (
    <div className="dark bg-[var(--bg-dark)] min-h-screen text-on-surface font-['Manrope'] antialiased flex flex-col lg:flex-row">
      {/* Left Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 auth-branding-section relative overflow-hidden">
        <div className="auth-branding-overlay">
          <div className="branding-glow-1"></div>
          <div className="branding-glow-2"></div>
        </div>
        <div className="branding-content relative z-10 flex flex-col justify-center px-12">
          <div className="branding-logo-wrap mb-8">
            <img
              src="/viyan_logo.webp"
              alt="Viyan Medassist"
              className="auth-brand-logo"
            />
          </div>
          <h1 className="text-4xl font-extrabold text-on-surface mb-4">
            <span className="text-primary">Create Your Account</span>
          </h1>
          <p className="text-on-surface-variant leading-relaxed mb-8">
            Join hundreds of pharmacies already using MedAssist to manage
            inventory, billing, and business analytics.
          </p>
          <div className="metrics-grid">
            <div className="metric-card">
              <Shield size={20} className="metric-icon" />
              <div className="metric-label">SECURITY</div>
              <div className="metric-value">Enterprise Grade</div>
            </div>
            <div className="metric-card">
              <Lock size={20} className="metric-icon" />
              <div className="metric-label">COMPLIANCE</div>
              <div className="metric-value">GST Ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate("/pricing")}
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

        <div className="max-w-md w-full mx-auto">
          {/* Selected Plan Banner */}
          <div className="mb-6 p-4 rounded-xl border border-[var(--surface)] bg-[var(--surface-container)]/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${plan.color}20` }}
                >
                  <PlanIcon className="w-5 h-5" style={{ color: plan.color }} />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider">
                    Selected Plan
                  </p>
                  <p className="text-sm font-bold text-on-surface">
                    {plan.name}
                    {plan.price > 0 && (
                      <span className="text-on-surface-variant font-normal">
                        {" "}
                        — ₹{plan.price}
                        {plan.duration}
                      </span>
                    )}
                    {plan.price === 0 && (
                      <span className="text-on-surface-variant font-normal">
                        {" "}
                        — {plan.duration}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/pricing")}
                className="text-xs text-primary hover:underline font-medium"
              >
                Change Plan
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-on-surface mb-1">
              Create your account
            </h2>
            <p className="text-sm text-on-surface-variant">
              Start your {plan.name} today. Set up your pharmacy in minutes.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--surface)] text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Dr. Julian Sterling"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Pharmacy / Shop Name
              </label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--surface)] text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="e.g. Apex Medical Solutions"
                value={form.shopName}
                onChange={(e) => updateField("shopName", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <input
                required
                type="email"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--surface)] text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="dr.house@viyan.med"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--surface)] border border-[var(--surface)] text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                required
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--surface)] text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-[var(--surface)] bg-[var(--surface)] text-primary focus:ring-primary/30"
              />
              <label
                htmlFor="terms"
                className="text-xs text-on-surface-variant leading-relaxed"
              >
                I agree to the{" "}
                <Link
                  to="/terms-of-service"
                  className="text-primary hover:underline"
                  target="_blank"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  className="text-primary hover:underline"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary text-black font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-on-surface-variant mt-6">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:underline font-medium"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
