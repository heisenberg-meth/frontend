import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  Layers,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { lazy, Suspense } from "react";
const LazyRechartsWrapper = lazy(() =>
  import("recharts").then((m) => ({
    default: function Chart({ categories }) {
      const COLORS = [
        "#0D9488",
        "#14B8A6",
        "#06B6D4",
        "#3B82F6",
        "#6366F1",
        "#8B5CF6",
        "#A855F7",
        "#EC4899",
        "#F43F5E",
        "#F97316",
        "#EAB308",
        "#84CC16",
      ];

      return (
        <div className="inventory-category-chart w-full h-full">
          <m.ResponsiveContainer width="100%" height="100%">
            <m.PieChart>
              <m.Pie
                data={categories}
                cx="50%"
                cy="50%"
                innerRadius="48%"
                outerRadius="72%"
                paddingAngle={3}
                dataKey="value"
                nameKey="category"
                stroke="var(--surface)"
                strokeWidth={2}
              >
                {categories.map((entry, index) => {
                  const color = COLORS[index % COLORS.length];

                  return (
                    <m.Cell
                      key={`cell-${entry.category}-${index}`}
                      fill={color}
                      style={{ fill: color }}
                    />
                  );
                })}
              </m.Pie>

              <m.Tooltip
                formatter={(value) => formatIndianCurrency(value)}
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  borderRadius: "10px",
                  border: "1px solid var(--surface-container-highest)",
                  color: "var(--on-surface)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}
              />
            </m.PieChart>
          </m.ResponsiveContainer>
        </div>
      );
    },
  })),
);
import {
  getInventoryValueSummary,
  getInventoryCategoryBreakdown,
  getHighValueStock,
  getExpiryRisk,
} from "../../services/inventory.service";
const formatIndianCurrency = (value) => {
  const amount = Number(value) || 0;
  if (amount >= 1_00_00_000) {
    return `₹${(amount / 1_00_00_000).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  }
  if (amount >= 1_00_000) {
    return `₹${(amount / 1_00_000).toFixed(2).replace(/\.?0+$/, "")} L`;
  }
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

// Re-using the design language from the modal

function InventoryAnalyticsFullSection1({
  summary,
  highValueStock,
  categories,
  riskItems,
  deadStock,
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: "2rem",
      }}
    >
      {/* SUMMARY CARDS */}
      <section>
        <h2
          style={{
            fontSize: "1.25rem",
            color: "var(--on-surface)",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Activity size={20} /> Overview
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <div className="inventory-summary-card">
            <div className="inventory-summary-header">
              <span className="inventory-summary-title">Total Value</span>
            </div>
            <div
              className="inventory-summary-value"
              style={{
                color: "#4fdbc8",
              }}
            >
              {formatIndianCurrency(summary.totalValue)}
            </div>
          </div>
          <div className="inventory-summary-card">
            <div className="inventory-summary-header">
              <span className="inventory-summary-title">Est. Profit</span>
            </div>
            <div
              className="inventory-summary-value"
              style={{
                color: "#10b981",
              }}
            >
              {formatIndianCurrency(summary.estimatedProfit)}
            </div>
          </div>
          <div className="inventory-summary-card">
            <div className="inventory-summary-header">
              <span className="inventory-summary-title">Expiry Risk</span>
            </div>
            <div
              className="inventory-summary-value"
              style={{
                color: "#f59e0b",
              }}
            >
              {formatIndianCurrency(summary.expiryRiskValue)}
            </div>
          </div>
          <div className="inventory-summary-card">
            <div className="inventory-summary-header">
              <span className="inventory-summary-title">Dead Stock</span>
            </div>
            <div
              className="inventory-summary-value"
              style={{
                color: "#ef4444",
              }}
            >
              {formatIndianCurrency(summary.deadStockValue)}
            </div>
          </div>
        </div>
      </section>

      {/* HIGH VALUE & CATEGORIES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
        }}
      >
        <section className="inventory-card-container">
          <h2 className="inventory-section-title">
            <FileText size={20} /> Top Value Items
          </h2>
          <div className="inventory-table-scroll">
            <table className="inventory-analytics-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th className="numeric">Value</th>
                  <th className="numeric">Margin</th>
                </tr>
              </thead>
              <tbody>
                {highValueStock.map((item) => (
                  <tr key={item.name}>
                    <td>
                      {item.name}{" "}
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        ({item.batch})
                      </span>
                    </td>
                    <td className="numeric">
                      {formatIndianCurrency(item.purchaseValue)}
                    </td>
                    <td className="numeric">
                      <span className="profit-margin">{item.margin}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="inventory-card-container">
          <h2 className="inventory-section-title">
            <Layers size={20} /> Category Breakdown
          </h2>
          <div
            style={{
              height: "300px",
            }}
          >
            <Suspense
              fallback={
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              }
            >
              <LazyRechartsWrapper categories={categories} />
            </Suspense>
          </div>
        </section>
      </div>

      {/* EXPIRY RISK & DEAD STOCK */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
        }}
      >
        <section className="inventory-card-container">
          <h2 className="inventory-section-title">
            <Clock size={20} color="#f59e0b" /> Expiry Risk
          </h2>
          <div className="inventory-table-scroll">
            <table className="inventory-analytics-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th className="numeric">Risk Value</th>
                  <th className="numeric">Days Left</th>
                </tr>
              </thead>
              <tbody>
                {riskItems.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td className="numeric">
                      {formatIndianCurrency(item.value)}
                    </td>
                    <td className="numeric">
                      <span
                        className={`risk-badge ${item.daysLeft <= 30 ? "high" : "medium"}`}
                      >
                        {item.daysLeft} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="inventory-card-container">
          <h2 className="inventory-section-title">
            <Clock size={20} color="#ef4444" /> Dead Stock
          </h2>
          <div className="inventory-table-scroll">
            <table className="inventory-analytics-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th className="numeric">Blocked Value</th>
                  <th className="numeric">Inactive Days</th>
                </tr>
              </thead>
              <tbody>
                {deadStock.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td className="numeric">
                      {formatIndianCurrency(item.value)}
                    </td>
                    <td className="numeric">
                      <span className="risk-badge high">
                        {item.inactiveDays} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
export default function InventoryAnalyticsFull() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state || {};
  const [loading, setLoading] = useState(!data.summary);
  const [analytics, setAnalytics] = useState({
    summary: data.summary,
    categories: data.categories,
    highValueStock: data.highValueStock,
    expiryRisk: data.expiryRisk,
  });
  useEffect(() => {
    if (data.summary) return;
    let active = true;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [summaryRes, categoriesRes, highValueRes, expiryRiskRes] =
          await Promise.allSettled([
            getInventoryValueSummary(),
            getInventoryCategoryBreakdown(),
            getHighValueStock(),
            getExpiryRisk(),
          ]);

        if (!active) return;

        const summaryData =
          summaryRes.status === "fulfilled"
            ? summaryRes.value?.data?.data || summaryRes.value?.data || {}
            : {};
        const categoriesData =
          categoriesRes.status === "fulfilled"
            ? categoriesRes.value?.data?.data || categoriesRes.value?.data || []
            : [];
        const highValueData =
          highValueRes.status === "fulfilled"
            ? highValueRes.value?.data?.data || highValueRes.value?.data || []
            : [];
        const expiryRiskData =
          expiryRiskRes.status === "fulfilled"
            ? expiryRiskRes.value?.data?.data || expiryRiskRes.value?.data || {}
            : {};

        const totalVal = summaryData.totalValue || 0;
        const estProfit = summaryData.potentialProfit || 0;
        const riskVal =
          (expiryRiskData.risk30?.value || 0) +
          (expiryRiskData.risk90?.value || 0);
        const deadVal = expiryRiskData.expired?.value || 0;

        setAnalytics({
          summary: {
            totalValue: totalVal,
            estimatedProfit: estProfit,
            expiryRiskValue: riskVal,
            deadStockValue: deadVal,
          },
          categories: categoriesData.map((k) => ({
            category: k.category || "Uncategorized",
            count: k.quantity || 0,
            value: k.value || 0,
          })),
          highValueStock: highValueData.map((item) => ({
            name: item.name,
            batch: item.genericName || "N/A",
            qty: item.quantity || 0,
            purchaseValue: item.totalValue || 0,
            sellingValue: item.totalValue || 0,
            margin: 0,
          })),
          expiryRisk: {
            days30: [],
            days60: [],
            deadStock: [],
            ...expiryRiskData,
          },
        });
      } catch (err) {
        console.error("Failed to load full inventory analytics:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAnalytics();
    return () => {
      active = false;
    };
  }, [data.summary]);
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "var(--background)",
        }}
      >
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
      </div>
    );
  }
  const { summary, categories, highValueStock, expiryRisk } = analytics;
  if (!summary) {
    return (
      <div
        style={{
          padding: "2rem",
          color: "var(--on-surface)",
        }}
      >
        <h2>No Data Available</h2>
        <p>
          Please open the inventory analytics from the dashboard to load data.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "var(--primary)",
            color: "#fff",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    );
  }
  const riskItems = [
    ...(expiryRisk?.days30 || []),
    ...(expiryRisk?.days60 || []),
  ];
  const deadStock = expiryRisk?.deadStock || [];
  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundColor: "var(--background)",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "var(--on-surface-variant)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "1rem",
            fontWeight: "600",
          }}
        >
          <ArrowLeft size={20} /> Back
        </button>
        <h1
          style={{
            fontSize: "1.75rem",
            margin: 0,
            color: "var(--on-surface)",
            fontWeight: "700",
          }}
        >
          Full Inventory Analytics
        </h1>
      </header>

      <InventoryAnalyticsFullSection1
        summary={summary}
        highValueStock={highValueStock}
        categories={categories}
        riskItems={riskItems}
        deadStock={deadStock}
      />
    </div>
  );
}
