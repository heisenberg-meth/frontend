import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  RefreshCw,
  Save,
  ArrowLeft,
  MessageCircle,
  Zap,
  Clock,
  AlertTriangle,
  FileText,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../hooks/useAuth";
import { API_ROUTES } from "../constants/api.routes.js";
import SubscriptionCRUD from "./SubscriptionCRUD";
import LegalPages from "./LegalPages";
import GSTConfigCard from "./GSTConfigCard";
import ShopDetailsCard from "./ShopDetailsCard";
import { formatInvoiceTime } from "../utils/dateTime.js";

const DEFAULT_SETTINGS = {
  lowStock: 10,
  expiryDays: 30,
  theme: "dark",
  emailEnabled: true,
  whatsappEnabled: false,
  inAppEnabled: true,
  smsEnabled: false,
  alertEmail: "",
  autoReorderEnabled: true,
  immutableAudit: false,
  outOfStockNotification: true,
  fifoEnabled: true,
  reorderQuantityMultiplier: 5,
};

export default function SystemSettings({
  user,
  lowStock,
  setLowStock,
  expiryDays,
  setExpiryDays,
  theme,
  setTheme,
  onSave,
  showToast,
  onActivate,
}) {
  const { subscription, tenant } = useAuth();
  const [currentView, setCurrentView] = useState("settings");
  const [saving, setSaving] = useState(false);
  const [settingsData, setSettingsData] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings],
  );

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const [notifHistory, setNotifHistory] = useState([]);
  const [queueMetrics, setQueueMetrics] = useState(null);
  const [isOpsLoading, setIsOpsLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const settingsRes = await api.get(API_ROUTES.SETTINGS);
      if (settingsRes?.data) {
        const s = settingsRes.data.data || settingsRes.data;
        setSettingsData(s);
        if (s.lowStock && setLowStock) setLowStock(s.lowStock);
        if (s.expiryDays && setExpiryDays) setExpiryDays(s.expiryDays);
        if (s.theme && setTheme) setTheme(s.theme);

        const loaded = {
          lowStock: s.lowStock ?? lowStock ?? 10,
          expiryDays: s.expiryDays ?? expiryDays ?? 30,
          theme: s.theme ?? theme ?? "dark",
          emailEnabled:
            s.notifications?.emailEnabled ??
            s.notificationSettings?.emailEnabled ??
            true,
          whatsappEnabled:
            s.notifications?.whatsappEnabled ??
            s.notificationSettings?.whatsappEnabled ??
            false,
          inAppEnabled:
            s.notifications?.inAppEnabled ??
            s.notificationSettings?.inAppEnabled ??
            true,
          smsEnabled:
            s.notifications?.smsEnabled ??
            s.notificationSettings?.smsEnabled ??
            false,
          alertEmail:
            s.notifications?.alertEmail ||
            s.notificationSettings?.alertEmail ||
            "",
          autoReorderEnabled:
            s.inventory?.autoReorderEnabled ??
            s.inventorySettings?.autoReorderEnabled ??
            true,
          immutableAudit:
            s.inventory?.immutableAudit ??
            s.inventorySettings?.immutableAudit ??
            false,
          outOfStockNotification:
            s.inventory?.outOfStockNotification ??
            s.inventorySettings?.outOfStockNotification ??
            true,
          fifoEnabled:
            s.inventory?.fifoEnabled ??
            s.inventorySettings?.fifoEnabled ??
            true,
          reorderQuantityMultiplier:
            s.inventory?.reorderQuantityMultiplier ??
            s.inventorySettings?.reorderQuantityMultiplier ??
            5,
        };
        setSettings(loaded);
        setSavedSettings(loaded);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      showToast?.("Failed to load settings", "error");
    }
  }, [
    expiryDays,
    lowStock,
    setExpiryDays,
    setLowStock,
    setTheme,
    showToast,
    theme,
  ]);

  const loadSettingsRef = useRef();
  useEffect(() => {
    loadSettingsRef.current = loadSettings;
  });

  useEffect(() => {
    loadSettingsRef.current?.();
  }, []);

  const refreshOpsData = async () => {
    try {
      setIsOpsLoading(true);
      const [histRes, metricsRes] = await Promise.all([
        api.get(API_ROUTES.NOTIFICATIONS_HISTORY),
        api.get(API_ROUTES.NOTIFICATIONS_METRICS),
      ]);
      setNotifHistory(histRes.data?.notifications || []);
      setQueueMetrics(metricsRes.data?.data || null);
    } catch (err) {
      console.error("Failed to load ops data:", err);
      showToast?.("Failed to load notification data", "error");
    } finally {
      setIsOpsLoading(false);
    }
  };

  useEffect(() => {
    if (currentView !== "ops") return;

    let mounted = true;

    const loadOps = async () => {
      try {
        setIsOpsLoading(true);

        const [histRes, metricsRes] = await Promise.all([
          api.get(API_ROUTES.NOTIFICATIONS_HISTORY),
          api.get(API_ROUTES.NOTIFICATIONS_METRICS),
        ]);

        if (!mounted) return;

        setNotifHistory(histRes.data?.notifications || []);
        setQueueMetrics(metricsRes.data?.data || null);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setIsOpsLoading(false);
        }
      }
    };

    loadOps();

    return () => {
      mounted = false;
    };
  }, [currentView]);

  const handleRetry = async (id) => {
    try {
      await api.post(`${API_ROUTES.NOTIFICATIONS_RETRY}/${id}`);
      refreshOpsData();
      showToast("Notification retry initiated", "success");
    } catch (err) {
      console.error("[RETRY ERROR]", err);
      showToast("Retry failed", "error");
    }
  };

  const handleSaveSettings = async () => {
    if (!hasUnsavedChanges || saving) return;
    setSaving(true);
    try {
      await Promise.all([
        onSave?.({
          lowStock: settings.lowStock,
          expiryDays: settings.expiryDays,
          theme: settings.theme,
        }),
        api.put(API_ROUTES.SETTINGS_INVENTORY, {
          lowStockThreshold: settings.lowStock,
          expiryAlertDays: settings.expiryDays,
          autoReorderEnabled: settings.autoReorderEnabled,
          immutableAudit: settings.immutableAudit,
          outOfStockNotification: settings.outOfStockNotification,
          fifoEnabled: settings.fifoEnabled,
          reorderQuantityMultiplier: Math.round(
            settings.reorderQuantityMultiplier / 10,
          ),
        }),
        api.put(API_ROUTES.SETTINGS_NOTIFICATIONS, {
          emailEnabled: settings.emailEnabled,
          inAppEnabled: settings.inAppEnabled,
          smsEnabled: settings.smsEnabled,
          whatsappEnabled: settings.whatsappEnabled,
          alertEmail: settings.alertEmail ? settings.alertEmail.trim() : null,
        }),
      ]);
      setSavedSettings(settings);
      showToast?.("Global facility configuration synchronized", "success");
    } catch (err) {
      showToast?.(
        err?.response?.data?.message || "Synchronization partial failure",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderOps = () => (
    <div className="settings-page-wrapper">
      <button
        className="sys-btn-outline"
        onClick={() => setCurrentView("settings")}
        style={{ border: "none", padding: 0, marginBottom: 24 }}
      >
        <ArrowLeft size={16} /> Back to Facility Control
      </button>

      <div className="sub-view-header">
        <h2>Communication & Queue Operations</h2>
        <p>
          Real-time delivery orchestration and messaging reliability control.
        </p>
      </div>

      <div className="ops-metrics-grid">
        {queueMetrics &&
          Object.entries(queueMetrics).map(([name, m]) => (
            <div key={name} className="queue-stat-card">
              <div className="q-head">
                <Zap size={14} color="var(--primary)" />
                <span>{name.toUpperCase()} QUEUE</span>
              </div>
              <div className="q-val-row">
                <div className="q-val">
                  <b>{m.waiting}</b> <small>WAITING</small>
                </div>
                <div className="q-val">
                  <b>{m.active}</b> <small>ACTIVE</small>
                </div>
                <div className="q-val danger">
                  <b>{m.failed}</b> <small>FAILED</small>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="sys-card" style={{ marginTop: 24 }}>
        <div className="sys-card-header">
          <h3 className="sys-card-title">
            <MessageCircle size={18} /> Delivery Timeline
          </h3>
          <button
            aria-label="Refresh"
            className="micro-btn"
            onClick={refreshOpsData}
            disabled={isOpsLoading}
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <table className="staff-table">
          <thead>
            <tr>
              <th>RECIPIENT</th>
              <th>CHANNEL</th>
              <th>STATUS</th>
              <th>TIMESTAMP</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {notifHistory.map((n) => (
              <tr key={n.id}>
                <td>{n.recipient}</td>
                <td>
                  <span className="badge-secondary">{n.channel}</span>
                </td>
                <td>
                  <span
                    className={`p-status ${n.deliveryStatus.toLowerCase()}`}
                  >
                    {n.deliveryStatus}
                  </span>
                </td>
                <td>{formatInvoiceTime(n.createdAt)}</td>
                <td>
                  {n.deliveryStatus === "FAILED" && (
                    <button
                      className="micro-btn-teal"
                      onClick={() => handleRetry(n.id)}
                    >
                      RETRY
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {notifHistory.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: 40 }}>
                  No delivery events in current cycle.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-page-wrapper">
      <div className="settings-page-header">
        <div className="header-left">
          <div className="breadcrumb-pill">⚙ FACILITY CONTROL CENTER</div>
          <div>
            <h1 className="page-title">System Configuration</h1>
            <p className="page-subtitle">
              Orchestrate global clinical thresholds, manage enterprise
              licensing, and maintain architectural integrity.
            </p>
          </div>
        </div>
        <div className="header-right">
          <button
            className="sys-btn-outline"
            onClick={() => setCurrentView("legal")}
          >
            <FileText size={16} /> Legal & Compliance
          </button>
          <button
            type="button"
            className="sys-btn-fill"
            onClick={handleSaveSettings}
            disabled={!hasUnsavedChanges || saving}
          >
            <Save size={16} /> {saving ? "Saving..." : "Apply Changes"}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-col">
          <div className="sys-card">
            <div className="sys-card-header">
              <h3 className="sys-card-title">✦ Enterprise Licensing</h3>
              <div
                className={`sys-chip ${subscription?.status?.toLowerCase() || "pending"}`}
              >
                {subscription?.status || "PENDING"}
              </div>
            </div>
            <button
              type="button"
              className="enterprise-grad-card"
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => setCurrentView("subscription")}
            >
              {subscription?.isTrial && (
                <>
                  <div className="ent-label">Free Trial</div>
                  <div
                    className="ent-price"
                    style={{ fontSize: 14, fontWeight: 400 }}
                  >
                    <Clock
                      size={14}
                      style={{ marginRight: 4, verticalAlign: "middle" }}
                    />
                    {subscription.daysRemaining} days remaining
                  </div>
                </>
              )}
              {!subscription?.isTrial && subscription?.status === "ACTIVE" && (
                <>
                  <div className="ent-label">
                    {subscription.planName || "Active Plan"}
                  </div>
                  <div className="ent-price">₹{subscription.price}/mo</div>
                </>
              )}
              {!subscription?.isTrial && subscription?.status === "EXPIRED" && (
                <>
                  <div className="ent-label" style={{ color: "var(--danger)" }}>
                    Trial Expired
                  </div>
                  <div
                    className="ent-price"
                    style={{ fontSize: 14, fontWeight: 400 }}
                  >
                    <AlertTriangle
                      size={14}
                      style={{ marginRight: 4, verticalAlign: "middle" }}
                    />
                    Renew to continue
                  </div>
                </>
              )}
              {(!subscription || subscription?.status === "PENDING") && (
                <>
                  <div className="ent-label">No Plan</div>
                  <div
                    className="ent-price"
                    style={{ fontSize: 14, fontWeight: 400 }}
                  >
                    Select a plan to get started
                  </div>
                </>
              )}
            </button>
            <button
              className="sys-btn-outline"
              style={{ width: "100%", marginTop: 16 }}
              onClick={() => setCurrentView("subscription")}
            >
              Manage Plan
            </button>
          </div>

          <GSTConfigCard
            settingsData={settingsData}
            onRefresh={loadSettings}
            showToast={showToast}
            tenant={tenant}
          />
        </div>

        <div className="settings-col">
          <div className="sys-card">
            <h3 className="sys-card-title" style={{ marginBottom: 16 }}>
              Notification Channels
            </h3>
            <div className="sys-toggle-row">
              <span className="sys-toggle-label">Email</span>
              <button
                type="button"
                className={`sys-toggle ${settings.emailEnabled ? "on" : ""}`}
                onClick={() =>
                  updateSetting("emailEnabled", !settings.emailEnabled)
                }
                aria-label="Toggle Email notifications"
              >
                <div className="sys-toggle-thumb" />
              </button>
            </div>
            <div className="sys-toggle-row">
              <span className="sys-toggle-label">WhatsApp</span>
              <button
                type="button"
                className={`sys-toggle ${settings.whatsappEnabled ? "on" : ""}`}
                onClick={() =>
                  updateSetting("whatsappEnabled", !settings.whatsappEnabled)
                }
                aria-label="Toggle WhatsApp notifications"
              >
                <div className="sys-toggle-thumb" />
              </button>
            </div>
          </div>

          <ShopDetailsCard
            settingsData={settingsData}
            onRefresh={loadSettings}
            showToast={showToast}
            tenant={tenant}
          />
        </div>
      </div>

      {/* ── Danger Zone: Master Reset ── */}
      <div className="settings-danger-zone">
        <h3>
          <AlertTriangle size={18} /> DANGER ZONE
        </h3>
        <p>
          <strong>Reset Pharmacy Data</strong>: Permanently remove all
          operational data associated with this pharmacy account and return it
          to a newly-created empty state. This includes bills, sales, purchases,
          inventory, suppliers, returns, payments, batches, medicines and
          related records. Your login credentials, account identity, and
          enterprise subscription will remain active.
        </p>
        <div className="settings-danger-actions">
          <button
            type="button"
            className="settings-reset-btn"
            onClick={() => setResetModalOpen(true)}
            disabled={saving || isResetting}
          >
            <AlertTriangle size={16} /> Reset All Pharmacy Data
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {currentView === "settings" && renderSettings()}
      {currentView === "ops" && renderOps()}
      {currentView === "subscription" && (
        <div className="settings-page-wrapper">
          <button
            className="sys-btn-outline"
            onClick={() => setCurrentView("settings")}
            style={{
              border: "none",
              padding: 0,
              marginBottom: 24,
              background: "transparent",
            }}
          >
            <ArrowLeft size={16} /> Back to Facility Control
          </button>
          <SubscriptionCRUD
            user={user}
            showToast={showToast}
            onActivate={onActivate}
          />
        </div>
      )}
      {currentView === "legal" && (
        <div className="settings-page-wrapper">
          <button
            className="sys-btn-outline"
            onClick={() => setCurrentView("settings")}
            style={{
              border: "none",
              padding: 0,
              marginBottom: 24,
              background: "transparent",
            }}
          >
            <ArrowLeft size={16} /> Back to Facility Control
          </button>
          <LegalPages showBackButton={false} />
        </div>
      )}

      {resetModalOpen && (
        <MasterResetModal
          onClose={() => !isResetting && setResetModalOpen(false)}
          showToast={showToast}
          isResetting={isResetting}
          setIsResetting={setIsResetting}
        />
      )}
    </>
  );
}

function MasterResetModal({ onClose, showToast, isResetting, setIsResetting }) {
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const steps = [
    "Authenticating credentials & tenant session...",
    "Removing invoices, customer bills & payments...",
    "Clearing inventory, batches & stock logs...",
    "Removing purchases, orders & supplier ledgers...",
    "Purging medicine catalog & finalizing reset...",
  ];

  const canSubmit =
    confirmation === "RESET" && password.trim().length > 0 && !isResetting;

  const handleReset = async (e) => {
    e?.preventDefault();
    if (!canSubmit) return;

    setErrorMsg("");
    setIsResetting(true);
    setActiveStep(0);

    const timer1 = setTimeout(() => setActiveStep(1), 500);
    const timer2 = setTimeout(() => setActiveStep(2), 1200);
    const timer3 = setTimeout(() => setActiveStep(3), 2000);
    const timer4 = setTimeout(() => setActiveStep(4), 2800);

    try {
      const res = await api.post(API_ROUTES.SETTINGS_RESET_ACCOUNT_DATA, {
        confirmation: confirmation.trim(),
        password: password.trim(),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setActiveStep(5);

      showToast?.(
        res.data?.message || "Pharmacy operational data reset successfully.",
        "success",
      );

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setIsResetting(false);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to reset pharmacy data.";
      setErrorMsg(msg);
      showToast?.(msg, "error");
    }
  };

  return (
    <div className="danger-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="danger-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="danger-modal-title">
          <AlertTriangle size={22} /> RESET ALL PHARMACY DATA
        </h2>

        <p className="danger-modal-text">
          This action is permanent and cannot be reversed. All bills, sales,
          purchases, inventory, medicines, suppliers, returns, payments and
          related operational data will be permanently deleted from the
          database.
        </p>

        <div className="danger-modal-highlight">
          Your user login, email, password, and enterprise subscription will
          remain completely active.
        </div>

        {errorMsg && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              color: "#ef4444",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {!isResetting ? (
          <form onSubmit={handleReset}>
            <div className="danger-modal-input-group">
              <label
                htmlFor="reset-confirm-text"
                className="danger-modal-label"
              >
                Type RESET to continue
              </label>
              <input
                id="reset-confirm-text"
                type="text"
                className="danger-modal-input"
                placeholder="RESET"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                disabled={isResetting}
              />
            </div>

            <div className="danger-modal-input-group">
              <label htmlFor="reset-confirm-pwd" className="danger-modal-label">
                Current Password
              </label>
              <input
                id="reset-confirm-pwd"
                type="password"
                className="danger-modal-input"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isResetting}
              />
            </div>

            <div className="danger-modal-actions">
              <button
                type="button"
                className="sys-btn-outline"
                onClick={onClose}
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="danger-destruct-btn"
                disabled={!canSubmit}
              >
                <Trash2 size={16} /> Permanently Reset Data
              </button>
            </div>
          </form>
        ) : (
          <div className="danger-progress-box">
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 12,
                color: "var(--sys-danger, #ef4444)",
              }}
            >
              Resetting pharmacy data...
            </div>
            {steps.map((label, idx) => {
              const isDone = activeStep > idx;
              const isCurrent = activeStep === idx;
              return (
                <div
                  key={idx}
                  className={`danger-progress-step ${
                    isDone ? "completed" : isCurrent ? "active" : ""
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={15} color="#10b981" />
                  ) : isCurrent ? (
                    <RefreshCw
                      size={15}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <Clock size={15} />
                  )}
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
