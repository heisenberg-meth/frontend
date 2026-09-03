import { useState, useEffect, useRef, useMemo } from "react";
import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";
function ShopModalSection1({
  handleChange,
  form,
  onClose,
  handleSave,
  hasChanges,
  saving,
}) {
  return (
    <div
      className="sys-modal sys-modal-wide"
      style={{
        textAlign: "left",
      }}
      onKeyDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <>
        <h2
          style={{
            marginBottom: 24,
          }}
        >
          Edit Shop & Invoice Details
        </h2>

        <div className="modal-section-label">Shop Information</div>

        <div className="sys-form-group">
          <label htmlFor="field_90jjmb" className="sys-label">
            Shop Name
          </label>
          <input
            id="field_90jjmb"
            className="sys-input"
            value={form.shopName}
            onChange={(e) => handleChange("shopName", e.target.value)}
          />
        </div>
        <div className="sys-form-group">
          <label htmlFor="field_ieqpr3" className="sys-label">
            Phone
          </label>
          <input
            id="field_ieqpr3"
            className="sys-input"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>
        <div className="sys-form-group">
          <label htmlFor="field_cpbgvo" className="sys-label">
            Email
          </label>
          <input
            id="field_cpbgvo"
            className="sys-input"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>
        <div className="sys-form-group">
          <label htmlFor="field_8be5xd" className="sys-label">
            Address
          </label>
          <textarea
            id="field_8be5xd"
            className="sys-input sys-textarea"
            rows="3"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </div>

        <div className="modal-section-label">Invoice Configuration</div>

        <div className="sys-form-group">
          <label htmlFor="field_vr4xbg" className="sys-label">
            Invoice Prefix
          </label>
          <input
            id="field_vr4xbg"
            className="sys-input"
            value={form.invoicePrefix}
            onChange={(e) => handleChange("invoicePrefix", e.target.value)}
          />
        </div>
        <div className="sys-form-group">
          <label htmlFor="field_770brf" className="sys-label">
            Footer Text
          </label>
          <textarea
            id="field_770brf"
            className="sys-input sys-textarea"
            rows="2"
            value={form.footerText}
            onChange={(e) => handleChange("footerText", e.target.value)}
          />
        </div>
        <div className="sys-form-group">
          <label htmlFor="field_1n33rj" className="sys-label">
            Logo URL
          </label>
          <input
            id="field_1n33rj"
            className="sys-input"
            value={form.logoUrl}
            onChange={(e) => handleChange("logoUrl", e.target.value)}
          />
        </div>

        <div className="modal-toggles">
          <div className="sys-toggle-row">
            <span className="sys-toggle-label">Show Logo</span>
            <button
              type="button"
              className={`sys-toggle ${form.showLogo ? "on" : ""}`}
              onClick={() => handleChange("showLogo", !form.showLogo)}
              aria-label="Toggle Show Logo"
            >
              <div className="sys-toggle-thumb" />
            </button>
          </div>
          <div className="sys-toggle-row">
            <span className="sys-toggle-label">Show Doctor Name</span>
            <button
              type="button"
              className={`sys-toggle ${form.showDoctorName ? "on" : ""}`}
              onClick={() =>
                handleChange("showDoctorName", !form.showDoctorName)
              }
              aria-label="Toggle Show Doctor Name"
            >
              <div className="sys-toggle-thumb" />
            </button>
          </div>
          <div className="sys-toggle-row">
            <span className="sys-toggle-label">QR Code</span>
            <button
              type="button"
              className={`sys-toggle ${form.showQRCode ? "on" : ""}`}
              onClick={() => handleChange("showQRCode", !form.showQRCode)}
              aria-label="Toggle QR Code"
            >
              <div className="sys-toggle-thumb" />
            </button>
          </div>
          <div className="sys-toggle-row">
            <span className="sys-toggle-label">HSN Code</span>
            <button
              type="button"
              className={`sys-toggle ${form.showHSNCode ? "on" : ""}`}
              onClick={() => handleChange("showHSNCode", !form.showHSNCode)}
              aria-label="Toggle HSN Code"
            >
              <div className="sys-toggle-thumb" />
            </button>
          </div>
          <div className="sys-toggle-row">
            <span className="sys-toggle-label">Expiry Date</span>
            <button
              type="button"
              className={`sys-toggle ${form.showExpiryDate ? "on" : ""}`}
              onClick={() =>
                handleChange("showExpiryDate", !form.showExpiryDate)
              }
              aria-label="Toggle Expiry Date"
            >
              <div className="sys-toggle-thumb" />
            </button>
          </div>
          <div className="sys-toggle-row">
            <span className="sys-toggle-label">GST Breakdown</span>
            <button
              type="button"
              className={`sys-toggle ${form.showGSTBreakdown ? "on" : ""}`}
              onClick={() =>
                handleChange("showGSTBreakdown", !form.showGSTBreakdown)
              }
              aria-label="Toggle GST Breakdown"
            >
              <div className="sys-toggle-thumb" />
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="sys-btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="sys-btn-fill"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {hasChanges ? (saving ? "Saving..." : "Apply Changes") : "Edit"}
          </button>
        </div>
      </>
    </div>
  );
}
export default function ShopDetailsCard({
  settingsData,
  onRefresh,
  showToast,
  tenant,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const sp = settingsData?.storeProfile || {};
  const inv = settingsData?.invoiceTemplate || {};
  const safeTenant = tenant || {};
  return (
    <>
      <div className="sys-card">
        <div className="sys-card-header">
          <h3 className="sys-card-title">Shop & Invoice Details</h3>
        </div>
        <div className="summary-fields">
          <div className="summary-field">
            <span className="summary-field-label">Shop Name</span>
            <span className="summary-field-value">
              {sp.shopName || safeTenant.name || "\u2014"}
            </span>
          </div>
          <div className="summary-field">
            <span className="summary-field-label">Phone</span>
            <span className="summary-field-value">
              {sp.phone || safeTenant.phone || "\u2014"}
            </span>
          </div>
          <div className="summary-field">
            <span className="summary-field-label">Email</span>
            <span className="summary-field-value">
              {sp.email || safeTenant.email || "\u2014"}
            </span>
          </div>
          <div className="summary-field">
            <span className="summary-field-label">Invoice Prefix</span>
            <span className="summary-field-value">
              {inv.invoicePrefix || "\u2014"}
            </span>
          </div>
        </div>
        <button
          className="sys-btn-outline"
          style={{
            width: "100%",
            marginTop: 16,
          }}
          onClick={() => setModalOpen(true)}
        >
          Edit
        </button>
      </div>

      {modalOpen && (
        <ShopModal
          onClose={() => setModalOpen(false)}
          onRefresh={onRefresh}
          showToast={showToast}
          storeProfile={sp}
          invoiceTemplate={inv}
        />
      )}
    </>
  );
}
function ShopModal({
  onClose,
  onRefresh,
  showToast,
  storeProfile,
  invoiceTemplate,
}) {
  const [saving, setSaving] = useState(false);
  const snapshot = useMemo(
    () => ({
      shopName: storeProfile?.shopName || "",
      phone: storeProfile?.phone || "",
      email: storeProfile?.email || "",
      address: storeProfile?.address || "",
      invoicePrefix: invoiceTemplate?.invoicePrefix || "INV-",
      footerText: invoiceTemplate?.footerText || "",
      logoUrl: invoiceTemplate?.logoUrl || "",
      showLogo: invoiceTemplate?.showLogo ?? true,
      showDoctorName: invoiceTemplate?.showDoctorName ?? true,
      showQRCode: invoiceTemplate?.showQRCode ?? false,
      showHSNCode: invoiceTemplate?.showHSNCode ?? true,
      showExpiryDate: invoiceTemplate?.showExpiryDate ?? true,
      showGSTBreakdown: invoiceTemplate?.showGSTBreakdown ?? true,
      templateName: invoiceTemplate?.templateName || "DEFAULT_GST_TEMPLATE",
      paperSize: invoiceTemplate?.paperSize || "A4",
    }),
    [storeProfile, invoiceTemplate],
  );
  const [original] = useState(snapshot);
  const [form, setForm] = useState(snapshot);
  const overlayRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const hasChanges =
    original !== null && Object.keys(form).some((k) => form[k] !== original[k]);
  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const profilePayload = {
        shopName: form.shopName,
        phone: form.phone,
        email: form.email,
        address: form.address,
      };
      const invoicePayload = {
        templateName: form.templateName,
        paperSize: form.paperSize,
        invoicePrefix: form.invoicePrefix,
        showLogo: form.showLogo,
        showDoctorName: form.showDoctorName,
        showQRCode: form.showQRCode,
        showHSNCode: form.showHSNCode,
        showExpiryDate: form.showExpiryDate,
        showGSTBreakdown: form.showGSTBreakdown,
        logoUrl: form.logoUrl || null,
        footerText: form.footerText,
      };
      await Promise.all([
        api.put(API_ROUTES.SETTINGS_STORE_PROFILE, profilePayload),
        api.put(API_ROUTES.SETTINGS_INVOICE_TEMPLATE, invoicePayload),
      ]);
      showToast?.("Shop Details Updated Successfully", "success");
      onRefresh?.();
      onClose();
    } catch {
      showToast?.("Failed to update shop details", "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="sys-modal-overlay"
      role="presentation"
      ref={overlayRef}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (e.target === overlayRef.current) onClose();
        }
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <ShopModalSection1
        handleChange={handleChange}
        form={form}
        onClose={onClose}
        handleSave={handleSave}
        hasChanges={hasChanges}
        saving={saving}
      />
    </div>
  );
}
