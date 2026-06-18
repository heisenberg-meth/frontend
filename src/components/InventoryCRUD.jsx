import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Package,
  PackageOpen,
  Plus,
  Search,
  Download,
  X,
  BadgeX,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Pill,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Calendar,
  ChevronDown,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getMedicineStatus, STATUS_OPTIONS } from "../utils/inventoryStatus";

function CustomDropdown({ value, onChange, options, placeholder = "Select" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      <button
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>
          {value === "All" || value === "All Status" ? placeholder : value}
        </span>
        <ChevronDown
          size={16}
          className={`dropdown-icon ${isOpen ? "open" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="custom-dropdown-menu"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="listbox"
          >
            {options.map((opt) => {
              const optValue = typeof opt === "object" ? opt.value : opt;
              const optLabel = typeof opt === "object" ? opt.label : opt;
              return (
                <div
                  key={optValue}
                  className={`custom-dropdown-item ${value === optValue ? "selected" : ""}`}
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={value === optValue}
                >
                  <span>{optLabel}</span>
                  {value === optValue && (
                    <Check size={14} className="check-icon" />
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  getInventorySummary,
} from "../services/inventory.service";
import { useAuth } from "../hooks/useAuth";
import ConfirmModal from "./ConfirmModal";
import InventoryAnalyticsModal from "./inventory/InventoryAnalyticsModal";
import { normalizeMedicine } from "../utils/normalizers";
import { safeNumber } from "../utils/number.js";

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
    sellingPrice: "",
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
      if (!form.mrp || safeNumber(form.mrp) <= 0)
        newErrors.mrp = "MRP must be greater than 0";
      if (!form.quantity || safeNumber(form.quantity) < 0)
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

      const purchasePrice = safeNumber(form.purchaseCost || 0);
      const mrp = safeNumber(form.mrp || 0);
      const sellingPrice =
        form.sellingPrice !== undefined && form.sellingPrice !== ""
          ? safeNumber(form.sellingPrice)
          : mrp;

      if (purchasePrice <= 0) {
        newErrors.purchaseCost = "Purchase cost must be greater than zero";
      }
      if (mrp <= purchasePrice) {
        newErrors.mrp = "MRP must be greater than purchase cost";
      }
      if (sellingPrice < purchasePrice) {
        newErrors.sellingPrice =
          "Selling price must be greater than or equal to purchase cost";
      }
      if (sellingPrice > mrp) {
        newErrors.sellingPrice = "Selling price cannot exceed MRP";
      }
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
      mrp: safeNumber(form.mrp),
      sellingPrice: safeNumber(form.sellingPrice),
      purchaseCost: form.purchaseCost
        ? safeNumber(form.purchaseCost)
        : undefined,
      quantity: safeNumber(form.quantity),
      reorderLevel: safeNumber(form.reorderLevel) || 10,
      gst: safeNumber(form.gst),
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
                required
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
                required
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
                required
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
                  required
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
                  <label>Expiry Date *</label>
                  <input
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

                {/* Pricing */}
                <div className="form-group">
                  <label>MRP (₹) *</label>
                  <input
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
                  <label>Selling Price (₹) *</label>
                  <input
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
                  <label>Purchase Cost (₹)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.purchaseCost ?? ""}
                    onChange={(e) => set("purchaseCost", e.target.value)}
                    className={errors.purchaseCost ? "input-error" : ""}
                  />
                  {errors.purchaseCost && (
                    <span className="field-error">{errors.purchaseCost}</span>
                  )}
                </div>

                {/* Quantity & Reorder */}
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
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
              </>
            )}
            <div className="form-group">
              <label>Reorder Level</label>
              <input
                required
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
                required
                placeholder="e.g. 3004"
                value={form.hsnCode || ""}
                onChange={(e) => set("hsnCode", e.target.value)}
              />
            </div>

            {/* Barcode & SKU */}
            <div className="form-group full">
              <label>Barcode / SKU</label>
              <input
                required
                placeholder="Scan or enter barcode"
                value={form.barcode || ""}
                onChange={(e) => set("barcode", e.target.value)}
              />
            </div>

            {/* Supplier */}
            <div className="form-group full">
              <label>Supplier</label>
              <input
                required
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

  // Use centralized status calculation
  const medicineStatus = getMedicineStatus(medicine);
  const isExpired = medicineStatus === "Expired";
  const isExpiringSoon = medicineStatus === "Expiring Soon";
  const isLowStock = medicineStatus === "Low Stock";
  const isOutOfStock = medicineStatus === "Out of Stock";

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
          <button
            className="inv-modal-close-btn"
            onClick={onClose}
            style={{ position: "center", top: "24px", right: "24px" }}
          >
            <BadgeX size={30} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <div className="inv-view-badges">
            {isExpired && <span className="inv-badge danger">EXPIRED</span>}
            {isExpiringSoon && (
              <span className="inv-badge warning">EXPIRING SOON</span>
            )}
            {isOutOfStock && (
              <span className="inv-badge danger">OUT OF STOCK</span>
            )}
            {isLowStock && <span className="inv-badge warning">LOW STOCK</span>}
            {!isExpired && !isExpiringSoon && !isOutOfStock && !isLowStock && (
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontFamily: "Outfit, sans-serif",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Active Batches
              </h4>
              <button
                className="inv-modal-btn confirm"
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                onClick={() => onAddBatch(medicine)}
              >
                <Plus size={14} /> Add Batch
              </button>
            </div>
            <div
              className="inv-table-wrapper"
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid var(--overlay-06)",
                borderRadius: "12px",
              }}
            >
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
                  {medicine.inventoryBatches &&
                  medicine.inventoryBatches.length > 0 ? (
                    medicine.inventoryBatches.map((batch) => (
                      <tr key={batch.id}>
                        <td style={{ padding: "10px 16px" }} className="mono">
                          {batch.batchNumber}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          {batch.expiryDate
                            ? new Date(batch.expiryDate).toLocaleDateString(
                                "en-IN",
                                {
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </td>
                        <td style={{ padding: "10px 16px", fontWeight: 800 }}>
                          {batch.quantity ?? 0}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          ₹{safeNumber(batch.mrp || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span
                            className={`inv-status-badge ${batch.quantity === 0 ? "out-of-stock" : batch.status === "ACTIVE" ? "in-stock" : "low-stock"}`}
                            style={{ padding: "4px 8px" }}
                          >
                            {batch.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <button
                            className="inv-row-btn"
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "8px",
                            }}
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
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "var(--text-muted)",
                        }}
                      >
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
        </div>

        <div className="inv-view-footer">
          <button className="inv-modal-btn cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </motion.div>
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

function BatchModal({
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
        }
      : EMPTY_BATCH_FORM,
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
    <div className="inv-modal-overlay" onClick={onClose}>
      <motion.div
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
                            key={b.id}
                            style={{
                              background:
                                selectedBatch?.id === b.id
                                  ? "var(--hover-bg)"
                                  : "transparent",
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
                                className="action-btn"
                                style={{
                                  padding: "4px 12px",
                                  fontSize: "0.8rem",
                                  borderRadius: "4px",
                                  background:
                                    selectedBatch?.id === b.id
                                      ? "var(--primary)"
                                      : "transparent",
                                  color:
                                    selectedBatch?.id === b.id
                                      ? "white"
                                      : "inherit",
                                  border:
                                    selectedBatch?.id === b.id
                                      ? "1px solid var(--primary)"
                                      : "1px solid var(--border-color)",
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
                                {selectedBatch?.id === b.id
                                  ? "Editing"
                                  : "Edit"}
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
                  <label>Batch Number *</label>
                  <input
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
                  <label>Expiry Date *</label>
                  <input
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
                  <label>MRP (₹) *</label>
                  <input
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
                  <label>Selling Price (₹) *</label>
                  <input
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
                  <label>Purchase Price (₹) *</label>
                  <input
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
                  <label>Stock Quantity *</label>
                  <input
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
                  <label>Rack Location</label>
                  <input
                    required
                    placeholder="e.g. A-12"
                    value={form.rackLocation || ""}
                    onChange={(e) => set("rackLocation", e.target.value)}
                  />
                </div>
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All Status");
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
  const [isAddingNewBatch, setIsAddingNewBatch] = useState(false);
  const [activeMedicineForBatch, setActiveMedicineForBatch] = useState(null);
  const [savingBatch, setSavingBatch] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const medicineAbortRef = useRef(null);
  const limit = 25;

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const [summaryStats, setSummaryStats] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    expired: 0,
    inventoryValue: 0,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await getInventorySummary();
      if (res.data?.success && res.data?.data) {
        setSummaryStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load inventory summary", err);
    }
  }, []);

  const loadMedicines = useCallback(
    async (options = {}) => {
      const { skipSummary = true } = options;

      if (medicineAbortRef.current) {
        medicineAbortRef.current.abort();
      }
      const controller = new AbortController();
      medicineAbortRef.current = controller;

      if (medicines.length === 0) setLoading(true);
      try {
        let categoryId = undefined;
        if (categoryFilter !== "All") {
          const catObj = categoriesList.find(
            (c) => (c.name || c.categoryName || c) === categoryFilter,
          );
          if (catObj) {
            categoryId = catObj.id;
          }
        }

        let backendStatus = undefined;
        if (statusFilter === "In Stock") backendStatus = "IN_STOCK";
        else if (statusFilter === "Low Stock") backendStatus = "LOW_STOCK";
        else if (statusFilter === "Out of Stock")
          backendStatus = "OUT_OF_STOCK";
        else if (statusFilter === "Expiring Soon")
          backendStatus = "EXPIRING_SOON";
        else if (statusFilter === "Expired") backendStatus = "EXPIRED";

        const medicinesRes = await getMedicines({
          page: currentPage,
          limit,
          search: debouncedSearch,
          categoryId,
          status: backendStatus,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const items = Array.isArray(medicinesRes.data?.data?.items)
          ? medicinesRes.data.data.items
          : Array.isArray(medicinesRes.data?.data)
            ? medicinesRes.data.data
            : [];

        const total = medicinesRes.data?.data?.total ?? items.length;
        const pages = medicinesRes.data?.data?.totalPages ?? 1;

        const mapped = items.map(normalizeMedicine);
        setMedicines(mapped);
        setTotalItems(total);
        setTotalPages(pages);

        if (viewTarget) {
          const updatedViewTarget = mapped.find((m) => m.id === viewTarget.id);
          if (updatedViewTarget) {
            setViewTarget(updatedViewTarget);
          }
        }

        if (!skipSummary) {
          await loadSummary();
        }
      } catch (err) {
        if (err?.name === "CanceledError" || controller.signal.aborted) return;
        showToast(
          "Failed to load inventory",
          err?.response?.data?.error || "error",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [
      medicines.length,
      categoryFilter,
      statusFilter,
      currentPage,
      debouncedSearch,
      viewTarget,
      categoriesList,
      loadSummary,
      showToast,
    ],
  );

  const handleEditStock = (medicine) => {
    setActiveMedicineForBatch(medicine);
    setEditBatchTarget(null);
    setIsAddingNewBatch(false);
    setBatchModalOpen(true);
  };

  const handleSaveBatch = async (payload) => {
    setSavingBatch(true);
    try {
      if (payload.id) {
        await updateBatch(payload.id, payload);
        showToast("Batch updated successfully", "success");
      } else if (editBatchTarget) {
        await updateBatch(editBatchTarget.id, payload);
        showToast("Batch updated successfully", "success");
      } else {
        await addBatch(payload);
        showToast("Batch created successfully", "success");
      }

      await loadMedicines({ skipSummary: false });
      setBatchModalOpen(false);
      setEditBatchTarget(null);
      setActiveMedicineForBatch(null);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to save batch";
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
        const [categoriesRes] = await Promise.all([
          getCategories(),
          loadSummary(),
        ]);
        if (!mounted) return;

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
  }, [showToast, loadSummary]);

  useEffect(() => {
    const run = async () => {
      await loadMedicines();
    };
    run();
  }, [loadMedicines]);

  const categories = useMemo(() => {
    const cats = categoriesList.map((c) => c.name || c).filter(Boolean);
    return ["All", ...cats];
  }, [categoriesList]);

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const term = search.toLowerCase().trim();

      const searchMatch =
        !term ||
        (m.name || "").toLowerCase().includes(term) ||
        (m.genericName || "").toLowerCase().includes(term) ||
        (m.batchNumber || "").toLowerCase().includes(term);

      const categoryMatch =
        categoryFilter === "All" ||
        (m.category?.name || m.category) === categoryFilter;

      // Use centralized status calculation
      const medicineStatus = getMedicineStatus(m);

      const statusMatch =
        statusFilter === "All Status" || medicineStatus === statusFilter;

      return searchMatch && categoryMatch && statusMatch;
    });
  }, [medicines, search, categoryFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: summaryStats.totalProducts,
      inStock: summaryStats.inStock,
      lowStock: summaryStats.lowStock,
      outOfStock: summaryStats.outOfStock,
      expired: summaryStats.expired,
      totalValue: summaryStats.inventoryValue,
    }),
    [summaryStats],
  );

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const payload = {
        name: form.name?.trim() || "",
        gstPercentage: safeNumber(form.gst) || 0,
        reorderPoint: safeNumber(form.reorderLevel) || 10,
        reorderLevel: safeNumber(form.reorderLevel) || 10,
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
          quantity: safeNumber(form.quantity),
          expiryDate: form.expiryDate,
          mrp: safeNumber(form.mrp),
          sellingPrice:
            form.sellingPrice !== undefined
              ? safeNumber(form.sellingPrice)
              : safeNumber(form.mrp),
          purchasePrice: form.purchaseCost ? safeNumber(form.purchaseCost) : 0,
        };

        const normalizedPayload = {
          ...payload,
          initialBatch,
        };

        CreateMedicineSchema.parse(normalizedPayload);
        await createMedicine(normalizedPayload);
        showToast("Medicine added successfully", "success");
      }
      await loadMedicines({ skipSummary: false });
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
      await loadMedicines({ skipSummary: false });
      setDeleteTarget(null);
    } catch (err) {
      const errorMessage =
        typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : err.response?.data?.error?.message ||
            err.response?.data?.message ||
            err.message ||
            "Failed to delete medicine";
      showToast(errorMessage, "error");
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
        <div
          className="inv-stat-card cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-1"
          onMouseMove={handleMouseMove}
          onClick={() => setShowAnalyticsModal(true)}
          title="Click to view detailed inventory analytics"
        >
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
              required
              placeholder="Search by name, generic, batch..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="inv-filter-group">
            <CustomDropdown
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val);
                setCurrentPage(1);
              }}
              options={categories.map((c) => ({
                value: c,
                label: c === "All" ? "All Categories" : c,
              }))}
              placeholder="All Categories"
            />
            <CustomDropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={STATUS_OPTIONS}
              placeholder="All Status"
            />
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
                  // Use centralized status calculation
                  const medicineStatus = getMedicineStatus(m);
                  const isExpired = medicineStatus === "Expired";
                  const isExpiringSoon = medicineStatus === "Expiring Soon";
                  const isLowStock = medicineStatus === "Low Stock";
                  const isOutOfStock = medicineStatus === "Out of Stock";

                  const statusClass = isExpired
                    ? "expired"
                    : isOutOfStock
                      ? "out-of-stock"
                      : isLowStock
                        ? "low-stock"
                        : isExpiringSoon
                          ? "expiring-soon"
                          : "in-stock";

                  const statusText = medicineStatus.toUpperCase();

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
                            className="inv-row-btn edit-stock"
                            title="Edit Stock"
                            onClick={() => handleEditStock(m)}
                          >
                            <PackageOpen size={14} />
                            <span>Edit Stock</span>
                          </button>
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

        {totalPages > 1 && (
          <div className="inv-pagination">
            <div className="inv-pagination-info">
              Showing {(currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, totalItems)} of {totalItems} items
            </div>
            <div className="inv-pagination-controls">
              <button
                className="inv-page-btn prev-next"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              {getVisiblePages().map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="inv-ellipsis"
                    style={{
                      color: "var(--text-muted)",
                      paddingLeft: "8px",
                      paddingRight: "8px",
                    }}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${page}-${index}`}
                    className={`inv-page-btn ${currentPage === page ? "active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                className="inv-page-btn prev-next"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
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
              setIsAddingNewBatch(true);
              setBatchModalOpen(true);
            }}
            onEditBatch={(batch, medicine) => {
              setActiveMedicineForBatch(medicine);
              setEditBatchTarget(batch);
              setIsAddingNewBatch(false);
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
              setIsAddingNewBatch(false);
            }}
            onSave={handleSaveBatch}
            batchData={editBatchTarget}
            medicineData={activeMedicineForBatch}
            isAddMode={isAddingNewBatch}
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

      <InventoryAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />
    </div>
  );
}
