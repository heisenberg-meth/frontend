import { useState, useEffect } from "react";
import {
  Loader2,
  AlertTriangle,
  Search,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  Trash2,
  X,
  Activity,
  Download,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";

export default function ExpiryReport({ showToast }) {
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [expiryStock, setExpiryStock] = useState([]);
  const [expiryFilter, setExpiryFilter] = useState("All");
  const [expirySearch, setExpirySearch] = useState("");
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDeleteBatch, setSelectedDeleteBatch] = useState(null);

  const fetchExpiry = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const res = await api.get(API_ROUTES.REPORTS_EXPIRY || "reports/expiry");
      if (res.data && res.data.success) {
        setExpiryStock(res.data.data || []);
      } else {
        setErrorState("Invalid API response format");
      }
    } catch (err) {
      console.error("Expiry fetch error:", err);
      setErrorState(
        err.response?.data?.error ||
          err.message ||
          "Failed to load expiry report",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!isMounted) return;
      await fetchExpiry();
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const now = new Date();
  const getDaysLeft = (dateStr) => {
    const diff = new Date(dateStr) - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const processStockItem = (item) => {
    const days = getDaysLeft(item.expiryDate);
    let urgency = "safe";
    if (days <= 0) urgency = "danger";
    else if (days <= 30) urgency = "warning";
    else if (days <= 90) urgency = "info";

    return {
      ...item,
      daysLeft: days,
      urgency,
      value: Math.round((item.quantity || 0) * (item.purchasePrice || 0)),
    };
  };

  const processedStock = expiryStock.map(processStockItem);
  const expiredCount = processedStock.filter((i) => i.daysLeft <= 0).length;
  const expiring30DaysCount = processedStock.filter(
    (i) => i.daysLeft > 0 && i.daysLeft <= 30,
  ).length;
  const expiring90DaysCount = processedStock.filter(
    (i) => i.daysLeft > 30 && i.daysLeft <= 90,
  ).length;
  const totalStockValue = processedStock.reduce(
    (acc, i) => acc + (i.value || 0),
    0,
  );
  const totalStockBatches = processedStock.length;
  const filteredStock = processedStock.filter((item) => {
    if (expiryFilter === "Expired" && item.daysLeft > 0) return false;
    if (
      expiryFilter === "< 7 Days" &&
      (item.daysLeft <= 0 || item.daysLeft > 7)
    )
      return false;
    if (
      expiryFilter === "7-30 Days" &&
      (item.daysLeft <= 7 || item.daysLeft > 30)
    )
      return false;
    if (
      expiryFilter === "30-90 Days" &&
      (item.daysLeft <= 30 || item.daysLeft > 90)
    )
      return false;
    if (expirySearch.trim() !== "") {
      const q = expirySearch.toLowerCase();
      const medName = (item.medicineName || item.name || "").toLowerCase();
      const batchNo = (item.batchNumber || item.batch || "").toLowerCase();
      return medName.includes(q) || batchNo.includes(q);
    }

    return true;
  });

  const exportCSV = () => {
    if (filteredStock.length === 0) return;
    const headers = [
      "Medicine",
      "Batch",
      "Expiry Date",
      "Days Left",
      "Qty",
      "Value (₹)",
      "Supplier",
    ];
    const rows = filteredStock.map((item) => [
      item.medicineName,
      item.batchNumber,
      new Date(item.expiryDate).toLocaleDateString(),
      item.daysLeft <= 0 ? "EXPIRED" : `${item.daysLeft} Days`,
      item.quantity,
      item.value,
      item.supplierName || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expiry-report-${expiryFilter.replace(/\s+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("CSV Exported", "success");
  };

  const exportPDF = () => {
    if (filteredStock.length === 0) return;
    try {
      const doc = new jsPDF();
      doc.text(`Expiry Risk Assessment Report (${expiryFilter})`, 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [
          [
            "Medicine",
            "Batch",
            "Expiry",
            "Days Left",
            "Qty",
            "Value",
            "Supplier",
          ],
        ],
        body: filteredStock.map((item) => [
          item.medicineName,
          item.batchNumber,
          new Date(item.expiryDate).toLocaleDateString(),
          item.daysLeft <= 0 ? "EXPIRED" : `${item.daysLeft} Days`,
          item.quantity,
          `₹${item.value}`,
          item.supplierName || "N/A",
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [220, 53, 69] },
      });
      doc.save(`expiry-report-${expiryFilter.replace(/\s+/g, "-")}.pdf`);
      showToast("PDF Downloaded", "success");
    } catch (err) {
      console.error("PDF export error:", err);
      showToast("PDF export failed: " + err.message, "error");
    }
  };

  const handleAction = (type, item) => {
    setActionType(type);
    setSelectedItem(item);
    setShowActionModal(true);
    setActionNotes("");
  };

  const promptDeleteBatch = (item) => {
    setSelectedDeleteBatch(item);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBatch = async () => {
    if (!selectedDeleteBatch) return;
    try {
      await api.post("stock/damage", {
        batchId: selectedDeleteBatch.batchId || selectedDeleteBatch.id,
        quantity: selectedDeleteBatch.quantity || 1,
        reason: "Disposed via manual action from Expiry dashboard",
      });
      showToast("Batch disposed successfully", "success");
      setShowDeleteConfirm(false);
      setSelectedDeleteBatch(null);
      fetchExpiry();
    } catch (err) {
      showToast(err.response?.data?.error || "Disposal failed", "error");
    }
  };

  if (loading) {
    return (
      <div
        className="reports-loading"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "300px",
          gap: "12px",
        }}
      >
        <Loader2 className="animate-spin" size={36} color="var(--primary)" />
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Analyzing expiry risks...
        </p>
      </div>
    );
  }

  if (errorState) {
    return (
      <div
        className="empty-state-card"
        style={{
          padding: "40px",
          textAlign: "center",
          border: "1px solid rgba(220,53,69,0.2)",
          background: "rgba(220,53,69,0.05)",
          borderRadius: "8px",
        }}
      >
        <AlertTriangle
          size={36}
          color="var(--danger)"
          style={{ marginBottom: "12px" }}
        />
        <h4 style={{ fontWeight: 700, color: "var(--danger)" }}>
          Expiry Report Error
        </h4>
        <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>
          {errorState}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="purchases-tabs"
        style={{ background: "none", border: "none", gap: "8px" }}
      >
        {["All", "Expired", "< 7 Days", "7-30 Days", "30-90 Days"].map((p) => (
          <button
            key={p}
            className={`p-tab ${expiryFilter === p ? "active" : ""}`}
            style={{ border: "1px solid var(--outline-variant)" }}
            onClick={() => setExpiryFilter(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="reports-kpi-grid" style={{ marginTop: "20px" }}>
        <div
          className="report-kpi-card"
          onClick={() => setExpiryFilter("Expired")}
          style={{ cursor: "pointer" }}
        >
          <div className="stat-label" style={{ color: "var(--danger)" }}>
            ALREADY EXPIRED
          </div>
          <div className="stat-value">{expiredCount} items</div>
        </div>
        <div
          className="report-kpi-card"
          onClick={() => setExpiryFilter("7-30 Days")}
          style={{ cursor: "pointer" }}
        >
          <div className="stat-label" style={{ color: "var(--warning)" }}>
            EXPIRING &lt; 30 DAYS
          </div>
          <div className="stat-value">{expiring30DaysCount}</div>
        </div>
        <div
          className="report-kpi-card"
          onClick={() => setExpiryFilter("30-90 Days")}
          style={{ cursor: "pointer" }}
        >
          <div className="stat-label" style={{ color: "var(--info)" }}>
            EXPIRING &lt; 90 DAYS
          </div>
          <div className="stat-value">{expiring90DaysCount}</div>
        </div>
      </div>

      <div
        className="expiry-urgency-banner"
        onClick={() => setExpiryFilter("Expired")}
        style={{ cursor: "pointer", marginTop: "20px" }}
      >
        <AlertTriangle size={24} style={{ color: "var(--danger)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>Critical Attention Required</div>
          <div className="result-meta">
            Total at-risk inventory: <b>₹{totalStockValue.toLocaleString()}</b>{" "}
            across {totalStockBatches} batches
          </div>
        </div>
        <ChevronRight size={20} className="result-meta" />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "20px",
          marginBottom: "16px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div
          className="table-search-wrapper"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "var(--surface-container)",
            border: "1px solid var(--outline-variant)",
            borderRadius: "12px",
            padding: "8px 16px",
            maxWidth: "400px",
            flex: 1,
          }}
        >
          <Search size={16} />
          <input
            type="text"
            placeholder="Search medicine or batch..."
            style={{
              background: "none",
              border: "none",
              color: "var(--text-main)",
              fontFamily: '"Outfit", sans-serif',
              fontSize: "14px",
              width: "100%",
              outline: "none",
            }}
            value={expirySearch}
            onChange={(e) => setExpirySearch(e.target.value)}
          />
        </div>

        {filteredStock.length > 0 && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="pos-btn outline"
              onClick={exportCSV}
              style={{ padding: "8px 12px", fontSize: "12px" }}
            >
              <Download size={14} /> CSV
            </button>
            <button
              className="pos-btn outline"
              onClick={exportPDF}
              style={{ padding: "8px 12px", fontSize: "12px" }}
            >
              <FileText size={14} /> PDF
            </button>
          </div>
        )}
      </div>

      <div className="purchase-table-card">
        <table className="purchase-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Batch</th>
              <th>Expiry Date</th>
              <th>Days Left</th>
              <th>Qty</th>
              <th>Value ₹</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "40px",
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
                    No expired or near-expiry stock found
                  </div>
                  <div style={{ fontSize: "12px" }}>
                    All batches are within safe limits for this filter.
                  </div>
                </td>
              </tr>
            ) : (
              filteredStock.map((item) => (
                <tr
                  key={`${item.batchNumber}-${item.expiryDate}`}
                  className={
                    item.urgency === "danger"
                      ? "expiry-row-danger"
                      : item.urgency === "warning"
                        ? "expiry-row-warning"
                        : item.urgency === "info"
                          ? "expiry-row-info"
                          : ""
                  }
                >
                  <td>
                    <div style={{ fontWeight: 700 }}>{item.medicineName}</div>
                  </td>
                  <td className="result-meta">{item.batchNumber}</td>
                  <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td>
                    <b
                      style={{
                        color:
                          item.daysLeft < 10
                            ? "var(--danger)"
                            : item.daysLeft < 30
                              ? "var(--warning)"
                              : "var(--text)",
                      }}
                    >
                      {item.daysLeft <= 0 ? "EXPIRED" : `${item.daysLeft} Days`}
                    </b>
                  </td>
                  <td>{item.quantity}</td>
                  <td style={{ fontWeight: 700 }}>
                    ₹{(item.value || 0).toLocaleString()}
                  </td>
                  <td>{item.supplierName || "N/A"}</td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "14px",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="micro-btn"
                        style={{ color: "var(--warning)" }}
                        title="Return"
                        onClick={() => handleAction("Return", item)}
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        className="micro-btn"
                        style={{ color: "var(--info)" }}
                        title="Discount"
                        onClick={() => handleAction("Discount", item)}
                      >
                        <TrendingUp size={12} />
                      </button>
                      <button
                        className="micro-btn"
                        style={{ color: "var(--danger)" }}
                        title="Dispose"
                        onClick={() => promptDeleteBatch(item)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Dialog Overlay */}
      <AnimatePresence>
        {showActionModal && (
          <div className="stock-modal-overlay" style={{ zIndex: 1100 }}>
            <motion.div
              className="stock-modal-content"
              style={{ width: "420px" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="stock-modal-header">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Activity size={20} color="var(--primary)" />
                  <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                    {actionType} Medicine
                  </h3>
                </div>
                <button
                  className="micro-btn"
                  onClick={() => setShowActionModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body" style={{ textAlign: "left" }}>
                <div
                  className="selected-batch-info"
                  style={{
                    background: "rgba(79, 219, 200, 0.05)",
                    padding: "12px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>
                    {selectedItem?.medicineName}
                  </div>
                  <div className="result-meta" style={{ fontSize: "12px" }}>
                    Batch: {selectedItem?.batchNumber} | Qty:{" "}
                    {selectedItem?.quantity} | Supplier:{" "}
                    {selectedItem?.supplierName || "N/A"}
                  </div>
                </div>

                {actionType === "Return" && (
                  <div className="pos-input-group">
                    <label className="p-label">RETURN REASON</label>
                    <select className="pos-input">
                      <option>Near Expiry Return</option>
                      <option>Damaged Stock</option>
                      <option>Wrong Product Received</option>
                    </select>
                  </div>
                )}

                {actionType === "Discount" && (
                  <div className="pos-input-group">
                    <label className="p-label">DISCOUNT PERCENTAGE (%)</label>
                    <input
                      className="pos-input"
                      type="number"
                      placeholder="20"
                      defaultValue={15}
                    />
                  </div>
                )}

                <div className="pos-input-group" style={{ marginTop: "16px" }}>
                  <label className="p-label">NOTES / AUTHORIZATION</label>
                  <textarea
                    className="pos-input"
                    style={{ minHeight: "80px" }}
                    placeholder={`Details for ${actionType.toLowerCase()} process...`}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowActionModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn teal"
                  style={{ flex: 2 }}
                  disabled={actionLoading}
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      if (actionType === "Return") {
                        await api.post("purchase/returns", {
                          supplierId: selectedItem.supplierId,
                          items: [
                            {
                              batchId: selectedItem.batchId || selectedItem.id,
                              quantity: selectedItem.quantity || 1,
                            },
                          ],
                          reason: "Expiry Return: " + actionNotes,
                        });
                      } else if (actionType === "Discount") {
                        showToast(
                          `Promotional discounts initialized for batch ${selectedItem?.batchNumber}`,
                          "success",
                        );
                      }
                      showToast(
                        `${actionType} Action Logged Successfully`,
                        "success",
                      );
                      setShowActionModal(false);
                      fetchExpiry();
                    } catch (err) {
                      showToast(
                        err.response?.data?.error || `${actionType} failed`,
                        "error",
                      );
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  {actionLoading ? "Processing..." : `Confirm ${actionType}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="stock-modal-overlay" style={{ zIndex: 1100 }}>
            <motion.div
              className="stock-modal-content"
              style={{ width: "380px" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="stock-modal-header">
                <h3
                  style={{
                    color: "var(--danger)",
                    fontFamily: "Outfit",
                    fontWeight: 700,
                  }}
                >
                  Dispose Batch?
                </h3>
              </div>
              <div className="stock-modal-body" style={{ textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  Are you absolutely sure you want to completely dispose and
                  delete batch <b>{selectedDeleteBatch?.batchNumber}</b>?
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--danger)",
                    marginTop: "8px",
                  }}
                >
                  This action is irreversible and writes off ₹
                  {selectedDeleteBatch?.value?.toLocaleString()} in damage loss!
                </p>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn danger"
                  style={{ flex: 1 }}
                  onClick={confirmDeleteBatch}
                >
                  Confirm Disposal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
