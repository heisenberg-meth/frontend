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
  getExpiredGroupedBySupplier,
  getExpiredInventorySummary,
  createSupplierReturn,
  getSupplierReturns,
  getSupplierReturnById,
  updateReturnStatus,
  generateCreditNote,
  getCreditNotes,
} from "../services/supplier-returns.service.js";
import { formatDate } from "../utils/format.js";
import "../styles/Supplierreturn.css";

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
    reason: "EXPIRED",
    notes: "",
    items: [],
  });
  const [expandedGroup, setExpandedGroup] = useState(null);

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
      const [groupedRes, summaryRes] = await Promise.all([
        getExpiredGroupedBySupplier(),
        getExpiredInventorySummary(),
      ]);
      if (groupedRes.data.success) setExpiredBySupplier(groupedRes.data.data);
      if (summaryRes.data.success) setExpiredSummary(summaryRes.data.data);
    } catch (err) {
      notify(getErrorMessage(err) || "Failed to load expired data", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

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

  const handleCreateReturn = async () => {
    if (!createData.supplierId || createData.items.length === 0) {
      notify("Select a supplier and at least one item", "error");
      return;
    }
    try {
      const { data } = await createSupplierReturn({
        supplierId: createData.supplierId,
        reason: createData.reason,
        notes: createData.notes,
        items: createData.items.map((i) => ({
          batchId: i.id,
          medicineId: i.medicineId,
          quantity: i.quantity,
          reason: i.reason || createData.reason,
        })),
      });
      if (data.success) {
        notify(`Return ${data.data.returnNumber} created`);
        setShowCreateModal(false);
        setCreateData({
          supplierId: "",
          reason: "EXPIRED",
          notes: "",
          items: [],
        });
        fetchReturns();
      }
    } catch (err) {
      notify(getErrorMessage(err) || "Failed to create return", "error");
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
      const { data } = await generateCreditNote(returnId, {});
      if (data.success) {
        notify(`Credit note ${data.data.creditNoteNumber} generated`);
        fetchReturns();
      }
    } catch (err) {
      notify(getErrorMessage(err) || "Failed to generate credit note", "error");
    }
  };

  const toggleItemSelection = (group, item) => {
    const exists = createData.items.find((i) => i.id === item.id);
    if (exists) {
      setCreateData((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== item.id),
      }));
    } else {
      setCreateData((prev) => ({
        ...prev,
        items: [...prev.items, { ...item, quantity: item.quantity }],
      }));
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
                            ? `$${Number(r.returnAmount).toFixed(2)}`
                            : "—"}
                        </td>
                        <td>
                          <Badge status={r.status} />
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
                        <td>${Number(cn.amount).toFixed(2)}</td>
                        <td>
                          <Badge status={cn.status} map={CREDIT_NOTE_STATUS} />
                        </td>
                        <td>{formatDate(cn.issuedAt)}</td>
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
                    ${Number(expiredSummary.inventoryValue).toFixed(2)}
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
                        <span>${Number(group.totalLoss).toFixed(2)}</span>
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
                                  ${Number(item.purchasePrice || 0).toFixed(2)}
                                </td>
                                <td>
                                  $
                                  {(
                                    Number(item.purchasePrice || 0) *
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
                                quantity: i.quantity,
                                reason: "EXPIRED",
                              })),
                            });
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
                    ${Number(selectedReturn.returnAmount || 0).toFixed(2)}
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
                      <td>${Number(item.purchasePrice || 0).toFixed(2)}</td>
                      <td>${Number(item.lossAmount || 0).toFixed(2)}</td>
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
                {selectedReturn.creditNotes?.length === 0 &&
                  selectedReturn.status === "COMPLETED" && (
                    <button
                      className="btn btn-info"
                      onClick={() =>
                        handleGenerateCreditNote(selectedReturn.id)
                      }
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
              {expiredBySupplier.length === 0 ? (
                <div className="empty-state">
                  <PackageX size={36} />
                  <p>No expired stock available for return</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Select Supplier</label>
                    <select
                      value={createData.supplierId}
                      onChange={(e) => {
                        setCreateData((prev) => ({
                          ...prev,
                          supplierId: e.target.value,
                          items: [],
                        }));
                      }}
                    >
                      <option value="">Select...</option>
                      {expiredBySupplier.map((g, i) => (
                        <option key={i} value={g.supplier.id}>
                          {g.supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {createData.supplierId && (
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
                            <th>Loss</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expiredBySupplier
                            .find(
                              (g) => g.supplier.id === createData.supplierId,
                            )
                            ?.items.map((item) => {
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
                                      onChange={() =>
                                        toggleItemSelection(
                                          expiredBySupplier.find(
                                            (g) =>
                                              g.supplier.id ===
                                              createData.supplierId,
                                          ),
                                          item,
                                        )
                                      }
                                    />
                                  </td>
                                  <td>{item.medicine?.name || "—"}</td>
                                  <td>{item.batchNumber || "—"}</td>
                                  <td>{formatDate(item.expiryDate)}</td>
                                  <td>{item.quantity}</td>
                                  <td>
                                    $
                                    {Number(item.purchasePrice || 0).toFixed(2)}
                                  </td>
                                  <td>
                                    $
                                    {(
                                      Number(item.purchasePrice || 0) *
                                      item.quantity
                                    ).toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      <div className="form-group">
                        <label>Reason</label>
                        <select
                          value={createData.reason}
                          onChange={(e) =>
                            setCreateData((prev) => ({
                              ...prev,
                              reason: e.target.value,
                            }))
                          }
                        >
                          {REASONS.map((r) => (
                            <option key={r} value={r}>
                              {r.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </div>
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
