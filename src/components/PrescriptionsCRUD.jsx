import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus,
  Clock,
  CheckCircle,
  Download,
  ClipboardCheck,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  getPrescriptions,
  createPrescription,
  verifyPrescription,
  rejectPrescription,
  convertPrescriptionToInvoice,
} from "../services/prescriptions.service";
import ConfirmModal from "./ConfirmModal";
import {
  PrescriptionViewModal,
  PrescriptionModal,
  EditNotesModal,
  StatCard,
  PrescriptionsCRUDSection2,
} from "./Prescription/Prescription.jsx";

const CSV_HEADERS = [
  "Rx ID",
  "Patient Name",
  "Doctor Name",
  "Status",
  "Date",
  "Medications",
];

export default function PrescriptionsCRUD({ showToast }) {
  const [search, setSearch] = useState("");
  const [selectedRx, setSelectedRx] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting] = useState(false);
  const [notesEditTarget, setNotesEditTarget] = useState(null);
  const [notesSaving] = useState(false);
  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPrescriptions();
      const data = res.data.data || res.data;
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load prescriptions", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        setLoading(true);
        const res = await getPrescriptions();
        if (!mounted) return;
        const data = res.data.data || res.data;
        setPrescriptions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (mounted) {
          showToast("Failed to load prescriptions", "error");
        }
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
  const filtered = useMemo(() => {
    return prescriptions.filter((rx) => {
      const matchesSearch =
        (rx.patientName || rx.patient || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (rx.id || rx.rxNumber || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (rx.doctorName || rx.doctor || "")
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesStatus =
        filterStatus === "All" || rx.status === filterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, search, filterStatus]);
  const stats = useMemo(
    () => ({
      total: prescriptions.length,
      pending: prescriptions.filter((p) => p.status === "pending").length,
      fulfilled: prescriptions.filter((p) => p.status === "fulfilled").length,
      cancelled: prescriptions.filter((p) => p.status === "cancelled").length,
    }),
    [prescriptions],
  );
  const handleCreate = async (form) => {
    try {
      await createPrescription(form);
      showToast("Prescription created successfully", "success");
      await loadPrescriptions();
      setModalOpen(false);
    } catch (err) {
      showToast(
        err.response?.data?.error || "Failed to create prescription",
        "error",
      );
    }
  };
  const handleUpdate = async () => {
    showToast("Update not available in current version", "info");
    setModalOpen(false);
    setEditTarget(null);
  };
  const handleSave = (form) => {
    if (editTarget) handleUpdate(form);
    else handleCreate(form);
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    showToast("Delete not available in current version", "info");
    setDeleteTarget(null);
  };
  const handleFulfill = async (rx) => {
    setProcessing(rx.id);
    try {
      await convertPrescriptionToInvoice(rx.id);
      showToast(`Prescription ${rx.id} converted to invoice`, "success");
      await loadPrescriptions();
      setSelectedRx(null);
    } catch (err) {
      showToast(
        err.response?.data?.error || "Failed to fulfill prescription",
        "error",
      );
    } finally {
      setProcessing(null);
    }
  };
  const handleVerify = async (rx) => {
    setProcessing(rx.id);
    try {
      await verifyPrescription(rx.id);
      showToast(`Prescription ${rx.id} verified`, "success");
      await loadPrescriptions();
      setSelectedRx(null);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to verify", "error");
    } finally {
      setProcessing(null);
    }
  };
  const handleReject = async (rx) => {
    setProcessing(rx.id);
    try {
      await rejectPrescription(rx.id, {
        reason: "Rejected by pharmacist",
      });
      showToast(`Prescription ${rx.id} rejected`, "success");
      await loadPrescriptions();
      setSelectedRx(null);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to reject", "error");
    } finally {
      setProcessing(null);
    }
  };
  const handleSaveNotes = async () => {
    showToast("Notes update not available in current version", "info");
    setNotesEditTarget(null);
  };
  const handleExportCSV = () => {
    const rows = filtered.map((rx) => [
      rx.id || rx.rxNumber || "",
      rx.patientName || rx.patient || "",
      rx.doctorName || rx.doctor || "",
      rx.status || "",
      rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : "",
      (rx.medications || rx.meds || []).map((m) => m.name || m).join("; "),
    ]);
    const csv = [CSV_HEADERS, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prescriptions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Prescriptions exported", "success");
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  };
  return (
    <div className="rx-container">
      {/* Header */}
      <div className="rx-header">
        <div className="rx-title-group">
          <h2>Prescription Management</h2>
          <p>
            Digital and scanned prescriptions — create, verify, fulfill, and
            track medication dispensing
          </p>
        </div>
        <div className="rx-header-actions">
          <button className="rx-action-btn secondary" onClick={handleExportCSV}>
            <Download size={14} /> Export Records
          </button>
          <button
            className="rx-action-btn primary"
            onClick={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
          >
            <Plus size={18} /> New Prescription
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="rx-stats-row">
        <StatCard
          icon={ClipboardCheck}
          label="TOTAL PRESCRIPTIONS"
          value={loading ? "..." : stats.total}
          color="var(--primary)"
          trend={8}
        />
        <StatCard
          icon={Clock}
          label="PENDING"
          value={stats.pending}
          color="var(--warning)"
        />
        <StatCard
          icon={CheckCircle}
          label="FULFILLED"
          value={stats.fulfilled}
          color="var(--success)"
        />
        <StatCard
          icon={AlertCircle}
          label="CANCELLED"
          value={stats.cancelled}
          color="var(--danger)"
        />
      </div>

      {/* Table */}
      <PrescriptionsCRUDSection2
        setSearch={setSearch}
        setFilterStatus={setFilterStatus}
        setSelectedRx={setSelectedRx}
        search={search}
        filterStatus={filterStatus}
        loading={loading}
        filtered={filtered}
        setNotesEditTarget={setNotesEditTarget}
        handleFulfill={handleFulfill}
        processing={processing}
        setDeleteTarget={setDeleteTarget}
      />

      {/* Modals */}
      <AnimatePresence>
        {modalOpen && (
          <PrescriptionModal
            onClose={() => {
              setModalOpen(false);
              setEditTarget(null);
            }}
            onSave={handleSave}
            editData={editTarget}
            showToast={showToast}
            saving={false}
          />
        )}
        {selectedRx && (
          <PrescriptionViewModal
            rx={selectedRx}
            onClose={() => setSelectedRx(null)}
            onFulfill={handleFulfill}
            onVerify={handleVerify}
            onReject={handleReject}
            processing={processing}
            showToast={showToast}
          />
        )}
        {notesEditTarget && (
          <EditNotesModal
            rx={notesEditTarget}
            onClose={() => setNotesEditTarget(null)}
            onSave={handleSaveNotes}
            saving={notesSaving}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Prescription"
        message={`Are you sure you want to delete prescription "${deleteTarget?.id || deleteTarget?.rxNumber}"? This will remove the prescription record permanently.`}
        confirmText="Delete Prescription"
        loading={deleting}
        icon={Trash2}
      />
    </div>
  );
}
