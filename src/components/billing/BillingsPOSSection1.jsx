import api from "../../api.js";
import {
  ArrowLeft,
  RefreshCw,
  X,
  Printer,
  MessageCircle,
  Eye,
  Play,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { TableHeader } from "../common/TableHeader.jsx";
import "../../styles/BillingPOS.css";

const fieldMap = {
  patientName: [["patient", "fullName"], "patientName", "customerName"],
  patientPhone: [["patient", "phone"], "patientPhone", "customerPhone"],
  invoiceNumber: ["invoiceNumber", "billNumber", "id"],
  date: ["invoiceDate", "createdAt", "date"],
  subtotal: ["subtotal", "subTotal", "taxableAmount"],
  total: ["totalAmount", "grandTotal", "total"],
  sgst: ["sgst", "sgstAmount"],
  cgst: ["cgst", "cgstAmount"],
  discount: ["discountAmount", "discount"],
};

const ITEMS_PER_PAGE = 10;
const safeNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};
const getNested = (obj, path) => {
  const parts = path.split(".");
  let val = obj;
  for (const p of parts) {
    if (val == null) return undefined;
    val = val[p];
  }
  return val;
};
const resolveInvoiceField = (invoice, field, fallback) => {
  const keys = fieldMap[field] || [field];
  for (const key of keys) {
    if (Array.isArray(key)) {
      const val = getNested(invoice, key.join("."));
      if (val != null) return val;
    } else {
      if (invoice?.[key] != null) return invoice[key];
    }
  }
  return fallback;
};
const resolveInvoiceItems = (invoice) => {
  if (Array.isArray(invoice?.items)) return invoice.items;
  if (Array.isArray(invoice?.saleItems)) return invoice.saleItems;
  if (Array.isArray(invoice?.itemsList)) return invoice.itemsList;
  if (Array.isArray(invoice?.lineItems)) return invoice.lineItems;
  return [];
};
const normalizeInvoiceItem = (item) => ({
  ...item,
  invoiceItemId: item?.invoiceItemId || item?.id || null,
  medicineId: item?.medicineId || item?.medicine?.id || null,
  name: item?.medicine?.name || item?.medicineName || item?.name || "Unknown",
  qty: item?.quantity ?? item?.qty ?? 0,
  price: item?.unitPrice ?? item?.price ?? item?.mrp ?? 0,
  mrp: item?.unitPrice ?? item?.price ?? item?.mrp ?? 0,
  gst: item?.gst ?? item?.gstPercentage ?? 0,
  batchId: item?.batchId || item?.batch?.id || null,
  batchNumber:
    item?.batchNumber ||
    item?.batchNo ||
    item?.batch?.batchNumber ||
    item?.batch?.batchNo ||
    item?.batchCode ||
    "—",
  discPercent:
    item?.discPercent ??
    item?.discountPercentage ??
    item?.discountPercent ??
    item?.discount ??
    0,
  totalPrice: item?.totalPrice ?? item?.amount ?? 0,
});

