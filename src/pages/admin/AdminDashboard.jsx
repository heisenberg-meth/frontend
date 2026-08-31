import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../services/admin.service";
import {
  Building2,
  Monitor,
  AlertTriangle,
  DollarSign,
  Clock,
} from "lucide-react";
import { safeNumber } from "../../utils/number.js";
import { lazy, Suspense } from "react";

const LazyAdminCharts = lazy(() =>
  import("recharts").then((m) => ({
    default: function Charts({ trends, ChartTooltip }) {
      return (
        <div className="admin-charts-grid">
          <div className="admin-card">
            <h4 style={{ marginBottom: 12, fontSize: 14 }}>
              Daily Registrations (30 days)
            </h4>
            <m.ResponsiveContainer width="100%" height={200}>
              <m.AreaChart data={trends.daily}>
                <m.CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <m.XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#666" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <m.YAxis
                  tick={{ fontSize: 10, fill: "#666" }}
                  allowDecimals={false}
                />
                <m.Tooltip content={<ChartTooltip />} />
                <m.Area
                  type="monotone"
                  dataKey="registrations"
                  name="Registrations"
                  stroke="#22c55e"
                  fill="#22c55e33"
                />
              </m.AreaChart>
            </m.ResponsiveContainer>
          </div>

          <div className="admin-card">
            <h4 style={{ marginBottom: 12, fontSize: 14 }}>Monthly Revenue</h4>
            <m.ResponsiveContainer width="100%" height={200}>
              <m.BarChart data={trends.monthlyRevenue}>
                <m.CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <m.XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#666" }}
                />
                <m.YAxis
                  tick={{ fontSize: 10, fill: "#666" }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <m.Tooltip content={<ChartTooltip />} />
                <m.Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </m.BarChart>
            </m.ResponsiveContainer>
          </div>

          <div className="admin-card">
            <h4 style={{ marginBottom: 12, fontSize: 14 }}>
              Shop & Subscription Growth
            </h4>
            <m.ResponsiveContainer width="100%" height={200}>
              <m.LineChart data={trends.daily}>
                <m.CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <m.XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#666" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <m.YAxis
                  tick={{ fontSize: 10, fill: "#666" }}
                  allowDecimals={false}
                />
                <m.Tooltip content={<ChartTooltip />} />
                <m.Line
                  type="monotone"
                  dataKey="totalShops"
                  name="Shops"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={2}
                />
                <m.Line
                  type="monotone"
                  dataKey="totalSubscriptions"
                  name="Subscriptions"
                  stroke="#22c55e"
                  dot={false}
                  strokeWidth={2}
                />
              </m.LineChart>
            </m.ResponsiveContainer>
          </div>

          <div className="admin-card">
            <h4 style={{ marginBottom: 12, fontSize: 14 }}>
              Active Users Trend
            </h4>
            <m.ResponsiveContainer width="100%" height={200}>
              <m.AreaChart data={trends.daily}>
                <m.CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <m.XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#666" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <m.YAxis
                  tick={{ fontSize: 10, fill: "#666" }}
                  allowDecimals={false}
                />
                <m.Tooltip content={<ChartTooltip />} />
                <m.Area
                  type="monotone"
                  dataKey="activeUsers"
                  name="New Users"
                  stroke="#8b5cf6"
                  fill="#8b5cf633"
                />
              </m.AreaChart>
            </m.ResponsiveContainer>
          </div>
        </div>
      );
    },
  })),
);

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#222",
          border: "1px solid #333",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 12,
        }}
      >
        <p style={{ color: "#888", marginBottom: 4 }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color, margin: 0 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const [statsRes, trendsRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getDashboardTrends(),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchDashboardData());
  }, [fetchDashboardData]);

  if (loading)
    return <div className="admin-loading-inline">Loading dashboard...</div>;
  if (!stats)
    return <div className="admin-loading-inline">Failed to load stats</div>;

  const cards = [
    {
      label: "Total Shops",
      value: stats.tenants.total,
      icon: Building2,
      color: "#4fdbc8",
    },
    {
      label: "Active Shops",
      value: stats.tenants.active,
      icon: Building2,
      color: "#22c55e",
    },
    {
      label: "Expiring (7d)",
      value: stats.expiringSubscriptions || 0,
      icon: Clock,
      color: "#f59e0b",
    },
    {
      label: "Failed Logins",
      value: stats.failedLoginAttempts24h || 0,
      icon: AlertTriangle,
      color: "#ef4444",
    },
    {
      label: "Revenue (MTD)",
      value: `₹${safeNumber(stats.revenue).toLocaleString()}`,
      icon: DollarSign,
      color: "#10b981",
    },
    {
      label: "Devices",
      value: stats.devices.total,
      icon: Monitor,
      color: "#6366f1",
    },
    {
      label: "Blocked Dev.",
      value: stats.devices.blocked,
      icon: Monitor,
      color: "#dc2626",
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-stats">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="admin-stat-card">
              <div className="admin-stat-icon" style={{ color: card.color }}>
                <Icon size={22} />
              </div>
              <div className="admin-stat-body">
                <span className="admin-stat-value">{card.value}</span>
                <span className="admin-stat-label">{card.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {trends && (
        <Suspense
          fallback={
            <div className="admin-loading-inline">Loading charts...</div>
          }
        >
          <LazyAdminCharts trends={trends} ChartTooltip={ChartTooltip} />
        </Suspense>
      )}

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
              {stats.recentLogs?.length > 0 ? (
                stats.recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="admin-badge">{log.action}</span>
                    </td>
                    <td>
                      {log.targetType} / {log.targetId?.slice(0, 8)}
                    </td>
                    <td>{log.adminUserId?.slice(0, 8)}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="admin-empty">
                    No recent activity
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
