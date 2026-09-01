import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Package,
  PackageOpen,
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Calendar,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { getMedicineStatus, STATUS_OPTIONS } from "../utils/inventoryStatus";
import {
  CreateMedicineSchema,
  UpdateMedicineSchema,
} from "../constants/medicine.schema.js";
import {
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getCategories,
  addBatch,
  updateBatch,
  getInventorySummary,
} from "../services/inventory.service";
import { useAuth } from "../hooks/useAuth";
import ConfirmModal from "./ConfirmModal";
import InventoryAnalyticsModal from "./inventory/InventoryAnalyticsModal";
import { normalizeMedicine } from "../utils/normalizers";
import { safeNumber } from "../utils/number.js";
import {
  CustomDropdown,
  Spinner,
  MedicineModal,
  MedicineViewModal,
} from "./inventory/InventoryCore.jsx";
import { BatchModal, ReorderModal } from "./inventory/InventoryBatchModel.jsx";

/* ─── MAIN COMPONENT ─── */

const headers = [
  "Name",
  "Generic",
  "Category",
  "Batch",
  "Expiry",
  "Quantity",
  "MRP",
  "GST",
  "Status",
];
const getInitials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const handleMouseMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
};
function InventoryCRUDSection1({
  loading,
  stats,
  setStatusFilter,
  setCurrentPage,
  statusFilter,
  setShowAnalyticsModal,
}) {
  return (
    <div className="inv-stats-row">
      <div
        role="button"
        tabIndex={0}
        className="inv-stat-card"
        onMouseMove={handleMouseMove}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onClick={() => {
          setStatusFilter("All Status");
          setCurrentPage(1);
        }}
        title="Show all medicines"
      >
        <div className="inv-stat-header">
          <span className="inv-stat-label">TOTAL SKU</span>
          <div className="inv-stat-icon bg-primary">
            <Package size={14} />
          </div>
        </div>
        <div className="inv-stat-value text-primary">
          {loading ? "..." : stats.total}
        </div>
      </div>
      <div
        role="button"
        tabIndex={0}
        className={`inv-stat-card${statusFilter === "In Stock" ? " active-filter" : ""}`}
        onMouseMove={handleMouseMove}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onClick={() => {
          setStatusFilter(
            statusFilter === "In Stock" ? "All Status" : "In Stock",
          );
          setCurrentPage(1);
        }}
        title="Filter: In Stock"
      >
        <div className="inv-stat-header">
          <span className="inv-stat-label">IN STOCK</span>
          <div className="inv-stat-icon bg-success">
            <CheckCircle2 size={14} />
          </div>
        </div>
        <div className="inv-stat-value text-success">{stats.inStock}</div>
      </div>
      <div
        role="button"
        tabIndex={0}
        className={`inv-stat-card${statusFilter === "Low Stock" ? " active-filter" : ""}`}
        onMouseMove={handleMouseMove}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onClick={() => {
          setStatusFilter(
            statusFilter === "Low Stock" ? "All Status" : "Low Stock",
          );
          setCurrentPage(1);
        }}
        title="Filter: Low Stock"
      >
        <div className="inv-stat-header">
          <span className="inv-stat-label">LOW STOCK</span>
          <div className="inv-stat-icon bg-warning">
            <AlertTriangle size={14} />
          </div>
        </div>
        <div className="inv-stat-value text-warning">{stats.lowStock}</div>
      </div>
      <div
        role="button"
        tabIndex={0}
        className={`inv-stat-card${statusFilter === "Out of Stock" ? " active-filter" : ""}`}
        onMouseMove={handleMouseMove}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onClick={() => {
          setStatusFilter(
            statusFilter === "Out of Stock" ? "All Status" : "Out of Stock",
          );
          setCurrentPage(1);
        }}
        title="Filter: Out of Stock"
      >
        <div className="inv-stat-header">
          <span className="inv-stat-label">OUT OF STOCK</span>
          <div className="inv-stat-icon bg-danger">
            <PackageOpen size={14} />
          </div>
        </div>
        <div className="inv-stat-value text-danger">{stats.outOfStock}</div>
      </div>
      <div
        role="button"
        tabIndex={0}
        className={`inv-stat-card${statusFilter === "Expired" ? " active-filter" : ""}`}
        onMouseMove={handleMouseMove}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onClick={() => {
          setStatusFilter(
            statusFilter === "Expired" ? "All Status" : "Expired",
          );
          setCurrentPage(1);
        }}
        title="Filter: Expired"
      >
        <div className="inv-stat-header">
          <span className="inv-stat-label">EXPIRED BATCHES</span>
          <div className="inv-stat-icon bg-danger">
            <Calendar size={14} />
          </div>
        </div>
        <div className="inv-stat-value text-danger">{stats.expired}</div>
      </div>
      <div
        role="button"
        tabIndex={0}
        className="inv-stat-card cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-1"
        onMouseMove={handleMouseMove}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        onClick={() => setShowAnalyticsModal(true)}
        title="Click to view detailed inventory analytics"
      >
        <div className="inv-stat-header">
          <span className="inv-stat-label">INVENTORY VALUE</span>
          <div className="inv-stat-icon bg-primary">
            <DollarSign size={14} />
          </div>
        </div>
        <div className="inv-stat-value text-primary">
          ₹
          {stats.totalValue.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })}
        </div>
      </div>
    </div>
  );
}
function InventoryCRUDSection2({
  search,
  categoryFilter,
  categories,
  statusFilter,
  loading,
  filtered,
  limit,
  totalItems,
  getVisiblePages,
  setSearch,
  setCurrentPage,
  setCategoryFilter,
  setStatusFilter,
  handleEditStock,
  setViewTarget,
  setEditTarget,
  setModalOpen,
  setDeleteTarget,
  currentPage,
  totalPages,
}) {
  return (
    <div className="inv-table-card">
      <div className="inv-table-header">
        <div className="inv-search-box">
          <Search size={18} className="search-icon" />
          <>
            <label htmlFor="field_xhgkcr" className="sr-only">
              Search by name, generic, batch...
            </label>
            <input
              required
              placeholder="Search by name, generic, batch..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              id="field_xhgkcr"
            />
          </>
        </div>
        <div className="inv-filter-group">
          <CustomDropdown
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setCurrentPage(1);
            }}
            options={categories.map((c) => ({
              value: c,
              label: c === "All" ? "All Categories" : c,
            }))}
            placeholder="All Categories"
          />
          <CustomDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={STATUS_OPTIONS}
            placeholder="All Status"
          />
        </div>
      </div>

      {/* Table */}
      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>MEDICINE</th>
              <th>CATEGORY</th>
              <th>BATCH</th>
              <th>EXPIRY</th>
              <th>STOCK</th>
              <th>MRP</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="inv-table-loading">
                  <Spinner size={20} /> Loading inventory...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="inv-table-empty">
                  No medicines found. Add your first medicine →
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                // Use centralized status calculation
                const medicineStatus = getMedicineStatus(m);
                const isExpired = medicineStatus === "Expired";
                const isExpiringSoon = medicineStatus === "Expiring Soon";
                const isLowStock = medicineStatus === "Low Stock";
                const isOutOfStock = medicineStatus === "Out of Stock";
                const statusClass = isExpired
                  ? "expired"
                  : isOutOfStock
                    ? "out-of-stock"
                    : isLowStock
                      ? "low-stock"
                      : isExpiringSoon
                        ? "expiring-soon"
                        : "in-stock";
                const statusText = medicineStatus.toUpperCase();
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="inv-identity">
                        <div className="inv-avatar">{getInitials(m.name)}</div>
                        <div className="inv-info">
                          <span className="inv-name">{m.name}</span>
                          <span className="inv-generic">
                            {m.genericName} {m.brandName && `(${m.brandName})`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="inv-category-tag">
                        {m.category?.name || m.category || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="mono">{m.batchNumber || "—"}</span>
                    </td>
                    <td
                      style={{
                        color: isExpired
                          ? "var(--danger)"
                          : isExpiringSoon
                            ? "var(--warning)"
                            : "inherit",
                      }}
                    >
                      {m.expiryDate
                        ? new Date(m.expiryDate).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td
                      style={{
                        fontWeight: 800,
                        color: isOutOfStock
                          ? "var(--danger)"
                          : isLowStock
                            ? "var(--warning)"
                            : "var(--success)",
                      }}
                    >
                      {m.availableStock ?? m.stock ?? 0}
                    </td>
                    <td>₹{(m.mrp || 0).toFixed(2)}</td>
                    <td>
                      <span className={`inv-status-badge ${statusClass}`}>
                        <div className="status-dot" />
                        {statusText}
                      </span>
                    </td>
                    <td>
                      <div className="inv-row-actions">
                        <button
                          className="inv-row-btn edit-stock"
                          title="Edit Stock"
                          onClick={() => handleEditStock(m)}
                        >
                          <PackageOpen size={14} />
                          <span>Edit Stock</span>
                        </button>
                        <button
                          className="inv-row-btn"
                          title="View Details"
                          onClick={() => setViewTarget(m)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="inv-row-btn"
                          title="Edit"
                          onClick={() => {
                            setEditTarget(m);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="inv-row-btn danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(m)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="inv-pagination">
          <div className="inv-pagination-info">
            Showing {(currentPage - 1) * limit + 1} to{" "}
            {Math.min(currentPage * limit, totalItems)} of {totalItems} items
          </div>
          <div className="inv-pagination-controls">
            <button
              className="inv-page-btn prev-next"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={16} /> Prev
            </button>

            {getVisiblePages().map((page, i, arr) => {
              const isEllipsis = page === "...";
              const isFirstEllipsis = isEllipsis && i < arr.length / 2;
              const uniqueKey = isEllipsis
                ? isFirstEllipsis
                  ? "ellipsis-left"
                  : "ellipsis-right"
                : `page-${page}`;
              return isEllipsis ? (
                <span
                  key={uniqueKey}
                  className="inv-ellipsis"
                  style={{
                    color: "var(--text-muted)",
                    paddingLeft: "8px",
                    paddingRight: "8px",
                  }}
                >
                  ...
                </span>
              ) : (
                <button
                  key={uniqueKey}
                  className={`inv-page-btn ${currentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}

            <button
              className="inv-page-btn prev-next"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default function InventoryCRUD({
  showToast,
  title = "Inventory Management",
}) {
  const { user, tenant } = useAuth();
  const branchId =
    user?.branchId || user?.branch?.id || tenant?.branchId || null;
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reorderTarget, setReorderTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editBatchTarget, setEditBatchTarget] = useState(null);
  const [isAddingNewBatch, setIsAddingNewBatch] = useState(false);
  const [activeMedicineForBatch, setActiveMedicineForBatch] = useState(null);
  const [savingBatch, setSavingBatch] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const medicineAbortRef = useRef(null);
  const limit = 25;
  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, i) => i + 1,
      );
    }
    if (currentPage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };
  const [summaryStats, setSummaryStats] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    expired: 0,
    inventoryValue: 0,
  });
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);
  const loadSummary = useCallback(async () => {
    try {
      const res = await getInventorySummary();
      if (res.data?.success && res.data?.data) {
        setSummaryStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load inventory summary", err);
    }
  }, []);
  const loadMedicines = useCallback(
    async (options = {}) => {
      const { skipSummary = true } = options;
      if (medicineAbortRef.current) {
        medicineAbortRef.current.abort();
      }
      const controller = new AbortController();
      medicineAbortRef.current = controller;
      if (medicines.length === 0) setLoading(true);
      try {
        let categoryId = undefined;
        if (categoryFilter !== "All") {
          const catObj = categoriesList.find(
            (c) => (c.name || c.categoryName || c) === categoryFilter,
          );
          if (catObj) {
            categoryId = catObj.id;
          }
        }
        let backendStatus = undefined;
        if (statusFilter === "In Stock") backendStatus = "IN_STOCK";
        else if (statusFilter === "Low Stock") backendStatus = "LOW_STOCK";
        else if (statusFilter === "Out of Stock")
          backendStatus = "OUT_OF_STOCK";
        else if (statusFilter === "Expiring Soon")
          backendStatus = "EXPIRING_SOON";
        else if (statusFilter === "Expired") backendStatus = "EXPIRED";
        const medicinesRes = await getMedicines({
          page: currentPage,
          limit,
          search: debouncedSearch,
          categoryId,
          status: backendStatus,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const items = Array.isArray(medicinesRes.data?.data?.items)
          ? medicinesRes.data.data.items
          : Array.isArray(medicinesRes.data?.data)
            ? medicinesRes.data.data
            : [];
        const total = medicinesRes.data?.data?.total ?? items.length;
        const pages = medicinesRes.data?.data?.totalPages ?? 1;
        const mapped = items.map(normalizeMedicine);
        setMedicines(mapped);
        setTotalItems(total);
        setTotalPages(pages);
        if (viewTarget) {
          const updatedViewTarget = mapped.find((m) => m.id === viewTarget.id);
          if (updatedViewTarget) {
            setViewTarget(updatedViewTarget);
          }
        }
        if (!skipSummary) {
          await loadSummary();
        }
      } catch (err) {
        if (err?.name === "CanceledError" || controller.signal.aborted) return;
        showToast(
          "Failed to load inventory",
          err?.response?.data?.error || "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      medicines.length,
      categoryFilter,
      statusFilter,
      currentPage,
      debouncedSearch,
      viewTarget,
      categoriesList,
      loadSummary,
      showToast,
    ],
  );
  const handleEditStock = (medicine) => {
    setActiveMedicineForBatch(medicine);
    setEditBatchTarget(null);
    setIsAddingNewBatch(false);
    setBatchModalOpen(true);
  };
  const handleSaveBatch = async (payload) => {
    setSavingBatch(true);
    try {
      if (payload.id) {
        await updateBatch(payload.id, payload);
        showToast("Batch updated successfully", "success");
      } else if (editBatchTarget) {
        await updateBatch(editBatchTarget.id, payload);
        showToast("Batch updated successfully", "success");
      } else {
        await addBatch(payload);
        showToast("Batch created successfully", "success");
      }
      await loadMedicines({
        skipSummary: false,
      });
      setBatchModalOpen(false);
      setEditBatchTarget(null);
      setActiveMedicineForBatch(null);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to save batch";
      showToast(errorMessage, "error");
    } finally {
      setSavingBatch(false);
    }
  };
  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        setLoading(true);
        const [categoriesRes] = await Promise.all([
          getCategories(),
          loadSummary(),
        ]);
        if (!mounted) return;
        setCategoriesList(
          Array.isArray(categoriesRes.data?.data)
            ? categoriesRes.data.data
            : [],
        );
      } catch (err) {
        console.error(err);
        showToast("Failed to load inventory", "error");
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
  }, [showToast, loadSummary]);
  useEffect(() => {
    const run = async () => {
      await loadMedicines();
    };
    run();
  }, [loadMedicines]);
  const categories = useMemo(() => {
    const cats = categoriesList.flatMap((c) => {
      const name = c.name || c;
      return name ? [name] : [];
    });
    return ["All", ...cats];
  }, [categoriesList]);
  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const term = search.toLowerCase().trim();
      const searchMatch =
        !term ||
        (m.name || "").toLowerCase().includes(term) ||
        (m.genericName || "").toLowerCase().includes(term) ||
        (m.batchNumber || "").toLowerCase().includes(term);

      // Note: We rely on the backend for category and status filtering
      // since it handles pagination and has the definitive database state.
      // Filtering them here can cause discrepancies (e.g. Expired vs Out of Stock).
      return searchMatch;
    });
  }, [medicines, search]);
  const stats = {
    total: summaryStats.totalProducts,
    inStock: summaryStats.inStock,
    lowStock: summaryStats.lowStock,
    outOfStock: summaryStats.outOfStock,
    expired: summaryStats.expired,
    totalValue: summaryStats.inventoryValue,
  };
  const handleSave = async (form) => {
    setSaving(true);
    try {
      const payload = {
        name: form.name?.trim() || "",
        gstPercentage: safeNumber(form.gst) || 0,
        reorderPoint: safeNumber(form.reorderLevel) || 10,
        reorderLevel: safeNumber(form.reorderLevel) || 10,
        ...(form.genericName?.trim() && {
          genericName: form.genericName.trim(),
        }),
        ...(form.categoryId && {
          categoryId: form.categoryId,
        }),
        ...(form.barcode?.trim() && {
          barcode: form.barcode.trim(),
        }),
        ...(form.hsnCode?.trim() && {
          hsnCode: form.hsnCode.trim(),
        }),
        ...(form.dosageForm?.trim() && {
          dosageForm: form.dosageForm.trim(),
        }),
        ...(form.strength?.trim() && {
          strength: form.strength.trim(),
        }),
        ...(form.schedule?.trim() && {
          scheduleType: form.schedule.trim(),
        }),
        ...(form.notes?.trim() && {
          description: form.notes.trim(),
        }),
        ...(branchId && {
          branchId: String(branchId),
        }),
        ...(form.manufacturer?.trim() && {
          manufacturer: form.manufacturer.trim(),
        }),
        supplierId: form.supplierId ? form.supplierId.trim() : null,
        ...(typeof form.category === "string" &&
          form.category.trim() && {
            category: form.category.trim(),
          }),
      };
      if (editTarget) {
        payload.isActive = form.status === "active";
        UpdateMedicineSchema.parse(payload);
        await updateMedicine(editTarget.id, payload);
        showToast("Medicine updated successfully", "success");
      } else {
        const initialBatch = {
          batchNumber: String(form.batchNumber || "").trim(),
          quantity: safeNumber(form.quantity),
          expiryDate: form.expiryDate,
          mrp: safeNumber(form.mrp),
          sellingPrice:
            form.sellingPrice !== undefined
              ? safeNumber(form.sellingPrice)
              : safeNumber(form.mrp),
          purchasePrice: form.purchaseCost ? safeNumber(form.purchaseCost) : 0,
        };
        const normalizedPayload = {
          ...payload,
          initialBatch,
        };
        CreateMedicineSchema.parse(normalizedPayload);
        await createMedicine(normalizedPayload);
        showToast("Medicine added successfully", "success");
      }
      await loadMedicines({
        skipSummary: false,
      });
      setModalOpen(false);
      setEditTarget(null);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err?.message ||
        "Unknown validation error";
      console.error("[SAVE ERROR]", errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMedicine(deleteTarget.id);
      showToast("Medicine deleted successfully", "success");
      await loadMedicines({
        skipSummary: false,
      });
      setDeleteTarget(null);
    } catch (err) {
      const errorMessage =
        typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : err.response?.data?.error?.message ||
            err.response?.data?.message ||
            err.message ||
            "Failed to delete medicine";
      showToast(errorMessage, "error");
    } finally {
      setDeleting(false);
    }
  };
  const handleExportCSV = () => {
    const rows = filtered.map((m) => {
      const currentQty = m.availableStock ?? m.stock ?? 0;
      const batchNum =
        m.inventoryBatches?.[0]?.batchNumber || m.batchNumber || "—";
      const expDate =
        m.inventoryBatches?.[0]?.expiryDate || m.expiryDate || "—";
      const mrp = m.inventoryBatches?.[0]?.mrp || m.mrp || 0;
      const gst = m.gstPercentage ?? m.gst ?? 0;
      const status = getMedicineStatus(m);
      return [
        `"${(m.name || "").replace(/"/g, '""')}"`,
        `"${(m.genericName || "").replace(/"/g, '""')}"`,
        `"${(m.category?.name || m.category || "").replace(/"/g, '""')}"`,
        `"${(batchNum || "").replace(/"/g, '""')}"`,
        expDate !== "—" ? new Date(expDate).toISOString().split("T")[0] : "—",
        currentQty,
        mrp,
        `${gst}%`,
        status,
      ];
    });
    const csv = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Inventory exported successfully", "success");
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  };
  return (
    <div className="inv-container">
      {/* Header */}
      <div className="inv-header">
        <div className="inv-title-group">
          <h2>{title}</h2>
          <p>
            Complete pharmaceutical stock control with batch tracking, expiry
            alerts, and real-time quantities
          </p>
        </div>
        <div className="inv-header-actions">
          <button
            className="inv-action-btn secondary"
            onClick={handleExportCSV}
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            className="inv-action-btn primary"
            onClick={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
          >
            <Plus size={20} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Stats */}
      <InventoryCRUDSection1
        loading={loading}
        stats={stats}
        setStatusFilter={setStatusFilter}
        setCurrentPage={setCurrentPage}
        statusFilter={statusFilter}
        setShowAnalyticsModal={setShowAnalyticsModal}
      />

      {/* Filters */}
      <InventoryCRUDSection2
        search={search}
        categoryFilter={categoryFilter}
        categories={categories}
        statusFilter={statusFilter}
        loading={loading}
        filtered={filtered}
        limit={limit}
        totalItems={totalItems}
        getVisiblePages={getVisiblePages}
        setSearch={setSearch}
        setCurrentPage={setCurrentPage}
        setCategoryFilter={setCategoryFilter}
        setStatusFilter={setStatusFilter}
        handleEditStock={handleEditStock}
        setViewTarget={setViewTarget}
        setEditTarget={setEditTarget}
        setModalOpen={setModalOpen}
        setDeleteTarget={setDeleteTarget}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      {/* Modals */}
      <AnimatePresence>
        {modalOpen && (
          <MedicineModal
            onClose={() => {
              setModalOpen(false);
              setEditTarget(null);
            }}
            onSave={handleSave}
            editData={editTarget}
            showToast={showToast}
            saving={saving}
            existingMedicines={medicines}
            categories={categoriesList}
          />
        )}
        {viewTarget && (
          <MedicineViewModal
            medicine={viewTarget}
            onClose={() => setViewTarget(null)}
            onAddBatch={(medicine) => {
              setActiveMedicineForBatch(medicine);
              setEditBatchTarget(null);
              setIsAddingNewBatch(true);
              setBatchModalOpen(true);
            }}
            onEditBatch={(batch, medicine) => {
              setActiveMedicineForBatch(medicine);
              setEditBatchTarget(batch);
              setIsAddingNewBatch(false);
              setBatchModalOpen(true);
            }}
          />
        )}
        {batchModalOpen && (
          <BatchModal
            onClose={() => {
              setBatchModalOpen(false);
              setEditBatchTarget(null);
              setActiveMedicineForBatch(null);
              setIsAddingNewBatch(false);
            }}
            onSave={handleSaveBatch}
            batchData={editBatchTarget}
            medicineData={activeMedicineForBatch}
            isAddMode={isAddingNewBatch}
            showToast={showToast}
            saving={savingBatch}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Medicine"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone and will remove all associated batch records.`}
        confirmText="Delete Medicine"
        loading={deleting}
        icon={Trash2}
      />

      <InventoryAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />

      <AnimatePresence>
        {reorderTarget && (
          <ReorderModal
            medicine={reorderTarget}
            onClose={() => setReorderTarget(null)}
            showToast={showToast}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
