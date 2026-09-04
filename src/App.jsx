import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import api from "./api";
import { normalizeArrayResponse } from "./utils/apiNormalizer";
import { API_ROUTES } from "./constants/api.routes.js";
import { SubscriptionStatus } from "./constants/enums";
import { Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";
import { AnimatePresence, m, LazyMotion, domAnimation } from "framer-motion";
import LogoutModal from "./components/LogoutModal";
import AppRoutes from "./routes/AppRoutes";

function Paywall({ onActivate }) {
  return (
    <div className="paywall-overlay-v2">
      <div className="paywall-blur-bg" />
      <m.div
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
      </m.div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <m.div
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
    </m.div>
  );
}

function AppLoadingScreen() {
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
      <m.div
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

function useAppData({ status, restored, user, showToast }) {
  const [medicines, setMedicines] = useState([]);
  const [lowStock, setLowStock] = useState(10);
  const [expiryDays, setExpiryDays] = useState(30);
  const [storeProfile, setStoreProfile] = useState(null);
  const [lastSync, setLastSync] = useState(new Date());

  const fetchData = useCallback(async () => {
    if (
      !status ||
      status === SubscriptionStatus.EXPIRED ||
      status === SubscriptionStatus.CANCELLED
    ) {
      return;
    }

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
    ) {
      return;
    }

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
        localStorage.setItem("viyan-theme", backendTheme);
        document.documentElement.setAttribute("data-theme", backendTheme);
      }
    } catch {
      console.error("Failed to fetch settings");
    }
  }, [status]);

  useEffect(() => {
    let ignore = false;

    if (!restored || !user) return;

    if (
      status !== SubscriptionStatus.TRIAL &&
      status !== SubscriptionStatus.ACTIVE
    ) {
      return;
    }

    const boot = async () => {
      try {
        await Promise.all([fetchData(), fetchSettings()]);
      } catch (err) {
        if (!ignore) {
          console.error("[APP INIT ERROR]", err);
        }
      }
    };

    boot();

    return () => {
      ignore = true;
    };
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

  return {
    medicines,
    setMedicines,
    lowStock,
    setLowStock,
    expiryDays,
    setExpiryDays,
    storeProfile,
    lastSync,
    fetchData,
    fetchSettings,
  };
}

function useAppActions({
  navigate,
  showToast,
  logout,
  login,
  register,
  refreshUser,
  updateUser,
  fetchData,
  fetchSettings,
  setMedicines,
  setShowLogoutModal,
}) {
  const handleSignOut = useCallback(async () => {
    await logout();
    setMedicines([]);
    setShowLogoutModal(false);
    navigate("/login");
  }, [logout, setMedicines, setShowLogoutModal, navigate]);

  const handlePaymentComplete = useCallback(async () => {
    try {
      await refreshUser();
    } catch (e) {
      console.error("Failed to refresh user after payment", e);
    }

    navigate("/dashboard", { replace: true });
  }, [navigate, refreshUser]);

  const handleSelectPro = useCallback(() => {
    navigate("/payment");
  }, [navigate]);

  const handleSelectTrial = useCallback(async () => {
    try {
      await api.post(API_ROUTES.SUBSCRIPTIONS_TRIAL);
      await refreshUser();
      showToast("Trial activated successfully", "success");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Trial may already be active - still refresh and proceed
      console.error("Trial activation error:", err);
      await refreshUser();
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, refreshUser, showToast]);

  const handleClearAll = useCallback(async () => {
    try {
      await api.delete("inventory/medicines-clear-all");
      showToast("Inventory reset successfully", "success");
      await fetchData();
    } catch {
      showToast("Reset failed", "error");
    }
  }, [fetchData, showToast]);

  const handleSaveSettings = useCallback(
    async (settings) => {
      try {
        await api.put("settings", settings);
        showToast("Configuration saved and synchronized", "success");
        await fetchSettings();
      } catch {
        showToast("Failed to save settings", "error");
      }
    },
    [fetchSettings, showToast],
  );

  const handleAvatarUpload = useCallback(
    async (file) => {
      if (!file) return;

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await api.post("uploads/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const avatarUrl = res.data?.data?.avatarUrl || res.data?.avatarUrl;

      updateUser({ avatar: avatarUrl });
      await refreshUser();

      return avatarUrl;
    },
    [refreshUser, updateUser],
  );

  const handleActivateSubscription = useCallback(async () => {
    try {
      await refreshUser();
      showToast("Subscription status synchronized", "success");
    } catch {
      showToast("Failed to refresh status", "error");
    }
  }, [refreshUser, showToast]);

  const handleAuthSuccess = useCallback(
    async (credentials, isRegister) => {
      const result = isRegister
        ? await register(credentials)
        : await login(credentials);

      if (result?.deviceVerificationRequired) {
        return result;
      }

      if (result.subscriptionExpired) {
        navigate(result.redirectTo || "/billing");
      } else if (result.isNew) {
        if (result.subscriptionStatus === "PENDING") {
          navigate("/payment");
        } else {
          await fetchData();
          await fetchSettings();
          navigate("/dashboard");
        }
      } else {
        await fetchData();
        await fetchSettings();
        navigate("/dashboard");
      }

      return result;
    },
    [register, login, navigate, fetchData, fetchSettings],
  );

  return {
    handleSignOut,
    handlePaymentComplete,
    handleSelectPro,
    handleSelectTrial,
    handleClearAll,
    handleSaveSettings,
    handleAvatarUpload,
    handleActivateSubscription,
    handleAuthSuccess,
  };
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
    tenant,
  } = useAuth();

  const [theme, setTheme] = useState(
    () => localStorage.getItem("viyan-theme") || "dark",
  );
  const [currency] = useState({
    code: "INR",
    symbol: "₹",
    rate: 83.5,
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const status = subscription?.status;

  const {
    medicines,
    setMedicines,
    lowStock,
    setLowStock,
    expiryDays,
    setExpiryDays,
    storeProfile,
    lastSync,
    fetchData,
    fetchSettings,
  } = useAppData({
    status,
    restored,
    user,
    showToast,
  });

  const {
    handleSignOut,
    handlePaymentComplete,
    handleSelectPro,
    handleSelectTrial,
    handleClearAll,
    handleSaveSettings,
    handleAvatarUpload,
    handleActivateSubscription,
    handleAuthSuccess,
  } = useAppActions({
    navigate,
    showToast,
    logout,
    login,
    register,
    refreshUser,
    updateUser,
    fetchData,
    fetchSettings,
    setMedicines,
    setShowLogoutModal,
  });

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
  }, [refreshUser, showToast, navigate, logout, setShowLogoutModal]);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("viyan-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      await api.put("settings", { lowStock, expiryDays, theme: newTheme });
    } catch {
      console.error("Failed to save theme preference");
    }
  }, [theme, lowStock, expiryDays]);

  if (!restored || authLoading) {
    return <AppLoadingScreen />;
  }

  return (
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
        profile={{ ...user, shopName: tenant?.name || "" }}
        refreshProfile={refreshUser}
        setShowLogoutModal={setShowLogoutModal}
        handlePaymentComplete={handlePaymentComplete}
        handleSelectPro={handleSelectPro}
        handleSelectTrial={handleSelectTrial}
        PaywallComponent={() => (
          <Paywall onActivate={() => navigate("/plans")} />
        )}
      />

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirmLogout={handleSignOut}
        user={user}
      />
    </div>
  );
}

export default function App() {
  return (
    <LazyMotion features={domAnimation}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LazyMotion>
  );
}
