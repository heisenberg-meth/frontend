import {
  useState,
  useReducer,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useEffectEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";
import {
  IndianRupee,
  Receipt,
  ArrowLeft,
  History,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { StatCard } from "./common/StatCard.jsx";
import {
  normalizeArrayResponse,
  normalizeObjectResponse,
} from "../utils/apiNormalizer";
import { useAuth } from "../hooks/useAuth";
import { normalizeInvoice } from "../utils/billingNormalizer";
import "../styles/BillingPOS.css";
import InvoiceGeneratedModal from "./invoice/InvoiceGeneratedModal";
import { BillingPOSSection1 } from "./billing/BillingPOSSection.jsx";
import {
  BillingPOSSection2,
  BillingPOSSection3,
  BillingPOSSection4,
  BillingPOSSection5,
  BillingPOSSection6,
} from "./billing/BillingsPOSSection1.jsx";
import { validatePatientPhone } from "../utils/validatePatientPhone.js";

const fieldMap = {
  patientName: [["patient", "fullName"], "patientName", "customerName"],
  patientPhone: [["patient", "phone"], "patientPhone", "customerPhone"],
  invoiceNumber: ["invoiceNumber", "billNumber", "id"],
  date: ["invoiceDate", "createdAt", "date"],
  subtotal: ["subtotal", "subTotal", "taxableAmount"],
  total: ["totalAmount", "grandTotal", "total"],
  sgst: ["sgst", "sgstAmount"],
  cgst: ["cgst", "cgstAmount"],
  discount: ["discountAmount", "discount"],
};
const headers = [
  ["Medicine", "left"],
  ["Batch No.", "center"],
  ["Qty", "center"],
  ["MRP ₹", "right"],
  ["Disc%", "center"],
  ["GST%", "center"],
  ["Total", "right"],
];

const generateInvoiceId = () =>
  `INV-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

const safeNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};
const getNested = (obj, path) => {
  const parts = path.split(".");
  let val = obj;
  for (const p of parts) {
    if (val == null) return undefined;
    val = val[p];
  }
  return val;
};
const resolveInvoiceField = (invoice, field, fallback) => {
  const keys = fieldMap[field] || [field];
  for (const key of keys) {
    if (Array.isArray(key)) {
      const val = getNested(invoice, key.join("."));
      if (val != null) return val;
    } else {
      if (invoice?.[key] != null) return invoice[key];
    }
  }
  return fallback;
};
const resolveInvoiceItems = (invoice) => {
  if (Array.isArray(invoice?.items)) return invoice.items;
  if (Array.isArray(invoice?.saleItems)) return invoice.saleItems;
  if (Array.isArray(invoice?.itemsList)) return invoice.itemsList;
  if (Array.isArray(invoice?.lineItems)) return invoice.lineItems;
  return [];
};
const normalizeInvoiceItem = (item) => ({
  ...item,
  invoiceItemId: item?.invoiceItemId || item?.id || null,
  medicineId: item?.medicineId || item?.medicine?.id || null,
  name: item?.medicine?.name || item?.medicineName || item?.name || "Unknown",
  qty: item?.quantity ?? item?.qty ?? 0,
  price: item?.unitPrice ?? item?.price ?? item?.mrp ?? 0,
  mrp: item?.unitPrice ?? item?.price ?? item?.mrp ?? 0,
  gst: item?.gst ?? item?.gstPercentage ?? 0,
  batchId: item?.batchId || item?.batch?.id || null,
  batchNumber:
    item?.batchNumber ||
    item?.batchNo ||
    item?.batch?.batchNumber ||
    item?.batch?.batchNo ||
    item?.batchCode ||
    "—",
  discPercent:
    item?.discPercent ??
    item?.discountPercentage ??
    item?.discountPercent ??
    item?.discount ??
    0,
  totalPrice: item?.totalPrice ?? item?.amount ?? 0,
});

export default function BillingPOS({
  showToast: parentShowToast,
  storeProfile,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userKey = user?.id || "default";
  const showToast = useMemo(
    () => parentShowToast || (() => {}),
    [parentShowToast],
  );
  const [formState, dispatchForm] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "RESET_FORM":
          return {
            ...state,
            editingDraft: null,
            lineItems: [],
            patient: {
              id: null,
              name: "",
              phone: "",
            },
            discount: 0,
            paymentMode: "CASH",
            search: "",
            medResults: [],
            showDropdown: false,
          };
        case "SET_MULTIPLE":
          return {
            ...state,
            ...action.payload,
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
      userKey,
    },
    (initialArgs) => {
      let initialPatient = {
        id: null,
        name: "",
        phone: "",
      };
      try {
        const saved = localStorage.getItem(
          `currentBillingPatient_${initialArgs.userKey}`,
        );
        if (saved) initialPatient = JSON.parse(saved);
      } catch {
        /* ignore */
      }
      let initialLineItems = [];
      try {
        const saved = localStorage.getItem(
          `currentBillingItems_${initialArgs.userKey}`,
        );
        if (saved) initialLineItems = JSON.parse(saved);
      } catch {
        /* ignore */
      }
      return {
        patient: initialPatient,
        lineItems: initialLineItems,
        search: "",
        showDropdown: false,
        discount: "",
        paymentMode: "CASH",
        medResults: [],
        editingDraft: null,
      };
    },
  );
  const {
    patient,
    lineItems,
    search,
    showDropdown,
    discount,
    paymentMode,
    medResults,
    editingDraft,
  } = formState;
  const setPatient = useCallback(
    (val) =>
      dispatchForm({
        type: "SET_FIELD",
        field: "patient",
        value: val,
      }),
    [],
  );
  const setLineItems = useCallback(
    (val) =>
      dispatchForm({
        type: "SET_FIELD",
        field: "lineItems",
        value: val,
      }),
    [],
  );
  const setSearch = useCallback(
    (val) =>
      dispatchForm({
        type: "SET_FIELD",
        field: "search",
        value: val,
      }),
    [],
  );
  const setShowDropdown = useCallback(
    (val) =>
      dispatchForm({
        type: "SET_FIELD",
        field: "showDropdown",
        value: val,
      }),
    [],
  );
  const setDiscount = useCallback(
    (val) =>
      dispatchForm({
        type: "SET_FIELD",
        field: "discount",
        value: val,
      }),
    [],
  );
  const setPaymentMode = useCallback(
    (val) =>
      dispatchForm({
        type: "SET_FIELD",
        field: "paymentMode",
        value: val,
      }),
    [],
  );
  const setMedResults = useCallback(
    (val) =>
      dispatchForm({
        type: "SET_FIELD",
        field: "medResults",
        value: val,
      }),
    [],
  );
  const setEditingDraft = useCallback(
    (val) =>
      dispatchForm({
        type: "SET_FIELD",
        field: "editingDraft",
        value: val,
      }),
    [],
  );
  const [showPreview, setShowPreview] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [, setMedLoading] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const barcodeInputRef = useRef(null);
  const [findLoading, setFindLoading] = useState(false);
  const [patientResults, setPatientResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [newPatientMsg, setNewPatientMsg] = useState("");
  const [bills, setBills] = useState([]);
  const [billReturnState, dispatchBillReturn] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "INIT_RETURN":
          return {
            ...state,
            selectedBill: action.payload,
            returnItems: [],
            returnReason: "Customer Request",
            returnNotes: "",
            showReturnBillModal: true,
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
      returnItems: [],
      selectedBill: null,
      showReturnBillModal: false,
      returnReason: "Customer Request",
      returnNotes: "",
    },
  );
  const {
    returnItems,
    selectedBill,
    showReturnBillModal,
    returnReason,
    returnNotes,
  } = billReturnState;
  const setReturnItems = useCallback(
    (val) =>
      dispatchBillReturn({
        type: "SET_FIELD",
        field: "returnItems",
        value: val,
      }),
    [],
  );
  const setSelectedBill = useCallback(
    (val) =>
      dispatchBillReturn({
        type: "SET_FIELD",
        field: "selectedBill",
        value: val,
      }),
    [],
  );
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [, setPrintLoading] = useState(false);
  const [phoneFieldError, setPhoneFieldError] = useState("");
  const [findError, setFindError] = useState("");
  const [showAllBillsModal, setShowAllBillsModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState("");
  const [returnModalSelectedBill, setReturnModalSelectedBill] = useState(null);
  const [returnModalItems, setReturnModalItems] = useState({});
  const [returnModalReason, setReturnModalReason] = useState("Patient Request");
  const setShowReturnBillModal = useCallback(
    (val) =>
      dispatchBillReturn({
        type: "SET_FIELD",
        field: "showReturnBillModal",
        value: val,
      }),
    [],
  );
  const [showBillDetailDrawer, setShowBillDetailDrawer] = useState(false);
  const [allBillsFilter, setAllBillsFilter] = useState("All");
  const [billCardFlash, setBillCardFlash] = useState(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);

  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [allBillsLoaded, setAllBillsLoaded] = useState(false);
  const [showNewBillConfirm, setShowNewBillConfirm] = useState(false);
  const [loyaltyProfile, setLoyaltyProfile] = useState(null);
  const setReturnReason = useCallback(
    (val) =>
      dispatchBillReturn({
        type: "SET_FIELD",
        field: "returnReason",
        value: val,
      }),
    [],
  );
  const setReturnNotes = useCallback(
    (val) =>
      dispatchBillReturn({
        type: "SET_FIELD",
        field: "returnNotes",
        value: val,
      }),
    [],
  );
  const [processingReturn, setProcessingReturn] = useState(false);
  const todayDateStr = new Date().toLocaleDateString("en-CA");
  const todayBills = useMemo(
    () =>
      bills.filter((b) => {
        const bd = b.date ? b.date.split("T")[0] : "";
        return bd === todayDateStr;
      }),
    [bills, todayDateStr],
  );
  const returnsTodayCount = useMemo(
    () =>
      todayBills.filter((bill) =>
        ["RETURNED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(
          String(bill.status || "").toUpperCase(),
        ),
      ).length,
    [todayBills],
  );
  useEffect(() => {
    localStorage.setItem(
      `currentBillingItems_${userKey}`,
      JSON.stringify(lineItems),
    );
  }, [lineItems, userKey]);
  useEffect(() => {
    localStorage.setItem(
      `currentBillingPatient_${userKey}`,
      JSON.stringify(patient),
    );
  }, [patient, userKey]);
  useEffect(() => {
    let mounted = true;
    const loadBills = async () => {
      try {
        const res = await api.get(API_ROUTES.BILLING_INVOICES, {
          params: {
            limit: 50,
          },
        });
        if (!mounted) return;
        const normalized = normalizeArrayResponse(res, "invoices").map(
          normalizeInvoice,
        );
        setBills(normalized);
      } catch (err) {
        console.error(err);
      }
    };
    loadBills();
    return () => {
      mounted = false;
    };
  }, []);
  const handleSearchChange = (value) => {
    setSearch(value);
    if (value.length < 2) {
      setMedResults([]);
      setShowDropdown(false);
      return;
    }
    setShowDropdown(true);
  };
  const clearSearch = () => {
    setSearch("");
    setMedResults([]);
    setShowDropdown(false);
  };
  useEffect(() => {
    if (search.length >= 2) {
      const delayDebounceFn = setTimeout(async () => {
        setMedLoading(true);
        try {
          const res = await api.get(
            API_ROUTES.INVENTORY_MEDICINES_AUTOCOMPLETE,
            {
              params: {
                q: search,
              },
            },
          );
          setMedResults(normalizeArrayResponse(res));
          setShowDropdown(true);
        } catch (err) {
          console.error(err);
        } finally {
          setMedLoading(false);
        }
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, setMedLoading, setMedResults, setShowDropdown]);
  const handleFindPatient = async () => {
    if (!patient.phone.trim()) return;
    setFindLoading(true);
    setFindError("");
    try {
      const res = await api.get(API_ROUTES.PATIENTS, {
        params: {
          phone: patient.phone,
        },
      });
      const results = normalizeArrayResponse(res, "patients");
      if (results.length > 0) {
        setPatientResults(results);
        setShowPatientDropdown(true);
      } else {
        setNewPatientMsg("New patient detected");
        setPatientResults([]);
      }
    } catch (err) {
      console.error(err);
      setFindError(err.response?.data?.message || "Patient search failed");
    } finally {
      setFindLoading(false);
    }
  };
  const selectPatient = async (p) => {
    const nextPatient = {
      id: p.id,
      name: p.fullName || p.name,
      phone: p.phone,
    };
    setPatient(nextPatient);
    setShowPatientDropdown(false);
    setNewPatientMsg("");
    try {
      const res = await api.get(`${API_ROUTES.PATIENTS}/${p.id}/loyalty`);
      setLoyaltyProfile(normalizeObjectResponse(res));
    } catch (err) {
      console.error(err);
      setLoyaltyProfile(null);
    }
  };
  const subtotal = useMemo(
    () =>
      lineItems.reduce((acc, item) => {
        const lineGross = safeNumber(item.price) * safeNumber(item.qty);
        return acc + lineGross;
      }, 0),
    [lineItems],
  );
  const discountPercentage = Number(discount || 0);
  const discountAmount = subtotal * (discountPercentage / 100);
  const tax = useMemo(() => {
    const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0;
    return lineItems.reduce((acc, item) => {
      const lineGross = safeNumber(item.price) * safeNumber(item.qty);
      const itemDisc = lineGross * discountRatio;
      const taxableAmount = lineGross - itemDisc;
      return acc + taxableAmount * (safeNumber(item.gst) / 100);
    }, 0);
  }, [lineItems, subtotal, discountAmount]);
  const grandTotal = Math.max(0, subtotal + tax - discountAmount);
  const avgGst =
    lineItems.length > 0
      ? (
          lineItems.reduce((acc, item) => acc + safeNumber(item.gst), 0) /
          lineItems.length
        ).toFixed(1)
      : 0;
  const cgstAmt = tax / 2;
  const sgstAmt = tax / 2;
  const visibleBills = todayBills.slice(0, 5);
  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const addToLineItems = (med) => {
    if (med.availableStock <= 0 || med.isOutOfStock) {
      showToast("Medicine out of stock", "error");
      return;
    }
    if (!med.batchId) {
      showToast("No active batch available for this medicine", "error");
      return;
    }
    setLineItems((prev) => {
      const exists = prev.find((i) => i.id === med.id);
      if (exists) {
        return prev.map((i) =>
          i.batchId === med.batchId
            ? {
                ...i,
                qty: i.qty + 1,
              }
            : i,
        );
      }
      const price = safeNumber(med.price || med.mrp || med.salePrice);
      return [
        ...prev,
        {
          ...med,
          qty: 1,
          price,
          mrp: price,
          gst: safeNumber(med.gst || med.gstPercentage || med.gstRate),
          total: price,
          discount: 0,
          availableStock: med.availableStock,
        },
      ];
    });
    setSearch("");
    setShowDropdown(false);
  };
  const removeRow = (batchId) =>
    setLineItems((prev) => prev.filter((i) => i.batchId !== batchId));
  const updateQty = (batchId, delta) => {
    setLineItems((prev) =>
      prev.map((i) => {
        if (i.batchId === batchId) {
          const newQty = Math.max(1, i.qty + delta);
          const maxAvail = i.availableStock ?? Infinity;
          if (newQty > maxAvail) {
            showToast(
              `Only ${maxAvail} unit${maxAvail !== 1 ? "s" : ""} available in stock`,
              "error",
            );
            return i;
          }
          return {
            ...i,
            qty: newQty,
            total: safeNumber(i.price) * newQty,
          };
        }
        return i;
      }),
    );
  };
  const resetBillForm = useCallback(() => {
    dispatchForm({
      type: "RESET_FORM",
    });
    showToast("Form Reset", "info");
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  }, [showToast]);
  const handleSaveDraft = useCallback(async () => {
    if (!user?.branchId) {
      setDraftError("Branch context missing");
      showToast("Branch context missing. Cannot create draft.", "error");
      return;
    }
    if (Number.isNaN(grandTotal)) {
      setDraftError("Invalid total amount calculation");
      showToast("Invalid total amount calculation", "error");
      return;
    }
    if (lineItems.length === 0) {
      setDraftError("Add at least one medicine to save draft");
      return;
    }
    if (!isWalkIn) {
      const phoneError = validatePatientPhone(patient.phone);

      if (phoneError) {
        setPhoneFieldError(phoneError);
        showToast(phoneError, "error");
        return;
      }
    }
    setDraftError("");
    setDraftSaving(true);
    try {
      const payload = {
        patientId: isWalkIn ? null : patient.id,
        patientName: isWalkIn ? "Walk-in Customer" : patient.name || "Walk-in",
        patientPhone: isWalkIn ? "" : patient.phone || "",
        items: lineItems.map((i) => ({
          medicineId: i.id,
          medicineName: i.name,
          quantity: i.qty,
          unitPrice: i.price,
          gstPercentage: i.gst || 0,
          batchId: i.batchId || null,
        })),
        subtotal,
        cgst: cgstAmt,
        sgst: sgstAmt,
        discountPercentage: discountPercentage,
        discountAmount: discountAmount,
        discountType: "PERCENTAGE",
        totalAmount: grandTotal,
        paymentMethod: paymentMode,
        isDraft: true,
        branchId: user.branchId,
      };
      let saved;
      if (editingDraft) {
        const res = await api.put(
          `${API_ROUTES.BILLING_INVOICES}/${editingDraft.id}`,
          payload,
        );
        saved = res.data?.data || res.data;
        if (saved?.id) {
          const normalizedDraft = {
            ...normalizeInvoice(saved),
            status: "DRAFT",
            time: "Updated just now",
          };
          setBills((prev) =>
            prev.map((b) => (b.id === saved.id ? normalizedDraft : b)),
          );
          showToast(
            `Draft updated — ${saved.invoiceNumber || saved.id}`,
            "success",
          );
        }
      } else {
        const res = await api.post("billing/invoices/draft", payload);
        saved = res.data?.data || res.data;
        if (saved?.id) {
          const normalizedDraft = {
            ...normalizeInvoice(saved),
            status: "DRAFT",
            time: "Just now",
            timeline: ["Draft Created"],
          };
          setBills((prev) => [normalizedDraft, ...prev]);
          showToast(
            `Draft saved — ${saved.invoiceNumber || saved.id}`,
            "success",
          );
          setEditingDraft({
            id: saved.id,
            invoiceNumber: saved.invoiceNumber || saved.id,
            createdAt: saved.createdAt || new Date().toISOString(),
          });
        }
      }
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 1500);
    } catch (err) {
      console.error("[DRAFT] Save failed:", err);
      showToast(err.response?.data?.error || "Failed to save draft", "error");
    } finally {
      setDraftSaving(false);
    }
  }, [
    user.branchId,
    grandTotal,
    lineItems,
    showToast,
    isWalkIn,
    patient.id,
    patient.name,
    patient.phone,
    subtotal,
    cgstAmt,
    sgstAmt,
    discountPercentage,
    discountAmount,
    paymentMode,
    editingDraft,
    setEditingDraft,
  ]);
  const handleResumeDraftClick = useCallback(
    async (bill) => {
      try {
        const res = await api.get(`${API_ROUTES.BILLING_INVOICES}/${bill.id}`);
        const invoice = res.data?.data || res.data;
        if (!invoice) {
          showToast("Draft invoice not found", "error");
          return;
        }
        const loadedItems = (invoice.items || []).map((it) => ({
          id: it.medicineId || it.id,
          name: it.medicine?.name || it.medicineName || it.name || "Medicine",
          batchId: it.batchId || null,
          qty: Number(it.quantity || it.qty || 1),
          price: Number(it.unitPrice || it.price || 0),
          gst: Number(it.gstPercentage || it.gst || 0),
          mrp: Number(it.unitPrice || it.mrp || 0),
        }));
        dispatchForm({
          type: "SET_MULTIPLE",
          payload: {
            patient: {
              id: invoice.patientId || null,
              name:
                invoice.patientName ||
                invoice.customerName ||
                (invoice.patientId ? "" : "Walk-in Customer"),
              phone: invoice.patientPhone || invoice.customerPhone || "",
            },
            lineItems: loadedItems,
            discount: Number(invoice.discountPercentage || 0),
            paymentMode: invoice.paymentMethod || "CASH",
            editingDraft: {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber || invoice.id,
              createdAt:
                invoice.createdAt || bill.createdAt || new Date().toISOString(),
            },
          },
        });
        setIsWalkIn(
          !invoice.patientId || invoice.patientName === "Walk-in Customer",
        );
        setShowAllBillsModal(false);
        showToast(
          `Resumed draft — ${invoice.invoiceNumber || invoice.id}`,
          "success",
        );
      } catch (err) {
        console.error("[DRAFT] Resume failed:", err);
        showToast(
          err.response?.data?.error || "Failed to resume draft",
          "error",
        );
      }
    },
    [showToast],
  );
  const handleDeleteDraftConfirm = useCallback(
    async (bill) => {
      if (
        !window.confirm(
          `Are you sure you want to delete draft ${bill.invoiceNumber || bill.id}?`,
        )
      ) {
        return;
      }
      try {
        await api.delete(`${API_ROUTES.BILLING_INVOICES}/${bill.id}`);
        setBills((prev) => prev.filter((b) => b.id !== bill.id));
        if (editingDraft && editingDraft.id === bill.id) {
          resetBillForm();
        }
        if (selectedBill && selectedBill.id === bill.id) {
          setShowBillDetailDrawer(false);
          setSelectedBill(null);
        }
        showToast("Draft invoice deleted", "success");
      } catch (err) {
        console.error("[DRAFT] Delete failed:", err);
        showToast(
          err.response?.data?.error || "Failed to delete draft",
          "error",
        );
      }
    },
    [editingDraft, selectedBill, showToast, resetBillForm, setSelectedBill],
  );
  const handleNewBillClick = useCallback(() => {
    if (editingDraft || lineItems.length > 0) {
      setShowNewBillConfirm(true);
    } else {
      resetBillForm();
    }
  }, [editingDraft, lineItems.length, resetBillForm]);
  const handlePrint = useCallback(
    (invoice) => {
      const inv = invoice || activeInvoice;
      if (!inv) {
        if (lineItems.length === 0) {
          showToast("Add at least one medicine to print", "error");
          return;
        }
        if (!isWalkIn && !patient.name) {
          showToast("Please enter patient name", "error");
          return;
        }
      }
      setPrintLoading(true);
      const invData = inv
        ? {
            ...inv,
            items: resolveInvoiceItems(inv),
          }
        : {
            id: generateInvoiceId(),
            date: new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            patient: isWalkIn ? "Walk-in Customer" : patient.name,
            phone: isWalkIn ? "N/A" : patient.phone,
            items: lineItems,
            subtotal,
            cgst: cgstAmt,
            sgst: sgstAmt,
            discount: discountAmount,
            gstAmount: tax,
            total: grandTotal,
          };
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        showToast("Popup blocked. Please allow popups for this site.", "error");
        setPrintLoading(false);
        return;
      }
      const printDocument = printWindow.document;
      const createElement = (tag, text, styles = {}) => {
        const element = printDocument.createElement(tag);
        if (text !== undefined && text !== null) {
          element.textContent = String(text);
        }
        Object.assign(element.style, styles);
        return element;
      };
      const createRowValue = (value, styles = {}) =>
        createElement("td", value, {
          padding: "8px",
          borderBottom: "1px solid #eee",
          ...styles,
        });
      const printPatient = resolveInvoiceField(
        invData,
        "patientName",
        "Walk-in Customer",
      );
      const printPhone = resolveInvoiceField(invData, "patientPhone", "-");
      const printSubtotal = safeNumber(
        resolveInvoiceField(invData, "subtotal", 0),
      );
      const printCgst = safeNumber(resolveInvoiceField(invData, "cgst", 0));
      const printSgst = safeNumber(resolveInvoiceField(invData, "sgst", 0));
      const printDiscount = safeNumber(
        resolveInvoiceField(invData, "discount", 0),
      );
      const printTotal = safeNumber(resolveInvoiceField(invData, "total", 0));
      const printDate = resolveInvoiceField(
        invData,
        "date",
        new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      );

      /*
       * Document head
       */
      printDocument.title = `Invoice ${String(invData.id)}`;
      const style = printDocument.createElement("style");
      style.textContent = `
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
        margin: 0;
        background: #fff;
        color: #000;
      }

      @media print {
        .no-print,
        .invoice-actions {
          display: none !important;
        }

        body {
          margin: 0;
          padding: 20px;
        }
      }

      @media screen {
        .invoice-actions {
          display: flex;
          gap: 10px;
          padding: 16px;
        }
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }
    `;
      printDocument.head.appendChild(style);

      /*
       * Header
       */
      const header = createElement("div");
      Object.assign(header.style, {
        textAlign: "center",
        marginBottom: "32px",
      });
      header.appendChild(
        createElement("div", "VIYAN MEDASSIST", {
          fontSize: "24px",
          fontWeight: "800",
        }),
      );
      header.appendChild(
        createElement("div", "123, Healthcare Street, Medical Hub, Bangalore", {
          fontSize: "12px",
        }),
      );
      header.appendChild(
        createElement("div", "GSTIN: 29ABCDE1234F1Z1 | Ph: +91 98765 43210", {
          fontSize: "12px",
        }),
      );
      printDocument.body.appendChild(header);

      /*
       * Invoice metadata
       */
      const invoiceMeta = createElement("div");
      Object.assign(invoiceMeta.style, {
        display: "flex",
        justifyContent: "space-between",
      });
      const invoiceNumber = createElement("div");
      invoiceNumber.appendChild(createElement("b", "INVOICE #"));
      invoiceNumber.appendChild(
        printDocument.createTextNode(` ${String(invData.id)}`),
      );
      const invoiceDate = createElement("div");
      invoiceDate.appendChild(createElement("b", "DATE:"));
      invoiceDate.appendChild(
        printDocument.createTextNode(` ${String(printDate)}`),
      );
      invoiceMeta.append(invoiceNumber, invoiceDate);
      printDocument.body.appendChild(invoiceMeta);

      /*
       * Patient metadata
       */
      const patientMeta = createElement("div");
      Object.assign(patientMeta.style, {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "8px",
      });
      const patientElement = createElement("div");
      patientElement.appendChild(createElement("b", "PATIENT:"));
      patientElement.appendChild(
        printDocument.createTextNode(` ${String(printPatient)}`),
      );
      const phoneElement = createElement("div");
      phoneElement.appendChild(createElement("b", "PHONE:"));
      phoneElement.appendChild(
        printDocument.createTextNode(` ${String(printPhone)}`),
      );
      patientMeta.append(patientElement, phoneElement);
      printDocument.body.appendChild(patientMeta);

      /*
       * Invoice table
       */
      const table = printDocument.createElement("table");
      const thead = printDocument.createElement("thead");
      const headerRow = printDocument.createElement("tr");
      Object.assign(headerRow.style, {
        borderBottom: "2px solid #000",
      });
      headers.forEach(([label, alignment]) => {
        const th = createElement("th", label, {
          padding: "8px",
          textAlign: alignment,
        });
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      const tbody = printDocument.createElement("tbody");
      resolveInvoiceItems(invData).forEach((rawItem) => {
        const item = normalizeInvoiceItem(rawItem);
        const iPrice = safeNumber(item.price);
        const iQty = safeNumber(item.qty);
        const iGst = safeNumber(item.gst);
        const iDiscP = safeNumber(item.discPercent);
        const batchNo = item.batchNumber || "—";
        const lineGross = iPrice * iQty;
        const lineDisc = lineGross * (iDiscP / 100);
        const taxable = lineGross - lineDisc;
        const lineTax = taxable * (iGst / 100);
        const lineTotal = taxable + lineTax;
        const row = printDocument.createElement("tr");
        row.appendChild(createRowValue(item.name));
        row.appendChild(
          createRowValue(batchNo, {
            textAlign: "center",
          }),
        );
        row.appendChild(
          createRowValue(iQty, {
            textAlign: "center",
          }),
        );
        row.appendChild(
          createRowValue(`₹${iPrice.toFixed(2)}`, {
            textAlign: "right",
          }),
        );
        row.appendChild(
          createRowValue(iDiscP > 0 ? `${iDiscP}%` : "—", {
            textAlign: "center",
          }),
        );
        row.appendChild(
          createRowValue(`${iGst}%`, {
            textAlign: "center",
          }),
        );
        row.appendChild(
          createRowValue(`₹${lineTotal.toFixed(2)}`, {
            textAlign: "right",
          }),
        );
        tbody.appendChild(row);
      });
      table.append(thead, tbody);
      printDocument.body.appendChild(table);

      /*
       * Totals
       */
      const totals = createElement("div");
      Object.assign(totals.style, {
        marginTop: "20px",
        marginLeft: "auto",
        width: "200px",
      });
      const addTotalRow = (label, value, styles = {}) => {
        const row = createElement("div");
        Object.assign(row.style, {
          display: "flex",
          justifyContent: "space-between",
          ...styles,
        });
        row.append(createElement("span", label), createElement("span", value));
        totals.appendChild(row);
      };
      addTotalRow("Subtotal", `₹${printSubtotal.toFixed(2)}`);
      addTotalRow("CGST", `₹${printCgst.toFixed(2)}`);
      addTotalRow("SGST", `₹${printSgst.toFixed(2)}`);
      if (printDiscount > 0) {
        addTotalRow("Discount", `-₹${printDiscount.toFixed(2)}`);
      }
      addTotalRow("TOTAL", `₹${printTotal.toFixed(2)}`, {
        borderTop: "1px solid #000",
        fontWeight: "800",
        marginTop: "8px",
        paddingTop: "8px",
      });
      printDocument.body.appendChild(totals);

      /*
       * Footer
       */
      const footer = createElement(
        "div",
        "Thank you for visiting! Get well soon.",
        {
          marginTop: "40px",
          fontSize: "12px",
          textAlign: "center",
          borderTop: "1px solid #000",
          paddingTop: "20px",
        },
      );
      printDocument.body.appendChild(footer);

      /*
       * Print controls
       *
       * Event listeners are used instead of inline onclick HTML.
       */
      const actions = createElement("div");
      actions.className = "no-print invoice-actions";
      Object.assign(actions.style, {
        display: "flex",
        gap: "10px",
        padding: "16px",
        justifyContent: "center",
        marginTop: "20px",
      });
      const printButton = createElement("button", "Print");
      Object.assign(printButton.style, {
        padding: "10px 20px",
        background: "#00C9A7",
        color: "#000",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "700",
      });
      printButton.onclick = () => {
        printWindow.print();
      };
      const closeButton = createElement("button", "Close");
      Object.assign(closeButton.style, {
        padding: "10px 20px",
        background: "#eee",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
      });
      closeButton.onclick = () => {
        printWindow.close();
      };
      actions.append(printButton, closeButton);
      printDocument.body.appendChild(actions);
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        setPrintLoading(false);
      }, 500);
    },
    [
      activeInvoice,
      lineItems,
      patient,
      isWalkIn,
      subtotal,
      cgstAmt,
      sgstAmt,
      discountAmount,
      tax,
      grandTotal,
      showToast,
    ],
  );
  const openBillDetail = (bill) => {
    if (bill.status === "DRAFT") {
      handleResumeDraftClick(bill);
      return;
    }
    setSelectedBill(bill);
    setShowBillDetailDrawer(true);
  };
  const handleBillPrint = (bill) => {
    if (bill.status === "DRAFT") {
      showToast(
        "Draft invoices cannot be printed. Please generate invoice first.",
        "error",
      );
      return;
    }
    setBillCardFlash(bill.id);
    setTimeout(() => setBillCardFlash(null), 500);
    handlePrint(bill);
  };
  const handleBillWhatsApp = (bill) => {
    if (bill.status === "DRAFT") {
      showToast(
        "Draft invoices cannot be sent via WhatsApp. Please generate invoice first.",
        "error",
      );
      return;
    }
    setBillCardFlash(bill.id);
    setTimeout(() => setBillCardFlash(null), 500);
    const phone = (resolveInvoiceField(bill, "patientPhone", "") || "").replace(
      /\D/g,
      "",
    );
    if (!phone || phone === "NA") {
      showToast("No phone number available for this bill", "error");
      return;
    }
    const cleaned = phone.replace(/^(91|0)/, "");
    const formattedPhone = `91${cleaned}`;
    const itemsList = resolveInvoiceItems(bill)
      .map((rawItem) => {
        const i = normalizeInvoiceItem(rawItem);
        return `• ${i.name} x${i.qty} = ₹${(i.price * i.qty).toFixed(2)}`;
      })
      .join("\n");
    const msg = `*VIYAN MEDASSIST*\nInvoice: ${bill.id}\nDate: ${new Date().toLocaleDateString("en-IN")}\nPatient: ${bill.patient}\n\n*Medicines:*\n${itemsList}\n\n*TOTAL: ₹${safeNumber(bill.total).toFixed(2)}*\n\nThank you for visiting Viyan MedAssist!`;
    window.open(
      `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };
  const handleBillReturn = (bill) => {
    if (bill.status === "DRAFT") {
      showToast("Draft invoices cannot be returned.", "error");
      return;
    }
    dispatchBillReturn({
      type: "INIT_RETURN",
      payload: bill,
    });
  };
  const confirmReturn = async () => {
    if (processingReturn) return;
    setProcessingReturn(true);
    try {
      const invoiceId = selectedBill.id;
      const returnPayload = resolveInvoiceItems(selectedBill).reduce(
        (acc, rawItem, idx) => {
          const item = normalizeInvoiceItem(rawItem);
          const qty = safeNumber(returnItems[idx]) || 0;
          if (qty > 0) {
            acc.push({
              invoiceItemId: item.invoiceItemId || item.id,
              medicineId: item.medicineId || null,
              batchId: item.batchId || null,
              quantity: qty,
              reason: returnReason || "Customer Request",
            });
          }
          return acc;
        },
        [],
      );
      if (returnPayload.length === 0) {
        showToast("No items selected for return", "error");
        return;
      }
      const res = await api.post(`billing/invoices/${invoiceId}/refund`, {
        items: returnPayload,
        reason: returnReason || "Customer Request",
      });
      if (res.data?.success || res.data?.data || res.data) {
        const refund =
          res.data?.data?.actualRefundAmount ??
          res.data?.actualRefundAmount ??
          res.data?.data?.refundAmount ??
          res.data?.refundAmount ??
          res.data?.data?.totalRefundAmount ??
          res.data?.totalRefundAmount ??
          0;
        setBills((prev) =>
          prev.map((b) =>
            b.id === selectedBill.id
              ? {
                  ...b,
                  status: "RETURNED",
                  refundedAmount: Number(refund),
                }
              : b,
          ),
        );
        setShowReturnBillModal(false);
        setSelectedBill(null);
        showToast(
          `Return processed successfully. Refund: ₹${Number(refund).toFixed(2)}`,
          "success",
        );
        window.dispatchEvent(new CustomEvent("dashboard:refresh"));
        setShowReturnBillModal(false);
        setSelectedBill(null);
        showToast(
          `Return processed successfully. Refund: ₹${Number(refund).toFixed(2)}`,
          "success",
        );
        window.dispatchEvent(new CustomEvent("dashboard:refresh"));
      }
    } catch (err) {
      console.error("[RETURN] Failed:", err);
      showToast(
        err.response?.data?.error || "Failed to process return",
        "error",
      );
    } finally {
      setProcessingReturn(false);
    }
  };
  const handleLoadMore = async () => {
    setLoadMoreLoading(true);
    try {
      const res = await api.get(API_ROUTES.BILLING_INVOICES, {
        params: {
          skip: bills.length,
          limit: 10,
        },
      });
      const newBills = normalizeArrayResponse(res, "invoices").map(
        normalizeInvoice,
      );
      if (newBills.length === 0) {
        setAllBillsLoaded(true);
      } else {
        setBills((prev) => {
          const map = new Map();
          [...prev, ...newBills].forEach((bill) => map.set(bill.id, bill));
          return [...map.values()];
        });
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load more bills", "error");
    } finally {
      setLoadMoreLoading(false);
    }
  };
  const handleCloseInvoiceModal = () => {
    setShowPreview(false);
    setLineItems([]);
    setPatient({
      id: null,
      name: "",
      phone: "",
    });
    setDiscount("");
    setPaymentMode("CASH");
    setSearch("");
    setMedResults([]);
    setShowDropdown(false);
    setActiveInvoice(null);
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };
  useEffect(() => {
    const timerId = setTimeout(() => barcodeInputRef.current?.focus(), 300);
    return () => clearTimeout(timerId);
  }, []);
  const handleKeyDown = useEffectEvent((e) => {
    if (e.key === "F2") {
      e.preventDefault();
      if (lineItems.length > 0) handleSaveDraft();
      return;
    }
    if (e.key === "F4") {
      e.preventDefault();
      if (lineItems.length > 0 || activeInvoice) handlePrint();
      return;
    }
    if (e.key === "F8") {
      e.preventDefault();
      const genBtn = document.getElementById("generate-invoice-btn");
      if (genBtn && !genBtn.disabled) genBtn.click();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      barcodeInputRef.current?.focus();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (showNewBillConfirm) setShowNewBillConfirm(false);
      else if (showPreview) setShowPreview(false);
      else if (showReturnBillModal) setShowReturnBillModal(false);
      else if (showBillDetailDrawer) setShowBillDetailDrawer(false);
      else if (showAllBillsModal) setShowAllBillsModal(false);
      else if (showReturnModal) setShowReturnModal(false);
      else resetBillForm();
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  return (
    <div className="pos-container">
      <div className="pos-header">
        <div>
          <h1>Enterprise Billing / POS</h1>
          <p>
            Full financial lifecycle: Drafts, FEFO Batching, and Secure
            Distribution.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="pos-btn outline"
            onClick={() => navigate("/analytics")}
          >
            <History size={16} /> Sales History
          </button>
          <button className="pos-btn teal" onClick={handleNewBillClick}>
            <Receipt size={18} /> + New Bill
          </button>
        </div>
      </div>

      {editingDraft && (
        <div
          style={{
            background: "rgba(20, 184, 166, 0.12)",
            border: "1px solid var(--color-primary, #14b8a6)",
            borderRadius: "12px",
            padding: "12px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--color-primary, #14b8a6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Editing Draft Invoice:{" "}
              {editingDraft.invoiceNumber || editingDraft.id}
            </span>
            <span
              style={{
                fontSize: "12px",
                opacity: 0.85,
              }}
            >
              ({new Date(editingDraft.createdAt).toLocaleDateString("en-IN")})
            </span>
          </div>
          <button
            type="button"
            className="pos-btn outline"
            style={{
              padding: "4px 12px",
              fontSize: "12px",
            }}
            onClick={resetBillForm}
          >
            Exit Draft Mode
          </button>
        </div>
      )}

      <div className="pos-stats-row">
        {[
          {
            label: "TODAY'S REVENUE",
            val:
              "₹" +
              todayBills
                .reduce((sum, b) => sum + safeNumber(b.total), 0)
                .toLocaleString(),
            icon: IndianRupee,
            col: "var(--primary)",
          },
          {
            label: "BILLS TODAY",
            val: String(todayBills.length),
            icon: Receipt,
            col: "var(--info)",
          },
          {
            label: "RETURNS TODAY",
            val: String(returnsTodayCount),
            icon: ArrowLeft,
            col: "var(--danger)",
          },
          {
            label: "AVERAGE BILL VALUE",
            val: (() => {
              const totalRevenue = todayBills.reduce(
                (sum, b) => sum + safeNumber(b.total),
                0,
              );
              const billCount = todayBills.length;
              if (!billCount || billCount === 0) return "₹0";
              const avg = totalRevenue / billCount;
              if (isNaN(avg) || !isFinite(avg)) return "₹0";
              return "₹" + Math.round(avg).toLocaleString();
            })(),
            icon: TrendingUp,
            col: "var(--warning)",
          },
        ].map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            val={s.val}
            icon={s.icon}
            col={s.col}
          />
        ))}
      </div>

      <BillingPOSSection1
        setIsWalkIn={setIsWalkIn}
        isWalkIn={isWalkIn}
        setPatient={setPatient}
        patient={patient}
        setPhoneFieldError={setPhoneFieldError}
        selectPatient={selectPatient}
        handleSearchChange={handleSearchChange}
        setShowDropdown={setShowDropdown}
        clearSearch={clearSearch}
        addToLineItems={addToLineItems}
        updateQty={updateQty}
        setLineItems={setLineItems}
        subtotal={subtotal}
        discountAmount={discountAmount}
        removeRow={removeRow}
        paymentMode={paymentMode}
        setPaymentMode={setPaymentMode}
        m={m}
        setDiscount={setDiscount}
        user={user}
        showToast={showToast}
        grandTotal={grandTotal}
        lineItems={lineItems}
        setInvoiceSaving={setInvoiceSaving}
        discountPercentage={discountPercentage}
        editingDraft={editingDraft}
        setActiveInvoice={setActiveInvoice}
        setBills={setBills}
        setEditingDraft={setEditingDraft}
        setShowPreview={setShowPreview}
        barcodeInputRef={barcodeInputRef}
        setShowAllBillsModal={setShowAllBillsModal}
        billCardFlash={billCardFlash}
        openBillDetail={openBillDetail}
        handleResumeDraftClick={handleResumeDraftClick}
        handleDeleteDraftConfirm={handleDeleteDraftConfirm}
        handleBillPrint={handleBillPrint}
        handleBillWhatsApp={handleBillWhatsApp}
        handleBillReturn={handleBillReturn}
        patientResults={patientResults}
        phoneFieldError={phoneFieldError}
        search={search}
        cgstAmt={cgstAmt}
        showPatientDropdown={showPatientDropdown}
        draftError={draftError}
        handleLoadMore={handleLoadMore}
        avgGst={avgGst}
        invoiceSaving={invoiceSaving}
        sgstAmt={sgstAmt}
        medResults={medResults}
        visibleBills={visibleBills}
        allBillsLoaded={allBillsLoaded}
        newPatientMsg={newPatientMsg}
        handleFindPatient={handleFindPatient}
        draftSaving={draftSaving}
        findError={findError}
        loyaltyProfile={loyaltyProfile}
        handleSaveDraft={handleSaveDraft}
        showDropdown={showDropdown}
        discount={discount}
        loadMoreLoading={loadMoreLoading}
        draftSaved={draftSaved}
        findLoading={findLoading}
        todayBills={todayBills}
      />

      <AnimatePresence>
        {showPreview && activeInvoice && (
          <InvoiceGeneratedModal
            isOpen={showPreview}
            onClose={() => handleCloseInvoiceModal()}
            invoice={activeInvoice}
            showToast={showToast}
            onNewBill={() => {
              setShowPreview(false);
              resetBillForm();
              setActiveInvoice(null);
            }}
            storeProfile={storeProfile}
          />
        )}
      </AnimatePresence>

      <BillingPOSSection2
        setShowNewBillConfirm={setShowNewBillConfirm}
        handleSaveDraft={handleSaveDraft}
        setShowPreview={setShowPreview}
        resetBillForm={resetBillForm}
        setActiveInvoice={setActiveInvoice}
        showNewBillConfirm={showNewBillConfirm}
        editingDraft={editingDraft}
        lineItems={lineItems}
      />

      <BillingPOSSection3
        setShowAllBillsModal={setShowAllBillsModal}
        allBillsFilter={allBillsFilter}
        setAllBillsFilter={setAllBillsFilter}
        handleResumeDraftClick={handleResumeDraftClick}
        handleDeleteDraftConfirm={handleDeleteDraftConfirm}
        openBillDetail={openBillDetail}
        handleBillPrint={handleBillPrint}
        handleBillWhatsApp={handleBillWhatsApp}
        handleBillReturn={handleBillReturn}
        showAllBillsModal={showAllBillsModal}
        todayStr={todayStr}
        bills={bills}
      />

      <BillingPOSSection4
        key={selectedBill?.id ?? "no-selected-bill"}
        setShowBillDetailDrawer={setShowBillDetailDrawer}
        handleResumeDraftClick={handleResumeDraftClick}
        selectedBill={selectedBill}
        handleDeleteDraftConfirm={handleDeleteDraftConfirm}
        handleBillPrint={handleBillPrint}
        handleBillWhatsApp={handleBillWhatsApp}
        handleBillReturn={handleBillReturn}
        showBillDetailDrawer={showBillDetailDrawer}
      />

      <BillingPOSSection5
        setShowReturnBillModal={setShowReturnBillModal}
        returnItems={returnItems}
        setReturnItems={setReturnItems}
        setReturnReason={setReturnReason}
        setReturnNotes={setReturnNotes}
        confirmReturn={confirmReturn}
        selectedBill={selectedBill}
        showReturnBillModal={showReturnBillModal}
        processingReturn={processingReturn}
        returnReason={returnReason}
        returnNotes={returnNotes}
      />

      <BillingPOSSection6
        setShowReturnModal={setShowReturnModal}
        setReturnSearchQuery={setReturnSearchQuery}
        returnSearchQuery={returnSearchQuery}
        setReturnModalSelectedBill={setReturnModalSelectedBill}
        setReturnModalItems={setReturnModalItems}
        setReturnModalReason={setReturnModalReason}
        returnModalItems={returnModalItems}
        returnModalSelectedBill={returnModalSelectedBill}
        returnModalReason={returnModalReason}
        showToast={showToast}
        processingReturn={processingReturn}
        setProcessingReturn={setProcessingReturn}
        showReturnModal={showReturnModal}
        bills={bills}
      />
    </div>
  );
}
