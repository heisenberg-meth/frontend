import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import api from "./api";
import { normalizeArrayResponse } from "./utils/apiNormalizer";
import { API_ROUTES } from "./constants/api.routes.js";
import { SubscriptionStatus } from "./constants/enums";
import Auth from "./components/Auth";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./guards/ProtectedRoute";

// Lazy load components for better performance
const Dashboard = lazy(() => import("./components/Dashboard"));
const BulkImport = lazy(() => import("./components/BulkImport"));
const ManageTeam = lazy(() => import("./components/ManageTeam"));
const SystemSettings = lazy(() => import("./components/SystemSettings"));
const SalesManagement = lazy(() => import("./components/SalesManagement"));
const ReportsHub = lazy(() => import("./components/ReportsHub"));
const AuditLogs = lazy(() => import("./components/AuditLogs"));
const PurchaseManagement = lazy(() => import("./components/PurchaseManagement"));
const PlanSelection = lazy(() => import("./components/PlanSelection"));
const PaymentGateway = lazy(() => import("./components/PaymentGateway"));
const BillingPOS = lazy(() => import("./components/BillingPOS"));
const LowStockAlerts = lazy(() => import("./components/LowStockAlerts"));
const ExpiryBatchIntelligence = lazy(() => import("./components/ExpiryBatchIntelligence"));
const BarcodeEcosystem = lazy(() => import("./components/BarcodeEcosystem"));
const Profile = lazy(() => import("./components/Profile"));
const Suppliers = lazy(() => import("./components/Suppliers"));
const Patients = lazy(() => import("./components/Patients"));
const PrescriptionsCRUD = lazy(() => import("./components/PrescriptionsCRUD"));
const InventoryCRUD = lazy(() => import("./components/InventoryCRUD"));
const SubscriptionCRUD = lazy(() => import("./components/SubscriptionCRUD"));
const AccountingTax = lazy(() => import("./components/AccountingTax"));

