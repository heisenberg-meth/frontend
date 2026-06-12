import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.service";
import {
  Activity, Server, Database, HardDrive, Users, ShoppingCart,
  CreditCard, Monitor, Ticket, CheckCircle, AlertTriangle, XCircle,
} from "lucide-react";

export default function AdminSystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSystemHealth();
      if (res.success) setHealth(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHealth(); }, []);

  if (loading) return <div className="admin-loading-inline">Loading system health...</div>;
  if (!health) return <div className="admin-loading-inline">Failed to load</div>;

  const statusIcon = health.status === "healthy" ? CheckCircle : health.status === "degraded" ? AlertTriangle : XCircle;
  const statusColor = health.status === "healthy" ? "#22c55e" : health.status === "degraded" ? "#f59e0b" : "#ef4444";
  const StatusIcon = statusIcon;

  const statCards = [
    { label: "Tenants", value: health.counts.tenants, icon: ShoppingCart, color: "#3b82f6" },
    { label: "Users", value: health.counts.users, icon: Users, color: "#22c55e" },
    { label: "Subscriptions", value: health.counts.subscriptions, icon: CreditCard, color: "#8b5cf6" },
    { label: "Payments", value: health.counts.payments, icon: CreditCard, color: "#f59e0b" },
    { label: "Devices", value: health.counts.devices, icon: Monitor, color: "#6366f1" },
    { label: "Open Tickets", value: health.counts.openTickets, icon: Ticket, color: "#ef4444" },
  ];

  return (
    <div className="admin-page">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}><Activity size={20} /> System Health</h2>
        <span style={{
          display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20,
          background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44`,
          fontSize: 13, fontWeight: 600,
        }}>
          <StatusIcon size={14} /> {health.status.toUpperCase()}
        </span>
        <button onClick={fetchHealth} className="admin-btn" style={{ background: "#222", color: "#fff", padding: "6px 14px", fontSize: 12, marginLeft: "auto" }}>
          <Activity size={14} /> Refresh
        </button>
      </div>

      <div className="admin-dashboard-stats" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: "#3b82f6" }}><Server size={24} /></div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{health.uptime}</span>
            <span className="admin-stat-label">Uptime</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: health.database.status === "healthy" ? "#22c55e" : "#ef4444" }}><Database size={24} /></div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{health.database.status}</span>
            <span className="admin-stat-label">Database ({health.database.latency}ms)</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: "#f59e0b" }}><HardDrive size={24} /></div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{health.memory.heapUsed}</span>
            <span className="admin-stat-label">Heap Used</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: "#8b5cf6" }}><HardDrive size={24} /></div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{health.memory.rss}</span>
            <span className="admin-stat-label">RSS Memory</span>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-section" style={{ marginTop: 32 }}>
        <h3>System Counts</h3>
        <div className="admin-dashboard-stats" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="admin-stat-card" style={{ padding: "12px 16px" }}>
                <div className="admin-stat-icon" style={{ color: card.color }}><Icon size={20} /></div>
                <div className="admin-stat-body">
                  <span className="admin-stat-value" style={{ fontSize: 18 }}>{card.value}</span>
                  <span className="admin-stat-label">{card.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}