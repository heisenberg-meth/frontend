import { useState } from "react";
import {
  Plus,
  Search,
  XCircle,
  Eye,
  Printer,
  Pill,
  TrendingUp,
  User,
  ShieldCheck,
  ClipboardCheck,
  FileSearch,
  CheckCircle2,
  Loader2,
  Upload,
  Pencil,
  Trash2,
  FileText,
  X,
  Stethoscope,
} from "lucide-react";
import { m } from "framer-motion";
import api from "../../api";
import { API_ROUTES } from "../../constants/api.routes.js";

const EMPTY = {
  patientName: "",
  patientPhone: "",
  patientAge: "",
  patientGender: "Male",
  doctorName: "",
  doctorRegNo: "",
  doctorSpecialty: "",
  medications: [
    {
      name: "",
      dosage: "1-1-1",
      duration: 7,
      durationUnit: "Days",
      instructions: "",
    },
  ],
  diagnosis: "",
  notes: "",
  priority: "Normal",
  status: "pending",
  type: "Digital",
};
function Spinner({ size = 14 }) {
  return (
    <Loader2
      size={size}
      style={{
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}
const DOSAGE_OPTIONS = [
  "1-0-0",
  "1-0-1",
  "1-1-1",
  "0-1-0",
  "0-1-1",
  "1-1-0",
  "SOS",
  "BD",
  "TDS",
  "QD",
];
const DURATION_UNITS = ["Days", "Weeks", "Months"];
const PRIORITY_OPTIONS = ["Normal", "Urgent", "STAT"];
export function StatCard({ icon: Icon, label, value, color, trend }) {
  return (
    <div className="rx-stat-card-v2">
      <div
        className="rx-stat-icon"
        style={{
          backgroundColor: `${color}15`,
          color,
        }}
      >
        <Icon size={20} />
      </div>
      <div className="rx-stat-content">
        <span className="rx-stat-label">{label}</span>
        <div className="rx-stat-val-group">
          <div
            className="rx-stat-value"
            style={{
              color,
            }}
          >
            {value}
          </div>
          {trend && (
            <div className="rx-stat-trend">
              <TrendingUp size={10} />
              <span>{trend}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Add / Edit Prescription Modal ─── */
export function PrescriptionModal({
  onClose,
  onSave,
  editData,
  showToast,
  saving,
}) {
  const [form, setForm] = useState(
    editData
      ? {
          ...EMPTY,
          ...editData,
          medications:
            editData.medications || editData.meds || EMPTY.medications,
        }
      : EMPTY,
  );
  const set = (key, val) =>
    setForm((f) => ({
      ...f,
      [key]: val,
    }));
  const updateMedication = (idx, field, val) => {
    const meds = [...form.medications];
    meds[idx] = {
      ...meds[idx],
      [field]: val,
    };
    set("medications", meds);
  };
  const addMedication = () => {
    set("medications", [
      ...form.medications,
      {
        name: "",
        dosage: "1-1-1",
        duration: 7,
        durationUnit: "Days",
        instructions: "",
      },
    ]);
  };
  const removeMedication = (idx) => {
    if (form.medications.length > 1) {
      set(
        "medications",
        form.medications.filter((_, i) => i !== idx),
      );
    }
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      showToast("Only images and PDF files allowed", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("File must be under 5MB", "error");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("prescription", file);
      const res = await api.post(
        `${API_ROUTES.PRESCRIPTIONS}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      const uploadedData = res.data.data || res.data;
      showToast("Prescription uploaded successfully", "success");
      onSave({
        ...form,
        ...uploadedData,
        type: "Scanned",
      });
    } catch (err) {
      showToast(
        err.response?.data?.error || "Failed to upload prescription",
        "error",
      );
    }
  };
  const validate = () => {
    if (!form.patientName.trim()) {
      showToast("Patient name is required", "error");
      return false;
    }
    if (!form.doctorName.trim()) {
      showToast("Doctor name is required", "error");
      return false;
    }
    if (form.medications.some((m) => !m.name.trim())) {
      showToast("All medications must have a name", "error");
      return false;
    }
    return true;
  };
  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      className="rx-modal-overlay"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      onClick={onClose}
    >
      <PrescriptionModalSection1
        set={set}
        form={form}
        removeMedication={removeMedication}
        updateMedication={updateMedication}
        editData={editData}
        handleFileUpload={handleFileUpload}
        onClose={onClose}
        addMedication={addMedication}
        handleSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

/* ─── View Prescription Modal ─── */
export function PrescriptionViewModal({
  rx,
  onClose,
  onFulfill,
  onVerify,
  onReject,
  processing,
  showToast,
}) {
  if (!rx) return null;
  const meds = rx.medications || rx.meds || [];
  return (
    <div
      role="button"
      tabIndex={0}
      className="rx-modal-overlay"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      onClick={onClose}
    >
      <m.div
        className="rx-modal-content rx-view-modal"
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="rx-view-header">
          <div className="rx-view-icon">
            <FileSearch size={24} />
          </div>
          <div className="rx-view-info">
            <h3>{rx.id || rx.rxNumber || "Prescription"}</h3>
            <span>
              {rx.patientName || rx.patient || "—"} ·{" "}
              {rx.doctorName || rx.doctor || "—"}
            </span>
          </div>
          <button className="rx-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="rx-view-badges">
          <span className={`rx-badge ${rx.status}`}>
            {(rx.status || "pending").toUpperCase()}
          </span>
          <span className="rx-badge info">{rx.priority || "Normal"}</span>
          <span className="rx-badge info">{rx.type || "Digital"}</span>
        </div>

        <div className="rx-view-section">
          <h4>Patient Details</h4>
          <div className="rx-view-grid">
            <div className="rx-detail">
              <span>Name</span>
              <span>{rx.patientName || rx.patient || "—"}</span>
            </div>
            <div className="rx-detail">
              <span>Phone</span>
              <span>{rx.patientPhone || rx.phone || "—"}</span>
            </div>
            <div className="rx-detail">
              <span>Age / Gender</span>
              <span>
                {rx.patientAge ? `${rx.patientAge}y` : "—"} /{" "}
                {rx.patientGender || rx.gender || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="rx-view-section">
          <h4>Doctor Details</h4>
          <div className="rx-view-grid">
            <div className="rx-detail">
              <span>Name</span>
              <span>{rx.doctorName || rx.doctor || "—"}</span>
            </div>
            <div className="rx-detail">
              <span>Reg No</span>
              <span className="mono">{rx.doctorRegNo || "—"}</span>
            </div>
            <div className="rx-detail">
              <span>Specialty</span>
              <span>{rx.doctorSpecialty || "—"}</span>
            </div>
          </div>
        </div>

        <div className="rx-view-section">
          <h4>Medications ({meds.length})</h4>
          <div className="rx-med-list-view">
            {meds.map((m) => (
              <div key={m.name} className="rx-med-item-view">
                <Pill
                  size={14}
                  style={{
                    color: "var(--primary)",
                  }}
                />
                <div>
                  <span className="rx-med-name">{m.name || m}</span>
                  <span className="rx-med-meta">
                    {m.dosage} · {m.duration} {m.durationUnit || "Days"}
                    {m.instructions ? ` · ${m.instructions}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {rx.diagnosis && (
          <div className="rx-view-section">
            <h4>Diagnosis</h4>
            <p className="rx-diagnosis-text">{rx.diagnosis}</p>
          </div>
        )}

        {rx.notes && (
          <div className="rx-view-section">
            <h4>Notes</h4>
            <p className="rx-notes-text">{rx.notes}</p>
          </div>
        )}

        <div className="rx-view-footer">
          <button className="rx-modal-btn cancel" onClick={onClose}>
            Close
          </button>
          <button
            className="rx-modal-btn secondary"
            onClick={() => {
              showToast("Printing prescription...", "success");
            }}
          >
            <Printer size={16} /> Print
          </button>
          {rx.status === "pending" && (
            <>
              <button
                className="rx-modal-btn verify"
                onClick={() => onVerify(rx)}
                disabled={processing === rx.id}
              >
                {processing === rx.id ? (
                  <Spinner size={16} />
                ) : (
                  <>
                    <ShieldCheck size={16} /> Verify
                  </>
                )}
              </button>
              <button
                className="rx-modal-btn confirm"
                onClick={() => onFulfill(rx)}
                disabled={processing === rx.id}
              >
                {processing === rx.id ? (
                  <Spinner size={16} />
                ) : (
                  <>
                    <ClipboardCheck size={16} /> Fulfill
                  </>
                )}
              </button>
              <button
                className="rx-modal-btn danger"
                onClick={() => onReject(rx)}
                disabled={processing === rx.id}
              >
                {processing === rx.id ? (
                  <Spinner size={16} />
                ) : (
                  <>
                    <XCircle size={16} /> Reject
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </m.div>
    </div>
  );
}

/* ─── Edit Notes Modal ─── */
export function EditNotesModal({ rx, onClose, onSave, saving }) {
  const [notes, setNotes] = useState(rx.notes || "");
  return (
    <div
      role="button"
      tabIndex={0}
      className="rx-modal-overlay"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      onClick={onClose}
    >
      <m.div
        className="rx-modal-content rx-notes-modal"
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="rx-modal-header">
          <div className="header-title-group">
            <Pencil
              size={20}
              style={{
                color: "var(--primary)",
              }}
            />
            <h3>Edit Prescription Notes</h3>
          </div>
          <button className="rx-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="rx-modal-scroll">
          <div className="form-group full">
            <label htmlFor="field_qgppk0">Notes</label>
            <textarea
              id="field_qgppk0"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Update prescription notes..."
            />
          </div>
        </div>
        <div className="rx-modal-footer">
          <button className="rx-modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rx-modal-btn confirm"
            onClick={() => onSave(rx.id, notes)}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner size={16} /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Save Notes
              </>
            )}
          </button>
        </div>
      </m.div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
function PrescriptionModalSection1({
  set,
  form,
  removeMedication,
  updateMedication,
  editData,
  handleFileUpload,
  onClose,
  addMedication,
  handleSave,
  saving,
}) {
  return (
    <m.div
      className="rx-modal-content"
      initial={{
        opacity: 0,
        scale: 0.95,
        y: 20,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
        y: 20,
      }}
      onClick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div className="rx-modal-header">
        <div className="header-title-group">
          <FileText
            size={20}
            style={{
              color: "var(--primary)",
            }}
          />
          <h3>{editData ? "Edit Prescription" : "New Prescription"}</h3>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <label className="rx-upload-btn">
            <Upload size={16} /> Upload Scan
            <input
              required
              type="file"
              hidden
              accept="image/*,.pdf"
              onChange={handleFileUpload}
            />
          </label>
          <button className="rx-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="rx-modal-scroll">
        {/* Patient Info */}
        <div className="rx-section-title">Patient Information</div>
        <div className="rx-form-grid">
          <div className="form-group full">
            <label htmlFor="field_70vw0h">Patient Name *</label>
            <input
              id="field_70vw0h"
              required
              placeholder="e.g. Rahul Sharma"
              value={form.patientName}
              onChange={(e) => set("patientName", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="field_odo97c">Phone Number</label>
            <input
              id="field_odo97c"
              required
              placeholder="+91 XXXXX XXXXX"
              value={form.patientPhone}
              onChange={(e) => set("patientPhone", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="field_8dgnw7">Age</label>
            <input
              id="field_8dgnw7"
              required
              type="number"
              placeholder="42"
              value={form.patientAge}
              onChange={(e) => set("patientAge", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="field_gjmdbv">Gender</label>
            <select
              id="field_gjmdbv"
              value={form.patientGender}
              onChange={(e) => set("patientGender", e.target.value)}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="field_n4ve14">Priority</label>
            <select
              id="field_n4ve14"
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="rx-section-title">Doctor Information</div>
        <div className="rx-form-grid">
          <div className="form-group full">
            <label htmlFor="field_afav0f">Doctor Name *</label>
            <input
              id="field_afav0f"
              required
              placeholder="e.g. Dr. Priya Mehta"
              value={form.doctorName}
              onChange={(e) => set("doctorName", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="field_j0abnt">Registration Number</label>
            <input
              id="field_j0abnt"
              required
              placeholder="e.g. MMC-12345"
              value={form.doctorRegNo}
              onChange={(e) => set("doctorRegNo", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="field_a2hsdh">Specialty</label>
            <input
              id="field_a2hsdh"
              required
              placeholder="e.g. General Physician"
              value={form.doctorSpecialty}
              onChange={(e) => set("doctorSpecialty", e.target.value)}
            />
          </div>
        </div>

        {/* Medications */}
        <div className="rx-section-title">Medications</div>
        {form.medications.map((med, idx) => (
          <div key={med.name} className="rx-med-card">
            <div className="rx-med-header">
              <span>Medication #{idx + 1}</span>
              {form.medications.length > 1 && (
                <button
                  className="rx-med-remove"
                  onClick={() => removeMedication(idx)}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="rx-form-grid">
              <div className="form-group full">
                <label htmlFor="field_5li47c">Medicine Name *</label>
                <input
                  id="field_5li47c"
                  required
                  placeholder="e.g. Amoxicillin 500mg"
                  value={med.name}
                  onChange={(e) =>
                    updateMedication(idx, "name", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="field_85rvcu">Dosage</label>
                <select
                  id="field_85rvcu"
                  value={med.dosage}
                  onChange={(e) =>
                    updateMedication(idx, "dosage", e.target.value)
                  }
                >
                  {DOSAGE_OPTIONS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="field_osikg9">Duration</label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <input
                    id="field_osikg9"
                    required
                    type="number"
                    placeholder="7"
                    value={med.duration}
                    onChange={(e) =>
                      updateMedication(idx, "duration", e.target.value)
                    }
                    style={{
                      flex: 1,
                    }}
                  />
                  <select
                    value={med.durationUnit}
                    onChange={(e) =>
                      updateMedication(idx, "durationUnit", e.target.value)
                    }
                    style={{
                      width: 100,
                    }}
                  >
                    {DURATION_UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group full">
                <label htmlFor="field_l1b6i2">Instructions</label>
                <input
                  id="field_l1b6i2"
                  required
                  placeholder="e.g. After meals"
                  value={med.instructions}
                  onChange={(e) =>
                    updateMedication(idx, "instructions", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}
        <button className="rx-add-med-btn" onClick={addMedication}>
          <Plus size={16} /> Add Medication
        </button>

        {/* Diagnosis & Notes */}
        <div className="rx-section-title">Additional Information</div>
        <div className="rx-form-grid">
          <div className="form-group full">
            <label htmlFor="field_r09biv">Diagnosis</label>
            <input
              id="field_r09biv"
              required
              placeholder="e.g. Upper Respiratory Tract Infection"
              value={form.diagnosis}
              onChange={(e) => set("diagnosis", e.target.value)}
            />
          </div>
          <div className="form-group full">
            <label htmlFor="field_v6ksp3">Notes</label>
            <textarea
              id="field_v6ksp3"
              placeholder="Additional instructions, allergies, etc."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>
      <div className="rx-modal-footer">
        <button className="rx-modal-btn cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          className="rx-modal-btn confirm"
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
              {editData ? "Update Prescription" : "Create Prescription"}
            </>
          )}
        </button>
      </div>
    </m.div>
  );
}
export function PrescriptionsCRUDSection2({
  setSearch,
  setFilterStatus,
  setSelectedRx,
  search,
  filterStatus,
  loading,
  filtered,
  setNotesEditTarget,
  handleFulfill,
  processing,
  setDeleteTarget,
}) {
  return (
    <div className="rx-table-card">
      <div className="rx-table-header">
        <div className="rx-search-box">
          <Search size={20} className="search-icon" />
          <>
            <label htmlFor="field_nh93a8" className="sr-only">
              Search by patient, Rx ID, or doctor...
            </label>
            <input
              required
              placeholder="Search by patient, Rx ID, or doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="field_nh93a8"
            />
          </>
        </div>
        <div className="rx-filter-group">
          <select
            className="rx-select-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="rx-table-wrapper">
        <table className="rx-table">
          <thead>
            <tr>
              <th>RX ID</th>
              <th>PATIENT</th>
              <th>DOCTOR</th>
              <th>MEDICATIONS</th>
              <th>DATE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="rx-table-loading">
                  <Spinner size={20} /> Loading prescriptions...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="rx-table-empty">
                  No prescriptions found. Create your first prescription →
                </td>
              </tr>
            ) : (
              filtered.map((rx) => (
                <tr key={rx.id}>
                  <td>
                    <span className="rx-id-cell">
                      {rx.id || rx.rxNumber || "—"}
                    </span>
                  </td>
                  <td>
                    <div className="rx-identity">
                      <div className="rx-avatar">
                        <User size={14} />
                      </div>
                      <span>{rx.patientName || rx.patient || "—"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="rx-doctor-cell">
                      <Stethoscope size={12} />
                      <span>{rx.doctorName || rx.doctor || "—"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="rx-med-list">
                      {(rx.medications || rx.meds || [])
                        .slice(0, 2)
                        .map((m) => (
                          <span key={m.name} className="rx-med-tag">
                            <Pill size={10} />
                            {m.name || m}
                          </span>
                        ))}
                      {(rx.medications || rx.meds || []).length > 2 && (
                        <span className="rx-med-more">
                          +{(rx.medications || rx.meds || []).length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="rx-date">
                      {rx.createdAt
                        ? new Date(rx.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : rx.date || "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`rx-status-badge ${rx.status}`}>
                      <div className="status-dot" />
                      {(rx.status || "pending").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="rx-row-actions">
                      <button
                        className="rx-row-btn"
                        title="View Details"
                        onClick={() => setSelectedRx(rx)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="rx-row-btn"
                        title="Edit Notes"
                        onClick={() => setNotesEditTarget(rx)}
                      >
                        <Pencil size={16} />
                      </button>
                      {rx.status === "pending" && (
                        <button
                          className="rx-row-btn active"
                          title="Fulfill"
                          onClick={() => handleFulfill(rx)}
                          disabled={processing === rx.id}
                        >
                          {processing === rx.id ? (
                            <Spinner size={14} />
                          ) : (
                            <ClipboardCheck size={16} />
                          )}
                        </button>
                      )}
                      <button
                        className="rx-row-btn danger"
                        title="Delete"
                        onClick={() => setDeleteTarget(rx)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
