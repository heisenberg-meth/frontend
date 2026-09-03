import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../services/admin.service";
import { safeNumber } from "../../utils/number.js";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  BarChart3,
  RefreshCw,
  Users,
  Activity,
} from "lucide-react";
const formatCurrency = (val) => `₹${safeNumber(val).toLocaleString()}`;
function AdminStatCard({
  label,
  value,
  icon: Icon,
  color,
  padding,
  valueFontSize,
  iconSize = 20,
}) {
  return (
    <div className="admin-stat-card" style={padding ? { padding } : undefined}>
      <div
        className="admin-stat-icon"
        style={{
          color,
        }}
      >
        <Icon size={iconSize} />
      </div>
      <div className="admin-stat-body">
        <span
          className="admin-stat-value"
          style={valueFontSize ? { fontSize: valueFontSize } : undefined}
        >
          {value}
        </span>
        <span className="admin-stat-label">{label}</span>
      </div>
    </div>
  );
}

export default function AdminRevenue() {
  const [overview, setOverview] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchRevenueData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const [overviewRes, monthlyRes] = await Promise.all([
        adminApi.getRevenueOverview(),
        adminApi.getMonthlyRevenue(12),
      ]);
      if (overviewRes.success) setOverview(overviewRes.data);
      if (monthlyRes.success) setMonthly(monthlyRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    Promise.resolve().then(() => fetchRevenueData());
  }, [fetchRevenueData]);
  if (loading)
    return <div className="admin-loading-inline">Loading revenue data...</div>;
  if (!overview)
    return <div className="admin-loading-inline">Failed to load</div>;
  const cards = [
    {
      label: "MRR",
      value: formatCurrency(overview.mrr),
      icon: DollarSign,
      color: "#22c55e",
    },
    {
      label: "ARR",
      value: formatCurrency(overview.arr),
      icon: TrendingUp,
      color: "#3b82f6",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(overview.totalRevenue),
      icon: DollarSign,
      color: "#4fdbc8",
    },
    {
      label: "Total Transactions",
      value: overview.totalTransactions,
      icon: CreditCard,
      color: "#8b5cf6",
    },
  ];
  const metricCards = [
    {
      label: "MRR Growth",
      value: `${overview.mrrGrowth >= 0 ? "+" : ""}${overview.mrrGrowth.toFixed(1)}%`,
      icon: overview.mrrGrowth >= 0 ? TrendingUp : TrendingDown,
      color: overview.mrrGrowth >= 0 ? "#22c55e" : "#ef4444",
    },
    {
      label: "Churn Rate",
      value: `${overview.churnRate}%`,
      icon: Activity,
      color: overview.churnRate > 5 ? "#ef4444" : "#22c55e",
    },
    {
      label: "Renewal Rate",
      value: `${overview.renewalRate}%`,
      icon: RefreshCw,
      color: "#22c55e",
    },
    {
      label: "Conversion",
      value: `${overview.conversionRate}%`,
      icon: Users,
      color: "#3b82f6",
    },
  ];
  const subCards = [
    {
      label: "Total Subscriptions",
      value: overview.subscriptions.total,
      icon: CreditCard,
      color: "#6366f1",
    },
    {
      label: "Active",
      value: overview.subscriptions.active,
      icon: CreditCard,
      color: "#22c55e",
    },
    {
      label: "Expired",
      value: overview.subscriptions.expired,
      icon: CreditCard,
      color: "#ef4444",
    },
    {
      label: "Trial",
      value: overview.subscriptions.trial,
      icon: CreditCard,
      color: "#f59e0b",
    },
  ];
  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1);
  return (
    <div className="admin-page">
      <div className="admin-dashboard-stats">
        {cards.map((card) => (
          <AdminStatCard key={card.label} {...card} iconSize={24} />
        ))}
      </div>

      <div className="admin-dashboard-section">
        <h3>Key Metrics</h3>
        <div
          className="admin-dashboard-stats"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          }}
        >
          {metricCards.map((card) => (
            <AdminStatCard
              key={card.label}
              {...card}
              padding="12px 16px"
              valueFontSize={18}
            />
          ))}
        </div>
      </div>

      <div className="admin-dashboard-section">
        <h3>Subscriptions</h3>
        <div
          className="admin-dashboard-stats"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          }}
        >
          {subCards.map((card) => (
            <AdminStatCard
              key={card.label}
              {...card}
              padding="12px 16px"
              valueFontSize={18}
            />
          ))}
        </div>
      </div>

      {monthly.length > 0 && (
        <div className="admin-dashboard-section">
          <h3>
            <BarChart3 size={16} /> Monthly Revenue (12 months)
          </h3>
          <div className="admin-chart">
            {monthly.map((m) => (
              <div key={m.month} className="admin-chart-bar-group">
                <div className="admin-chart-bar-wrap">
                  <div
                    className="admin-chart-bar"
                    style={{
                      height: `${(m.revenue / maxRevenue) * 100}%`,
                      background: "#22c55e",
                    }}
                    title={`${m.month}: ${formatCurrency(m.revenue)}`}
                  />
                </div>
                <span className="admin-chart-label">
                  {m.month.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
