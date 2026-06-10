import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Bell,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Layers,
  TrendingUp,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  Info,
  Plus,
  Eye,
  Edit3,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../api";
function getDays(expiryDate) {
  const diff = new Date(expiryDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function computeStatus(days, qty) {
  if (qty <= 0) return "safe";
  if (days < 0) return "expired";
  if (days <= 7) return "danger";
  if (days <= 30) return "warning";
  return "safe";
}

export default function ExpiryBatchIntelligence({ showToast }) {
  const [batches, setBatches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timeline");
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [fifoEnabled, setFifoEnabled] = useState(true);
  const [expandedMed, setExpandedMed] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [batchRes, recRes] = await Promise.all([
          api.get("/intelligence/batches"),
          api.get("/intelligence/recommendations").catch(() => null),
        ]);

        const rawBatches = Array.isArray(batchRes.data?.data)
          ? batchRes.data.data
          : Array.isArray(batchRes.data)
            ? batchRes.data
            : [];
        const mapped = rawBatches
          .filter((b) => b.quantity > 0)
          .map((b) => {
            const days = getDays(b.expiryDate);
            return {
              id: b.batchNumber || b.id,
              med: b.medicine?.name || "Unknown",
              brand: "",
              exp: b.expiryDate,
              days,
              qty: b.quantity,
              val: Number(b.quantity) * Number(b.purchasePrice || 0),
              status: computeStatus(days, b.quantity),
              rank: 1,
              received: b.createdAt?.split("T")[0] || "",
              mfg: b.manufacturingDate?.split("T")[0] || "",
              supplier: b.supplier?.name || "",
            };
          });
        setBatches(mapped);

        const recs = recRes?.data?.data || recRes?.data || [];
        const mappedRecs = Array.isArray(recs)
          ? recs.map((r) => {
              const batch = r.batch || {};
              const days = r.recommendedDays ?? getDays(batch.expiryDate);
              const qty = batch.quantity || 0;
              return {
                med: batch.medicine?.name || "Unknown",
                batch: batch.batchNumber || r.id || "",
                days,
                qty,
                val: Number(qty) * Number(batch.purchasePrice || 0),
                urgency: days <= 7 ? "danger" : days <= 30 ? "warning" : "info",
                supplier: batch.supplier?.name || "",
              };
            })
          : [];
        setSuggestions(mappedRecs);
      } catch (error) {
        console.error("Failed to load expiry intelligence:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [alertSettings, setAlertSettings] = useState({
    warning: 30,
    critical: 7,
    email: true,
    whatsapp: false,
  });
  const [frequency, setFrequency] = useState("Daily Digest");
  const [showFifoConfirm, setShowFifoConfirm] = useState(false);
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState("Near Expiry Stock");
  const [discountPct, setDiscountPct] = useState(15);
  const [discountDuration, setDiscountDuration] = useState(7);
  const [disposalMethod, setDisposalMethod] = useState(
    "Standard Medical Waste",
  );
  const [disposalNotes, setDisposalNotes] = useState("");
  const [invSearch, setInvSearch] = useState("");
  const [invFilter, setInvFilter] = useState("ALL");
  const [showInvFilterDropdown, setShowInvFilterDropdown] = useState(false);

  const INV_FILTER_OPTIONS = [
    { label: "All Batches", value: "ALL" },
    { label: "Expired", value: "EXPIRED" },
    { label: "Critical (< 7 days)", value: "DANGER" },
    { label: "Warning (7-30 days)", value: "WARNING" },
    { label: "Safe (90+ days)", value: "SAFE" },
  ];

  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  const [showViewBatchModal, setShowViewBatchModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBatchForDelete, setSelectedBatchForDelete] = useState(null);
  const [editBatch, setEditBatch] = useState(null);
  const [viewBatch, setViewBatch] = useState(null);
  const [newBatch, setNewBatch] = useState({
    med: "",
    brand: "",
    supplier: "",
    exp: "",
    mfg: "",
    qty: "",
    val: "",
    received: new Date().toISOString().split("T")[0],
  });

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if ((b.qty || b.quantity) <= 0) return false;
      const matchesSearch =
        !invSearch ||
        b.med?.toLowerCase().includes(invSearch.toLowerCase()) ||
        b.brand?.toLowerCase().includes(invSearch.toLowerCase()) ||
        b.batch?.toLowerCase().includes(invSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (invFilter === "ALL") return true;
      return b.status === invFilter;
    });
  }, [batches, invSearch, invFilter]);

  const invFilteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if ((b.qty || b.quantity) <= 0) return false;
      const matchesSearch =
        !invSearch ||
        b.med?.toLowerCase().includes(invSearch.toLowerCase()) ||
        b.brand?.toLowerCase().includes(invSearch.toLowerCase()) ||
        b.batch?.toLowerCase().includes(invSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (invFilter === "ALL") return true;
      return b.status === invFilter;
    });
  }, [batches, invSearch, invFilter]);

  const dynamicStats = useMemo(() => {
    const activeBatches = batches.filter((b) => (b.qty || b.quantity) > 0);
    const expired = activeBatches.filter(
      (b) => b.status === "expired" || b.days < 0,
    ).length;
    const wk1 = activeBatches.filter((b) => b.days >= 0 && b.days < 7).length;
    const mo1 = activeBatches.filter((b) => b.days >= 7 && b.days < 30).length;
    const mo3 = activeBatches.filter((b) => b.days >= 30 && b.days < 90).length;
    return [
      {
        label: "EXPIRED NOW",
        val: expired,
        col: "var(--danger)",
        icon: CalendarX,
        key: "EXPIRED",
      },
      {
        label: "EXPIRING < 7 DAYS",
        val: wk1,
        col: "var(--warning)",
        icon: CalendarX,
        key: "< 7 DAYS",
      },
      {
        label: "EXPIRING < 30 DAYS",
        val: mo1,
        col: "var(--warning)",
        icon: CalendarDays,
        key: "7-30 DAYS",
      },
      {
        label: "EXPIRING < 90 DAYS",
        val: mo3,
        col: "var(--info)",
        icon: CalendarCheck,
        key: "30-90 DAYS",
      },
      {
        label: "TOTAL BATCHES",
        val: activeBatches.length,
        col: "var(--primary)",
        icon: Layers,
        key: "ALL",
      },
    ];
  }, [batches]);

  const timelineCounts = useMemo(() => {
    const activeBatches = batches.filter((b) => (b.qty || b.quantity) > 0);
    const expired = activeBatches.filter(
      (b) => b.status === "expired" || b.days < 0,
    ).length;
    const urg7 = activeBatches.filter((b) => b.days >= 0 && b.days < 7).length;
    const urg30 = activeBatches.filter(
      (b) => b.days >= 7 && b.days < 30,
    ).length;
    const urg90 = activeBatches.filter(
      (b) => b.days >= 30 && b.days < 90,
    ).length;
    const safe = activeBatches.filter(
      (b) => b.days >= 90 || b.status === "safe",
    ).length;
    const total = activeBatches.length || 1;
    return { expired, urg7, urg30, urg90, safe, total };
  }, [batches]);

  const fifoMedicines = useMemo(() => {
    const grouped = {};
    batches.forEach((b) => {
      if (!grouped[b.med]) grouped[b.med] = [];
      grouped[b.med].push(b);
    });
    Object.keys(grouped).forEach((med) => {
      grouped[med].sort((a, b) => (a.days || 999) - (b.days || 999));
      grouped[med] = grouped[med].map((b, i) => ({ ...b, rank: i + 1 }));
    });
    return grouped;
  }, [batches]);

  const expiredCount = batches.filter(
    (b) => b.status === "expired" || b.days < 0,
  ).length;

  const exportExpiryReport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Expiry Report");

      worksheet.columns = [
        { header: "Medicine", key: "Medicine", width: 25 },
        { header: "Batch", key: "Batch", width: 15 },
        { header: "Supplier", key: "Supplier", width: 20 },
        { header: "MFG", key: "MFG", width: 12 },
        { header: "Expiry", key: "Expiry", width: 12 },
        { header: "Days Left", key: "DaysLeft", width: 12 },
        { header: "Quantity", key: "Quantity", width: 10 },
        { header: "Value ₹", key: "Value", width: 12 },
        { header: "Status", key: "Status", width: 12 },
      ];

      const reportData = batches.map((b) => ({
        Medicine: b.med,
        Batch: b.id,
        Supplier: b.brand,
        MFG: b.mfg,
        Expiry: b.exp,
        DaysLeft: b.days < 0 ? "EXPIRED" : `${b.days} Days`,
        Quantity: b.qty,
        Value: b.val,
        Status: b.status.toUpperCase(),
      }));

      worksheet.addRows(reportData);

      const buffer = await workbook.xlsx.writeBuffer();
      const fileData = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(fileData, `expiry-report-${Date.now()}.xlsx`);
      showToast("Expiry report exported successfully", "success");
    } catch (error) {
      console.error("Failed to export expiry report", error);
      showToast("Export failed", "error");
    }
  };

  const handleAction = (type, item) => {
    setSelectedItem(item);
    setActionType(type);
    setReturnQty(item?.qty || 1);
    setReturnReason("Near Expiry Stock");
    setDiscountPct(15);
    setDiscountDuration(7);
    setDisposalMethod("Standard Medical Waste");
    setDisposalNotes("");
    setProcessing(false);
    setShowActionModal(true);
  };

  const matchesSelectedItem = (item) => {
    if (selectedItem?.id) return item.id === selectedItem.id;
    if (selectedItem?.batch) return item.batch === selectedItem.batch;
    return false;
  };

  const confirmAction = () => {
    setProcessing(true);
    setTimeout(() => {
      if (actionType === "DISPOSE") {
        setBatches((prev) => prev.filter((item) => !matchesSelectedItem(item)));
        showToast("Batch disposed successfully", "success");
      } else if (actionType === "RETURN") {
        setBatches((prev) =>
          prev.map((item) => {
            if (matchesSelectedItem(item)) {
              const newQty = Math.max((item.qty || 0) - (returnQty || 1), 0);
              return { ...item, qty: newQty };
            }
            return item;
          }),
        );
        showToast(`Return of ${returnQty} units initiated`, "success");
      } else if (actionType === "DISCOUNT") {
        setBatches((prev) =>
          prev.map((item) => {
            if (matchesSelectedItem(item)) {
              return { ...item, discountApplied: true };
            }
            return item;
          }),
        );
        showToast(`${discountPct}% discount applied`, "success");
      }
      setProcessing(false);
      setShowActionModal(false);
    }, 1200);
  };

  const handleRemindPos = (item) => {
    setReminders((prev) => [...prev, item.med || item.batch]);
    showToast(`POS reminder set for ${item.med}`, "success");
  };

  const handleViewBatch = (b) => {
    setViewBatch(b);
    setShowViewBatchModal(true);
  };

  const handleEditBatch = (b) => {
    setEditBatch({ ...b });
    setShowEditBatchModal(true);
  };

  const saveEditBatch = () => {
    setBatches((prev) =>
      prev.map((b) => (b.id === editBatch.id ? editBatch : b)),
    );
    setShowEditBatchModal(false);
    showToast("Batch updated successfully", "success");
  };

  const handleDeleteClick = (b) => {
    setSelectedBatchForDelete(b);
    setShowDeleteModal(true);
  };

  const confirmDeleteBatch = () => {
    if (!selectedBatchForDelete) return;
    setBatches((prev) =>
      prev.filter((item) => item.id !== selectedBatchForDelete.id),
    );
    showToast("Batch deleted successfully", "success");
    setShowDeleteModal(false);
    setSelectedBatchForDelete(null);
  };

  const addNewBatch = () => {
    if (!newBatch.med || !newBatch.qty) {
      showToast("Medicine name and quantity are required", "error");
      return;
    }
    const id = `B-${Date.now().toString(36).toUpperCase()}`;
    const today = new Date();
    const expDate = new Date(newBatch.exp || today);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    let status = "safe";
    if (diffDays < 0) status = "expired";
    else if (diffDays < 7) status = "danger";
    else if (diffDays < 30) status = "warning";

    const batch = {
      id,
      med: newBatch.med,
      brand: newBatch.brand || newBatch.supplier || "Unknown",
      supplier: newBatch.supplier || newBatch.brand || "Unknown",
      exp: newBatch.exp,
      days: diffDays,
      qty: Number(newBatch.qty),
      val: Number(newBatch.val) || 0,
      status,
      rank: 1,
      received: newBatch.received || today.toISOString().split("T")[0],
      mfg: newBatch.mfg || "",
    };
    setBatches((prev) => [...prev, batch]);
    setShowAddBatchModal(false);
    setNewBatch({
      med: "",
      brand: "",
      supplier: "",
      exp: "",
      mfg: "",
      qty: "",
      val: "",
      received: new Date().toISOString().split("T")[0],
    });
    showToast("Batch added successfully", "success");
  };

  return (
    <div className="expiry-container">
      <div className="purchases-header">
        <div>
          <h1
            style={{ fontFamily: "Outfit", fontSize: "28px", fontWeight: 700 }}
          >
            Expiry & Batch Intelligence
          </h1>
          <p className="result-meta">
            FIFO-enforced tracking, auto-alerts, and near-expiry action
            suggestions.
          </p>
          <div className="purchases-tabs">
            {["Timeline", "Inventory", "Traceability"].map((t) => (
              <button
                key={t}
                className={`p-tab ${activeTab === t.toLowerCase() ? "active" : ""}`}
                onClick={() => setActiveTab(t.toLowerCase())}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="pos-btn outline"
            onClick={() => setShowConfigModal(true)}
          >
            <Bell size={16} /> Configure Alerts
          </button>
          <button className="pos-btn teal" onClick={exportExpiryReport}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* ── Alert Banner ── */}
      {showBanner && expiredCount > 0 && (
        <div className="expiry-alert-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertTriangle size={24} color="var(--danger)" />
            <span
              style={{
                fontFamily: "Outfit",
                fontWeight: 600,
                fontSize: "14px",
                color: "var(--danger)",
              }}
            >
              {expiredCount}{" "}
              {expiredCount === 1 ? "medicine has" : "medicines have"} EXPIRED —
              Immediate action required
            </span>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="pos-btn danger"
              style={{ padding: "6px 12px", fontSize: "12px" }}
              onClick={() => {
                setFilter("EXPIRED");
                setActiveTab("timeline");
              }}
            >
              Take Action
            </button>
            <button className="micro-btn" onClick={() => setShowBanner(false)}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="expiry-stats-grid">
        {dynamicStats.map((s, i) => (
          <div
            key={i}
            className="pos-stat-card"
            onClick={() => setFilter(s.key)}
            style={{
              borderLeft:
                filter === s.key
                  ? `4px solid ${s.col}`
                  : "1px solid var(--outline-variant)",
              cursor: "pointer",
            }}
          >
            <div className="stat-card-header">
              <span className="stat-label">{s.label}</span>
              <div
                className="stat-icon"
                style={{ backgroundColor: `${s.col}15`, color: s.col }}
              >
                <s.icon size={16} />
              </div>
            </div>
            <div className="stat-value">{s.val}</div>
          </div>
        ))}
      </div>

      {/* ───────────────────── TIMELINE TAB ───────────────────── */}
      {activeTab === "timeline" && loading ? (
        <div className="empty-state">Loading batches...</div>
      ) : (
        activeTab === "timeline" && (
          <>
            <div className="visual-timeline-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 700,
                    fontSize: "16px",
                  }}
                >
                  Stock Aging Breakdown
                </div>
                <div className="result-meta">
                  {timelineCounts.total} batches tracked
                </div>
              </div>
              <div className="timeline-bar">
                <div
                  className="timeline-segment expired"
                  style={{
                    width: `${Math.max((timelineCounts.expired / timelineCounts.total) * 100, 3)}%`,
                  }}
                  onClick={() => setFilter("EXPIRED")}
                >
                  EXPIRED {timelineCounts.expired}
                </div>
                <div
                  className="timeline-segment urg-7"
                  style={{
                    width: `${Math.max((timelineCounts.urg7 / timelineCounts.total) * 100, 3)}%`,
                  }}
                  onClick={() => setFilter("< 7 DAYS")}
                >
                  &lt; 7D {timelineCounts.urg7}
                </div>
                <div
                  className="timeline-segment urg-30"
                  style={{
                    width: `${Math.max((timelineCounts.urg30 / timelineCounts.total) * 100, 3)}%`,
                  }}
                  onClick={() => setFilter("7-30 DAYS")}
                >
                  &lt; 30D {timelineCounts.urg30}
                </div>
                <div
                  className="timeline-segment urg-90"
                  style={{
                    width: `${Math.max((timelineCounts.urg90 / timelineCounts.total) * 100, 3)}%`,
                  }}
                  onClick={() => setFilter("30-90 DAYS")}
                >
                  &lt; 90D {timelineCounts.urg90}
                </div>
                <div
                  className="timeline-segment safe"
                  style={{
                    width: `${Math.max((timelineCounts.safe / timelineCounts.total) * 100, 3)}%`,
                  }}
                  onClick={() => setFilter("SAFE")}
                >
                  SAFE {timelineCounts.safe}
                </div>
              </div>
            </div>

            <div className="table-controls-row">
              <div className="filter-pills-row">
                {[
                  "ALL",
                  "EXPIRED",
                  "< 7 DAYS",
                  "7-30 DAYS",
                  "30-90 DAYS",
                  "SAFE",
                ].map((p) => (
                  <button
                    key={p}
                    className={`filter-pill ${filter === p ? "active" : ""}`}
                    onClick={() => setFilter(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="table-search-wrapper">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search medicine or batch..."
                  className="table-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="purchase-table-card">
              <table className="purchase-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Batch #</th>
                    <th>Supplier</th>
                    <th>MFG Date</th>
                    <th>Expiry Date</th>
                    <th>Days Left</th>
                    <th>Qty</th>
                    <th>Value ₹</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        style={{
                          textAlign: "center",
                          padding: "30px",
                          color: "var(--text-muted)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            marginBottom: "4px",
                          }}
                        >
                          No batches found
                        </div>
                        <div style={{ fontSize: "12px" }}>
                          Try adjusting your search or filter criteria
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((b) => (
                      <tr key={b.id} className={`expiry-row-${b.status}`}>
                        <td>
                          <div style={{ fontWeight: 700 }}>
                            {b.med}
                            {b.discountApplied && (
                              <span
                                className="discount-badge"
                                style={{ marginLeft: "8px" }}
                              >
                                DISCOUNTED
                              </span>
                            )}
                          </div>
                          <div className="result-meta">{b.brand}</div>
                        </td>
                        <td className="result-meta">{b.id}</td>
                        <td
                          className="result-meta"
                          style={{ fontWeight: 600, color: "var(--text-main)" }}
                        >
                          {b.brand}
                        </td>
                        <td className="result-meta">{b.mfg}</td>
                        <td>{b.exp}</td>
                        <td>
                          <b
                            style={{
                              color:
                                b.days < 0
                                  ? "var(--danger)"
                                  : b.days < 7
                                    ? "var(--warning)"
                                    : b.days < 30
                                      ? "var(--warning)"
                                      : b.days < 90
                                        ? "var(--info)"
                                        : "var(--success)",
                              fontFamily: "Outfit",
                            }}
                          >
                            {b.days < 0
                              ? "EXPIRED"
                              : b.days > 120
                                ? "120+ Days"
                                : `${b.days} Days`}
                          </b>
                        </td>
                        <td>{b.qty}</td>
                        <td style={{ fontWeight: 700 }}>₹{b.val}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="micro-btn action-btn"
                              style={{ color: "var(--warning)" }}
                              title="Return"
                              onClick={() => handleAction("RETURN", b)}
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              className="micro-btn action-btn"
                              style={{ color: "var(--info)" }}
                              title="Discount"
                              onClick={() => handleAction("DISCOUNT", b)}
                            >
                              <TrendingUp size={14} />
                            </button>
                            <button
                              className="micro-btn action-btn"
                              style={{ color: "var(--danger)" }}
                              title="Dispose"
                              onClick={() => handleAction("DISPOSE", b)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )
      )}

      {/* ───────────────────── INVENTORY TAB ───────────────────── */}
      {activeTab === "inventory" && (
        <>
          <div className="table-controls-row">
            <div className="table-search-wrapper" style={{ maxWidth: "340px" }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search batch # or medicine..."
                className="table-search-input"
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <button
                  className="pos-btn outline"
                  onClick={() => setShowInvFilterDropdown((prev) => !prev)}
                >
                  <Filter size={14} />{" "}
                  {INV_FILTER_OPTIONS.find((o) => o.value === invFilter)
                    ?.label || "Filter"}
                </button>
                {showInvFilterDropdown && (
                  <>
                    <div
                      style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 99,
                      }}
                      onClick={() => setShowInvFilterDropdown(false)}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        right: 0,
                        background: "var(--surface)",
                        border: "1px solid var(--outline-variant)",
                        borderRadius: "12px",
                        padding: "6px",
                        minWidth: "200px",
                        zIndex: 100,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                      }}
                    >
                      {INV_FILTER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setInvFilter(opt.value);
                            setShowInvFilterDropdown(false);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 14px",
                            fontSize: "13px",
                            fontWeight: invFilter === opt.value ? 700 : 500,
                            background:
                              invFilter === opt.value
                                ? "var(--primary-glow)"
                                : "transparent",
                            color:
                              invFilter === opt.value
                                ? "var(--primary)"
                                : "var(--text-main)",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "0.15s",
                          }}
                        >
                          {opt.label}
                          {invFilter === opt.value && (
                            <span style={{ float: "right", fontSize: "11px" }}>
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                className="pos-btn teal"
                onClick={() => setShowAddBatchModal(true)}
              >
                <Plus size={14} /> Add Batch
              </button>
            </div>
          </div>
          <div className="purchase-table-card">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>Medicine / Molecule</th>
                  <th>Batch #</th>
                  <th>Expiry</th>
                  <th>Received</th>
                  <th>Qty Remaining</th>
                  <th>Supplier</th>
                  <th>FIFO Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invFilteredBatches.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      style={{
                        textAlign: "center",
                        padding: "30px",
                        color: "var(--text-muted)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        No inventory items found
                      </div>
                      <div style={{ fontSize: "12px" }}>
                        Click "Add Batch" to create a new entry
                      </div>
                    </td>
                  </tr>
                ) : (
                  invFilteredBatches.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700 }}>{b.id}</td>
                      <td>
                        {b.med}
                        {b.discountApplied && (
                          <span
                            className="discount-badge"
                            style={{ marginLeft: "8px" }}
                          >
                            DISCOUNTED
                          </span>
                        )}
                      </td>
                      <td>{b.exp}</td>
                      <td className="result-meta">{b.received}</td>
                      <td>{b.qty} units</td>
                      <td className="result-meta">{b.brand}</td>
                      <td>
                        <span
                          className={`fifo-badge ${b.rank === 1 ? "active" : b.rank === 2 ? "next" : "queued"}`}
                        >
                          {b.rank === 1 ? "1st" : b.rank === 2 ? "2nd" : "3rd"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`p-status ${b.status === "expired" ? "danger" : "success"}`}
                        >
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="micro-btn action-btn"
                            style={{ color: "var(--info)" }}
                            title="View Details"
                            onClick={() => handleViewBatch(b)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="micro-btn action-btn"
                            style={{ color: "var(--primary)" }}
                            title="Edit"
                            onClick={() => handleEditBatch(b)}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="micro-btn action-btn"
                            style={{ color: "var(--danger)" }}
                            title="Delete"
                            onClick={() => handleDeleteClick(b)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ───────────────────── FIFO TAB ───────────────────── */}
      {activeTab === "fifo" && (
        <>
          <div
            className="pos-card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                FIFO Enforcement
              </div>
              <p className="result-meta">
                Oldest batch is always sold first at billing
              </p>
            </div>
            <div
              className={`toggle-switch ${fifoEnabled ? "on" : ""}`}
              onClick={() => {
                if (fifoEnabled) {
                  setShowFifoConfirm(true);
                } else {
                  setFifoEnabled(true);
                }
              }}
              style={{
                background: fifoEnabled
                  ? "var(--primary)"
                  : "var(--overlay-10)",
                width: "50px",
                height: "24px",
                borderRadius: "12px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  background: "white",
                  borderRadius: "50%",
                  position: "absolute",
                  top: "3px",
                  left: fifoEnabled ? "29px" : "3px",
                  transition: "0.2s",
                }}
              />
            </div>
          </div>

          <div className="fifo-medicine-list" style={{ marginTop: "24px" }}>
            {Object.keys(fifoMedicines).length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: "var(--text-muted)",
                }}
              >
                No batches available for FIFO tracking
              </div>
            ) : (
              Object.entries(fifoMedicines).map(([med, medBatches]) => {
                const totalQty = medBatches.reduce(
                  (sum, b) => sum + (b.qty || 0),
                  0,
                );
                return (
                  <div key={med} className="fifo-medicine-card">
                    <div
                      className="fifo-card-header"
                      onClick={() =>
                        setExpandedMed(expandedMed === med ? null : med)
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{
                            width: "4px",
                            height: "20px",
                            background: "var(--primary)",
                            borderRadius: "2px",
                          }}
                        />
                        <span style={{ fontFamily: "Outfit", fontWeight: 600 }}>
                          {med}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "24px",
                        }}
                      >
                        <div className="result-meta">
                          Total: <b>{totalQty} units</b>
                        </div>
                        <div className="result-meta">
                          Batches: <b>{medBatches.length}</b>
                        </div>
                        {expandedMed === med ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedMed === med && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="fifo-card-body"
                        >
                          <table
                            className="purchase-table"
                            style={{ background: "none" }}
                          >
                            <thead>
                              <tr>
                                <th>FIFO RANK</th>
                                <th>BATCH #</th>
                                <th>EXPIRY</th>
                                <th>QTY</th>
                                <th>DAYS LEFT</th>
                                <th>AVAILABILITY</th>
                              </tr>
                            </thead>
                            <tbody>
                              {medBatches.map((b) => {
                                const pct = Math.min(
                                  ((b.qty || 0) / (totalQty || 1)) * 100,
                                  100,
                                );
                                return (
                                  <tr key={b.id}>
                                    <td>
                                      <span
                                        className={`fifo-badge ${b.rank === 1 ? "active" : "next"}`}
                                      >
                                        Rank {b.rank}
                                      </span>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{b.id}</td>
                                    <td
                                      style={{
                                        color:
                                          b.days < 7
                                            ? "var(--danger)"
                                            : b.days < 30
                                              ? "var(--warning)"
                                              : "inherit",
                                      }}
                                    >
                                      {b.exp}
                                    </td>
                                    <td>{b.qty} units</td>
                                    <td>
                                      <b
                                        style={{
                                          color:
                                            b.days < 0
                                              ? "var(--danger)"
                                              : b.days < 7
                                                ? "var(--warning)"
                                                : "var(--success)",
                                          fontFamily: "Outfit",
                                        }}
                                      >
                                        {b.days < 0 ? "EXPIRED" : `${b.days}d`}
                                      </b>
                                    </td>
                                    <td style={{ width: "200px" }}>
                                      <div
                                        style={{
                                          height: "6px",
                                          background: "var(--overlay-05)",
                                          borderRadius: "3px",
                                          overflow: "hidden",
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: `${pct}%`,
                                            height: "100%",
                                            background:
                                              b.days < 0
                                                ? "var(--danger)"
                                                : b.days < 7
                                                  ? "var(--warning)"
                                                  : "var(--primary)",
                                          }}
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ───────────────────── SUGGESTIONS TAB ───────────────────── */}
      {activeTab === "suggestions" && (
        <div className="suggestion-grid">
          {suggestions.length === 0 ? (
            <div className="empty-state">No recommendations available</div>
          ) : (
            suggestions.map((s, i) => (
              <motion.div
                key={i}
                className={`suggestion-card ${s.urgency}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "Outfit",
                        fontWeight: 600,
                        fontSize: "15px",
                      }}
                    >
                      ⚠ {s.med}
                    </div>
                    <div className="result-meta">
                      Batch {s.batch} · <b>{s.days} days left</b>
                    </div>
                  </div>
                  <Info size={18} className="result-meta" />
                </div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>
                  {s.qty} units remaining · ₹{s.val}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "var(--text-muted)",
                    }}
                  >
                    SUGGESTED ACTIONS:
                  </div>
                  <div style={{ fontSize: "13px" }}>
                    ① Offer 10% discount to move stock
                  </div>
                  <div style={{ fontSize: "13px" }}>
                    ② Return {s.qty} units to {s.supplier}
                  </div>
                </div>

                <div className="sug-actions">
                  <button
                    className="pos-btn outline"
                    style={{
                      padding: "6px 12px",
                      fontSize: "11px",
                      border: "none",
                      background: "rgba(59, 130, 246, 0.1)",
                      color: "var(--info)",
                    }}
                    onClick={() => handleAction("DISCOUNT", s)}
                  >
                    Apply Discount
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{
                      padding: "6px 12px",
                      fontSize: "11px",
                      border: "none",
                      background: "rgba(245, 166, 35, 0.1)",
                      color: "var(--warning)",
                    }}
                    onClick={() => handleAction("RETURN", s)}
                  >
                    Return
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{
                      padding: "6px 12px",
                      fontSize: "11px",
                      border: "none",
                      background: reminders.includes(s.med)
                        ? "rgba(16, 185, 129, 0.1)"
                        : "var(--primary-glow)",
                      color: reminders.includes(s.med)
                        ? "var(--success)"
                        : "var(--primary)",
                    }}
                    onClick={() => handleRemindPos(s)}
                    disabled={reminders.includes(s.med)}
                  >
                    {reminders.includes(s.med)
                      ? "✓ Reminder Added"
                      : "Remind POS"}
                  </button>
                  <button
                    className="micro-btn"
                    style={{ marginLeft: "auto" }}
                    onClick={() => handleAction("DISPOSE", s)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ───────────────────── CONFIG MODAL ───────────────────── */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "480px" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Expiry Alert Settings
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowConfigModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <div className="config-section">
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      color: "var(--text-muted)",
                    }}
                  >
                    THRESHOLDS (DAYS)
                  </div>
                  <div className="threshold-input">
                    <div style={{ width: "80px", fontSize: "12px" }}>
                      Warning
                    </div>
                    <input
                      className="pos-input"
                      value={alertSettings.warning}
                      onChange={(e) =>
                        setAlertSettings({
                          ...alertSettings,
                          warning: Number(e.target.value),
                        })
                      }
                      style={{ borderColor: "var(--warning)" }}
                    />
                    <div className="result-meta">Orange Alert</div>
                  </div>
                  <div className="threshold-input">
                    <div style={{ width: "80px", fontSize: "12px" }}>
                      Critical
                    </div>
                    <input
                      className="pos-input"
                      value={alertSettings.critical}
                      onChange={(e) =>
                        setAlertSettings({
                          ...alertSettings,
                          critical: Number(e.target.value),
                        })
                      }
                      style={{ borderColor: "var(--danger)" }}
                    />
                    <div className="result-meta">Red Alert</div>
                  </div>
                </div>

                <div className="config-section">
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      color: "var(--text-muted)",
                    }}
                  >
                    NOTIFICATION CHANNELS
                  </div>
                  <div className="checkbox-row">
                    <label className="checkbox-item">
                      <input type="checkbox" checked readOnly /> In-App
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={alertSettings.email}
                        onChange={(e) =>
                          setAlertSettings({
                            ...alertSettings,
                            email: e.target.checked,
                          })
                        }
                      />{" "}
                      Email
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" checked={false} readOnly /> SMS
                    </label>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={alertSettings.whatsapp}
                        onChange={(e) =>
                          setAlertSettings({
                            ...alertSettings,
                            whatsapp: e.target.checked,
                          })
                        }
                      />{" "}
                      WhatsApp
                    </label>
                  </div>
                </div>

                <div className="config-section">
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      color: "var(--text-muted)",
                    }}
                  >
                    FREQUENCY
                  </div>
                  <div
                    className="purchases-tabs"
                    style={{ background: "none", border: "none", padding: 0 }}
                  >
                    {["Daily Digest", "Real-time", "Weekly"].map((f) => (
                      <button
                        key={f}
                        className={`p-tab ${frequency === f ? "active" : ""}`}
                        style={{ fontSize: "11px", padding: "6px 12px" }}
                        onClick={() => setFrequency(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn teal"
                  style={{ flex: 2 }}
                  onClick={() => {
                    showToast("Settings saved", "success");
                    setShowConfigModal(false);
                  }}
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ───────────────────── ACTION MODAL ───────────────────── */}
        {showActionModal && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "450px" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="stock-modal-header">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  {actionType === "RETURN" && (
                    <RotateCcw size={20} color="var(--warning)" />
                  )}
                  {actionType === "DISCOUNT" && (
                    <TrendingUp size={20} color="var(--info)" />
                  )}
                  {actionType === "DISPOSE" && (
                    <Trash2 size={20} color="var(--danger)" />
                  )}
                  <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                    {actionType === "RETURN" && "Return to Supplier"}
                    {actionType === "DISCOUNT" && "Apply Bulk Discount"}
                    {actionType === "DISPOSE" && "Stock Disposal"}
                  </h3>
                </div>
                <button
                  className="micro-btn"
                  onClick={() => setShowActionModal(false)}
                  disabled={processing}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <div
                  className="action-item-info"
                  style={{
                    marginBottom: "20px",
                    padding: "12px",
                    background: "var(--overlay-05)",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    {selectedItem?.med}
                  </div>
                  <div className="result-meta">
                    Batch: {selectedItem?.id || selectedItem?.batch} · Qty:{" "}
                    {selectedItem?.qty} units
                    {selectedItem?.supplier &&
                      ` · Supplier: ${selectedItem.supplier}`}
                  </div>
                </div>

                {actionType === "RETURN" && (
                  <div className="form-group">
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Reason for Return
                    </label>
                    <select
                      className="pos-input"
                      style={{ width: "100%", marginBottom: "16px" }}
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                    >
                      <option>Near Expiry Stock</option>
                      <option>Damaged Packaging</option>
                      <option>Quality Concern</option>
                      <option>Incorrect Supply</option>
                    </select>
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Quantity to Return
                    </label>
                    <input
                      className="pos-input"
                      type="number"
                      value={returnQty}
                      onChange={(e) =>
                        setReturnQty(Math.max(1, Number(e.target.value)))
                      }
                      style={{ width: "100%" }}
                      min={1}
                      max={selectedItem?.qty}
                    />
                  </div>
                )}

                {actionType === "DISCOUNT" && (
                  <div className="form-group">
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Discount Percentage (%)
                    </label>
                    <input
                      className="pos-input"
                      type="number"
                      value={discountPct}
                      onChange={(e) =>
                        setDiscountPct(
                          Math.max(0, Math.min(100, Number(e.target.value))),
                        )
                      }
                      style={{ width: "100%", marginBottom: "16px" }}
                    />
                    <div
                      className="result-meta"
                      style={{ marginBottom: "16px" }}
                    >
                      Current Price: ₹
                      {selectedItem?.qty > 0
                        ? (
                            (selectedItem?.val || 0) / (selectedItem?.qty || 1)
                          ).toFixed(2)
                        : "0.00"}{" "}
                      / unit
                    </div>
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Offer Duration (Days)
                    </label>
                    <input
                      className="pos-input"
                      type="number"
                      value={discountDuration}
                      onChange={(e) =>
                        setDiscountDuration(Math.max(1, Number(e.target.value)))
                      }
                      style={{ width: "100%" }}
                      min={1}
                    />
                  </div>
                )}

                {actionType === "DISPOSE" && (
                  <div className="form-group">
                    <div
                      style={{
                        color: "var(--danger)",
                        fontSize: "13px",
                        marginBottom: "16px",
                        fontWeight: 500,
                      }}
                    >
                      Warning: This action will permanently remove this batch
                      from active inventory and log it as waste.
                    </div>
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Disposal Method
                    </label>
                    <select
                      className="pos-input"
                      style={{ width: "100%", marginBottom: "16px" }}
                      value={disposalMethod}
                      onChange={(e) => setDisposalMethod(e.target.value)}
                    >
                      <option>Standard Medical Waste</option>
                      <option>Incineration</option>
                      <option>Chemical Neutralization</option>
                      <option>Return to Manufacturer for Disposal</option>
                    </select>
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Notes
                    </label>
                    <textarea
                      className="pos-input"
                      style={{ width: "100%", height: "80px", padding: "10px" }}
                      placeholder="Add disposal authorization notes..."
                      value={disposalNotes}
                      onChange={(e) => setDisposalNotes(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowActionModal(false)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  className={`pos-btn ${actionType === "DISPOSE" ? "danger" : actionType === "RETURN" ? "warning" : "teal"}`}
                  style={{ flex: 2 }}
                  onClick={confirmAction}
                  disabled={processing}
                >
                  {processing
                    ? "Processing..."
                    : `Confirm ${actionType?.charAt(0) + actionType?.slice(1).toLowerCase()}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ───────────────────── VIEW BATCH MODAL ───────────────────── */}
        {showViewBatchModal && viewBatch && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "500px" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Batch Details — {viewBatch.id}
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowViewBatchModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <div className="detail-grid">
                  {[
                    ["Medicine", viewBatch.med],
                    ["Batch ID", viewBatch.id],
                    ["Supplier", viewBatch.supplier || viewBatch.brand],
                    ["MFG Date", viewBatch.mfg],
                    ["Expiry Date", viewBatch.exp],
                    [
                      "Days Left",
                      viewBatch.days < 0 ? "EXPIRED" : `${viewBatch.days} Days`,
                    ],
                    ["Quantity", `${viewBatch.qty} units`],
                    ["Value", `₹${viewBatch.val}`],
                    ["Received", viewBatch.received],
                    ["Status", viewBatch.status.toUpperCase()],
                    [
                      "FIFO Rank",
                      viewBatch.rank === 1
                        ? "1st (oldest)"
                        : viewBatch.rank === 2
                          ? "2nd"
                          : "3rd+",
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="detail-row">
                      <span className="detail-label">{label}</span>
                      <span className="detail-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn teal"
                  style={{ flex: 1 }}
                  onClick={() => setShowViewBatchModal(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ───────────────────── EDIT BATCH MODAL ───────────────────── */}
        {showEditBatchModal && editBatch && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "500px" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Edit Batch — {editBatch.id}
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowEditBatchModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <div
                  className="p-form-grid"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <div className="pos-input-group">
                    <label className="p-label">Medicine</label>
                    <input
                      className="pos-input"
                      value={editBatch.med}
                      onChange={(e) =>
                        setEditBatch({ ...editBatch, med: e.target.value })
                      }
                    />
                  </div>
                  <div className="pos-input-group">
                    <label className="p-label">Supplier</label>
                    <input
                      className="pos-input"
                      value={editBatch.supplier || editBatch.brand}
                      onChange={(e) =>
                        setEditBatch({
                          ...editBatch,
                          supplier: e.target.value,
                          brand: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="pos-input-group">
                    <label className="p-label">MFG Date</label>
                    <input
                      className="pos-input"
                      type="date"
                      value={editBatch.mfg}
                      onChange={(e) =>
                        setEditBatch({ ...editBatch, mfg: e.target.value })
                      }
                    />
                  </div>
                  <div className="pos-input-group">
                    <label className="p-label">Expiry Date</label>
                    <input
                      className="pos-input"
                      type="date"
                      value={editBatch.exp}
                      onChange={(e) =>
                        setEditBatch({ ...editBatch, exp: e.target.value })
                      }
                    />
                  </div>
                  <div className="pos-input-group">
                    <label className="p-label">Quantity</label>
                    <input
                      className="pos-input"
                      type="number"
                      value={editBatch.qty}
                      onChange={(e) =>
                        setEditBatch({
                          ...editBatch,
                          qty: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="pos-input-group">
                    <label className="p-label">Value (₹)</label>
                    <input
                      className="pos-input"
                      type="number"
                      value={editBatch.val}
                      onChange={(e) =>
                        setEditBatch({
                          ...editBatch,
                          val: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowEditBatchModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn teal"
                  style={{ flex: 2 }}
                  onClick={saveEditBatch}
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ───────────────────── ADD BATCH MODAL ───────────────────── */}
        {showAddBatchModal && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "500px" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Add New Batch
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowAddBatchModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <div
                  className="p-form-grid"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <div className="pos-input-group">
                    <label className="p-label">MEDICINE NAME*</label>
                    <input
                      className="pos-input"
                      placeholder="e.g. Amoxicillin 500mg"
                      value={newBatch.med}
                      onChange={(e) =>
                        setNewBatch({ ...newBatch, med: e.target.value })
                      }
                    />
                  </div>
                  <div className="pos-input-group">
                    <label className="p-label">SUPPLIER</label>
                    <input
                      className="pos-input"
                      placeholder="e.g. Cipla"
                      value={newBatch.supplier}
                      onChange={(e) =>
                        setNewBatch({ ...newBatch, supplier: e.target.value })
                      }
                    />
                  </div>
                  <div className="pos-input-group">
                    <label className="p-label">MFG DATE</label>
                    <input
                      className="pos-input"
                      type="date"
                      value={newBatch.mfg}
                      onChange={(e) =>
                        setNewBatch({ ...newBatch, mfg: e.target.value })
                      }
                    />
                  </div>
                  <div className="pos-input-group">
                    <label className="p-label">EXPIRY DATE</label>
                    <input
                      className="pos-input"
                      type="date"
                      value={newBatch.exp}
                      onChange={(e) =>
                        setNewBatch({ ...newBatch, exp: e.target.value })
                      }
                    />
                  </div>
                  <div className="pos-input-group">
                    <label className="p-label">QUANTITY*</label>
                    <input
                      className="pos-input"
                      type="number"
                      placeholder="e.g. 50"
                      value={newBatch.qty}
                      onChange={(e) =>
                        setNewBatch({ ...newBatch, qty: e.target.value })
                      }
                    />
                  </div>
                  <div className="pos-input-group">
                    <label className="p-label">VALUE (₹)</label>
                    <input
                      className="pos-input"
                      type="number"
                      placeholder="e.g. 425"
                      value={newBatch.val}
                      onChange={(e) =>
                        setNewBatch({ ...newBatch, val: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddBatchModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn teal"
                  style={{ flex: 2 }}
                  onClick={addNewBatch}
                >
                  <Plus size={14} /> Add Batch
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ───────────────────── FIFO CONFIRM MODAL ───────────────────── */}
        {showFifoConfirm && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "420px" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Disable FIFO Enforcement?
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowFifoConfirm(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="stock-modal-body">
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  Disabling FIFO may cause compliance issues with regulatory
                  requirements. Oldest stock may not be dispensed first.
                </p>
              </div>

              <div className="stock-modal-footer">
                <button
                  className="pos-btn teal"
                  style={{ flex: 1 }}
                  onClick={() => setShowFifoConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn outline danger"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setFifoEnabled(false);
                    setShowFifoConfirm(false);
                    showToast(
                      "FIFO disabled. Compliance risk noted.",
                      "warning",
                    );
                  }}
                >
                  Disable Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ───────────────────── DELETE CONFIRM MODAL ───────────────────── */}
        {showDeleteModal && selectedBatchForDelete && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "420px" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="stock-modal-header">
                <h3
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 700,
                    color: "var(--danger)",
                  }}
                >
                  Delete Batch
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowDeleteModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="stock-modal-body">
                <div
                  style={{
                    padding: "14px",
                    background: "rgba(239,68,68,0.08)",
                    borderRadius: "10px",
                    marginBottom: "18px",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                    {selectedBatchForDelete.med}
                  </div>
                  <div className="result-meta">
                    Batch: {selectedBatchForDelete.id}
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  This action will permanently remove this batch from inventory.
                  This operation cannot be undone.
                </p>
              </div>

              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn danger"
                  style={{ flex: 2 }}
                  onClick={confirmDeleteBatch}
                >
                  <Trash2 size={14} /> Delete Batch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
