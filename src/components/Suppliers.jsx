import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/suppliers.service.js";
import { getSupplierCreditBalance } from "../services/supplier-returns.service.js";
import {
  SuppliersSection1,
  SuppliersSection2,
  SuppliersSection3,
} from "./Supplier/Suppliers.jsx";

const headers = [
  "Name",
  "Contact",
  "Phone",
  "Email",
  "GST",
  "LeadTime",
  "Reliability",
];

const PAYMENT_TERMS_MAP = {
  "Net 15": 15,
  "Net 30": 30,
  "Net 45": 45,
  Advance: 0,
};
const LEAD_TIME_MAP = {
  "1 day": 1,
  "2 days": 2,
  "3 days": 3,
  "1 week": 7,
  "2 weeks": 14,
};

export default function Suppliers({ showToast }) {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [creditBalance, setCreditBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const handleView = (s) => {
    setCreditBalance(null);
    setViewTarget(s);
  };
  useEffect(() => {
    if (viewTarget) {
      getSupplierCreditBalance(viewTarget.id)
        .then((res) => setCreditBalance(res.data.balance || 0))
        .catch(() => setCreditBalance(0));
    }
  }, [viewTarget]);
  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSuppliers();
      const data = res.data.data || res.data;
      setSuppliers(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load suppliers", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        setLoading(true);
        const res = await getSuppliers();
        if (!mounted) return;
        const data = res.data.data || res.data;
        setSuppliers(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) {
          showToast("Failed to load suppliers", "error");
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
    return suppliers.filter((s) => {
      const matchSearch =
        (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.contactPerson || s.contact || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (s.drugCategories || s.categories || []).some((c) =>
          c.toLowerCase().includes(search.toLowerCase()),
        );
      const matchCategory =
        categoryFilter === "All Categories" ||
        (s.drugCategories || s.categories || []).some(
          (c) => c === categoryFilter,
        );
      return matchSearch && matchCategory;
    });
  }, [suppliers, search, categoryFilter]);
  const handleSave = async (form) => {
    setSaving(true);
    try {
      const cleanPhone = (form.phone || "").replace(/[\s\-+()]/g, "");
      const payload = {
        name: form.name,
        contactPerson: form.contact || undefined,
        phone: cleanPhone.length >= 10 ? form.phone : undefined,
        email: form.email || undefined,
        gstNumber: form.gst || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        drugCategories: form.categories || [],
        paymentTermsDays: PAYMENT_TERMS_MAP[form.paymentTerms] ?? 30,
        leadTimeDays: LEAD_TIME_MAP[form.leadTime] ?? 7,
        status: (form.status || "active").toUpperCase(),
      };
      if (editTarget) {
        await updateSupplier(editTarget.id, payload);
        showToast("Supplier profile updated ✓", "success");
      } else {
        await createSupplier(payload);
        showToast("New supplier registered ✓", "success");
      }
      await loadSuppliers();
      setModalOpen(false);
      setEditTarget(null);
    } catch (err) {
      showToast(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save supplier",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };
  const handleToggleStatus = async (supplier) => {
    const isCurrentlyActive =
      (supplier.status || "").toLowerCase() === "active";
    const nextStatus = isCurrentlyActive ? "INACTIVE" : "ACTIVE";
    try {
      await updateSupplier(supplier.id, {
        status: nextStatus,
      });
      showToast(
        `Supplier status updated to ${nextStatus.toLowerCase()} ✓`,
        "success",
      );
      await loadSuppliers();
    } catch (err) {
      showToast(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to toggle supplier status",
        "error",
      );
    }
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteSupplier(id);
      showToast("Supplier deleted", "success");
      await loadSuppliers();
    } catch (err) {
      showToast(
        err.response?.data?.error || "Failed to delete supplier",
        "error",
      );
    }
  };
  const exportCSV = () => {
    const rows = suppliers.map((s) => [
      s.name,
      s.contactPerson || s.contact || "",
      s.phone,
      s.email,
      s.gstNumber || s.gst || "",
      s.leadTime || "",
      "",
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suppliers_export.csv";
    a.click();
    showToast("Supplier data exported", "success");
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  };
  return (
    <div className="sup-container">
      <div className="sup-header">
        <div className="sup-title-group">
          <h2>Supplier Ecosystem</h2>
          <p>
            Manage global pharmaceutical procurement and monitor vendor
            reliability
          </p>
        </div>
        <div className="sup-header-actions">
          <button className="sup-action-btn secondary" onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button
            className="sup-action-btn primary"
            onClick={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
          >
            <Plus size={20} /> Register Supplier
          </button>
        </div>
      </div>

      <SuppliersSection1 loading={loading} suppliers={suppliers} />

      <SuppliersSection2
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        loading={loading}
        filtered={filtered}
        handleView={handleView}
        setEditTarget={setEditTarget}
        setModalOpen={setModalOpen}
        handleToggleStatus={handleToggleStatus}
        navigate={navigate}
        handleDelete={handleDelete}
      />

      <SuppliersSection3
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        handleSave={handleSave}
        editTarget={editTarget}
        setEditTarget={setEditTarget}
        showToast={showToast}
        saving={saving}
        viewTarget={viewTarget}
        setViewTarget={setViewTarget}
        creditBalance={creditBalance}
      />
    </div>
  );
}