import { ShieldCheck, Sparkles, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import "./index.css";
import "./styles/AppShell.css";
import "./styles/ConfirmModal.css";
import "./styles/DataTable.css";
import "./styles/SubscriptionCRUD.css";

import LogoutModal from "./components/LogoutModal";

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
          Your trial has concluded. Upgrade to a paid plan to continue
          using all features.
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
  const location = useLocation();
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
      const res = await api.get(API_ROUTES.INVENTORY_MEDICINES, { params: { limit: 100 } });
      setMedicines(normalizeArrayResponse(res, 'medicines'));
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
      const { lowStock, expiryDays, theme: backendTheme } = res.data?.data || res.data || {};
      setLowStock(lowStock);
      setExpiryDays(expiryDays);
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

  // Stable Synchronization Interval
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
    }, 300000); // 5 minutes

    return () => clearInterval(syncInterval);
  }, [restored, user, status, fetchSettings, fetchData]);
  
  useEffect(() => {
    const saved = localStorage.getItem("viyan-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Keyboard shortcuts
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
      showToast(e.detail?.message || "Subscription expired. Please renew.", "error");
    };

    const handleSessionExpired = async (e) => {
      showToast(e.detail?.reason || "Session expired. Please log in again.", "warning");
      setShowLogoutModal(false);
      await logout({ silent: true });
      navigate("/login", { replace: true });
    };

    window.addEventListener("subscription:expired", handleSubscriptionExpired);
    window.addEventListener("auth:sessionExpired", handleSessionExpired);
    return () => {
      window.removeEventListener("subscription:expired", handleSubscriptionExpired);
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

    if (result.subscriptionExpired) {
      navigate(result.redirectTo || "/billing");
    } else if (result.isNew) {
      navigate("/dashboard");
    } else {
      fetchData();
      fetchSettings();
      navigate("/dashboard");
    }
  };

  const handleSelectTrial = async () => {
    try {
      await api.post("subscriptions/verify-trial");
      await refreshUser();
      showToast("Clinical Trial Activated for 28 Days!", "success");
      fetchData();
      fetchSettings();
      navigate("/dashboard");
    } catch {
      showToast("Trial activation failed. Please try again.", "error");
    }
  };

  const handleSelectPro = () => {
    navigate("/payment");
  };

  const handlePaymentComplete = () => {
    refreshUser();
    navigate("/dashboard");
  };

  // Show loading state while auth is initializing
  if (!restored || authLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <p>Initializing secure session...</p>
      </div>
    );
  }

  const subStatus = subscription?.status;
  const isExpired = subStatus === SubscriptionStatus.EXPIRED;
  const isPrivileged = user?.role === "owner" || user?.role === "admin";
  const needsPlanSelection = 
    !subStatus ||
    subStatus === SubscriptionStatus.PENDING;

  const trialDaysLeft = subscription ? subscription.daysRemaining : null;

  return (
    <>
      <div className="app-shell-root" data-theme={theme}>
        <Suspense
          fallback={
            <div className="auth-loading-screen">
              <div className="auth-loading-spinner" />
              <p>Loading clinical module...</p>
            </div>
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Auth onAuth={handleAuthSuccess} />
                )
              }
            />

            {/* Guarded Routes */}
            <Route
              element={
                <ProtectedRoute>
                  {isExpired && isPrivileged ? (
                    <Paywall onActivate={() => navigate("/plans")} />
                  ) : needsPlanSelection && isPrivileged && location.pathname !== "/plans" && location.pathname !== "/payment" ? (
                    <Navigate to="/plans" replace />
                  ) : (
                    <DashboardLayout
                      user={user}
                      toggleTheme={toggleTheme}
                      theme={theme}
                      trialDaysLeft={trialDaysLeft}
                      setShowLogoutModal={setShowLogoutModal}
                      medicines={medicines}
                    />
                  )}
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <Dashboard
                    medicines={medicines}
                    expiryDays={expiryDays}
                    lowStock={lowStock}
                    fetchData={fetchData}
                    showToast={showToast}
                    currency={currency}
                    lastSync={lastSync}
                    user={user}
                  />
                }
              />
              <Route
                path="/stock"
                element={
                  <InventoryCRUD
                    showToast={showToast}
                    title="Stock Management"
                  />
                }
              />
              <Route
                path="/inventory"
                element={
                  <InventoryCRUD
                    showToast={showToast}
                    title="Inventory Management"
                  />
                }
              />
              <Route
                path="/import"
                element={
                  <BulkImport fetchData={fetchData} showToast={showToast} />
                }
              />
              <Route
                path="/billing"
                element={<BillingPOS showToast={showToast} user={user} />}
              />
              <Route
                path="/lowstock"
                element={<LowStockAlerts showToast={showToast} />}
              />
              <Route
                path="/purchases"
                element={<PurchaseManagement showToast={showToast} />}
              />
              <Route
                path="/analytics"
                element={<SalesManagement showToast={showToast} />}
              />
              <Route
                path="/reports"
                element={<ReportsHub showToast={showToast} />}
              />
              <Route
                path="/expiry"
                element={<ExpiryBatchIntelligence showToast={showToast} />}
              />
              <Route
                path="/barcode"
                element={<BarcodeEcosystem showToast={showToast} />}
              />
              <Route
                path="/suppliers"
                element={<Suppliers showToast={showToast} />}
              />
              <Route
                path="/patients"
                element={<Patients showToast={showToast} />}
              />
              <Route
                path="/prescriptions"
                element={<PrescriptionsCRUD showToast={showToast} />}
              />
              <Route
                path="/accounting"
                element={<AccountingTax showToast={showToast} />}
              />
              <Route
                path="/team"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                    <ManageTeam user={user} showToast={showToast} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                    <SystemSettings
                      user={user}
                      lowStock={lowStock}
                      setLowStock={setLowStock}
                      expiryDays={expiryDays}
                      setExpiryDays={setExpiryDays}
                      theme={theme}
                      setTheme={setTheme}
                      onClearAll={handleClearAll}
                      onSave={handleSaveSettings}
                      showToast={showToast}
                      onActivate={handleActivateSubscription}
                    />
                  </ProtectedRoute>
                }
              />
              <Route path="/logs" element={<AuditLogs />} />
              <Route
                path="/profile"
                element={
                  <Profile
                    user={user}
                    profileData={profileData}
                    handleAvatarUpload={handleAvatarUpload}
                    setShowAuthModal={(updates) => {
                      setPendingUpdates(updates);
                      setShowAuthModal(true);
                    }}
                    showToast={showToast}
                  />
                }
              />
              <Route
                path="/subscription"
                element={
                  <SubscriptionCRUD
                    showToast={showToast}
                    user={user}
                    onActivate={handleActivateSubscription}
                  />
                }
              />
            </Route>

            {/* Special Utility Routes */}
            <Route
              path="/plans"
              element={
                <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                  <PlanSelection
                    onSelectTrial={handleSelectTrial}
                    onSelectPro={handleSelectPro}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment"
              element={
                <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                  <PaymentGateway
                    user={user}
                    amount={1}
                    onPaymentComplete={handlePaymentComplete}
                  />
                </ProtectedRoute>
              }
            />

            {/* 404 Redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>

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
