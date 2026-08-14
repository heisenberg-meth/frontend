import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";
import {
  IndianRupee,
  Receipt,
  ArrowLeft,
  Plus,
  Minus,
  Search,
  History,
  RefreshCw,
  Barcode,
  X,
  CheckCircle2,
  Printer,
  MessageCircle,
  Save,
  Eye,
  Loader2,
  Play,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  normalizeArrayResponse,
  normalizeObjectResponse,
} from "../utils/apiNormalizer";
import { useAuth } from "../hooks/useAuth";
import { normalizeInvoice } from "../utils/billingNormalizer";
import "../styles/BillingPOS.css";
import InvoiceGeneratedModal from "./invoice/InvoiceGeneratedModal";

function numberToWords(n) {
  if (n === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  function twoDigits(num) {
    if (num < 20) return ones[num];
    return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  }
  function threeDigits(num) {
    if (num === 0) return "";
    if (num < 100) return twoDigits(num);
    return (
      ones[Math.floor(num / 100)] +
      " Hundred" +
      (num % 100 ? " and " + twoDigits(num % 100) : "")
    );
  }
  let intPart = Math.floor(n);
  let result = "";
  if (intPart >= 10000000) {
    result += threeDigits(Math.floor(intPart / 10000000)) + " Crore ";
    intPart %= 10000000;
  }
  if (intPart >= 100000) {
    result += threeDigits(Math.floor(intPart / 100000)) + " Lakh ";
    intPart %= 100000;
  }
  if (intPart >= 1000) {
    result += threeDigits(Math.floor(intPart / 1000)) + " Thousand ";
    intPart %= 1000;
  }
  if (intPart > 0) result += threeDigits(intPart);
  return result.trim() + " Rupees Only";
}

const generateInvoiceId = () =>
  `INV-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

function Spinner({ size = 14 }) {
  return <Loader2 size={size} className="spinner-icon" />;
}

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
  totalPrice: item?.totalPrice ?? item?.amount ?? 0,
});

const resolvePaymentMethod = (bill) => {
  if (Array.isArray(bill.payments) && bill.payments.length > 0) {
    return (
      bill.payments[0].paymentMode || bill.payments[0].paymentMethod || "CASH"
    );
  }
  return bill.paymentMode || bill.paymentMethod || "CASH";
};

const normalizeBill = (bill) => {
  const resolvedItems = resolveInvoiceItems(bill);
  return {
    ...bill,
    patient: resolveInvoiceField(bill, "patientName", "Walk-in Customer"),
    phone: resolveInvoiceField(bill, "patientPhone", "-"),
    invoiceNumber: resolveInvoiceField(bill, "invoiceNumber", bill.id),
    items: resolvedItems,
    itemsList: resolvedItems,
    subtotal: safeNumber(resolveInvoiceField(bill, "subtotal", 0)),
    cgst: safeNumber(resolveInvoiceField(bill, "cgst", 0)),
    sgst: safeNumber(resolveInvoiceField(bill, "sgst", 0)),
    discount: safeNumber(resolveInvoiceField(bill, "discount", 0)),
    total: safeNumber(resolveInvoiceField(bill, "total", 0)),
    amount: safeNumber(resolveInvoiceField(bill, "total", 0)),
    date: resolveInvoiceField(bill, "date", ""),
    paymentMethod: resolvePaymentMethod(bill),
  };
};

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
  const [patient, setPatient] = useState(() => {
    try {
      const saved = localStorage.getItem(`currentBillingPatient_${userKey}`);
      return saved ? JSON.parse(saved) : { id: null, name: "", phone: "" };
    } catch {
      return { id: null, name: "", phone: "" };
    }
  });
  const [lineItems, setLineItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`currentBillingItems_${userKey}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [discount, setDiscount] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [, setMedLoading] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const barcodeInputRef = useRef(null);
  const [findLoading, setFindLoading] = useState(false);
  const [patientResults, setPatientResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [newPatientMsg, setNewPatientMsg] = useState("");
  const [medResults, setMedResults] = useState([]);
  const [bills, setBills] = useState([]);
  const [returnItems, setReturnItems] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [editingDraft, setEditingDraft] = useState(null);
  const [, setPrintLoading] = useState(false);
  const [phoneFieldError, setPhoneFieldError] = useState("");
  const [findError, setFindError] = useState("");
  const [showAllBillsModal, setShowAllBillsModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState("");
  const [returnModalSelectedBill, setReturnModalSelectedBill] = useState(null);
  const [returnModalItems, setReturnModalItems] = useState({});
  const [returnModalReason, setReturnModalReason] = useState("Patient Request");
  const [showReturnBillModal, setShowReturnBillModal] = useState(false);
  const [showBillDetailDrawer, setShowBillDetailDrawer] = useState(false);
  const [allBillsFilter, setAllBillsFilter] = useState("All");
  const [billCardFlash, setBillCardFlash] = useState(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [returnsCount, setReturnsCount] = useState(0);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [allBillsLoaded, setAllBillsLoaded] = useState(false);
  const [showNewBillConfirm, setShowNewBillConfirm] = useState(false);
  const [loyaltyProfile, setLoyaltyProfile] = useState(null);
  const [returnReason, setReturnReason] = useState("Customer Request");
  const [returnNotes, setReturnNotes] = useState("");
  const [processingReturn, setProcessingReturn] = useState(false);
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
          params: { limit: 50 },
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
            { params: { q: search } },
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
        params: { phone: patient.phone },
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
  const todayDateStr = new Date().toISOString().split("T")[0];

  const todayBills = useMemo(
    () =>
      bills.filter((b) => {
        const bd = b.date ? b.date.split("T")[0] : "";
        return bd === todayDateStr;
      }),
    [bills, todayDateStr],
  );

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
          i.batchId === med.batchId ? { ...i, qty: i.qty + 1 } : i,
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
    setEditingDraft(null);
    setLineItems([]);
    setPatient({ id: null, name: "", phone: "" });
    setDiscount(0);
    setPaymentMode("CASH");
    setSearch("");
    setMedResults([]);
    setShowDropdown(false);
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

        setPatient({
          id: invoice.patientId || null,
          name:
            invoice.patientName ||
            invoice.customerName ||
            (invoice.patientId ? "" : "Walk-in Customer"),
          phone: invoice.patientPhone || invoice.customerPhone || "",
        });
        setIsWalkIn(
          !invoice.patientId || invoice.patientName === "Walk-in Customer",
        );

        const loadedItems = (invoice.items || []).map((it) => ({
          id: it.medicineId || it.id,
          name: it.medicine?.name || it.medicineName || it.name || "Medicine",
          batchId: it.batchId || null,
          qty: Number(it.quantity || it.qty || 1),
          price: Number(it.unitPrice || it.price || 0),
          gst: Number(it.gstPercentage || it.gst || 0),
          mrp: Number(it.unitPrice || it.mrp || 0),
        }));
        setLineItems(loadedItems);
        setDiscount(Number(invoice.discountPercentage || 0));
        setPaymentMode(invoice.paymentMethod || "CASH");
        setEditingDraft({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber || invoice.id,
          createdAt:
            invoice.createdAt || bill.createdAt || new Date().toISOString(),
        });
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
    [showToast, editingDraft, selectedBill, resetBillForm],
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
        ? { ...inv, items: resolveInvoiceItems(inv) }
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

      const headers = [
        ["Medicine", "left"],
        ["Qty", "center"],
        ["MRP", "center"],
        ["GST%", "center"],
        ["Tax", "right"],
        ["Total", "right"],
      ];

      headers.forEach(([label, alignment]) => {
        const th = createElement("th", label, {
          padding: "8px",
          textAlign: alignment,
        });

        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);

      const tbody = printDocument.createElement("tbody");

      resolveInvoiceItems(invData)
        .map(normalizeInvoiceItem)
        .forEach((item) => {
          const iPrice = safeNumber(item.price);
          const iQty = safeNumber(item.qty);
          const iGst = safeNumber(item.gst || item.gstPercentage);
          const iDiscP = safeNumber(item.discPercent || item.discountPercent);

          const lineGross = iPrice * iQty;
          const lineDisc = lineGross * (iDiscP / 100);
          const taxable = lineGross - lineDisc;
          const lineTax = taxable * (iGst / 100);
          const lineTotal = taxable + lineTax;

          const row = printDocument.createElement("tr");

          row.appendChild(createRowValue(item.name));
          row.appendChild(
            createRowValue(iQty, {
              textAlign: "center",
            }),
          );
          row.appendChild(
            createRowValue(`₹${iPrice.toFixed(2)}`, {
              textAlign: "center",
            }),
          );
          row.appendChild(
            createRowValue(`${iGst}%`, {
              textAlign: "center",
            }),
          );
          row.appendChild(
            createRowValue(`₹${lineTax.toFixed(2)}`, {
              textAlign: "right",
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
      .map(normalizeInvoiceItem)
      .map((i) => `• ${i.name} x${i.qty} = ₹${(i.price * i.qty).toFixed(2)}`)
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
    setSelectedBill(bill);
    setReturnItems([]);
    setReturnReason("Customer Request");
    setReturnNotes("");
    setShowReturnBillModal(true);
  };

  const confirmReturn = async () => {
    if (processingReturn) return;

    setProcessingReturn(true);

    try {
      const invoiceId = selectedBill.id;
      const itemsList =
        resolveInvoiceItems(selectedBill).map(normalizeInvoiceItem);
      const returnPayload = itemsList
        .map((item, idx) => ({
          idx,
          item,
          qty: safeNumber(returnItems[idx]) || 0,
        }))
        .filter(({ qty }) => qty > 0)
        .map(({ item, qty }) => ({
          invoiceItemId: item.invoiceItemId || item.id,
          medicineId: item.medicineId || null,
          batchId: item.batchId || null,
          quantity: qty,
          reason: returnReason || "Customer Request",
        }));

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
            b.id === selectedBill.id ? { ...b, status: "RETURNED" } : b,
          ),
        );
        setReturnsCount((c) => c + 1);
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
    setPatient({ id: null, name: "", phone: "" });
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

  useEffect(() => {
    const handleKeyDown = (e) => {
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
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showReturnBillModal,
    showBillDetailDrawer,
    showAllBillsModal,
    showPreview,
    showReturnModal,
    showNewBillConfirm,
    lineItems,
    activeInvoice,
    handleSaveDraft,
    handlePrint,
    resetBillForm,
  ]);

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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontWeight: 600, fontSize: "14px" }}>
              Editing Draft Invoice:{" "}
              {editingDraft.invoiceNumber || editingDraft.id}
            </span>
            <span style={{ fontSize: "12px", opacity: 0.85 }}>
              ({new Date(editingDraft.createdAt).toLocaleDateString("en-IN")})
            </span>
          </div>
          <button
            type="button"
            className="pos-btn outline"
            style={{ padding: "4px 12px", fontSize: "12px" }}
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
            val: String(returnsCount),
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
          <div key={s.label} className="pos-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">{s.label}</span>
              <div
                className="stat-icon"
                style={{ backgroundColor: `${s.col}15`, color: s.col }}
              >
                <s.icon size={16} />
              </div>
            </div>
            <div className="stat-value">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="pos-main-grid">
        <div className="bill-creator-col">
          <div className="pos-card">
            <div className="pos-card-title">
              <span>PATIENT DETAILS</span>
              <div
                className="walk-in-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWalkIn((prev) => !prev);
                  if (isWalkIn) {
                    setPatient({ id: null, name: "", phone: "" });
                  }
                }}
                title={isWalkIn ? "Walk-in mode" : "Click to enable walk-in"}
              >
                <div
                  style={{
                    width: "40px",
                    height: "20px",
                    background: isWalkIn
                      ? "var(--primary)"
                      : "var(--overlay-10)",
                    borderRadius: "20px",
                    position: "relative",
                    transition: "0.3s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: isWalkIn ? "22px" : "2px",
                      top: "2px",
                      width: "16px",
                      height: "16px",
                      background: "white",
                      borderRadius: "50%",
                      transition: "0.3s",
                    }}
                  />
                </div>
                Walk-in
              </div>
            </div>
            <div className="patient-row">
              <div className="pos-input-group">
                <label>PATIENT NAME</label>
                <input
                  required
                  id="patient-name-input"
                  className={`pos-input ${newPatientMsg ? "new-patient-input" : ""}`}
                  placeholder={isWalkIn ? "Walk-in Customer" : "Enter name..."}
                  value={patient.name}
                  onChange={(e) =>
                    setPatient({ ...patient, name: e.target.value })
                  }
                />
              </div>
              <div className="pos-input-group">
                <label>PHONE NUMBER</label>
                <input
                  required
                  id="patient-phone-input"
                  className={`pos-input ${phoneFieldError ? "input-error" : ""}`}
                  placeholder="98765 43210"
                  value={patient.phone}
                  onChange={(e) => {
                    setPatient({ ...patient, phone: e.target.value });
                    setPhoneFieldError("");
                  }}
                />
                {phoneFieldError && (
                  <span className="field-error-text">{phoneFieldError}</span>
                )}
              </div>
              <button
                className={`pos-btn outline ${findLoading ? "btn-loading" : ""}`}
                style={{ marginTop: "auto", height: "42px" }}
                onClick={handleFindPatient}
                disabled={findLoading}
              >
                {findLoading ? (
                  <>
                    <Spinner size={14} /> Searching...
                  </>
                ) : (
                  <>
                    <Search size={16} /> Find
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {showPatientDropdown && patientResults.length > 0 && (
                <motion.div
                  className="patient-search-dropdown"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  {patientResults.map((p, pIdx) => (
                    <div
                      key={
                        p.id ||
                        p._id ||
                        `pat-${p.fullName || p.name || "p"}-${p.phone || ""}-${pIdx}`
                      }
                      className="patient-result-row"
                      onClick={() => selectPatient(p)}
                    >
                      <span className="patient-result-name">
                        {p.fullName || p.name}
                      </span>
                      <span className="patient-result-phone">{p.phone}</span>
                      {p.lastVisit != null && (
                        <span className="patient-result-visit">
                          last visit: {p.lastVisit} days ago
                        </span>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {newPatientMsg && (
              <div className="new-patient-msg">{newPatientMsg}</div>
            )}
            {findError && <div className="find-error-msg">{findError}</div>}

            {!isWalkIn && (
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {loyaltyProfile?.accountStatus === "BLOCKED" && (
                  <div style={{ marginTop: 4, fontWeight: 800 }}>
                    CREDIT ACCOUNT BLOCKED
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pos-card">
            <div
              className="search-wrapper"
              onClick={(e) => e.stopPropagation()}
            >
              <Barcode className="barcode-icon" size={24} />
              <input
                required
                ref={barcodeInputRef}
                className="barcode-input"
                placeholder="Scan barcode or type medicine name... (Ctrl+F)"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
              />
              {search && (
                <button
                  className="search-clear-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSearch();
                  }}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    zIndex: 10,
                  }}
                >
                  <X size={16} />
                </button>
              )}
              <AnimatePresence>
                {showDropdown && medResults.length > 0 && (
                  <motion.div
                    className="autocomplete-dropdown"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {medResults.map((res) => {
                      const availQty = res.availableStock ?? 0;
                      const isOOS = availQty <= 0 || res.isOutOfStock;
                      return (
                        <div
                          key={res.id}
                          className={`result-row${isOOS ? " oos" : ""}`}
                          style={
                            isOOS
                              ? {
                                  opacity: 0.55,
                                  pointerEvents: "none",
                                  cursor: "not-allowed",
                                }
                              : {}
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOOS) addToLineItems(res);
                          }}
                        >
                          <div className="result-info">
                            <span className="result-name">{res.name}</span>
                            <span className="result-meta">
                              {res.genericName || res.generic}
                            </span>
                          </div>
                          <div
                            className="result-info"
                            style={{ textAlign: "center" }}
                          >
                            <span className="result-meta">
                              Batch:{" "}
                              {res.batchNumber ||
                                res.batch ||
                                res.batchId ||
                                "N/A"}
                            </span>
                            <span className="result-meta">
                              Exp:{" "}
                              {res.expiryDate
                                ? new Date(res.expiryDate).toLocaleDateString(
                                    "en-IN",
                                  )
                                : res.exp || res.expiry || "N/A"}
                            </span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              className="result-name"
                              style={{ color: "var(--primary)" }}
                            >
                              ₹{safeNumber(res.price || res.mrp).toFixed(2)}
                            </div>
                            {isOOS ? (
                              <span
                                className="result-meta"
                                style={{
                                  color: "var(--danger)",
                                  fontWeight: 700,
                                }}
                              >
                                OUT OF STOCK
                              </span>
                            ) : (
                              <span className="result-meta">
                                {availQty} in stock
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="table-scroll-container">
              <table className="line-items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>MRP</th>
                    <th>GST%</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <span className="result-name">{item.name}</span>
                          <span
                            className="result-meta"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "var(--danger)",
                              }}
                            />
                            {item.batch?.batchNumber ||
                              item.batchNumber ||
                              item.batchId ||
                              "N/A"}{" "}
                            · Exp {item.exp}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="qty-stepper">
                          <button
                            className="step-btn"
                            onClick={() => updateQty(item.batchId, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            required
                            className="qty-input"
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.qty}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const qty = Math.max(
                                1,
                                Math.min(Number(raw) || 1, item.stock || 9999),
                              );
                              setLineItems((prev) =>
                                prev.map((i) =>
                                  i.batchId === item.batchId
                                    ? {
                                        ...i,
                                        qty,
                                        total: qty * safeNumber(i.price),
                                      }
                                    : i,
                                ),
                              );
                            }}
                          />
                          <button
                            className="step-btn"
                            onClick={() => updateQty(item.batchId, 1)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          required
                          className="pos-input"
                          type="number"
                          min="0"
                          step="0.01"
                          style={{ width: "70px", padding: "6px" }}
                          value={item.price}
                          onChange={(e) => {
                            const price = Number(e.target.value) || 0;
                            setLineItems((prev) =>
                              prev.map((i) =>
                                i.batchId === item.batchId
                                  ? {
                                      ...i,
                                      price,
                                      total: price * safeNumber(i.qty),
                                    }
                                  : i,
                              ),
                            );
                          }}
                        />
                      </td>

                      <td className="result-meta" style={{ fontWeight: 800 }}>
                        {safeNumber(item.gst)}%
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: "var(--primary)",
                        }}
                      >
                        ₹
                        {(() => {
                          const lineGross =
                            safeNumber(item.price) * safeNumber(item.qty);
                          const discountRatio =
                            subtotal > 0 ? discountAmount / subtotal : 0;
                          const lineDisc = lineGross * discountRatio;
                          return (lineGross - lineDisc).toFixed(2);
                        })()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="step-btn"
                          style={{ color: "var(--danger)" }}
                          onClick={() => removeRow(item.batchId)}
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="payment-modes" style={{ marginTop: 20 }}>
              {["CASH", "UPI", "CARD"].map((m) => (
                <button
                  key={m}
                  className={`mode-pill ${paymentMode === m ? "active" : ""}`}
                  onClick={() => setPaymentMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="sticky-bottom-actions">
              <div className="bill-summary-v3">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>CGST (avg {avgGst}%)</span>
                  <span>₹{cgstAmt.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>SGST (avg {avgGst}%)</span>
                  <span>₹{sgstAmt.toFixed(2)}</span>
                </div>
                <div className="summary-row" style={{ alignItems: "center" }}>
                  <span>Discount (%)</span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <input
                      required
                      className="pos-input"
                      style={{
                        width: "80px",
                        height: "30px",
                        textAlign: "right",
                      }}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      min="0"
                      max="100"
                      type="number"
                    />
                    <span
                      style={{ fontSize: "11px", color: "var(--text-muted)" }}
                    >
                      = ₹{discountAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="summary-row grand">
                  <span>
                    GRAND TOTAL{" "}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "var(--text-muted)",
                      }}
                    >
                      ({lineItems.length} item
                      {lineItems.length !== 1 ? "s" : ""})
                    </span>
                  </span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "8px",
                    textAlign: "right",
                  }}
                >
                  {numberToWords(Math.round(grandTotal))}
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  width: "320px",
                }}
              >
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    className={`pos-btn outline ${draftSaving ? "btn-loading" : ""} ${draftSaved ? "btn-success" : ""} ${draftError ? "btn-error" : ""}`}
                    style={{ flex: 1 }}
                    onClick={handleSaveDraft}
                    disabled={draftSaving || lineItems.length === 0}
                    title="Save Draft (F2)"
                  >
                    {draftSaving ? (
                      <>
                        <Spinner size={16} /> Saving...
                      </>
                    ) : draftSaved ? (
                      <>
                        <CheckCircle2 size={16} /> Draft Saved!
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save Draft
                      </>
                    )}
                  </button>
                </div>
                <button
                  id="generate-invoice-btn"
                  className="pos-btn teal"
                  style={{ height: "48px", fontSize: "16px" }}
                  title="Generate Invoice (F8)"
                  onClick={async () => {
                    if (!user?.branchId) {
                      showToast(
                        "Branch context missing. Cannot generate invoice.",
                        "error",
                      );
                      return;
                    }
                    if (Number.isNaN(grandTotal) || grandTotal <= 0) {
                      showToast("Invalid total amount calculation", "error");
                      return;
                    }
                    if (lineItems.length === 0) {
                      showToast("Add at least one medicine", "error");
                      return;
                    }

                    for (const item of lineItems) {
                      if (!Number.isFinite(item.qty)) {
                        showToast("Invalid Quantity", "error");
                        return;
                      }
                      if (!Number.isFinite(item.price)) {
                        showToast("Invalid Price", "error");
                        return;
                      }
                    }
                    setInvoiceSaving(true);
                    try {
                      const payload = {
                        patientId: isWalkIn ? null : patient.id,
                        patientName: isWalkIn
                          ? "Walk-in Customer"
                          : patient.name || "Walk-in Customer",
                        patientPhone: isWalkIn ? null : patient.phone,
                        items: lineItems.map((it) => ({
                          medicineId: it.id,
                          batchId: it.batchId,
                          quantity: it.qty,
                          unitPrice: it.price,
                          gstPercentage: it.gst || 0,
                        })),
                        paymentMode: paymentMode,
                        discountPercentage: discountPercentage,
                        discountAmount: discountAmount,
                        discountType: "PERCENTAGE",
                        branchId: user.branchId,
                      };
                      let res;
                      if (editingDraft) {
                        res = await api.post(
                          `${API_ROUTES.BILLING_INVOICES}/${editingDraft.id}/finalize`,
                          payload,
                        );
                      } else {
                        res = await api.post(
                          API_ROUTES.BILLING_INVOICES,
                          payload,
                        );
                      }
                      const rawInv = res.data?.data || res.data;
                      const newInv = normalizeInvoice(rawInv);

                      const invoiceWithPatient = {
                        ...newInv,
                        patientName: payload.patientName,
                        patientPhone: payload.patientPhone,
                      };

                      setActiveInvoice(invoiceWithPatient);
                      const normalizedBillItem = normalizeBill({
                        ...newInv,
                        paymentMethod: paymentMode,
                        patientName: payload.patientName,
                        patientPhone: payload.patientPhone,
                      });

                      if (editingDraft) {
                        setBills((prev) =>
                          prev.map((b) =>
                            b.id === editingDraft.id ? normalizedBillItem : b,
                          ),
                        );
                        setEditingDraft(null);
                      } else {
                        setBills((prev) => [normalizedBillItem, ...prev]);
                      }
                      setShowPreview(true);
                      showToast(
                        editingDraft
                          ? `Draft finalized into invoice`
                          : `Invoice generated`,
                        "success",
                      );
                      setTimeout(() => barcodeInputRef.current?.focus(), 300);
                    } catch (err) {
                      console.error(err);
                      showToast(
                        err.response?.data?.message || "Failed to save invoice",
                        "error",
                      );
                    } finally {
                      setInvoiceSaving(false);
                    }
                  }}
                  disabled={invoiceSaving || lineItems.length === 0}
                >
                  {invoiceSaving ? (
                    <>
                      <Spinner size={20} />{" "}
                      {editingDraft
                        ? "FINALIZING DRAFT..."
                        : "SAVING INVOICE..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={24} />{" "}
                      {editingDraft ? "FINALIZE DRAFT" : "GENERATE INVOICE"}
                    </>
                  )}
                </button>
                {draftError && (
                  <div className="draft-error-text">{draftError}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pos-history-col">
          <div className="pos-card" style={{ padding: "20px" }}>
            <div className="pos-card-title">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span>TODAY'S BILLS</span>
                <span
                  className="badge-paid"
                  style={{ background: "var(--primary)", color: "#000" }}
                >
                  {todayBills.length}
                </span>
              </div>
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <span
                  className="view-all-link"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Clear all loaded bills from view? This will not delete any data.",
                      )
                    ) {
                      setBills([]);
                    }
                  }}
                  style={{ color: "var(--danger)" }}
                >
                  Clear All
                </span>
                <span
                  className="view-all-link"
                  onClick={() => setShowAllBillsModal(true)}
                >
                  View All →
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: "500px",
                overflowY: "auto",
              }}
            >
              <AnimatePresence>
                {visibleBills.map((bill) => (
                  <motion.div
                    key={bill.id}
                    className={`bill-card-compact ${billCardFlash === bill.id ? "bill-card-flash" : ""} ${bill.status === "DRAFT" ? "bill-card-draft" : ""} ${bill.status === "RETURNED" ? "bill-card-returned" : ""}`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    onClick={() => openBillDetail(bill)}
                  >
                    <div className="bill-card-header">
                      <span
                        style={{
                          fontFamily: "Outfit",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        {resolveInvoiceField(bill, "invoiceNumber", bill.id)}
                      </span>
                      <span className="result-meta">{bill.time}</span>
                    </div>
                    <div className="bill-card-body">
                      <div style={{ fontWeight: 600 }}>
                        {bill.patient ||
                          resolveInvoiceField(
                            bill,
                            "patientName",
                            "Walk-in Customer",
                          )}
                      </div>
                      <div className="result-meta">
                        {bill.phone ||
                          resolveInvoiceField(bill, "patientPhone", "-")}
                      </div>
                    </div>
                    <div className="bill-card-footer">
                      <div className="result-meta">
                        {bill.items.length} medicines · ₹
                        {safeNumber(bill.total).toFixed(2)}
                      </div>
                      <div
                        className={`status-badge ${bill.status === "DRAFT" ? "badge-draft" : bill.status === "RETURNED" ? "badge-returned" : "badge-paid"}`}
                      >
                        {bill.status}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--overlay-05)",
                      }}
                    >
                      {bill.status === "DRAFT" ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            width: "100%",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            type="button"
                            className="pos-btn primary"
                            style={{
                              padding: "4px 12px",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResumeDraftClick(bill);
                            }}
                          >
                            <Play size={12} fill="currentColor" /> Resume
                          </button>
                          <button
                            type="button"
                            className="pos-btn outline btn-error"
                            style={{
                              padding: "4px 12px",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDraftConfirm(bill);
                            }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      ) : (
                        <>
                          <Printer
                            size={14}
                            className="result-meta bill-action-icon"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBillPrint(bill);
                            }}
                            title="Print"
                          />
                          <MessageCircle
                            size={14}
                            className="result-meta bill-action-icon"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBillWhatsApp(bill);
                            }}
                            title="Send WhatsApp"
                          />
                          <RefreshCw
                            size={14}
                            className="result-meta bill-action-icon"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBillReturn(bill);
                            }}
                            title="Process Return"
                          />
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                className={`load-more-btn ${loadMoreLoading ? "btn-loading" : ""} ${allBillsLoaded ? "btn-disabled" : ""}`}
                onClick={handleLoadMore}
                disabled={loadMoreLoading || allBillsLoaded}
              >
                {allBillsLoaded ? (
                  "All bills loaded ✓"
                ) : loadMoreLoading ? (
                  <>
                    <Spinner size={14} /> Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          </div>

          <div className="pos-card" style={{ padding: "20px" }}>
            <div className="pos-card-title">TODAY'S SUMMARY</div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[
                {
                  label: "CASH",
                  val:
                    "₹" +
                    (todayBills || [])
                      .filter(
                        (b) => (b.paymentMode || b.paymentMethod) === "CASH",
                      )
                      .reduce((s, b) => s + safeNumber(b.total), 0)
                      .toLocaleString(),
                  col: "var(--primary)",
                  pct:
                    (todayBills || []).length > 0
                      ? ((todayBills || []).filter(
                          (b) => (b.paymentMode || b.paymentMethod) === "CASH",
                        ).length /
                          (todayBills || []).length) *
                        100
                      : 0,
                },
                {
                  label: "UPI",
                  val:
                    "₹" +
                    (todayBills || [])
                      .filter(
                        (b) => (b.paymentMode || b.paymentMethod) === "UPI",
                      )
                      .reduce((s, b) => s + safeNumber(b.total), 0)
                      .toLocaleString(),
                  col: "var(--info)",
                  pct:
                    (todayBills || []).length > 0
                      ? ((todayBills || []).filter(
                          (b) => (b.paymentMode || b.paymentMethod) === "UPI",
                        ).length /
                          (todayBills || []).length) *
                        100
                      : 0,
                },
                {
                  label: "CARD",
                  val:
                    "₹" +
                    (todayBills || [])
                      .filter(
                        (b) => (b.paymentMode || b.paymentMethod) === "CARD",
                      )
                      .reduce((s, b) => s + safeNumber(b.total), 0)
                      .toLocaleString(),
                  col: "var(--info)",
                  pct:
                    (todayBills || []).length > 0
                      ? ((todayBills || []).filter(
                          (b) => (b.paymentMode || b.paymentMethod) === "CARD",
                        ).length /
                          (todayBills || []).length) *
                        100
                      : 0,
                },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{s.label}</span>
                    <span>{s.val}</span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--overlay-05)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${s.pct}%`,
                        height: "100%",
                        background: s.col,
                      }}
                    />
                  </div>
                </div>
              ))}
              {todayBills.length === 0 && (
                <p
                  className="result-meta"
                  style={{ textAlign: "center", marginTop: 40 }}
                >
                  No finalized bills yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

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

      <AnimatePresence>
        {showNewBillConfirm && (
          <div
            className="stock-modal-overlay"
            onClick={() => setShowNewBillConfirm(false)}
          >
            <motion.div
              className="stock-modal-content confirm-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="stock-modal-body"
                style={{ padding: "32px", textAlign: "center" }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    marginBottom: "12px",
                  }}
                >
                  {editingDraft
                    ? "Exit Draft & Start New Bill?"
                    : "Start New Bill?"}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    marginBottom: "24px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {editingDraft
                    ? "Any unsaved changes to this draft will be lost if you start a new bill without saving."
                    : "This will clear the current items and begin a new billing session."}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="pos-btn secondary"
                    onClick={() => setShowNewBillConfirm(false)}
                  >
                    Cancel
                  </button>
                  {lineItems.length > 0 && !editingDraft && (
                    <button
                      className="pos-btn outline"
                      onClick={async () => {
                        setShowNewBillConfirm(false);
                        await handleSaveDraft();
                        setShowPreview(false);
                        resetBillForm();
                        setActiveInvoice(null);
                      }}
                    >
                      Save Draft & New
                    </button>
                  )}
                  {editingDraft && lineItems.length > 0 && (
                    <button
                      className="pos-btn outline"
                      onClick={async () => {
                        setShowNewBillConfirm(false);
                        await handleSaveDraft();
                        setShowPreview(false);
                        resetBillForm();
                        setActiveInvoice(null);
                      }}
                    >
                      Update Draft & New
                    </button>
                  )}
                  <button
                    className="pos-btn primary"
                    onClick={() => {
                      setShowNewBillConfirm(false);
                      setShowPreview(false);
                      resetBillForm();
                      setActiveInvoice(null);
                    }}
                  >
                    Start New Bill
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAllBillsModal && (
          <div
            className="stock-modal-overlay"
            onClick={() => setShowAllBillsModal(false)}
          >
            <motion.div
              className="stock-modal-content all-bills-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  All Bills — {todayStr}
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowAllBillsModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <div className="all-bills-toolbar">
                  <input
                    required
                    className="all-bills-search"
                    placeholder="Search by invoice, patient, phone..."
                  />
                  <button
                    className="pos-btn teal"
                    style={{ padding: "8px 16px", fontSize: "13px" }}
                  >
                    Export Today's Bills
                  </button>
                </div>
                <div className="filter-pills">
                  {[
                    { label: "All", value: "All" },
                    { label: "Paid", value: "PAID" },
                    { label: "Draft", value: "DRAFT" },
                    { label: "Returned", value: "RETURNED" },
                  ].map((f) => (
                    <button
                      key={f.value}
                      className={`filter-pill ${allBillsFilter === f.value ? "active" : ""}`}
                      onClick={() => setAllBillsFilter(f.value)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="all-bills-table-wrap">
                  <table className="all-bills-table">
                    <thead>
                      <tr>
                        <th>INV#</th>
                        <th>Time</th>
                        <th>Patient</th>
                        <th>Phone</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bills || [])
                        .filter((b) => {
                          if (allBillsFilter === "All") return true;
                          if (allBillsFilter === "PAID")
                            return (
                              b.status === "PAID" || b.status === "FINALIZED"
                            );
                          if (allBillsFilter === "DRAFT")
                            return b.status === "DRAFT";
                          if (allBillsFilter === "RETURNED")
                            return (
                              b.status === "RETURNED" ||
                              b.status === "REFUNDED" ||
                              b.status === "PARTIALLY_REFUNDED"
                            );
                          return b.status === allBillsFilter;
                        })
                        .map((bill) => (
                          <tr key={bill.id}>
                            <td style={{ fontWeight: 600 }}>
                              {resolveInvoiceField(
                                bill,
                                "invoiceNumber",
                                bill.id,
                              )}
                            </td>
                            <td>{bill.time}</td>
                            <td>{bill.patient}</td>
                            <td>{bill.phone}</td>
                            <td>{bill.items.length}</td>
                            <td style={{ fontWeight: 700 }}>
                              ₹{safeNumber(bill.total).toFixed(2)}
                            </td>
                            <td>
                              <span
                                className={`status-badge ${bill.status === "DRAFT" ? "badge-draft" : bill.status === "RETURNED" ? "badge-returned" : "badge-paid"}`}
                              >
                                {bill.status}
                              </span>
                            </td>
                            <td>
                              <div className="all-bills-actions">
                                {bill.status === "DRAFT" ? (
                                  <>
                                    <button
                                      className="all-bills-action-btn"
                                      onClick={() =>
                                        handleResumeDraftClick(bill)
                                      }
                                      title="Resume Draft"
                                      style={{
                                        color: "var(--color-primary, #14b8a6)",
                                      }}
                                    >
                                      <Play size={14} fill="currentColor" />
                                    </button>
                                    <button
                                      className="all-bills-action-btn"
                                      onClick={() =>
                                        handleDeleteDraftConfirm(bill)
                                      }
                                      title="Delete Draft"
                                      style={{
                                        color: "var(--color-error, #ef4444)",
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="all-bills-action-btn"
                                      onClick={() => {
                                        openBillDetail(bill);
                                        setShowAllBillsModal(false);
                                      }}
                                      title="View"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <button
                                      className="all-bills-action-btn"
                                      onClick={() => handleBillPrint(bill)}
                                      title="Print"
                                    >
                                      <Printer size={14} />
                                    </button>
                                    <button
                                      className="all-bills-action-btn"
                                      onClick={() => handleBillWhatsApp(bill)}
                                      title="WhatsApp"
                                    >
                                      <MessageCircle size={14} />
                                    </button>
                                    <button
                                      className="all-bills-action-btn"
                                      onClick={() => handleBillReturn(bill)}
                                      title="Return"
                                    >
                                      <RefreshCw size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBillDetailDrawer && selectedBill && (
          <>
            <motion.div
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBillDetailDrawer(false)}
            />
            <motion.div
              className="bill-detail-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header">
                <div>
                  <h3
                    style={{
                      fontFamily: "Outfit",
                      fontWeight: 700,
                      fontSize: "16px",
                    }}
                  >
                    {resolveInvoiceField(
                      selectedBill,
                      "invoiceNumber",
                      selectedBill.id,
                    )}
                  </h3>
                  <span className="result-meta">
                    {selectedBill.time} ·{" "}
                    {resolveInvoiceField(
                      selectedBill,
                      "patientName",
                      "Walk-in Customer",
                    )}
                  </span>
                </div>
                <button
                  className="micro-btn"
                  onClick={() => setShowBillDetailDrawer(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="drawer-body">
                <div className="drawer-patient-info">
                  <div>
                    <span className="stat-label">PATIENT</span>
                    <div style={{ fontWeight: 600 }}>
                      {resolveInvoiceField(
                        selectedBill,
                        "patientName",
                        "Walk-in Customer",
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="stat-label">PHONE</span>
                    <div style={{ fontWeight: 600 }}>
                      {resolveInvoiceField(selectedBill, "patientPhone", "-")}
                    </div>
                  </div>
                  <div>
                    <span className="stat-label">PAYMENT</span>
                    <div>
                      <span
                        className={`payment-badge payment-${(selectedBill.paymentMethod || "CASH").toLowerCase()}`}
                      >
                        {selectedBill.paymentMethod || "CASH"}
                      </span>
                    </div>
                  </div>
                </div>
                <table className="drawer-items-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Qty</th>
                      <th>MRP</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedBill.itemsList || [])
                      .map(normalizeInvoiceItem)
                      .map((item, idx) => (
                        <tr
                          key={
                            item.id ||
                            item.medicineId ||
                            `${item.name}-${item.batchNumber || ""}-${idx}`
                          }
                        >
                          <td>{item.name}</td>
                          <td>{safeNumber(item.qty)}</td>
                          <td>₹{safeNumber(item.price).toFixed(2)}</td>
                          <td style={{ textAlign: "right" }}>
                            ₹
                            {(
                              safeNumber(item.price) * safeNumber(item.qty)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="drawer-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>
                      ₹
                      {safeNumber(
                        resolveInvoiceField(selectedBill, "subtotal", 0),
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>CGST</span>
                    <span>
                      ₹
                      {safeNumber(
                        resolveInvoiceField(selectedBill, "cgst", 0),
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>SGST</span>
                    <span>
                      ₹
                      {safeNumber(
                        resolveInvoiceField(selectedBill, "sgst", 0),
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-row grand">
                    <span>TOTAL</span>
                    <span>₹{safeNumber(selectedBill.total).toFixed(2)}</span>
                  </div>
                </div>
                <div className="drawer-timeline">
                  <div className="stat-label" style={{ marginBottom: "8px" }}>
                    TIMELINE
                  </div>
                  {(selectedBill.timeline || []).map((t, tIdx) => (
                    <div
                      key={
                        typeof t === "string"
                          ? `timeline-${t}-${tIdx}`
                          : t?.id || `timeline-${tIdx}`
                      }
                      className="timeline-item"
                    >
                      <div className="timeline-dot" />
                      <span>
                        {typeof t === "string"
                          ? t
                          : t?.message || t?.title || JSON.stringify(t)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="drawer-footer">
                {selectedBill.status === "DRAFT" ? (
                  <>
                    <button
                      className="pos-btn primary"
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                      onClick={() => {
                        setShowBillDetailDrawer(false);
                        handleResumeDraftClick(selectedBill);
                      }}
                    >
                      <Play size={14} fill="currentColor" /> Resume Draft
                    </button>
                    <button
                      className="pos-btn outline btn-error"
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                      onClick={() => handleDeleteDraftConfirm(selectedBill)}
                    >
                      <Trash2 size={14} /> Delete Draft
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="pos-btn outline"
                      style={{ flex: 1 }}
                      onClick={() => handleBillPrint(selectedBill)}
                    >
                      <Printer size={14} /> Print
                    </button>
                    <button
                      className="pos-btn outline"
                      style={{ flex: 1 }}
                      onClick={() => handleBillWhatsApp(selectedBill)}
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                    <button
                      className="pos-btn outline"
                      style={{
                        flex: 1,
                        borderColor: "var(--danger)",
                        color: "var(--danger)",
                      }}
                      onClick={() => {
                        setShowBillDetailDrawer(false);
                        handleBillReturn(selectedBill);
                      }}
                    >
                      <RefreshCw size={14} /> Return
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReturnBillModal && selectedBill && (
          <div
            className="stock-modal-overlay"
            onClick={() => setShowReturnBillModal(false)}
          >
            <motion.div
              className="stock-modal-content return-modal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Process Return —{" "}
                  {resolveInvoiceField(
                    selectedBill,
                    "invoiceNumber",
                    selectedBill.id,
                  )}
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowReturnBillModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <table className="return-items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Return Qty</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolveInvoiceItems(selectedBill)
                      .map(normalizeInvoiceItem)
                      .map((item, idx) => (
                        <tr
                          key={
                            item.id ||
                            item.medicineId ||
                            `${item.name}-${item.batchNumber || ""}-${idx}`
                          }
                        >
                          <td>{item.name}</td>
                          <td>{item.qty}</td>
                          <td>
                            <input
                              required
                              className="pos-input return-qty-input"
                              type="number"
                              min="0"
                              max={item.qty}
                              value={returnItems[idx] || 0}
                              onChange={(e) =>
                                setReturnItems((prev) => {
                                  const arr = Array.isArray(prev) ? prev : [];
                                  const next = [...arr];
                                  next[idx] = Math.min(
                                    item.qty,
                                    Math.max(0, safeNumber(e.target.value)),
                                  );
                                  return next;
                                })
                              }
                            />
                          </td>
                          <td
                            style={{ fontWeight: 700, color: "var(--danger)" }}
                          >
                            ₹
                            {(
                              safeNumber(returnItems[idx]) *
                              safeNumber(item.price)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="pos-input-group" style={{ marginTop: "16px" }}>
                  <label>Return Reason</label>
                  <select
                    className="pos-input"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  >
                    <option>Customer Request</option>
                    <option>Damaged</option>
                    <option>Wrong Medicine</option>
                    <option>Expiry</option>
                  </select>
                </div>
                <div className="pos-input-group" style={{ marginTop: "12px" }}>
                  <label>Notes</label>
                  <textarea
                    className="pos-input return-notes"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
                <div className="return-total-row">
                  <span>Return Amount</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      fontSize: "14px",
                    }}
                  >
                    Calculated by server
                  </span>
                </div>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  disabled={processingReturn}
                  onClick={() => setShowReturnBillModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn outline"
                  disabled={processingReturn}
                  style={{
                    background: "var(--danger)",
                    color: "white",
                    border: "none",
                    opacity: processingReturn ? 0.6 : 1,
                  }}
                  onClick={confirmReturn}
                >
                  {processingReturn ? "Processing..." : "Process Return"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReturnModal && (
          <div
            className="stock-modal-overlay"
            onClick={() => setShowReturnModal(false)}
          >
            <motion.div
              className="stock-modal-content"
              style={{ width: "580px" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Process Sales Return
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowReturnModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <div
                  className="pos-input-group"
                  style={{ marginBottom: "24px" }}
                >
                  <label>Find Bill</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      required
                      className="pos-input"
                      style={{ flex: 1 }}
                      placeholder="Invoice number or patient name..."
                      value={returnSearchQuery}
                      onChange={(e) => setReturnSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                {!returnModalSelectedBill ? (
                  <div>
                    {(bills || [])
                      .filter((b) =>
                        ["FINALIZED", "PAID", "RETURNED"].includes(b.status),
                      )
                      .filter((b) => {
                        const q = returnSearchQuery.toLowerCase();
                        if (!q) return false;
                        const inv = resolveInvoiceField(
                          b,
                          "invoiceNumber",
                          b.id,
                        ).toLowerCase();
                        const name = resolveInvoiceField(
                          b,
                          "patientName",
                          "",
                        ).toLowerCase();
                        return inv.includes(q) || name.includes(q);
                      })
                      .slice(0, 5)
                      .map((bill) => (
                        <div
                          key={bill.id}
                          className="patient-result-row"
                          style={{
                            cursor: "pointer",
                            padding: "10px",
                            borderRadius: "8px",
                            marginBottom: "4px",
                          }}
                          onClick={() => {
                            setReturnModalSelectedBill(bill);
                            setReturnModalItems({});
                            setReturnModalReason("Patient Request");
                          }}
                        >
                          <span className="patient-result-name">
                            {resolveInvoiceField(
                              bill,
                              "invoiceNumber",
                              bill.id,
                            )}
                          </span>
                          <span className="patient-result-phone">
                            {resolveInvoiceField(
                              bill,
                              "patientName",
                              "Walk-in Customer",
                            )}
                          </span>
                          <span className="result-meta">
                            ₹
                            {safeNumber(
                              resolveInvoiceField(bill, "total", 0),
                            ).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    {returnSearchQuery &&
                      bills.filter((b) => {
                        const q = returnSearchQuery.toLowerCase();
                        const inv = resolveInvoiceField(
                          b,
                          "invoiceNumber",
                          b.id,
                        ).toLowerCase();
                        const name = resolveInvoiceField(
                          b,
                          "patientName",
                          "",
                        ).toLowerCase();
                        return inv.includes(q) || name.includes(q);
                      }).length === 0 && (
                        <div
                          style={{
                            padding: "20px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          No matching bills found
                        </div>
                      )}
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700 }}>
                          {resolveInvoiceField(
                            returnModalSelectedBill,
                            "invoiceNumber",
                            returnModalSelectedBill.id,
                          )}
                        </span>
                        <span
                          className="result-meta"
                          style={{ marginLeft: "12px" }}
                        >
                          {resolveInvoiceField(
                            returnModalSelectedBill,
                            "patientName",
                            "Walk-in Customer",
                          )}
                        </span>
                      </div>
                      <button
                        className="micro-btn"
                        onClick={() => setReturnModalSelectedBill(null)}
                      >
                        <ArrowLeft size={16} />
                      </button>
                    </div>
                    <div
                      style={{
                        background: "rgba(239, 68, 68, 0.05)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        borderRadius: "12px",
                        padding: "16px",
                      }}
                    >
                      {resolveInvoiceItems(returnModalSelectedBill)
                        .map(normalizeInvoiceItem)
                        .map((item, idx) => (
                          <div
                            key={
                              item.id ||
                              item.medicineId ||
                              `${item.name}-${item.batchNumber || ""}-${idx}`
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "12px",
                            }}
                          >
                            <input
                              required
                              type="checkbox"
                              checked={returnModalItems[idx]?.checked ?? true}
                              onChange={(e) =>
                                setReturnModalItems((prev) => ({
                                  ...prev,
                                  [idx]: {
                                    ...prev[idx],
                                    checked: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <div style={{ flex: 1 }}>{item.name}</div>
                            <input
                              required
                              className="p-cost-input"
                              style={{ width: "50px" }}
                              type="number"
                              min={0}
                              max={item.qty}
                              value={returnModalItems[idx]?.qty ?? 0}
                              onChange={(e) =>
                                setReturnModalItems((prev) => ({
                                  ...prev,
                                  [idx]: {
                                    ...prev[idx],
                                    qty: Math.min(
                                      item.qty,
                                      Math.max(0, safeNumber(e.target.value)),
                                    ),
                                  },
                                }))
                              }
                            />
                          </div>
                        ))}
                    </div>
                    <div
                      className="pos-input-group"
                      style={{ marginTop: "24px" }}
                    >
                      <label>Return Reason</label>
                      <select
                        className="pos-input"
                        value={returnModalReason}
                        onChange={(e) => setReturnModalReason(e.target.value)}
                      >
                        <option>Patient Request</option>
                        <option>Wrong Medicine</option>
                        <option>Quality Issue</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  onClick={() => {
                    setShowReturnModal(false);
                    setReturnModalSelectedBill(null);
                    setReturnSearchQuery("");
                  }}
                >
                  Cancel
                </button>
                {returnModalSelectedBill && (
                  <button
                    className="pos-btn outline"
                    style={{
                      background: "var(--danger)",
                      color: "white",
                      border: "none",
                    }}
                    onClick={async () => {
                      const items = resolveInvoiceItems(
                        returnModalSelectedBill,
                      ).map(normalizeInvoiceItem);
                      const returnPayload = items
                        .map((item, idx) => ({
                          item,
                          qty: safeNumber(returnModalItems[idx]?.qty) || 0,
                          checked: returnModalItems[idx]?.checked !== false,
                        }))
                        .filter(({ qty, checked }) => checked && qty > 0)
                        .map(({ item, qty }) => ({
                          invoiceItemId: item.invoiceItemId || item.id,
                          medicineId: item.medicineId || null,
                          batchId: item.batchId || null,
                          quantity: qty,
                          reason: returnModalReason,
                        }));

                      if (returnPayload.length === 0) {
                        showToast("No items selected for return", "error");
                        return;
                      }

                      if (processingReturn) return;
                      setProcessingReturn(true);
                      try {
                        const res = await api.post(
                          `billing/invoices/${returnModalSelectedBill.id}/refund`,
                          {
                            items: returnPayload,
                            reason: returnModalReason,
                          },
                        );
                        const refund =
                          res.data?.data?.actualRefundAmount ??
                          res.data?.actualRefundAmount ??
                          res.data?.data?.refundAmount ??
                          res.data?.refundAmount ??
                          res.data?.data?.totalRefundAmount ??
                          res.data?.totalRefundAmount ??
                          0;
                        showToast(
                          `Return processed successfully. Refund: ₹${Number(refund).toFixed(2)}`,
                          "success",
                        );
                        setShowReturnModal(false);
                        setReturnModalSelectedBill(null);
                        setReturnSearchQuery("");
                        window.dispatchEvent(
                          new CustomEvent("dashboard:refresh"),
                        );
                      } catch (err) {
                        showToast(
                          err.response?.data?.error ||
                            "Failed to process return",
                          "error",
                        );
                      } finally {
                        setProcessingReturn(false);
                      }
                    }}
                  >
                    {processingReturn ? "Processing..." : "Process Return"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