export function BillingPOSSection2({
  setShowNewBillConfirm,
  handleSaveDraft,
  setShowPreview,
  resetBillForm,
  setActiveInvoice,
  showNewBillConfirm,
  editingDraft,
  lineItems,
}) {
  return (
    <AnimatePresence>
      {showNewBillConfirm && (
        <div
          role="presentation"
          className="stock-modal-overlay"
          onClick={() => setShowNewBillConfirm(false)}
        >
          <m.div
            role="presentation"
            className="stock-modal-content confirm-modal"
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="stock-modal-body"
              style={{
                padding: "32px",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                {editingDraft
                  ? "Exit Draft & Start New Bill?"
                  : "Start New Bill?"}
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  marginBottom: "24px",
                  color: "var(--text-secondary)",
                }}
              >
                {editingDraft
                  ? "Any unsaved changes to this draft will be lost if you start a new bill without saving."
                  : "This will clear the current items and begin a new billing session."}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="pos-btn secondary"
                  onClick={() => setShowNewBillConfirm(false)}
                >
                  Cancel
                </button>
                {lineItems.length > 0 && !editingDraft && (
                  <button
                    className="pos-btn outline"
                    onClick={async () => {
                      setShowNewBillConfirm(false);
                      await handleSaveDraft();
                      setShowPreview(false);
                      resetBillForm();
                      setActiveInvoice(null);
                    }}
                  >
                    Save Draft & New
                  </button>
                )}
                {editingDraft && lineItems.length > 0 && (
                  <button
                    className="pos-btn outline"
                    onClick={async () => {
                      setShowNewBillConfirm(false);
                      await handleSaveDraft();
                      setShowPreview(false);
                      resetBillForm();
                      setActiveInvoice(null);
                    }}
                  >
                    Update Draft & New
                  </button>
                )}
                <button
                  className="pos-btn primary"
                  onClick={() => {
                    setShowNewBillConfirm(false);
                    setShowPreview(false);
                    resetBillForm();
                    setActiveInvoice(null);
                  }}
                >
                  Start New Bill
                </button>
              </div>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export function BillingPOSSection3({
  setShowAllBillsModal,
  allBillsFilter,
  setAllBillsFilter,
  handleResumeDraftClick,
  handleDeleteDraftConfirm,
  openBillDetail,
  handleBillPrint,
  handleBillWhatsApp,
  handleBillReturn,
  showAllBillsModal,
  todayStr,
  bills,
}) {
  return (
    <AnimatePresence>
      {showAllBillsModal && (
        <div
          role="presentation"
          className="stock-modal-overlay all-bills-modal-overlay"
          onClick={() => setShowAllBillsModal(false)}
        >
          <m.div
            role="presentation"
            className="stock-modal-content all-bills-modal all-bills-modal-content"
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                }}
              >
                All Bills — {todayStr}
              </h3>
              <button
                aria-label="Close"
                className="micro-btn"
                onClick={() => setShowAllBillsModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div className="all-bills-toolbar">
                <>
                  <label htmlFor="field_zdnf26" className="sr-only">
                    Search by invoice, patient, phone...
                  </label>
                  <input
                    required
                    className="all-bills-search"
                    placeholder="Search by invoice, patient, phone..."
                    id="field_zdnf26"
                  />
                </>
                <button
                  className="pos-btn teal"
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                  }}
                >
                  Export Today's Bills
                </button>
              </div>
              <div className="filter-pills">
                {[
                  {
                    label: "All",
                    value: "All",
                  },
                  {
                    label: "Paid",
                    value: "PAID",
                  },
                  {
                    label: "Draft",
                    value: "DRAFT",
                  },
                  {
                    label: "Returned",
                    value: "RETURNED",
                  },
                ].map((f) => (
                  <button
                    key={f.value}
                    className={`filter-pill ${allBillsFilter === f.value ? "active" : ""}`}
                    onClick={() => setAllBillsFilter(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="all-bills-table-wrap">
                <table className="all-bills-table">
                  <TableHeader
                    columns={[
                      "INV#",
                      "Time",
                      "Patient",
                      "Phone",
                      "Items",
                      "Amount",
                      "Status",
                      "Actions",
                    ]}
                  />
                  <tbody>
                    {(bills || []).reduce((acc, bill) => {
                      let keep;
                      if (allBillsFilter === "All") keep = true;
                      else if (allBillsFilter === "PAID")
                        keep =
                          bill.status === "PAID" || bill.status === "FINALIZED";
                      else if (allBillsFilter === "DRAFT")
                        keep = bill.status === "DRAFT";
                      else if (allBillsFilter === "RETURNED")
                        keep =
                          bill.status === "RETURNED" ||
                          bill.status === "REFUNDED" ||
                          bill.status === "PARTIALLY_REFUNDED";
                      else keep = bill.status === allBillsFilter;
                      if (keep) {
                        acc.push(
                          <tr key={bill.id}>
                            <td
                              style={{
                                fontWeight: 600,
                              }}
                            >
                              {resolveInvoiceField(
                                bill,
                                "invoiceNumber",
                                bill.id,
                              )}
                            </td>
                            <td>{bill.time}</td>
                            <td>{bill.patient}</td>
                            <td>{bill.phone}</td>
                            <td>{bill.items.length}</td>
                            <td
                              style={{
                                fontWeight: 700,
                              }}
                            >
                              ₹
                              {safeNumber(
                                bill.paidAmount ?? bill.total,
                              ).toFixed(2)}
                            </td>
                            <td>
                              <span
                                className={`status-badge ${bill.status === "DRAFT" ? "badge-draft" : bill.status === "RETURNED" ? "badge-returned" : "badge-paid"}`}
                              >
                                {bill.status}
                              </span>
                            </td>
                            <td>
                              <div className="all-bills-actions">
                                {bill.status === "DRAFT" ? (
                                  <>
                                    <button
                                      aria-label="Resume Draft"
                                      className="all-bills-action-btn"
                                      onClick={() =>
                                        handleResumeDraftClick(bill)
                                      }
                                      title="Resume Draft"
                                      style={{
                                        color: "var(--color-primary, #14b8a6)",
                                      }}
                                    >
                                      <Play size={14} fill="currentColor" />
                                    </button>
                                    <button
                                      aria-label="Delete Draft"
                                      className="all-bills-action-btn"
                                      onClick={() =>
                                        handleDeleteDraftConfirm(bill)
                                      }
                                      title="Delete Draft"
                                      style={{
                                        color: "var(--color-error, #ef4444)",
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      aria-label="View"
                                      className="all-bills-action-btn"
                                      onClick={() => openBillDetail(bill)}
                                      title="View"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <button
                                      aria-label="Print"
                                      className="all-bills-action-btn"
                                      onClick={() => handleBillPrint(bill)}
                                      title="Print"
                                    >
                                      <Printer size={14} />
                                    </button>
                                    <button
                                      aria-label="WhatsApp"
                                      className="all-bills-action-btn"
                                      onClick={() => handleBillWhatsApp(bill)}
                                      title="WhatsApp"
                                    >
                                      <MessageCircle size={14} />
                                    </button>
                                    <button
                                      aria-label="Return"
                                      className="all-bills-action-btn"
                                      onClick={() => handleBillReturn(bill)}
                                      title="Return"
                                    >
                                      <RefreshCw size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>,
                        );
                      }
                      return acc;
                    }, [])}
                  </tbody>
                </table>
              </div>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export function BillingPOSSection4({
  setShowBillDetailDrawer,
  handleResumeDraftClick,
  selectedBill,
  handleDeleteDraftConfirm,
  handleBillPrint,
  handleBillWhatsApp,
  handleBillReturn,
  showBillDetailDrawer,
}) {
  const [medicinePage, setMedicinePage] = useState(1);

  const items = resolveInvoiceItems(selectedBill);
  const totalPages = Math.max(
    1,
    Math.ceil(items.length / ITEMS_PER_PAGE),
  );

  const paginatedItems = items.slice(
    (medicinePage - 1) * ITEMS_PER_PAGE,
    medicinePage * ITEMS_PER_PAGE,
  );

  return (
    <AnimatePresence>
      {showBillDetailDrawer && selectedBill && (
        <>
          <m.div
            role="presentation"
            className="drawer-backdrop"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() => setShowBillDetailDrawer(false)}
          />
          <m.div
            role="presentation"
            className="bill-detail-drawer"
            initial={{
              x: "100%",
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: "100%",
            }}
            transition={{
              type: "tween",
              duration: 0.3,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <h3
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 700,
                    fontSize: "16px",
                  }}
                >
                  {resolveInvoiceField(
                    selectedBill,
                    "invoiceNumber",
                    selectedBill.id,
                  )}
                </h3>
                <span className="result-meta">
                  {selectedBill.time} ·{" "}
                  {resolveInvoiceField(
                    selectedBill,
                    "patientName",
                    "Walk-in Customer",
                  )}
                </span>
              </div>
              <button
                aria-label="Close"
                className="micro-btn"
                onClick={() => setShowBillDetailDrawer(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="drawer-body">
              <div className="drawer-patient-info">
                <div>
                  <span className="stat-label">PATIENT</span>
                  <div
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    {resolveInvoiceField(
                      selectedBill,
                      "patientName",
                      "Walk-in Customer",
                    )}
                  </div>
                </div>
                <div>
                  <span className="stat-label">PHONE</span>
                  <div
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    {resolveInvoiceField(selectedBill, "patientPhone", "-")}
                  </div>
                </div>
                <div>
                  <span className="stat-label">PAYMENT</span>
                  <div>
                    <span
                      className={`payment-badge payment-${(selectedBill.paymentMethod || "CASH").toLowerCase()}`}
                    >
                      {selectedBill.paymentMethod || "CASH"}
                    </span>
                  </div>
                </div>
              </div>
              <table className="drawer-items-table">
                <TableHeader
                  columns={[
                    "Medicine",
                    "Batch No.",
                    "Qty",
                    "MRP",
                    "Disc%",
                    { label: "Amount", style: { textAlign: "right" } },
                  ]}
                />
                <tbody>
                  {paginatedItems.map((rawItem) => {
                    const item = normalizeInvoiceItem(rawItem);
                    const iPrice = safeNumber(item.price);
                    const iQty = safeNumber(item.qty);
                    const iDisc = safeNumber(item.discPercent);
                    const lineAmt = iPrice * iQty * (1 - iDisc / 100);
                    return (
                      <tr key={item.id || item.medicineId}>
                        <td>{item.name}</td>
                        <td>{item.batchNumber || "—"}</td>
                        <td>{iQty}</td>
                        <td>₹{iPrice.toFixed(2)}</td>
                        <td>{iDisc > 0 ? `${iDisc}%` : "—"}</td>
                        <td
                          style={{
                            textAlign: "right",
                          }}
                        >
                          ₹{lineAmt.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="drawer-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>
                    ₹
                    {safeNumber(
                      resolveInvoiceField(selectedBill, "subtotal", 0),
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="summary-row">
                  <span>CGST</span>
                  <span>
                    ₹
                    {safeNumber(
                      resolveInvoiceField(selectedBill, "cgst", 0),
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="summary-row">
                  <span>SGST</span>
                  <span>
                    ₹
                    {safeNumber(
                      resolveInvoiceField(selectedBill, "sgst", 0),
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="summary-row grand">
                  <span>TOTAL</span>
                  <span>₹{safeNumber(selectedBill.total).toFixed(2)}</span>
                </div>
              </div>
              <div className="medicine-pagination">
                {items.length > ITEMS_PER_PAGE ? (
                  <>
                    <button
                      className="pagination-btn"
                      onClick={() => setMedicinePage(medicinePage - 1)}
                      disabled={medicinePage <= 1}
                    >
                      ← Previous
                    </button>
                    <span>
                      Showing {(medicinePage - 1) * ITEMS_PER_PAGE + 1}–{" "}
                      {medicinePage * ITEMS_PER_PAGE > items.length
                        ? items.length
                        : medicinePage * ITEMS_PER_PAGE}{" "}
                      of {items.length} medicines
                    </span>
                    <button
                      className="pagination-btn"
                      onClick={() => setMedicinePage(medicinePage + 1)}
                      disabled={medicinePage >= totalPages}
                    >
                      Next →
                    </button>
                  </>
                ) : null}
              </div>
              <div className="drawer-timeline">
                <div
                  className="stat-label"
                  style={{
                    marginBottom: "8px",
                  }}
                >
                  TIMELINE
                </div>
                {(selectedBill.timeline || []).map((t, tIdx) => (
                  <div
                    key={
                      typeof t === "string"
                        ? `timeline-${t}-${tIdx}`
                        : t?.id || `timeline-${tIdx}`
                    }
                    className="timeline-item"
                  >
                    <div className="timeline-dot" />
                    <span>
                      {typeof t === "string"
                        ? t
                        : t?.message || t?.title || JSON.stringify(t)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-footer">
              {selectedBill.status === "DRAFT" ? (
                <>
                  <button
                    className="pos-btn primary"
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                    onClick={() => {
                      setShowBillDetailDrawer(false);
                      handleResumeDraftClick(selectedBill);
                    }}
                  >
                    <Play size={14} fill="currentColor" /> Resume Draft
                  </button>
                  <button
                    className="pos-btn outline btn-error"
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                    onClick={() => handleDeleteDraftConfirm(selectedBill)}
                  >
                    <Trash2 size={14} /> Delete Draft
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="pos-btn outline"
                    style={{
                      flex: 1,
                    }}
                    onClick={() => handleBillPrint(selectedBill)}
                  >
                    <Printer size={14} /> Print
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{
                      flex: 1,
                    }}
                    onClick={() => handleBillWhatsApp(selectedBill)}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{
                      flex: 1,
                      borderColor: "var(--danger)",
                      color: "var(--danger)",
                    }}
                    onClick={() => {
                      setShowBillDetailDrawer(false);
                      handleBillReturn(selectedBill);
                    }}
                  >
                    <RefreshCw size={14} /> Return
                  </button>
                </>
              )}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
export function BillingPOSSection5({
  setShowReturnBillModal,
  returnItems,
  setReturnItems,
  setReturnReason,
  setReturnNotes,
  confirmReturn,
  selectedBill,
  showReturnBillModal,
  processingReturn,
  returnReason,
  returnNotes,
}) {
  return (
    <AnimatePresence>
      {showReturnBillModal && selectedBill && (
        <div
          role="presentation"
          className="stock-modal-overlay"
          onClick={() => setShowReturnBillModal(false)}
        >
          <m.div
            role="presentation"
            className="stock-modal-content return-modal"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                }}
              >
                Process Return —{" "}
                {resolveInvoiceField(
                  selectedBill,
                  "invoiceNumber",
                  selectedBill.id,
                )}
              </h3>
              <button
                aria-label="Close"
                className="micro-btn"
                onClick={() => setShowReturnBillModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <table className="return-items-table">
                <TableHeader
                  columns={["Item", "Qty", "Return Qty", "Amount"]}
                />
                <tbody>
                  {resolveInvoiceItems(selectedBill).map((rawItem, idx) => {
                    const item = normalizeInvoiceItem(rawItem);
                    return (
                      <tr key={item.id || item.medicineId}>
                        <td>{item.name}</td>
                        <td>{item.qty}</td>
                        <td>
                          <input
                            aria-label="input field"
                            required
                            className="pos-input return-qty-input"
                            type="number"
                            min="0"
                            max={item.qty}
                            value={returnItems[idx] || 0}
                            onChange={(e) =>
                              setReturnItems((prev) => {
                                const arr = Array.isArray(prev) ? prev : [];
                                const next = [...arr];
                                next[idx] = Math.min(
                                  item.qty,
                                  Math.max(0, safeNumber(e.target.value)),
                                );
                                return next;
                              })
                            }
                          />
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            color: "var(--danger)",
                          }}
                        >
                          ₹
                          {(
                            safeNumber(returnItems[idx]) *
                            safeNumber(item.price)
                          ).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div
                className="pos-input-group"
                style={{
                  marginTop: "16px",
                }}
              >
                <label htmlFor="field_022a5f">Return Reason</label>
                <select
                  id="field_022a5f"
                  className="pos-input"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                >
                  <option>Customer Request</option>
                  <option>Damaged</option>
                  <option>Wrong Medicine</option>
                  <option>Expiry</option>
                </select>
              </div>
              <div
                className="pos-input-group"
                style={{
                  marginTop: "12px",
                }}
              >
                <label htmlFor="field_ix7uzk">Notes</label>
                <textarea
                  id="field_ix7uzk"
                  className="pos-input return-notes"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                disabled={processingReturn}
                onClick={() => setShowReturnBillModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn outline"
                disabled={processingReturn}
                style={{
                  background: "var(--danger)",
                  color: "white",
                  border: "none",
                  opacity: processingReturn ? 0.6 : 1,
                }}
                onClick={confirmReturn}
              >
                {processingReturn ? "Processing..." : "Process Return"}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export function BillingPOSSection6({
  setShowReturnModal,
  setReturnSearchQuery,
  returnSearchQuery,
  setReturnModalSelectedBill,
  setReturnModalItems,
  setReturnModalReason,
  returnModalItems,
  returnModalSelectedBill,
  returnModalReason,
  showToast,
  processingReturn,
  setProcessingReturn,
  showReturnModal,
  bills,
}) {
  return (
    <AnimatePresence>
      {showReturnModal && (
        <div
          role="presentation"
          className="stock-modal-overlay"
          onClick={() => setShowReturnModal(false)}
        >
          <m.div
            role="presentation"
            className="stock-modal-content"
            style={{
              width: "580px",
            }}
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                }}
              >
                Process Sales Return
              </h3>
              <button
                aria-label="Close"
                className="micro-btn"
                onClick={() => setShowReturnModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div
                className="pos-input-group"
                style={{
                  marginBottom: "24px",
                }}
              >
                <label htmlFor="field_i9e1os">Find Bill</label>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <input
                    id="field_i9e1os"
                    required
                    className="pos-input"
                    style={{
                      flex: 1,
                    }}
                    placeholder="Invoice number or patient name..."
                    value={returnSearchQuery}
                    onChange={(e) => setReturnSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              {!returnModalSelectedBill ? (
                <div>
                  {(bills || []).reduce((acc, bill) => {
                    if (acc.length >= 5) return acc;
                    if (
                      !["FINALIZED", "PAID", "RETURNED"].includes(bill.status)
                    )
                      return acc;
                    const q = returnSearchQuery.toLowerCase();
                    if (!q) return acc;
                    const inv = resolveInvoiceField(
                      bill,
                      "invoiceNumber",
                      bill.id,
                    ).toLowerCase();
                    const name = resolveInvoiceField(
                      bill,
                      "patientName",
                      "",
                    ).toLowerCase();
                    if (inv.includes(q) || name.includes(q)) {
                      acc.push(
                        <button
                          type="button"
                          key={bill.id}
                          className="patient-result-row"
                          style={{
                            cursor: "pointer",
                            padding: "10px",
                            borderRadius: "8px",
                            marginBottom: "4px",
                          }}
                          onClick={() => {
                            setReturnModalSelectedBill(bill);
                            setReturnModalItems({});
                            setReturnModalReason("Patient Request");
                          }}
                        >
                          <span className="patient-result-name">
                            {resolveInvoiceField(
                              bill,
                              "invoiceNumber",
                              bill.id,
                            )}
                          </span>
                          <span className="patient-result-phone">
                            {resolveInvoiceField(
                              bill,
                              "patientName",
                              "Walk-in Customer",
                            )}
                          </span>
                          <span className="result-meta">
                            ₹
                            {safeNumber(
                              resolveInvoiceField(bill, "total", 0),
                            ).toFixed(2)}
                          </span>
                        </button>,
                      );
                    }
                    return acc;
                  }, [])}
                  {returnSearchQuery &&
                    bills.filter((b) => {
                      const q = returnSearchQuery.toLowerCase();
                      const inv = resolveInvoiceField(
                        b,
                        "invoiceNumber",
                        b.id,
                      ).toLowerCase();
                      const name = resolveInvoiceField(
                        b,
                        "patientName",
                        "",
                      ).toLowerCase();
                      return inv.includes(q) || name.includes(q);
                    }).length === 0 && (
                      <div
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          color: "var(--text-muted)",
                        }}
                      >
                        No matching bills found
                      </div>
                    )}
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        {resolveInvoiceField(
                          returnModalSelectedBill,
                          "invoiceNumber",
                          returnModalSelectedBill.id,
                        )}
                      </span>
                      <span
                        className="result-meta"
                        style={{
                          marginLeft: "12px",
                        }}
                      >
                        {resolveInvoiceField(
                          returnModalSelectedBill,
                          "patientName",
                          "Walk-in Customer",
                        )}
                      </span>
                    </div>
                    <button
                      aria-label="Action"
                      className="micro-btn"
                      onClick={() => setReturnModalSelectedBill(null)}
                    >
                      <ArrowLeft size={16} />
                    </button>
                  </div>
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.05)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    {resolveInvoiceItems(returnModalSelectedBill).map(
                      (rawItem, idx) => {
                        const item = normalizeInvoiceItem(rawItem);
                        return (
                          <div
                            key={item.id || item.medicineId}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "12px",
                            }}
                          >
                            <input
                              aria-label="input field"
                              required
                              type="checkbox"
                              checked={returnModalItems[idx]?.checked ?? true}
                              onChange={(e) =>
                                setReturnModalItems((prev) => ({
                                  ...prev,
                                  [idx]: {
                                    ...prev[idx],
                                    checked: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <div
                              style={{
                                flex: 1,
                              }}
                            >
                              {item.name}
                            </div>
                            <input
                              aria-label="input field"
                              required
                              className="p-cost-input"
                              style={{
                                width: "50px",
                              }}
                              type="number"
                              min={0}
                              max={item.qty}
                              value={returnModalItems[idx]?.qty ?? 0}
                              onChange={(e) =>
                                setReturnModalItems((prev) => ({
                                  ...prev,
                                  [idx]: {
                                    ...prev[idx],
                                    qty: Math.min(
                                      item.qty,
                                      Math.max(0, safeNumber(e.target.value)),
                                    ),
                                  },
                                }))
                              }
                            />
                          </div>
                        );
                      },
                    )}
                  </div>
                  <div
                    className="pos-input-group"
                    style={{
                      marginTop: "24px",
                    }}
                  >
                    <label htmlFor="field_n7vwud">Return Reason</label>
                    <select
                      id="field_n7vwud"
                      className="pos-input"
                      value={returnModalReason}
                      onChange={(e) => setReturnModalReason(e.target.value)}
                    >
                      <option>Patient Request</option>
                      <option>Wrong Medicine</option>
                      <option>Quality Issue</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnModalSelectedBill(null);
                  setReturnSearchQuery("");
                }}
              >
                Cancel
              </button>
              {returnModalSelectedBill && (
                <button
                  className="pos-btn outline"
                  style={{
                    background: "var(--danger)",
                    color: "white",
                    border: "none",
                  }}
                  onClick={async () => {
                    const returnPayload = resolveInvoiceItems(
                      returnModalSelectedBill,
                    ).reduce((acc, rawItem, idx) => {
                      const item = normalizeInvoiceItem(rawItem);
                      const qty = safeNumber(returnModalItems[idx]?.qty) || 0;
                      const checked = returnModalItems[idx]?.checked !== false;
                      if (checked && qty > 0) {
                        acc.push({
                          invoiceItemId: item.invoiceItemId || item.id,
                          medicineId: item.medicineId || null,
                          batchId: item.batchId || null,
                          quantity: qty,
                          reason: returnModalReason,
                        });
                      }
                      return acc;
                    }, []);
                    if (returnPayload.length === 0) {
                      showToast("No items selected for return", "error");
                      return;
                    }
                    if (processingReturn) return;
                    setProcessingReturn(true);
                    try {
                      const res = await api.post(
                        `billing/invoices/${returnModalSelectedBill.id}/refund`,
                        {
                          items: returnPayload,
                          reason: returnModalReason,
                        },
                      );
                      const refund =
                        res.data?.data?.actualRefundAmount ??
                        res.data?.actualRefundAmount ??
                        res.data?.data?.refundAmount ??
                        res.data?.refundAmount ??
                        res.data?.data?.totalRefundAmount ??
                        res.data?.totalRefundAmount ??
                        0;
                      showToast(
                        `Return processed successfully. Refund: ₹${Number(refund).toFixed(2)}`,
                        "success",
                      );
                      setShowReturnModal(false);
                      setReturnModalSelectedBill(null);
                      setReturnSearchQuery("");
                      window.dispatchEvent(
                        new CustomEvent("dashboard:refresh"),
                      );
                    } catch (err) {
                      showToast(
                        err.response?.data?.error || "Failed to process return",
                        "error",
                      );
                    } finally {
                      setProcessingReturn(false);
                    }
                  }}
                >
                  {processingReturn ? "Processing..." : "Process Return"}
                </button>
              )}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
