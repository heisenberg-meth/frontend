import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.service";
import {
  Building2, Users, CreditCard, Monitor, AlertTriangle, DollarSign, TrendingUp, ShieldCheck,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboardStats()
      .then((res) => { if (res.success) setStats(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading-inline">Loading dashboard...</div>;
  if (!stats) return <div className="admin-loading-inline">Failed to load stats</div>;

  const cards = [
    { label: "Total Shops", value: stats.tenants.total, icon: Building2, color: "#4fdbc8" },
    { label: "Active Shops", value: stats.tenants.active, icon: Building2, color: "#22c55e" },
    { label: "Suspended", value: stats.tenants.suspended, icon: AlertTriangle, color: "#ef4444" },
    { label: "Total Users", value: stats.users.total, icon: Users, color: "#3b82f6" },
    { label: "Total Admins", value: stats.admins.total, icon: ShieldCheck, color: "#8b5cf6" },
    { label: "Active Subs", value: stats.subscriptions.active, icon: CreditCard, color: "#22c55e" },
    { label: "Expired Subs", value: stats.subscriptions.expired, icon: CreditCard, color: "#ef4444" },
    { label: "Today Reg.", value: stats.todaysRegistrations, icon: TrendingUp, color: "#f59e0b" },
    { label: "Devices", value: stats.devices.total, icon: Monitor, color: "#6366f1" },
    { label: "Blocked Dev.", value: stats.devices.blocked, icon: Monitor, color: "#dc2626" },
    { label: "Revenue", value: `₹${Number(stats.revenue).toLocaleString()}`, icon: DollarSign, color: "#10b981" },
  ];

  const getRoleBadge = (role) => {
    const colors = { ROOT_ADMIN: "#ef4444", ADMIN: "#3b82f6", SUPPORT: "#22c55e", SALES: "#f59e0b", FINANCE: "#8b5cf6" };
    return <span className="admin-badge" style={{ background: colors[role] || "#666" }}>{role}</span>;
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-stats">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="admin-stat-card">
              <div className="admin-stat-icon" style={{ color: card.color }}>
                <Icon size={24} />
              </div>
              <div className="admin-stat-body">
                <span className="admin-stat-value">{card.value}</span>
                <span className="admin-stat-label">{card.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-dashboard-section">
        <h3>Recent Activity</h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Target</th>
                <th>Admin</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentLogs?.length > 0 ? stats.recentLogs.map((log) => (
                <tr key={log.id}>
                  <td><span className="admin-badge">{log.action}</span></td>
                  <td>{log.targetType} / {log.targetId?.slice(0, 8)}</td>
                  <td>{log.adminUserId?.slice(0, 8)}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="admin-empty">No recent activity</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
