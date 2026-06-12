import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import api from "./api";
import { normalizeArrayResponse } from "./utils/apiNormalizer";
import { API_ROUTES } from "./constants/api.routes.js";
import { SubscriptionStatus } from "./constants/enums";
import {
  ShieldCheck,
  Sparkles,
  Lock,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LogoutModal from "./components/LogoutModal";
import AppRoutes from "./routes/AppRoutes";

function Paywall({ onActivate }) {
  return (
    <div className="paywall-overlay-v2">
      <div className="paywall-blur-bg" />
      <motion.div
        className="paywall-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="paywall-lock-icon">
          <ShieldAlert size={48} />
        </div>
        <h2>Access Restricted</h2>
        <p>
          Your trial has concluded. Upgrade to a paid plan to continue using all
          features.
        </p>

        <div className="paywall-features">
          <div className="p-feat">
            <CheckCircle2 size={14} /> UNLIMITED PATIENTS
          </div>
          <div className="p-feat">
            <CheckCircle2 size={14} /> AI DIAGNOSTICS
          </div>
          <div className="p-feat">
            <CheckCircle2 size={14} /> REAL-TIME TELEMETRY
          </div>
          <div className="p-feat">
            <CheckCircle2 size={14} /> 24/7 PRIORITY SUPPORT
          </div>
        </div>

        <button className="paywall-btn" onClick={onActivate}>
          UPGRADE NOW <Sparkles size={18} />
        </button>
        <button className="paywall-support-btn">
          CONTACT FACILITY SUPPORT
        </button>
      </motion.div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <motion.div
      className={`toast-v2 ${type}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {type === "success" ? (
        <CheckCircle2 size={16} />
      ) : (
        <ShieldAlert size={16} />
      )}
      <span>{message}</span>
    </motion.div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const {
    user,
    subscription,
    loading: authLoading,
    restored,
    toast,
    showToast,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  } = useAuth();

  const [medicines, setMedicines] = useState([]);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("viyan-theme") || "dark",
  );
  const [lowStock, setLowStock] = useState(10);
  const [expiryDays, setExpiryDays] = useState(30);
  const [storeProfile, setStoreProfile] = useState(null);
  const [currency] = useState({
    code: "INR",
    symbol: "₹",
    rate: 83.5,
  });

  const profileData = useMemo(
    () => ({
      username: user?.username || "",
      email: user?.email || `${user?.username?.toLowerCase() || ""}@viyan.med`,
      fullName: user?.fullName || user?.username || "",
    }),
    [user],
  );

  const [verifyPassword, setVerifyPassword] = useState("");
  const [pendingUpdates, setPendingUpdates] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());

  const status = subscription?.status;

  const fetchData = useCallback(async () => {
    if (
      !status ||
      status === SubscriptionStatus.EXPIRED ||
      status === SubscriptionStatus.CANCELLED
    )
      return;
    try {
      const res = await api.get(API_ROUTES.INVENTORY_MEDICINES, {
        params: { limit: 100 },
      });
      setMedicines(normalizeArrayResponse(res));
      setLastSync(new Date());
    } catch {
      showToast("Failed to fetch inventory", "error");
    }
  }, [showToast, status]);

  const fetchSettings = useCallback(async () => {
    if (
      !status ||
      status === SubscriptionStatus.EXPIRED ||
      status === SubscriptionStatus.CANCELLED
    )
      return;
    try {
      const res = await api.get(API_ROUTES.SETTINGS);
      const {
        lowStock,
        expiryDays,
        theme: backendTheme,
        storeProfile,
      } = res.data?.data || res.data || {};
      setLowStock(lowStock ?? 10);
      setExpiryDays(expiryDays ?? 30);
      setStoreProfile(storeProfile || {});
      const localTheme = localStorage.getItem("viyan-theme");
      if (!localTheme && backendTheme) {
        setTheme(backendTheme);
        localStorage.setItem("viyan-theme", backendTheme);
        document.documentElement.setAttribute("data-theme", backendTheme);
      }
    } catch {
      console.error("Failed to fetch settings");
    }
  }, [status]);

  useEffect(() => {
    if (!restored) return;

    if (
      !user ||
      (status !== SubscriptionStatus.TRIAL &&
        status !== SubscriptionStatus.ACTIVE)
    ) {
      return;
    }

    const boot = async () => {
      try {
        await Promise.all([fetchData(), fetchSettings()]);
      } catch (err) {
        console.error("[APP INIT ERROR]", err);
      }
    };

    boot();
  }, [restored, user, status, fetchData, fetchSettings]);

  useEffect(() => {
    if (!restored || !user) return;

    if (
      status !== SubscriptionStatus.TRIAL &&
      status !== SubscriptionStatus.ACTIVE
    ) {
      return;
    }

    const syncInterval = setInterval(async () => {
      try {
        await Promise.all([fetchSettings(), fetchData()]);
      } catch (err) {
        console.error("[SYNC ERROR]", err);
      }
    }, 300000);

    return () => clearInterval(syncInterval);
  }, [restored, user, status, fetchSettings, fetchData]);

  useEffect(() => {
    const saved = localStorage.getItem("viyan-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "n" || e.key === "N") {
          e.preventDefault();
          navigate("/stock");
        }
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          navigate("/stock");
        }
        if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          navigate("/analytics");
        }
        if (e.key === "d" || e.key === "D") {
          e.preventDefault();
          navigate("/dashboard");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("viyan-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      await api.put("settings", { lowStock, expiryDays, theme: newTheme });
    } catch {
      console.error("Failed to save theme preference");
    }
  };

  const handleSignOut = async () => {
    await logout();
    setMedicines([]);
    setShowLogoutModal(false);
    navigate("/login");
  };

  const handleClearAll = async () => {
    try {
      await api.delete("inventory/medicines-clear-all");
      showToast("Inventory reset successfully", "success");
      fetchData();
    } catch {
      showToast("Reset failed", "error");
    }
  };

  const handleSaveSettings = async (settings) => {
    try {
      await api.put("settings", settings);
      showToast("Configuration saved and synchronized", "success");
      await fetchSettings();
    } catch {
      showToast("Failed to save settings", "error");
    }
  };

  const handleUpdateProfile = async (updates) => {
    try {
      const payload = {
        ...updates,
        currentPassword: verifyPassword,
      };

      await api.put(`team/${user.id}`, payload);
      updateUser(payload);
      showToast("Clinical profile synchronized", "success");
      setVerifyPassword("");
      setShowAuthModal(false);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update profile",
        "error",
      );
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await api.post("uploads/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const avatarUrl = res.data?.avatarUrl;

      await api.put(`team/${user.id}`, { avatar: avatarUrl });

      updateUser({ avatar: avatarUrl });
      showToast("Clinical avatar updated", "success");
    } catch {
      showToast("Upload failed", "error");
    }
  };

  useEffect(() => {
    const handleSubscriptionExpired = (e) => {
      refreshUser();
      navigate("/subscription");
      showToast(
        e.detail?.message || "Subscription expired. Please renew.",
        "error",
      );
    };

    const handleSessionExpired = async (e) => {
      showToast(
        e.detail?.reason || "Session expired. Please log in again.",
        "warning",
      );
      setShowLogoutModal(false);
      await logout({ silent: true });
      navigate("/login", { replace: true });
    };

    window.addEventListener("subscription:expired", handleSubscriptionExpired);
    window.addEventListener("auth:sessionExpired", handleSessionExpired);
    return () => {
      window.removeEventListener(
        "subscription:expired",
        handleSubscriptionExpired,
      );
      window.removeEventListener("auth:sessionExpired", handleSessionExpired);
    };
  }, [refreshUser, showToast, navigate, logout]);

  const handleActivateSubscription = async () => {
    try {
      await refreshUser();
      showToast("Subscription status synchronized", "success");
    } catch {
      showToast("Failed to refresh status", "error");
    }
  };

  const handleAuthSuccess = async (credentials, isRegister) => {
    const result = isRegister
      ? await register(credentials)
      : await login(credentials);

    if (result?.deviceVerificationRequired) {
      return result;
    }

    if (result.subscriptionExpired) {
      navigate(result.redirectTo || "/billing");
    } else if (result.isNew) {
      navigate("/dashboard");
    } else {
      fetchData();
      fetchSettings();
      navigate("/dashboard");
    }
    return result;
  };

  if (!restored || authLoading) {
    return (
      <div
        className="auth-loading-screen"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: "var(--bg-dark)",
        }}
      >
        <motion.div
          className="auth-loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{
            width: 40,
            height: 40,
            border: "4px solid rgba(79, 219, 200, 0.2)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            marginBottom: 16,
          }}
        />
        <p style={{ color: "var(--text-muted)" }}>
          Initializing secure session...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="app-shell-root" data-theme={theme}>
        <AppRoutes
          user={user}
          subscription={subscription}
          theme={theme}
          storeProfile={storeProfile}
          medicines={medicines}
          expiryDays={expiryDays}
          lowStock={lowStock}
          currency={currency}
          lastSync={lastSync}
          fetchData={fetchData}
          showToast={showToast}
          toggleTheme={toggleTheme}
          handleClearAll={handleClearAll}
          handleSaveSettings={handleSaveSettings}
          setLowStock={setLowStock}
          setExpiryDays={setExpiryDays}
          setTheme={setTheme}
          handleActivateSubscription={handleActivateSubscription}
          handleAuthSuccess={handleAuthSuccess}
          handleAvatarUpload={handleAvatarUpload}
          profileData={profileData}
          setShowAuthModal={setShowAuthModal}
          setPendingUpdates={setPendingUpdates}
          setShowLogoutModal={setShowLogoutModal}
          PaywallComponent={() => (
            <Paywall onActivate={() => navigate("/plans")} />
          )}
        />

        <AnimatePresence>
          {toast && <Toast message={toast.message} type={toast.type} />}
        </AnimatePresence>

        <AnimatePresence>
          {showAuthModal && (
            <div className="modal-overlay">
              <motion.div
                className="modal-content"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ maxWidth: 420 }}
              >
                <div className="modal-header">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <ShieldCheck size={24} style={{ color: "#4fdbc8" }} />
                    <h3>Verify Authorization</h3>
                  </div>
                </div>
                <div className="modal-body">
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    Enter your current password to synchronize changes to your
                    clinical credentials.
                  </p>
                  <div className="input-v2" style={{ marginTop: 24 }}>
                    <label>
                      <Lock size={12} /> CURRENT PASSWORD
                    </label>
                    <input
                      required
                      type="password"
                      placeholder="Enter current password"
                      value={verifyPassword}
                      onChange={(e) => setVerifyPassword(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div
                  className="modal-actions"
                  style={{ marginTop: 32, display: "flex", gap: 12 }}
                >
                  <button
                    className="modal-btn-outline"
                    style={{
                      flex: 1,
                      background: "none",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--text-muted)",
                      borderRadius: 12,
                      cursor: "pointer",
                      padding: "12px",
                    }}
                    onClick={() => {
                      setShowAuthModal(false);
                      setVerifyPassword("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-btn-primary"
                    style={{
                      flex: 1,
                      background: "#4fdbc8",
                      color: "#031424",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      padding: "12px",
                    }}
                    onClick={() => handleUpdateProfile(pendingUpdates)}
                    disabled={!verifyPassword}
                  >
                    Verify Access
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirmLogout={handleSignOut}
          user={user}
        />
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
