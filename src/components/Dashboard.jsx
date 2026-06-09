import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Package,
  IndianRupee,
  Receipt,
  Zap,
  Calendar,
  BadgeX,
  CheckCircle,
  Star,
  Users,
  ShieldCheck,
  Download,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import api from "../api";
import { normalizeObjectResponse } from "../utils/apiNormalizer";
import InventoryAnalyticsModal from "./inventory/InventoryAnalyticsModal";

/* 🛠️ Helpers 🛠️ */
const getDays = (d) => {
  try {
    return differenceInDays(new Date(d), new Date());
  } catch {
    return 999;
  }
};
const fmt = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/* ─── MAIN DASHBOARD ─── */
export default function Dashboard({
  medicines = [],
  expiryDays = 30,
  lowStock = 10,
  fetchData = () => {},
  showToast = () => {},
  lastSync = new Date(),
  user = null,
}) {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(
    user?.subscriptionStatus === "TRIAL",
  );
  const [disposalStep, setDisposalStep] = useState(0); // 0=hidden, 1=Form, 2=Review, 3=Success
  const [disposalForm, setDisposalForm] = useState({
    method: "Incineration",
    supervisor: "",
    witness: "",
    location: "",
    notes: "",
    agreed: false,
  });
  const [disposalConfirmText, setDisposalConfirmText] = useState("");
  const [disposalRef, setDisposalRef] = useState("");
  const [isDisposing, setIsDisposing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const [overviewRes, salesRes] = await Promise.all([
          api.get("/dashboard/overview"),
          api.get("/dashboard/sales-summary"),
        ]);
        const overview = normalizeObjectResponse(overviewRes);
        const sales = normalizeObjectResponse(salesRes);
        setDashboardData({ ...overview, salesSummary: sales });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getStock = (m) => m.stock ?? m.currentStock ?? 0;
  const getPrice = (m) => m.mrp || m.purchasePrice || 0;
  const getExpiry = (m) => m.expiryDate || m.expiry;

  const stats = useMemo(() => {
    const backendInv = dashboardData?.inventory;
    if (backendInv) {
      return {
        total: backendInv.totalSku ?? medicines.length,
        expiring: backendInv.expiring30d ?? 0,
        low: backendInv.lowStock ?? 0,
        inventoryValue: backendInv.inventoryValue ?? 0,
      };
    }

    const total = medicines?.length ?? 0;
    const expiringCount = (medicines || []).filter(
      (m) => getStock(m) > 0 && getDays(getExpiry(m)) <= (expiryDays || 30),
    ).length;
    const lowCount = (medicines || []).filter(
      (m) => getStock(m) <= (lowStock || 10),
    ).length;
    const totalValue = (medicines || []).reduce(
      (s, m) => s + Number(getStock(m)) * Number(getPrice(m)),
      0,
    );

    return {
      total,
      expiring: expiringCount,
      low: lowCount,
      inventoryValue: totalValue,
    };
  }, [medicines, expiryDays, lowStock, dashboardData]);

  const expiring = (medicines || [])
    .filter(
      (m) => getStock(m) > 0 && getDays(getExpiry(m)) <= (expiryDays || 30),
    )
    .sort((a, b) => getDays(getExpiry(a)) - getDays(getExpiry(b)));

  const needsReorderList = (medicines || [])
    .filter((m) => getStock(m) > 0 && getStock(m) <= (lowStock || 10))
    .slice(0, 5);

  const canConfirm = disposalConfirmText.trim().toUpperCase() === "DISPOSE";

  const handleAuthorizeDisposal = async () => {
    if (!canConfirm) return;
    setIsDisposing(true);
    try {
      for (const m of expiring) await api.delete(`inventory/medicines/${m.id}`);
      fetchData();
      /* eslint-disable react-hooks/purity */
      setDisposalRef(
        `DSP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      );
      /* eslint-enable react-hooks/purity */
      setDisposalStep(3);
    } catch {
      showToast("Disposal failed", "error");
    } finally {
      setIsDisposing(false);
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--x", `${x}px`);
    e.currentTarget.style.setProperty("--y", `${y}px`);
  };

  const revenueToday = dashboardData?.financials?.todayRevenue ?? 0;
  const billsToday = dashboardData?.financials?.todayInvoices ?? 0;

  if (isLoading && !dashboardData) {
    return (
      <div
        className="reports-loading"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          gap: "16px",
        }}
      >
        <div
          className="animate-spin"
          style={{
            width: "48px",
            height: "48px",
            border: "4px solid var(--primary-container)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
          }}
        />
        <p
          style={{
            color: "var(--text-muted)",
            fontFamily: "Outfit",
            fontWeight: 500,
          }}
        >
          Synchronizing executive insights...
        </p>
      </div>
    );
  }

  return (
    <div className="hub-container">
      {/* 1. ANNOUNCEMENT BANNER */}
      {showBanner && user?.subscriptionStatus === "TRIAL" && (
        <div className="announcement-banner">
          <div className="banner-left">
            <Zap size={14} className="banner-icon" />
            <span>FREE TRIAL ACTIVE: Full access to all features.</span>
          </div>
          <div className="banner-right">
            <button
              className="banner-btn"
              onClick={() => navigate("/subscription")}
            >
              Upgrade Plan
            </button>
            <button
              className="banner-dismiss"
              onClick={() => setShowBanner(false)}
            >
              <BadgeX size={24} />
            </button>
          </div>
        </div>
      )}

      {/* 2. PAGE HEADER */}
      <div className="hub-header">
        <div className="hub-title-group">
          <h2>Intelligence Hub</h2>
          <p>Live overview — medicines, billing, stock, and supply chain</p>
        </div>
        <div className="hub-status-group">
          <div className="status-item">
            <Clock size={12} className="text-on-surface-variant" />
            <span className="text-on-surface-variant">
              LAST SYNC: {format(lastSync || new Date(), "hh:mm:ss a")}
            </span>
          </div>
          <div className="status-item pulsing">
            <div className="pulsing-dot-yellow" />
            <span className="text-yellow-500">CHECKING NODES...</span>
          </div>
        </div>
      </div>

      {/* 3. TOP MINI METRIC ROW */}
      <div className="hub-bottom-metric-row">
        <div
          className="mini-metric-card"
          onClick={() => navigate("/analytics")}
          onMouseMove={handleMouseMove}
        >
          <TrendingUp size={20} className="text-primary" />
          <span>Analytics Dashboard</span>
        </div>
        <div
          className="mini-metric-card cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-1"
          onClick={() => setShowAnalyticsModal(true)}
          onMouseMove={handleMouseMove}
          title="Click to view detailed inventory analytics"
        >
          <IndianRupee size={20} className="text-blue-400" />
          <span>
            Inventory Value:{" "}
            {stats.inventoryValue >= 100000
              ? `₹${(stats.inventoryValue / 100000).toFixed(2)}L`
              : fmt(stats.inventoryValue)}
          </span>
        </div>
        <div
          className="mini-metric-card"
          onClick={() => navigate("/suppliers")}
          onMouseMove={handleMouseMove}
        >
          <Star size={20} className="text-yellow-500" />
          <span>Suppliers: {dashboardData?.suppliers?.total ?? 0}</span>
        </div>
        <div
          className="mini-metric-card"
          onClick={() => navigate("/patients")}
          onMouseMove={handleMouseMove}
        >
          <Users size={20} className="text-purple-400" />
          <span>Patients: {dashboardData?.patients?.total ?? 0}</span>
        </div>
      </div>

      {/* 4. STAT CARDS ROW (6 cards) */}
      <div className="hub-stats-row-v2">
        <div
          className="stat-card-v2"
          onClick={() => navigate("/stock")}
          onMouseMove={handleMouseMove}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">TOTAL SKU</span>
            <div className="stat-v2-icon teal bg-primary/10 text-primary">
              <Package size={14} />
            </div>
          </div>
          <div className="stat-v2-val teal text-primary">{stats.total}</div>
        </div>

        <div
          className="stat-card-v2"
          onClick={() => navigate("/lowstock")}
          onMouseMove={handleMouseMove}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">LOW STOCK</span>
            <div className="stat-v2-icon warning bg-yellow-500/10 text-yellow-500">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="stat-v2-val warning text-yellow-500">
              {stats.low}
            </div>
            {stats.low > 0 && <div className="pulsing-dot-orange" />}
          </div>
        </div>

        <div
          className="stat-card-v2"
          onClick={() => navigate("/expiry")}
          onMouseMove={handleMouseMove}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">EXPIRING 30D</span>
            <div className="stat-v2-icon danger bg-rose-500/10 text-rose-500">
              <Calendar size={14} />
            </div>
          </div>
          <div className="stat-v2-val danger text-rose-500">
            {stats.expiring}
          </div>
        </div>

        <div
          className="stat-card-v2"
          onClick={() => navigate("/billing")}
          onMouseMove={handleMouseMove}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">TODAY'S REVENUE</span>
            <div className="stat-v2-icon teal bg-primary/10 text-primary">
              <IndianRupee size={14} />
            </div>
          </div>
          <div className="stat-v2-val teal text-primary">
            {fmt(revenueToday)}
          </div>
        </div>

        <div
          className="stat-card-v2"
          onClick={() => navigate("/billing")}
          onMouseMove={handleMouseMove}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">BILLS TODAY</span>
            <div className="stat-v2-icon blue bg-blue-500/10 text-blue-400">
              <Receipt size={14} />
            </div>
          </div>
          <div className="stat-v2-val blue text-blue-400">{billsToday}</div>
        </div>

        <div
          className="stat-card-v2"
          onClick={() => navigate("/purchases")}
          onMouseMove={handleMouseMove}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">ALERTS</span>
            <div className="stat-v2-icon purple bg-purple-500/10 text-purple-400">
              <Zap size={14} />
            </div>
          </div>
          <div className="stat-v2-val purple text-purple-400">
            {dashboardData?.alerts?.active ?? 0}
          </div>
        </div>
      </div>

      {/* 5. MAIN GRID */}
      <div className="hub-main-grid">
        {/* LEFT COLUMN 40% */}
        <div className="col-span-5 flex flex-col gap-6">
          <div className="bento-card" onMouseMove={handleMouseMove}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-yellow-500" />
                <h3 className="bento-title !mb-0">Needs Reorder</h3>
                {stats.low > 0 && (
                  <span className="count-badge warning">{stats.low}</span>
                )}
              </div>
              <button
                className="view-all-link text-primary font-bold text-[13px] hover:underline cursor-pointer"
                onClick={() => navigate("/lowstock")}
              >
                View All →
              </button>
            </div>

            <div className="mini-table-v2">
              <div className="mini-table-head">
                <span>MEDICINE</span>
                <span>STOCK</span>
                <span>ACTION</span>
              </div>
              <div className="mini-table-body flex flex-col gap-1">
                {needsReorderList.length > 0 ? (
                  needsReorderList.map((item) => (
                    <div
                      key={item.id}
                      className="mini-table-row"
                      onClick={() => navigate("/stock")}
                    >
                      <span className="row-med">{item.name}</span>
                      <span className="row-stock text-yellow-500 font-bold">
                        {item.stock ?? item.currentStock ?? 0} units
                      </span>
                      <span className="row-act">
                        <button
                          className="micro-btn-teal"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/purchases");
                          }}
                        >
                          Raise PO
                        </button>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-on-surface-variant text-sm">
                    Inventory levels are healthy.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN 60% */}
        <div className="col-span-7 flex flex-col gap-6">
          <div
            className="urgent-expiries-card"
            onClick={() => navigate("/expiry")}
            onMouseMove={handleMouseMove}
          >
            <div className="urgent-expiries-header">
              <div className="urgent-icon-wrapper">
                <AlertTriangle size={24} className="text-rose-500" />
              </div>
              <div className="urgent-header-text">
                <h3>Urgent Expiries</h3>
                <p>{expiring.length} products require disposal</p>
              </div>
            </div>

            <div className="urgent-table">
              <div className="urgent-table-head">
                <span>Product</span>
                <span>Barcode</span>
                <span>Expired</span>
                <span>Stock</span>
              </div>
              <div className="urgent-table-body">
                {expiring.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-on-surface-variant">
                    <CheckCircle size={32} className="text-primary" />
                    <span className="font-bold text-[14px]">
                      No urgent expiries
                    </span>
                  </div>
                ) : (
                  expiring.slice(0, 5).map((m) => {
                    const days = getDays(getExpiry(m));
                    const isOverdue = days <= 0;
                    const displayDays = isOverdue ? Math.abs(days) : days;

                    return (
                      <div key={m.id} className="urgent-table-row">
                        <span className="urgent-med-name">{m.name}</span>
                        <span className="urgent-batch">
                          {m.batchNumber || "B-001"}
                        </span>
                        <span className="urgent-days">
                          <div
                            className={`urgent-badge ${isOverdue ? "overdue" : "warning"}`}
                          >
                            {isOverdue
                              ? `🔴 ${displayDays} Days Overdue`
                              : `🟠 ${displayDays} Days Left`}
                          </div>
                        </span>
                        <span className="urgent-qty">{getStock(m)} Units</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {expiring.length > 0 && (
              <button
                className="urgent-disposal-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setDisposalStep(1);
                  setDisposalForm({
                    method: "Incineration",
                    supervisor: "",
                    witness: "",
                    location: "",
                    notes: "",
                    agreed: false,
                  });
                  setDisposalConfirmText("");
                }}
              >
                Authorize Disposal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disposal Workflow Modals */}
      <AnimatePresence>
        {disposalStep === 1 && (
          <div className="modal-overlay">
            <motion.div
              className="urgent-disposal-modal !max-w-[700px]"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="urgent-modal-icon">
                <ShieldCheck size={32} />
              </div>
              <h3 className="urgent-modal-title">Verify Disposal Process</h3>
              <p className="urgent-modal-desc">
                Complete disposal verification before removing expired
                inventory.
              </p>

              <div className="disposal-summary-card compact-summary">
                <div>
                  <span>Items:</span> <b>{expiring.length}</b>
                </div>
                <div>
                  <span>Units:</span>{" "}
                  <b>{expiring.reduce((sum, m) => sum + getStock(m), 0)}</b>
                </div>
                <div>
                  <span>Date:</span> <b>Today</b>
                </div>
                <div>
                  <span>Products:</span> <b>{expiring.length}</b>
                </div>
              </div>

              <div className="disposal-form-grid compact-form">
                <div className="form-group">
                  <label>Disposal Method</label>
                  <select
                    value={disposalForm.method}
                    onChange={(e) =>
                      setDisposalForm({
                        ...disposalForm,
                        method: e.target.value,
                      })
                    }
                  >
                    <option>Incineration</option>
                    <option>Bio Medical Waste Vendor</option>
                    <option>Return To Manufacturer</option>
                    <option>Destroyed On Site</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Disposal Location</label>
                  <input
                    placeholder="Waste Storage Room"
                    value={disposalForm.location}
                    onChange={(e) =>
                      setDisposalForm({
                        ...disposalForm,
                        location: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Disposal Supervisor</label>
                  <input
                    placeholder="Supervisor Name"
                    value={disposalForm.supervisor}
                    onChange={(e) =>
                      setDisposalForm({
                        ...disposalForm,
                        supervisor: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Witness Name</label>
                  <input
                    placeholder="Witness Name"
                    value={disposalForm.witness}
                    onChange={(e) =>
                      setDisposalForm({
                        ...disposalForm,
                        witness: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group full-width">
                  <label>Disposal Notes</label>
                  <textarea
                    placeholder="Enter disposal notes..."
                    value={disposalForm.notes}
                    onChange={(e) =>
                      setDisposalForm({
                        ...disposalForm,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group full-width checkbox-group">
                  <input
                    type="checkbox"
                    id="compliance-check"
                    checked={disposalForm.agreed}
                    onChange={(e) =>
                      setDisposalForm({
                        ...disposalForm,
                        agreed: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor="compliance-check">
                    I confirm that all listed products have been physically
                    removed and disposed according to clinical waste management
                    regulations.
                  </label>
                </div>
              </div>

              <div className="urgent-modal-divider" />

              <div className="urgent-modal-actions sticky-actions">
                <button
                  className="urgent-modal-btn-cancel"
                  onClick={() => setDisposalStep(0)}
                >
                  Cancel
                </button>
                <button
                  className="urgent-modal-btn-verify disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    !disposalForm.agreed ||
                    !disposalForm.supervisor ||
                    !disposalForm.witness
                  }
                  onClick={() => setDisposalStep(2)}
                >
                  Continue Review
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {disposalStep === 2 && (
          <div className="modal-overlay">
            <motion.div
              className="urgent-disposal-modal !max-w-[700px]"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="urgent-modal-title !text-left">
                Review Disposal Details
              </h3>
              <p className="urgent-modal-desc !text-left">
                Please verify all information before permanently removing
                inventory.
              </p>

              <div className="disposal-summary-card compact-summary">
                <div>
                  <span>Method:</span>
                  <b>{disposalForm.method}</b>
                </div>
                <div>
                  <span>Supervisor:</span>
                  <b>{disposalForm.supervisor}</b>
                </div>
                <div>
                  <span>Witness:</span>
                  <b>{disposalForm.witness}</b>
                </div>
                <div>
                  <span>Location:</span>
                  <b>{disposalForm.location || "N/A"}</b>
                </div>
              </div>

              <div className="disposal-review-table-container compact-table-container">
                <table className="disposal-review-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Overdue</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiring.map((m) => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>{Math.abs(getDays(getExpiry(m)))} Days</td>
                        <td>{getStock(m)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="disposal-risk-card compact-risk">
                <div className="flex gap-3">
                  <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-rose-600 mb-1">
                      This action is irreversible.
                    </h4>
                    <p className="text-rose-500/80 text-xs">
                      Disposed products will be removed from active inventory
                      and recorded in disposal audit logs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="disposal-confirm-input compact-input">
                <label>Type DISPOSE to confirm</label>
                <input
                  type="text"
                  value={disposalConfirmText}
                  onChange={(e) => setDisposalConfirmText(e.target.value)}
                  placeholder="DISPOSE"
                />
                {!canConfirm && disposalConfirmText.length > 0 && (
                  <span className="text-[11px] text-rose-500 text-center font-semibold mt-1">
                    Please type exactly "DISPOSE"
                  </span>
                )}
              </div>

              <div className="urgent-modal-divider" />

              <div className="urgent-modal-actions sticky-actions">
                <button
                  className="urgent-modal-btn-cancel"
                  onClick={() => setDisposalStep(1)}
                  disabled={isDisposing}
                >
                  Back
                </button>
                <button
                  className="urgent-modal-btn-verify flex items-center justify-center gap-2"
                  style={{
                    opacity: canConfirm ? 1 : 0.5,
                    cursor: canConfirm ? "pointer" : "not-allowed",
                  }}
                  disabled={!canConfirm || isDisposing}
                  onClick={handleAuthorizeDisposal}
                >
                  {isDisposing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Disposing Inventory...
                    </>
                  ) : (
                    "Confirm Disposal"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {disposalStep === 3 && (
          <div className="modal-overlay">
            <motion.div
              className="urgent-disposal-modal !max-w-[450px]"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="urgent-modal-icon !bg-emerald-100 !text-emerald-500 !w-16 !h-16 !mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="urgent-modal-title !text-2xl !mb-2">
                Disposal Completed
              </h3>
              <div className="urgent-modal-desc mb-6">
                <p className="text-emerald-600 font-medium">
                  {expiring.length} Products Removed
                </p>
                <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-200 inline-block px-6">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Reference
                  </span>
                  <div className="font-mono text-base font-bold text-slate-800">
                    {disposalRef}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="urgent-modal-btn-cancel flex-1 text-xs">
                  <Download size={14} className="mr-1 inline" /> Report
                </button>
                <button
                  className="urgent-modal-btn-verify flex-1 text-xs"
                  onClick={() => setDisposalStep(0)}
                >
                  Back To Inventory
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <InventoryAnalyticsModal 
        isOpen={showAnalyticsModal} 
        onClose={() => setShowAnalyticsModal(false)} 
      />
    </div>
  );
}
