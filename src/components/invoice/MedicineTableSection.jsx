import { useState, useEffect, useRef } from "react";
import { Search, Trash2, Plus, Minus, Package, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";
import { normalizeArrayResponse } from "../../utils/apiNormalizer";

export default function MedicineTableSection({
  lineItems,
  setLineItems,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [medResults, setMedResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Debounced search for medicines
  useEffect(() => {
    if (searchQuery.length < 2) return;

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(
          API_ROUTES.INVENTORY_MEDICINES_AUTOCOMPLETE,
          { params: { q: searchQuery } }
        );
        const results = normalizeArrayResponse(res);
        setMedResults(results);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addMedicine = (med) => {
    if (med.stock === 0) {
      showToast("Item is out of stock", "error");
      return;
    }
    if (!med.batchId) {
      showToast("No active batch available for this medicine", "error");
      return;
    }

    setLineItems((prev) => {
      const exists = prev.find((i) => i.id === med.id && i.batchId === med.batchId);
      if (exists) {
        if (exists.qty + 1 > med.stock) {
          showToast(`Only ${med.stock} units available in this batch`, "error");
          return prev;
        }
        return prev.map((i) =>
          i.id === med.id && i.batchId === med.batchId ? { ...i, qty: i.qty + 1 } : i
        );
      }

      const price = Number(med.price || med.mrp || med.salePrice || 0);
      const gstVal = Number(med.gst || med.gstPercentage || med.gstRate || 0);
      return [
        ...prev,
        {
          id: med.id,
          name: med.name,
          batchId: med.batchId,
          batchNumber: med.batchNumber || "B-NEW",
          qty: 1,
          price: price,
          mrp: price,
          gst: gstVal,
          stock: med.stock,
          expiryDate: med.expiryDate || ""
        }
      ];
    });

    setSearchQuery("");
    setShowDropdown(false);
    showToast(`Added ${med.name} to invoice`, "success");
  };

  const removeRow = (id, batchId) => {
    setLineItems((prev) => prev.filter((i) => !(i.id === id && i.batchId === batchId)));
  };

  const updateQty = (id, batchId, delta) => {
    setLineItems((prev) =>
      prev.map((i) => {
        if (i.id === id && i.batchId === batchId) {
          const newQty = Math.max(1, i.qty + delta);
          if (newQty > i.stock) {
            showToast(`Only ${i.stock} units available in stock`, "error");
            return i;
          }
          return { ...i, qty: newQty };
        }
        return i;
      })
    );
  };

  return (
    <div className="medicine-section">
      <div className="flex items-center justify-between pb-1.5 border-b border-white/5 mb-2 mt-1">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
          <Package size={15} className="text-[#4fdbc8]" /> Medicines List
        </h3>
      </div>

      {/* Autocomplete Search Input */}
      <div className="relative mb-3.5" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (val.length < 2) {
                setMedResults([]);
                setShowDropdown(false);
              }
            }}
            placeholder="Search medicine by name or code (min 2 chars)..."
            className="w-full medicine-search"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4fdbc8] animate-spin" size={16} />
          )}
        </div>

        {showDropdown && medResults.length > 0 && (
          <div className="absolute z-20 left-0 right-0 mt-1.5 bg-slate-950 border border-white/10 rounded-[14px] shadow-2xl max-h-60 overflow-y-auto divide-y divide-white/5">
            {medResults.map((med) => (
              <button
                key={`${med.id}-${med.batchId}`}
                type="button"
                onClick={() => addMedicine(med)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-[#4fdbc8]/10 text-slate-300 hover:text-white flex items-center justify-between transition-all"
              >
                <div>
                  <div className="font-semibold text-slate-200">{med.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Batch: <span className="text-slate-400 font-mono">{med.batchNumber || "N/A"}</span> | Exp: {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString("en-IN", {month: "short", year:"2-digit"}) : "N/A"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#4fdbc8]">₹{Number(med.price || med.mrp || 0).toFixed(2)}</div>
                  <div className={`text-xs ${med.stock < 10 ? "text-amber-500" : "text-slate-500"}`}>
                    Stock: {med.stock}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Items List */}
      <div className="flex-1 overflow-y-auto max-h-[150px] pr-1 scrollbar-thin">
        {lineItems.length === 0 ? (
          <div className="empty-state text-slate-500 text-center">
            <Package size={32} className="text-slate-600 mb-2.5" />
            <p className="text-sm font-semibold text-slate-300">No medicines added yet.</p>
            <p className="text-xs text-slate-500 mt-1">Search and select medicines above.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {lineItems.map((item) => (
                <motion.div
                  key={`${item.id}-${item.batchId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-3.5 bg-slate-900/60 border border-white/5 rounded-xl flex items-center justify-between gap-4 hover:border-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-slate-200 truncate">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Batch: <span className="font-mono text-slate-400">{item.batchNumber}</span> | Stock: <span className="text-slate-400">{item.stock}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center bg-slate-950/80 border border-white/10 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.batchId, -1)}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-slate-200">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.batchId, 1)}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Price display */}
                    <div className="text-right min-w-[75px]">
                      <div className="text-sm font-semibold text-slate-200">
                        ₹{(item.price * item.qty).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">₹{item.price} each</div>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeRow(item.id, item.batchId)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
