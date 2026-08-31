import {
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  useEffectEvent,
} from "react";
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
import { AnimatePresence, m } from "framer-motion";
import { lazy, Suspense } from "react";

const LazyModalChart = lazy(() =>
  import("recharts").then((m) => ({
    default: function ModalChart({ categories, fmt }) {
      return (
        <m.ResponsiveContainer width="100%" height="100%">
          <m.PieChart>
            <m.Pie
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
              {categories.map((entry) => (
                <m.Cell key={entry.category} fill={entry.color} />
              ))}
            </m.Pie>
            <m.Tooltip
              formatter={(value) => fmt(value)}
              contentStyle={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                borderRadius: "12px",
                color: "var(--on-surface)",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                padding: "12px 16px",
              }}
            />
          </m.PieChart>
        </m.ResponsiveContainer>
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
import "../../styles/InventoryAnalyticsModal.css";
import { formatInvoiceTime } from "../../utils/dateTime.js";

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const fmt = (val) => INR_FORMATTER.format(val || 0);

export default function InventoryAnalyticsModal({ isOpen, onClose }) {
  const [analyticsState, dispatchAnalytics] = useReducer(
    (state, action) => {
      if (action.type === "SET_FIELD") {
        return {
          ...state,
          [action.field]:
            typeof action.value === "function"
              ? action.value(state[action.field])
              : action.value,
        };
      }
      return state;
    },
    {
      activeTab: "overview",
      loading: true,
      summary: null,
      categories: [],
      highValueStock: [],
      expiryRisk: null,
      exporting: false,
      printing: false,
      isPrinting: false,
    },
  );

  const {
    activeTab,
    loading,
    summary,
    categories,
    highValueStock,
    expiryRisk,
    exporting,
    printing,
    isPrinting,
  } = analyticsState;

  const setActiveTab = useCallback(
    (val) =>
      dispatchAnalytics({ type: "SET_FIELD", field: "activeTab", value: val }),
    [],
  );
  const setLoading = useCallback(
    (val) =>
      dispatchAnalytics({ type: "SET_FIELD", field: "loading", value: val }),
    [],
  );
  const setSummary = useCallback(
    (val) =>
      dispatchAnalytics({ type: "SET_FIELD", field: "summary", value: val }),
    [],
  );
  const setCategories = useCallback(
    (val) =>
      dispatchAnalytics({ type: "SET_FIELD", field: "categories", value: val }),
    [],
  );
  const setHighValueStock = useCallback(
    (val) =>
      dispatchAnalytics({
        type: "SET_FIELD",
        field: "highValueStock",
        value: val,
      }),
    [],
  );
  const setExpiryRisk = useCallback(
    (val) =>
      dispatchAnalytics({ type: "SET_FIELD", field: "expiryRisk", value: val }),
    [],
  );
  const setExporting = useCallback(
    (val) =>
      dispatchAnalytics({ type: "SET_FIELD", field: "exporting", value: val }),
    [],
  );
  const setPrinting = useCallback(
    (val) =>
      dispatchAnalytics({ type: "SET_FIELD", field: "printing", value: val }),
    [],
  );
  const setIsPrinting = useCallback(
    (val) =>
      dispatchAnalytics({ type: "SET_FIELD", field: "isPrinting", value: val }),
    [],
  );

  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    setActiveTab("overview");
    onClose();
  }, [onClose, setActiveTab]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, categoriesRes, highValueRes, expiryRiskRes] =
        await Promise.all([
          getInventoryValueSummary(),
          getInventoryCategoryBreakdown(),
          getHighValueStock(),
          getExpiryRisk(),
        ]);

      const summaryData = summaryRes.data?.data || summaryRes.data || {};
      const categoriesData =
        categoriesRes.data?.data || categoriesRes.data || [];
      const highValueData = highValueRes.data?.data || highValueRes.data || [];
      const expiryRiskData =
        expiryRiskRes.data?.data || expiryRiskRes.data || {};

      setSummary({
        totalValue: summaryData.totalValue || 0,
        estimatedProfit: summaryData.potentialProfit || 0,
        expiryRiskValue:
          (expiryRiskData.risk30?.value || 0) +
          (expiryRiskData.risk90?.value || 0),
        deadStockValue: expiryRiskData.expired?.value || 0,
      });

      setCategories(categoriesData);
      setHighValueStock(highValueData);
      setExpiryRisk(expiryRiskData);
    } catch (err) {
      console.error("Error fetching inventory analytics:", err);
      toast.error("Unable to load inventory analytics");
    } finally {
      setLoading(false);
    }
  }, [setCategories, setExpiryRisk, setHighValueStock, setLoading, setSummary]);

  useEffect(() => {
    if (!isOpen) return;

    const run = async () => {
      await fetchAnalytics();
    };

    run();
  }, [isOpen, fetchAnalytics]);

  const onKeyDown = useEffectEvent((e) => {
    if (e.key === "Escape" && isOpen) {
      handleClose();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
      csvContent += "Medicine Name,Generic Name,Quantity,Total Value\n";
      (highValueStock || []).forEach((item) => {
        csvContent += `"${item.name}","${item.genericName || ""}",${item.quantity},${item.totalValue}\n`;
      });
      csvContent += "\n";

      // Category Breakdown
      csvContent += "=== CATEGORY BREAKDOWN ===\n";
      csvContent += "Category,Item Quantity,Value\n";
      (categories || []).forEach((cat) => {
        csvContent += `"${cat.category}",${cat.quantity},${cat.value}\n`;
      });
      csvContent += "\n";

      // Expiry Risk
      csvContent += "=== EXPIRY RISK ===\n";
      csvContent += "Risk Category,Item Count,Risk Value\n";
      csvContent += `"Risk < 30 Days",${expiryRisk?.risk30?.count || 0},${expiryRisk?.risk30?.value || 0}\n`;
      csvContent += `"Risk 30-90 Days",${expiryRisk?.risk90?.count || 0},${expiryRisk?.risk90?.value || 0}\n`;
      csvContent += "\n";

      // Dead Stock
      csvContent += "=== DEAD STOCK ===\n";
      csvContent += "Status,Item Count,Blocked Value\n";
      csvContent += `"Expired",${expiryRisk?.expired?.count || 0},${expiryRisk?.expired?.value || 0}\n`;

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
      <div
        role="button"
        tabIndex={0}
        className="inventory-analytics-overlay"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onClick={handleClose}
      >
        <m.div
          role="button"
          tabIndex={0}
          className="inventory-analytics-modal"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="inventory-analytics-header">
            <div className="inventory-analytics-title">
              <h2>Inventory Valuation Overview</h2>
              {summary?.lastUpdated && (
                <span>
                  <Clock size={14} />
                  Updated {formatInvoiceTime(summary.lastUpdated)}
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
                  <m.div
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
                          Expiring in 90 days
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
                                <th>Generic Name</th>
                                <th className="numeric">Qty</th>
                                <th className="numeric">Total Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {highValueStock.map((item) => (
                                <tr key={item.id || item.name}>
                                  <td className="font-semibold">{item.name}</td>
                                  <td className="text-on-surface-variant">
                                    {item.genericName || "-"}
                                  </td>
                                  <td className="numeric font-medium">
                                    {item.quantity}
                                  </td>
                                  <td className="numeric">
                                    {fmt(item.totalValue)}
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
                  </m.div>
                )}

                {/* TAB: CATEGORIES */}
                {(activeTab === "categories" || isPrinting) && (
                  <m.div
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
                          <Suspense
                            fallback={
                              <div className="flex justify-center items-center h-full">
                                <Loader2 className="animate-spin text-primary" />
                              </div>
                            }
                          >
                            <LazyModalChart categories={categories} fmt={fmt} />
                          </Suspense>
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
                          {categories.map((cat) => {
                            const percentage = totalCategoryValue
                              ? (
                                  (cat.value / totalCategoryValue) *
                                  100
                                ).toFixed(1)
                              : 0;
                            return (
                              <div
                                className="category-breakdown-item"
                                key={cat.value}
                              >
                                <div className="category-breakdown-header">
                                  <span className="name">
                                    {cat.category}{" "}
                                    <span className="text-on-surface-variant font-normal text-xs ml-1">
                                      ({cat.quantity} items)
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
                  </m.div>
                )}

                {/* TAB: RISK & DEAD STOCK */}
                {(activeTab === "risk" || isPrinting) && (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-6 pt-2"
                  >
                    <div>
                      <h3 className="inventory-section-title mb-4">
                        <AlertTriangle className="text-rose-500" size={20} />
                        Expiry Risk (Next 90 Days)
                      </h3>
                      <div className="inventory-table-wrapper">
                        <div className="inventory-table-scroll">
                          <table className="inventory-analytics-table">
                            <thead>
                              <tr>
                                <th>Risk Category</th>
                                <th className="numeric">Batches Affected</th>
                                <th className="numeric">Risk Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="font-semibold">
                                  Expiring in &lt; 30 Days
                                </td>
                                <td className="numeric font-medium">
                                  {expiryRisk?.risk30?.count || 0}
                                </td>
                                <td className="numeric text-rose-500 font-bold">
                                  {fmt(expiryRisk?.risk30?.value)}
                                </td>
                              </tr>
                              <tr>
                                <td className="font-semibold">
                                  Expiring in 30 - 90 Days
                                </td>
                                <td className="numeric font-medium">
                                  {expiryRisk?.risk90?.count || 0}
                                </td>
                                <td className="numeric text-amber-500 font-bold">
                                  {fmt(expiryRisk?.risk90?.value)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="inventory-section-title mb-4">
                        <PackageX className="text-amber-500" size={20} />
                        Dead Stock / Expired
                      </h3>
                      <div className="inventory-table-wrapper">
                        <div className="inventory-table-scroll">
                          <table className="inventory-analytics-table">
                            <thead>
                              <tr>
                                <th>Status</th>
                                <th className="numeric">Batches Affected</th>
                                <th className="numeric">Blocked Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="font-semibold">Expired Stock</td>
                                <td className="numeric font-medium">
                                  {expiryRisk?.expired?.count || 0}
                                </td>
                                <td className="numeric text-rose-500 font-bold">
                                  {fmt(expiryRisk?.expired?.value)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </m.div>
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
        </m.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
