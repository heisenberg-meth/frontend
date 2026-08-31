import { useState, useEffect } from "react";
import { assignBatchSupplier } from "../../services/inventory.service.js";
import { Package, X, FileText, CheckCircle2 } from "lucide-react";
import { m } from "framer-motion";
import { getSuppliers } from "../../services/suppliers.service.js";
import {
  createReorder,
  getPurchaseOrderPdfUrl,
} from "../../services/purchases.service.js";
import { safeNumber } from "../../utils/number.js";
import { Spinner } from "./InventoryCore.jsx";

/* ─── Reorder Modal ─── */
export function ReorderModal({ medicine, onClose, showToast }) {
  const [quantity, setQuantity] = useState(() =>
    Math.max(20, (medicine.reorderLevel ?? medicine.reorderPoint ?? 20) * 3),
  );
  const [submitting, setSubmitting] = useState(false);

  const currentStock =
    medicine.availableStock ?? medicine.stock ?? medicine.currentStock ?? 0;
  const reorderLevel = medicine.reorderLevel ?? medicine.reorderPoint ?? 10;
  const purchasePrice = safeNumber(
    medicine.inventoryBatches?.[0]?.purchasePrice ?? medicine.purchaseCost ?? 0,
  );
  const gstPct = safeNumber(medicine.gstPercentage ?? medicine.gst ?? 0);
  const subtotal = Number((quantity * purchasePrice).toFixed(2));
  const gstAmount = Number(((subtotal * gstPct) / 100).toFixed(2));
  const total = Number((subtotal + gstAmount).toFixed(2));

  const supplierName =
    medicine.inventoryBatches?.[0]?.supplier?.name ??
    medicine.supplier?.name ??
    medicine.supplier ??
    "Not assigned";

  const handleSubmit = async () => {
    if (!quantity || quantity <= 0) {
      showToast("Quantity must be greater than zero", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createReorder({ medicineId: medicine.id, quantity });
      const po = res.data?.data?.purchaseOrder ?? res.data?.data;
      const poId = po?.id;
      const poNumber = po?.orderNumber ?? "PO";

      showToast(`Purchase Order ${poNumber} created successfully!`, "success");

      // Auto-download PDF
      if (poId) {
        const pdfUrl = getPurchaseOrderPdfUrl(poId);
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.target = "_blank";
        link.download = `${poNumber}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.error ??
        err?.message ??
        "Failed to create reorder";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="inv-modal-overlay"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      onClick={onClose}
    >
      <m.div
        role="button"
        tabIndex={0}
        className="inv-modal-content"
        style={{ width: "480px", maxWidth: "95vw" }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inv-modal-scroll" style={{ padding: "24px" }}>
          {/* Medicine Info */}
          <div
            style={{
              background: "var(--surface-2, #f8f9ff)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "20px",
              border: "1px solid var(--overlay-06, rgba(108,99,255,0.1))",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "16px",
                marginBottom: "12px",
                color: "var(--primary)",
              }}
            >
              {medicine.name}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                fontSize: "13px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Current Stock
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color:
                      currentStock <= reorderLevel
                        ? "var(--danger)"
                        : "var(--success)",
                  }}
                >
                  {currentStock} units
                </div>
              </div>
              <div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Reorder Level
                </div>
                <div style={{ fontWeight: 700 }}>{reorderLevel} units</div>
              </div>
              <div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Supplier
                </div>
                <div style={{ fontWeight: 600 }}>{supplierName}</div>
              </div>
              <div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Purchase Price
                </div>
                <div style={{ fontWeight: 700 }}>
                  ₹{purchasePrice.toFixed(2)}
                </div>
              </div>
              <div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  GST
                </div>
                <div style={{ fontWeight: 600 }}>{gstPct}%</div>
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="form-group full" style={{ marginBottom: "20px" }}>
            <label htmlFor="field_55l9j8" style={{ fontWeight: 700 }}>
              Order Quantity *
            </label>
            <input
              id="field_55l9j8"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              style={{ fontSize: "18px", fontWeight: 700, textAlign: "center" }}
            />
          </div>

          {/* Order Summary */}
          <div
            style={{
              background: "var(--primary-alpha, rgba(108,99,255,0.08))",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid var(--primary-alpha-30, rgba(108,99,255,0.2))",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--primary)",
                marginBottom: "10px",
              }}
            >
              Order Summary
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginBottom: "6px",
              }}
            >
              <span>
                Subtotal ({quantity} × ₹{purchasePrice.toFixed(2)})
              </span>
              <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginBottom: "6px",
              }}
            >
              <span>GST ({gstPct}%)</span>
              <span style={{ fontWeight: 600 }}>₹{gstAmount.toFixed(2)}</span>
            </div>
            <div
              style={{
                borderTop:
                  "1px solid var(--primary-alpha-30, rgba(108,99,255,0.2))",
                paddingTop: "10px",
                marginTop: "4px",
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 800,
                fontSize: "16px",
                color: "var(--primary)",
              }}
            >
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {supplierName === "Not assigned" && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "10px",
                padding: "10px 14px",
                marginTop: "14px",
                fontSize: "12px",
                color: "var(--danger)",
              }}
            >
              No supplier linked to this medicine. A supplier must be assigned
              (via a batch receipt) before reordering.
            </div>
          )}
        </div>

        <div className="inv-modal-footer">
          <button className="inv-modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="inv-modal-btn confirm"
            onClick={handleSubmit}
            disabled={submitting || quantity <= 0}
          >
            {submitting ? (
              <>
                <Spinner size={16} /> Creating PO...
              </>
            ) : (
              <>
                <FileText size={16} /> Generate Purchase Order
              </>
            )}
          </button>
        </div>
      </m.div>
    </div>
  );
}

const EMPTY_BATCH_FORM = {
  batchNumber: "",
  expiryDate: "",
  mrp: "",
  sellingPrice: "",
  purchasePrice: "",
  quantity: "",
  rackLocation: "",
};

export function BatchModal({
  onClose,
  onSave,
  batchData,
  medicineData,
  isAddMode,
  showToast,
  saving,
}) {
  const batches = medicineData?.inventoryBatches || [];

  const initialBatch = isAddMode ? null : batchData || null;

  const [selectedBatch, setSelectedBatch] = useState(initialBatch);
  const [form, setForm] = useState(
    initialBatch
      ? {
          batchNumber: initialBatch.batchNumber || "",
          expiryDate: initialBatch.expiryDate
            ? initialBatch.expiryDate.split("T")[0]
            : "",
          mrp: initialBatch.mrp ? String(initialBatch.mrp) : "",
          sellingPrice: initialBatch.sellingPrice
            ? String(initialBatch.sellingPrice)
            : "",
          purchasePrice: initialBatch.purchasePrice
            ? String(initialBatch.purchasePrice)
            : "",
          quantity:
            initialBatch.quantity !== null &&
            initialBatch.quantity !== undefined
              ? String(initialBatch.quantity)
              : "",
          rackLocation: initialBatch.rackLocation || "",
          supplierId: initialBatch?.supplierId || "",
        }
      : { ...EMPTY_BATCH_FORM, supplierId: "" },
  );
  const [errors, setErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [savingSupplier, setSavingSupplier] = useState(false);

  useEffect(() => {
    getSuppliers({ limit: 500 })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setSuppliers(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);
  const handleSupplierChange = async (supplierId) => {
    if (!selectedBatch) return;
    setSavingSupplier(true);
    try {
      await assignBatchSupplier(selectedBatch.id, supplierId || null);
      setSelectedBatch((b) => ({ ...b, supplierId: supplierId || null }));
      setForm((f) => ({ ...f, supplierId: supplierId || "" }));
      showToast("Supplier updated", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update supplier", "error");
    } finally {
      setSavingSupplier(false);
    }
  };

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    const batchNumber = String(form.batchNumber || "").trim();

    if (!batchNumber) newErrors.batchNumber = "Batch number is required";
    if (!form.expiryDate) newErrors.expiryDate = "Expiry date is required";
    else if (new Date(form.expiryDate) <= new Date())
      newErrors.expiryDate = "Expiry date must be in the future";

    if (!form.mrp || safeNumber(form.mrp) <= 0)
      newErrors.mrp = "MRP must be greater than 0";

    if (form.quantity === "" || safeNumber(form.quantity) < 0)
      newErrors.quantity = "Quantity must be non-negative";
    if (form.purchasePrice === "" || safeNumber(form.purchasePrice) < 0)
      newErrors.purchasePrice = "Purchase price must be non-negative";
    if (
      form.sellingPrice === "" ||
      safeNumber(form.sellingPrice) < safeNumber(form.purchasePrice)
    )
      newErrors.sellingPrice = "Selling price must be >= purchase price";
    if (safeNumber(form.sellingPrice) > safeNumber(form.mrp))
      newErrors.sellingPrice = "Selling price cannot exceed MRP";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }
    onSave({
      id: selectedBatch ? selectedBatch.id : undefined,
      batchNumber: form.batchNumber.trim(),
      expiryDate: form.expiryDate,
      mrp: safeNumber(form.mrp),
      sellingPrice: safeNumber(form.sellingPrice),
      rackLocation: form.rackLocation.trim(),
      quantity: safeNumber(form.quantity),
      purchasePrice: safeNumber(form.purchasePrice),
      ...(!selectedBatch && {
        medicineId: medicineData.id,
      }),
    });
  };

  const totalStock = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);

  return (
    <div
      role="button"
      tabIndex={0}
      className="inv-modal-overlay"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      onClick={onClose}
    >
      <m.div
        role="button"
        tabIndex={0}
        className="inv-modal-content"
        style={{
          width: "600px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inv-modal-header" style={{ flexShrink: 0 }}>
          <div className="header-title-group">
            <Package size={20} style={{ color: "var(--primary)" }} />
            <h3>
              {isAddMode || (!selectedBatch && batches.length === 0)
                ? "Add New Batch"
                : "Edit Stock"}
            </h3>
          </div>
          <button className="inv-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div
          className="inv-modal-scroll"
          style={{ overflowY: "auto", padding: "20px" }}
        >
          {!isAddMode && batches.length > 0 && (
            <div
              style={{
                marginBottom: "20px",
                background: "var(--bg-secondary)",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ margin: "0 0 5px 0", color: "var(--text-primary)" }}>
                {medicineData?.name}
              </h4>
              <p
                style={{
                  margin: "0 0 15px 0",
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                }}
              >
                Total Stock Across All Batches:{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {totalStock} Units
                </strong>
              </p>

              {batches.length > 0 && (
                <>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    Select Batch to Edit:
                  </p>
                  <div
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                    }}
                  >
                    <table
                      className="inv-table"
                      style={{ margin: 0, border: "none" }}
                    >
                      <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th>Batch Number</th>
                          <th>Qty</th>
                          <th>Expiry</th>
                          <th style={{ width: "80px", textAlign: "center" }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {batches.map((b) => (
                          <tr
                            role="button"
                            tabIndex={0}
                            key={b.id}
                            className={`batch-row ${selectedBatch?.id === b.id ? "selected" : ""}`}
                            style={{
                              background:
                                selectedBatch?.id === b.id
                                  ? "var(--hover-bg)"
                                  : "transparent",
                              cursor: "pointer",
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.currentTarget.click();
                              }
                            }}
                            onClick={() => {
                              setSelectedBatch(b);
                              setForm({
                                batchNumber: b.batchNumber || "",
                                expiryDate: b.expiryDate
                                  ? b.expiryDate.split("T")[0]
                                  : "",
                                mrp: b.mrp ? String(b.mrp) : "",
                                sellingPrice: b.sellingPrice
                                  ? String(b.sellingPrice)
                                  : "",
                                purchasePrice: b.purchasePrice
                                  ? String(b.purchasePrice)
                                  : "",
                                quantity:
                                  b.quantity !== null &&
                                  b.quantity !== undefined
                                    ? String(b.quantity)
                                    : "",
                                rackLocation: b.rackLocation || "",
                              });
                              setErrors({});
                            }}
                          >
                            <td>{b.batchNumber}</td>
                            <td>{b.quantity}</td>
                            <td>
                              {new Date(b.expiryDate).toLocaleDateString(
                                "en-GB",
                                { month: "short", year: "numeric" },
                              )}
                            </td>
                            <td
                              style={{
                                textAlign: "center",
                                padding: "4px 8px",
                              }}
                            >
                              <button
                                className={`action-btn ${
                                  selectedBatch?.id === b.id
                                    ? "editing"
                                    : "edit"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBatch(b);
                                  setForm({
                                    batchNumber: b.batchNumber || "",
                                    expiryDate: b.expiryDate
                                      ? b.expiryDate.split("T")[0]
                                      : "",
                                    mrp: b.mrp ? String(b.mrp) : "",
                                    sellingPrice: b.sellingPrice
                                      ? String(b.sellingPrice)
                                      : "",
                                    purchasePrice: b.purchasePrice
                                      ? String(b.purchasePrice)
                                      : "",
                                    quantity:
                                      b.quantity !== null &&
                                      b.quantity !== undefined
                                        ? String(b.quantity)
                                        : "",
                                    rackLocation: b.rackLocation || "",
                                  });
                                  setErrors({});
                                }}
                              >
                                {selectedBatch?.id === b.id ? (
                                  <>✓ Editing</>
                                ) : (
                                  <> Edit Batch</>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {isAddMode || selectedBatch || batches.length === 0 ? (
            <>
              {!isAddMode && batches.length > 0 && (
                <h4
                  style={{
                    marginBottom: "15px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid var(--border-color)",
                    color: "var(--primary)",
                  }}
                >
                  Selected Batch: {selectedBatch?.batchNumber}
                </h4>
              )}
              <div
                className="inv-form-grid"
                style={{ gridTemplateColumns: "1fr" }}
              >
                <div className="form-group">
                  <label htmlFor="field_tsagqh">Batch Number *</label>
                  <input
                    id="field_tsagqh"
                    required
                    placeholder="e.g. B-20241"
                    value={form.batchNumber || ""}
                    onChange={(e) => set("batchNumber", e.target.value)}
                    className={errors.batchNumber ? "input-error" : ""}
                  />
                  {errors.batchNumber && (
                    <span className="field-error">{errors.batchNumber}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="field_zbkpxk">Expiry Date *</label>
                  <input
                    id="field_zbkpxk"
                    required
                    type="date"
                    value={form.expiryDate || ""}
                    onChange={(e) => set("expiryDate", e.target.value)}
                    className={errors.expiryDate ? "input-error" : ""}
                  />
                  {errors.expiryDate && (
                    <span className="field-error">{errors.expiryDate}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="field_z6q08o">MRP (₹) *</label>
                  <input
                    id="field_z6q08o"
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.mrp ?? ""}
                    onChange={(e) => set("mrp", e.target.value)}
                    className={errors.mrp ? "input-error" : ""}
                  />
                  {errors.mrp && (
                    <span className="field-error">{errors.mrp}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="field_vgw1mt">Selling Price (₹) *</label>
                  <input
                    id="field_vgw1mt"
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.sellingPrice ?? ""}
                    onChange={(e) => set("sellingPrice", e.target.value)}
                    className={errors.sellingPrice ? "input-error" : ""}
                  />
                  {errors.sellingPrice && (
                    <span className="field-error">{errors.sellingPrice}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="field_7dlhfx">Purchase Price (₹) *</label>
                  <input
                    id="field_7dlhfx"
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.purchasePrice ?? ""}
                    onChange={(e) => set("purchasePrice", e.target.value)}
                    className={errors.purchasePrice ? "input-error" : ""}
                  />
                  {errors.purchasePrice && (
                    <span className="field-error">{errors.purchasePrice}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="field_xowwjm">Stock Quantity *</label>
                  <input
                    id="field_xowwjm"
                    required
                    type="number"
                    placeholder="0"
                    value={form.quantity ?? ""}
                    onChange={(e) => set("quantity", e.target.value)}
                    className={errors.quantity ? "input-error" : ""}
                  />
                  {errors.quantity && (
                    <span className="field-error">{errors.quantity}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="field_72c32p">Rack Location</label>
                  <input
                    id="field_72c32p"
                    required
                    placeholder="e.g. A-12"
                    value={form.rackLocation || ""}
                    onChange={(e) => set("rackLocation", e.target.value)}
                  />
                </div>

                {selectedBatch && (
                  <div className="form-group">
                    <label htmlFor="field_bqruk5">Supplier</label>
                    <select
                      id="field_bqruk5"
                      value={form.supplierId || ""}
                      onChange={(e) => handleSupplierChange(e.target.value)}
                      disabled={savingSupplier}
                    >
                      <option value="">No Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {savingSupplier && (
                      <span
                        style={{ fontSize: "12px", color: "var(--text-muted)" }}
                      >
                        Saving...
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              <Package
                size={40}
                style={{ margin: "0 auto 15px", opacity: 0.3 }}
              />
              <p style={{ fontSize: "1.1rem" }}>
                Please select a batch from the list above to edit its stock.
              </p>
            </div>
          )}
        </div>
        <div className="inv-modal-footer" style={{ flexShrink: 0 }}>
          <button className="inv-modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="inv-modal-btn confirm"
            onClick={handleSave}
            disabled={
              saving || (!isAddMode && batches.length > 0 && !selectedBatch)
            }
            style={{
              opacity:
                !isAddMode && batches.length > 0 && !selectedBatch ? 0.5 : 1,
            }}
          >
            {saving ? (
              <>
                <Spinner size={16} /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />{" "}
                {isAddMode || (!selectedBatch && batches.length === 0)
                  ? "Add Batch"
                  : "Update Batch"}
              </>
            )}
          </button>
        </div>
      </m.div>
    </div>
  );
}
