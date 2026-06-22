import { useState, useEffect, useCallback } from "react";
import {
  PackageX,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Building2,
  CreditCard,
} from "lucide-react";
import {
  getDashboardMetrics,
  getExpiredGroupedBySupplier,
  getExpiredInventorySummary,
  createSupplierReturn,
  getSupplierReturns,
  getSupplierReturnById,
  updateReturnStatus,
  updateDispatchStatus,
  generateCreditNote,
  generateCreditNotePdf,
  getCreditNotes,
} from "../services/supplier-returns.service.js";
import { formatDate } from "../utils/format.js";
import "../styles/Supplierreturn.css";
import { safeNumber } from "../utils/number.js";
import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";

const STATUS_BADGE = {
  DRAFT: { label: "Draft", class: "badge-neutral" },
  PENDING: { label: "Pending", class: "badge-warning" },
  APPROVED: { label: "Approved", class: "badge-info" },
  PICKED_UP: { label: "Picked Up", class: "badge-primary" },
  COMPLETED: { label: "Completed", class: "badge-success" },
  REJECTED: { label: "Rejected", class: "badge-danger" },
};

const CREDIT_NOTE_STATUS = {
  ISSUED: { label: "Issued", class: "badge-info" },
  APPLIED: { label: "Applied", class: "badge-success" },
  VOIDED: { label: "Voided", class: "badge-danger" },
  EXPIRED: { label: "Expired", class: "badge-neutral" },
};

const DISPATCH_STATUS = {
  PENDING: { label: "Pending", class: "badge-neutral" },
  READY_TO_SEND: { label: "Ready To Send", class: "badge-info" },
  SENT_TO_SUPPLIER: { label: "Sent To Supplier", class: "badge-primary" },
  RECEIVED_BY_SUPPLIER: { label: "Received By Supplier", class: "badge-warning" },
  CREDIT_NOTE_RECEIVED: { label: "Credit Note Received", class: "badge-success" },
};

const REASONS = [
  "EXPIRED",
  "DAMAGED",
  "RECALL",
  "WRONG_SUPPLY",
  "QUALITY_ISSUE",
  "OTHER",
];

function Badge({ status, map }) {
  const s = map?.[status] ||
    STATUS_BADGE[status] || { label: status, class: "badge-neutral" };
  return <span className={`status-badge ${s.class}`}>{s.label}</span>;
}

function Loading({ message = "Loading..." }) {
  return (
    <div className="loading-container">
      <Loader2 className="spin" size={32} />
      <p>{message}</p>
    </div>
  );
}

