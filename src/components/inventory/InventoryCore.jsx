import { useState, useEffect, useRef } from "react";
import { Plus, X, BadgeX, Pencil, CheckCircle2, Loader2, Pill, ChevronDown, Check } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { getSuppliers } from "../../services/suppliers.service.js";
import { safeNumber } from "../../utils/number.js";
import { getMedicineStatus } from "../../utils/inventoryStatus.js";
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
  supplierId: "",
  barcode: "",
  hsnCode: "",
  schedule: "OTC",
  notes: "",
  status: "active"
};
export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return <div className="custom-dropdown-container" ref={dropdownRef}>
      <button className="custom-dropdown-trigger" onClick={() => setIsOpen(!isOpen)} aria-haspopup="listbox" aria-expanded={isOpen}>
        <span>
          {value === "All" || value === "All Status" ? placeholder : value}
        </span>
        <ChevronDown size={16} className={`dropdown-icon ${isOpen ? "open" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && <m.div className="custom-dropdown-menu" initial={{
        opacity: 0,
        y: -10,
        scale: 0.95
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: -10,
        scale: 0.95
      }} transition={{
        duration: 0.15
      }} role="listbox">
            {options.map(opt => {
          const optValue = typeof opt === "object" ? opt.value : opt;
          const optLabel = typeof opt === "object" ? opt.label : opt;
          return <div key={optValue} className={`custom-dropdown-item ${value === optValue ? "selected" : ""}`} onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }} onClick={() => {
            onChange(optValue);
            setIsOpen(false);
          }} role="option" aria-selected={value === optValue} tabIndex={0}>
                  <span>{optLabel}</span>
                  {value === optValue && <Check size={14} className="check-icon" />}
                </div>;
        })}
          </m.div>}
      </AnimatePresence>
    </div>;
}
export function Spinner({
  size = 14
}) {
  return <Loader2 size={size} style={{
    animation: "spin 0.8s linear infinite"
  }} />;
}
const GST_OPTIONS = [0, 5, 12, 18, 28];
const getInitials = name => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

/* ─── Add / Edit Medicine Modal ─── */
export function MedicineModal({
  onClose,
  onSave,
  editData,
  showToast,
  saving,
  existingMedicines,
  categories = []
}) {
  const [form, setForm] = useState(editData ? {
    ...EMPTY,
    ...editData,
    supplierId: editData.supplierId || editData.supplier?.id || ""
  } : EMPTY);
  const [errors, setErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  useEffect(() => {
    let ignore = false;
    const loadSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const res = await getSuppliers({
          limit: 500
        });
        if (!ignore) {
          setSuppliers(res.data?.data || res.data || []);
        }
      } catch (err) {
        if (!ignore) showToast("Failed to load suppliers", err);
      } finally {
        if (!ignore) setLoadingSuppliers(false);
      }
    };
    loadSuppliers();
    return () => {
      ignore = true;
    };
  }, [showToast]);
  const set = (key, val) => {
    setForm(f => ({
      ...f,
      [key]: val
    }));
    if (errors[key]) setErrors(e => ({
      ...e,
      [key]: null
    }));
  };
  const validate = () => {
    const newErrors = {};
    const name = String(form.name || "").trim();
    const genericName = String(form.genericName || "").trim();
    if (!name) newErrors.name = "Medicine name is required";
    if (!genericName) newErrors.genericName = "Generic name is required";
    const catVal = typeof form.category === "string" ? form.category.trim() : form.category?.name || "";
    if (!form.categoryId && !catVal) newErrors.category = "Category is required";
    if (!editData) {
      const batchNumber = String(form.batchNumber || "").trim();
      if (!form.mrp || safeNumber(form.mrp) <= 0) newErrors.mrp = "MRP must be greater than 0";
      if (!form.quantity || safeNumber(form.quantity) < 0) newErrors.quantity = "Quantity must be 0 or more";
      if (!form.expiryDate) newErrors.expiryDate = "Expiry date is required";else if (new Date(form.expiryDate) <= new Date()) newErrors.expiryDate = "Expiry date must be in the future";
      if (!batchNumber) newErrors.batchNumber = "Batch number is required";
      const duplicate = existingMedicines.find(m => String(m.name || "").toLowerCase() === name.toLowerCase() && String(m.batchNumber || "") === batchNumber && (editData ? m.id !== editData.id : true));
      if (duplicate) newErrors.name = "Medicine with this name and batch already exists";
      const purchasePrice = safeNumber(form.purchaseCost || 0);
      const mrp = safeNumber(form.mrp || 0);
      const sellingPrice = form.sellingPrice !== undefined && form.sellingPrice !== "" ? safeNumber(form.sellingPrice) : mrp;
      if (purchasePrice <= 0) {
        newErrors.purchaseCost = "Purchase cost must be greater than zero";
      }
      if (mrp <= purchasePrice) {
        newErrors.mrp = "MRP must be greater than purchase cost";
      }
      if (sellingPrice < purchasePrice) {
        newErrors.sellingPrice = "Selling price must be greater than or equal to purchase cost";
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
      purchaseCost: form.purchaseCost ? safeNumber(form.purchaseCost) : undefined,
      quantity: safeNumber(form.quantity),
      reorderLevel: safeNumber(form.reorderLevel) || 10,
      gst: safeNumber(form.gst)
    });
  };
  return <div role="button" tabIndex={0} className="inv-modal-overlay" onKeyDown={e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  }} onClick={onClose}>
      <MedicineModalSection1 set={set} />
    </div>;
}
/* ─── View Medicine Modal ─── */
export function MedicineViewModal({
  medicine,
  onClose,
  onEditBatch,
  onAddBatch
}) {
  if (!medicine) return null;

  // Use centralized status calculation
  const medicineStatus = getMedicineStatus(medicine);
  const isExpired = medicineStatus === "Expired";
  const isExpiringSoon = medicineStatus === "Expiring Soon";
  const isLowStock = medicineStatus === "Low Stock";
  const isOutOfStock = medicineStatus === "Out of Stock";
  return <div role="button" tabIndex={0} className="inv-modal-overlay" onKeyDown={e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  }} onClick={onClose}>
      <MedicineViewModalSection2 onAddBatch={onAddBatch} medicine={medicine} onEditBatch={onEditBatch} batch={batch} />
    </div>;
}
function MedicineModalSection1({
  set
}) {
  return <m.div className="inv-modal-content" initial={{
    opacity: 0,
    scale: 0.95,
    y: 20
  }} animate={{
    opacity: 1,
    scale: 1,
    y: 0
  }} exit={{
    opacity: 0,
    scale: 0.95,
    y: 20
  }} onClick={e => e.stopPropagation()} role="presentation">
        <div className="inv-modal-header">
          <div className="header-title-group">
            <Pill size={20} style={{
          color: "var(--primary)"
        }} />
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
              <label htmlFor="field_3whfsd">Medicine Name *</label>
              <input id="field_3whfsd" required placeholder="e.g. Amoxicillin 500mg Capsules" value={form.name || ""} onChange={e => set("name", e.target.value)} className={errors.name ? "input-error" : ""} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            {/* Generic & Brand */}
            <div className="form-group">
              <label htmlFor="field_ftzanu">Generic Name *</label>
              <input id="field_ftzanu" required placeholder="e.g. Amoxicillin" value={form.genericName || ""} onChange={e => set("genericName", e.target.value)} className={errors.genericName ? "input-error" : ""} />
              {errors.genericName && <span className="field-error">{errors.genericName}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="field_c6eanv">Manufacturer</label>
              <input id="field_c6eanv" required placeholder="e.g. Cipla Ltd" value={form.manufacturer || ""} onChange={e => set("manufacturer", e.target.value)} />
            </div>

            {/* Category & Schedule */}
            <div className="form-group">
              <label htmlFor="field_r0jnco">Category *</label>
              {categories.length > 0 ? <select id="field_r0jnco" value={form.categoryId || ""} onChange={e => set("categoryId", e.target.value)} className={errors.category ? "input-error" : ""}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>
                      {c.name}
                    </option>)}
                </select> : <><label htmlFor="field_b8jp8u" className="sr-only">Type category name (e.g. Tablets)</label><input required placeholder="Type category name (e.g. Tablets)" value={form.category || ""} onChange={e => set("category", e.target.value)} className={errors.category ? "input-error" : ""} id="field_b8jp8u" /></>}
              {errors.category && <span className="field-error">{errors.category}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="field_8yi3yp">Schedule</label>
              <select id="field_8yi3yp" value={form.schedule || ""} onChange={e => set("schedule", e.target.value)}>
                <option value="OTC">OTC</option>
                <option value="H">Schedule H</option>
                <option value="H1">Schedule H1</option>
                <option value="X">Schedule X</option>
              </select>
            </div>

            {/* Batch & Expiry */}
            {!editData && <>
                <div className="form-group">
                  <label htmlFor="field_k6t4hl">Batch Number *</label>
                  <input id="field_k6t4hl" required placeholder="e.g. B-20241" value={form.batchNumber || ""} onChange={e => set("batchNumber", e.target.value)} className={errors.batchNumber ? "input-error" : ""} />
                  {errors.batchNumber && <span className="field-error">{errors.batchNumber}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="field_zpxyd7">Expiry Date *</label>
                  <input id="field_zpxyd7" required type="date" value={form.expiryDate || ""} onChange={e => set("expiryDate", e.target.value)} className={errors.expiryDate ? "input-error" : ""} />
                  {errors.expiryDate && <span className="field-error">{errors.expiryDate}</span>}
                </div>

                {/* Pricing */}
                <div className="form-group">
                  <label htmlFor="field_jsq6da">MRP (₹) *</label>
                  <input id="field_jsq6da" required type="number" step="0.01" placeholder="0.00" value={form.mrp ?? ""} onChange={e => set("mrp", e.target.value)} className={errors.mrp ? "input-error" : ""} />
                  {errors.mrp && <span className="field-error">{errors.mrp}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="field_e3k95g">Selling Price (₹) *</label>
                  <input id="field_e3k95g" required type="number" step="0.01" placeholder="0.00" value={form.sellingPrice ?? ""} onChange={e => set("sellingPrice", e.target.value)} className={errors.sellingPrice ? "input-error" : ""} />
                  {errors.sellingPrice && <span className="field-error">{errors.sellingPrice}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="field_gkrafq">Purchase Cost (₹)</label>
                  <input id="field_gkrafq" required type="number" step="0.01" placeholder="0.00" value={form.purchaseCost ?? ""} onChange={e => set("purchaseCost", e.target.value)} className={errors.purchaseCost ? "input-error" : ""} />
                  {errors.purchaseCost && <span className="field-error">{errors.purchaseCost}</span>}
                </div>

                {/* Quantity & Reorder */}
                <div className="form-group">
                  <label htmlFor="field_ryi210">Stock Quantity *</label>
                  <input id="field_ryi210" required type="number" placeholder="0" value={form.quantity ?? ""} onChange={e => set("quantity", e.target.value)} className={errors.quantity ? "input-error" : ""} />
                  {errors.quantity && <span className="field-error">{errors.quantity}</span>}
                </div>
              </>}
            <div className="form-group">
              <label htmlFor="field_95cr8v">Reorder Level</label>
              <input id="field_95cr8v" required type="number" placeholder="10" value={form.reorderLevel ?? ""} onChange={e => set("reorderLevel", e.target.value)} />
            </div>

            {/* GST & HSN */}
            <div className="form-group">
              <label htmlFor="field_nllaj6">GST %</label>
              <select id="field_nllaj6" value={form.gst ?? ""} onChange={e => set("gst", e.target.value)}>
                {GST_OPTIONS.map(g => <option key={g} value={g}>
                    {g}%
                  </option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="field_zd1vfb">HSN Code</label>
              <input id="field_zd1vfb" required placeholder="e.g. 3004" value={form.hsnCode || ""} onChange={e => set("hsnCode", e.target.value)} />
            </div>

            {/* Barcode & SKU */}
            <div className="form-group full">
              <label htmlFor="field_4wbhtl">Barcode / SKU</label>
              <input id="field_4wbhtl" required placeholder="Scan or enter barcode" value={form.barcode || ""} onChange={e => set("barcode", e.target.value)} />
            </div>

            {/* Supplier */}
            <div className="form-group full">
              <label htmlFor="field_zybujv">Supplier</label>
              {loadingSuppliers ? <div style={{
            padding: "10px",
            fontSize: "14px",
            color: "var(--text-muted)"
          }}>
                  Loading suppliers...
                </div> : suppliers.length > 0 ? <select id="field_zybujv" value={form.supplierId || ""} onChange={e => set("supplierId", e.target.value)} className={errors.supplierId ? "input-error" : ""}>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>
                      {s.name}
                    </option>)}
                </select> : <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
                  <div style={{
              padding: "10px",
              fontSize: "14px",
              color: "var(--text-muted)",
              background: "var(--surface-2)",
              borderRadius: "8px",
              border: "1px dashed var(--overlay-06)"
            }}>
                    No suppliers available
                  </div>
                  <a href="/suppliers" style={{
              color: "var(--primary)",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "none",
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
                    <Plus size={14} /> Create Supplier
                  </a>
                </div>}
            </div>

            {/* Notes */}
            <div className="form-group full">
              <label htmlFor="field_rgmt7s">Notes</label>
              <textarea id="field_rgmt7s" placeholder="Storage instructions, side effects, etc." value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={3} />
            </div>
          </div>
        </div>
        <div className="inv-modal-footer">
          <button className="inv-modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="inv-modal-btn confirm" onClick={handleSave} disabled={saving}>
            {saving ? <>
                <Spinner size={16} /> Saving...
              </> : <>
                <CheckCircle2 size={16} />{" "}
                {editData ? "Update Medicine" : "Add Medicine"}
              </>}
          </button>
        </div>
      </m.div>;
}
function MedicineViewModalSection2({
  onAddBatch,
  medicine,
  onEditBatch,
  batch
}) {
  return <m.div className="inv-modal-content inv-view-modal" style={{
    width: "800px"
  }} initial={{
    opacity: 0,
    scale: 0.95,
    y: 20
  }} animate={{
    opacity: 1,
    scale: 1,
    y: 0
  }} exit={{
    opacity: 0,
    scale: 0.95,
    y: 20
  }} onClick={e => e.stopPropagation()} role="presentation">
        <div className="inv-view-header">
          <div className="inv-view-avatar">{getInitials(medicine.name)}</div>
          <div className="inv-view-info">
            <h3>{medicine.name}</h3>
            <span className="inv-view-generic">
              {medicine.genericName}{" "}
              {medicine.brandName && `(${medicine.brandName})`}
            </span>
          </div>
          <button className="inv-modal-close-btn" onClick={onClose} style={{
        position: "center",
        top: "24px",
        right: "24px"
      }}>
            <BadgeX size={30} />
          </button>
        </div>

        <div style={{
      flex: 1,
      overflowY: "auto"
    }}>
          <div className="inv-view-badges">
            {isExpired && <span className="inv-badge danger">EXPIRED</span>}
            {isExpiringSoon && <span className="inv-badge warning">EXPIRING SOON</span>}
            {isOutOfStock && <span className="inv-badge danger">OUT OF STOCK</span>}
            {isLowStock && <span className="inv-badge warning">LOW STOCK</span>}
            {!isExpired && !isExpiringSoon && !isOutOfStock && !isLowStock && <span className="inv-badge success">IN STOCK</span>}
            <span className="inv-badge info">
              {medicine.scheduleType || medicine.schedule}
            </span>
          </div>

          <div className="inv-view-grid">
            <div className="inv-detail-item">
              <span>Category</span>
              <span>{medicine.category?.name || medicine.category || "—"}</span>
            </div>
            <div className="inv-detail-item">
              <span>GST</span>
              <span>{medicine.gstPercentage ?? 12}%</span>
            </div>
            <div className="inv-detail-item">
              <span>HSN Code</span>
              <span className="mono">{medicine.hsnCode || "—"}</span>
            </div>
            <div className="inv-detail-item">
              <span>Barcode</span>
              <span className="mono">{medicine.barcode || "—"}</span>
            </div>
            <div className="inv-detail-item">
              <span>Manufacturer</span>
              <span>
                {medicine.manufacturer?.name || medicine.manufacturer || "—"}
              </span>
            </div>
            <div className="inv-detail-item">
              <span>Supplier</span>
              <span>{medicine.supplier?.name || medicine.supplier || "—"}</span>
            </div>
            <div className="inv-detail-item">
              <span>Reorder Level</span>
              <span>{medicine.reorderLevel || 10} units</span>
            </div>
            <div className="inv-detail-item">
              <span>Total Stock</span>
              <span style={{
            color: isLowStock ? "var(--warning)" : "var(--success)",
            fontWeight: 800
          }}>
                {medicine.availableStock ?? medicine.stock ?? 0} units
              </span>
            </div>
          </div>

          {/* Batches Section */}
          <div style={{
        padding: "0 32px 24px"
      }}>
            <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px"
        }}>
              <h4 style={{
            margin: 0,
            fontFamily: "Outfit, sans-serif",
            fontSize: "12px",
            fontWeight: 800,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
                Active Batches
              </h4>
              <button className="inv-modal-btn confirm" style={{
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "12px"
          }} onClick={() => onAddBatch(medicine)}>
                <Plus size={14} /> Add Batch
              </button>
            </div>
            <div className="inv-table-wrapper" style={{
          maxHeight: "200px",
          overflowY: "auto",
          border: "1px solid var(--overlay-06)",
          borderRadius: "12px"
        }}>
              <table className="inv-table" style={{
            fontSize: "13px"
          }}>
                <thead>
                  <tr>
                    <th style={{
                  padding: "10px 16px"
                }}>Batch</th>
                    <th style={{
                  padding: "10px 16px"
                }}>Expiry</th>
                    <th style={{
                  padding: "10px 16px"
                }}>Quantity</th>
                    <th style={{
                  padding: "10px 16px"
                }}>MRP</th>
                    <th style={{
                  padding: "10px 16px"
                }}>Status</th>
                    <th style={{
                  padding: "10px 16px"
                }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {medicine.inventoryBatches && medicine.inventoryBatches.length > 0 ? medicine.inventoryBatches.map(batch => <tr key={batch.id}>
                        <td style={{
                  padding: "10px 16px"
                }} className="mono">
                          {batch.batchNumber}
                        </td>
                        <td style={{
                  padding: "10px 16px"
                }}>
                          {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric"
                  }) : "—"}
                        </td>
                        <td style={{
                  padding: "10px 16px",
                  fontWeight: 800
                }}>
                          {batch.quantity ?? 0}
                        </td>
                        <td style={{
                  padding: "10px 16px"
                }}>
                          ₹{safeNumber(batch.mrp || 0).toFixed(2)}
                        </td>
                        <td style={{
                  padding: "10px 16px"
                }}>
                          <span className={`inv-status-badge ${batch.quantity === 0 ? "out-of-stock" : batch.status === "ACTIVE" ? "in-stock" : "low-stock"}`} style={{
                    padding: "4px 8px"
                  }}>
                            {batch.status}
                          </span>
                        </td>
                        <td style={{
                  padding: "10px 16px"
                }}>
                          <button className="inv-row-btn" style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px"
                  }} title="Edit Batch" onClick={() => onEditBatch(batch, medicine)}>
                            <Pencil size={12} />
                          </button>
                        </td>
                      </tr>) : <tr>
                      <td colSpan={6} style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "var(--text-muted)"
                }}>
                        No batches found. Add a batch to stock this medicine.
                      </td>
                    </tr>}
                </tbody>
              </table>
            </div>
          </div>

          {medicine.description && <div className="inv-view-notes">
              <span>Notes</span>
              <p>{medicine.description}</p>
            </div>}
        </div>

        <div className="inv-view-footer">
          <button className="inv-modal-btn cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </m.div>;
}