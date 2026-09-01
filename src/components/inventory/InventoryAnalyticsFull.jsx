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
    default: function Chart({ categories, COLORS }) {
      return (
        <m.ResponsiveContainer width="100%" height="100%">
          <m.PieChart>
            <m.Pie
              data={categories}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              nameKey="category"
            >
              {categories.map((entry, index) => (
                <m.Cell
                  key={`cell-${entry.category}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </m.Pie>
            <m.Tooltip
              formatter={(value) => `₹${value.toLocaleString()}`}
              contentStyle={{
                backgroundColor: "var(--surface)",
                borderRadius: "8px",
                border: "1px solid var(--surface-container-highest)",
                color: "var(--on-surface)",
              }}
            />
          </m.PieChart>
        </m.ResponsiveContainer>
      );
    },
  })),
);
import { getMedicines } from "../../services/inventory.service";
import { safeNumber } from "../../utils/number.js";

// Re-using the design language from the modal
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

  const COLORS = [
    "#4fdbc8",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  useEffect(() => {
    let active = true;

    const fetchAnalytics = async () => {
      try {
        const res = await getMedicines({ limit: 10000 });
        if (!active) return;
        const items = Array.isArray(res.data?.data?.items)
          ? res.data.data.items
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        let totalVal = 0,
          estProfit = 0,
          riskVal = 0,
          deadVal = 0;
        const categoryMap = {},
          highValue = [],
          days30 = [],
          days60 = [],
          deadStock = [];
        const today = new Date();

        items.forEach((item) => {
          const qty = item.stock ?? 0;
          if (qty <= 0) return;

          const batch = item.inventoryBatches?.[0] || {};
          const purchasePrice = safeNumber(
            batch.purchasePrice || item.purchasePrice || item.purchaseCost || 0,
          );
          const mrp = safeNumber(batch.mrp || item.mrp || 0);
          const batchNum = batch.batchNumber || item.batchNumber || "N/A";
          const expDate = batch.expiryDate || item.expiryDate;

          const itemValue = qty * purchasePrice;
          totalVal += itemValue;
          estProfit += qty * (mrp - purchasePrice);

          const catName =
            item.category?.name || item.category || "Uncategorized";
          if (!categoryMap[catName])
            categoryMap[catName] = { count: 0, value: 0 };
          categoryMap[catName].count += 1;
          categoryMap[catName].value += itemValue;

          highValue.push({
            name: item.name,
            batch: batchNum,
            qty,
            purchaseValue: itemValue,
            sellingValue: qty * mrp,
            margin:
              purchasePrice > 0
                ? Math.round(((mrp - purchasePrice) / mrp) * 100)
                : 0,
          });

          if (expDate) {
            const diffDays = Math.ceil(
              (new Date(expDate) - today) / (1000 * 60 * 60 * 24),
            );
            if (diffDays <= 30 && diffDays > 0) {
              days30.push({
                name: item.name,
                qty,
                value: itemValue,
                daysLeft: diffDays,
              });
              riskVal += itemValue;
            } else if (diffDays <= 60 && diffDays > 30) {
              days60.push({
                name: item.name,
                qty,
                value: itemValue,
                daysLeft: diffDays,
              });
              riskVal += itemValue;
            } else if (diffDays <= 0) {
              deadStock.push({
                name: item.name,
                qty,
                value: itemValue,
                inactiveDays: Math.abs(diffDays),
              });
              deadVal += itemValue;
            }
          } else {
            const inactiveDays = Math.ceil(
              (today - new Date(item.updatedAt || item.createdAt)) /
                (1000 * 60 * 60 * 24),
            );
            if (inactiveDays > 180) {
              deadStock.push({
                name: item.name,
                qty,
                value: itemValue,
                inactiveDays,
              });
              deadVal += itemValue;
            }
          }
        });

        highValue.sort((a, b) => b.purchaseValue - a.purchaseValue);

        setAnalytics({
          summary: {
            totalValue: totalVal,
            estimatedProfit: estProfit,
            expiryRiskValue: riskVal,
            deadStockValue: deadVal,
          },
          categories: Object.keys(categoryMap)
            .map((k) => ({
              category: k,
              count: categoryMap[k].count,
              value: categoryMap[k].value,
            }))
            .sort((a, b) => b.value - a.value),
          highValueStock: highValue.slice(0, 10),
          expiryRisk: { days30, days60, deadStock },
        });
      } catch (err) {
        console.error(err);
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
      <div style={{ padding: "2rem", color: "var(--on-surface)" }}>
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

      <div style={{ display: "grid", gap: "2rem" }}>
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
                style={{ color: "#4fdbc8" }}
              >
                ₹{summary.totalValue?.toLocaleString() || 0}
              </div>
            </div>
            <div className="inventory-summary-card">
              <div className="inventory-summary-header">
                <span className="inventory-summary-title">Est. Profit</span>
              </div>
              <div
                className="inventory-summary-value"
                style={{ color: "#10b981" }}
              >
                ₹{summary.estimatedProfit?.toLocaleString() || 0}
              </div>
            </div>
            <div className="inventory-summary-card">
              <div className="inventory-summary-header">
                <span className="inventory-summary-title">Expiry Risk</span>
              </div>
              <div
                className="inventory-summary-value"
                style={{ color: "#f59e0b" }}
              >
                ₹{summary.expiryRiskValue?.toLocaleString() || 0}
              </div>
            </div>
            <div className="inventory-summary-card">
              <div className="inventory-summary-header">
                <span className="inventory-summary-title">Dead Stock</span>
              </div>
              <div
                className="inventory-summary-value"
                style={{ color: "#ef4444" }}
              >
                ₹{summary.deadStockValue?.toLocaleString() || 0}
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
                      <td className="numeric">₹{item.purchaseValue}</td>
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
            <div style={{ height: "300px" }}>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                }
              >
                <LazyRechartsWrapper categories={categories} COLORS={COLORS} />
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
                      <td className="numeric">₹{item.value}</td>
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
                      <td className="numeric">₹{item.value}</td>
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
    </div>
  );
}
