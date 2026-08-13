import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  Package,
  IndianRupee,
  Receipt,
  Zap,
  Calendar,
  BadgeX,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import api from "../api";
import { normalizeObjectResponse } from "../utils/apiNormalizer";
import InventoryAnalyticsModal from "./inventory/InventoryAnalyticsModal";
import { safeNumber } from "../utils/number.js";

const getDays = (d) => {
  try {
    return differenceInDays(new Date(d), new Date());
  } catch {
    return 999;
  }
};
const fmt = (n) =>
  `₹${safeNumber(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/* ─── MAIN DASHBOARD ─── */
export default function Dashboard({
  medicines = [],
  expiryDays = 30,
  lowStock = 10,
  lastSync = new Date(),
  user = null,
}) {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(
    user?.subscriptionStatus === "TRIAL",
  );
  const [dashboardData, setDashboardData] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const [overviewRes, salesRes, expiredRes, metricsRes, reconRes] =
          await Promise.all([
            api.get("/dashboard/overview"),
            api.get("/dashboard/sales-summary"),
            api.get("/inventory/expired/overview").catch(() => null),
            api.get("/inventory/expiry-metrics").catch(() => null),
            api.get("/inventory/reconciliation").catch(() => null),
          ]);
        const overview = normalizeObjectResponse(overviewRes);
        const sales = normalizeObjectResponse(salesRes);
        const expiredOv = normalizeObjectResponse(expiredRes);
        const expiryMetrics = normalizeObjectResponse(metricsRes);
        const reconciliation = normalizeObjectResponse(reconRes);
        setDashboardData({
          ...overview,
          salesSummary: sales,
          expiredOverview: expiredOv,
          expiryMetrics,
          reconciliation,
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        setDashboardData(null);
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
    const recon = dashboardData?.reconciliation;
    const backendInv = dashboardData?.inventory;
    const expiryMetrics = dashboardData?.expiryMetrics;

    // Use reconciliation data if available (single source of truth)
    if (recon) {
      return {
        total: recon.totalSku ?? 0,
        inStock: recon.inStock ?? 0,
        lowStock: recon.lowStock ?? 0,
        outOfStock: recon.outOfStock ?? 0,
        expired: recon.expired ?? 0,
        expiring: recon.expiring30Combined ?? recon.expiring30 ?? 0,
        expiring7: recon.expiring7 ?? 0,
        expiring90: recon.expiring90 ?? 0,
        inventoryValue: recon.inventoryValue ?? 0,
        reconciliationOk: recon.reconciliationOk ?? false,
      };
    }

    // Fallback to backend overview
    if (backendInv) {
      return {
        total: backendInv.totalSku ?? medicines.length,
        expiring: expiryMetrics
          ? (expiryMetrics.expiring30Products ?? expiryMetrics.expiring30 ?? 0)
          : (backendInv.expiring30d ?? 0),
        lowStock: backendInv.lowStock ?? 0,
        inventoryValue: backendInv.inventoryValue ?? 0,
      };
    }

    const total = medicines?.length ?? 0;
    const expiringCount = (medicines || []).filter(
      (m) => getStock(m) > 0 && getDays(getExpiry(m)) <= (expiryDays || 30),
    ).length;
    const lowCount = (medicines || []).filter(
      (m) =>
        getStock(m) <= (m.reorderLevel ?? m.reorderPoint ?? lowStock ?? 10),
    ).length;
    const totalValue = (medicines || []).reduce(
      (s, m) => s + safeNumber(getStock(m)) * safeNumber(getPrice(m)),
      0,
    );

    return {
      total,
      expiring: expiringCount,
      lowStock: lowCount,
      inventoryValue: totalValue,
    };
  }, [medicines, expiryDays, lowStock, dashboardData]);

  const expiring = (medicines || [])
    .filter(
      (m) => getStock(m) > 0 && getDays(getExpiry(m)) <= (expiryDays || 30),
    )
    .sort((a, b) => getDays(getExpiry(a)) - getDays(getExpiry(b)));

  const needsReorderList = (medicines || [])
    .filter(
      (m) =>
        getStock(m) > 0 &&
        getStock(m) <= (m.reorderLevel ?? m.reorderPoint ?? lowStock ?? 10),
    )
    .slice(0, 5);

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

  if (!isLoading && !dashboardData) {
    return (
      <div
        className="hub-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          gap: 16,
        }}
      >
        <AlertTriangle size={40} style={{ color: "var(--danger)" }} />
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>
          Failed to load dashboard
        </h3>
        <p
          style={{
            color: "var(--text-muted)",
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          Could not fetch dashboard data. Please check your connection and try
          again.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            background: "var(--primary)",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Retry
        </button>
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
              {stats.lowStock}
            </div>
            {stats.lowStock > 0 && <div className="pulsing-dot-orange" />}
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
                <h3 className="bento-title mb-0!">Needs Reorder</h3>
                {stats.lowStock > 0 && (
                  <span className="count-badge warning">{stats.lowStock}</span>
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
                            navigate("/purchases", {
                              state: {
                                action: "raise-po",
                                medicine: {
                                  id: item.id,
                                  name: item.name,
                                  purchasePrice:
                                    item.purchasePrice || item.price || 0,
                                  reorderQty:
                                    item.reorderLevel || item.minStock || 50,
                                  gstPercentage: item.gstPercentage || 12,
                                },
                              },
                            });
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
          <div className="urgent-expiries-card" onMouseMove={handleMouseMove}>
            <div className="urgent-expiries-header">
              <div className="urgent-icon-wrapper">
                <AlertTriangle size={24} className="text-rose-500" />
              </div>
              <div className="urgent-header-text">
                <h3>Products Expired</h3>
                <p>
                  {dashboardData?.expiryMetrics
                    ? (dashboardData.expiryMetrics.expiredProducts ??
                      dashboardData.expiryMetrics.expired)
                    : (dashboardData?.expiredOverview?.totalExpiredProducts ??
                      expiring.length)}{" "}
                  products require disposal
                </p>
              </div>
            </div>

            {dashboardData?.expiredOverview ? (
              <div style={{ padding: "0 20px 16px" }}>
                <div className="disposal-summary-card compact-summary">
                  <div>
                    <span>Expired Products:</span>{" "}
                    <b>
                      {dashboardData?.expiryMetrics
                        ? (dashboardData.expiryMetrics.expiredProducts ??
                          dashboardData.expiryMetrics.expired)
                        : dashboardData.expiredOverview.totalExpiredProducts}
                    </b>
                  </div>
                  <div>
                    <span>Total Units:</span>{" "}
                    <b>
                      {dashboardData?.expiryMetrics?.expiredUnits != null
                        ? dashboardData.expiryMetrics.expiredUnits
                        : dashboardData.expiredOverview.totalUnits}
                    </b>
                  </div>
                  <div>
                    <span>Inventory Loss:</span>{" "}
                    <b className="text-rose-500">
                      ₹
                      {safeNumber(
                        dashboardData?.expiryMetrics?.expiredValue != null
                          ? dashboardData.expiryMetrics.expiredValue
                          : dashboardData.expiredOverview.totalInventoryValue,
                      ).toLocaleString("en-IN")}
                    </b>
                  </div>
                </div>

                <button
                  className="urgent-disposal-btn"
                  style={{ marginTop: 12 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/expiry/bulk-disposal");
                  }}
                >
                  <Trash2 size={14} style={{ marginRight: 7 }} />
                  Bulk Dispose
                </button>
              </div>
            ) : (
              <>
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
                      expiring.map((m) => {
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
                                  ? ` ${displayDays} Days Overdue`
                                  : ` ${displayDays} Days Left`}
                              </div>
                            </span>
                            <span className="urgent-qty">
                              {getStock(m)} Units
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {(dashboardData?.expiryMetrics
                  ? (dashboardData.expiryMetrics.expiredProducts ??
                    dashboardData.expiryMetrics.expired)
                  : (dashboardData?.expiredOverview?.totalExpiredProducts ??
                    expiring.length)) > 0 && (
                  <button
                    className="urgent-disposal-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/expiry/bulk-disposal");
                    }}
                  >
                    <AlertTriangle size={14} style={{ marginRight: 6 }} />
                    View All Expired
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <InventoryAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />
    </div>
  );
}
