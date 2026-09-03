import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Shield, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password) => {
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

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

const HEADER_TITLES = {
  loginAdmin: "Admin Access",
  loginStaff: "Staff Portal",
  register: "Join the Network",
  forgot: "Forgot Password",
  verifyOtp: "Verify Code",
  verifyDeviceOtp: "Verify Device",
  newPassword: "Create New Password",
};

const HEADER_SUBTITLES = {
  loginAdmin: "Access your facility administration dashboard.",
  loginStaff: "Sign in with your clinical access credentials.",
  register: "Start your facility registration today.",
  forgot: "Enter your email to receive a recovery code.",
  verifyOtp: "Enter the 6-digit code sent to your email.",
  verifyDeviceOtp: "Enter the 6-digit authorization code sent to your email.",
  newPassword: "Choose a strong password for your account.",
};

function AuthSection1(props) {
  return (
    <div className="auth-canvas-section">
      <AuthSection1Section1 {...props} />
    </div>
  );
}

function AuthCanvasHeader({ view, loginType }) {
  const key =
    view === "login"
      ? loginType === "admin"
        ? "loginAdmin"
        : "loginStaff"
      : view;
  return (
    <>
      <div className="mobile-logo-wrap">
        <img
          src="/viyan_logo.webp"
          alt="Viyan Medassist"
          className="h-10 w-auto"
        />
      </div>

      <div className="canvas-header">
        <h2 className="canvas-title">{HEADER_TITLES[key] || ""}</h2>
        <p className="canvas-subtitle">{HEADER_SUBTITLES[key] || ""}</p>
      </div>
    </>
  );
}

function RegisterFields({ form, updateField }) {
  return (
    <>
      <div className="control-group">
        <label htmlFor="field_qd2938" className="control-label">
          FULL NAME
        </label>
        <div className="control-input-wrap">
          <input
            id="field_qd2938"
            required
            type="text"
            className="canvas-input"
            placeholder="Dr. Julian Sterling"
            value={form.fullName || ""}
            onChange={(e) => updateField("fullName", e.target.value)}
          />
        </div>
      </div>
      <div className="control-group">
        <label htmlFor="field_hxak7s" className="control-label">
          PHARMACY / SHOP NAME
        </label>
        <div className="control-input-wrap">
          <Shield size={18} className="input-icon-left" />
          <input
            id="field_hxak7s"
            required
            type="text"
            className="canvas-input"
            placeholder="e.g. Apex Medical Solutions"
            value={form.shopName || ""}
            onChange={(e) => updateField("shopName", e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

function EmailField({ view, loginType, form, updateField }) {
  const isAdmin = loginType === "admin";
  const isDisabled = view === "verifyOtp" || view === "verifyDeviceOtp";
  return (
    <div className="control-group">
      <label htmlFor="field_ijpf58" className="control-label">
        {isAdmin ? "WORK EMAIL" : "STAFF ID / EMAIL"}
      </label>
      <div className="control-input-wrap">
        <Mail size={18} className="input-icon-left" />
        <input
          id="field_ijpf58"
          required
          type={isAdmin ? "email" : "text"}
          className="canvas-input"
          placeholder={isAdmin ? "dr.house@viyan.med" : "STAFF-9921"}
          value={form.email || ""}
          onChange={(e) => updateField("email", e.target.value)}
          disabled={isDisabled}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

function PasswordField({
  view,
  form,
  updateField,
  showPassword,
  setShowPassword,
  navigateTo,
}) {
  return (
    <div className="control-group">
      <div className="control-header-flex">
        <span className="control-label">PASSWORD</span>
        {view === "login" && (
          <button
            type="button"
            className="control-link"
            onClick={() => navigateTo("forgot")}
          >
            FORGOT PASSWORD?
          </button>
        )}
      </div>
      <div className="control-input-wrap">
        <Lock size={18} className="input-icon-left" />
        <>
          <label htmlFor="field_4jpra7" className="sr-only">
            Enter your password
          </label>
          <input
            required
            type={showPassword ? "text" : "password"}
            className="canvas-input"
            placeholder="Enter your password"
            value={form.password || ""}
            onChange={(e) => updateField("password", e.target.value)}
            autoComplete="new-password"
            id="field_4jpra7"
          />
        </>
        <button
          type="button"
          className="input-icon-right"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function OtpField({ view, form, updateField, handleResendOtp, loading }) {
  return (
    <div className="control-group">
      <label htmlFor="field_06t1l4" className="control-label">
        VERIFICATION CODE (OTP)
      </label>
      <div className="control-input-wrap">
        <Shield size={18} className="input-icon-left" />
        <input
          id="field_06t1l4"
          required
          type="text"
          className="canvas-input"
          placeholder="Enter 6-digit code"
          value={form.otp || ""}
          onChange={(e) => updateField("otp", e.target.value)}
          maxLength={6}
          pattern="\d{6}"
        />
      </div>
      {view === "verifyOtp" && (
        <button
          type="button"
          className="control-link"
          onClick={handleResendOtp}
          disabled={loading}
          style={{
            marginTop: "8px",
            alignSelf: "flex-end",
          }}
        >
          Resend Code
        </button>
      )}
    </div>
  );
}

function NewPasswordFields({
  form,
  updateField,
  showPassword,
  setShowPassword,
}) {
  return (
    <>
      <div className="control-group">
        <label htmlFor="field_q1rywn" className="control-label">
          NEW PASSWORD
        </label>
        <div className="control-input-wrap">
          <Lock size={18} className="input-icon-left" />
          <input
            id="field_q1rywn"
            required
            type={showPassword ? "text" : "password"}
            className="canvas-input"
            placeholder="Min. 8 characters"
            value={form.newPassword || ""}
            onChange={(e) => updateField("newPassword", e.target.value)}
            minLength={8}
          />
          <button
            type="button"
            className="input-icon-right"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div className="control-group">
        <label htmlFor="field_0bwc93" className="control-label">
          CONFIRM NEW PASSWORD
        </label>
        <div className="control-input-wrap">
          <Lock size={18} className="input-icon-left" />
          <input
            id="field_0bwc93"
            required
            type={showPassword ? "text" : "password"}
            className="canvas-input"
            placeholder="Re-enter new password"
            value={form.confirmPassword || ""}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

function ConfirmPasswordField({ form, updateField, showPassword }) {
  return (
    <div className="control-group">
      <label htmlFor="field_wfq2ur" className="control-label">
        CONFIRM PASSWORD
      </label>
      <div className="control-input-wrap">
        <Lock size={18} className="input-icon-left" />
        <input
          id="field_wfq2ur"
          required
          type={showPassword ? "text" : "password"}
          className="canvas-input"
          placeholder="Re-enter your password"
          value={form.confirmPassword || ""}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
        />
      </div>
    </div>
  );
}

function LegalConsentField({ agreedToTerms, setAgreedToTerms }) {
  return (
    <div className="auth-consent-group">
      <input
        type="checkbox"
        id="legal-consent"
        className="auth-consent-checkbox"
        checked={agreedToTerms}
        onChange={(e) => setAgreedToTerms(e.target.checked)}
      />
      <label htmlFor="legal-consent" className="auth-consent-text">
        I have read and agree to the{" "}
        <a
          href="/legal"
          target="_blank"
          rel="noopener noreferrer"
          className="auth-consent-link"
        >
          Terms of Service
        </a>
        ,{" "}
        <a
          href="/legal"
          target="_blank"
          rel="noopener noreferrer"
          className="auth-consent-link"
        >
          Privacy Policy
        </a>
        , and{" "}
        <a
          href="/legal"
          target="_blank"
          rel="noopener noreferrer"
          className="auth-consent-link"
        >
          EULA
        </a>
        .
      </label>
    </div>
  );
}

function AuthFormFields({
  view,
  loginType,
  form,
  updateField,
  showPassword,
  setShowPassword,
  navigateTo,
  handleResendOtp,
  loading,
  agreedToTerms,
  setAgreedToTerms,
}) {
  const isRegister = view === "register";
  const showEmail = view !== "newPassword";
  const showPasswordInput = view === "login" || view === "register";
  const showOtp = view === "verifyOtp" || view === "verifyDeviceOtp";

  return (
    <div className="form-controls-stack">
      {isRegister && <RegisterFields form={form} updateField={updateField} />}

      {showEmail && (
        <EmailField
          view={view}
          loginType={loginType}
          form={form}
          updateField={updateField}
        />
      )}

      {showPasswordInput && (
        <PasswordField
          view={view}
          form={form}
          updateField={updateField}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          navigateTo={navigateTo}
        />
      )}

      {showOtp && (
        <OtpField
          view={view}
          form={form}
          updateField={updateField}
          handleResendOtp={handleResendOtp}
          loading={loading}
        />
      )}

      {view === "newPassword" && (
        <NewPasswordFields
          form={form}
          updateField={updateField}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      )}

      {isRegister && (
        <ConfirmPasswordField
          form={form}
          updateField={updateField}
          showPassword={showPassword}
        />
      )}

      {isRegister && (
        <LegalConsentField
          agreedToTerms={agreedToTerms}
          setAgreedToTerms={setAgreedToTerms}
        />
      )}
    </div>
  );
}

function AuthCanvasFooter({ view, navigate, navigateTo }) {
  const isAuthForm = view === "login" || view === "register";
  const isSecondaryView =
    view === "forgot" ||
    view === "verifyOtp" ||
    view === "verifyDeviceOtp" ||
    view === "newPassword";

  return (
    <>
      {isAuthForm && (
        <div className="canvas-divider">
          <div className="divider-line"></div>
          <span className="divider-text">OR CONTINUE WITH</span>
          <div className="divider-line"></div>
        </div>
      )}

      <p className="canvas-footer-toggle">
        {view === "login" && (
          <>
            New to Viyan MedAssist?
            <button type="button" onClick={() => navigate("/pricing")}>
              View Plans & Sign Up
            </button>
          </>
        )}
        {view === "register" && (
          <>
            Already registered?
            <button type="button" onClick={() => navigateTo("login")}>
              Sign In to Portal
            </button>
          </>
        )}
        {isSecondaryView && (
          <button type="button" onClick={() => navigateTo("login")}>
            Back to Sign In
          </button>
        )}
      </p>

      <div className="canvas-compliance-footer">
        <div className="compliance-badges">
          <span className="badge">
            <Check size={12} /> HIPAA COMPLIANT
          </span>
          <span className="badge">
            <Lock size={12} /> SSL SECURED
          </span>
        </div>
        <div className="compliance-links">
          <a href="/legal" target="_blank" rel="noopener noreferrer">
            Privacy
          </a>
          <a href="/legal" target="_blank" rel="noopener noreferrer">
            Terms
          </a>
        </div>
      </div>
    </>
  );
}

function SubmitButtonContent({ loading, view }) {
  if (loading) {
    return (
      <span className="submit-loading">
        <Loader2 size={18} className="spinner" />
        Processing...
      </span>
    );
  }
  if (view === "login") return "Sign In to Dashboard";
  if (view === "register") return "Create Account";
  if (view === "forgot") return "Send Recovery Code";
  if (view === "verifyOtp" || view === "verifyDeviceOtp") return "Verify Code";
  return "Reset Password";
}

function AuthSection1Section1({
  setLoginType,
  setError,
  updateField,
  navigateTo,
  setShowPassword,
  showPassword,
  setAgreedToTerms,
  navigate,
  view,
  loginType,
  error,
  success,
  form,
  handleSubmit,
  agreedToTerms,
  loading,
  handleResendOtp,
}) {
  return (
    <div className="auth-canvas-content">
      <AuthCanvasHeader view={view} loginType={loginType} />

      {view === "login" && (
        <div className="login-type-toggle">
          <button
            type="button"
            className={`type-btn ${loginType === "admin" ? "active" : ""}`}
            onClick={() => {
              setLoginType("admin");
              setError("");
            }}
          >
            <Shield size={16} />
            <span>Facility Admin</span>
          </button>
        </div>
      )}

      {error && (
        <div className="auth-error-alert" role="alert">
          {typeof error === "string" ? error : error?.message || String(error)}
        </div>
      )}

      {success && (
        <div className="auth-success-alert" role="status">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="canvas-form" autoComplete="off">
        <AuthFormFields
          view={view}
          loginType={loginType}
          form={form}
          updateField={updateField}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          navigateTo={navigateTo}
          handleResendOtp={handleResendOtp}
          loading={loading}
          agreedToTerms={agreedToTerms}
          setAgreedToTerms={setAgreedToTerms}
        />

        <button type="submit" className="canvas-submit-btn" disabled={loading}>
          <SubmitButtonContent loading={loading} view={view} />
        </button>
      </form>

      <AuthCanvasFooter
        view={view}
        navigate={navigate}
        navigateTo={navigateTo}
      />
    </div>
  );
}

function AuthBrandingSection() {
  return (
    <div className="auth-branding-section">
      <div className="auth-branding-overlay">
        <div className="branding-glow-1"></div>
        <div className="branding-glow-2"></div>
      </div>

      <div className="branding-content">
        <div className="branding-logo-wrap">
          <img
            src="/viyan_logo.webp"
            alt="Viyan Medassist"
            className="auth-brand-logo"
          />
        </div>

        <h1 className="branding-title">
          <span className="text-primary">Secured.</span>
        </h1>

        <p className="branding-sub">
          Experience the next generation of clinical precision. Our
          HIPAA-compliant gateway ensures your patients&apos; data remains
          protected under military-grade encryption.
        </p>

        <div className="metrics-grid">
          <div className="metric-card">
            <Shield size={20} className="metric-icon" />
            <div className="metric-label">DATA ACCURACY</div>
            <div className="metric-value">99.9% Verified</div>
          </div>
          <div className="metric-card">
            <Lock size={20} className="metric-icon" />
            <div className="metric-label">COMPLIANCE</div>
            <div className="metric-value">24/7 Global</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const validateRegisterAndConsent = (view, form, agreedToTerms) => {
  if (view !== "register") return null;
  if (form.password !== form.confirmPassword) {
    return "Passwords do not match.";
  }
  if (!agreedToTerms) {
    return "You must agree to the Terms of Service and Privacy Policy.";
  }
  return null;
};

const validateNewPasswordAndOtp = (view, form) => {
  if (view === "newPassword") {
    if (!form.otp) return "Session expired. Please start over.";
    if (!form.newPassword) return "New password is required.";
    if (form.newPassword.length < 8)
      return "Password must be at least 8 characters.";
    if (form.newPassword !== form.confirmPassword)
      return "Passwords do not match.";
  }
  if ((view === "verifyOtp" || view === "verifyDeviceOtp") && !form.otp) {
    return "Please enter the verification code.";
  }
  return null;
};

const validateAuthForm = ({ view, loginType, form, agreedToTerms }) => {
  const email = form.email.trim();
  const password = form.password.trim();

  if (!email && view !== "newPassword") {
    return "Email is required.";
  }
  if (
    loginType === "admin" &&
    !validateEmail(email) &&
    view !== "newPassword"
  ) {
    return "Please enter a valid email address.";
  }
  if (loginType === "staff" && email.length < 3 && view !== "newPassword") {
    return "Please enter a valid Staff ID or email.";
  }
  if (view === "login" || view === "register") {
    if (!password) return "Password is required.";
    const pwError = validatePassword(password);
    if (pwError) return pwError;
  }

  return (
    validateRegisterAndConsent(view, form, agreedToTerms) ||
    validateNewPasswordAndOtp(view, form)
  );
};

const executeAuthAction = async ({
  view,
  form,
  onAuth,
  setView,
  setSuccess,
  setForm,
}) => {
  const email = form.email.trim().toLowerCase();
  const password = form.password.trim();

  if (view === "login") {
    const result = await onAuth(
      { email, password, fingerprint: getFingerprint() },
      false,
    );
    if (result?.deviceVerificationRequired) {
      setView("verifyDeviceOtp");
      setSuccess(result.message);
    }
  } else if (view === "verifyDeviceOtp") {
    await onAuth(
      { email, password, fingerprint: getFingerprint(), otp: form.otp },
      false,
    );
  } else if (view === "register") {
    await onAuth(
      {
        email,
        password,
        fullName: form.fullName.trim(),
        shopName: form.shopName.trim(),
        confirmPassword: form.confirmPassword.trim(),
        role: "owner",
        fingerprint: getFingerprint(),
      },
      true,
    );
  } else if (view === "forgot") {
    await api.post(API_ROUTES.AUTH_FORGOT_PASSWORD, { email });
    setForm((prev) => ({ ...prev, email }));
    setView("verifyOtp");
    setSuccess("Verification code sent. Check your inbox.");
  } else if (view === "verifyOtp") {
    const res = await api.post(API_ROUTES.AUTH_VERIFY_RESET_OTP, {
      email,
      otp: form.otp,
    });
    const resetToken = res.data?.data?.resetToken || "";
    setForm((prev) => ({ ...prev, resetToken }));
    setView("newPassword");
    setSuccess("Code verified. Create a new password.");
  } else if (view === "newPassword") {
    await api.post(API_ROUTES.AUTH_RESET_PASSWORD, {
      resetToken: form.resetToken,
      newPassword: form.newPassword,
    });
    setView("login");
    setSuccess("Password reset successful. Please sign in.");
    setForm({
      email: "",
      password: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
      resetToken: "",
    });
  }
};

export default function Auth({ onAuth }) {
  const navigate = useNavigate();
  const [view, setView] = useState("login");
  const [loginType, setLoginType] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
    resetToken: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const valError = validateAuthForm({ view, loginType, form, agreedToTerms });
    if (valError) {
      setError(valError);
      return;
    }

    setLoading(true);
    try {
      await executeAuthAction({
        view,
        form,
        onAuth,
        setView,
        setSuccess,
        setForm,
      });
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
                : "Action failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post(API_ROUTES.AUTH_RESEND_RESET_OTP, {
        email: form.email.toLowerCase(),
      });
      setSuccess("New code sent. Check your inbox.");
    } catch (err) {
      const errData = err.response?.data;
      const message =
        typeof errData?.error?.message === "string"
          ? errData.error.message
          : typeof errData?.message === "string"
            ? errData.message
            : "Failed to resend code.";
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

  const navigateTo = (target) => {
    setView(target);
    setError("");
    setSuccess("");
  };

  return (
    <div className="auth-gateway-layout">
      <div className="systems-status-badge">
        <div className="status-dot"></div>
        <span>SYSTEMS ONLINE</span>
      </div>

      {/* Left Branding Section */}
      <AuthBrandingSection />

      {/* Right Form Section */}
      <AuthSection1
        setLoginType={setLoginType}
        setError={setError}
        updateField={updateField}
        navigateTo={navigateTo}
        setShowPassword={setShowPassword}
        showPassword={showPassword}
        setAgreedToTerms={setAgreedToTerms}
        navigate={navigate}
        view={view}
        loginType={loginType}
        error={error}
        success={success}
        form={form}
        handleSubmit={handleSubmit}
        agreedToTerms={agreedToTerms}
        loading={loading}
        handleResendOtp={handleResendOtp}
      />
    </div>
  );
}
