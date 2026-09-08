import { useState } from "react";
import { createPortal } from "react-dom";
import { m, AnimatePresence } from "framer-motion";
import { X, Plus, Pill, AlertCircle } from "lucide-react";
import { createMedicine } from "../../services/inventory.service.js";

const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Ointment",
  "Cream",
  "Drops",
  "Inhaler",
  "Suspension",
  "Powder",
  "Gel",
  "Solution",
  "Other",
];

const SCHEDULE_TYPES = [
  "OTC",
  "Schedule H",
  "Schedule H1",
  "Schedule X",
  "Schedule G",
  "Narcotic",
  "General",
];

const GST_RATES = [0, 5, 12, 18, 28];

export default function AddNewMedicineModal({ isOpen, ...props }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <AddNewMedicineModalForm
          key={props.initialSearchName || "new-medicine-form"}
          {...props}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

function AddNewMedicineModalForm({
  onClose,
  initialSearchName = "",
  branchId = "",
  onMedicineAdded,
  showToast,
}) {
  const [formData, setFormData] = useState({
    name: initialSearchName || "",
    genericName: "",
    strength: "",
    dosageForm: "Tablet",
    manufacturer: "",
    category: "",
    scheduleType: "OTC",
    packSize: "10 tablets / strip",
    hsnCode: "3004",
    gstPercentage: 12,
    barcode: "",
    addToPO: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg("Medicine name must be at least 2 characters long.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // Create only the Medicine Master record (stock = 0, no physical inventory batch)
      const payload = {
        name: trimmedName,
        medicineName: trimmedName,
        genericName: formData.genericName.trim() || undefined,
        strength: formData.strength.trim() || undefined,
        dosageForm: formData.dosageForm || undefined,
        manufacturer: formData.manufacturer.trim() || undefined,
        category: formData.category.trim() || undefined,
        scheduleType: formData.scheduleType || undefined,
        packSize: formData.packSize.trim() || undefined,
        unitPerPack: formData.packSize
          ? Number(String(formData.packSize).replace(/\D/g, "")) || undefined
          : undefined,
        hsnCode: formData.hsnCode.trim() || undefined,
        gstPercentage: Number(formData.gstPercentage) || 0,
        barcode: formData.barcode.trim() || undefined,
        branchId: branchId || undefined,
        reorderLevel: 10,
        isActive: true,
        // Notice: NO initialBatch. Stock remains 0 until received through Goods Receipt!
      };

      const response = await createMedicine(payload);
      const createdMed = response?.data?.data || response?.data || response;

      if (showToast) {
        showToast(
          `"${trimmedName}" added to Medicine Master with 0 physical stock`,
          "success",
        );
      }

      if (onMedicineAdded) {
        onMedicineAdded(createdMed, formData.addToPO);
      }

      onClose();
    } catch (err) {
      console.error("[ADD MASTER MEDICINE ERROR]:", err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create medicine master record";
      setErrorMsg(message);
      if (showToast) {
        showToast(message, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <m.div
      className="add-medicine-modal-overlay"
      style={{ zIndex: 13500 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <m.div
        className="stock-modal-content add-med-master-modal"
        style={{
          maxWidth: "680px",
          width: "95vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="stock-modal-header" style={{ padding: "18px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(0, 230, 153, 0.12)",
                color: "var(--primary, #00e699)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pill size={20} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  fontFamily: "Outfit, sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                Add New Medicine
              </h3>
              <span
                style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.5)",
                }}
              >
                Creates a Medicine Master record with 0 stock until Goods
                Receipt
              </span>
            </div>
          </div>
          <button
            type="button"
            className="micro-btn"
            onClick={onClose}
            aria-label="Close"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <div
            className="stock-modal-body"
            style={{
              padding: "20px 24px",
              overflowY: "auto",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {errorMsg && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "rgba(255, 77, 77, 0.12)",
                  border: "1px solid rgba(255, 77, 77, 0.3)",
                  color: "#ff6b6b",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Medicine Name (Primary) */}
            <div className="pos-input-group">
              <label className="p-label" style={{ fontWeight: 600 }}>
                MEDICINE NAME{" "}
                <span style={{ color: "var(--danger, #ff4d4d)" }}>*</span>
              </label>
              <input
                required
                autoFocus
                className="pos-input"
                placeholder="e.g. Dolo 650, Augmentin 625"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                style={{ fontSize: "14px", height: "42px" }}
              />
            </div>

            {/* Generic Name & Strength */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr",
                gap: "14px",
              }}
            >
              <div className="pos-input-group">
                <label className="p-label">GENERIC COMPOSITION</label>
                <input
                  className="pos-input"
                  placeholder="e.g. Paracetamol, Amoxicillin"
                  value={formData.genericName}
                  onChange={(e) => handleChange("genericName", e.target.value)}
                />
              </div>
              <div className="pos-input-group">
                <label className="p-label">STRENGTH</label>
                <input
                  className="pos-input"
                  placeholder="e.g. 650 mg, 500mg"
                  value={formData.strength}
                  onChange={(e) => handleChange("strength", e.target.value)}
                />
              </div>
            </div>

            {/* Dosage Form & Manufacturer */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.2fr",
                gap: "14px",
              }}
            >
              <div className="pos-input-group">
                <label className="p-label">DOSAGE FORM</label>
                <select
                  className="pos-input"
                  value={formData.dosageForm}
                  onChange={(e) => handleChange("dosageForm", e.target.value)}
                >
                  {DOSAGE_FORMS.map((form) => (
                    <option key={form} value={form}>
                      {form}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pos-input-group">
                <label className="p-label">MANUFACTURER</label>
                <input
                  className="pos-input"
                  placeholder="e.g. Micro Labs, Cipla, Sun Pharma"
                  value={formData.manufacturer}
                  onChange={(e) => handleChange("manufacturer", e.target.value)}
                />
              </div>
            </div>

            {/* Category & Schedule */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
              }}
            >
              <div className="pos-input-group">
                <label className="p-label">CATEGORY</label>
                <input
                  className="pos-input"
                  placeholder="e.g. Analgesic / Antipyretic"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                />
              </div>
              <div className="pos-input-group">
                <label className="p-label">SCHEDULE</label>
                <select
                  className="pos-input"
                  value={formData.scheduleType}
                  onChange={(e) => handleChange("scheduleType", e.target.value)}
                >
                  {SCHEDULE_TYPES.map((sch) => (
                    <option key={sch} value={sch}>
                      {sch}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pack Size, HSN & GST */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1fr",
                gap: "14px",
              }}
            >
              <div className="pos-input-group">
                <label className="p-label">PACK SIZE</label>
                <input
                  className="pos-input"
                  placeholder="e.g. 15 tablets / strip"
                  value={formData.packSize}
                  onChange={(e) => handleChange("packSize", e.target.value)}
                />
              </div>
              <div className="pos-input-group">
                <label className="p-label">HSN CODE</label>
                <input
                  className="pos-input"
                  placeholder="e.g. 3004"
                  value={formData.hsnCode}
                  onChange={(e) => handleChange("hsnCode", e.target.value)}
                />
              </div>
              <div className="pos-input-group">
                <label className="p-label">GST %</label>
                <select
                  className="pos-input"
                  value={formData.gstPercentage}
                  onChange={(e) =>
                    handleChange("gstPercentage", Number(e.target.value))
                  }
                >
                  {GST_RATES.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}%
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Barcode (optional) */}
            <div className="pos-input-group">
              <label className="p-label">BARCODE (OPTIONAL)</label>
              <input
                className="pos-input"
                placeholder="Scan or enter barcode"
                value={formData.barcode}
                onChange={(e) => handleChange("barcode", e.target.value)}
              />
            </div>

            {/* Add to PO Checkbox & Information Callout */}
            <div
              style={{
                marginTop: "4px",
                padding: "14px 16px",
                borderRadius: "10px",
                background: "rgba(0, 230, 153, 0.05)",
                border: "1px solid rgba(0, 230, 153, 0.2)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-main, #fff)",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.addToPO}
                  onChange={(e) => handleChange("addToPO", e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--primary, #00e699)",
                    cursor: "pointer",
                  }}
                />
                <span>Automatically add to current Purchase Order</span>
              </label>
              <span
                style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.55)",
                  lineHeight: "1.4",
                  paddingLeft: "26px",
                }}
              >
                💡 <b>Medicine Master record</b> will be registered with{" "}
                <b>Available Stock = 0</b>. Stock will be physically updated
                only when supplier delivers goods during Goods Receipt.
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div
            className="stock-modal-footer"
            style={{
              padding: "16px 24px",
              borderTop:
                "1px solid var(--outline-variant, rgba(255, 255, 255, 0.1))",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              background: "var(--surface-variant, rgba(255, 255, 255, 0.02))",
            }}
          >
            <button
              type="button"
              className="p-btn p-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="p-btn p-btn-primary"
              disabled={isSubmitting || !formData.name.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                fontWeight: 600,
              }}
            >
              <Plus size={16} />
              {isSubmitting
                ? "Saving..."
                : formData.addToPO
                  ? "Save & Add to PO"
                  : "Save to Master"}
            </button>
          </div>
        </form>
      </m.div>
    </m.div>
  );
}
