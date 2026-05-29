import { useState, useEffect } from "react";
import {
  RefreshCw,
  Save,
  ArrowLeft,
  MessageCircle,
  Activity,
  Zap,
  Clock,
  AlertTriangle,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../hooks/useAuth";
import { API_ROUTES } from "../constants/api.routes.js";
import SubscriptionCRUD from "./SubscriptionCRUD";
import "../styles/SystemSettings.css";

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
  const { subscription } = useAuth();
  const [currentView, setCurrentView] = useState("settings");
  const [saving, setSaving] = useState(false);
  const [gstin, setGstin] = useState("");
  const [bizName, setBizName] = useState("");
  const [gstState, setGstState] = useState("");
  const [filingFreq, setFilingFreq] = useState("Monthly");
  const [invPrefix, setInvPrefix] = useState("INV-");
  const [showLogo, setShowLogo] = useState(true);
  const [showDoctor, setShowDoctor] = useState(true);
  const [footerMsg, setFooterMsg] = useState(
    "Thank you for choosing Viyan Pharmacy. Get well soon!",
  );
  const [templateName, setTemplateName] = useState("DEFAULT_GST_TEMPLATE");
  const [paperSize, setPaperSize] = useState("A4");
  const [showQRCode, setShowQRCode] = useState(false);
  const [showHSNCode, setShowHSNCode] = useState(true);
  const [showExpiryDate, setShowExpiryDate] = useState(true);
  const [showGSTBreakdown, setShowGSTBreakdown] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [reorderQty, setReorderQty] = useState(50);
  const [autoEscalation, setAutoEscalation] = useState(true);
  const [immutableAudit, setImmutableAudit] = useState(false);
  const [oosNotif, setOosNotif] = useState(true);
  const [fifoEnf, setFifoEnf] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifWa, setNotifWa] = useState(false);
  const [alertEmail, setAlertEmail] = useState("");
  const [notifHistory, setNotifHistory] = useState([]);
  const [queueMetrics, setQueueMetrics] = useState(null);
  const [isOpsLoading, setIsOpsLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRes = await api.get(API_ROUTES.SETTINGS).catch(() => null);

        if (settingsRes?.data?.data) {
          const s = settingsRes.data.data;
          if (s.lowStock) setLowStock(s.lowStock);
          if (s.expiryDays) setExpiryDays(s.expiryDays);
          if (s.theme) setTheme(s.theme);

          if (s.inventory) {
            if (s.inventory.autoReorderEnabled !== undefined)
              setAutoEscalation(s.inventory.autoReorderEnabled);
            if (s.inventory.immutableAudit !== undefined)
              setImmutableAudit(s.inventory.immutableAudit);
            if (s.inventory.outOfStockNotification !== undefined)
              setOosNotif(s.inventory.outOfStockNotification);
            if (s.inventory.fifoEnabled !== undefined)
              setFifoEnf(s.inventory.fifoEnabled);
            if (s.inventory.reorderQuantityMultiplier)
              setReorderQty(s.inventory.reorderQuantityMultiplier * 10);
          }

          if (s.notifications) {
            if (s.notifications.emailEnabled !== undefined)
              setNotifEmail(s.notifications.emailEnabled);
            if (s.notifications.inAppEnabled !== undefined)
              setNotifInApp(s.notifications.inAppEnabled);
            if (s.notifications.smsEnabled !== undefined)
              setNotifSms(s.notifications.smsEnabled);
            if (s.notifications.whatsappEnabled !== undefined)
              setNotifWa(s.notifications.whatsappEnabled);
            if (s.notifications.alertEmail)
              setAlertEmail(s.notifications.alertEmail);
          }

          if (s.invoiceTemplate) {
            if (s.invoiceTemplate.invoicePrefix)
              setInvPrefix(s.invoiceTemplate.invoicePrefix);
            if (s.invoiceTemplate.showLogo !== undefined)
              setShowLogo(s.invoiceTemplate.showLogo);
            if (s.invoiceTemplate.showDoctorName !== undefined)
              setShowDoctor(s.invoiceTemplate.showDoctorName);
            if (s.invoiceTemplate.footerText)
              setFooterMsg(s.invoiceTemplate.footerText);
            if (s.invoiceTemplate.templateName)
              setTemplateName(s.invoiceTemplate.templateName);
            if (s.invoiceTemplate.paperSize)
              setPaperSize(s.invoiceTemplate.paperSize);
            if (s.invoiceTemplate.showQRCode !== undefined)
              setShowQRCode(s.invoiceTemplate.showQRCode);
            if (s.invoiceTemplate.showHSNCode !== undefined)
              setShowHSNCode(s.invoiceTemplate.showHSNCode);
            if (s.invoiceTemplate.showExpiryDate !== undefined)
              setShowExpiryDate(s.invoiceTemplate.showExpiryDate);
            if (s.invoiceTemplate.showGSTBreakdown !== undefined)
              setShowGSTBreakdown(s.invoiceTemplate.showGSTBreakdown);
            if (s.invoiceTemplate.logoUrl)
              setLogoUrl(s.invoiceTemplate.logoUrl);
          }

          if (s.storeProfile) {
            if (s.storeProfile.gstin) setGstin(s.storeProfile.gstin);
            if (s.storeProfile.businessName)
              setBizName(s.storeProfile.businessName);
            if (s.storeProfile.state) setGstState(s.storeProfile.state);
            if (s.storeProfile.filingFrequency)
              setFilingFreq(s.storeProfile.filingFrequency);
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    loadSettings();
  }, [setExpiryDays, setLowStock, setTheme]);

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
      console.error(err);
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
          autoReorderEnabled: autoEscalation,
          immutableAudit: immutableAudit,
          outOfStockNotification: oosNotif,
          fifoEnabled: fifoEnf,
          reorderQuantityMultiplier: Math.round(reorderQty / 10),
        }),
        api.put(API_ROUTES.SETTINGS_NOTIFICATIONS, {
          emailEnabled: notifEmail,
          inAppEnabled: notifInApp,
          smsEnabled: notifSms,
          whatsappEnabled: notifWa,
          alertEmail: alertEmail,
        }),
        api.put(API_ROUTES.SETTINGS_INVOICE_TEMPLATE, {
          templateName,
          paperSize,
          invoicePrefix: invPrefix,
          showLogo,
          showDoctorName: showDoctor,
          showQRCode,
          showHSNCode,
          showExpiryDate,
          showGSTBreakdown,
          logoUrl: logoUrl || null,
          footerText: footerMsg,
        }),
        api.put(API_ROUTES.SETTINGS_STORE_PROFILE, {
          gstin: gstin || null,
          businessName: bizName,
          state: gstState,
          filingFrequency: filingFreq,
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
       <button className="sys-btn-outline" onClick={() => setCurrentView("settings")} style={{ border: "none", padding: 0, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Facility Control
       </button>
       
       <div className="sub-view-header">
          <h2>Communication & Queue Operations</h2>
          <p>Real-time delivery orchestration and messaging reliability control.</p>
       </div>

       <div className="ops-metrics-grid">
          {queueMetrics && Object.entries(queueMetrics).map(([name, m]) => (
             <div key={name} className="queue-stat-card">
                <div className="q-head">
                   <Zap size={14} color="var(--primary)" />
                   <span>{name.toUpperCase()} QUEUE</span>
                </div>
                <div className="q-val-row">
                   <div className="q-val"><b>{m.waiting}</b> <small>WAITING</small></div>
                   <div className="q-val"><b>{m.active}</b> <small>ACTIVE</small></div>
                   <div className="q-val danger"><b>{m.failed}</b> <small>FAILED</small></div>
                </div>
             </div>
          ))}
       </div>

       <div className="sys-card" style={{ marginTop: 24 }}>
          <div className="sys-card-header">
             <h3 className="sys-card-title"><MessageCircle size={18} /> Delivery Timeline</h3>
             <button className="micro-btn" onClick={refreshOpsData} disabled={isOpsLoading}><RefreshCw size={14} /></button>
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
                {notifHistory.map(n => (
                   <tr key={n.id}>
                      <td>{n.recipient}</td>
                      <td><span className="badge-secondary">{n.channel}</span></td>
                      <td><span className={`p-status ${n.deliveryStatus.toLowerCase()}`}>{n.deliveryStatus}</span></td>
                      <td>{new Date(n.createdAt).toLocaleTimeString()}</td>
                      <td>
                         {n.deliveryStatus === 'FAILED' && (
                            <button className="micro-btn-teal" onClick={() => handleRetry(n.id)}>RETRY</button>
                         )}
                      </td>
                   </tr>
                ))}
                {notifHistory.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>No delivery events in current cycle.</td></tr>}
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
          <p>Orchestrate global clinical thresholds, manage enterprise licensing, and maintain architectural integrity.</p>
        </div>
        <div className="header-right">
          <button className="sys-btn-outline" onClick={() => setCurrentView("ops")}>
            <Activity size={16} /> Ops Console
          </button>
          <button className="sys-btn-fill" onClick={handleSaveSettings} disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Apply Changes"}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-col">
          <div className="sys-card">
            <div className="sys-card-header">
              <h3 className="sys-card-title">✦ Enterprise Licensing</h3>
              <div className={`sys-chip ${subscription?.status?.toLowerCase() || "pending"}`}>{subscription?.status || "PENDING"}</div>
            </div>
            <div className="enterprise-grad-card" onClick={() => setCurrentView("subscription")}>
              {subscription?.isTrial && (
                <>
                  <div className="ent-label">Free Trial</div>
                  <div className="ent-price" style={{ fontSize: 14, fontWeight: 400 }}>
                    <Clock size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    {subscription.daysRemaining} days remaining
                  </div>
                </>
              )}
              {!subscription?.isTrial && subscription?.status === "ACTIVE" && (
                <>
                  <div className="ent-label">{subscription.planName || "Active Plan"}</div>
                  <div className="ent-price">₹{subscription.price}/mo</div>
                </>
              )}
              {!subscription?.isTrial && subscription?.status === "EXPIRED" && (
                <>
                  <div className="ent-label" style={{ color: "var(--danger)" }}>Trial Expired</div>
                  <div className="ent-price" style={{ fontSize: 14, fontWeight: 400 }}>
                    <AlertTriangle size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    Renew to continue
                  </div>
                </>
              )}
              {(!subscription || subscription?.status === "PENDING") && (
                <>
                  <div className="ent-label">No Plan</div>
                  <div className="ent-price" style={{ fontSize: 14, fontWeight: 400 }}>Select a plan to get started</div>
                </>
              )}
            </div>
            <button className="sys-btn-outline" style={{ width: "100%", marginTop: 16 }} onClick={() => setCurrentView("subscription")}>
              Manage Plan
            </button>
          </div>

          <div className="sys-card">
            <div className="sys-card-header"><h3 className="sys-card-title">⊙ Visual Workspace</h3></div>
            <div className="theme-selector">
              <button className={`theme-btn ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>☀ LIGHT</button>
              <button className={`theme-btn ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>🌙 DARK</button>
            </div>
          </div>

          <div className="sys-card">
            <div className="sys-card-header"><h3 className="sys-card-title">$ GST Configuration</h3></div>
            <div className="sys-form-group"><label className="sys-label">GSTIN NUMBER</label><input className="sys-input" value={gstin} onChange={e => setGstin(e.target.value)} /></div>
            <div className="sys-form-group"><label className="sys-label">BUSINESS NAME</label><input className="sys-input" value={bizName} onChange={e => setBizName(e.target.value)} /></div>
          </div>
        </div>

        <div className="settings-col">
          <div className="sys-card">
            <div className="sys-card-header"><h3 className="sys-card-title">⚡ Clinical Thresholds</h3></div>
            <div className="sys-slider-group">
              <div className="sys-slider-header"><label className="sys-label">LOW STOCK LIMIT</label><div className="sys-badge">{lowStock} UNITS</div></div>
              <input type="range" className="sys-slider" min="1" max="100" value={lowStock} onChange={e => setLowStock(Number(e.target.value))} />
            </div>
            <div className="sys-slider-group">
              <div className="sys-slider-header"><label className="sys-label">EXPIRY WINDOW</label><div className="sys-badge">{expiryDays} DAYS</div></div>
              <input type="range" className="sys-slider" min="7" max="180" value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))} />
            </div>
          </div>

          <div className="sys-card">
            <h3 className="sys-card-title" style={{ marginBottom: 16 }}>🔔 Notification Channels</h3>
            <div className="sys-toggle-row"><span className="sys-toggle-label">Email</span><div className={`sys-toggle ${notifEmail ? "on" : ""}`} onClick={() => setNotifEmail(!notifEmail)}><div className="sys-toggle-thumb" /></div></div>
            <div className="sys-toggle-row"><span className="sys-toggle-label">WhatsApp</span><div className={`sys-toggle ${notifWa ? "on" : ""}`} onClick={() => setNotifWa(!notifWa)}><div className="sys-toggle-thumb" /></div></div>
          </div>

          <div className="sys-card">
            <div className="sys-card-header"><h3 className="sys-card-title">ⓘ Facility Status</h3></div>
            <div className="ent-info-row">
               <div className="ent-info-item"><label>DATABASE</label><span style={{ color: "var(--sys-teal)" }}>SYNCED</span></div>
               <div className="ent-info-item"><label>REGION</label><span>IN-WEST-1</span></div>
            </div>
          </div>
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
            <button className="sys-btn-outline" onClick={() => setCurrentView("settings")} style={{ border: "none", padding: 0, marginBottom: 24, background: "transparent" }}>
               <ArrowLeft size={16} /> Back to Facility Control
            </button>
            <SubscriptionCRUD 
              user={user} 
              showToast={showToast} 
              onActivate={onActivate} 
            />
         </div>
      )}
    </>
  );
}