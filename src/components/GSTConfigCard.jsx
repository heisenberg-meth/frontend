import { useState, useEffect, useRef } from "react";
import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

const GST_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand",
  "Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi",
  "Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const FILING_FREQUENCIES = ["Monthly", "Quarterly", "Annual"];

export default function GSTConfigCard({ settingsData, onRefresh, showToast }) {
  const [modalOpen, setModalOpen] = useState(false);
  const sp = settingsData?.storeProfile || {};

  return (
    <>
      <div className="sys-card">
        <div className="sys-card-header">
          <h3 className="sys-card-title">$ GST Configuration</h3>
        </div>
        <div className="summary-fields">
          <div className="summary-field">
            <span className="summary-field-label">GSTIN</span>
            <span className="summary-field-value">{sp.gstin || "\u2014"}</span>
          </div>
          <div className="summary-field">
            <span className="summary-field-label">Business Name</span>
            <span className="summary-field-value">
              {sp.businessName || "\u2014"}
            </span>
          </div>
          <div className="summary-field">
            <span className="summary-field-label">State</span>
            <span className="summary-field-value">{sp.state || "\u2014"}</span>
          </div>
          <div className="summary-field">
            <span className="summary-field-label">Filing Frequency</span>
            <span className="summary-field-value">
              {sp.filingFrequency || "\u2014"}
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
        <GSTModal
          onClose={() => setModalOpen(false)}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}
    </>
  );
}

function GSTModal({ onClose, onRefresh, showToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState({
    gstin: "",
    businessName: "",
    state: "",
    filingFrequency: "Monthly",
  });
  const overlayRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(API_ROUTES.SETTINGS);
        const s = res.data?.data;
        if (s?.storeProfile) {
          const snapshot = {
            gstin: s.storeProfile.gstin || "",
            businessName: s.storeProfile.businessName || "",
            state: s.storeProfile.state || "",
            filingFrequency: s.storeProfile.filingFrequency || "Monthly",
          };
          setOriginal(snapshot);
          setForm(snapshot);
        }
      } catch {
        showToast?.("Failed to load GST settings", "error");
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
      await api.put(API_ROUTES.SETTINGS, {
        storeProfile: {
          gstin: form.gstin || null,
          businessName: form.businessName,
          state: form.state,
          filingFrequency: form.filingFrequency,
        },
      });
      showToast?.("GST Configuration Updated Successfully", "success");
      onRefresh?.();
      onClose();
    } catch {
      showToast?.("Failed to update GST configuration", "error");
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
        className="sys-modal"
        style={{ textAlign: "left", maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div className="pay-spinner" />
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: 24 }}>Edit GST Configuration</h2>

            <div className="sys-form-group">
              <label className="sys-label">GSTIN</label>
              <input
                className="sys-input"
                value={form.gstin}
                onChange={(e) => handleChange("gstin", e.target.value)}
              />
            </div>
            <div className="sys-form-group">
              <label className="sys-label">Business Name</label>
              <input
                className="sys-input"
                value={form.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
              />
            </div>
            <div className="sys-form-group">
              <label className="sys-label">GST State</label>
              <select
                className="sys-select"
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
              >
                <option value="">Select State</option>
                {GST_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sys-form-group">
              <label className="sys-label">Filing Frequency</label>
              <select
                className="sys-select"
                value={form.filingFrequency}
                onChange={(e) =>
                  handleChange("filingFrequency", e.target.value)
                }
              >
                {FILING_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
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
