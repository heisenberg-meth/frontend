import { useState } from "react";
import { Lock, Mail, Shield, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";
export default function Auth({ onAuth }) {
  const [view, setView] = useState("login");
  const [loginType, setLoginType] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    otp: "",
    twoFactorToken: "",
    newPassword: "",
    confirmPassword: "",
    resetToken: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const email = form.email.trim();
    const password = form.password.trim();

    if (!email && view !== "newPassword") {
      setError("Email is required.");
      return;
    }
    if (
      loginType === "admin" &&
      !validateEmail(email) &&
      view !== "newPassword"
    ) {
      setError("Please enter a valid email address.");
      return;
    }
    if (loginType === "staff" && email.length < 3 && view !== "newPassword") {
      setError("Please enter a valid Staff ID or email.");
      return;
    }

    if (view === "login" || view === "register") {
      if (!password) {
        setError("Password is required.");
        return;
      }
      const pwError = validatePassword(password);
      if (pwError) {
        setError(pwError);
        return;
      }
    }

    if (view === "register" && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (view === "newPassword") {
      if (!form.otp) {
        setError("Session expired. Please start over.");
        return;
      }
      if (!form.newPassword) {
        setError("New password is required.");
        return;
      }
      if (form.newPassword.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    if ((view === "verifyOtp" || view === "verifyDeviceOtp") && !form.otp) {
      setError("Please enter the verification code.");
      return;
    }

    if (view === "verify2FA" && !form.twoFactorToken) {
      setError("Please enter the 2FA code.");
      return;
    }

    setLoading(true);

    try {
      if (view === "login") {
        const result = await onAuth(
          {
            email: email.toLowerCase(),
            password,
            fingerprint: getFingerprint(),
          },
          false,
        );
        if (result?.deviceVerificationRequired) {
          setView("verifyDeviceOtp");
          setSuccess(result.message);
        } else if (result?.twoFactorVerificationRequired) {
          setView("verify2FA");
          setSuccess(result.message);
        }
      } else if (view === "verifyDeviceOtp") {
        await onAuth(
          {
            email: email.toLowerCase(),
            password,
            fingerprint: getFingerprint(),
            otp: form.otp,
          },
          false,
        );
      } else if (view === "verify2FA") {
        await onAuth(
          {
            email: email.toLowerCase(),
            password,
            fingerprint: getFingerprint(),
            twoFactorToken: form.twoFactorToken,
          },
          false,
        );
      } else if (view === "register") {
        await onAuth(
          {
            email: email.toLowerCase(),
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
        await api.post(API_ROUTES.AUTH_FORGOT_PASSWORD, {
          email: email.toLowerCase(),
        });
        setForm((prev) => ({ ...prev, email: email.toLowerCase() }));
        setView("verifyOtp");
        setSuccess("Verification code sent. Check your inbox.");
      } else if (view === "verifyOtp") {
        const res = await api.post(API_ROUTES.AUTH_VERIFY_RESET_OTP, {
          email: email.toLowerCase(),
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
    setForm((prev) => ({ ...prev, [field]: value }));
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

      {/* Right Form Section */}
      <div className="auth-canvas-section">
        <div className="auth-canvas-content">
          <div className="mobile-logo-wrap">
            <img
              src="/viyan_logo.webp"
              alt="Viyan Medassist"
              className="h-10 w-auto"
            />
          </div>

          <div className="canvas-header">
            <h2 className="canvas-title">
              {view === "login" &&
                (loginType === "admin" ? "Admin Access" : "Staff Portal")}
              {view === "register" && "Join the Network"}
              {view === "forgot" && "Forgot Password"}
              {view === "verifyOtp" && "Verify Code"}
              {view === "verifyDeviceOtp" && "Verify Device"}
              {view === "verify2FA" && "Two-Factor Authentication"}
              {view === "newPassword" && "Create New Password"}
            </h2>
            <p className="canvas-subtitle">
              {view === "login" &&
                (loginType === "admin"
                  ? "Access your facility administration dashboard."
                  : "Sign in with your clinical access credentials.")}
              {view === "register" && "Start your facility registration today."}
              {view === "forgot" &&
                "Enter your email to receive a recovery code."}
              {view === "verifyOtp" &&
                "Enter the 6-digit code sent to your email."}
              {view === "verifyDeviceOtp" &&
                "Enter the 6-digit authorization code sent to your email."}
              {view === "verify2FA" &&
                "Enter the 6-digit code from your authenticator app."}
              {view === "newPassword" &&
                "Choose a strong password for your account."}
            </p>
          </div>

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
              <button
                type="button"
                className={`type-btn ${loginType === "staff" ? "active" : ""}`}
                onClick={() => {
                  setLoginType("staff");
                  setError("");
                }}
              >
                <Check size={16} />
                <span>Clinical Staff</span>
              </button>
            </div>
          )}

          {error && (
            <div className="auth-error-alert" role="alert">
              {typeof error === "string"
                ? error
                : error?.message || String(error)}
            </div>
          )}

          {success && (
            <div className="auth-success-alert" role="status">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="canvas-form"
            autoComplete="off"
          >
            <div className="form-controls-stack">
              {view === "register" && (
                <>
                  <div className="control-group">
                    <label className="control-label">FULL NAME</label>
                    <div className="control-input-wrap">
                      <input
                        required
                        type="text"
                        className="canvas-input"
                        placeholder="Dr. Julian Sterling"
                        value={form.fullName}
                        onChange={(e) =>
                          updateField("fullName", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="control-group">
                    <label className="control-label">
                      PHARMACY / SHOP NAME
                    </label>
                    <div className="control-input-wrap">
                      <Shield size={18} className="input-icon-left" />
                      <input
                        required
                        type="text"
                        className="canvas-input"
                        placeholder="e.g. Apex Medical Solutions"
                        value={form.shopName}
                        onChange={(e) =>
                          updateField("shopName", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {(view === "login" ||
                view === "register" ||
                view === "forgot" ||
                view === "verifyOtp" ||
                view === "verifyDeviceOtp") && (
                <div className="control-group">
                  <label className="control-label">
                    {loginType === "admin" ? "WORK EMAIL" : "STAFF ID / EMAIL"}
                  </label>
                  <div className="control-input-wrap">
                    <Mail size={18} className="input-icon-left" />
                    <input
                      required
                      type={loginType === "admin" ? "email" : "text"}
                      className="canvas-input"
                      placeholder={
                        loginType === "admin"
                          ? "dr.house@viyan.med"
                          : "STAFF-9921"
                      }
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      disabled={
                        view === "verifyOtp" ||
                        view === "verifyDeviceOtp" ||
                        view === "verify2FA"
                      }
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}

              {(view === "login" || view === "register") && (
                <div className="control-group">
                  <div className="control-header-flex">
                    <label className="control-label">PASSWORD</label>
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
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      className="canvas-input"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="input-icon-right"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {(view === "verifyOtp" || view === "verifyDeviceOtp") && (
                <div className="control-group">
                  <label className="control-label">
                    VERIFICATION CODE (OTP)
                  </label>
                  <div className="control-input-wrap">
                    <Shield size={18} className="input-icon-left" />
                    <input
                      required
                      type="text"
                      className="canvas-input"
                      placeholder="Enter 6-digit code"
                      value={form.otp}
                      onChange={(e) => updateField("otp", e.target.value)}
                      maxLength={6}
                      pattern="\d{6}"
                      autoFocus
                    />
                  </div>
                  {view === "verifyOtp" && (
                    <button
                      type="button"
                      className="control-link"
                      onClick={handleResendOtp}
                      disabled={loading}
                      style={{ marginTop: "8px", alignSelf: "flex-end" }}
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              )}

              {view === "verify2FA" && (
                <div className="control-group">
                  <label className="control-label">AUTHENTICATOR CODE</label>
                  <div className="control-input-wrap">
                    <Shield size={18} className="input-icon-left" />
                    <input
                      required
                      type="text"
                      className="canvas-input"
                      placeholder="Enter 6-digit 2FA code"
                      value={form.twoFactorToken}
                      onChange={(e) =>
                        updateField("twoFactorToken", e.target.value)
                      }
                      maxLength={6}
                      pattern="\d{6}"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {view === "newPassword" && (
                <>
                  <div className="control-group">
                    <label className="control-label">NEW PASSWORD</label>
                    <div className="control-input-wrap">
                      <Lock size={18} className="input-icon-left" />
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        className="canvas-input"
                        placeholder="Min. 8 characters"
                        value={form.newPassword}
                        onChange={(e) =>
                          updateField("newPassword", e.target.value)
                        }
                        minLength={8}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="input-icon-right"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="control-group">
                    <label className="control-label">
                      CONFIRM NEW PASSWORD
                    </label>
                    <div className="control-input-wrap">
                      <Lock size={18} className="input-icon-left" />
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        className="canvas-input"
                        placeholder="Re-enter new password"
                        value={form.confirmPassword || ""}
                        onChange={(e) =>
                          updateField("confirmPassword", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {view === "register" && (
                <div className="control-group">
                  <label className="control-label">CONFIRM PASSWORD</label>
                  <div className="control-input-wrap">
                    <Lock size={18} className="input-icon-left" />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      className="canvas-input"
                      placeholder="Re-enter your password"
                      value={form.confirmPassword || ""}
                      onChange={(e) =>
                        updateField("confirmPassword", e.target.value)
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="canvas-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="submit-loading">
                  <Loader2 size={18} className="spinner" />
                  Processing...
                </span>
              ) : view === "login" ? (
                "Sign In to Dashboard"
              ) : view === "register" ? (
                "Create Account"
              ) : view === "forgot" ? (
                "Send Recovery Code"
              ) : view === "verifyOtp" ||
                view === "verifyDeviceOtp" ||
                view === "verify2FA" ? (
                "Verify Code"
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          {/* SSO Divider */}
          {(view === "login" || view === "register") && (
            <>
              <div className="canvas-divider">
                <div className="divider-line"></div>
                <span className="divider-text">OR CONTINUE WITH</span>
                <div className="divider-line"></div>
              </div>

              {/* <div className="sso-grid">
                <button type="button" className="sso-btn" disabled>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
                <button type="button" className="sso-btn" disabled>
                  <Shield size={18} />
                  <span>SSO</span>
                </button>
              </div> */}
            </>
          )}

          <p className="canvas-footer-toggle">
            {view === "login" && (
              <>
                New to Viyan MedAssist?
                <button type="button" onClick={() => navigateTo("register")}>
                  Create an account
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
            {(view === "forgot" ||
              view === "verifyOtp" ||
              view === "verifyDeviceOtp" ||
              view === "verify2FA" ||
              view === "newPassword") && (
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
              <a href="#!">Privacy</a>
              <a href="#!">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
