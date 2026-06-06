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
  X,
  CheckCircle,
  Star,
  Users,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import api from "../api";
import { normalizeObjectResponse } from "../utils/apiNormalizer";
import "../styles/IntelligenceHub.css";

/* ─── Helpers ─── */
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
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

  const handleAuthorizeDisposal = async () => {
    setShowConfirm(false);
    try {
      for (const m of expiring) await api.delete(`inventory/medicines/${m.id}`);
      fetchData();
      showToast("Clinical Disposal Authorized & Executed", "success");
    } catch {
      showToast("Authorization failed", "error");
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
              <X size={14} />
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
          className="mini-metric-card"
          onClick={() => navigate("/inventory")}
          onMouseMove={handleMouseMove}
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
          onClick={() => navigate("/inventory")}
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
          onClick={() => navigate("/inventory")}
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
        {/* LEFT COLUMN 60% */}
        <div className="col-span-7 flex flex-col gap-6">
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
                      onClick={() => navigate("/inventory")}
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

        {/* RIGHT COLUMN 40% */}
        <div className="col-span-5 flex flex-col gap-6">
          <div
            className="bento-card"
            onClick={() => navigate("/inventory")}
            onMouseMove={handleMouseMove}
          >
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle size={18} className="text-rose-500" />
              <h3 className="bento-title !text-[12px] !mb-0 !text-rose-500 uppercase tracking-widest">
                URGENT EXPIRIES
              </h3>
            </div>

            <div className="expiry-list-v2">
              {expiring.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-on-surface-variant">
                  <CheckCircle size={32} className="text-primary" />
                  <span className="font-bold text-[14px]">
                    No urgent expiries
                  </span>
                </div>
              ) : (
                expiring.slice(0, 5).map((m) => (
                  <div key={m.id} className="expiry-row-v2">
                    <span className="med-name">{m.name}</span>
                    <span className="batch-id">{m.batchNumber || "B-001"}</span>
                    <span className="days-left red">
                      {getDays(getExpiry(m))} days
                    </span>
                    <span className="qty text-on-surface-variant">
                      {getStock(m)} qty
                    </span>
                  </div>
                ))
              )}
            </div>

            {expiring.length > 0 && (
              <button
                className="authorize-disposal-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
              >
                AUTHORIZE DISPOSAL
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="modal-overlay">
            <motion.div
              className="modal-content !max-w-[440px] p-8"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-center text-[24px] font-black text-on-surface mb-2">
                Authorize Disposal?
              </h3>
              <p className="text-center text-on-surface-variant text-[14px] font-medium leading-relaxed mb-8">
                This action will permanently remove {expiring.length} expired
                items from the digital inventory. Physical disposal must follow
                clinical waste protocols.
              </p>
              <div className="flex gap-4">
                <button
                  className="modal-btn cancel flex-1"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="modal-btn confirm !bg-rose-500 !text-white flex-1"
                  onClick={handleAuthorizeDisposal}
                >
                  Verify & Dispose
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
