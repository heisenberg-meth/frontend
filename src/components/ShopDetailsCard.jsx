import { useState, useEffect, useRef } from "react";
import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

export default function ShopDetailsCard({ settingsData, onRefresh, showToast }) {
  const [modalOpen, setModalOpen] = useState(false);
  const sp = settingsData?.storeProfile || {};
  const inv = settingsData?.invoiceTemplate || {};

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
              {sp.shopName || "\u2014"}
            </span>
          </div>
          <div className="summary-field">
            <span className="summary-field-label">Phone</span>
            <span className="summary-field-value">
              {sp.phone || "\u2014"}
            </span>
          </div>
          <div className="summary-field">
            <span className="summary-field-label">Email</span>
            <span className="summary-field-value">
              {sp.email || "\u2014"}
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
          style={{ width: "100%", marginTop: 16 }}
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
        />
      )}
    </>
  );
}

function ShopModal({ onClose, onRefresh, showToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState({
    shopName: "",
    phone: "",
    email: "",
    address: "",
    invoicePrefix: "INV-",
    footerText: "",
    logoUrl: "",
    showLogo: true,
    showDoctorName: true,
    showQRCode: false,
    showHSNCode: true,
    showExpiryDate: true,
    showGSTBreakdown: true,
    templateName: "DEFAULT_GST_TEMPLATE",
    paperSize: "A4",
  });
  const overlayRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(API_ROUTES.SETTINGS);
        const s = res.data?.data;
        if (s) {
          const sp = s.storeProfile || {};
          const inv = s.invoiceTemplate || {};
          const snapshot = {
            shopName: sp.shopName || "",
            phone: sp.phone || "",
            email: sp.email || "",
            address: sp.address || "",
            invoicePrefix: inv.invoicePrefix || "INV-",
            footerText: inv.footerText || "",
            logoUrl: inv.logoUrl || "",
            showLogo: inv.showLogo ?? true,
            showDoctorName: inv.showDoctorName ?? true,
            showQRCode: inv.showQRCode ?? false,
            showHSNCode: inv.showHSNCode ?? true,
            showExpiryDate: inv.showExpiryDate ?? true,
            showGSTBreakdown: inv.showGSTBreakdown ?? true,
            templateName: inv.templateName || "DEFAULT_GST_TEMPLATE",
            paperSize: inv.paperSize || "A4",
          };
          setOriginal(snapshot);
          setForm(snapshot);
        }
      } catch {
        showToast?.("Failed to load shop details", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hasChanges =
    original !== null &&
    Object.keys(form).some((k) => form[k] !== original[k]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
        api.put(API_ROUTES.SETTINGS, { storeProfile: profilePayload }),
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
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="sys-modal sys-modal-wide"
        style={{ textAlign: "left" }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div className="pay-spinner" />
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: 24 }}>
              Edit Shop & Invoice Details
            </h2>

            <div className="modal-section-label">Shop Information</div>

            <div className="sys-form-group">
              <label className="sys-label">Shop Name</label>
              <input
                className="sys-input"
                value={form.shopName}
                onChange={(e) => handleChange("shopName", e.target.value)}
              />
            </div>
            <div className="sys-form-group">
              <label className="sys-label">Phone</label>
              <input
                className="sys-input"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
            <div className="sys-form-group">
              <label className="sys-label">Email</label>
              <input
                className="sys-input"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            <div className="sys-form-group">
              <label className="sys-label">Address</label>
              <textarea
                className="sys-input sys-textarea"
                rows="3"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div className="modal-section-label">Invoice Configuration</div>

            <div className="sys-form-group">
              <label className="sys-label">Invoice Prefix</label>
              <input
                className="sys-input"
                value={form.invoicePrefix}
                onChange={(e) =>
                  handleChange("invoicePrefix", e.target.value)
                }
              />
            </div>
            <div className="sys-form-group">
              <label className="sys-label">Footer Text</label>
              <textarea
                className="sys-input sys-textarea"
                rows="2"
                value={form.footerText}
                onChange={(e) => handleChange("footerText", e.target.value)}
              />
            </div>
            <div className="sys-form-group">
              <label className="sys-label">Logo URL</label>
              <input
                className="sys-input"
                value={form.logoUrl}
                onChange={(e) => handleChange("logoUrl", e.target.value)}
              />
            </div>

            <div className="modal-toggles">
              <div className="sys-toggle-row">
                <span className="sys-toggle-label">Show Logo</span>
                <div
                  className={`sys-toggle ${form.showLogo ? "on" : ""}`}
                  onClick={() =>
                    handleChange("showLogo", !form.showLogo)
                  }
                >
                  <div className="sys-toggle-thumb" />
                </div>
              </div>
              <div className="sys-toggle-row">
                <span className="sys-toggle-label">Show Doctor Name</span>
                <div
                  className={`sys-toggle ${form.showDoctorName ? "on" : ""}`}
                  onClick={() =>
                    handleChange("showDoctorName", !form.showDoctorName)
                  }
                >
                  <div className="sys-toggle-thumb" />
                </div>
              </div>
              <div className="sys-toggle-row">
                <span className="sys-toggle-label">QR Code</span>
                <div
                  className={`sys-toggle ${form.showQRCode ? "on" : ""}`}
                  onClick={() =>
                    handleChange("showQRCode", !form.showQRCode)
                  }
                >
                  <div className="sys-toggle-thumb" />
                </div>
              </div>
              <div className="sys-toggle-row">
                <span className="sys-toggle-label">HSN Code</span>
                <div
                  className={`sys-toggle ${form.showHSNCode ? "on" : ""}`}
                  onClick={() =>
                    handleChange("showHSNCode", !form.showHSNCode)
                  }
                >
                  <div className="sys-toggle-thumb" />
                </div>
              </div>
              <div className="sys-toggle-row">
                <span className="sys-toggle-label">Expiry Date</span>
                <div
                  className={`sys-toggle ${form.showExpiryDate ? "on" : ""}`}
                  onClick={() =>
                    handleChange("showExpiryDate", !form.showExpiryDate)
                  }
                >
                  <div className="sys-toggle-thumb" />
                </div>
              </div>
              <div className="sys-toggle-row">
                <span className="sys-toggle-label">GST Breakdown</span>
                <div
                  className={`sys-toggle ${form.showGSTBreakdown ? "on" : ""}`}
                  onClick={() =>
                    handleChange(
                      "showGSTBreakdown",
                      !form.showGSTBreakdown,
                    )
                  }
                >
                  <div className="sys-toggle-thumb" />
                </div>
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
                {hasChanges
                  ? saving
                    ? "Saving..."
                    : "Apply Changes"
                  : "Edit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
