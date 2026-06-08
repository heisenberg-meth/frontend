import { useState, useRef, useMemo, useEffect , useCallback} from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  AlertCircle,
  Plus,
  Search,
  Download,
  X,
  Eye,
  Pencil,
  ClipboardList,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  ShieldCheck,
  Trash2,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/suppliers.service";
function Spinner({ size = 14 }) {
  return (
    <Loader2 size={size} style={{ animation: "spin 0.8s linear infinite" }} />
  );
}

const DRUG_OPTIONS = [
  "Antibiotics",
  "Analgesics",
  "Cardiac",
  "Diabetes",
  "General OTC",
  "Oncology",
  "Pediatrics",
  "Dermatology",
  "Neurology",
  "Vitamins",
  "Vaccines",
];

const getInitials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ─── Tag Input ─── */
function TagInput({ tags, onChange }) {
  const [inputVal, setInputVal] = useState("");
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapRef = useRef(null);

  const suggestions =
    inputVal.length > 0 && showSuggestions
      ? DRUG_OPTIONS.filter(
          (o) =>
            o.toLowerCase().includes(inputVal.toLowerCase()) &&
            !tags.includes(o),
        )
      : [];

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInputVal("");
    setShowSuggestions(false);
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      addTag(inputVal);
    }
    if (e.key === "Backspace" && !inputVal && tags.length)
      removeTag(tags[tags.length - 1]);
  };

  return (
    <div style={{ position: "relative" }} ref={wrapRef}>
      <div
        className={`sup-tag-input-wrap ${focused ? "focused" : ""}`}
        onClick={() => wrapRef.current?.querySelector("input")?.focus()}
      >
        {tags.map((tag) => (
          <span key={tag} className="sup-tag-chip">
            {tag}
            <button
              className="sup-tag-chip-remove"
              onClick={() => removeTag(tag)}
              type="button"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          className="sup-tag-inner-input"
          value={inputVal}
          placeholder={tags.length === 0 ? "Type and press Enter…" : ""}
          onChange={(e) => {
            setInputVal(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKey}
          onFocus={() => {
            setFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => setShowSuggestions(false), 150);
          }}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="sup-tag-suggestions">
          {suggestions.map((s) => (
            <div
              key={s}
              className="sup-tag-suggestion-item"
              onMouseDown={() => addTag(s)}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Add / Edit Modal ─── */
function SupplierModal({ onClose, onSave, editData, showToast, saving }) {
  const EMPTY = {
    name: "",
    contact: "",
    phone: "",
    email: "",
    gst: "",
    categories: [],
    leadTime: "2 days",
    paymentTerms: "Net 30",
    notes: "",
    status: "active",
  };
  const [form, setForm] = useState(editData || EMPTY);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.name.trim() || !form.contact.trim() || !form.phone.trim()) {
      showToast("Supplier Name, Contact, and Phone are required.", "error");
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <motion.div
        className="modal-content sup-modal-wide"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
      >
        <div className="modal-header">
          <div className="header-title-group">
            <Building2 size={20} style={{ color: "var(--primary)" }} />
            <h3>{editData ? "Edit Supplier" : "Add New Supplier"}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-scroll-area">
          <div className="sup-form-grid">
            <div className="form-group full">
              <label>Supplier Legal Name *</label>
              <input
                placeholder="e.g. Cipla Distributors Ltd."
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Contact Person *</label>
              <input
                placeholder="e.g. Ramesh Kumar"
                value={form.contact}
                onChange={(e) => set("contact", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="contact@supplier.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>GSTIN Number</label>
              <input
                placeholder="27AAPFC1234M1ZL"
                value={form.gst}
                onChange={(e) => set("gst", e.target.value)}
              />
            </div>
            <div className="form-group full">
              <label>Medicine Categories</label>
              <TagInput
                tags={form.categories}
                onChange={(cats) => set("categories", cats)}
              />
            </div>
            <div className="form-group">
              <label>Avg. Lead Time</label>
              <select
                value={form.leadTime}
                onChange={(e) => set("leadTime", e.target.value)}
              >
                {["1 day", "2 days", "3 days", "1 week", "2 weeks"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Payment Terms</label>
              <select
                value={form.paymentTerms}
                onChange={(e) => set("paymentTerms", e.target.value)}
              >
                {["Net 15", "Net 30", "Net 45", "Advance"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="form-group full">
              <label>Operational Notes</label>
              <textarea
                placeholder="Any additional notes…"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="modal-btn confirm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner size={16} /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Save Supplier
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function Suppliers({ showToast }) {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

      const data =
        res.data.data || res.data;

      setSuppliers(
        Array.isArray(data) ? data : []
      );
    } catch {
      if (mounted) {
        showToast(
          "Failed to load suppliers",
          "error"
        );
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
    return suppliers.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.contactPerson || s.contact || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (s.drugCategories || s.categories || []).some((c) =>
          c.toLowerCase().includes(search.toLowerCase()),
        ),
    );
  }, [suppliers, search]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        contactPerson: form.contact,
        phone: form.phone,
        email: form.email,
        gstNumber: form.gst,
        drugCategories: form.categories,
        paymentTerms: form.paymentTerms.toLowerCase().replace("net-", "net-"),
        notes: form.notes,
        status: form.status,
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
        err.response?.data?.error || "Failed to save supplier",
        "error",
      );
    } finally {
      setSaving(false);
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
    const headers = [
      "Name",
      "Contact",
      "Phone",
      "Email",
      "GST",
      "LeadTime",
      "Reliability",
    ];
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
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suppliers_export.csv";
    a.click();
    showToast("Supplier data exported", "success");
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
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

      <div className="sup-stats-row">
        <div className="sup-stat-card-v2" onMouseMove={handleMouseMove}>
          <div className="sup-stat-header">
            <span className="sup-stat-label">TOTAL VENDORS</span>
            <div className="sup-stat-icon bg-primary/10 text-primary">
              <Truck size={14} />
            </div>
          </div>
          <div className="flex items-center">
            <div className="sup-stat-value text-primary">
              {loading ? "..." : suppliers.length}
            </div>
            <div className="sup-stat-trend">
              <TrendingUp size={10} /> <span>4%</span>
            </div>
          </div>
        </div>
        <div className="sup-stat-card-v2" onMouseMove={handleMouseMove}>
          <div className="sup-stat-header">
            <span className="sup-stat-label">ACTIVE</span>
            <div className="sup-stat-icon bg-blue-500/10 text-blue-400">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="sup-stat-value text-blue-400">
            {suppliers.filter((s) => s.status === "active").length}
          </div>
        </div>
        <div className="sup-stat-card-v2" onMouseMove={handleMouseMove}>
          <div className="sup-stat-header">
            <span className="sup-stat-label">PENDING POs</span>
            <div className="sup-stat-icon bg-yellow-500/10 text-yellow-500">
              <Clock size={14} />
            </div>
          </div>
          <div className="flex items-center">
            <div className="sup-stat-value text-yellow-500">4</div>
            <div className="sup-stat-trend">
              <TrendingUp size={10} /> <span>2%</span>
            </div>
          </div>
        </div>
        <div className="sup-stat-card-v2" onMouseMove={handleMouseMove}>
          <div className="sup-stat-header">
            <span className="sup-stat-label">INACTIVE</span>
            <div className="sup-stat-icon bg-rose-500/10 text-rose-500">
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="sup-stat-value text-rose-500">
            {suppliers.filter((s) => s.status === "inactive").length}
          </div>
        </div>
      </div>

      <div className="sup-table-card">
        <div className="sup-table-header">
          <div className="sup-search-box">
            <Search size={18} className="search-icon" />
            <input
              placeholder="Search by name, contact, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sup-filter-group">
            <select className="sup-select-filter">
              <option>All Categories</option>
              {DRUG_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sup-table-wrapper">
          <table className="sup-table">
            <thead>
              <tr>
                <th>SUPPLIER IDENTITY</th>
                <th>CONTACT DETAILS</th>
                <th>DRUG SPECIALTIES</th>
                <th>PAYMENT TERMS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--text-dim)",
                    }}
                  >
                    <Spinner size={20} /> Loading suppliers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--text-dim)",
                    }}
                  >
                    No suppliers found. Register your first supplier →
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                   <tr key={s.id}>
                    <td>
                      <div className="sup-identity">
                        <div className="sup-avatar">{getInitials(s.name)}</div>
                        <div className="sup-info">
                          <span className="sup-name">{s.name}</span>
                          <span className="sup-gst">
                            {s.gstNumber || s.gst || "GST Pending"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="sup-contact-info">
                        <span className="sup-person">
                          {s.contactPerson || s.contact || "—"}
                        </span>
                        <span className="sup-phone">{s.phone || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="sup-tag-list">
                        {(s.drugCategories || s.categories || [])
                          .slice(0, 2)
                          .map((c, i) => (
                            <span key={i} className="sup-tag-v2">
                              {c}
                            </span>
                          ))}
                        {(s.drugCategories || s.categories || []).length >
                          2 && (
                          <span className="sup-tag-more">
                            +
                            {(s.drugCategories || s.categories || []).length -
                              2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="sup-lead-time">
                        {s.paymentTerms || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`sup-status-badge ${s.status}`}>
                        <div className="status-dot" />
                        {(s.status || "active").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="sup-row-actions">
                        <button
                          className="sup-row-btn"
                          title="View Details"
                          onClick={() => setViewTarget(s)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="sup-row-btn"
                          title="Edit Profile"
                          onClick={() => {
                            setEditTarget(s);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="sup-row-btn active"
                          title="Raise PO"
                          onClick={() => navigate("/purchases")}
                        >
                          <ClipboardList size={14} />
                        </button>
                        <button
                          className="sup-row-btn danger"
                          title="Delete"
                           onClick={() => handleDelete(s.id, s.name)}
                        >
                          <Trash2 size={14} />
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

      <AnimatePresence>
        {modalOpen && (
          <SupplierModal
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            editData={editTarget}
            showToast={showToast}
            saving={saving}
          />
        )}
        {viewTarget && (
          <div className="modal-overlay" onClick={() => setViewTarget(null)}>
            <motion.div
              className="modal-content sup-view-modal p-8"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-5 mb-8">
                <div className="sup-avatar large !w-20 !h-20 !text-[24px]">
                  {getInitials(viewTarget.name)}
                </div>
                <div className="flex-1">
                  <h3 className="text-[28px] font-black text-on-surface mb-2 leading-tight">
                    {viewTarget.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`sup-status-badge ${viewTarget.status}`}>
                      <div className="status-dot" />
                      {(viewTarget.status || "active").toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setViewTarget(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="detail-item">
                  <label>Primary Contact</label>
                  <span>
                    {viewTarget.contactPerson || viewTarget.contact || "—"}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Phone Number</label>
                  <span>{viewTarget.phone || "—"}</span>
                </div>
                <div className="detail-item">
                  <label>Email Address</label>
                  <span>{viewTarget.email || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <label>Payment Terms</label>
                  <span>{viewTarget.paymentTerms || "—"}</span>
                </div>
                <div className="detail-item">
                  <label>GSTIN Number</label>
                  <span className="font-mono text-primary">
                    {viewTarget.gstNumber || viewTarget.gst || "N/A"}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Lead Time</label>
                  <span>{viewTarget.leadTime || "—"}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  className="modal-btn cancel flex-1"
                  onClick={() => setViewTarget(null)}
                >
                  Close
                </button>
                <button
                  className="modal-btn confirm flex-1"
                  onClick={() => {
                    setEditTarget(viewTarget);
                    setViewTarget(null);
                    setModalOpen(true);
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
