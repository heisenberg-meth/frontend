import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../services/admin.service";
import {
  Clock,
  AlertTriangle,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function AdminExpiry() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(
    "Your subscription is expiring soon. Please renew to continue using ViyanMedassist without interruption.",
  );
  const [channel, setChannel] = useState("EMAIL");

  const fetchOverview = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const res = await adminApi.getExpiryOverview();
      if (res.success) setOverview(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchOverview());
  }, [fetchOverview]);

  const handleSend = async (period) => {
    setSending(true);
    setResult(null);
    try {
      const res = await adminApi.sendExpiryReminders({
        period,
        message,
        channel,
      });
      setResult(res);
    } catch (err) {
      setResult({ error: err.message || "Failed" });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="admin-loading-inline">Loading...</div>;

  const sections = [
    {
      period: "3days",
      label: "Expiring in 3 Days",
      data: overview?.expiringIn3Days,
      color: "#ef4444",
    },
    {
      period: "7days",
      label: "Expiring in 7 Days",
      data: overview?.expiringIn7Days,
      color: "#f59e0b",
    },
    {
      period: "15days",
      label: "Expiring in 15 Days",
      data: overview?.expiringIn15Days,
      color: "#3b82f6",
    },
    {
      period: "30days",
      label: "Expiring in 30 Days",
      data: overview?.expiringIn30Days,
      color: "#22c55e",
    },
    {
      period: "expired",
      label: "Already Expired",
      data: overview?.alreadyExpired,
      color: "#dc2626",
    },
  ];

  return (
    <div className="admin-page">
      <h2>
        <Clock size={20} /> Expiry Notification Center
      </h2>
      <p style={{ color: "#888", marginBottom: 24 }}>
        Active subscriptions: {overview?.activeTotal || 0}
      </p>

      {sections.map((section) => (
        <div
          key={section.period}
          className="admin-card"
          style={{ marginBottom: 16 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: 0,
              }}
            >
              <AlertTriangle size={16} style={{ color: section.color }} />
              {section.label}{" "}
              <span style={{ color: section.color, fontWeight: 700 }}>
                ({(section.data || []).length})
              </span>
            </h3>
            {(section.data || []).length > 0 && (
              <button
                className="admin-btn admin-btn-primary"
                style={{ padding: "6px 14px", fontSize: 12 }}
                onClick={() => handleSend(section.period)}
                disabled={sending}
              >
                <Send size={14} /> Send Reminder
              </button>
            )}
          </div>
          {!section.data || section.data.length === 0 ? (
            <p style={{ color: "#666", fontSize: 13 }}>
              No subscriptions in this bucket
            </p>
          ) : (
            <table className="admin-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Email</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {section.data.slice(0, 20).map((item) => (
                  <tr key={item.tenantId}>
                    <td>{item.shopName}</td>
                    <td>{item.email}</td>
                    <td>
                      {item.endDate
                        ? new Date(item.endDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      <div className="admin-card">
        <h3>Reminder Settings</h3>
        <div className="admin-form-group">
          <label>Channel</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
        <div className="admin-form-group">
          <label>Message Template</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>
      </div>

      {result && (
        <div
          className="admin-alert"
          style={{
            marginTop: 16,
            background: result.error ? "#3a0e0e" : "#0a2e1a",
            border: `1px solid ${result.error ? "#ef4444" : "#22c55e"}`,
          }}
        >
          {result.error ? (
            <>
              <AlertCircle size={18} style={{ color: "#ef4444" }} />{" "}
              {result.error}
            </>
          ) : (
            <>
              <CheckCircle size={18} style={{ color: "#22c55e" }} /> Sent to{" "}
              {result.sent} of {result.total} recipients
            </>
          )}
        </div>
      )}
    </div>
  );
}
