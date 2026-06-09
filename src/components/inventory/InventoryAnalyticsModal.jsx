import { useState, useEffect, useMemo } from "react";
import {
  X,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  PackageX,
  PieChart as PieChartIcon,
  Activity,
  FileText,
  Clock,
  Layers
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
import {
  getInventoryValueSummary,
  getInventoryCategoryBreakdown,
  getHighValueStock,
  getExpiryRisk,
} from "../../services/inventory.service";
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

  useEffect(() => {
    if (isOpen) {
      if (activeTab !== "overview") setActiveTab("overview");
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const [sumRes, catRes, highRes, riskRes] = await Promise.all([
        getInventoryValueSummary(),
        getInventoryCategoryBreakdown(),
        getHighValueStock(),
        getExpiryRisk(),
      ]);

      if (sumRes?.data?.success) setSummary(sumRes.data.data);
      if (catRes?.data?.success) setCategories(catRes.data.data);
      if (highRes?.data?.success) setHighValueStock(highRes.data.data);
      if (riskRes?.data?.success) setExpiryRisk(riskRes.data.data);
    } catch (err) {
      console.error("Error fetching inventory analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  // Keyboard shortcut to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const totalCategoryValue = useMemo(() => {
    return categories.reduce((acc, curr) => acc + curr.value, 0);
  }, [categories]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="inventory-analytics-overlay" onClick={onClose}>
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
            <button className="inventory-analytics-close" onClick={onClose} aria-label="Close modal">
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="inventory-analytics-tabs">
            <button 
              className={`inventory-analytics-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Activity size={18} />
              Summary & Insights
            </button>
            <button 
              className={`inventory-analytics-tab ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <PieChartIcon size={18} />
              Category Breakdown
            </button>
            <button 
              className={`inventory-analytics-tab ${activeTab === 'risk' ? 'active' : ''}`}
              onClick={() => setActiveTab('risk')}
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
                {activeTab === 'overview' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.3 }}
                  >
                    <div className="inventory-summary-grid">
                      <div className="inventory-summary-card">
                        <div className="inventory-summary-header">
                          <span className="inventory-summary-title">Total Inventory Value</span>
                          <div className="inventory-summary-icon bg-primary/10 text-primary">
                            <DollarSign size={20} />
                          </div>
                        </div>
                        <div className="inventory-summary-value">{fmt(summary?.totalValue)}</div>
                        <div className="inventory-summary-trend positive">Current Retail Value</div>
                      </div>

                      <div className="inventory-summary-card">
                        <div className="inventory-summary-header">
                          <span className="inventory-summary-title">Estimated Profit</span>
                          <div className="inventory-summary-icon bg-blue-500/10 text-blue-500">
                            <TrendingUp size={20} />
                          </div>
                        </div>
                        <div className="inventory-summary-value">{fmt(summary?.estimatedProfit)}</div>
                        <div className="inventory-summary-trend positive">Based on MRP</div>
                      </div>

                      <div className="inventory-summary-card">
                        <div className="inventory-summary-header">
                          <span className="inventory-summary-title">Expiry Risk Value</span>
                          <div className="inventory-summary-icon bg-rose-500/10 text-rose-500">
                            <AlertTriangle size={20} />
                          </div>
                        </div>
                        <div className="inventory-summary-value">{fmt(summary?.expiryRiskValue)}</div>
                        <div className="inventory-summary-trend negative">Expiring in  60 days</div>
                      </div>

                      <div className="inventory-summary-card">
                        <div className="inventory-summary-header">
                          <span className="inventory-summary-title">Dead Stock Value</span>
                          <div className="inventory-summary-icon bg-amber-500/10 text-amber-500">
                            <PackageX size={20} />
                          </div>
                        </div>
                        <div className="inventory-summary-value">{fmt(summary?.deadStockValue)}</div>
                        <div className="inventory-summary-trend warning">Inactive  90 days</div>
                      </div>
                    </div>

                    <h3 className="inventory-section-title mt-8 mb-4">
                      <Activity size={20} className="text-primary" /> Top High-Value Medicines
                    </h3>
                    <div className="inventory-table-wrapper">
                      <div className="inventory-table-scroll">
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
                                <td className="text-on-surface-variant">{item.batch}</td>
                                <td className="numeric font-medium">{item.qty}</td>
                                <td className="numeric">{fmt(item.purchaseValue)}</td>
                                <td className="numeric font-medium">{fmt(item.sellingValue)}</td>
                                <td className="numeric">
                                  <span className="profit-margin">{item.margin}%</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: CATEGORIES */}
                {activeTab === 'categories' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.3 }}
                    className="inventory-charts-grid"
                  >
                    <div className="inventory-card-container">
                      <h3 className="inventory-section-title">Value by Category</h3>
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
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value) => fmt(value)}
                              contentStyle={{
                                backgroundColor: "var(--surface)",
                                borderColor: "var(--border)",
                                borderRadius: "12px",
                                color: "var(--on-surface)",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                padding: "12px 16px"
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="inventory-card-container">
                      <h3 className="inventory-section-title">Category Breakdown</h3>
                      <div className="category-breakdown-list">
                        {categories.map((cat, idx) => {
                          const percentage = totalCategoryValue
                            ? ((cat.value / totalCategoryValue) * 100).toFixed(1)
                            : 0;
                          return (
                            <div className="category-breakdown-item" key={idx}>
                              <div className="category-breakdown-header">
                                <span className="name">
                                  {cat.category} <span className="text-on-surface-variant font-normal text-xs ml-1">({cat.count} items)</span>
                                </span>
                                <span className="value">
                                  {fmt(cat.value)} <span className="text-xs ml-1 font-bold">({percentage}%)</span>
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
                    </div>
                  </motion.div>
                )}

                {/* TAB: RISK & DEAD STOCK */}
                {activeTab === 'risk' && (
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
                            {[...(expiryRisk?.days30 || []), ...(expiryRisk?.days60 || [])].map((item, index) => (
                              <tr key={item.id || index}>
                                <td className="font-semibold">{item.name}</td>
                                <td className="numeric font-medium">{item.qty}</td>
                                <td className="numeric text-rose-500 font-bold">
                                  {fmt(item.value)}
                                </td>
                                <td>
                                  <span className={`risk-badge ${item.daysLeft <= 30 ? 'high' : 'medium'}`}>
                                    {item.daysLeft} days left
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                            {expiryRisk?.deadStock?.map((item) => (
                              <tr key={item.id}>
                                <td className="font-semibold">{item.name}</td>
                                <td className="numeric font-medium">{item.qty}</td>
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
              onClick={() => toast.success("Opening full analytics dashboard...")}
            >
              <FileText size={16} /> Open Full Analytics
            </button>
            <button 
              className="inventory-analytics-btn"
              onClick={() => toast.success("Generating print report...")}
            >
              <Printer size={16} /> Print Report
            </button>
            <button 
              className="inventory-analytics-btn primary"
              onClick={() => toast.success("Exporting CSV file...")}
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