function Pagination({ page, totalPages, total, onPageChange }) {
  return (
    <div className="pagination-bar">
      <span className="pagination-info">{total} total</span>
      <div className="pagination-controls">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </button>
        <span className="pagination-current">
          {page} / {totalPages || 1}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function SupplierReturns({ showToast }) {
  const [activeTab, setActiveTab] = useState("returns");
  const [returns, setReturns] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [expiredBySupplier, setExpiredBySupplier] = useState([]);
  const [expiredSummary, setExpiredSummary] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    supplierId: "",
    reason: "",
    items: [],
    notes: "",
  });
  const [suppliers, setSuppliers] = useState([]);
  const [eligibleBatches, setEligibleBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const notify = useCallback(
    (msg, type = "success") => {
      showToast?.(msg, type);
    },
    [showToast],
  );

  const getErrorMessage = (err) => {
    return (
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      "Unexpected error"
    );
  };

  const fetchReturns = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const params = { page: p, limit: 20 };
        if (statusFilter) params.status = statusFilter;
        const { data } = await getSupplierReturns(params);
        if (data.success) {
          setReturns(data.data);
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
          setPage(data.pagination.page);
        }
      } catch (err) {
        notify(getErrorMessage(err) || "Failed to load returns", "error");
      } finally {
        setLoading(false);
      }
    },
    [notify, page, statusFilter],
  );

  const fetchCreditNotes = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const params = { page: p, limit: 20 };
        const { data } = await getCreditNotes(params);
        if (data.success) {
          setCreditNotes(data.data);
          setTotal(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
          setPage(data.pagination.page);
        }
      } catch (err) {
        notify(getErrorMessage(err) || "Failed to load credit notes", "error");
      } finally {
        setLoading(false);
      }
    },
    [notify, page],
  );

  const fetchExpiredData = useCallback(async () => {
    setLoading(true);
    try {
      const [returnsRes, creditRes, groupRes, sumRes, supRes] =
        await Promise.all([
          getSupplierReturns({ page: 1, limit: 10 }),
          getCreditNotes({ page: 1, limit: 10 }),
          getExpiredGroupedBySupplier(),
          getExpiredInventorySummary(),
          api.get(API_ROUTES.SUPPLIERS).catch(() => ({ data: { data: [] } })),
        ]);

      setReturns(returnsRes.data?.data?.returns || []);
      setCreditNotes(creditRes.data?.data?.notes || []);
      setExpiredBySupplier(groupRes.data?.data || []);
      setExpiredSummary(sumRes.data?.data);

      const supData = supRes.data?.data?.suppliers || supRes.data?.data || [];
      setSuppliers(supData);
    } catch (err) {
      notify(getErrorMessage(err) || "Failed to load expired data", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const loadEligibleBatches = async (supplierId, reason) => {
    if (!supplierId || !reason) {
      setEligibleBatches([]);
      return;
    }
    setLoadingBatches(true);
    try {
      const res = await api.get(
        `${API_ROUTES.SUPPLIER_RETURNS}/suppliers/${supplierId}/inward`,
        { params: { limit: 1000 } },
      );
      let batches = res.data?.data?.transactions || [];
      if (reason === "EXPIRED") {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        batches = batches.filter(
          (b) => new Date(b.expiryDate) < now || b.status === "EXPIRED",
        );
      }
      setEligibleBatches(batches);
    } catch (err) {
      showToast("Failed to load batches", "error", err);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (activeTab === "returns") {
        await fetchReturns();
      } else if (activeTab === "credit-notes") {
        await fetchCreditNotes();
      } else {
        await fetchExpiredData();
      }
    };

    loadData();
  }, [activeTab, fetchCreditNotes, fetchExpiredData, fetchReturns]);

  useEffect(() => {
    getDashboardMetrics()
      .then((res) => setMetrics(res.data?.data || null))
      .catch(() => {});
  }, []);

  const handleCreateReturn = async () => {
    try {
      if (
        !createData.supplierId ||
        createData.items.length === 0 ||
        !createData.reason
      ) {
        showToast(
          "Please select a supplier, reason, and at least one item",
          "error",
        );
        return;
      }
      const payload = {
        supplierId: createData.supplierId,
        notes: createData.notes,
        reason: createData.reason,
        items: createData.items.map((i) => ({
          medicineId: i.medicineId,
          batchId: i.id,
          quantity: i.returnQty,
          reason: createData.reason,
        })),
      };
      await createSupplierReturn(payload);
      showToast("Return created successfully", "success");
      setShowCreateModal(false);
      setCreateData({ supplierId: "", reason: "", items: [], notes: "" });
      fetchReturns();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to create return",
        "error",
      );
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const { data } = await updateReturnStatus(id, status);
      if (data.success) {
        notify(`Return status updated to ${status}`);
        fetchReturns();
        if (selectedReturn?.id === id) setSelectedReturn(data.data);
      }
    } catch (err) {
      notify(getErrorMessage(err) || "Failed to update status", "error");
    }
  };

  const handleGenerateCreditNote = async (returnId) => {
    try {
      const res = await generateCreditNote(returnId, {
        notes: "Auto-generated credit note",
      });
      showToast("Credit note generated successfully", "success", res);
      fetchReturns();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to generate credit note",
        "error",
      );
    }
  };

  const tabs = [
    { id: "returns", label: "Returns", icon: PackageX },
    { id: "credit-notes", label: "Credit Notes", icon: CreditCard },
    { id: "expired", label: "Expired Stock", icon: AlertTriangle },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <PackageX size={28} />
          <div>
            <h1>Supplier Returns</h1>
            <p>Manage returns, credit notes & expired inventory</p>
          </div>
        </div>
        <div className="page-header-actions">
          {activeTab === "returns" && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} /> New Return
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => {
              if (activeTab === "returns") fetchReturns();
              else if (activeTab === "credit-notes") fetchCreditNotes();
              else fetchExpiredData();
            }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="tabs-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {metrics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {[
            { label: "Pending", value: metrics.pending, color: "var(--warning)" },
            { label: "Ready to Send", value: metrics.readyToSend, color: "var(--info)" },
            { label: "Sent", value: metrics.sent, color: "var(--primary)" },
            { label: "Received", value: metrics.received, color: "var(--success)" },
            { label: "Credit Received", value: metrics.creditReceived, color: "var(--success)" },
            { label: "Total Returns", value: metrics.totalReturns, color: "var(--text-main)" },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                padding: "14px 16px",
                borderRadius: "10px",
                background: "var(--card-bg, white)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                {card.label}
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: card.color }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="tab-content">
        {loading && <Loading message={`Loading ${activeTab}...`} />}
        {!loading && activeTab === "returns" && (
          <>
            <div className="filters-row">
              <div className="search-box">
                <Search size={16} />
                <input
                  placeholder="Search returns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Status</option>
                {Object.entries(STATUS_BADGE).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {returns.length === 0 ? (
              <div className="empty-state">
                <PackageX size={48} />
                <h3>No Returns Found</h3>
                <p>Create a return from expired or damaged stock</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Return #</th>
                      <th>Supplier</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Dispatch</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="return-number">
                            {r.returnNumber}
                          </span>
                        </td>
                        <td>{r.supplier?.name || "—"}</td>
                        <td>
                          {r._count?.items ||
                            r.items?.length ||
                            r.quantity ||
                            0}
                        </td>
                        <td>
                          {r.returnAmount
                            ? `$${safeNumber(r.returnAmount).toFixed(2)}`
                            : "—"}
                        </td>
                        <td>
                          <Badge status={r.status} />
                        </td>
                        <td>
                          <select
                            className="filter-select"
                            value={r.dispatchStatus || "PENDING"}
                            onChange={async (e) => {
                              try {
                                await updateDispatchStatus(r.id, e.target.value);
                                notify("Dispatch status updated", "success");
                                fetchReturns();
                              } catch (err) {
                                notify(
                                  getErrorMessage(err) || "Failed to update dispatch status",
                                  "error",
                                );
                              }
                            }}
                          >
                            {Object.entries(DISPATCH_STATUS).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{formatDate(r.createdAt)}</td>
                        <td>
                          <div className="action-btns">
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={async () => {
                                try {
                                  const { data } = await getSupplierReturnById(
                                    r.id,
                                  );
                                  setSelectedReturn(data.data);
                                } catch (err) {
                                  console.log(err);

                                  notify(
                                    getErrorMessage(err) ||
                                      "Failed to load return detail",
                                    "error",
                                  );
                                }
                              }}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}

        {!loading && activeTab === "credit-notes" && (
          <>
            {creditNotes.length === 0 ? (
              <div className="empty-state">
                <CreditCard size={48} />
                <h3>No Credit Notes</h3>
                <p>Credit notes are generated when returns are completed</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>CN #</th>
                      <th>Supplier</th>
                      <th>Return</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Issued</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditNotes.map((cn) => (
                      <tr key={cn.id}>
                        <td>
                          <span className="return-number">
                            {cn.creditNoteNumber}
                          </span>
                        </td>
                        <td>{cn.supplier?.name || "—"}</td>
                        <td>{cn.return?.returnNumber || "—"}</td>
                        <td>${safeNumber(cn.amount).toFixed(2)}</td>
                        <td>
                          <Badge status={cn.status} map={CREDIT_NOTE_STATUS} />
                        </td>
                        <td>{formatDate(cn.issuedAt)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={async () => {
                              try {
                                const res = await generateCreditNotePdf(cn.id);
                                if (res.data?.data?.pdfUrl) {
                                  window.open(res.data.data.pdfUrl, "_blank");
                                }
                                notify("PDF generated", "success");
                              } catch (err) {
                                notify(
                                  getErrorMessage(err) || "Failed to generate PDF",
                                  "error",
                                );
                              }
                            }}
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}

        {!loading && activeTab === "expired" && (
          <>
            {expiredSummary && (
              <div className="stats-grid">
                <div className="stat-card">
                  <AlertTriangle size={24} />
                  <div className="stat-value">
                    {expiredSummary.totalExpiredProducts}
                  </div>
                  <div className="stat-label">Expired Products</div>
                </div>
                <div className="stat-card">
                  <PackageX size={24} />
                  <div className="stat-value">{expiredSummary.totalUnits}</div>
                  <div className="stat-label">Total Units</div>
                </div>
                <div className="stat-card">
                  <Building2 size={24} />
                  <div className="stat-value">
                    {expiredSummary.suppliersInvolved}
                  </div>
                  <div className="stat-label">Suppliers</div>
                </div>
                <div className="stat-card">
                  <CreditCard size={24} />
                  <div className="stat-value">
                    ${safeNumber(expiredSummary.inventoryValue).toFixed(2)}
                  </div>
                  <div className="stat-label">Inventory Value</div>
                </div>
              </div>
            )}

            {expiredBySupplier.length === 0 ? (
              <div className="empty-state">
                <PackageX size={48} />
                <h3>No Expired Stock</h3>
                <p>All inventory is within expiry date</p>
              </div>
            ) : (
              <div className="supplier-groups">
                {expiredBySupplier.map((group, idx) => (
                  <div key={idx} className="supplier-group-card">
                    <div
                      className="supplier-group-header"
                      onClick={() =>
                        setExpandedGroup(expandedGroup === idx ? null : idx)
                      }
                    >
                      <div className="supplier-group-info">
                        <Building2 size={20} />
                        <div>
                          <strong>{group.supplier.name}</strong>
                          <span className="supplier-code">
                            {group.supplier.supplierCode}
                          </span>
                        </div>
                      </div>
                      <div className="supplier-group-meta">
                        <span>{group.itemCount} items</span>
                        <span>{group.totalQty} units</span>
                        <span>${safeNumber(group.totalLoss).toFixed(2)}</span>
                        {expandedGroup === idx ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </div>
                    </div>
                    {expandedGroup === idx && (
                      <div className="supplier-group-items">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Medicine</th>
                              <th>Batch</th>
                              <th>Expiry</th>
                              <th>Qty</th>
                              <th>Price</th>
                              <th>Loss</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map((item) => (
                              <tr key={item.id}>
                                <td>{item.medicine?.name || "—"}</td>
                                <td>{item.batchNumber || "—"}</td>
                                <td>{formatDate(item.expiryDate)}</td>
                                <td>{item.quantity}</td>
                                <td>
                                  $
                                  {safeNumber(item.purchasePrice || 0).toFixed(
                                    2,
                                  )}
                                </td>
                                <td>
                                  $
                                  {(
                                    safeNumber(item.purchasePrice || 0) *
                                    item.quantity
                                  ).toFixed(2)}
                                </td>
                                <td>
                                  <Badge status={item.status} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setCreateData({
                              supplierId: group.supplier.id,
                              reason: "EXPIRED",
                              notes: "",
                              items: group.items.map((i) => ({
                                ...i,
                                returnQty: i.availableQuantity || i.quantity,
                                reason: "EXPIRED",
                              })),
                            });
                            setEligibleBatches(group.items);
                            setShowCreateModal(true);
                          }}
                        >
                          <Plus size={14} /> Return All to Supplier
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedReturn && (
        <div className="modal-overlay" onClick={() => setSelectedReturn(null)}>
          <div
            className="modal-content wide-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedReturn.returnNumber}</h2>
              <Badge status={selectedReturn.status} />
              <button
                className="modal-close"
                onClick={() => setSelectedReturn(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Supplier</label>
                  <span>{selectedReturn.supplier?.name || "—"}</span>
                </div>
                <div className="detail-item">
                  <label>Created By</label>
                  <span>{selectedReturn.creator?.fullName || "—"}</span>
                </div>
                <div className="detail-item">
                  <label>Created At</label>
                  <span>
                    {new Date(selectedReturn.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Amount</label>
                  <span>
                    ${safeNumber(selectedReturn.returnAmount || 0).toFixed(2)}
                  </span>
                </div>
                {selectedReturn.approvedAt && (
                  <div className="detail-item">
                    <label>Approved At</label>
                    <span>
                      {new Date(selectedReturn.approvedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedReturn.pickedUpAt && (
                  <div className="detail-item">
                    <label>Picked Up At</label>
                    <span>
                      {new Date(selectedReturn.pickedUpAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              {selectedReturn.notes && (
                <div className="detail-item">
                  <label>Notes</label>
                  <p>{selectedReturn.notes}</p>
                </div>
              )}
              <h3>Items</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Loss</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedReturn.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.medicine?.name || "—"}</td>
                      <td>{item.quantity}</td>
                      <td>${safeNumber(item.purchasePrice || 0).toFixed(2)}</td>
                      <td>${safeNumber(item.lossAmount || 0).toFixed(2)}</td>
                      <td>{item.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <div className="status-actions">
                {selectedReturn.status === "DRAFT" && (
                  <button
                    className="btn btn-warning"
                    onClick={() =>
                      handleStatusUpdate(selectedReturn.id, "PENDING")
                    }
                  >
                    <Clock size={14} /> Submit
                  </button>
                )}
                {selectedReturn.status === "PENDING" && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() =>
                        handleStatusUpdate(selectedReturn.id, "APPROVED")
                      }
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() =>
                        handleStatusUpdate(selectedReturn.id, "REJECTED")
                      }
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </>
                )}
                {selectedReturn.status === "APPROVED" && (
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      handleStatusUpdate(selectedReturn.id, "PICKED_UP")
                    }
                  >
                    <Truck size={14} /> Mark Picked Up
                  </button>
                )}
                {selectedReturn.status === "PICKED_UP" && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() =>
                        handleStatusUpdate(selectedReturn.id, "COMPLETED")
                      }
                    >
                      <CheckCircle2 size={14} /> Complete
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() =>
                        handleStatusUpdate(selectedReturn.id, "REJECTED")
                      }
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </>
                )}
                {selectedReturn.status === "COMPLETED" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleGenerateCreditNote(selectedReturn.id)}
                  >
                    <CreditCard size={14} /> Generate Credit Note
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="modal-content wide-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create Supplier Return</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {suppliers.length === 0 ? (
                <div className="empty-state">
                  <PackageX size={36} />
                  <p>No suppliers available</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Select Supplier</label>
                    <select
                      value={createData.supplierId}
                      onChange={(e) => {
                        const sid = e.target.value;
                        setCreateData((prev) => ({
                          ...prev,
                          supplierId: sid,
                          items: [],
                        }));
                        loadEligibleBatches(sid, createData.reason);
                      }}
                    >
                      <option value="">Select...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Select Reason</label>
                    <select
                      value={createData.reason}
                      onChange={(e) => {
                        const reason = e.target.value;
                        setCreateData((prev) => ({
                          ...prev,
                          reason,
                          items: [],
                        }));
                        loadEligibleBatches(createData.supplierId, reason);
                      }}
                    >
                      <option value="">Select...</option>
                      {REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {createData.supplierId && createData.reason && (
                    <>
                      {loadingBatches ? (
                        <Loading message="Loading eligible batches..." />
                      ) : (
                        <>
                          <h3>Select Items to Return</h3>
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th></th>
                                <th>Medicine</th>
                                <th>Batch</th>
                                <th>Expiry</th>
                                <th>Available</th>
                                <th>Price</th>
                                <th>Return Qty</th>
                              </tr>
                            </thead>
                            <tbody>
                              {eligibleBatches.map((item) => {
                                const selected = createData.items.find(
                                  (i) => i.id === item.id,
                                );
                                return (
                                  <tr
                                    key={item.id}
                                    className={selected ? "row-selected" : ""}
                                  >
                                    <td>
                                      <input
                                        type="checkbox"
                                        checked={!!selected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setCreateData((prev) => ({
                                              ...prev,
                                              items: [
                                                ...prev.items,
                                                {
                                                  ...item,
                                                  returnQty:
                                                    item.availableQuantity ||
                                                    item.quantity,
                                                },
                                              ],
                                            }));
                                          } else {
                                            setCreateData((prev) => ({
                                              ...prev,
                                              items: prev.items.filter(
                                                (i) => i.id !== item.id,
                                              ),
                                            }));
                                          }
                                        }}
                                      />
                                    </td>
                                    <td>{item.medicine?.name || "—"}</td>
                                    <td>{item.batchNumber || "—"}</td>
                                    <td>{formatDate(item.expiryDate)}</td>
                                    <td>
                                      {item.availableQuantity || item.quantity}
                                    </td>
                                    <td>
                                      ₹
                                      {safeNumber(
                                        item.purchasePrice || 0,
                                      ).toFixed(2)}
                                    </td>
                                    <td>
                                      {selected && (
                                        <input
                                          type="number"
                                          className="form-control"
                                          style={{
                                            width: "80px",
                                            padding: "4px",
                                          }}
                                          value={selected.returnQty}
                                          max={
                                            item.availableQuantity ||
                                            item.quantity
                                          }
                                          min={1}
                                          onChange={(e) => {
                                            const val = Math.min(
                                              Number(e.target.value),
                                              item.availableQuantity ||
                                                item.quantity,
                                            );
                                            setCreateData((prev) => ({
                                              ...prev,
                                              items: prev.items.map((i) =>
                                                i.id === item.id
                                                  ? { ...i, returnQty: val }
                                                  : i,
                                              ),
                                            }));
                                          }}
                                        />
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                              {eligibleBatches.length === 0 && (
                                <tr>
                                  <td
                                    colSpan="7"
                                    style={{ textAlign: "center" }}
                                  >
                                    No eligible batches found for this supplier
                                    and reason.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </>
                      )}

                      <div className="form-group">
                        <label>Notes</label>
                        <textarea
                          value={createData.notes}
                          onChange={(e) =>
                            setCreateData((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateReturn}
                disabled={
                  !createData.supplierId || createData.items.length === 0
                }
              >
                <Plus size={14} /> Create Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
