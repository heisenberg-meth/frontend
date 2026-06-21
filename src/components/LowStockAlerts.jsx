import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Download,
  X,
  Bell,
  MessageCircle,
  Mail,
  Phone,
  ClipboardList,
  ChevronRight,
  Zap,
  Package,
  Loader2,
} from "lucide-react";
import { getLowStockMedicines } from "../services/inventory.service";
import { getStockAlerts } from "../services/stock.service";
import { createPurchaseOrder } from "../services/purchases.service";
import { updateNotificationSettings } from "../services/settings.service";
import { safeNumber } from "../utils/number.js";

function Spinner({ size = 14 }) {
  return (
    <Loader2 size={size} style={{ animation: "spin 0.8s linear infinite" }} />
  );
}

const URGENCY_COLORS = {
  critical: "var(--danger)",
  low: "var(--warning)",
  medium: "var(--info)",
};

/* ── PO Modal ── */
function POModal({ supplier, onClose, onSuccess, saving }) {
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!qty) return;
    onSuccess(supplier, qty, note);
  };

  return (
    <div className="lsa-modal-overlay" onClick={onClose}>
      <div className="lsa-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="lsa-modal-header">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClipboardList size={17} style={{ color: "var(--primary)" }} />
            Create PO — {supplier.name}
          </h3>
          <button className="lsa-modal-close" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="lsa-modal-body">
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--outline-variant)",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 10,
              }}
            >
              Items to Reorder
            </div>
            {supplier.items.map((item) => (
              <div
                key={item.name || item.drug}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--outline-variant)",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {item.name || item.drug}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: URGENCY_COLORS[item.urgency || "low"],
                    fontWeight: 700,
                  }}
                >
                  {item.quantity || item.stock} left
                </span>
              </div>
            ))}
          </div>
          <div className="lsa-modal-field">
            <label className="lsa-modal-label">
              Order Quantity (units each)
            </label>
            <input
              required
              className="lsa-modal-input"
              type="number"
              min="1"
              placeholder="e.g. 200"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="lsa-modal-field">
            <label className="lsa-modal-label">Notes (optional)</label>
            <input
              required
              className="lsa-modal-input"
              placeholder="Priority delivery required…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="lsa-modal-actions">
          <button
            className="lsa-btn-outline"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="lsa-btn-primary"
            style={{ flex: 1 }}
            onClick={submit}
            disabled={saving || !qty}
          >
            {saving ? (
              "Raising PO…"
            ) : (
              <>
                <ClipboardList size={14} /> Raise PO
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Supplier Group Card ── */
function SupplierCard({ supplier, onCreatePO }) {
  return (
    <div className={`lsa-group-card ${supplier.severity}`}>
      <div className="lsa-group-header">
        <div className="lsa-group-header-left">
          <div
            className="lsa-supplier-icon"
            style={{
              background:
                supplier.severity === "critical"
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(245,158,11,0.1)",
              color:
                supplier.severity === "critical"
                  ? "var(--danger)"
                  : "var(--warning)",
            }}
          >
            {supplier.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="lsa-supplier-name">{supplier.name}</div>
            <div className="lsa-supplier-contact">
              <Phone size={11} /> {supplier.contact}
              <span style={{ opacity: 0.3 }}>·</span>
              <Mail size={11} /> {supplier.email}
            </div>
          </div>
        </div>
        <div className="lsa-group-header-right">
          <span className={`lsa-item-count ${supplier.severity}`}>
            {supplier.items.length} item{supplier.items.length > 1 ? "s" : ""}
          </span>
          <button
            className="lsa-create-po-btn"
            onClick={() => onCreatePO(supplier)}
          >
            <ClipboardList size={13} /> Create PO
          </button>
        </div>
      </div>
      <table className="lsa-mini-table">
        <thead>
          <tr>
            {[
              "Drug Name",
              "Current Stock",
              "Min Threshold",
              "Days to Stockout",
              "Urgency",
              "Action",
            ].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {supplier.items.map((item) => (
            <tr key={item.name || item.drug}>
              <td>
                <div className="lsa-drug-name">
                  <div
                    className="lsa-drug-dot"
                    style={{
                      background: URGENCY_COLORS[item.urgency || "low"],
                    }}
                  />
                  {item.name || item.drug}
                </div>
              </td>
              <td>
                <span className={`lsa-stock-val ${item.urgency || "low"}`}>
                  {item.stock}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginLeft: 4,
                  }}
                >
                  units
                </span>
              </td>
              <td>
                <span className="lsa-threshold">
                  {item.reorderLevel ?? 10} units
                </span>
              </td>
              <td>
                <span
                  className={`lsa-stockout ${item.daysToStockout <= 2 ? "urgent" : ""}`}
                >
                  ~{item.daysToStockout || 3} day
                  {(item.daysToStockout || 3) !== 1 ? "s" : ""}
                </span>
              </td>
              <td>
                <span className={`lsa-urgency ${item.urgency || "low"}`}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: URGENCY_COLORS[item.urgency || "low"],
                      display: "inline-block",
                    }}
                  />
                  {(item.urgency || "low").toUpperCase()}
                </span>
              </td>
              <td>
                <button
                  className="lsa-reorder-btn"
                  onClick={() => onCreatePO(supplier)}
                >
                  Reorder
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Notification Settings Card ── */
function NotifySettings({ showToast, settings }) {
  const [wa, setWa] = useState(
    settings?.notificationChannels?.whatsapp ?? true,
  );
  const [sms, setSms] = useState(settings?.notificationChannels?.sms ?? false);
  const [email, setEmail] = useState(
    settings?.notificationChannels?.email ?? true,
  );
  const [phone, setPhone] = useState(settings?.alertPhone || "+91 98765 43210");
  const [smsPhone, setSmsPhone] = useState(settings?.smsPhone || settings?.alertPhone || "+91 98765 43210");
  const [mail, setMail] = useState(
    settings?.alertEmail || "admin@viyanmedassist.in",
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationSettings({
        notificationChannels: {
          whatsapp: wa,
          sms,
          email,
          inApp: true,
          digest: email,
        },
        alertEmail: mail,
        alertPhone: phone,
      });
      showToast("Notification settings saved", "success");
    } catch {
      showToast("Failed to save notification settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lsa-notify-card">
      <div className="lsa-notify-header">
        <Bell size={17} style={{ color: "var(--primary)" }} />
        <h2>Alert Notification Settings</h2>
      </div>
      <div className="lsa-notify-body">
        <div className="lsa-notify-row">
          <div className="lsa-notify-toggle-group">
            <label className="lsa-toggle-label">
              <div className="lsa-toggle">
                <input
                  required
                  type="checkbox"
                  checked={wa}
                  onChange={(e) => setWa(e.target.checked)}
                />
                <div className="lsa-toggle-slider" />
              </div>
              <div>
                <div
                  className="lsa-toggle-text"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <MessageCircle
                    size={14}
                    style={{ color: "var(--success)" }}
                  />{" "}
                  WhatsApp Alert
                </div>
                <div className="lsa-toggle-sub">
                  Instant low-stock notification
                </div>
              </div>
            </label>
          </div>
          <input
            required
            className="lsa-notify-input"
            placeholder="WhatsApp phone number"
            value={phone}
            disabled={!wa}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="lsa-notify-row">
          <div className="lsa-notify-toggle-group">
            <label className="lsa-toggle-label">
              <div className="lsa-toggle">
                <input
                  required
                  type="checkbox"
                  checked={sms}
                  onChange={(e) => setSms(e.target.checked)}
                />
                <div className="lsa-toggle-slider" />
              </div>
              <div>
                <div
                  className="lsa-toggle-text"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Phone size={14} style={{ color: "var(--info)" }} /> SMS Alert
                </div>
                <div className="lsa-toggle-sub">
                  Text message to registered mobile
                </div>
              </div>
            </label>
          </div>
          <input
            required
            className="lsa-notify-input"
            placeholder="SMS phone number"
            value={smsPhone}
            disabled={!sms}
            onChange={(e) => setSmsPhone(e.target.value)}
          />
        </div>
        <div className="lsa-notify-row">
          <div className="lsa-notify-toggle-group">
            <label className="lsa-toggle-label">
              <div className="lsa-toggle">
                <input
                  required
                  type="checkbox"
                  checked={email}
                  onChange={(e) => setEmail(e.target.checked)}
                />
                <div className="lsa-toggle-slider" />
              </div>
              <div>
                <div
                  className="lsa-toggle-text"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Mail size={14} style={{ color: "var(--warning)" }} /> Email
                  Digest
                </div>
                <div className="lsa-toggle-sub">Daily summary at 8:00 AM</div>
              </div>
            </label>
          </div>
          <input
            required
            className="lsa-notify-input"
            type="email"
            placeholder="Email address"
            value={mail}
            disabled={!email}
            onChange={(e) => setMail(e.target.value)}
          />
          <button
            className="lsa-notify-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner size={12} /> Saving
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──══════════ MAIN COMPONENT ══════════ ── */
export default function LowStockAlerts({ showToast }) {
  const navigate = useNavigate();
  const [activeTab, setTab] = useState("all");
  const [poSupplier, setPO] = useState(null);
  const [reordering, setReord] = useState(false);
  const [poSaving, setPoSaving] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);

        const [lowStockRes, settingsRes] = await Promise.all([
          getLowStockMedicines(),
          getStockAlerts(),
        ]);

        if (!mounted) return;

        const lowStockData = lowStockRes.data.data || lowStockRes.data;

        const items = Array.isArray(lowStockData) ? lowStockData : [];

        const grouped = {};

        items.forEach((item) => {
          const supName =
            item.supplierName || item.supplier || "Unknown Supplier";

          if (!grouped[supName]) {
            grouped[supName] = {
              supplierId: item.supplierId || null,
              name: supName,
              contact: item.supplierPhone || "",
              email: item.supplierEmail || "",
              severity: "low",
              items: [],
            };
          }

          const currentQty = item.stock ?? 0;
          const reorderPt = item.reorderLevel ?? 10;

          const urgency =
            currentQty === 0 || currentQty <= reorderPt / 2
              ? "critical"
              : "low";

          grouped[supName].items.push({
            ...item,
            urgency,
          });

          if (urgency === "critical") {
            grouped[supName].severity = "critical";
          }
        });

        setLowStockItems(Object.values(grouped));

        const settingsData = settingsRes.data.data || settingsRes.data;

        if (settingsData?.notificationSettings) {
          setNotificationSettings(settingsData.notificationSettings);
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to load stock alerts", "error");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  const filteredSuppliers = lowStockItems
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => {
        if (activeTab === "all") return true;
        if (activeTab === "critical") return item.urgency === "critical";
        if (activeTab === "low") return item.urgency === "low";
        if (activeTab === "expiring") return item.daysToStockout <= 3;
        return true;
      }),
    }))
    .filter((s) => s.items.length > 0);

  const totalCritical = lowStockItems
    .flatMap((s) => s.items)
    .filter((i) => i.urgency === "critical").length;
  const totalLow = lowStockItems
    .flatMap((s) => s.items)
    .filter((i) => i.urgency === "low").length;

  const handleAutoReorder = async () => {
    setReord(true);
    try {
      const criticalItems = lowStockItems
        .flatMap((s) => s.items)
        .filter((i) => i.urgency === "critical");

      if (criticalItems.length > 0) {
        // Group items by supplierId
        const itemsBySupplier = {};
        criticalItems.forEach((item) => {
          const sId = item.supplierId || "unknown";
          if (!itemsBySupplier[sId]) {
            itemsBySupplier[sId] = [];
          }
          itemsBySupplier[sId].push(item);
        });

        // Create a PO for each supplier
        const promises = Object.entries(itemsBySupplier).map(
          async ([supplierId, items]) => {
            if (supplierId === "unknown" || !supplierId) return;

            const mappedItems = items.map((i) => ({
              medicineId: i.id,
              quantity: i.reorderLevel || 50,
              purchasePrice: i.purchaseCost || 0,
            }));

            const subtotal = mappedItems.reduce(
              (acc, i) => acc + i.quantity * i.purchasePrice,
              0,
            );

            await createPurchaseOrder({
              supplierId,
              items: mappedItems,
              subtotal,
              totalAmount: subtotal,
              notes: "Auto-reorder for critical low stock items",
            });
          },
        );

        await Promise.all(promises);
        showToast("Auto-reorder initiated for critical items ✓", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to auto-reorder", "error");
    } finally {
      setReord(false);
    }
  };

  const handleExport = () => {
    const rows = [
      ["Supplier", "Drug Name", "Current Stock", "Min Threshold", "Urgency"],
      ...lowStockItems.flatMap((s) =>
        s.items.map((i) => [
          s.name,
          i.name,
          i.quantity,
          i.reorderLevel || 10,
          i.urgency,
          i.purchaseCost || 0,
        ]),
      ),
    ]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "low_stock_alerts.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Alert list exported", "success");
  };

  const handleCreatePO = async (supplier, qty, note) => {
    setPoSaving(true);
    try {
      const items = supplier.items.map((i) => ({
        medicineId: i.id,
        quantity: safeNumber(qty),
        purchasePrice: i.purchaseCost || 0,
      }));
      const subtotal = items.reduce(
        (acc, i) => acc + i.quantity * i.purchasePrice,
        0,
      );

      await createPurchaseOrder({
        supplierId: supplier.supplierId,
        items,
        subtotal,
        totalAmount: subtotal,
        notes: note,
      });
      showToast(`Purchase Order raised for ${supplier.name}`, "success");
      setPO(null);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to create PO", "error");
    } finally {
      setPoSaving(false);
    }
  };

  return (
    <div className="lsa-container">
      <div className="lsa-breadcrumb">
        <button
          className="lsa-breadcrumb-item"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>
        <span className="lsa-breadcrumb-sep">/</span>
        <button
          className="lsa-breadcrumb-item"
          onClick={() => navigate("/stock")}
        >
          Inventory
        </button>
        <span className="lsa-breadcrumb-sep">/</span>
        <span className="lsa-breadcrumb-item active">Low Stock Alerts</span>
      </div>

      <div className="lsa-header">
        <div className="lsa-title-group">
          <h1>
            <AlertTriangle size={32} style={{ color: "var(--warning)" }} /> Low
            Stock Alerts
          </h1>
          <p>
            Real-time stock breach notifications grouped by supplier for
            efficient reordering.
          </p>
        </div>
        <div className="lsa-header-actions">
          <button className="lsa-btn-outline" onClick={handleExport}>
            <Download size={15} /> Export CSV
          </button>
          <button
            className="lsa-btn-primary"
            onClick={handleAutoReorder}
            disabled={reordering}
          >
            <Zap size={15} />
            {reordering ? "Processing…" : "Auto-Reorder All"}
          </button>
        </div>
      </div>

      <div className="lsa-filter-bar">
        <div className="lsa-tabs">
          {[
            {
              key: "all",
              label: "All Alerts",
              badge: totalCritical + totalLow,
              cls: "all",
            },
            {
              key: "critical",
              label: "Critical",
              badge: totalCritical,
              cls: "critical",
            },
            { key: "low", label: "Low Stock", badge: totalLow, cls: "low" },
            {
              key: "expiring",
              label: "Expiring Soon",
              badge: 0,
              cls: "expiring",
            },
          ].map((t) => (
            <button
              key={t.key}
              className={`lsa-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className={`lsa-tab-badge ${t.cls}`}>{t.badge}</span>
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 11,
            color: "var(--text-muted)",
            fontWeight: 800,
            paddingRight: 16,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--primary)",
              boxShadow: "0 0 12px var(--primary)",
            }}
          />
          SYSTEM MONITOR: ONLINE
        </div>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 0",
            color: "var(--text-dim)",
          }}
        >
          <Spinner size={24} /> Loading stock alerts...
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div
          className="empty-state"
          style={{
            textAlign: "center",
            padding: "100px 0",
            background: "var(--overlay-02)",
            borderRadius: 24,
            border: "1px solid var(--outline-variant)",
          }}
        >
          <Package
            size={48}
            style={{
              opacity: 0.1,
              marginBottom: 16,
              display: "block",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            No low stock alerts match your current filter.
          </p>
        </div>
      ) : (
        <div className="lsa-groups">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.name}
              supplier={supplier}
              onCreatePO={(s) => setPO(s)}
            />
          ))}
        </div>
      )}

      <NotifySettings showToast={showToast} settings={notificationSettings} />

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button className="lsa-btn-outline" onClick={() => navigate("/stock")}>
          ← Return to Inventory
        </button>
        <button
          className="lsa-btn-outline"
          onClick={() => navigate("/purchases")}
        >
          View Active Purchase Orders <ChevronRight size={14} />
        </button>
      </div>

      {poSupplier && (
        <POModal
          supplier={poSupplier}
          onClose={() => setPO(null)}
          onSuccess={handleCreatePO}
          saving={poSaving}
        />
      )}
    </div>
  );
}
