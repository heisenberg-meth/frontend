import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Truck,
  AlertCircle,
  Search,
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
  ChevronDown,
  Check,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { TableHeader } from "../common/TableHeader.jsx";

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
const EMPTY = {
  name: "",
  contact: "",
  phone: "",
  email: "",
  gst: "",
  rating: 5,
  categories: [],
  paymentTerms: "Net 30",
  leadTime: "1 week",
};

const getPaymentTermsStr = (days) => {
  const entry = Object.entries(PAYMENT_TERMS_MAP).find(([, v]) => v === days);
  return entry ? entry[0] : "Net 30";
};
const getLeadTimeStr = (days) => {
  const entry = Object.entries(LEAD_TIME_MAP).find(([, v]) => v === days);
  return entry ? entry[0] : "2 days";
};
const getInitials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ─── Tag Input ─── */
function TagInput({ tags = [], onChange }) {
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
    <div
      style={{
        position: "relative",
      }}
      ref={wrapRef}
    >
      <div
        className={`sup-tag-input-wrap ${focused ? "focused" : ""}`}
        onClick={() => wrapRef.current?.querySelector("input")?.focus()}
      >
        {tags.map((tag) => (
          <span key={tag} className="sup-tag-chip">
            {tag}
            <button
              aria-label="Close"
              className="sup-tag-chip-remove"
              onClick={() => removeTag(tag)}
              type="button"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <>
          <label htmlFor="field_hgm7g5" className="sr-only">
            {tags.length === 0 ? "Type and press Enter…" : ""}
          </label>
          <input
            required
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
            id="field_hgm7g5"
          />
        </>
      </div>
      {suggestions.length > 0 && (
        <div className="sup-tag-suggestions">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s}
              className="sup-tag-suggestion-item"
              onMouseDown={() => addTag(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const handleMouseMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
};
function CustomDropdown({ value, onChange, options, placeholder = "Select" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);
  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const estimatedMenuHeight = Math.min(options.length * 42 + 16, 300);
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward =
        spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
      setMenuStyle({
        position: "fixed",
        top: openUpward ? "auto" : `${rect.bottom + 8}px`,
        bottom: openUpward ? `${window.innerHeight - rect.top + 8}px` : "auto",
        right: `${window.innerWidth - rect.right}px`,
        width: `${Math.max(rect.width, 148)}px`,
        zIndex: 99999,
      });
    }
    setIsOpen((prev) => !prev);
  };
  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      <button
        ref={buttonRef}
        className="custom-dropdown-trigger"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        type="button"
      >
        <span>{value === "All Categories" ? placeholder : value}</span>

        <ChevronDown
          size={16}
          className={`dropdown-icon ${isOpen ? "open" : ""}`}
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <m.div
              ref={menuRef}
              className="custom-dropdown-menu"
              initial={{
                opacity: 0,
                y: menuStyle.bottom !== "auto" ? 10 : -10,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: menuStyle.bottom !== "auto" ? 10 : -10,
                scale: 0.95,
              }}
              transition={{
                duration: 0.15,
              }}
              role="listbox"
              style={menuStyle}
            >
              {options.map((opt) => {
                const optValue = typeof opt === "object" ? opt.value : opt;
                const optLabel = typeof opt === "object" ? opt.label : opt;
                return (
                  <div
                    key={optValue}
                    className={`custom-dropdown-item ${value === optValue ? "selected" : ""}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                    onClick={() => {
                      onChange(optValue);
                      setIsOpen(false);
                    }}
                    role="option"
                    aria-selected={value === optValue}
                    tabIndex={0}
                  >
                    <span>{optLabel}</span>

                    {value === optValue && (
                      <Check size={14} className="check-icon" />
                    )}
                  </div>
                );
              })}
            </m.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
function SupplierActionMenu({
  supplier,
  handleView,
  setEditTarget,
  setModalOpen,
  handleToggleStatus,
  navigate,
  handleDelete,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);
  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isBottomClipped = rect.bottom + 220 > window.innerHeight; // approx menu height

      setMenuStyle({
        top: isBottomClipped ? "auto" : rect.bottom + 8,
        bottom: isBottomClipped ? window.innerHeight - rect.top + 8 : "auto",
        right: window.innerWidth - rect.right,
        width: "160px",
        zIndex: 99999,
      });
    }
    setIsOpen(!isOpen);
  };
  return (
    <div className="custom-dropdown-container">
      <button
        aria-label="Actions"
        ref={buttonRef}
        className="sup-row-btn"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <m.div
              ref={menuRef}
              className="custom-dropdown-menu"
              initial={{
                opacity: 0,
                y: menuStyle.bottom !== "auto" ? 10 : -10,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: menuStyle.bottom !== "auto" ? 10 : -10,
                scale: 0.95,
              }}
              transition={{
                duration: 0.15,
              }}
              role="menu"
              style={{
                ...menuStyle,
                position: "fixed",
              }}
            >
              <button
                type="button"
                className="custom-dropdown-item"
                onClick={() => {
                  setIsOpen(false);
                  handleView(supplier);
                }}
              >
                <Eye
                  size={14}
                  style={{
                    marginRight: "8px",
                  }}
                />{" "}
                View Details
              </button>
              <button
                type="button"
                className="custom-dropdown-item"
                onClick={() => {
                  setIsOpen(false);
                  setEditTarget(supplier);
                  setModalOpen(true);
                }}
              >
                <Pencil
                  size={14}
                  style={{
                    marginRight: "8px",
                  }}
                />{" "}
                Edit Profile
              </button>
              <button
                type="button"
                className="custom-dropdown-item"
                onClick={() => {
                  setIsOpen(false);
                  handleToggleStatus(supplier);
                }}
              >
                {(supplier.status || "").toLowerCase() === "active" ? (
                  <ToggleLeft
                    size={14}
                    style={{
                      marginRight: "8px",
                    }}
                  />
                ) : (
                  <ToggleRight
                    size={14}
                    style={{
                      marginRight: "8px",
                    }}
                  />
                )}
                {(supplier.status || "").toLowerCase() === "active"
                  ? "Deactivate"
                  : "Activate"}
              </button>
              <button
                type="button"
                className="custom-dropdown-item"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/purchases", {
                    state: {
                      action: "raise-po",
                      supplierId: supplier.id,
                    },
                  });
                }}
              >
                <ClipboardList
                  size={14}
                  style={{
                    marginRight: "8px",
                  }}
                />{" "}
                Raise PO
              </button>
              <button
                type="button"
                className="custom-dropdown-item"
                onClick={() => {
                  setIsOpen(false);
                  handleDelete(supplier.id, supplier.name);
                }}
                style={{
                  color: "var(--danger)",
                }}
              >
                <Trash2
                  size={14}
                  style={{
                    marginRight: "8px",
                  }}
                />{" "}
                Delete
              </button>
            </m.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
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

/* ─── Add / Edit Modal ─── */
function SupplierModal({ onClose, onSave, editData, showToast, saving }) {
  const initialForm = editData
    ? {
        ...EMPTY,
        ...editData,
        status: (editData.status || "active").toLowerCase(),
        contact: editData.contact || editData.contactPerson || "",
        categories: editData.categories || editData.drugCategories || [],
        gst: editData.gst || editData.gstNumber || "",
        paymentTerms:
          editData.paymentTerms ||
          getPaymentTermsStr(editData.paymentTermsDays),
        leadTime: editData.leadTime || getLeadTimeStr(editData.leadTimeDays),
      }
    : EMPTY;
  const [form, setForm] = useState(initialForm);
  const set = (key, val) =>
    setForm((f) => ({
      ...f,
      [key]: val,
    }));
  const handleSave = () => {
    if (
      !(form.name || "").trim() ||
      !(form.contact || "").trim() ||
      !(form.phone || "").trim()
    ) {
      showToast("Supplier Name, Contact, and Phone are required.", "error");
      return;
    }
    onSave(form);
  };
  return (
    <div className="modal-overlay">
      <m.div
        className="modal-content sup-modal-wide"
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
      >
        <div className="modal-header">
          <div className="header-title-group">
            <Building2
              size={20}
              style={{
                color: "var(--primary)",
              }}
            />
            <h3>{editData ? "Edit Supplier" : "Add New Supplier"}</h3>
          </div>
          <button
            aria-label="Close"
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-scroll-area">
          <div className="sup-form-grid">
            <div className="form-group full">
              <label htmlFor="field_kccb3o">Supplier Legal Name *</label>
              <input
                id="field_kccb3o"
                required
                placeholder="e.g. Cipla Distributors Ltd."
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="field_3tymdv">Contact Person *</label>
              <input
                id="field_3tymdv"
                required
                placeholder="e.g. Ramesh Kumar"
                value={form.contact}
                onChange={(e) => set("contact", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="field_im11hx">Phone Number *</label>
              <input
                id="field_im11hx"
                required
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="field_71ejw4">Email Address</label>
              <input
                id="field_71ejw4"
                type="email"
                placeholder="contact@supplier.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="field_cto0qm">GSTIN Number</label>
              <input
                id="field_cto0qm"
                placeholder="27AAPFC1234M1ZL"
                value={form.gst}
                onChange={(e) => set("gst", e.target.value)}
              />
            </div>
            <div className="form-group full">
              <span>Medicine Categories</span>
              <TagInput
                tags={form.categories || []}
                onChange={(cats) => set("categories", cats)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="field_d8qj9b">Avg. Lead Time</label>
              <select
                id="field_d8qj9b"
                className="pos-input"
                value={form.leadTime}
                onChange={(e) => set("leadTime", e.target.value)}
              >
                {["1 day", "2 days", "3 days", "1 week", "2 weeks"].map(
                  (opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="field_sx44qa">Payment Terms</label>
              <select
                id="field_sx44qa"
                className="pos-input"
                value={form.paymentTerms}
                onChange={(e) => set("paymentTerms", e.target.value)}
              >
                {["Net 15", "Net 30", "Net 45", "Advance"].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="field_anj6y9">Status</label>
              <select
                id="field_anj6y9"
                className="pos-input"
                value={(form.status || "active").toLowerCase()}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className="form-group full">
              <label htmlFor="field_ogvuge">Address</label>
              <textarea
                id="field_ogvuge"
                placeholder="Complete address details…"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                style={{
                  minHeight: "80px",
                }}
              />
            </div>
            <div className="form-group full">
              <label htmlFor="field_07bky4">Operational Notes</label>
              <textarea
                id="field_07bky4"
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
      </m.div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export function SuppliersSection1({ loading, suppliers }) {
  return (
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
          {
            suppliers.filter((s) => (s.status || "").toLowerCase() === "active")
              .length
          }
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
          {
            suppliers.filter(
              (s) => (s.status || "").toLowerCase() === "inactive",
            ).length
          }
        </div>
      </div>
    </div>
  );
}
export function SuppliersSection2({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  loading,
  filtered,
  handleView,
  setEditTarget,
  setModalOpen,
  handleToggleStatus,
  navigate,
  handleDelete,
}) {
  return (
    <div className="sup-table-card">
      <div className="sup-table-header">
        <div className="sup-search-box">
          <Search size={18} className="search-icon" />
          <>
            <label htmlFor="field_ejrx9j" className="sr-only">
              Search by name, contact, or category...
            </label>
            <input
              placeholder="Search by name, contact, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="field_ejrx9j"
            />
          </>
        </div>
        <div className="sup-filter-group">
          <CustomDropdown
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={["All Categories", ...DRUG_OPTIONS]}
            placeholder="All Categories"
          />
        </div>
      </div>

      <div className="sup-table-wrapper">
        <table className="sup-table">
          <TableHeader
            columns={[
              "SUPPLIER IDENTITY",
              "CONTACT PERSON",
              "PHONE",
              "DRUG SPECIALTIES",
              "PAYMENT TERMS",
              "STATUS",
              "ACTIONS",
            ]}
          />
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
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
                  colSpan={7}
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
                    </div>
                  </td>
                  <td>
                    <span className="sup-phone">{s.phone || "—"}</span>
                  </td>
                  <td>
                    <div className="sup-tag-list">
                      {(s.drugCategories || s.categories || [])
                        .slice(0, 2)
                        .map((c, i) => (
                          <span
                            key={`${s.id || s.name}-cat-${c}-${i}`}
                            className="sup-tag-v2"
                          >
                            {c}
                          </span>
                        ))}
                      {(s.drugCategories || s.categories || []).length > 2 && (
                        <span className="sup-tag-more">
                          +{(s.drugCategories || s.categories || []).length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="sup-lead-time">
                      {s.paymentTerms ||
                        (s.paymentTermsDays !== undefined
                          ? s.paymentTermsDays === 0
                            ? "Advance"
                            : `Net ${s.paymentTermsDays}`
                          : "—")}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`sup-status-badge ${(s.status || "active").toLowerCase()}`}
                    >
                      <div className="status-dot" />
                      {(s.status || "active").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="sup-row-actions">
                      <SupplierActionMenu
                        supplier={s}
                        handleView={handleView}
                        setEditTarget={setEditTarget}
                        setModalOpen={setModalOpen}
                        handleToggleStatus={handleToggleStatus}
                        navigate={navigate}
                        handleDelete={handleDelete}
                      />
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

export function SuppliersSection3({
  modalOpen,
  setModalOpen,
  handleSave,
  editTarget,
  setEditTarget,
  showToast,
  saving,
  viewTarget,
  setViewTarget,
  creditBalance,
}) {
  return (
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
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setViewTarget(null)}
        >
          <m.div
            role="presentation"
            className="modal-content sup-view-modal"
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
            style={{
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div className="modal-header">
              <div className="flex items-start gap-5">
                <div className="sup-avatar large w-20! h-20! text-[24px]!">
                  {getInitials(viewTarget.name)}
                </div>
                <div className="flex-1">
                  <h3 className="text-[28px] font-black text-on-surface mb-2 leading-tight">
                    {viewTarget.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`sup-status-badge ${(viewTarget.status || "active").toLowerCase()}`}
                    >
                      <div className="status-dot" />
                      {(viewTarget.status || "active").toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  aria-label="Close"
                  className="modal-close-btn"
                  onClick={() => setViewTarget(null)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div
              className="modal-scroll-area p-8"
              style={{
                overflowY: "auto",
                flex: 1,
              }}
            >
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="detail-item">
                  <span>Primary Contact</span>
                  <span>
                    {viewTarget.contactPerson || viewTarget.contact || "—"}
                  </span>
                </div>
                <div className="detail-item">
                  <span>Phone Number</span>
                  <span>{viewTarget.phone || "—"}</span>
                </div>
                <div className="detail-item">
                  <span>Email Address</span>
                  <span>{viewTarget.email || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span>GSTIN Number</span>
                  <span className="font-mono text-primary">
                    {viewTarget.gstNumber || viewTarget.gst || "N/A"}
                  </span>
                </div>
                <div className="detail-item">
                  <span>Payment Terms</span>
                  <span>
                    {viewTarget.paymentTerms ??
                      (viewTarget.paymentTermsDays === 0
                        ? "Advance"
                        : viewTarget.paymentTermsDays
                          ? `Net ${viewTarget.paymentTermsDays}`
                          : "Net 30 (Default)")}
                  </span>
                </div>
                <div className="detail-item">
                  <span>Lead Time</span>
                  <span>
                    {viewTarget.leadTime ??
                      (viewTarget.leadTimeDays
                        ? `${viewTarget.leadTimeDays} Day${viewTarget.leadTimeDays > 1 ? "s" : ""}`
                        : "Not Configured")}
                  </span>
                </div>
                <div className="detail-item">
                  <span>Drug Specialties</span>
                  <span>
                    {(viewTarget.drugCategories || viewTarget.categories || [])
                      .length > 0
                      ? (
                          viewTarget.drugCategories ||
                          viewTarget.categories ||
                          []
                        ).join(", ")
                      : "—"}
                  </span>
                </div>
                <div className="detail-item">
                  <span>Available Credit</span>
                  <span className="font-bold text-green-500">
                    {creditBalance === null
                      ? "Loading..."
                      : `₹${creditBalance.toFixed(2)}`}
                  </span>
                </div>
                <div className="detail-item col-span-2">
                  <span>Address</span>
                  <span
                    style={{
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {viewTarget.address || "Not Provided"}
                  </span>
                </div>
                <div className="detail-item col-span-2">
                  <span>Operational Notes</span>
                  <span
                    style={{
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {viewTarget.notes || "No operational notes available."}
                  </span>
                </div>
                <div className="detail-item">
                  <span>Created On</span>
                  <span>
                    {viewTarget.createdAt
                      ? new Date(viewTarget.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="detail-item">
                  <span>Last Updated</span>
                  <span>
                    {viewTarget.updatedAt
                      ? new Date(viewTarget.updatedAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                borderTop: "1px solid var(--overlay-04)",
              }}
            >
              <button
                className="modal-btn cancel"
                onClick={() => setViewTarget(null)}
              >
                Close
              </button>
              <button
                className="modal-btn confirm"
                onClick={() => {
                  setEditTarget(viewTarget);
                  setViewTarget(null);
                  setModalOpen(true);
                }}
              >
                <Pencil size={16} /> Edit Profile
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
