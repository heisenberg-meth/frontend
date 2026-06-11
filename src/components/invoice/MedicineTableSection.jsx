import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Trash2,
  Plus,
  Loader2,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";
import { normalizeArrayResponse } from "../../utils/apiNormalizer";

// ─── Stable blank row factory ───────────────────────────────────────────────
let _rowId = 0;
const makeBlankRow = () => ({
  _id: ++_rowId, // stable local key (not the DB id)
  id: null, // medicine DB id
  name: "",
  searchVal: "",
  batchId: null,
  batchNumber: "",
  batches: [], // fetched batches for this medicine
  batchesLoading: false,
  qty: 1,
  price: 0,
  mrp: 0,
  gst: 0,
  discount: 0,
  stock: 0,
  expiryDate: "",
  isNew: true,
});

// ─── Per-row autocomplete hook ───────────────────────────────────────────────
function useAutocomplete() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  const search = useCallback((q) => {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(API_ROUTES.INVENTORY_MEDICINES_AUTOCOMPLETE, {
          params: { q: q.trim() },
        });
        const list = normalizeArrayResponse(res);
        setResults(Array.isArray(list) ? list : []);
        setOpen(true);
      } catch (err) {
        console.error("[Autocomplete] fetch error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 320);
  }, []);

  const clear = useCallback(() => {
    clearTimeout(timerRef.current);
    setQuery("");
    setResults([]);
    setOpen(false);
    setLoading(false);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { query, results, loading, open, setOpen, search, clear };
}

// ─── Single row component ────────────────────────────────────────────────────
function MedicineRow({
  item,
  idx,
  onUpdate,
  onRemove,
  showToast,
  theme = "light",
}) {
  const ac = useAutocomplete();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Measure input position to position portal dropdown correctly
  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 320),
      zIndex: 99999,
    });
  }, []);

  // Update position when dropdown opens
  useEffect(() => {
    if (ac.open) {
      updateDropdownPosition();
      // Re-measure on scroll/resize
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        window.removeEventListener("scroll", updateDropdownPosition, true);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [ac.open, updateDropdownPosition]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      const clickedInsideInput =
        inputRef.current && inputRef.current.contains(e.target);
      const clickedInsideDropdown =
        dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!clickedInsideInput && !clickedInsideDropdown) {
        ac.setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ac]);

  // Fetch batches when a medicine is chosen
  const fetchBatches = useCallback(
    async (medicineId) => {
      onUpdate(idx, "batchesLoading", true);
      try {
        const res = await api.get(`${API_ROUTES.INVENTORY_BATCHES}`, {
          params: { medicineId },
        });
        const raw = normalizeArrayResponse(res);
        // Filter out expired batches
        const today = new Date();
        const valid = (Array.isArray(raw) ? raw : []).filter((b) => {
          if (!b.expiryDate) return true;
          return new Date(b.expiryDate) > today;
        });
        onUpdate(idx, "batches", valid);
        // Auto-select first available batch
        if (valid.length > 0) {
          const first = valid[0];
          onUpdate(idx, "_batchSelect", {
            batchId: first.id || first._id || first.batchId,
            batchNumber: first.batchNumber || first.batch_number || "",
            expiryDate: first.expiryDate || "",
            stock: first.quantity ?? first.stock ?? first.availableQty ?? 0,
          });
        }
      } catch (err) {
        console.error("[Batches] fetch error:", err);
        showToast("Could not load batches for this medicine", "error");
        onUpdate(idx, "batches", []);
      } finally {
        onUpdate(idx, "batchesLoading", false);
      }
    },
    [idx, onUpdate, showToast],
  );

  // Handle medicine selection from autocomplete
  const selectMedicine = (med) => {
    ac.clear();
    const price = Number(
      med.price ?? med.mrp ?? med.salePrice ?? med.unitPrice ?? 0,
    );
    const gstVal = Number(
      med.gst ?? med.gstPercentage ?? med.gstRate ?? med.taxRate ?? 0,
    );
    const stockVal = Number(
      med.stock ?? med.quantity ?? med.availableStock ?? 0,
    );

    if (stockVal === 0) {
      showToast(`${med.name} is out of stock`, "warning");
    }

    onUpdate(idx, "_medicineSelect", {
      id: med.id || med._id,
      name: med.name,
      searchVal: med.name,
      price,
      mrp: price,
      gst: gstVal,
      stock: stockVal,
      batchId: med.batchId ?? null,
      batchNumber: med.batchNumber ?? "",
      expiryDate: med.expiryDate ?? "",
      batches: [],
      isNew: false,
      qty: 1,
      discount: 0,
    });

    // Fetch additional batches for this medicine
    const medicineId = med.id || med._id;
    if (medicineId) fetchBatches(medicineId);
  };

  // Handle batch select change
  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    const found = (item.batches || []).find(
      (b) => String(b.id || b._id || b.batchId) === String(batchId),
    );
    if (found) {
      onUpdate(idx, "_batchSelect", {
        batchId: found.id || found._id || found.batchId,
        batchNumber: found.batchNumber || found.batch_number || "",
        expiryDate: found.expiryDate || "",
        stock:
          found.quantity ?? found.stock ?? found.availableQty ?? item.stock,
        // Optionally override price from batch
        ...(found.mrp
          ? { price: Number(found.mrp), mrp: Number(found.mrp) }
          : {}),
      });
    }
  };

  // Keyboard navigation for dropdown
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      ac.setOpen(false);
      return;
    }
    if (!ac.open || ac.results.length === 0) return;
    const items = dropdownRef.current?.querySelectorAll("button[data-acitem]");
    if (!items || items.length === 0) return;
    const focused = dropdownRef.current.querySelector(
      "button[data-acitem]:focus",
    );
    const focusedIdx = focused ? Array.from(items).indexOf(focused) : -1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = items[(focusedIdx + 1) % items.length];
      next?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = items[(focusedIdx - 1 + items.length) % items.length];
      prev?.focus();
    } else if (e.key === "Enter" && focused) {
      e.preventDefault();
      focused.click();
    }
  };

  const rowAmount =
    (item.mrp || 0) * (item.qty || 1) * (1 - (item.discount || 0) / 100);
  const isSelected = !item.isNew && !!item.id;

  return (
    <div className="med-row" ref={containerRef}>
      {/* ── Medicine Search ── */}
      <div className="med-cell med-cell-name">
        <div className="med-search-wrap">
          <input
            ref={inputRef}
            type="text"
            className={`form-input ${isSelected ? "form-input-selected" : ""}`}
            placeholder="Search medicine..."
            value={isSelected ? item.name : ac.query}
            onChange={(e) => {
              if (isSelected) {
                // Clear selection to allow re-search
                onUpdate(idx, "_clearMedicine", null);
                ac.search(e.target.value);
              } else {
                ac.search(e.target.value);
              }
            }}
            onFocus={() => {
              if (!isSelected && ac.query.length >= 2) ac.setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />

          {/* Loading indicator */}
          {ac.loading && (
            <Loader2 className="med-search-spinner animate-spin" size={12} />
          )}
          {/* Selected indicator */}
          {isSelected && !ac.loading && (
            <CheckCircle2 className="med-search-check" size={12} />
          )}

          {/* Autocomplete dropdown — rendered via portal so it escapes overflow */}
          {ac.open &&
            (ac.results.length > 0 || (!ac.loading && ac.query.length >= 2)) &&
            createPortal(
              <div
                className="ac-dropdown-portal"
                ref={dropdownRef}
                style={dropdownStyle}
                data-theme={theme}
              >
                {ac.results.length > 0 ? (
                  ac.results.map((med, mi) => {
                    const medPrice = Number(med.price ?? med.mrp ?? 0);
                    const medStock = Number(med.stock ?? med.quantity ?? 0);
                    return (
                      <button
                        key={`${med.id || med._id}-${mi}`}
                        type="button"
                        data-acitem="true"
                        className="ac-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectMedicine(med)}
                      >
                        <div className="ac-item-left">
                          <div className="ac-item-name">{med.name}</div>
                          <div className="ac-item-meta">
                            {med.genericName && <span>{med.genericName}</span>}
                            {med.strength && <span> · {med.strength}</span>}
                            {med.batchNumber && (
                              <span> · Batch: {med.batchNumber}</span>
                            )}
                          </div>
                        </div>
                        <div className="ac-item-right">
                          <div className="ac-item-price">
                            ₹{medPrice.toFixed(2)}
                          </div>
                          <div
                            className={`ac-item-stock ${
                              medStock === 0
                                ? "ac-item-stock-zero"
                                : medStock < 10
                                  ? "ac-item-stock-low"
                                  : ""
                            }`}
                          >
                            {medStock === 0
                              ? "Out of stock"
                              : `Stock: ${medStock}`}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="ac-empty">
                    <AlertCircle size={14} />
                    No medicines found for "{ac.query}"
                  </div>
                )}
              </div>,
              document.body,
            )}
        </div>
      </div>

      {/* ── Batch Select ── */}
      <div className="med-cell med-cell-batch">
        {item.batchesLoading ? (
          <div className="med-batch-loading">
            <Loader2 size={12} className="animate-spin" /> Loading…
          </div>
        ) : (
          <select
            className="form-input"
            disabled={!isSelected || (item.batches || []).length === 0}
            value={item.batchId || ""}
            onChange={handleBatchChange}
          >
            {!isSelected && <option value="">— Select medicine first —</option>}
            {isSelected && (item.batches || []).length === 0 && (
              <option value={item.batchId || ""}>
                {item.batchNumber || "Default batch"}
              </option>
            )}
            {(item.batches || []).map((b) => {
              const bid = b.id || b._id || b.batchId;
              const bnum = b.batchNumber || b.batch_number || bid;
              const exp = b.expiryDate
                ? new Date(b.expiryDate).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "2-digit",
                  })
                : "";
              const qty = b.quantity ?? b.stock ?? b.availableQty ?? 0;
              return (
                <option key={bid} value={bid}>
                  {bnum}
                  {exp ? ` | Exp:${exp}` : ""} | Qty:{qty}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* ── Qty ── */}
      <div className="med-cell med-cell-qty">
        <input
          type="number"
          className="form-input text-center"
          min="1"
          max={item.stock || 9999}
          value={item.qty || 1}
          disabled={!isSelected}
          onChange={(e) => {
            const val = Math.max(1, Math.floor(Number(e.target.value) || 1));
            if (val > (item.stock || 9999)) {
              showToast(`Only ${item.stock} units in stock`, "warning");
              onUpdate(idx, "qty", item.stock);
            } else {
              onUpdate(idx, "qty", val);
            }
          }}
        />
      </div>

      {/* ── MRP ── */}
      <div className="med-cell med-cell-mrp">
        <input
          type="text"
          className="form-input text-right"
          readOnly
          value={`₹${Number(item.mrp || 0).toFixed(2)}`}
          tabIndex={-1}
        />
      </div>

      {/* ── Discount ── */}
      <div className="med-cell med-cell-disc">
        <input
          type="number"
          className="form-input text-center"
          min="0"
          max="100"
          step="0.5"
          placeholder="0"
          value={item.discount || ""}
          disabled={!isSelected}
          onChange={(e) => {
            const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
            onUpdate(idx, "discount", val);
          }}
        />
      </div>

      {/* ── GST ── */}
      <div className="med-cell med-cell-gst">
        <select
          className="form-input"
          value={item.gst || 0}
          disabled={!isSelected}
          onChange={(e) => onUpdate(idx, "gst", Number(e.target.value))}
        >
          <option value={0}>0%</option>
          <option value={5}>5%</option>
          <option value={12}>12%</option>
          <option value={18}>18%</option>
          <option value={28}>28%</option>
        </select>
      </div>

      {/* ── Amount ── */}
      <div className="med-cell med-cell-amount">
        <span className="med-amount-text">₹{rowAmount.toFixed(2)}</span>
      </div>

      {/* ── Delete ── */}
      <div className="med-cell med-cell-del">
        <button
          type="button"
          className="btn-row-delete"
          onClick={() => onRemove(idx)}
          title="Remove row"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export default function MedicineTableSection({
  lineItems,
  setLineItems,
  showToast,
  theme = "light",
}) {
  useEffect(() => {
    if (lineItems.length === 0) {
      setLineItems([makeBlankRow()]);
    }
  }, [lineItems.length, setLineItems]);

  const addRow = () => {
    setLineItems((prev) => [...prev, makeBlankRow()]);
  };

  const removeRow = (idx) => {
    setLineItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length === 0 ? [makeBlankRow()] : next;
    });
  };

  // Unified field updater — handles special composite updates
  const updateRow = useCallback(
    (idx, field, value) => {
      setLineItems((prev) =>
        prev.map((item, i) => {
          if (i !== idx) return item;
          if (field === "_medicineSelect") {
            // Full medicine selection payload
            return { ...item, ...value };
          }
          if (field === "_batchSelect") {
            // Batch selection payload
            return { ...item, ...value };
          }
          if (field === "_clearMedicine") {
            // Reset to blank row (keep _id stable)
            return { ...makeBlankRow(), _id: item._id };
          }
          return { ...item, [field]: value };
        }),
      );
    },
    [setLineItems],
  );

  return (
    <div className="invoice-card">
      {/* Header */}
      <div className="med-section-header">
        <div className="flex items-center gap-2">
          <div className="card-header-icon-wrapper">
            <ClipboardList size={14} className="stroke-[2.5]" />
          </div>
          <h3 className="card-header-title">Medicine Items</h3>
        </div>
        <button type="button" className="btn-add-row-teal" onClick={addRow}>
          <Plus size={13} className="stroke-[2.5]" /> Add Row
        </button>
      </div>

      {/* Column Headers */}
      <div className="med-table-head">
        <div className="med-col-header med-col-name">Medicine Name</div>
        <div className="med-col-header med-col-batch">Batch</div>
        <div className="med-col-header med-col-qty text-center">Qty</div>
        <div className="med-col-header med-col-mrp text-right">MRP</div>
        <div className="med-col-header med-col-disc text-center">Disc%</div>
        <div className="med-col-header med-col-gst text-center">GST</div>
        <div className="med-col-header med-col-amount text-right">Amount</div>
        <div className="med-col-header med-col-del" />
      </div>

      {/* Rows */}
      <div className="medicine-rows-container">
        {lineItems.map((item, idx) => (
          <MedicineRow
            key={item._id ?? idx}
            item={item}
            idx={idx}
            onUpdate={updateRow}
            onRemove={removeRow}
            showToast={showToast}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}
