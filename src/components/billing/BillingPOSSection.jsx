import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";
import {
  Plus,
  Minus,
  // Search,
  RefreshCw,
  Barcode,
  X,
  CheckCircle2,
  Printer,
  MessageCircle,
  Save,
  Loader2,
  Play,
  Trash2,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { TableHeader } from "../common/TableHeader.jsx";
import { normalizeInvoice } from "../../utils/billingNormalizer";
import "../../styles/BillingPOS.css";
import { validatePatientPhone } from "../../utils/validatePatientPhone.js";

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

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

function twoDigits(num) {
  if (num < 20) return ones[num];
  return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
}
function threeDigits(num) {
  if (num === 0) return "";
  if (num < 100) return twoDigits(num);
  return (
    ones[Math.floor(num / 100)] +
    " Hundred" +
    (num % 100 ? " and " + twoDigits(num % 100) : "")
  );
}

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
function numberToWords(n) {
  if (n === 0) return "Zero";
  let intPart = Math.floor(n);
  let result = "";
  if (intPart >= 10000000) {
    result += threeDigits(Math.floor(intPart / 10000000)) + " Crore ";
    intPart %= 10000000;
  }
  if (intPart >= 100000) {
    result += threeDigits(Math.floor(intPart / 100000)) + " Lakh ";
    intPart %= 100000;
  }
  if (intPart >= 1000) {
    result += threeDigits(Math.floor(intPart / 1000)) + " Thousand ";
    intPart %= 1000;
  }
  if (intPart > 0) result += threeDigits(intPart);
  return result.trim() + " Rupees Only";
}
function Spinner({ size = 14 }) {
  return <Loader2 size={size} className="spinner-icon" />;
}

const resolvePaymentMethod = (bill) => {
  if (Array.isArray(bill.payments) && bill.payments.length > 0) {
    return (
      bill.payments[0].paymentMode || bill.payments[0].paymentMethod || "CASH"
    );
  }
  return bill.paymentMode || bill.paymentMethod || "CASH";
};

const resolveInvoiceItems = (invoice) => {
  if (Array.isArray(invoice?.items)) return invoice.items;
  if (Array.isArray(invoice?.saleItems)) return invoice.saleItems;
  if (Array.isArray(invoice?.itemsList)) return invoice.itemsList;
  if (Array.isArray(invoice?.lineItems)) return invoice.lineItems;
  return [];
};

const normalizeBill = (bill) => {
  const resolvedItems = resolveInvoiceItems(bill);
  return {
    ...bill,
    patient: resolveInvoiceField(bill, "patientName", "Walk-in Customer"),
    phone: resolveInvoiceField(bill, "patientPhone", "-"),
    invoiceNumber: resolveInvoiceField(bill, "invoiceNumber", bill.id),
    items: resolvedItems,
    itemsList: resolvedItems,
    subtotal: safeNumber(resolveInvoiceField(bill, "subtotal", 0)),
    cgst: safeNumber(resolveInvoiceField(bill, "cgst", 0)),
    sgst: safeNumber(resolveInvoiceField(bill, "sgst", 0)),
    discount: safeNumber(resolveInvoiceField(bill, "discount", 0)),
    total: safeNumber(resolveInvoiceField(bill, "total", 0)),
    amount: safeNumber(resolveInvoiceField(bill, "total", 0)),
    date: resolveInvoiceField(bill, "date", ""),
    paymentMethod: resolvePaymentMethod(bill),
  };
};
export function BillingPOSSection1({
  setIsWalkIn,
  isWalkIn,
  setPatient,
  patient,
  setPhoneFieldError,
  selectPatient,
  handleSearchChange,
  setShowDropdown,
  clearSearch,
  addToLineItems,
  updateQty,
  setLineItems,
  subtotal,
  discountAmount,
  removeRow,
  paymentMode,
  setPaymentMode,
  m,
  setDiscount,
  user,
  showToast,
  grandTotal,
  lineItems,
  setInvoiceSaving,
  discountPercentage,
  editingDraft,
  setActiveInvoice,
  setBills,
  setEditingDraft,
  setShowPreview,
  barcodeInputRef,
  setShowAllBillsModal,
  billCardFlash,
  openBillDetail,
  handleResumeDraftClick,
  handleDeleteDraftConfirm,
  handleBillPrint,
  handleBillWhatsApp,
  handleBillReturn,
  patientResults,
  phoneFieldError,
  search,
  cgstAmt,
  showPatientDropdown,
  draftError,
  handleLoadMore,
  avgGst,
  invoiceSaving,
  sgstAmt,
  medResults,
  visibleBills,
  allBillsLoaded,
  newPatientMsg,
  // handleFindPatient,
  draftSaving,
  findError,
  loyaltyProfile,
  handleSaveDraft,
  showDropdown,
  discount,
  loadMoreLoading,
  draftSaved,
  // findLoading,
  todayBills,
}) {
  return (
    <>
      <div className="medicine-search-full">
        <div className="pos-card" style={{ padding: "16px 24px" }}>
          <div
            className="search-wrapper"
            style={{ marginBottom: 0 }}
            role="presentation"
            onClick={(e) => e.stopPropagation()}
          >
            <Barcode className="barcode-icon" size={24} />
            <>
              <label htmlFor="field_od78yz" className="sr-only">
                Scan barcode or type medicine name... (Ctrl+F)
              </label>
              <input
                required
                ref={barcodeInputRef}
                className="barcode-input"
                placeholder="Scan barcode or type medicine name... (Ctrl+F)"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                id="field_od78yz"
              />
            </>
            {search && (
              <button
                className="search-clear-btn"
                aria-label="Clear search"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSearch();
                }}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  zIndex: 10,
                }}
              >
                <X size={16} />
              </button>
            )}
            <AnimatePresence>
              {showDropdown && medResults.length > 0 && (
                <m.div
                  role="presentation"
                  className="autocomplete-dropdown"
                  initial={{
                    opacity: 0,
                    y: -10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {medResults.map((res) => {
                    const availQty = res.availableStock ?? 0;
                    const isOOS = availQty <= 0 || res.isOutOfStock;
                    return (
                      <button
                        type="button"
                        key={res.id}
                        className={`result-row${isOOS ? " oos" : ""}`}
                        style={
                          isOOS
                            ? {
                                opacity: 0.55,
                                pointerEvents: "none",
                                cursor: "not-allowed",
                              }
                            : {}
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.currentTarget.click();
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOOS) addToLineItems(res);
                        }}
                      >
                        <div className="result-medicine">
                          <span className="result-name">{res.name}</span>
                          <span className="result-meta">
                            {res.genericName || res.generic || "—"}
                          </span>
                        </div>
                        <div className="result-batch">
                          <span className="result-meta">
                            Batch:{" "}
                            {res.batchNumber ||
                              res.batch ||
                              res.batchId ||
                              "N/A"}
                          </span>
                          <span className="result-meta">
                            Exp:{" "}
                            {res.expiryDate
                              ? new Date(res.expiryDate).toLocaleDateString(
                                  "en-IN",
                                )
                              : res.exp || res.expiry || "N/A"}
                          </span>
                        </div>
                        <div className="result-stock">
                          <div
                            className="result-name"
                            style={{
                              color: "var(--primary)",
                            }}
                          >
                            ₹{safeNumber(res.price || res.mrp).toFixed(2)}
                          </div>
                          {isOOS ? (
                            <span
                              className="result-meta"
                              style={{
                                color: "var(--danger)",
                                fontWeight: 700,
                              }}
                            >
                              OUT OF STOCK
                            </span>
                          ) : (
                            <span className="result-meta">
                              {availQty} in stock
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="pos-main-grid">
        <div className="bill-creator-col">
          <div className="pos-card">
            <div className="pos-card-title">
              <span>PATIENT DETAILS</span>
              <button
                type="button"
                className="walk-in-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWalkIn((prev) => !prev);
                }}
                title={isWalkIn ? "Walk-in mode" : "Click to enable walk-in"}
              >
                <div
                  style={{
                    width: "40px",
                    height: "20px",
                    background: isWalkIn
                      ? "var(--primary)"
                      : "var(--overlay-10)",
                    borderRadius: "20px",
                    position: "relative",
                    transition: "background-color 0.3s, background 0.3s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: isWalkIn ? "22px" : "2px",
                      top: "2px",
                      width: "16px",
                      height: "16px",
                      background: "white",
                      borderRadius: "50%",
                      transition: "left 0.3s",
                    }}
                  />
                </div>
                Walk-in
              </button>
            </div>
            <div className="patient-row">
              <div className="pos-input-group">
                <label htmlFor="patient-name-input">PATIENT NAME</label>
                <input
                  required
                  id="patient-name-input"
                  className={`pos-input ${newPatientMsg ? "new-patient-input" : ""}`}
                  placeholder={isWalkIn ? "Walk-in Customer" : "Enter name..."}
                  value={patient.name}
                  onChange={(e) =>
                    setPatient({
                      ...patient,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="pos-input-group">
                <label htmlFor="patient-phone-input">PHONE NUMBER</label>

                <input
                  required={!isWalkIn}
                  id="patient-phone-input"
                  className={`pos-input ${phoneFieldError ? "input-error" : ""}`}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={patient.phone}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);

                    setPatient({
                      ...patient,
                      phone: value,
                    });

                    if (!value) {
                      setPhoneFieldError(
                        isWalkIn ? "" : "Phone number is required",
                      );
                    } else if (!/^[6-9]\d{9}$/.test(value)) {
                      setPhoneFieldError(
                        value.length < 10
                          ? "Phone number must be exactly 10 digits"
                          : "Enter a valid 10-digit Indian mobile number",
                      );
                    } else {
                      setPhoneFieldError("");
                    }
                  }}
                  onBlur={() => {
                    if (isWalkIn) {
                      setPhoneFieldError("");
                      return;
                    }

                    setPhoneFieldError(validatePatientPhone(patient.phone));
                  }}
                />

                {phoneFieldError && (
                  <span className="field-error-text">{phoneFieldError}</span>
                )}
              </div>
              {/* <button
                className={`pos-btn outline ${findLoading ? "btn-loading" : ""}`}
                style={{
                  marginTop: "auto",
                  height: "42px",
                }}
                onClick={handleFindPatient}
                disabled={findLoading}
              >
                {findLoading ? (
                  <>
                    <Spinner size={14} /> Searching...
                  </>
                ) : (
                  <>
                    <Search size={16} /> Find
                  </>
                )}
              </button> */}
            </div>

            <AnimatePresence>
              {showPatientDropdown && patientResults.length > 0 && (
                <m.div
                  className="patient-search-dropdown"
                  initial={{
                    opacity: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                  }}
                >
                  {patientResults.map((p, pIdx) => (
                    <button
                      type="button"
                      key={
                        p.id ||
                        p._id ||
                        `pat-${p.fullName || p.name || "p"}-${p.phone || ""}-${pIdx}`
                      }
                      className="patient-result-row"
                      onClick={() => selectPatient(p)}
                    >
                      <span className="patient-result-name">
                        {p.fullName || p.name}
                      </span>
                      <span className="patient-result-phone">{p.phone}</span>
                      {p.lastVisit != null && (
                        <span className="patient-result-visit">
                          last visit: {p.lastVisit} days ago
                        </span>
                      )}
                    </button>
                  ))}
                </m.div>
              )}
            </AnimatePresence>

            {newPatientMsg && (
              <div className="new-patient-msg">{newPatientMsg}</div>
            )}
            {findError && <div className="find-error-msg">{findError}</div>}

            {!isWalkIn && (
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {loyaltyProfile?.accountStatus === "BLOCKED" && (
                  <div
                    style={{
                      marginTop: 4,
                      fontWeight: 800,
                    }}
                  >
                    CREDIT ACCOUNT BLOCKED
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pos-card">
            <div className="table-scroll-container">
              <table className="line-items-table">
                <TableHeader
                  columns={["Item", "Qty", "MRP", "GST%", "Total", ""]}
                />
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <span className="result-name">{item.name}</span>
                          <span
                            className="result-meta"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "var(--danger)",
                              }}
                            />
                            {item.batch?.batchNumber ||
                              item.batchNumber ||
                              item.batchId ||
                              "N/A"}{" "}
                            · Exp {item.exp}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="qty-stepper">
                          <button
                            className="step-btn"
                            aria-label="Decrease quantity"
                            onClick={() => updateQty(item.batchId, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            required
                            className="qty-input"
                            aria-label="Item quantity"
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.qty}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const qty = Math.max(
                                1,
                                Math.min(Number(raw) || 1, item.stock || 9999),
                              );
                              setLineItems((prev) =>
                                prev.map((i) =>
                                  i.batchId === item.batchId
                                    ? {
                                        ...i,
                                        qty,
                                        total: qty * safeNumber(i.price),
                                      }
                                    : i,
                                ),
                              );
                            }}
                          />
                          <button
                            aria-label="Add"
                            className="step-btn"
                            onClick={() => updateQty(item.batchId, 1)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          aria-label="input field"
                          required
                          className="pos-input"
                          type="number"
                          min="0"
                          step="0.01"
                          style={{
                            width: "70px",
                            padding: "6px",
                          }}
                          value={item.price}
                          onChange={(e) => {
                            const price = Number(e.target.value) || 0;
                            setLineItems((prev) =>
                              prev.map((i) =>
                                i.batchId === item.batchId
                                  ? {
                                      ...i,
                                      price,
                                      total: price * safeNumber(i.qty),
                                    }
                                  : i,
                              ),
                            );
                          }}
                        />
                      </td>

                      <td
                        className="result-meta"
                        style={{
                          fontWeight: 800,
                        }}
                      >
                        {safeNumber(item.gst)}%
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: "var(--primary)",
                        }}
                      >
                        ₹
                        {(() => {
                          const lineGross =
                            safeNumber(item.price) * safeNumber(item.qty);
                          const discountRatio =
                            subtotal > 0 ? discountAmount / subtotal : 0;
                          const lineDisc = lineGross * discountRatio;
                          return (lineGross - lineDisc).toFixed(2);
                        })()}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                        }}
                      >
                        <button
                          aria-label="Close"
                          className="step-btn"
                          style={{
                            color: "var(--danger)",
                          }}
                          onClick={() => removeRow(item.batchId)}
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="payment-modes"
              style={{
                marginTop: 20,
              }}
            >
              {["CASH", "UPI", "CARD"].map((m) => (
                <button
                  key={m}
                  className={`mode-pill ${paymentMode === m ? "active" : ""}`}
                  onClick={() => setPaymentMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="sticky-bottom-actions">
              <div className="bill-summary-v3">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>CGST (avg {avgGst}%)</span>
                  <span>₹{cgstAmt.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>SGST (avg {avgGst}%)</span>
                  <span>₹{sgstAmt.toFixed(2)}</span>
                </div>
                <div
                  className="summary-row"
                  style={{
                    alignItems: "center",
                  }}
                >
                  <span>Discount (%)</span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <input
                      aria-label="input field"
                      required
                      className="pos-input"
                      style={{
                        width: "80px",
                        height: "30px",
                        textAlign: "right",
                      }}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      min="0"
                      max="100"
                      type="number"
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      = ₹{discountAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="summary-row grand">
                  <span>
                    GRAND TOTAL{" "}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "var(--text-muted)",
                      }}
                    >
                      ({lineItems.length} item
                      {lineItems.length !== 1 ? "s" : ""})
                    </span>
                  </span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "8px",
                    textAlign: "right",
                  }}
                >
                  {numberToWords(Math.round(grandTotal))}
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  width: "320px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                  }}
                >
                  <button
                    className={`pos-btn outline ${draftSaving ? "btn-loading" : ""} ${draftSaved ? "btn-success" : ""} ${draftError ? "btn-error" : ""}`}
                    style={{
                      flex: 1,
                    }}
                    onClick={handleSaveDraft}
                    disabled={draftSaving || lineItems.length === 0}
                    title="Save Draft (F2)"
                  >
                    {draftSaving ? (
                      <>
                        <Spinner size={16} /> Saving...
                      </>
                    ) : draftSaved ? (
                      <>
                        <CheckCircle2 size={16} /> Draft Saved!
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save Draft
                      </>
                    )}
                  </button>
                </div>
                <button
                  id="generate-invoice-btn"
                  className="pos-btn teal"
                  style={{
                    height: "48px",
                    fontSize: "16px",
                  }}
                  title="Generate Invoice (F8)"
                  onClick={async () => {
                    if (!user?.branchId) {
                      showToast(
                        "Branch context missing. Cannot generate invoice.",
                        "error",
                      );
                      return;
                    }
                    if (Number.isNaN(grandTotal) || grandTotal <= 0) {
                      showToast("Invalid total amount calculation", "error");
                      return;
                    }
                    if (lineItems.length === 0) {
                      showToast("Add at least one medicine", "error");
                      return;
                    }
                    for (const item of lineItems) {
                      if (!Number.isFinite(item.qty)) {
                        showToast("Invalid Quantity", "error");
                        return;
                      }
                      if (!Number.isFinite(item.price)) {
                        showToast("Invalid Price", "error");
                        return;
                      }
                    }
                    if (!isWalkIn) {
                      const phoneError = validatePatientPhone(patient.phone);

                      if (phoneError) {
                        setPhoneFieldError(phoneError);
                        showToast(phoneError, "error");
                        return;
                      }
                    }
                    setInvoiceSaving(true);
                    try {
                      const payload = {
                        patientId: isWalkIn ? null : patient.id,
                        patientName: isWalkIn
                          ? "Walk-in Customer"
                          : patient.name || "Walk-in Customer",
                        patientPhone: isWalkIn ? null : patient.phone,
                        items: lineItems.map((it) => ({
                          medicineId: it.id,
                          batchId: it.batchId,
                          quantity: it.qty,
                          unitPrice: it.price,
                          gstPercentage: it.gst || 0,
                        })),
                        paymentMode: paymentMode,
                        discountPercentage: discountPercentage,
                        discountAmount: discountAmount,
                        discountType: "PERCENTAGE",
                        branchId: user.branchId,
                      };
                      let res;
                      if (editingDraft) {
                        res = await api.post(
                          `${API_ROUTES.BILLING_INVOICES}/${editingDraft.id}/finalize`,
                          payload,
                        );
                      } else {
                        res = await api.post(
                          API_ROUTES.BILLING_INVOICES,
                          payload,
                        );
                      }
                      const rawInv = res.data?.data || res.data;
                      const newInv = normalizeInvoice(rawInv);
                      const invoiceWithPatient = {
                        ...newInv,
                        patientName: payload.patientName,
                        patientPhone: payload.patientPhone,
                      };
                      setActiveInvoice(invoiceWithPatient);
                      const normalizedBillItem = normalizeBill({
                        ...newInv,
                        paymentMethod: paymentMode,
                        patientName: payload.patientName,
                        patientPhone: payload.patientPhone,
                      });
                      if (editingDraft) {
                        setBills((prev) =>
                          prev.map((b) =>
                            b.id === editingDraft.id ? normalizedBillItem : b,
                          ),
                        );
                        setEditingDraft(null);
                      } else {
                        setBills((prev) => [normalizedBillItem, ...prev]);
                      }
                      setShowPreview(true);
                      showToast(
                        editingDraft
                          ? `Draft finalized into invoice`
                          : `Invoice generated`,
                        "success",
                      );
                      setTimeout(() => barcodeInputRef.current?.focus(), 300);
                    } catch (err) {
                      console.error(err);
                      showToast(
                        err.response?.data?.message || "Failed to save invoice",
                        "error",
                      );
                    } finally {
                      setInvoiceSaving(false);
                    }
                  }}
                  disabled={invoiceSaving || lineItems.length === 0}
                >
                  {invoiceSaving ? (
                    <>
                      <Spinner size={20} />{" "}
                      {editingDraft
                        ? "FINALIZING DRAFT..."
                        : "SAVING INVOICE..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={24} />{" "}
                      {editingDraft ? "FINALIZE DRAFT" : "GENERATE INVOICE"}
                    </>
                  )}
                </button>
                {draftError && (
                  <div className="draft-error-text">{draftError}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pos-history-col">
          <div
            className="pos-card"
            style={{
              padding: "20px",
            }}
          >
            <div className="pos-card-title">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>TODAY'S BILLS</span>
                <span
                  className="badge-paid"
                  style={{
                    background: "var(--primary)",
                    color: "#000",
                  }}
                >
                  {todayBills.length}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  className="view-all-link"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Clear all loaded bills from view? This will not delete any data.",
                      )
                    ) {
                      setBills([]);
                    }
                  }}
                  style={{
                    color: "var(--danger)",
                  }}
                >
                  Clear All
                </button>
                <button
                  type="button"
                  className="view-all-link"
                  onClick={() => setShowAllBillsModal(true)}
                >
                  View All →
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: "500px",
                overflowY: "auto",
              }}
            >
              <AnimatePresence>
                {visibleBills.map((bill) => (
                  <m.div
                    key={bill.id}
                    className={`bill-card-compact ${billCardFlash === bill.id ? "bill-card-flash" : ""} ${bill.status === "DRAFT" ? "bill-card-draft" : ""} ${bill.status === "RETURNED" ? "bill-card-returned" : ""}`}
                    initial={{
                      opacity: 0,
                      y: -20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      style={{ cursor: "pointer" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openBillDetail(bill);
                        }
                      }}
                      onClick={() => openBillDetail(bill)}
                    >
                      <div className="bill-card-header">
                        <span
                          style={{
                            fontFamily: "Outfit",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          {resolveInvoiceField(bill, "invoiceNumber", bill.id)}
                        </span>
                        <span className="result-meta">{bill.time}</span>
                      </div>
                      <div className="bill-card-body">
                        <div
                          style={{
                            fontWeight: 600,
                          }}
                        >
                          {bill.patient ||
                            resolveInvoiceField(
                              bill,
                              "patientName",
                              "Walk-in Customer",
                            )}
                        </div>
                        <div className="result-meta">
                          {bill.phone ||
                            resolveInvoiceField(bill, "patientPhone", "-")}
                        </div>
                      </div>
                      <div className="bill-card-footer">
                        <div className="result-meta">
                          {bill.items.length} medicines · ₹
                          {safeNumber(bill.total).toFixed(2)}
                        </div>
                        <div
                          className={`status-badge ${bill.status === "DRAFT" ? "badge-draft" : bill.status === "RETURNED" ? "badge-returned" : "badge-paid"}`}
                        >
                          {bill.status}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--overlay-05)",
                      }}
                    >
                      {bill.status === "DRAFT" ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            width: "100%",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            type="button"
                            className="pos-btn primary"
                            style={{
                              padding: "4px 12px",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResumeDraftClick(bill);
                            }}
                          >
                            <Play size={12} fill="currentColor" /> Resume
                          </button>
                          <button
                            type="button"
                            className="pos-btn outline btn-error"
                            style={{
                              padding: "4px 12px",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDraftConfirm(bill);
                            }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      ) : (
                        <>
                          <Printer
                            size={14}
                            className="result-meta bill-action-icon"
                            style={{
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBillPrint(bill);
                            }}
                            title="Print"
                          />
                          <MessageCircle
                            size={14}
                            className="result-meta bill-action-icon"
                            style={{
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBillWhatsApp(bill);
                            }}
                            title="Send WhatsApp"
                          />
                          <RefreshCw
                            size={14}
                            className="result-meta bill-action-icon"
                            style={{
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBillReturn(bill);
                            }}
                            title="Process Return"
                          />
                        </>
                      )}
                    </div>
                  </m.div>
                ))}
              </AnimatePresence>
            </div>
            <div
              style={{
                textAlign: "center",
                marginTop: "16px",
              }}
            >
              <button
                className={`load-more-btn ${loadMoreLoading ? "btn-loading" : ""} ${allBillsLoaded ? "btn-disabled" : ""}`}
                onClick={handleLoadMore}
                disabled={loadMoreLoading || allBillsLoaded}
              >
                {allBillsLoaded ? (
                  "All bills loaded ✓"
                ) : loadMoreLoading ? (
                  <>
                    <Spinner size={14} /> Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          </div>

          <div
            className="pos-card"
            style={{
              padding: "20px",
            }}
          >
            <div className="pos-card-title">TODAY'S SUMMARY</div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {[
                {
                  label: "CASH",
                  val:
                    "₹" +
                    (todayBills || [])
                      .filter(
                        (b) => (b.paymentMode || b.paymentMethod) === "CASH",
                      )
                      .reduce((s, b) => s + safeNumber(b.total), 0)
                      .toLocaleString(),
                  col: "var(--primary)",
                  pct:
                    (todayBills || []).length > 0
                      ? ((todayBills || []).filter(
                          (b) => (b.paymentMode || b.paymentMethod) === "CASH",
                        ).length /
                          (todayBills || []).length) *
                        100
                      : 0,
                },
                {
                  label: "UPI",
                  val:
                    "₹" +
                    (todayBills || [])
                      .filter(
                        (b) => (b.paymentMode || b.paymentMethod) === "UPI",
                      )
                      .reduce((s, b) => s + safeNumber(b.total), 0)
                      .toLocaleString(),
                  col: "var(--info)",
                  pct:
                    (todayBills || []).length > 0
                      ? ((todayBills || []).filter(
                          (b) => (b.paymentMode || b.paymentMethod) === "UPI",
                        ).length /
                          (todayBills || []).length) *
                        100
                      : 0,
                },
                {
                  label: "CARD",
                  val:
                    "₹" +
                    (todayBills || [])
                      .filter(
                        (b) => (b.paymentMode || b.paymentMethod) === "CARD",
                      )
                      .reduce((s, b) => s + safeNumber(b.total), 0)
                      .toLocaleString(),
                  col: "var(--info)",
                  pct:
                    (todayBills || []).length > 0
                      ? ((todayBills || []).filter(
                          (b) => (b.paymentMode || b.paymentMethod) === "CARD",
                        ).length /
                          (todayBills || []).length) *
                        100
                      : 0,
                },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      {s.label}
                    </span>
                    <span>{s.val}</span>
                  </div>
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
                        width: `${s.pct}%`,
                        height: "100%",
                        background: s.col,
                      }}
                    />
                  </div>
                </div>
              ))}
              {todayBills.length === 0 && (
                <p
                  className="result-meta"
                  style={{
                    textAlign: "center",
                    marginTop: 40,
                  }}
                >
                  No finalized bills yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
