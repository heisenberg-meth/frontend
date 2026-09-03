import { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw,
  Save,
  ArrowLeft,
  MessageCircle,
  Zap,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../hooks/useAuth";
import { API_ROUTES } from "../constants/api.routes.js";
import SubscriptionCRUD from "./SubscriptionCRUD";
import LegalPages from "./LegalPages";
import GSTConfigCard from "./GSTConfigCard";
import ShopDetailsCard from "./ShopDetailsCard";
import { formatInvoiceTime } from "../utils/dateTime.js";
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
  const reorderQtyRef = useRef(50);
  const autoEscalationRef = useRef(true);
  const immutableAuditRef = useRef(false);
  const oosNotifRef = useRef(true);
  const fifoEnfRef = useRef(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const notifInAppRef = useRef(true);
  const notifSmsRef = useRef(false);
  const [notifWa, setNotifWa] = useState(false);
  const alertEmailRef = useRef("");
  const [notifHistory, setNotifHistory] = useState([]);
  const [queueMetrics, setQueueMetrics] = useState(null);
  const [isOpsLoading, setIsOpsLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const settingsRes = await api.get(API_ROUTES.SETTINGS);
      if (settingsRes?.data) {
        const s = settingsRes.data.data || settingsRes.data;
        setSettingsData(s);
        if (s.lowStock) setLowStock(s.lowStock);
        if (s.expiryDays) setExpiryDays(s.expiryDays);
        if (s.theme) setTheme(s.theme);

        if (s.inventory) {
          if (s.inventory.autoReorderEnabled !== undefined)
            autoEscalationRef.current = s.inventory.autoReorderEnabled;
          if (s.inventory.immutableAudit !== undefined)
            immutableAuditRef.current = s.inventory.immutableAudit;
          if (s.inventory.outOfStockNotification !== undefined)
            oosNotifRef.current = s.inventory.outOfStockNotification;
          if (s.inventory.fifoEnabled !== undefined)
            fifoEnfRef.current = s.inventory.fifoEnabled;
          if (s.inventory.reorderQuantityMultiplier)
            reorderQtyRef.current = s.inventory.reorderQuantityMultiplier * 10;
        }
        if (s.notifications) {
          if (s.notifications.emailEnabled !== undefined)
            setNotifEmail(s.notifications.emailEnabled);
          if (s.notifications.inAppEnabled !== undefined)
            notifInAppRef.current = s.notifications.inAppEnabled;
          if (s.notifications.smsEnabled !== undefined)
            notifSmsRef.current = s.notifications.smsEnabled;
          if (s.notifications.whatsappEnabled !== undefined)
            setNotifWa(s.notifications.whatsappEnabled);
          if (s.notifications.alertEmail)
            alertEmailRef.current = s.notifications.alertEmail;
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      showToast?.("Failed to load settings", "error");
    }
  }, [setExpiryDays, setLowStock, setTheme, showToast]);

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
    setSaving(true);
    try {
      await Promise.all([
        onSave({ lowStock, expiryDays, theme }),
        api.put(API_ROUTES.SETTINGS_INVENTORY, {
          lowStockThreshold: lowStock,
          expiryAlertDays: expiryDays,
          autoReorderEnabled: autoEscalationRef.current,
          immutableAudit: immutableAuditRef.current,
          outOfStockNotification: oosNotifRef.current,
          fifoEnabled: fifoEnfRef.current,
          reorderQuantityMultiplier: Math.round(reorderQtyRef.current / 10),
        }),
        api.put(API_ROUTES.SETTINGS_NOTIFICATIONS, {
          emailEnabled: notifEmail,
          inAppEnabled: notifInAppRef.current,
          smsEnabled: notifSmsRef.current,
          whatsappEnabled: notifWa,
          alertEmail: alertEmailRef.current
            ? alertEmailRef.current.trim()
            : null,
        }),
      ]);
      showToast("Global facility configuration synchronized", "success");
    } catch {
      showToast("Synchronization partial failure", "error");
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
          <h1>System Configuration</h1>
          <p>
            Orchestrate global clinical thresholds, manage enterprise licensing,
            and maintain architectural integrity.
          </p>
        </div>
        <div className="header-right">
          <button
            className="sys-btn-outline"
            onClick={() => setCurrentView("legal")}
          >
            <FileText size={16} /> Legal & Compliance
          </button>
          <button
            className="sys-btn-fill"
            onClick={handleSaveSettings}
            disabled={saving}
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
                className={`sys-toggle ${notifEmail ? "on" : ""}`}
                onClick={() => setNotifEmail(!notifEmail)}
                aria-label="Toggle Email notifications"
              >
                <div className="sys-toggle-thumb" />
              </button>
            </div>
            <div className="sys-toggle-row">
              <span className="sys-toggle-label">WhatsApp</span>
              <button
                type="button"
                className={`sys-toggle ${notifWa ? "on" : ""}`}
                onClick={() => setNotifWa(!notifWa)}
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
    </>
  );
}
