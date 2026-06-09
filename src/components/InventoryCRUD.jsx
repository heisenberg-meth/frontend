import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  Download,
  X,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Pill,
  DollarSign,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreateMedicineSchema,
  UpdateMedicineSchema,
} from "../constants/medicine.schema.js";
import {
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getCategories,
  addBatch,
  updateBatch,
} from "../services/inventory.service";
import { useAuth } from "../hooks/useAuth";
import ConfirmModal from "./ConfirmModal";
import { normalizeMedicine } from "../utils/normalizers";
import { calculateTotalStockValue } from "../utils/inventoryHelpers";
function Spinner({ size = 14 }) {
  return (
    <Loader2 size={size} style={{ animation: "spin 0.8s linear infinite" }} />
  );
}

const GST_OPTIONS = [0, 5, 12, 18, 28];

const getInitials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ─── Add / Edit Medicine Modal ─── */
function MedicineModal({
  onClose,
  onSave,
  editData,
  showToast,
  saving,
  existingMedicines,
  categories = [],
}) {
  const EMPTY = {
    name: "",
    genericName: "",
    categoryId: "",
    batchNumber: "",
    expiryDate: "",
    mrp: "",
    purchaseCost: "",
    quantity: "",
    reorderLevel: "10",
    gst: "12",
    manufacturer: "",
    supplier: "",
    barcode: "",
    hsnCode: "",
    schedule: "OTC",
    notes: "",
    status: "active",
  };

  const [form, setForm] = useState(
    editData ? { ...EMPTY, ...editData } : EMPTY,
  );
  const [errors, setErrors] = useState({});
  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    const name = String(form.name || "").trim();
    const genericName = String(form.genericName || "").trim();

    if (!name) newErrors.name = "Medicine name is required";
    if (!genericName) newErrors.genericName = "Generic name is required";
    const catVal =
      typeof form.category === "string"
        ? form.category.trim()
        : form.category?.name || "";
    if (!form.categoryId && !catVal)
      newErrors.category = "Category is required";

    if (!editData) {
      const batchNumber = String(form.batchNumber || "").trim();
      if (!form.mrp || Number(form.mrp) <= 0)
        newErrors.mrp = "MRP must be greater than 0";
      if (!form.quantity || Number(form.quantity) < 0)
        newErrors.quantity = "Quantity must be 0 or more";
      if (!form.expiryDate) newErrors.expiryDate = "Expiry date is required";
      else if (new Date(form.expiryDate) <= new Date())
        newErrors.expiryDate = "Expiry date must be in the future";
      if (!batchNumber) newErrors.batchNumber = "Batch number is required";

      const duplicate = existingMedicines.find(
        (m) =>
          String(m.name || "").toLowerCase() === name.toLowerCase() &&
          String(m.batchNumber || "") === batchNumber &&
          (editData ? m.id !== editData.id : true),
      );
      if (duplicate)
        newErrors.name = "Medicine with this name and batch already exists";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }
    onSave({
      ...form,
      mrp: Number(form.mrp),
      purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : undefined,
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel) || 10,
      gst: Number(form.gst),
    });
  };

  return (
    <div className="inv-modal-overlay" onClick={onClose}>
      <motion.div
        className="inv-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inv-modal-header">
          <div className="header-title-group">
            <Pill size={20} style={{ color: "var(--primary)" }} />
            <h3>{editData ? "Edit Medicine" : "Add New Medicine"}</h3>
          </div>
          <button className="inv-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="inv-modal-scroll">
          <div className="inv-form-grid">
            {/* Medicine Name */}
            <div className="form-group full">
              <label>Medicine Name *</label>
              <input
                placeholder="e.g. Amoxicillin 500mg Capsules"
                value={form.name || ""}
                onChange={(e) => set("name", e.target.value)}
                className={errors.name ? "input-error" : ""}
              />
              {errors.name && (
                <span className="field-error">{errors.name}</span>
              )}
            </div>

            {/* Generic & Brand */}
            <div className="form-group">
              <label>Generic Name *</label>
              <input
                placeholder="e.g. Amoxicillin"
                value={form.genericName || ""}
                onChange={(e) => set("genericName", e.target.value)}
                className={errors.genericName ? "input-error" : ""}
              />
              {errors.genericName && (
                <span className="field-error">{errors.genericName}</span>
              )}
            </div>
            <div className="form-group">
              <label>Manufacturer</label>
              <input
                placeholder="e.g. Cipla Ltd"
                value={form.manufacturer || ""}
                onChange={(e) => set("manufacturer", e.target.value)}
              />
            </div>

            {/* Category & Schedule */}
            <div className="form-group">
              <label>Category *</label>
              {categories.length > 0 ? (
                <select
                  value={form.categoryId || ""}
                  onChange={(e) => set("categoryId", e.target.value)}
                  className={errors.category ? "input-error" : ""}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  placeholder="Type category name (e.g. Tablets)"
                  value={form.category || ""}
                  onChange={(e) => set("category", e.target.value)}
                  className={errors.category ? "input-error" : ""}
                />
              )}
              {errors.category && (
                <span className="field-error">{errors.category}</span>
              )}
            </div>
            <div className="form-group">
              <label>Schedule</label>
              <select
                value={form.schedule || ""}
                onChange={(e) => set("schedule", e.target.value)}
              >
                <option value="OTC">OTC</option>
                <option value="H">Schedule H</option>
                <option value="H1">Schedule H1</option>
                <option value="X">Schedule X</option>
              </select>
            </div>

            {/* Batch & Expiry */}
            {!editData && (
              <>
                <div className="form-group">
                  <label>Batch Number *</label>
                  <input
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
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    value={form.expiryDate || ""}
                    onChange={(e) => set("expiryDate", e.target.value)}
                    className={errors.expiryDate ? "input-error" : ""}
                  />
                  {errors.expiryDate && (
                    <span className="field-error">{errors.expiryDate}</span>
                  )}
                </div>

                {/* Pricing */}
                <div className="form-group">
                  <label>MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.mrp ?? ""}
                    onChange={(e) => set("mrp", e.target.value)}
                    className={errors.mrp ? "input-error" : ""}
                  />
                  {errors.mrp && <span className="field-error">{errors.mrp}</span>}
                </div>
                <div className="form-group">
                  <label>Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.purchaseCost ?? ""}
                    onChange={(e) => set("purchaseCost", e.target.value)}
                  />
                </div>

                {/* Quantity & Reorder */}
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
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
              </>
            )}
            <div className="form-group">
              <label>Reorder Level</label>
              <input
                type="number"
                placeholder="10"
                value={form.reorderLevel ?? ""}
                onChange={(e) => set("reorderLevel", e.target.value)}
              />
            </div>

            {/* GST & HSN */}
            <div className="form-group">
              <label>GST %</label>
              <select
                value={form.gst ?? ""}
                onChange={(e) => set("gst", e.target.value)}
              >
                {GST_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}%
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>HSN Code</label>
              <input
                placeholder="e.g. 3004"
                value={form.hsnCode || ""}
                onChange={(e) => set("hsnCode", e.target.value)}
              />
            </div>

            {/* Barcode & SKU */}
            <div className="form-group full">
              <label>Barcode / SKU</label>
              <input
                placeholder="Scan or enter barcode"
                value={form.barcode || ""}
                onChange={(e) => set("barcode", e.target.value)}
              />
            </div>

            {/* Supplier */}
            <div className="form-group full">
              <label>Supplier</label>
              <input
                placeholder="e.g. Cipla Distributors"
                value={form.supplier || ""}
                onChange={(e) => set("supplier", e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="form-group full">
              <label>Notes</label>
              <textarea
                placeholder="Storage instructions, side effects, etc."
                value={form.notes || ""}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>
        <div className="inv-modal-footer">
          <button className="inv-modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="inv-modal-btn confirm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner size={16} /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />{" "}
                {editData ? "Update Medicine" : "Add Medicine"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
/* ─── View Medicine Modal ─── */
function MedicineViewModal({ medicine, onClose, onEditBatch, onAddBatch }) {
  if (!medicine) return null;
  const isExpiringSoon =
    medicine.expiryDate &&
    new Date(medicine.expiryDate) <
      new Date(new Date().setDate(new Date().getDate() + 30));
  const isExpired =
    medicine.expiryDate && new Date(medicine.expiryDate) <= new Date();
  const isLowStock = medicine.stock <= (medicine.reorderLevel || 10);

  return (
    <div className="inv-modal-overlay" onClick={onClose}>
      <motion.div
        className="inv-modal-content inv-view-modal"
        style={{ width: "800px" }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inv-view-header">
          <div className="inv-view-avatar">{getInitials(medicine.name)}</div>
          <div className="inv-view-info">
            <h3>{medicine.name}</h3>
            <span className="inv-view-generic">
              {medicine.genericName}{" "}
              {medicine.brandName && `(${medicine.brandName})`}
            </span>
          </div>
          <button className="inv-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="inv-view-badges">
          {isExpired && <span className="inv-badge danger">EXPIRED</span>}
          {isExpiringSoon && !isExpired && (
            <span className="inv-badge warning">EXPIRING SOON</span>
          )}
          {isLowStock && <span className="inv-badge warning">LOW STOCK</span>}
          {!isExpired && !isLowStock && (
            <span className="inv-badge success">IN STOCK</span>
          )}
          <span className="inv-badge info">
            {medicine.scheduleType || medicine.schedule}
          </span>
        </div>

        <div className="inv-view-grid">
          <div className="inv-detail-item">
            <label>Category</label>
            <span>{medicine.category?.name || medicine.category || "—"}</span>
          </div>
          <div className="inv-detail-item">
            <label>GST</label>
            <span>{medicine.gstPercentage ?? 12}%</span>
          </div>
          <div className="inv-detail-item">
            <label>HSN Code</label>
            <span className="mono">{medicine.hsnCode || "—"}</span>
          </div>
          <div className="inv-detail-item">
            <label>Barcode</label>
            <span className="mono">{medicine.barcode || "—"}</span>
          </div>
          <div className="inv-detail-item">
            <label>Manufacturer</label>
            <span>
              {medicine.manufacturer?.name || medicine.manufacturer || "—"}
            </span>
          </div>
          <div className="inv-detail-item">
            <label>Supplier</label>
            <span>{medicine.supplier || "—"}</span>
          </div>
          <div className="inv-detail-item">
            <label>Reorder Level</label>
            <span>{medicine.reorderLevel || 10} units</span>
          </div>
          <div className="inv-detail-item">
            <label>Total Stock</label>
            <span
              style={{
                color: isLowStock ? "var(--warning)" : "var(--success)",
                fontWeight: 800,
              }}
            >
              {medicine.stock ?? 0} units
            </span>
          </div>
        </div>

        {/* Batches Section */}
        <div style={{ padding: "0 32px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ margin: 0, fontFamily: "Outfit, sans-serif", fontSize: "12px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Batches
            </h4>
            <button
              className="inv-modal-btn confirm"
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px" }}
              onClick={() => onAddBatch(medicine)}
            >
              <Plus size={14} /> Add Batch
            </button>
          </div>
          <div className="inv-table-wrapper" style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--overlay-06)", borderRadius: "12px" }}>
            <table className="inv-table" style={{ fontSize: "13px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 16px" }}>Batch</th>
                  <th style={{ padding: "10px 16px" }}>Expiry</th>
                  <th style={{ padding: "10px 16px" }}>Quantity</th>
                  <th style={{ padding: "10px 16px" }}>MRP</th>
                  <th style={{ padding: "10px 16px" }}>Status</th>
                  <th style={{ padding: "10px 16px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {medicine.inventoryBatches && medicine.inventoryBatches.length > 0 ? (
                  medicine.inventoryBatches.map((batch) => (
                    <tr key={batch.id}>
                      <td style={{ padding: "10px 16px" }} className="mono">{batch.batchNumber}</td>
                      <td style={{ padding: "10px 16px" }}>
                        {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        }) : "—"}
                      </td>
                      <td style={{ padding: "10px 16px", fontWeight: 800 }}>{batch.quantity ?? 0}</td>
                      <td style={{ padding: "10px 16px" }}>₹{Number(batch.mrp || 0).toFixed(2)}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span className={`inv-status-badge ${batch.quantity === 0 ? "out-of-stock" : batch.status === "ACTIVE" ? "in-stock" : "low-stock"}`} style={{ padding: "4px 8px" }}>
                          {batch.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <button
                          className="inv-row-btn"
                          style={{ width: "28px", height: "28px", borderRadius: "8px" }}
                          title="Edit Batch"
                          onClick={() => onEditBatch(batch, medicine)}
                        >
                          <Pencil size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                      No batches found. Add a batch to stock this medicine.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {medicine.description && (
          <div className="inv-view-notes">
            <label>Notes</label>
            <p>{medicine.description}</p>
          </div>
        )}

        <div className="inv-view-footer">
          <button className="inv-modal-btn cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Add / Edit Batch Modal ─── */
function BatchModal({
  onClose,
  onSave,
  batchData, // Present if editing
  medicineData, // The parent medicine object
  showToast,
  saving,
}) {
  const EMPTY = {
    batchNumber: "",
    expiryDate: "",
    mrp: "",
    purchasePrice: "",
    quantity: "",
    rackLocation: "",
  };

  const [form, setForm] = useState(
    batchData
      ? {
          batchNumber: batchData.batchNumber || "",
          expiryDate: batchData.expiryDate ? batchData.expiryDate.split("T")[0] : "",
          mrp: batchData.mrp ? String(batchData.mrp) : "",
          purchasePrice: batchData.purchasePrice ? String(batchData.purchasePrice) : "",
          quantity: batchData.quantity ? String(batchData.quantity) : "",
          rackLocation: batchData.rackLocation || "",
        }
      : EMPTY
  );
  
  const [errors, setErrors] = useState({});

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
      
    if (!form.mrp || Number(form.mrp) <= 0)
      newErrors.mrp = "MRP must be greater than 0";

    if (!batchData) {
      if (!form.quantity || Number(form.quantity) <= 0)
        newErrors.quantity = "Quantity must be greater than 0";
      if (!form.purchasePrice || Number(form.purchasePrice) <= 0)
        newErrors.purchasePrice = "Purchase price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }
    onSave({
      batchNumber: form.batchNumber.trim(),
      expiryDate: form.expiryDate,
      mrp: Number(form.mrp),
      sellingPrice: Number(form.mrp),
      rackLocation: form.rackLocation.trim(),
      ...(!batchData && {
        quantity: Number(form.quantity),
        purchasePrice: Number(form.purchasePrice),
        medicineId: medicineData.id,
      }),
    });
  };

  return (
    <div className="inv-modal-overlay" onClick={onClose}>
      <motion.div
        className="inv-modal-content"
        style={{ width: "500px" }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inv-modal-header">
          <div className="header-title-group">
            <Package size={20} style={{ color: "var(--primary)" }} />
            <h3>{batchData ? `Edit Batch: ${batchData.batchNumber}` : `Add Batch`}</h3>
          </div>
          <button className="inv-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="inv-modal-scroll">
          <div className="inv-form-grid" style={{ gridTemplateColumns: "1fr" }}>
            {/* Batch Number */}
            <div className="form-group">
              <label>Batch Number *</label>
              <input
                placeholder="e.g. B-20241"
                value={form.batchNumber || ""}
                onChange={(e) => set("batchNumber", e.target.value)}
                className={errors.batchNumber ? "input-error" : ""}
              />
              {errors.batchNumber && (
                <span className="field-error">{errors.batchNumber}</span>
              )}
            </div>

            {/* Expiry Date */}
            <div className="form-group">
              <label>Expiry Date *</label>
              <input
                type="date"
                value={form.expiryDate || ""}
                onChange={(e) => set("expiryDate", e.target.value)}
                className={errors.expiryDate ? "input-error" : ""}
              />
              {errors.expiryDate && (
                <span className="field-error">{errors.expiryDate}</span>
              )}
            </div>

            {/* MRP */}
            <div className="form-group">
              <label>MRP (₹) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.mrp ?? ""}
                onChange={(e) => set("mrp", e.target.value)}
                className={errors.mrp ? "input-error" : ""}
              />
              {errors.mrp && <span className="field-error">{errors.mrp}</span>}
            </div>

            {/* Purchase Price (New Batch Only) */}
            <div className="form-group">
              <label>Purchase Price (₹) {!batchData && " *"}</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.purchasePrice ?? ""}
                onChange={(e) => set("purchasePrice", e.target.value)}
                disabled={!!batchData}
                className={errors.purchasePrice ? "input-error" : ""}
              />
              {errors.purchasePrice && (
                <span className="field-error">{errors.purchasePrice}</span>
              )}
              {batchData && (
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Purchase price updates are blocked on existing batches.
                </span>
              )}
            </div>

            {/* Quantity (New Batch Only) */}
            <div className="form-group">
              <label>Initial Quantity {!batchData && " *"}</label>
              <input
                type="number"
                placeholder="0"
                value={form.quantity ?? ""}
                onChange={(e) => set("quantity", e.target.value)}
                disabled={!!batchData}
                className={errors.quantity ? "input-error" : ""}
              />
              {errors.quantity && (
                <span className="field-error">{errors.quantity}</span>
              )}
              {batchData && (
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Quantity updates are blocked on existing batches. Use stock adjustment.
                </span>
              )}
            </div>

            {/* Rack Location */}
            <div className="form-group">
              <label>Rack Location</label>
              <input
                placeholder="e.g. A-12"
                value={form.rackLocation || ""}
                onChange={(e) => set("rackLocation", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="inv-modal-footer">
          <button className="inv-modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="inv-modal-btn confirm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner size={16} /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />{" "}
                {batchData ? "Update Batch" : "Add Batch"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function InventoryCRUD({
  showToast,
  title = "Inventory Management",
}) {
  const { user, tenant } = useAuth();
  const branchId =
    user?.branchId || user?.branch?.id || tenant?.branchId || null;
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editBatchTarget, setEditBatchTarget] = useState(null);
  const [activeMedicineForBatch, setActiveMedicineForBatch] = useState(null);
  const [savingBatch, setSavingBatch] = useState(false);

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMedicines({ page: 1, limit: 500 });
      const rawMedicines = Array.isArray(res.data?.data) ? res.data.data : [];
      setMedicines(rawMedicines.map(normalizeMedicine));
    } catch {
      showToast("Failed to load inventory", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleSaveBatch = async (payload) => {
    setSavingBatch(true);
    try {
      if (editBatchTarget) {
        await updateBatch(editBatchTarget.id, payload);
        showToast("Batch updated successfully", "success");
      } else {
        await addBatch(payload);
        showToast("Batch created successfully", "success");
      }
      
      const res = await getMedicines({ page: 1, limit: 500 });
      const rawMedicines = Array.isArray(res.data?.data) ? res.data.data : [];
      const mapped = rawMedicines.map(normalizeMedicine);
      setMedicines(mapped);
      
      if (viewTarget) {
        const updatedViewTarget = mapped.find((m) => m.id === viewTarget.id);
        if (updatedViewTarget) {
          setViewTarget(updatedViewTarget);
        }
      }
      
      setBatchModalOpen(false);
      setEditBatchTarget(null);
      setActiveMedicineForBatch(null);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save batch";
      showToast(errorMessage, "error");
    } finally {
      setSavingBatch(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);

        const [medicinesRes, categoriesRes] = await Promise.all([
          getMedicines({ page: 1, limit: 500 }),
          getCategories(),
        ]);

        if (!mounted) return;

        const rawMedicines = Array.isArray(medicinesRes.data?.data)
          ? medicinesRes.data.data
          : [];

        setMedicines(rawMedicines.map(normalizeMedicine));

        setCategoriesList(
          Array.isArray(categoriesRes.data?.data)
            ? categoriesRes.data.data
            : [],
        );
      } catch (err) {
        console.error(err);
        showToast("Failed to load inventory", "error");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  const categories = useMemo(() => {
    const cats = new Set(
      medicines.map((m) => m.category?.name || m.category).filter(Boolean),
    );
    return ["All", ...cats];
  }, [medicines]);

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const matchesSearch =
        !search ||
        (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.genericName || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.batchNumber || "").toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" ||
        (m.category?.name || m.category) === categoryFilter;

      let matchesStatus = true;
      const expDate = m.expiryDate ? new Date(m.expiryDate) : null;

      if (statusFilter === "In Stock")
        matchesStatus = m.stock > (m.reorderLevel || 10);
      else if (statusFilter === "Low Stock")
        matchesStatus = m.stock > 0 && m.stock <= (m.reorderLevel || 10);
      else if (statusFilter === "Out of Stock") matchesStatus = m.stock === 0;
      else if (statusFilter === "Expiring Soon") {
        matchesStatus =
          expDate &&
          expDate > new Date() &&
          expDate < new Date(new Date().setDate(new Date().getDate() + 30));
      } else if (statusFilter === "Expired") {
        matchesStatus = expDate && expDate <= new Date();
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [medicines, search, categoryFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: medicines.length,
      inStock: medicines.filter((m) => m.stock > (m.reorderLevel || 10)).length,
      lowStock: medicines.filter(
        (m) => m.stock > 0 && m.stock <= (m.reorderLevel || 10),
      ).length,
      outOfStock: medicines.filter((m) => m.stock === 0).length,
      expired: medicines.filter(
        (m) =>
          m.stock > 0 && m.expiryDate && new Date(m.expiryDate) <= new Date(),
      ).length,
      totalValue: calculateTotalStockValue(medicines),
    }),
    [medicines],
  );

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const payload = {
        name: form.name?.trim() || "",
        gstPercentage: Number(form.gst) || 0,
        reorderPoint: Number(form.reorderLevel) || 10,
        reorderLevel: Number(form.reorderLevel) || 10,
        ...(form.genericName?.trim() && {
          genericName: form.genericName.trim(),
        }),
        ...(form.categoryId && { categoryId: form.categoryId }),
        ...(form.barcode?.trim() && { barcode: form.barcode.trim() }),
        ...(form.hsnCode?.trim() && { hsnCode: form.hsnCode.trim() }),
        ...(form.dosageForm?.trim() && { dosageForm: form.dosageForm.trim() }),
        ...(form.strength?.trim() && { strength: form.strength.trim() }),
        ...(form.schedule?.trim() && { scheduleType: form.schedule.trim() }),
        ...(form.notes?.trim() && { description: form.notes.trim() }),
        ...(branchId && { branchId: String(branchId) }),
        ...(form.manufacturer?.trim() && {
          manufacturer: form.manufacturer.trim(),
        }),
        ...(typeof form.category === "string" &&
          form.category.trim() && { category: form.category.trim() }),
      };

      if (editTarget) {
        payload.isActive = form.status === "active";
        UpdateMedicineSchema.parse(payload);
        await updateMedicine(editTarget.id, payload);
        showToast("Medicine updated successfully", "success");
      } else {
        const initialBatch = {
          batchNumber: String(form.batchNumber || "").trim(),
          quantity: Number(form.quantity),
          expiryDate: form.expiryDate,
          mrp: Number(form.mrp),
          purchasePrice: form.purchaseCost ? Number(form.purchaseCost) : 0,
        };

        const normalizedPayload = {
          ...payload,
          initialBatch,
        };

        CreateMedicineSchema.parse(normalizedPayload);
        await createMedicine(normalizedPayload);
        showToast("Medicine added successfully", "success");
      }
      await loadMedicines();
      setModalOpen(false);
      setEditTarget(null);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err?.message ||
        "Unknown validation error";

      console.error("[SAVE ERROR]", errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMedicine(deleteTarget.id);
      showToast("Medicine deleted successfully", "success");
      await loadMedicines();
      setDeleteTarget(null);
    } catch (err) {
      showToast(
        err.response?.data?.error || "Failed to delete medicine",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Generic",
      "Category",
      "Batch",
      "Expiry",
      "Quantity",
      "MRP",
      "GST",
      "Status",
    ];
    const rows = filtered.map((m) => {
      const currentQty = m.stock ?? 0;
      const reorderPt = m.reorderPoint ?? m.reorderLevel ?? 10;
      const batchNum =
        m.inventoryBatches?.[0]?.batchNumber || m.batchNumber || "—";
      const expDate =
        m.inventoryBatches?.[0]?.expiryDate || m.expiryDate || "—";
      const mrp = m.inventoryBatches?.[0]?.mrp || m.mrp || 0;
      const gst = m.gstPercentage ?? m.gst ?? 0;

      const isExpired = expDate !== "—" && new Date(expDate) <= new Date();
      const isLow = currentQty > 0 && currentQty <= reorderPt;
      const status = isExpired
        ? "Expired"
        : currentQty === 0
          ? "Out of Stock"
          : isLow
            ? "Low Stock"
            : "In Stock";
      return [
        m.name,
        m.genericName,
        m.category?.name || m.category,
        batchNum,
        expDate,
        currentQty,
        mrp,
        `${gst}%`,
        status,
      ];
    });
    const csv = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Inventory exported successfully", "success");
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  return (
    <div className="inv-container">
      {/* Header */}
      <div className="inv-header">
        <div className="inv-title-group">
          <h2>{title}</h2>
          <p>
            Complete pharmaceutical stock control with batch tracking, expiry
            alerts, and real-time quantities
          </p>
        </div>
        <div className="inv-header-actions">
          <button
            className="inv-action-btn secondary"
            onClick={handleExportCSV}
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            className="inv-action-btn primary"
            onClick={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
          >
            <Plus size={20} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="inv-stats-row">
        <div className="inv-stat-card" onMouseMove={handleMouseMove}>
          <div className="inv-stat-header">
            <span className="inv-stat-label">TOTAL SKU</span>
            <div className="inv-stat-icon bg-primary">
              <Package size={14} />
            </div>
          </div>
          <div className="inv-stat-value text-primary">
            {loading ? "..." : stats.total}
          </div>
        </div>
        <div className="inv-stat-card" onMouseMove={handleMouseMove}>
          <div className="inv-stat-header">
            <span className="inv-stat-label">IN STOCK</span>
            <div className="inv-stat-icon bg-success">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="inv-stat-value text-success">{stats.inStock}</div>
        </div>
        <div className="inv-stat-card" onMouseMove={handleMouseMove}>
          <div className="inv-stat-header">
            <span className="inv-stat-label">LOW STOCK</span>
            <div className="inv-stat-icon bg-warning">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="inv-stat-value text-warning">{stats.lowStock}</div>
        </div>
        <div className="inv-stat-card" onMouseMove={handleMouseMove}>
          <div className="inv-stat-header">
            <span className="inv-stat-label">OUT OF STOCK</span>
            <div className="inv-stat-icon bg-danger">
              <X size={14} />
            </div>
          </div>
          <div className="inv-stat-value text-danger">{stats.outOfStock}</div>
        </div>
        <div className="inv-stat-card" onMouseMove={handleMouseMove}>
          <div className="inv-stat-header">
            <span className="inv-stat-label">EXPIRED</span>
            <div className="inv-stat-icon bg-danger">
              <Calendar size={14} />
            </div>
          </div>
          <div className="inv-stat-value text-danger">{stats.expired}</div>
        </div>
        <div className="inv-stat-card" onMouseMove={handleMouseMove}>
          <div className="inv-stat-header">
            <span className="inv-stat-label">INVENTORY VALUE</span>
            <div className="inv-stat-icon bg-primary">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="inv-stat-value text-primary">
            ₹
            {stats.totalValue.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="inv-table-card">
        <div className="inv-table-header">
          <div className="inv-search-box">
            <Search size={18} className="search-icon" />
            <input
              placeholder="Search by name, generic, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="inv-filter-group">
            <select
              className="inv-select-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c === "All" ? "All Categories" : c}</option>
              ))}
            </select>
            <select
              className="inv-select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>In Stock</option>
              <option>Low Stock</option>
              <option>Out of Stock</option>
              <option>Expiring Soon</option>
              <option>Expired</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="inv-table-wrapper">
          <table className="inv-table">
            <thead>
              <tr>
                <th>MEDICINE</th>
                <th>CATEGORY</th>
                <th>BATCH</th>
                <th>EXPIRY</th>
                <th>STOCK</th>
                <th>MRP</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="inv-table-loading">
                    <Spinner size={20} /> Loading inventory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="inv-table-empty">
                    No medicines found. Add your first medicine →
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const isExpired =
                    m.stock > 0 &&
                    m.expiryDate &&
                    new Date(m.expiryDate) <= new Date();
                  const isExpiringSoon =
                    m.expiryDate &&
                    !isExpired &&
                    new Date(m.expiryDate) <
                      new Date(new Date().setDate(new Date().getDate() + 30));
                  const isLowStock =
                    m.stock > 0 && m.stock <= (m.reorderLevel || 10);
                  const isOutOfStock = m.stock === 0;
                  const statusClass = isExpired
                    ? "expired"
                    : isOutOfStock
                      ? "out-of-stock"
                      : isLowStock
                        ? "low-stock"
                        : "in-stock";
                  const statusText = isExpired
                    ? "EXPIRED"
                    : isOutOfStock
                      ? "OUT OF STOCK"
                      : isLowStock
                        ? "LOW STOCK"
                        : "IN STOCK";

                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="inv-identity">
                          <div className="inv-avatar">
                            {getInitials(m.name)}
                          </div>
                          <div className="inv-info">
                            <span className="inv-name">{m.name}</span>
                            <span className="inv-generic">
                              {m.genericName}{" "}
                              {m.brandName && `(${m.brandName})`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="inv-category-tag">
                          {m.category?.name || m.category || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="mono">{m.batchNumber || "—"}</span>
                      </td>
                      <td
                        style={{
                          color: isExpired
                            ? "var(--danger)"
                            : isExpiringSoon
                              ? "var(--warning)"
                              : "inherit",
                        }}
                      >
                        {m.expiryDate
                          ? new Date(m.expiryDate).toLocaleDateString("en-IN", {
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td
                        style={{
                          fontWeight: 800,
                          color: isOutOfStock
                            ? "var(--danger)"
                            : isLowStock
                              ? "var(--warning)"
                              : "var(--success)",
                        }}
                      >
                        {m.stock ?? 0}
                      </td>
                      <td>₹{(m.mrp || 0).toFixed(2)}</td>
                      <td>
                        <span className={`inv-status-badge ${statusClass}`}>
                          <div className="status-dot" />
                          {statusText}
                        </span>
                      </td>
                      <td>
                        <div className="inv-row-actions">
                          <button
                            className="inv-row-btn"
                            title="View Details"
                            onClick={() => setViewTarget(m)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="inv-row-btn"
                            title="Edit"
                            onClick={() => {
                              setEditTarget(m);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="inv-row-btn danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(m)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalOpen && (
          <MedicineModal
            onClose={() => {
              setModalOpen(false);
              setEditTarget(null);
            }}
            onSave={handleSave}
            editData={editTarget}
            showToast={showToast}
            saving={saving}
            existingMedicines={medicines}
            categories={categoriesList}
          />
        )}
        {viewTarget && (
          <MedicineViewModal
            medicine={viewTarget}
            onClose={() => setViewTarget(null)}
            onAddBatch={(medicine) => {
              setActiveMedicineForBatch(medicine);
              setEditBatchTarget(null);
              setBatchModalOpen(true);
            }}
            onEditBatch={(batch, medicine) => {
              setActiveMedicineForBatch(medicine);
              setEditBatchTarget(batch);
              setBatchModalOpen(true);
            }}
          />
        )}
        {batchModalOpen && (
          <BatchModal
            onClose={() => {
              setBatchModalOpen(false);
              setEditBatchTarget(null);
              setActiveMedicineForBatch(null);
            }}
            onSave={handleSaveBatch}
            batchData={editBatchTarget}
            medicineData={activeMedicineForBatch}
            showToast={showToast}
            saving={savingBatch}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Medicine"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone and will remove all associated batch records.`}
        confirmText="Delete Medicine"
        loading={deleting}
        icon={Trash2}
      />
    </div>
  );
}
