import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
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
  free: {
    name: "Free Tier",
    price: 0,
    duration: "28 Days Free",
    icon: Zap,
    color: "#10b981",
  },
  "free-trial": {
    name: "Free Trial",
    price: 0,
    duration: "28 Days Free",
    icon: Zap,
    color: "#10b981",
  },
  paid: {
    name: "Paid Plan",
    price: 599,
    duration: "/month",
    icon: Star,
    color: "#3ecfcf",
  },
  starter: {
    name: "Starter Plan",
    price: 599,
    duration: "/month",
    icon: Star,
    color: "#3ecfcf",
  },
  professional: {
    name: "Professional",
    price: 1499,
    duration: "/month",
    icon: Crown,
    color: "#f093fb",
  },
  enterprise: {
    name: "Enterprise",
    price: 4999,
    duration: "/month",
    icon: Building2,
    color: "#4facfe",
  },
};
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
function SignupPageSection1({ navigate }) {
  return (
    <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden bg-linear-to-br from-[#0c1321] via-[#121c2f] to-[#08151f] text-white p-12 xl:p-16 flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer bg-transparent border-0 p-0"
          onClick={() => navigate("/")}
        >
          <img
            src="/viyan_logo.webp"
            alt="Viyan MedAssist"
            className="h-10 w-auto object-contain"
          />
        </button>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          HIPAA Compliant
        </span>
      </div>

      <div className="relative z-10 max-w-lg my-auto py-12">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-[0.25em] mb-3 block">
          Clinical Precision
        </span>
        <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight mb-4 text-white">
          Secure, Intelligent <br />
          <span className="text-emerald-400">Pharmacy Operations</span>
        </h1>
        <p className="text-slate-300 text-sm xl:text-base leading-relaxed mb-8 opacity-90">
          Join modern pharmacies utilizing military-grade encryption, GST
          automation, and AI-driven inventory analytics.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center mb-2.5">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Data Protection
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              99.9% Uptime SLA
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <span>© 2026 Viyan MedAssist. All rights reserved.</span>
        <div className="flex gap-4">
          <Link
            to="/privacy-policy"
            className="hover:text-white transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms-of-service"
            className="hover:text-white transition-colors"
          >
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}
function SignupPageSection2({
  navigate,
  updateField,
  setShowPassword,
  showPassword,
  setShowConfirmPassword,
  showConfirmPassword,
  setAgreedToTerms,
  plan,
  PlanIcon,
  error,
  handleSubmit,
  form,
  agreedToTerms,
  loading,
}) {
  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-20 max-w-2xl mx-auto w-full">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate("/pricing")}
          className="p-2 rounded-xl bg-white dark:bg-[#151b2a] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <img
          src="/viyan_logo.webp"
          alt="Viyan MedAssist"
          className="h-8 w-auto object-contain"
        />
      </div>

      <div>
        {/* Selected Plan Banner */}
        <div className="mb-8 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-500/25 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 shadow-xs border border-slate-200/60 dark:border-slate-700/60">
              <PlanIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-0.5">
                Selected Subscription
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {plan.name}
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  —{" "}
                  {plan.price === 0
                    ? plan.duration
                    : `₹${plan.price}${plan.duration}`}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer px-3 py-1.5 rounded-lg bg-white dark:bg-[#151b2a] border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-emerald-500 transition"
          >
            Change Plan
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Create your account
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Start your {plan.name} journey today. Set up your pharmacy in
            minutes with military-grade protection.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-medium flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Full Name
            </label>
            <input
              id="fullName"
              required
              type="text"
              className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-[#151b2a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs"
              placeholder="Dr. Julian Sterling"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="shopName"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Pharmacy / Shop Name
            </label>
            <input
              id="shopName"
              required
              type="text"
              className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-[#151b2a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs"
              placeholder="e.g. Apex Medical Solutions"
              value={form.shopName}
              onChange={(e) => updateField("shopName", e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Work Email
            </label>
            <input
              id="email"
              required
              type="email"
              className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-[#151b2a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs"
              placeholder="dr.house@viyan.med"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                required
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3.5 pr-12 rounded-xl bg-white dark:bg-[#151b2a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs"
                placeholder="Min. 8 chars (1 uppercase, 1 lowercase, 1 num, 1 symbol)"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Confirm Password
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                required
                type={showConfirmPassword ? "text" : "password"}
                className="w-full px-4 py-3.5 pr-12 rounded-xl bg-white dark:bg-[#151b2a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
              />

              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {/* Terms Consent */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151b2a] text-emerald-600 focus:ring-emerald-500/30 cursor-pointer"
            />
            <label
              htmlFor="terms"
              className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer select-none"
            >
              I agree to the{" "}
              <Link
                to="/terms-of-service"
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                target="_blank"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy-policy"
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                target="_blank"
              >
                Privacy Policy
              </Link>
              .
            </label>
          </div>
          {/* Submit Button - Guaranteed High Visibility in Light & Dark Mode */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-[#031424] font-black text-base tracking-wide shadow-lg shadow-emerald-600/20 dark:shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-600/30 dark:hover:shadow-emerald-500/30 hover:-translate-y-px active:translate-y-px transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Setting up your pharmacy...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="text-lg font-bold">→</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer ml-1"
          >
            Sign In to Portal
          </button>
        </p>
      </div>
    </div>
  );
}
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard", {
        replace: true,
      });
    }
  }, [user, navigate]);

  // Persist selected plan
  useEffect(() => {
    sessionStorage.setItem("selectedPlanId", planId);
  }, [planId]);
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
        navigate("/payment");
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
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError("");
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c1321] text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col lg:flex-row relative selection:bg-emerald-500 selection:text-white">
      {/* Left Branding Section (Always Dark/Rich Theme for clinical contrast) */}
      <SignupPageSection1 navigate={navigate} />

      {/* Right Form Section */}
      <SignupPageSection2
        navigate={navigate}
        updateField={updateField}
        setShowPassword={setShowPassword}
        showPassword={showPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        showConfirmPassword={showConfirmPassword}
        setAgreedToTerms={setAgreedToTerms}
        plan={plan}
        PlanIcon={PlanIcon}
        error={error}
        handleSubmit={handleSubmit}
        form={form}
        agreedToTerms={agreedToTerms}
        loading={loading}
      />
    </div>
  );
}
