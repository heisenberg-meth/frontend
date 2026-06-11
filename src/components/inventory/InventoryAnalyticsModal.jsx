import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  X,
  Download,
  Printer,
  TrendingUp,
  AlertTriangle,
  PackageX,
  Activity,
  FileText,
  Clock,
  Layers,
  Loader2,
  DollarSign,
  PieChart as PieChartIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { getMedicines } from "../../services/inventory.service";
import "../../styles/InventoryAnalyticsModal.css";

const fmt = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);

export default function InventoryAnalyticsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [highValueStock, setHighValueStock] = useState([]);
  const [expiryRisk, setExpiryRisk] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    setActiveTab("overview");
    onClose();
  }, [onClose]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMedicines({ limit: 10000 });
      const items = Array.isArray(res.data?.data?.items)
        ? res.data.data.items
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      let totalVal = 0;
      let estProfit = 0;
      let riskVal = 0;
      let deadVal = 0;

      const categoryMap = {};
      const highValue = [];
      const days30 = [];
      const days60 = [];
      const deadStock = [];

      const today = new Date();

      items.forEach((item) => {
        const qty = item.stock ?? 0;
        if (qty <= 0) return;

        const batch = item.inventoryBatches?.[0] || {};
        const purchasePrice = Number(
          batch.purchasePrice || item.purchasePrice || item.purchaseCost || 0,
        );
        const mrp = Number(batch.mrp || item.mrp || 0);
        const batchNum = batch.batchNumber || item.batchNumber || "N/A";
        const expDate = batch.expiryDate || item.expiryDate;

        const itemValue = qty * purchasePrice;
        const itemProfit = qty * (mrp - purchasePrice);

        totalVal += itemValue;
        estProfit += itemProfit;

        const catName = item.category?.name || item.category || "Uncategorized";
        if (!categoryMap[catName])
          categoryMap[catName] = { count: 0, value: 0 };
        categoryMap[catName].count += 1;
        categoryMap[catName].value += itemValue;

        const margin =
          purchasePrice > 0
            ? Math.round(((mrp - purchasePrice) / mrp) * 100)
            : 0;
        highValue.push({
          id: item.id,
          name: item.name,
          batch: batchNum,
          qty,
          purchaseValue: itemValue,
          sellingValue: qty * mrp,
          margin,
        });

        if (expDate) {
          const exp = new Date(expDate);
          const diffTime = exp - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 30 && diffDays > 0) {
            days30.push({
              id: item.id,
              name: item.name,
              qty,
              value: itemValue,
              daysLeft: diffDays,
            });
            riskVal += itemValue;
          } else if (diffDays <= 60 && diffDays > 30) {
            days60.push({
              id: item.id,
              name: item.name,
              qty,
              value: itemValue,
              daysLeft: diffDays,
            });
            riskVal += itemValue;
          } else if (diffDays <= 0) {
            deadStock.push({
              id: item.id,
              name: item.name,
              qty,
              value: itemValue,
              inactiveDays: Math.abs(diffDays),
            });
            deadVal += itemValue;
          }
        }

        if (!expDate) {
          const updated = new Date(item.updatedAt || item.createdAt);
          const inactiveDays = Math.ceil(
            (today - updated) / (1000 * 60 * 60 * 24),
          );
          if (inactiveDays > 180) {
            deadStock.push({
              id: item.id,
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
      const topHighValue = highValue.slice(0, 10);

      const categoriesData = Object.keys(categoryMap)
        .map((k) => ({
          category: k,
          count: categoryMap[k].count,
          value: categoryMap[k].value,
        }))
        .sort((a, b) => b.value - a.value);

      setSummary({
        totalValue: totalVal,
        estimatedProfit: estProfit,
        expiryRiskValue: riskVal,
        deadStockValue: deadVal,
      });

      setCategories(categoriesData);
      setHighValueStock(topHighValue);
      setExpiryRisk({ days30, days60, deadStock });
    } catch (err) {
      console.error("Error fetching inventory analytics:", err);
      toast.error("Unable to load inventory analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const run = async () => {
      await fetchAnalytics();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [isOpen, fetchAnalytics]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const totalCategoryValue = useMemo(() => {
    return categories.reduce((acc, curr) => acc + curr.value, 0);
  }, [categories]);

  const handleOpenFullAnalytics = () => {
    try {
      navigate("/inventory/analytics", {
        state: { summary, categories, highValueStock, expiryRisk },
      });
      onClose();
    } catch {
      toast.error("Unable to open analytics page");
    }
  };

  const handlePrint = () => {
    try {
      setPrinting(true);
      setIsPrinting(true);
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
        setPrinting(false);
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to print report");
      setIsPrinting(false);
      setPrinting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);

      let csvContent = "";

      // Summary Section
      csvContent += "=== INVENTORY SUMMARY ===\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Inventory Value,${summary?.totalValue || 0}\n`;
      csvContent += `Estimated Profit,${summary?.estimatedProfit || 0}\n`;
      csvContent += `Expiry Risk Value,${summary?.expiryRiskValue || 0}\n`;
      csvContent += `Dead Stock Value,${summary?.deadStockValue || 0}\n\n`;

      // High Value Medicines
      csvContent += "=== HIGH VALUE MEDICINES ===\n";
      csvContent +=
        "Medicine Name,Batch,Quantity,Purchase Value,Selling Value,Margin %\n";
      (highValueStock || []).forEach((item) => {
        csvContent += `"${item.name}","${item.batch}",${item.qty},${item.purchaseValue},${item.sellingValue},${item.margin}\n`;
      });
      csvContent += "\n";

      // Category Breakdown
      csvContent += "=== CATEGORY BREAKDOWN ===\n";
      csvContent += "Category,Item Count,Value\n";
      (categories || []).forEach((cat) => {
        csvContent += `"${cat.category}",${cat.count},${cat.value}\n`;
      });
      csvContent += "\n";

      // Expiry Risk
      csvContent += "=== EXPIRY RISK ===\n";
      csvContent += "Medicine,Quantity,Risk Value,Days Left\n";
      const riskItems = [
        ...(expiryRisk?.days30 || []),
        ...(expiryRisk?.days60 || []),
      ];
      riskItems.forEach((item) => {
        csvContent += `"${item.name}",${item.qty},${item.value},${item.daysLeft}\n`;
      });
      csvContent += "\n";

      // Dead Stock
      csvContent += "=== DEAD STOCK ===\n";
      csvContent += "Medicine,Quantity,Blocked Value,Inactive Days\n";
      (expiryRisk?.deadStock || []).forEach((item) => {
        csvContent += `"${item.name}",${item.qty},${item.value},${item.inactiveDays}\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "inventory_analytics_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("CSV exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="inventory-analytics-overlay" onClick={handleClose}>
        <motion.div
          className="inventory-analytics-modal"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="inventory-analytics-header">
            <div className="inventory-analytics-title">
              <h2>Inventory Valuation Overview</h2>
              {summary?.lastUpdated && (
                <span>
                  <Clock size={14} />
                  Updated {new Date(summary.lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              className="inventory-analytics-close"
              onClick={handleClose}
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="inventory-analytics-tabs">
            <button
              className={`inventory-analytics-tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <Activity size={18} />
              Summary & Insights
            </button>
            <button
              className={`inventory-analytics-tab ${activeTab === "categories" ? "active" : ""}`}
              onClick={() => setActiveTab("categories")}
            >
              <PieChartIcon size={18} />
              Category Breakdown
            </button>
            <button
              className={`inventory-analytics-tab ${activeTab === "risk" ? "active" : ""}`}
              onClick={() => setActiveTab("risk")}
            >
              <Layers size={18} />
              Risk & Dead Stock
            </button>
          </div>

          {/* Content */}
          <div className="inventory-analytics-content">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-on-surface-variant flex-col gap-4">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <span>Loading comprehensive analytics...</span>
              </div>
            ) : (
              <>
                {/* TAB: OVERVIEW */}
                {(activeTab === "overview" || isPrinting) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="inventory-summary-grid">
                      <div className="inventory-summary-card">
                        <div className="inventory-summary-header">
                          <span className="inventory-summary-title">
                            Total Inventory Value
                          </span>
                          <div className="inventory-summary-icon bg-primary/10 text-primary">
                            <DollarSign size={20} />
                          </div>
                        </div>
                        <div className="inventory-summary-value">
                          {fmt(summary?.totalValue)}
                        </div>
                        <div className="inventory-summary-trend positive">
                          Current Retail Value
                        </div>
                      </div>

                      <div className="inventory-summary-card">
                        <div className="inventory-summary-header">
                          <span className="inventory-summary-title">
                            Estimated Profit
                          </span>
                          <div className="inventory-summary-icon bg-blue-500/10 text-blue-500">
                            <TrendingUp size={20} />
                          </div>
                        </div>
                        <div className="inventory-summary-value">
                          {fmt(summary?.estimatedProfit)}
                        </div>
                        <div className="inventory-summary-trend positive">
                          Based on MRP
                        </div>
                      </div>

                      <div className="inventory-summary-card">
                        <div className="inventory-summary-header">
                          <span className="inventory-summary-title">
                            Expiry Risk Value
                          </span>
                          <div className="inventory-summary-icon bg-rose-500/10 text-rose-500">
                            <AlertTriangle size={20} />
                          </div>
                        </div>
                        <div className="inventory-summary-value">
                          {fmt(summary?.expiryRiskValue)}
                        </div>
                        <div className="inventory-summary-trend negative">
                          Expiring in 60 days
                        </div>
                      </div>

                      <div className="inventory-summary-card">
                        <div className="inventory-summary-header">
                          <span className="inventory-summary-title">
                            Dead Stock Value
                          </span>
                          <div className="inventory-summary-icon bg-amber-500/10 text-amber-500">
                            <PackageX size={20} />
                          </div>
                        </div>
                        <div className="inventory-summary-value">
                          {fmt(summary?.deadStockValue)}
                        </div>
                        <div className="inventory-summary-trend warning">
                          Inactive 90 days
                        </div>
                      </div>
                    </div>

                    <h3 className="inventory-section-title mt-8 mb-4">
                      <Activity size={20} className="text-primary" /> Top
                      High-Value Medicines
                    </h3>
                    <div className="inventory-table-wrapper">
                      <div className="inventory-table-scroll">
                        {highValueStock && highValueStock.length > 0 ? (
                          <table className="inventory-analytics-table">
                            <thead>
                              <tr>
                                <th>Medicine Name</th>
                                <th>Batch</th>
                                <th className="numeric">Qty</th>
                                <th className="numeric">Purchase Value</th>
                                <th className="numeric">Selling Value</th>
                                <th className="numeric">Margin</th>
                              </tr>
                            </thead>
                            <tbody>
                              {highValueStock.map((item) => (
                                <tr key={item.id}>
                                  <td className="font-semibold">{item.name}</td>
                                  <td className="text-on-surface-variant">
                                    {item.batch}
                                  </td>
                                  <td className="numeric font-medium">
                                    {item.qty}
                                  </td>
                                  <td className="numeric">
                                    {fmt(item.purchaseValue)}
                                  </td>
                                  <td className="numeric font-medium">
                                    {fmt(item.sellingValue)}
                                  </td>
                                  <td className="numeric">
                                    <span className="profit-margin">
                                      {item.margin}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="flex items-center justify-center p-8 text-on-surface-variant font-medium text-sm border-t border-outline-variant">
                            No high-value medicines found.
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: CATEGORIES */}
                {(activeTab === "categories" || isPrinting) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="inventory-charts-grid"
                  >
                    <div className="inventory-card-container">
                      <h3 className="inventory-section-title">
                        Value by Category
                      </h3>
                      {categories && categories.length > 0 ? (
                        <div className="inventory-chart-wrapper">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categories}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={4}
                                dataKey="value"
                                nameKey="category"
                                stroke="var(--surface)"
                                strokeWidth={2}
                              >
                                {categories.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                formatter={(value) => fmt(value)}
                                contentStyle={{
                                  backgroundColor: "var(--surface)",
                                  borderColor: "var(--border)",
                                  borderRadius: "12px",
                                  color: "var(--on-surface)",
                                  boxShadow:
                                    "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                  padding: "12px 16px",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-8 text-on-surface-variant font-medium text-sm">
                          No category data available.
                        </div>
                      )}
                    </div>

                    <div className="inventory-card-container">
                      <h3 className="inventory-section-title">
                        Category Breakdown
                      </h3>
                      {categories && categories.length > 0 ? (
                        <div className="category-breakdown-list">
                          {categories.map((cat, idx) => {
                            const percentage = totalCategoryValue
                              ? (
                                  (cat.value / totalCategoryValue) *
                                  100
                                ).toFixed(1)
                              : 0;
                            return (
                              <div
                                className="category-breakdown-item"
                                key={idx}
                              >
                                <div className="category-breakdown-header">
                                  <span className="name">
                                    {cat.category}{" "}
                                    <span className="text-on-surface-variant font-normal text-xs ml-1">
                                      ({cat.count} items)
                                    </span>
                                  </span>
                                  <span className="value">
                                    {fmt(cat.value)}{" "}
                                    <span className="text-xs ml-1 font-bold">
                                      ({percentage}%)
                                    </span>
                                  </span>
                                </div>
                                <div className="category-breakdown-bar">
                                  <div
                                    className="category-breakdown-fill"
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: cat.color,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-8 text-on-surface-variant font-medium text-sm">
                          No category data available.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* TAB: RISK & DEAD STOCK */}
                {(activeTab === "risk" || isPrinting) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-6 pt-2"
                  >
                    <div>
                      <h3 className="inventory-section-title mb-4">
                        <AlertTriangle className="text-rose-500" size={20} />
                        Expiry Risk (Next 60 Days)
                      </h3>
                      <div className="inventory-table-wrapper">
                        <div className="inventory-table-scroll">
                          {(expiryRisk?.days30 || []).length > 0 ||
                          (expiryRisk?.days60 || []).length > 0 ? (
                            <table className="inventory-analytics-table">
                              <thead>
                                <tr>
                                  <th>Medicine</th>
                                  <th className="numeric">Qty</th>
                                  <th className="numeric">Risk Value</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Merge 30 and 60 days for a unified view if needed, but here just map 30 days then 60 days */}
                                {[
                                  ...(expiryRisk?.days30 || []),
                                  ...(expiryRisk?.days60 || []),
                                ].map((item, index) => (
                                  <tr key={item.id || index}>
                                    <td className="font-semibold">
                                      {item.name}
                                    </td>
                                    <td className="numeric font-medium">
                                      {item.qty}
                                    </td>
                                    <td className="numeric text-rose-500 font-bold">
                                      {fmt(item.value)}
                                    </td>
                                    <td>
                                      <span
                                        className={`risk-badge ${item.daysLeft <= 30 ? "high" : "medium"}`}
                                      >
                                        {item.daysLeft} days left
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="flex items-center justify-center p-8 text-on-surface-variant font-medium text-sm border-t border-outline-variant">
                              No expiry-risk medicines found.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="inventory-section-title mb-4">
                        <PackageX className="text-amber-500" size={20} />
                        Dead Stock / Slow Moving
                      </h3>
                      <div className="inventory-table-wrapper">
                        <div className="inventory-table-scroll">
                          {expiryRisk?.deadStock &&
                          expiryRisk.deadStock.length > 0 ? (
                            <table className="inventory-analytics-table">
                              <thead>
                                <tr>
                                  <th>Medicine</th>
                                  <th className="numeric">Qty</th>
                                  <th className="numeric">Blocked Value</th>
                                  <th>Inactive Duration</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expiryRisk.deadStock.map((item) => (
                                  <tr key={item.id}>
                                    <td className="font-semibold">
                                      {item.name}
                                    </td>
                                    <td className="numeric font-medium">
                                      {item.qty}
                                    </td>
                                    <td className="numeric text-amber-500 font-bold">
                                      {fmt(item.value)}
                                    </td>
                                    <td>
                                      <span className="text-on-surface-variant font-medium">
                                        &gt; {item.inactiveDays} days
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="flex items-center justify-center p-8 text-on-surface-variant font-medium text-sm border-t border-outline-variant">
                              No dead stock available.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="inventory-analytics-footer">
            <button
              className="inventory-analytics-btn"
              onClick={handleOpenFullAnalytics}
            >
              <FileText size={16} /> Open Full Analytics
            </button>
            <button
              className="inventory-analytics-btn"
              onClick={handlePrint}
              disabled={printing}
            >
              {printing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Printer size={16} />
              )}
              {printing ? "Printing..." : "Print Report"}
            </button>
            <button
              className="inventory-analytics-btn primary"
              onClick={handleExportCSV}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
