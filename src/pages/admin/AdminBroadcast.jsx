import { useState } from "react";
import { adminApi } from "../../services/admin.service";
import { Send, Mail, MessageSquare, Globe, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminBroadcast() {
  const [channel, setChannel] = useState("EMAIL");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (planFilter) filters.plan = planFilter;
      const res = await adminApi.sendBroadcast({ channel, subject, message, filters });
      setResult(res);
    } catch (err) {
      setResult({ error: err.message || "Failed to send broadcast" });
    } finally {
      setSending(false);
    }
  };

  const channels = [
    { value: "EMAIL", label: "Email", icon: Mail },
    { value: "SMS", label: "SMS", icon: MessageSquare },
    { value: "WHATSAPP", label: "WhatsApp", icon: Globe },
  ];

  return (
    <div className="admin-page">
      <h2><Send size={20} /> Broadcast Center</h2>
      <p style={{ color: "#888", marginBottom: 24 }}>
        Send bulk messages to all or filtered shops
      </p>

      <form onSubmit={handleSend} style={{ maxWidth: 640 }}>
        <div className="admin-form-group">
          <label>Channel</label>
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            {channels.map((ch) => {
              const Icon = ch.icon;
              return (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => setChannel(ch.value)}
                  style={{
                    flex: 1, padding: "10px 16px", border: channel === ch.value ? "2px solid #22c55e" : "2px solid #333",
                    borderRadius: 8, background: channel === ch.value ? "#0a2e1a" : "transparent",
                    color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
                  }}
                >
                  <Icon size={18} /> {ch.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="admin-form-group">
          <label>Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line..."
            disabled={sending}
          />
        </div>

        <div className="admin-form-group">
          <label>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={6}
            required
            disabled={sending}
          />
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div className="admin-form-group" style={{ flex: 1 }}>
            <label>Status Filter (optional)</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} disabled={sending}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="admin-form-group" style={{ flex: 1 }}>
            <label>Plan Filter (optional)</label>
            <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} disabled={sending}>
              <option value="">All plans</option>
              <option value="FREE">Free</option>
              <option value="BASIC">Basic</option>
              <option value="PREMIUM">Premium</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
        </div>

        <button type="submit" className="admin-btn admin-btn-primary" style={{ marginTop: 16 }} disabled={sending || !message.trim()}>
          {sending ? "Sending..." : "Send Broadcast"}
        </button>
      </form>

      {result && (
        <div className="admin-alert" style={{ marginTop: 24, background: result.error ? "#3a0e0e" : "#0a2e1a", border: `1px solid ${result.error ? "#ef4444" : "#22c55e"}` }}>
          {result.error ? (
            <><AlertCircle size={18} style={{ color: "#ef4444" }} /> {result.error}</>
          ) : (
            <><CheckCircle size={18} style={{ color: "#22c55e" }} /> Sent to {result.sent} of {result.total} recipients{result.failed > 0 ? ` (${result.failed} failed)` : ""}</>
          )}
        </div>
      )}
    </div>
  );
}