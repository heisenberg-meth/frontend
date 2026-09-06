import { useState, useEffect, useEffectEvent } from "react";
import { AnimatePresence, m } from "framer-motion";
import {
  LogOut,
  X,
  Shield,
  Monitor,
  Clock,
  User,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { formatInvoiceTime } from "../utils/dateTime.js";
export default function LogoutModal({
  isOpen,
  onClose,
  onConfirmLogout,
  user,
}) {
  const [clearSession, setClearSession] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState(false);

  const onEscape = useEffectEvent(() => {
    if (!isLoggingOut) onClose();
  });

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleClose = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(false);
    setLogoutSuccess(false);
    setClearSession(false);
    onClose();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    await new Promise((resolve) => setTimeout(resolve, 1800));

    if (clearSession) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();
    }

    setLogoutSuccess(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    onConfirmLogout();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isLoggingOut) {
      handleClose();
    }
  };

  const currentTime = formatInvoiceTime(new Date());

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          role="presentation"
          className="logout-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleOverlayClick}
        >
          <m.div
            className="logout-modal"
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            {/* ── Success State ── */}
            {logoutSuccess ? (
              <m.div
                className="logout-success-state"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="logout-success-icon">
                  <CheckCircle2 size={48} />
                </div>
                <h3>Session Ended</h3>
                <p>Redirecting to authentication...</p>
              </m.div>
            ) : (
              <>
                {/* ── Header ── */}
                <div className="logout-modal-header">
                  <div className="logout-icon-wrapper">
                    <div className="logout-icon-glow">
                      <LogOut size={24} />
                    </div>
                  </div>
                  <div className="logout-title-block">
                    <h3 id="logout-title">Confirm Logout</h3>
                    <p>
                      Are you sure you want to end your current MedAssist
                      session?
                    </p>
                  </div>
                  {!isLoggingOut && (
                    <button
                      className="logout-close-btn"
                      onClick={handleClose}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* ── Security Info Card ── */}
                <div className="logout-body">
                  <div className="logout-session-card">
                    <div className="session-row">
                      <User size={14} />
                      <span className="session-label">User</span>
                      <span className="session-value">
                        {user?.fullName || user?.username || "Operator"}
                      </span>
                    </div>
                    <div className="session-row">
                      <Shield size={14} />
                      <span className="session-label">Role</span>
                      <span className="session-value session-role">
                        {user?.role
                          ? user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)
                          : "Staff"}
                      </span>
                    </div>
                    <div className="session-row">
                      <Clock size={14} />
                      <span className="session-label">Last Active</span>
                      <span className="session-value">{currentTime}</span>
                    </div>
                    <div className="session-row">
                      <Monitor size={14} />
                      <span className="session-label">Device</span>
                      <span className="session-value session-secure">
                        <span className="secure-dot" />
                        Secure Session
                      </span>
                    </div>
                  </div>

                  {/* ── Checkbox ── */}
                  <label className="logout-checkbox-wrapper">
                    <div className="custom-checkbox-container">
                      <input
                        required
                        type="checkbox"
                        checked={clearSession}
                        onChange={(e) => setClearSession(e.target.checked)}
                        disabled={isLoggingOut}
                      />
                      <div
                        className={`custom-checkbox ${clearSession ? "checked" : ""}`}
                      >
                        {clearSession && <CheckCircle2 size={12} />}
                      </div>
                    </div>
                    <div className="checkbox-text">
                      <span>Clear local session data from this device</span>
                      <small>
                        This removes cached pharmacy session information from
                        this browser.
                      </small>
                    </div>
                  </label>
                </div>

                {/* ── Footer Actions ── */}
                <div className="logout-modal-footer">
                  <button
                    className="logout-btn cancel"
                    onClick={handleClose}
                    disabled={isLoggingOut}
                  >
                    Cancel
                  </button>
                  <button
                    className="logout-btn confirm"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 size={16} className="logout-spinner" />
                        Ending Session...
                      </>
                    ) : (
                      <>
                        <LogOut size={16} />
                        Logout Securely
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
