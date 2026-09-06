import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  useRef,
} from "react";
import {
  Bell,
  Download,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Layers,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../api";
import { safeNumber } from "../utils/number.js";
import {
  disposeInventory,
  bulkAssignBatchSupplier,
  backfillBatchSupplier,
  exportBatchesWithoutSupplier,
  importSupplierAssignments,
} from "../services/inventory.service";
import { getSuppliers } from "../services/suppliers.service";
import ClearExpiredButton from "./ClearExpiredButton";
import {
  ExpiryBatchIntelligenceSection1,
  ExpiryBatchIntelligenceSection2,
  ExpiryBatchIntelligenceSection3,
} from "./Expiry/Expiry.jsx";
import {
  ExpiryBatchIntelligenceSection4,
  ExpiryBatchIntelligenceSection5,
  ExpiryBatchIntelligenceSection6,
  ExpiryBatchIntelligenceSection7,
  ExpiryBatchIntelligenceSection8,
} from "./Expiry/Expiry1.jsx";
function getDays(expiryDate) {
  const exp = new Date(expiryDate);
  const today = new Date();
  const diff =
    Date.UTC(exp.getFullYear(), exp.getMonth(), exp.getDate()) -
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
function computeStatus(days, qty) {
  if (qty <= 0) return "safe";
  if (days < 0) return "expired";
  if (days <= 7) return "danger";
  if (days <= 30) return "warning";
  return "safe";
}
export default function ExpiryBatchIntelligence({ showToast }) {
  const [intelligenceState, dispatchIntelligence] = useReducer(
    (state, action) => {
      if (action.type === "SET_FIELD") {
        return {
          ...state,
          [action.field]:
            typeof action.value === "function"
              ? action.value(state[action.field])
              : action.value,
        };
      }
      return state;
    },
    {
      batches: [],
      suggestions: [],
      loading: true,
      activeTab: "timeline",
      filter: "ALL",
      searchQuery: "",
      showBanner: true,
      showConfigModal: false,
      showActionModal: false,
      actionType: null,
      selectedItem: null,
      processing: false,
      reminders: [],
      fifoEnabled: true,
      expandedMed: null,
      expiryMetrics: null,
      selectedBatchIds: new Set(),
      showDisposeModal: false,
      disposing: false,
      clearReloadKey: 0,
      showBulkSupplierModal: false,
      bulkSupplierId: "",
      suppliers: [],
      bulkAssigning: false,
      bulkReturning: false,
      backfilling: false,
      showImportModal: false,
      importFile: null,
      importing: false,
      importResult: null,
    },
  );
  const {
    batches,
    suggestions,
    loading,
    activeTab,
    filter,
    searchQuery,
    showConfigModal,
    showActionModal,
    actionType,
    selectedItem,
    processing,
    reminders,
    fifoEnabled,
    expandedMed,
    expiryMetrics,
    selectedBatchIds,
    showDisposeModal,
    disposing,
    clearReloadKey,
    showBulkSupplierModal,
    bulkSupplierId,
    suppliers,
    bulkAssigning,
    bulkReturning,
    backfilling,
    showImportModal,
    importFile,
    importing,
    importResult,
  } = intelligenceState;
  const isExportingRef = useRef(false);
  const isSavingEditRef = useRef(false);
  const isDeletingBatchRef = useRef(false);
  const isSavingConfigRef = useRef(false);
  const setBatches = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "batches",
        value: val,
      }),
    [],
  );
  const setSuggestions = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "suggestions",
        value: val,
      }),
    [],
  );
  const setLoading = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "loading",
        value: val,
      }),
    [],
  );
  const setActiveTab = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "activeTab",
        value: val,
      }),
    [],
  );
  const setFilter = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "filter",
        value: val,
      }),
    [],
  );
  const setSearchQuery = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "searchQuery",
        value: val,
      }),
    [],
  );
  const setShowConfigModal = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "showConfigModal",
        value: val,
      }),
    [],
  );
  const setShowActionModal = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "showActionModal",
        value: val,
      }),
    [],
  );
  const setActionType = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "actionType",
        value: val,
      }),
    [],
  );
  const setSelectedItem = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "selectedItem",
        value: val,
      }),
    [],
  );
  const setProcessing = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "processing",
        value: val,
      }),
    [],
  );
  const setReminders = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "reminders",
        value: val,
      }),
    [],
  );
  const setFifoEnabled = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "fifoEnabled",
        value: val,
      }),
    [],
  );
  const setExpandedMed = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "expandedMed",
        value: val,
      }),
    [],
  );
  const setExpiryMetrics = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "expiryMetrics",
        value: val,
      }),
    [],
  );
  const setSelectedBatchIds = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "selectedBatchIds",
        value: val,
      }),
    [],
  );
  const setShowDisposeModal = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "showDisposeModal",
        value: val,
      }),
    [],
  );
  const setDisposing = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "disposing",
        value: val,
      }),
    [],
  );
  const setClearReloadKey = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "clearReloadKey",
        value: val,
      }),
    [],
  );
  const setShowBulkSupplierModal = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "showBulkSupplierModal",
        value: val,
      }),
    [],
  );
  const setBulkSupplierId = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "bulkSupplierId",
        value: val,
      }),
    [],
  );
  const setSuppliers = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "suppliers",
        value: val,
      }),
    [],
  );
  const setBulkAssigning = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "bulkAssigning",
        value: val,
      }),
    [],
  );
  const setBulkReturning = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "bulkReturning",
        value: val,
      }),
    [],
  );
  const setBackfilling = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "backfilling",
        value: val,
      }),
    [],
  );
  const setShowImportModal = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "showImportModal",
        value: val,
      }),
    [],
  );
  const setImportFile = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "importFile",
        value: val,
      }),
    [],
  );
  const setImporting = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "importing",
        value: val,
      }),
    [],
  );
  const setImportResult = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "importResult",
        value: val,
      }),
    [],
  );
  useEffect(() => {
    getSuppliers({
      limit: 500,
    })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setSuppliers(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [setSuppliers]);
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [batchRes, recRes, metricsRes] = await Promise.all([
          api.get("/intelligence/batches"),
          api.get("/intelligence/recommendations").catch(() => null),
          api.get("/inventory/expiry-metrics").catch(() => null),
        ]);
        if (!active) return;
        const rawBatches = Array.isArray(batchRes.data?.data)
          ? batchRes.data.data
          : Array.isArray(batchRes.data)
            ? batchRes.data
            : [];
        const mapped = rawBatches.reduce((acc, b) => {
          if (b.quantity > 0) {
            const days = getDays(b.expiryDate);
            acc.push({
              id: b.id,
              // real UUID for API calls and React keys
              batchNumber: b.batchNumber || "N/A",
              batchId: b.id,
              // kept for backwards compatibility in the component
              med: b.medicine?.name || "Unknown",
              exp: b.expiryDate,
              days,
              qty: b.availableQuantity ?? b.quantity,
              val:
                safeNumber(b.availableQuantity ?? b.quantity) *
                safeNumber(b.purchasePrice || 0),
              status:
                b.status?.toLowerCase() || computeStatus(days, b.quantity),
              rank: 1,
              received: b.createdAt?.split("T")[0] || "",
              mfg: b.manufacturingDate?.split("T")[0] || "N/A",
              supplier: b.supplier?.name || "N/A",
              supplierId: b.supplierId || b.supplier?.id || null,
              medicineId: b.medicineId || b.medicine?.id || null,
              manufacturer: b.manufacturerName || "",
              purchaseInvoice: b.purchaseInvoiceNumber || "",
              purchaseDate: b.purchaseDate?.split("T")[0] || "",
              purchasePrice: safeNumber(b.purchasePrice || 0),
              returnEligible:
                days < 0 && (b.supplier || b.supplierId) ? "YES" : "NO",
              returnStatus: "PENDING",
            });
          }
          return acc;
        }, []);
        setBatches(mapped);

        // Store unified expiry metrics from backend
        const metrics = metricsRes?.data?.data || metricsRes?.data || null;
        if (metrics) {
          setExpiryMetrics(metrics);
        }
        const recs = recRes?.data?.data || recRes?.data || [];
        const mappedRecs = Array.isArray(recs)
          ? recs.map((r) => {
              const batch = r.batch || {};
              const days = r.recommendedDays ?? getDays(batch.expiryDate);
              const qty = batch.quantity || 0;
              return {
                med: batch.medicine?.name || "Unknown",
                batch: batch.batchNumber || r.id || "",
                days,
                qty,
                val: safeNumber(qty) * safeNumber(batch.purchasePrice || 0),
                urgency: days <= 7 ? "danger" : days <= 30 ? "warning" : "info",
                supplier: batch.supplier?.name || "",
              };
            })
          : [];
        setSuggestions(mappedRecs);
      } catch (error) {
        console.error("Failed to load expiry intelligence:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [
    clearReloadKey,
    setBatches,
    setExpiryMetrics,
    setLoading,
    setSuggestions,
  ]);
  const [alertSettings, setAlertSettings] = useState({
    warning: 30,
    critical: 7,
    email: true,
    whatsapp: false,
  });
  const [frequency, setFrequency] = useState("Daily Digest");
  const [showFifoConfirm, setShowFifoConfirm] = useState(false);
  const [actionModalState, dispatchActionModal] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "INIT_ACTION":
          return {
            ...state,
            returnQty: action.payload?.qty || 1,
            returnReason: "Near Expiry Stock",
            discountPct: 15,
            discountDuration: 7,
            disposalMethod: "Standard Medical Waste",
            disposalNotes: "",
          };
        case "SET_FIELD":
          return {
            ...state,
            [action.field]:
              typeof action.value === "function"
                ? action.value(state[action.field])
                : action.value,
          };
        default:
          return state;
      }
    },
    {
      returnQty: 1,
      returnReason: "Near Expiry Stock",
      discountPct: 15,
      discountDuration: 7,
      disposalMethod: "Standard Medical Waste",
      disposalNotes: "",
    },
  );
  const {
    returnQty,
    returnReason,
    discountPct,
    discountDuration,
    disposalMethod,
    disposalNotes,
  } = actionModalState;
  const setReturnQty = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "returnQty",
        value: val,
      }),
    [],
  );
  const setReturnReason = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "returnReason",
        value: val,
      }),
    [],
  );
  const setDiscountPct = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "discountPct",
        value: val,
      }),
    [],
  );
  const setDiscountDuration = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "discountDuration",
        value: val,
      }),
    [],
  );
  const setDisposalMethod = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "disposalMethod",
        value: val,
      }),
    [],
  );
  const setDisposalNotes = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "disposalNotes",
        value: val,
      }),
    [],
  );
  const [invSearch, setInvSearch] = useState("");
  const [invFilter, setInvFilter] = useState("ALL");
  const [showInvFilterDropdown, setShowInvFilterDropdown] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  const [showViewBatchModal, setShowViewBatchModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBatchForDelete, setSelectedBatchForDelete] = useState(null);
  const [editBatch, setEditBatch] = useState(null);
  const [viewBatch, setViewBatch] = useState(null);
  const [newBatch, setNewBatch] = useState({
    med: "",
    brand: "",
    supplier: "",
    exp: "",
    mfg: "",
    qty: "",
    val: "",
    received: new Date().toISOString().split("T")[0],
  });
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if ((b.qty ?? b.quantity ?? 0) <= 0) return false;
      const q = (searchQuery || "").toLowerCase();
      const matchesSearch =
        !q ||
        b.med?.toLowerCase().includes(q) ||
        b.medicineName?.toLowerCase().includes(q) ||
        b.supplier?.toLowerCase().includes(q) ||
        b.batch?.toLowerCase().includes(q) ||
        b.batchNumber?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      const f = (filter || "ALL").toUpperCase();
      if (f === "ALL") return true;
      if (f === "EXPIRED")
        return b.days < 0 || b.status?.toLowerCase() === "expired";
      if (
        f === "DANGER" ||
        f === "< 7 DAYS" ||
        f === "0-7 DAYS" ||
        f === "EXPIRING < 7 DAYS"
      )
        return (
          b.days >= 0 && b.days <= 7 && b.status?.toLowerCase() !== "expired"
        );
      if (
        f === "WARNING" ||
        f === "7-30 DAYS" ||
        f === "8-30 DAYS" ||
        f === "< 30 DAYS" ||
        f === "EXPIRING 7-30 DAYS"
      )
        return (
          b.days > 7 && b.days <= 30 && b.status?.toLowerCase() !== "expired"
        );
      if (
        f === "ATTENTION" ||
        f === "30-90 DAYS" ||
        f === "31-90 DAYS" ||
        f === "< 90 DAYS" ||
        f === "EXPIRING 30-90 DAYS"
      )
        return (
          b.days > 30 && b.days <= 90 && b.status?.toLowerCase() !== "expired"
        );
      if (f === "SAFE" || f === "90+ DAYS" || f === "SAFE (90+ DAYS)")
        return b.days > 90 && b.status?.toLowerCase() !== "expired";
      if (f === "ACTIVE")
        return b.days >= 0 && b.status?.toLowerCase() !== "expired";
      return b.status?.toLowerCase() === f.toLowerCase();
    });
  }, [batches, searchQuery, filter]);
  const invFilteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if ((b.qty ?? b.quantity ?? 0) <= 0) return false;
      const q = (invSearch || "").toLowerCase();
      const matchesSearch =
        !q ||
        b.med?.toLowerCase().includes(q) ||
        b.medicineName?.toLowerCase().includes(q) ||
        b.supplier?.toLowerCase().includes(q) ||
        b.batch?.toLowerCase().includes(q) ||
        b.batchNumber?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      const f = (invFilter || "ALL").toUpperCase();
      if (f === "ALL") return true;
      if (f === "EXPIRED")
        return b.days < 0 || b.status?.toLowerCase() === "expired";
      if (f === "DANGER" || f === "< 7 DAYS" || f === "0-7 DAYS")
        return (
          b.days >= 0 && b.days <= 7 && b.status?.toLowerCase() !== "expired"
        );
      if (
        f === "WARNING" ||
        f === "7-30 DAYS" ||
        f === "8-30 DAYS" ||
        f === "< 30 DAYS"
      )
        return (
          b.days > 7 && b.days <= 30 && b.status?.toLowerCase() !== "expired"
        );
      if (
        f === "ATTENTION" ||
        f === "30-90 DAYS" ||
        f === "31-90 DAYS" ||
        f === "< 90 DAYS"
      )
        return (
          b.days > 30 && b.days <= 90 && b.status?.toLowerCase() !== "expired"
        );
      if (f === "SAFE" || f === "90+ DAYS")
        return b.days > 90 && b.status?.toLowerCase() !== "expired";
      if (f === "ACTIVE")
        return b.days >= 0 && b.status?.toLowerCase() !== "expired";
      return b.status?.toLowerCase() === f.toLowerCase();
    });
  }, [batches, invSearch, invFilter]);
  const dynamicStats = useMemo(() => {
    // Use unified backend metrics if available, fallback to local calculation
    if (expiryMetrics) {
      return [
        {
          label: "EXPIRED NOW",
          val: expiryMetrics.expiredBatches ?? 0,
          col: "var(--danger)",
          icon: CalendarX,
          key: "EXPIRED",
        },
        {
          label: "EXPIRING < 7 DAYS",
          val: expiryMetrics.expiring7Batches ?? 0,
          col: "var(--warning)",
          icon: CalendarX,
          key: "< 7 DAYS",
        },
        {
          label: "EXPIRING 7-30 DAYS",
          val: expiryMetrics.expiring30Batches ?? 0,
          col: "var(--warning)",
          icon: CalendarDays,
          key: "7-30 DAYS",
        },
        {
          label: "EXPIRING 30-90 DAYS",
          val: expiryMetrics.expiring90Batches ?? 0,
          col: "var(--info)",
          icon: CalendarCheck,
          key: "30-90 DAYS",
        },
        {
          label: "TOTAL BATCHES",
          val: expiryMetrics.totalBatches ?? batches.length,
          col: "var(--primary)",
          icon: Layers,
          key: "ALL",
        },
      ];
    }

    // Fallback: local calculation from batch data
    const activeBatches = batches.filter((b) => (b.qty || b.quantity) > 0);
    const expired = activeBatches.filter(
      (b) => b.days < 0 || b.status?.toLowerCase() === "expired",
    ).length;
    const expiring7Days = activeBatches.filter(
      (b) =>
        b.days >= 0 && b.days <= 7 && b.status?.toLowerCase() !== "expired",
    ).length;
    const expiring30Days = activeBatches.filter(
      (b) =>
        b.days > 7 && b.days <= 30 && b.status?.toLowerCase() !== "expired",
    ).length;
    const expiring90Days = activeBatches.filter(
      (b) =>
        b.days > 30 && b.days <= 90 && b.status?.toLowerCase() !== "expired",
    ).length;
    return [
      {
        label: "EXPIRED NOW",
        val: expired,
        col: "var(--danger)",
        icon: CalendarX,
        key: "EXPIRED",
      },
      {
        label: "EXPIRING < 7 DAYS",
        val: expiring7Days,
        col: "var(--warning)",
        icon: CalendarX,
        key: "< 7 DAYS",
      },
      {
        label: "EXPIRING 7-30 DAYS",
        val: expiring30Days,
        col: "var(--warning)",
        icon: CalendarDays,
        key: "7-30 DAYS",
      },
      {
        label: "EXPIRING 30-90 DAYS",
        val: expiring90Days,
        col: "var(--info)",
        icon: CalendarCheck,
        key: "30-90 DAYS",
      },
      {
        label: "TOTAL BATCHES",
        val: activeBatches.length,
        col: "var(--primary)",
        icon: Layers,
        key: "ALL",
      },
    ];
  }, [batches, expiryMetrics]);
  const timelineCounts = useMemo(() => {
    // Use unified backend metrics if available
    if (expiryMetrics) {
      const expired = expiryMetrics.expiredBatches ?? 0;
      const urg7 = expiryMetrics.expiring7Batches ?? 0;
      const urg30 = expiryMetrics.expiring30Batches ?? 0;
      const urg90 = expiryMetrics.expiring90Batches ?? 0;
      const total = expiryMetrics.totalBatches ?? (batches.length || 1);
      const safe =
        expiryMetrics.safeBatches ??
        Math.max(0, total - expired - urg7 - urg30 - urg90);
      return {
        expired,
        urg7,
        urg30,
        urg90,
        safe,
        total: total || 1,
      };
    }

    // Fallback: local calculation
    const activeBatches = batches.filter((b) => (b.qty || b.quantity) > 0);
    const expired = activeBatches.filter(
      (b) => b.status === "expired" || b.days < 0,
    ).length;
    const urg7 = activeBatches.filter(
      (b) => b.days >= 0 && b.days <= 7 && b.status !== "expired",
    ).length;
    const urg30 = activeBatches.filter(
      (b) => b.days > 7 && b.days <= 30 && b.status !== "expired",
    ).length;
    const urg90 = activeBatches.filter(
      (b) => b.days > 30 && b.days <= 90 && b.status !== "expired",
    ).length;
    const safe = activeBatches.filter(
      (b) => (b.days > 90 || b.status === "safe") && b.status !== "expired",
    ).length;
    const total = activeBatches.length || 1;
    return {
      expired,
      urg7,
      urg30,
      urg90,
      safe,
      total,
    };
  }, [batches, expiryMetrics]);
  const fifoMedicines = useMemo(() => {
    const grouped = {};
    batches.forEach((b) => {
      if (!grouped[b.med]) grouped[b.med] = [];
      grouped[b.med].push(b);
    });
    Object.keys(grouped).forEach((med) => {
      grouped[med].sort((a, b) => (a.days || 999) - (b.days || 999));
      grouped[med] = grouped[med].map((b, i) => ({
        ...b,
        rank: i + 1,
      }));
    });
    return grouped;
  }, [batches]);
  const exportExpiryReport = async () => {
    if (isExportingRef.current) return;
    isExportingRef.current = true;
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Expiry Report");
      worksheet.columns = [
        {
          header: "Medicine Name",
          key: "Medicine",
          width: 25,
        },
        {
          header: "Batch Number",
          key: "Batch",
          width: 15,
        },
        {
          header: "Supplier Name",
          key: "Supplier",
          width: 20,
        },
        {
          header: "Manufacturer Name",
          key: "Manufacturer",
          width: 20,
        },
        {
          header: "Purchase Invoice",
          key: "PurchaseInvoice",
          width: 15,
        },
        {
          header: "Purchase Date",
          key: "PurchaseDate",
          width: 12,
        },
        {
          header: "Received Date",
          key: "ReceivedDate",
          width: 12,
        },
        {
          header: "Manufacturing Date",
          key: "MFG",
          width: 12,
        },
        {
          header: "Expiry Date",
          key: "Expiry",
          width: 12,
        },
        {
          header: "Days Left",
          key: "DaysLeft",
          width: 12,
        },
        {
          header: "Quantity",
          key: "Quantity",
          width: 10,
        },
        {
          header: "Purchase Price",
          key: "PurchasePrice",
          width: 15,
        },
        {
          header: "Stock Value",
          key: "Value",
          width: 12,
        },
        {
          header: "Status",
          key: "Status",
          width: 12,
        },
        {
          header: "Return Eligible",
          key: "ReturnEligible",
          width: 15,
        },
        {
          header: "Return Status",
          key: "ReturnStatus",
          width: 15,
        },
      ];
      const reportData = batches.map((b) => ({
        Medicine: b.med,
        Batch: b.batchNumber,
        Supplier: b.supplier || "Unknown",
        Manufacturer: b.manufacturer || "Unknown",
        PurchaseInvoice: b.purchaseInvoice || "N/A",
        PurchaseDate: b.purchaseDate || "N/A",
        ReceivedDate: b.received || "N/A",
        MFG: b.mfg,
        Expiry: b.exp,
        DaysLeft: b.days < 0 ? "EXPIRED" : `${b.days} Days`,
        Quantity: b.qty,
        PurchasePrice: `₹${b.purchasePrice.toFixed(2)}`,
        Value: `₹${b.val.toFixed(2)}`,
        Status: b.status.toUpperCase(),
        ReturnEligible: b.returnEligible,
        ReturnStatus: b.returnStatus,
      }));
      worksheet.addRows(reportData);
      const buffer = await workbook.xlsx.writeBuffer();
      const fileData = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(fileData, `expiry-report-${Date.now()}.xlsx`);
      showToast("Expiry report exported successfully", "success");
    } catch (error) {
      console.error("Failed to export expiry report", error);
      showToast("Export failed", "error");
    } finally {
      isExportingRef.current = false;
    }
  };
  const handleAction = (type, item) => {
    setSelectedItem(item);
    setActionType(type);
    dispatchActionModal({
      type: "INIT_ACTION",
      payload: item,
    });
    setProcessing(false);
    setShowActionModal(true);
  };
  const matchesSelectedItem = (item) => {
    if (selectedItem?.id) return item.id === selectedItem.id;
    if (selectedItem?.batch) return item.batch === selectedItem.batch;
    return false;
  };
  const confirmAction = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      if (actionType === "RETURN") {
        const selectedItemData = batches.find((b) => matchesSelectedItem(b));
        if (!selectedItemData) throw new Error("Batch not found");
        if (!selectedItemData.supplierId) {
          throw new Error(
            "No supplier assigned to this batch. Please assign a supplier first using the 'Assign Supplier' button.",
          );
        }
        await api.post("/supplier-returns", {
          supplierId: selectedItemData.supplierId,
          items: [
            {
              medicineId: selectedItemData.medicineId,
              batchId: selectedItemData.batchId,
              quantity: returnQty || 1,
              reason: returnReason || "Expired Stock Return",
            },
          ],
          reason: returnReason || "Expired stock returned to supplier",
        });
        setBatches((prev) =>
          prev.map((item) => {
            if (matchesSelectedItem(item)) {
              const newQty = Math.max((item.qty || 0) - (returnQty || 1), 0);
              return {
                ...item,
                qty: newQty,
              };
            }
            return item;
          }),
        );
        showToast(`Return of ${returnQty} units initiated`, "success");
      } else if (actionType === "DISCOUNT") {
        setBatches((prev) =>
          prev.map((item) => {
            if (matchesSelectedItem(item)) {
              return {
                ...item,
                discountApplied: true,
              };
            }
            return item;
          }),
        );
        showToast(`${discountPct}% discount applied`, "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed", "error");
    } finally {
      setProcessing(false);
      setShowActionModal(false);
    }
  };

  // ─── Bulk Disposal helpers ───────────────────────────────────
  const expiredBatches = useMemo(
    () => filteredBatches.filter((b) => b.days < 0 || b.status === "expired"),
    [filteredBatches],
  );
  const toggleBatch = useCallback(
    (batchId) => {
      setSelectedBatchIds((prev) => {
        const next = new Set(prev);
        next.has(batchId) ? next.delete(batchId) : next.add(batchId);
        return next;
      });
    },
    [setSelectedBatchIds],
  );
  const toggleSelectAll = useCallback(() => {
    setSelectedBatchIds((prev) => {
      if (prev.size === expiredBatches.length) return new Set();
      return new Set(expiredBatches.map((b) => b.batchId));
    });
  }, [expiredBatches, setSelectedBatchIds]);
  const selectedExpiredBatches = useMemo(
    () => expiredBatches.filter((b) => selectedBatchIds.has(b.batchId)),
    [expiredBatches, selectedBatchIds],
  );
  const disposalSummary = useMemo(() => {
    const units = selectedExpiredBatches.reduce((s, b) => s + (b.qty || 0), 0);
    const loss = selectedExpiredBatches.reduce((s, b) => s + (b.val || 0), 0);
    return {
      count: selectedExpiredBatches.length,
      units,
      loss,
    };
  }, [selectedExpiredBatches]);
  const disposingRef = useRef(false);
  const handleBulkDispose = async () => {
    if (disposingRef.current) return;
    if (!selectedBatchIds.size) return;
    disposingRef.current = true;
    setDisposing(true);
    try {
      const batchIds = [...selectedBatchIds];
      const res = await disposeInventory({
        batchIds,
        reason: "EXPIRED",
        notes: "Bulk disposal via Expiry & Batch Intelligence",
      });
      const data = res.data?.data || res.data || {};
      showToast(
        `✅ ${data.disposedBatches ?? batchIds.length} batches disposed — ₹${(
          data.inventoryLoss ?? disposalSummary.loss
        ).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })} written off`,
        "success",
      );
      // Remove disposed batches from local state immediately
      setBatches((prev) =>
        prev.filter((b) => !selectedBatchIds.has(b.batchId)),
      );
      setSelectedBatchIds(new Set());
      setShowDisposeModal(false);
    } catch (err) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Disposal failed";
      showToast(msg, "error");
    } finally {
      disposingRef.current = false;
      setDisposing(false);
    }
  };
  const bulkAssigningRef = useRef(false);
  const handleBulkAssignSupplier = async () => {
    if (bulkAssigningRef.current) return;
    if (!selectedBatchIds.size || !bulkSupplierId) return;
    bulkAssigningRef.current = true;
    setBulkAssigning(true);
    try {
      const batchIds = [...selectedBatchIds];
      await bulkAssignBatchSupplier(batchIds, bulkSupplierId);
      const supplierName =
        suppliers.find((s) => s.id === bulkSupplierId)?.name || "";
      showToast(
        `Supplier "${supplierName}" assigned to ${batchIds.length} batches`,
        "success",
      );
      setBatches((prev) =>
        prev.map((b) =>
          selectedBatchIds.has(b.batchId)
            ? {
                ...b,
                supplierId: bulkSupplierId,
                supplier: supplierName,
              }
            : b,
        ),
      );
      setSelectedBatchIds(new Set());
      setShowBulkSupplierModal(false);
      setBulkSupplierId("");
    } catch (err) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Assignment failed";
      showToast(msg, "error");
    } finally {
      bulkAssigningRef.current = false;
      setBulkAssigning(false);
    }
  };
  const bulkReturningRef = useRef(false);
  const handleBulkReturnToSupplier = async () => {
    if (bulkReturningRef.current) return;
    if (!selectedBatchIds.size) return;
    const selectedBatches = batches.filter((b) =>
      selectedBatchIds.has(b.batchId),
    );
    const withoutSupplier = selectedBatches.filter((b) => !b.supplierId);
    if (withoutSupplier.length > 0) {
      showToast(
        `${withoutSupplier.length} batches have no supplier assigned. Please assign suppliers first.`,
        "error",
      );
      return;
    }
    const grouped = {};
    for (const b of selectedBatches) {
      if (!grouped[b.supplierId]) grouped[b.supplierId] = [];
      grouped[b.supplierId].push(b);
    }
    bulkReturningRef.current = true;
    setBulkReturning(true);
    try {
      await Promise.all(
        Object.entries(grouped).map(async ([supplierId, items]) => {
          await api.post("/supplier-returns", {
            supplierId,
            items: items.map((b) => ({
              medicineId: b.medicineId,
              batchId: b.batchId,
              quantity: b.qty || 1,
              reason: "EXPIRED",
            })),
            reason: "Bulk expired stock return to supplier",
          });
        }),
      );
      const totalReturns = Object.values(grouped).reduce(
        (acc, items) => acc + items.length,
        0,
      );
      showToast(
        `${totalReturns} batches returned across ${Object.keys(grouped).length} supplier(s)`,
        "success",
      );
      setBatches((prev) =>
        prev.filter((b) => !selectedBatchIds.has(b.batchId)),
      );
      setSelectedBatchIds(new Set());
    } catch (err) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Return failed";
      showToast(msg, "error");
    } finally {
      bulkReturningRef.current = false;
      setBulkReturning(false);
    }
  };
  const handleExportNoSupplier = async () => {
    if (isExportingRef.current) return;
    isExportingRef.current = true;
    try {
      const res = await exportBatchesWithoutSupplier();
      const { batches, suppliers } = res.data?.data || {};
      const supplierNames = suppliers.map((s) => s.name);
      const rows = [
        [
          "batchId",
          "batchNumber",
          "medicineName",
          "expiryDate",
          "quantity",
          "supplierName",
        ],
        ...batches.map((b) => [
          b.batchId,
          b.batchNumber,
          b.med,
          b.exp?.split("T")[0] || "",
          b.qty,
          b.supplier,
        ]),
      ];
      const csv = rows
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
      const supplierList =
        "\n\n# Available suppliers:\n" + supplierNames.join("\n");
      const blob = new Blob([csv + supplierList], {
        type: "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batches-no-supplier-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(
        `Exported ${batches.length} batches. Edit supplierName column and import back.`,
        "success",
      );
    } catch (err) {
      showToast("Export failed: " + (err.message || "Unknown error"), "error");
    } finally {
      isExportingRef.current = false;
    }
  };
  const importingRef = useRef(false);
  const handleImportCsv = async () => {
    if (importingRef.current) return;
    if (!importFile) return;
    importingRef.current = true;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await importFile.text();
      const lines = text
        .split("\n")
        .filter((l) => l.trim() && !l.startsWith("#"));
      if (lines.length < 2)
        throw new Error("CSV must have a header row and at least one data row");
      const header = lines[0]
        .split(",")
        .map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      const batchIdIdx = header.indexOf("batchid");
      const supplierIdx = header.indexOf("suppliername");
      if (batchIdIdx === -1 || supplierIdx === -1) {
        throw new Error("CSV must have 'batchId' and 'supplierName' columns");
      }
      const assignments = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
        const batchId = cols[batchIdIdx];
        const supplierName = cols[supplierIdx];
        if (batchId && supplierName) {
          assignments.push({
            batchId,
            supplierName,
          });
        }
      }
      if (assignments.length === 0)
        throw new Error("No valid assignments found in CSV");
      const res = await importSupplierAssignments(assignments);
      const data = res.data?.data || {};
      setImportResult(data);
      showToast(
        `Import complete: ${data.updated || 0} updated, ${data.skipped || 0} skipped`,
        "success",
      );
    } catch (err) {
      showToast("Import failed: " + (err.message || "Unknown error"), "error");
    } finally {
      importingRef.current = false;
      setImporting(false);
    }
  };
  const handleExpiredCleared = useCallback(() => {
    setClearReloadKey((k) => k + 1);
  }, [setClearReloadKey]);

  const backfillingRef = useRef(false);
  const handleBackfillSuppliers = async () => {
    if (backfillingRef.current) return;
    backfillingRef.current = true;
    setBackfilling(true);
    try {
      const res = await backfillBatchSupplier();
      const data = res.data?.data || {};
      showToast(
        `Backfill complete: ${data.batchesUpdated || 0} batches updated across ${data.medicinesProcessed || 0} medicines`,
        "success",
      );
    } catch (err) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Backfill failed";
      showToast(msg, "error");
    } finally {
      backfillingRef.current = false;
      setBackfilling(false);
    }
  };
  const handleRemindPos = (item) => {
    setReminders((prev) => [...prev, item.med || item.batch]);
    showToast(`POS reminder set for ${item.med}`, "success");
  };
  const handleViewBatch = (b) => {
    setViewBatch(b);
    setShowViewBatchModal(true);
  };
  const handleEditBatch = (b) => {
    setEditBatch({
      ...b,
    });
    setShowEditBatchModal(true);
  };
  const saveEditBatch = async () => {
    if (isSavingEditRef.current) return;
    isSavingEditRef.current = true;
    try {
      await api.put(`/inventory/batches/${editBatch.batchId}`, {
        batchNumber: editBatch.batch,
        expiryDate: editBatch.exp,
        manufacturingDate: editBatch.mfg
          ? new Date(editBatch.mfg).toISOString()
          : null,
        purchasePrice: editBatch.purchasePrice,
        rackLocation: editBatch.rackLocation || undefined,
      });
      setBatches((prev) =>
        prev.map((b) =>
          b.batchId === editBatch.batchId
            ? {
                ...b,
                ...editBatch,
              }
            : b,
        ),
      );
      setShowEditBatchModal(false);
      showToast("Batch updated successfully", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update batch",
        "error",
      );
    } finally {
      isSavingEditRef.current = false;
    }
  };
  const handleDeleteClick = (b) => {
    setSelectedBatchForDelete(b);
    setShowDeleteModal(true);
  };
  const confirmDeleteBatch = async () => {
    if (isDeletingBatchRef.current || !selectedBatchForDelete) return;
    isDeletingBatchRef.current = true;
    try {
      await api.delete(`/inventory/batches/${selectedBatchForDelete.batchId}`);
      setBatches((prev) =>
        prev.filter((item) => item.batchId !== selectedBatchForDelete.batchId),
      );
      showToast("Batch deleted successfully", "success");
      setShowDeleteModal(false);
      setSelectedBatchForDelete(null);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete batch",
        "error",
      );
    } finally {
      isDeletingBatchRef.current = false;
    }
  };
  const addNewBatch = () => {
    if (!newBatch.med || !newBatch.qty) {
      showToast("Medicine name and quantity are required", "error");
      return;
    }
    const id = `B-${Date.now().toString(36).toUpperCase()}`;
    const today = new Date();
    const expDate = new Date(newBatch.exp || today);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    let status = "safe";
    if (diffDays < 0) status = "expired";
    else if (diffDays < 7) status = "danger";
    else if (diffDays < 30) status = "warning";
    const batch = {
      id,
      med: newBatch.med,
      brand: newBatch.brand || newBatch.supplier || "Unknown",
      supplier: newBatch.supplier || newBatch.brand || "Unknown",
      exp: newBatch.exp,
      days: diffDays,
      qty: safeNumber(newBatch.qty),
      val: safeNumber(newBatch.val) || 0,
      status,
      rank: 1,
      received: newBatch.received || today.toISOString().split("T")[0],
      mfg: newBatch.mfg || "",
    };
    setBatches((prev) => [...prev, batch]);
    setShowAddBatchModal(false);
    setNewBatch({
      med: "",
      brand: "",
      supplier: "",
      exp: "",
      mfg: "",
      qty: "",
      val: "",
      received: new Date().toISOString().split("T")[0],
    });
    showToast("Batch added successfully", "success");
  };
  return (
    <div className="expiry-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Expiry & Batch Intelligence</h1>
          <p className="page-subtitle">
            FIFO-enforced tracking, auto-alerts, and near-expiry action
            suggestions.
          </p>
          <div className="expiry-tabs">
            {["Timeline", "Inventory"].map((t) => (
              <button
                key={t}
                className={`expiry-tab ${activeTab === t.toLowerCase() ? "active" : ""}`}
                onClick={() => setActiveTab(t.toLowerCase())}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="page-header-actions expiry-header-actions">
          <button
            className="pos-btn outline"
            onClick={() => setShowConfigModal(true)}
          >
            <Bell size={16} /> Configure Alerts
          </button>
          <button className="pos-btn teal" onClick={exportExpiryReport}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      <div className="expiry-stats-grid">
        {dynamicStats.map((s) => {
          const isExpiredCard = s.key === "EXPIRED";
          return (
            <div
              key={s.key}
              className="pos-stat-card"
              style={{
                borderLeft:
                  filter === s.key
                    ? `4px solid ${s.col}`
                    : "1px solid var(--outline-variant)",
                position: "relative",
              }}
            >
              <button
                type="button"
                className="stat-card-clickable"
                onClick={() => setFilter(s.key)}
                style={{
                  background: "none",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  padding: 0,
                  color: "inherit",
                }}
              >
                <div className="stat-card-header">
                  <span className="stat-label">{s.label}</span>
                  <div
                    className="stat-icon"
                    style={{
                      backgroundColor: `${s.col}15`,
                      color: s.col,
                    }}
                  >
                    <s.icon size={16} />
                  </div>
                </div>
                <div className="stat-value">{s.val}</div>
              </button>
              {isExpiredCard && (
                <div
                  style={{
                    marginTop: 8,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ClearExpiredButton
                    showToast={showToast}
                    onCleared={handleExpiredCleared}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ───────────────────── TIMELINE TAB ───────────────────── */}
      <ExpiryBatchIntelligenceSection1
        setFilter={setFilter}
        setShowBulkSupplierModal={setShowBulkSupplierModal}
        setShowDisposeModal={setShowDisposeModal}
        setSearchQuery={setSearchQuery}
        selectedBatchIds={selectedBatchIds}
        toggleBatch={toggleBatch}
        handleAction={handleAction}
        setSelectedBatchIds={setSelectedBatchIds}
        activeTab={activeTab}
        loading={loading}
        timelineCounts={timelineCounts}
        handleExportNoSupplier={handleExportNoSupplier}
        handleBackfillSuppliers={handleBackfillSuppliers}
        backfilling={backfilling}
        handleBulkReturnToSupplier={handleBulkReturnToSupplier}
        bulkReturning={bulkReturning}
        searchQuery={searchQuery}
        expiredBatches={expiredBatches}
        toggleSelectAll={toggleSelectAll}
        filteredBatches={filteredBatches}
      />

      {/* ───────────────────── INVENTORY TAB ───────────────────── */}
      <ExpiryBatchIntelligenceSection2
        setInvSearch={setInvSearch}
        setShowInvFilterDropdown={setShowInvFilterDropdown}
        invFilter={invFilter}
        setInvFilter={setInvFilter}
        setShowAddBatchModal={setShowAddBatchModal}
        handleViewBatch={handleViewBatch}
        handleEditBatch={handleEditBatch}
        handleDeleteClick={handleDeleteClick}
        activeTab={activeTab}
        invSearch={invSearch}
        showInvFilterDropdown={showInvFilterDropdown}
        invFilteredBatches={invFilteredBatches}
      />

      {/* ───────────────────── FIFO TAB ───────────────────── */}
      <ExpiryBatchIntelligenceSection3
        fifoEnabled={fifoEnabled}
        setShowFifoConfirm={setShowFifoConfirm}
        setFifoEnabled={setFifoEnabled}
        setExpandedMed={setExpandedMed}
        expandedMed={expandedMed}
        activeTab={activeTab}
        fifoMedicines={fifoMedicines}
      />

      {/* ───────────────────── SUGGESTIONS TAB ───────────────────── */}
      <ExpiryBatchIntelligenceSection4
        reminders={reminders}
        suggestions={suggestions}
        handleAction={handleAction}
        handleRemindPos={handleRemindPos}
        activeTab={activeTab}
      />

      {/* ───────────────────── CONFIG MODAL ───────────────────── */}
      <ExpiryBatchIntelligenceSection5
        configState={{
          show: showConfigModal,
          setShow: setShowConfigModal,
          settings: alertSettings,
          setSettings: setAlertSettings,
          frequency,
          setFrequency,
          isSavingRef: isSavingConfigRef,
          showToast,
        }}
        actionState={{
          show: showActionModal,
          setShow: setShowActionModal,
          type: actionType,
          processing,
          item: selectedItem,
          returnReason,
          setReturnReason,
          returnQty,
          setReturnQty,
          discountPct,
          setDiscountPct,
          discountDuration,
          setDiscountDuration,
          disposalMethod,
          setDisposalMethod,
          disposalNotes,
          setDisposalNotes,
          confirm: confirmAction,
        }}
        viewState={{
          show: showViewBatchModal,
          setShow: setShowViewBatchModal,
          batch: viewBatch,
        }}
        editState={{
          show: showEditBatchModal,
          setShow: setShowEditBatchModal,
          batch: editBatch,
          setBatch: setEditBatch,
          save: saveEditBatch,
        }}
        addState={{
          show: showAddBatchModal,
          setShow: setShowAddBatchModal,
          batch: newBatch,
          setBatch: setNewBatch,
          add: addNewBatch,
        }}
        fifoState={{
          show: showFifoConfirm,
          setShow: setShowFifoConfirm,
          setFifoEnabled,
          showToast,
        }}
        deleteState={{
          show: showDeleteModal,
          setShow: setShowDeleteModal,
          batch: selectedBatchForDelete,
          confirm: confirmDeleteBatch,
        }}
      />

      {/* ── Disposal Confirmation Modal ── */}
      <ExpiryBatchIntelligenceSection6
        disposing={disposing}
        setShowDisposeModal={setShowDisposeModal}
        showDisposeModal={showDisposeModal}
        disposalSummary={disposalSummary}
        handleBulkDispose={handleBulkDispose}
      />

      {/* ── Bulk Assign Supplier Modal ── */}
      <ExpiryBatchIntelligenceSection7
        bulkAssigning={bulkAssigning}
        setShowBulkSupplierModal={setShowBulkSupplierModal}
        setBulkSupplierId={setBulkSupplierId}
        showBulkSupplierModal={showBulkSupplierModal}
        selectedBatchIds={selectedBatchIds}
        bulkSupplierId={bulkSupplierId}
        suppliers={suppliers}
        handleBulkAssignSupplier={handleBulkAssignSupplier}
      />

      {/* ── Import CSV Modal ── */}
      <ExpiryBatchIntelligenceSection8
        importing={importing}
        setShowImportModal={setShowImportModal}
        setImportResult={setImportResult}
        setImportFile={setImportFile}
        showImportModal={showImportModal}
        importResult={importResult}
        importFile={importFile}
        handleImportCsv={handleImportCsv}
      />
    </div>
  );
}
