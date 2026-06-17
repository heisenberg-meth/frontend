import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../hooks/useAuth.js";
import { API_ROUTES } from "../constants/api.routes.js";
import { getMedicines } from "../services/inventory.service";
import {
  createPurchaseOrder,
  receivePurchaseOrder,
} from "../services/purchases.service.js";
import {
  getSupplierCreditBalance,
  getCreditNotes,
  applyCreditNote,
} from "../services/supplier-returns.service.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ShoppingCart,
  Clock,
  ArrowLeft,
  Building2,
  Plus,
  X,
  Download,
  Eye,
  Edit2,
  Truck,
  ScanLine,
  Package,
  Loader2,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { safeNumber } from "../utils/number.js";

function Spinner({ size = 14 }) {
  return (
    <Loader2 size={size} style={{ animation: "spin 0.8s linear infinite" }} />
  );
}

const formatDate = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "-"
    : parsed.toLocaleDateString("en-IN");
};

const safeData = (result, ...keys) => {
  if (result.status !== "fulfilled") return [];
  let val = result.value?.data;
  for (const key of keys) {
    if (val && typeof val === "object" && key in val) {
      val = val[key];
    }
  }
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") {
    if (Array.isArray(val.data)) return val.data;
  }
  return [];
};

export default function PurchaseManagement({ showToast, storeProfile }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("invoices");
  const [drawer, setDrawer] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSelections, setReturnSelections] = useState([]);
  const [loadingReturnBatches, setLoadingReturnBatches] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [returns, setReturns] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [receiveItems, setReceiveItems] = useState([]);
  const [isReceiving, setIsReceiving] = useState(false);

  const [differentBatch, setDifferentBatch] = useState({});

  const handleOpenReceiveModal = async (po) => {
    setSelectedRow(po);
    setDifferentBatch({});

    let priorGRN = null;
    try {
      const { data } = await api.get(`${API_ROUTES.PURCHASES_ORDERS}/${po.id}`);
      const order = data?.data || data;
      priorGRN = order?.goodsReceiptNotes?.[0] || null;
    } catch {
      // no prior GRN data available
    }

    setReceiveItems(
      (po.items || []).map((item) => {
        const remaining = Math.max(
          0,
          (item.quantity || 0) - (item.receivedQuantity || 0),
        );
        const unitPrice =
          item.purchasePrice || item.unitPrice || item.price || 0;

        const priorItem = priorGRN?.items?.find(
          (gi) => gi.purchaseOrderItemId === item.id,
        );

        // Pre-fill batch/expiry from: 1) prior GRN data, 2) PO item data, 3) empty
        const batchNumber = priorItem?.batchNumber || item.batchNumber || "";
        const expiryDate = priorItem?.expiryDate
          ? priorItem.expiryDate.split("T")[0]
          : item.expiryDate
            ? item.expiryDate.split("T")[0]
            : "";

        return {
          ...item,
          orderedQuantity: item.quantity || 0,
          prevReceivedQuantity: item.receivedQuantity || 0,
          pendingQuantity: remaining,
          receivedQuantity: remaining,
          batchNumber,
          expiryDate,
          purchasePrice: priorItem?.purchasePrice
            ? safeNumber(priorItem.purchasePrice)
            : unitPrice,
          mrp: priorItem?.sellingPrice
            ? safeNumber(priorItem.sellingPrice)
            : item.mrp ||
              item.sellingPrice ||
              (unitPrice ? (safeNumber(unitPrice) * 1.2).toFixed(2) : 0),
        };
      }),
    );
    setShowReceiveModal(true);
  };

  const refreshData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get(API_ROUTES.SUPPLIERS),
        api.get(API_ROUTES.PURCHASES_ORDERS),
        api.get(API_ROUTES.PURCHASES_RETURNS),
        api.get(API_ROUTES.PURCHASES_INVOICES),
        api.get("/branches"),
      ]);

      setSuppliers(safeData(results[0], "data"));
      setOrders(safeData(results[1], "data"));
      setReturns(safeData(results[2], "data"));
      setInvoices(safeData(results[3], "data"));
      setBranches(safeData(results[4], "data"));
    } catch (err) {
      console.error("[FETCH DATA ERROR]", err);

      showToast("Failed to load live data", "error");
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);

        const results = await Promise.allSettled([
          api.get(API_ROUTES.SUPPLIERS),
          api.get(API_ROUTES.PURCHASES_ORDERS),
          api.get(API_ROUTES.PURCHASES_RETURNS),
          api.get(API_ROUTES.PURCHASES_INVOICES),
          api.get("/branches"),
        ]);

        if (!mounted) return;

        setSuppliers(safeData(results[0], "data"));
        setOrders(safeData(results[1], "data"));
        setReturns(safeData(results[2], "data"));
        setInvoices(safeData(results[3], "data"));
        setBranches(safeData(results[4], "data"));

        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          console.warn(
            `[PURCHASE] ${failed.length} API(s) failed, using partial data`,
          );
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          showToast("Failed to load live data", "error");
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

  useEffect(() => {}, [medicines]);

  useEffect(() => {}, [purchaseItems]);

  const loadMedicines = useCallback(async () => {
    try {
      setLoadingMedicines(true);
      const response = await getMedicines({
        page: 1,
        limit: 1000,
      });
      const items = response?.data?.data?.items || response?.data?.data || [];
      setMedicines(items);
    } catch (error) {
      console.error("LOAD MEDICINES ERROR:", error);
    } finally {
      setLoadingMedicines(false);
    }
  }, []);

  useEffect(() => {
    if (drawer || showReturnModal || showReceiveModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [drawer, showReturnModal, showReceiveModal]);

  /* ── Filter States ── */
  const [filters, setFilters] = useState({
    date: "",
    supplier: "All Suppliers",
    status: "All Status",
    search: "",
  });

  /* ── New Purchase Form State ── */
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [supplierInvNo, setSupplierInvNo] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── Credit Application State ── */
  const [supplierCredit, setSupplierCredit] = useState({
    available: 0,
    notes: [],
  });
  const [selectedCreditNoteId, setSelectedCreditNoteId] = useState("");
  const [creditAmountToApply, setCreditAmountToApply] = useState(0);
  const [applyingCredit, setApplyingCredit] = useState(false);

  const filteredMedicines = medicines.filter((m) =>
    (m.name || "").toLowerCase().includes(medicineSearch.toLowerCase()),
  );

  const subtotal = purchaseItems.reduce(
    (acc, i) => acc + i.qty * (i.purchasePrice || 0),
    0,
  );
  const gstTotal = purchaseItems.reduce(
    (acc, i) =>
      acc + (i.qty * (i.purchasePrice || 0) * (i.gstPercentage || 0)) / 100,
    0,
  );
  const grandTotal = subtotal + gstTotal;

  const addMedicine = (medicine) => {
    const exists = purchaseItems.find((i) => i.id === medicine.id);
    if (exists) return;
    setPurchaseItems([
      ...purchaseItems,
      {
        ...medicine,
        qty: 1,
        purchasePrice: medicine.purchasePrice || 0,
        gstPercentage: medicine.gstPercentage || 12,
        batchNumber: "",
        expiryDate: "",
      },
    ]);

    setMedicineSearch("");
  };

  const updateItem = (id, field, value) => {
    setPurchaseItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "qty" ||
                field === "purchasePrice" ||
                field === "sellingPrice" ||
                field === "gstPercentage"
                  ? safeNumber(value)
                  : value,
            }
          : item,
      ),
    );
  };

  const removeMedicine = (id) => {
    setPurchaseItems((prev) => prev.filter((item) => item.id !== id));
  };

  const resetForm = () => {
    setSelectedSupplier(null);
    setMedicineSearch("");
    setPurchaseItems([]);
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setSupplierInvNo("");
    setSaving(false);
    setSelectedBranchId("");
  };

  const downloadPurchasePDF = (order) => {
    if (!order) return;
    const doc = new jsPDF();

    // Store Profile
    const shopName = storeProfile?.shopName || "Viyan MedAssist";
    const address = storeProfile?.address || "";
    const phone = storeProfile?.phone || "";
    const email = storeProfile?.email || "";
    const gstin = storeProfile?.gstin || "";

    // Header / Shop Info
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(shopName, 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let y = 28;
    if (address) {
      doc.text(address, 14, y);
      y += 6;
    }
    if (phone || email) {
      doc.text(
        `${phone ? `Phone: ${phone}` : ""} ${email ? `| Email: ${email}` : ""}`,
        14,
        y,
      );
      y += 6;
    }
    if (gstin) {
      doc.text(`GSTIN: ${gstin}`, 14, y);
      y += 6;
    }

    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 10;

    // Document type detection
    let docType = "PURCHASE INVOICE";
    let docNum = order.invoiceNumber || order.id || "-";
    if (order.returnNumber) {
      docType = "PURCHASE RETURN";
      docNum = order.returnNumber;
    } else if (order.orderNumber || order.poNumber) {
      docType = "PURCHASE ORDER";
      docNum = order.orderNumber || order.poNumber;
    }

    // Document Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(docType, 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const supplierName =
      order.supplier?.name || order.supplierName || order.supplier || "-";
    const orderDate =
      order.date || (order.createdAt ? formatDate(order.createdAt) : "-");
    const refNum =
      order.referenceNumber || order.ref || order.supplierInvoiceNumber || "-";
    const invoiceDateStr = order.invoiceDate
      ? formatDate(order.invoiceDate)
      : "-";

    doc.text(
      `${docType
        .split(" ")
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(" ")} No: ${docNum}`,
      14,
      y,
    );
    doc.text(`Date: ${orderDate}`, 120, y);
    y += 8;
    doc.text(`Supplier: ${supplierName}`, 14, y);
    doc.text(`Ref / Inv No: ${refNum}`, 120, y);
    y += 8;
    if (order.invoiceDate) {
      doc.text(`Invoice Date: ${invoiceDateStr}`, 120, y);
      y += 8;
    }
    y += 4;

    // Table
    autoTable(doc, {
      startY: y,
      head: [["Medicine", "Quantity", "Purchase Price (Rs.)", "Total (Rs.)"]],
      body: (order.items || []).map((it) => [
        it.medicine?.name || it.medicineName || it.name || "Unknown",
        String(it.quantity || it.qty || 0),
        `Rs. ${safeNumber(it.purchasePrice || it.unitPrice || it.price || 0).toFixed(2)}`,
        `Rs. ${safeNumber((it.quantity || it.qty || 0) * (it.purchasePrice || it.unitPrice || it.price || 0)).toFixed(2)}`,
      ]),
      headStyles: { fillColor: [13, 148, 136], textColor: 255 }, // teal color (matches the theme)
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 10, left: 14, right: 14 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;

    // Totals Box
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const subtotalVal = order.subtotal || order.totalAmount || order.total || 0;
    const gstVal = order.gstAmount || 0;
    const totalVal = order.totalAmount || order.total || 0;

    doc.text(`Subtotal:`, 130, finalY);
    doc.text(`Rs. ${safeNumber(subtotalVal).toFixed(2)}`, 165, finalY);

    doc.text(`GST:`, 130, finalY + 6);
    doc.text(`Rs. ${safeNumber(gstVal).toFixed(2)}`, 165, finalY + 6);

    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount:`, 130, finalY + 14);
    doc.text(`Rs. ${safeNumber(totalVal).toFixed(2)}`, 165, finalY + 14);

    doc.save(`${docType.replace(" ", "_")}_${docNum}.pdf`);
    showToast("PDF downloaded successfully", "success");
  };

  const handleSavePurchase = async () => {
    if (!selectedSupplier) {
      showToast("Please select a supplier", "error");
      return;
    }
    const finalBranchId =
      selectedBranchId ||
      user?.branchId ||
      (branches.length > 0 ? branches[0].id : "");
    if (!finalBranchId) {
      showToast(
        "Please select a branch or verify your user profile branch is assigned",
        "error",
      );
      return;
    }
    if (purchaseItems.length === 0) {
      showToast("Add at least one medicine", "error");
      return;
    }
    if (!supplierInvNo.trim()) {
      showToast("Enter supplier invoice number", "error");
      return;
    }
    if (
      purchaseItems.some(
        (item) => !item.batchNumber || !item.batchNumber.trim(),
      )
    ) {
      showToast("Please enter batch number for all medicines", "error");
      return;
    }
    if (purchaseItems.some((item) => !item.expiryDate)) {
      showToast("Please enter expiry date for all medicines", "error");
      return;
    }

    for (const item of purchaseItems) {
      if (!Number.isFinite(item.qty)) {
        showToast("Invalid Quantity", "error");
        return;
      }
      if (!Number.isFinite(item.purchasePrice)) {
        showToast("Invalid Price", "error");
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        supplierId: selectedSupplier.id,
        branchId: finalBranchId,
        supplierInvoiceNumber: supplierInvNo.trim(),
        invoiceDate: invoiceDate
          ? new Date(invoiceDate).toISOString()
          : new Date().toISOString(),
        items: purchaseItems.map((item) => ({
          medicineId: item.id,
          quantity: safeNumber(item.qty),
          purchasePrice: safeNumber(item.purchasePrice || 0),
          sellingPrice: safeNumber(
            item.sellingPrice || item.mrp || item.purchasePrice || 0,
          ),
          batchNumber: item.batchNumber.trim(),
          expiryDate: new Date(item.expiryDate).toISOString(),
        })),
        subtotal,
        gstAmount: gstTotal,
        totalAmount: grandTotal,
      };
      await createPurchaseOrder(payload);
      showToast("Purchase Saved Successfully", "success");
      closeDrawer();
      await refreshData();
    } catch (err) {
      console.error("[PURCHASE] Save failed:", err);
      showToast(
        err.response?.data?.error || err.message || "Failed to save purchase",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") closeDrawer();
  };

  const handleOpenDrawer = (type, row = null) => {
    if (type === "new-purchase") {
      loadMedicines();
      resetForm();
      setSelectedBranchId(
        user?.branchId || (branches.length > 0 ? branches[0].id : ""),
      );
      setDrawer(type);
      return;
    }

    if (!row) {
      showToast("Unable to load invoice details", "error");
      return;
    }

    setSelectedRow(row);
    setDrawer(type);

    if (type === "edit-purchase") {
      loadMedicines();
      setSelectedSupplier(row.supplier || null);
      setInvoiceDate(
        (row.invoiceDate || row.date || "").split("T")[0] ||
          new Date().toISOString().split("T")[0],
      );
      setSupplierInvNo(row.supplierInvoiceNumber || "");
      setSelectedBranchId(
        row.branchId ||
          user?.branchId ||
          (branches.length > 0 ? branches[0].id : ""),
      );
      setPurchaseItems(
        (row.items || []).map((item) => ({
          id: item.medicineId || item.medicine?.id,
          name: item.medicine?.name || item.medicineName || item.name || "",
          qty: item.quantity || item.qty || 0,
          purchasePrice: safeNumber(
            item.purchasePrice || item.unitPrice || item.price || 0,
          ),
          gstPercentage: safeNumber(item.gstPercentage || 0),
          batchNumber: item.batchNumber || "",
          expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] : "",
        })),
      );
    }
  };

  const closeDrawer = () => {
    setDrawer(null);
    setSelectedRow(null);
    setSupplierCredit({ available: 0, notes: [] });
    setSelectedCreditNoteId("");
    setCreditAmountToApply(0);
    resetForm();
  };

  const fetchSupplierCredits = async (supplierId) => {
    try {
      const [balanceRes, notesRes] = await Promise.all([
        getSupplierCreditBalance(supplierId),
        getCreditNotes({ supplierId, status: "ISSUED,PARTIAL" }),
      ]);
      setSupplierCredit({
        available: balanceRes.data?.data?.availableCredit || 0,
        notes: notesRes.data?.data || [],
      });
    } catch (err) {
      console.error("Failed to fetch supplier credits", err);
    }
  };

  useEffect(() => {
    if (drawer === "invoice-detail" && selectedRow) {
      const supplierId = selectedRow.supplierId || selectedRow.supplier?.id;
      if (
        supplierId &&
        (selectedRow.paymentStatus || selectedRow.status) !== "PAID"
      ) {
        setTimeout(() => {
          fetchSupplierCredits(supplierId);
        }, 0);
      }
    }
  }, [drawer, selectedRow]);

  const handleApplyCredit = async () => {
    if (!selectedCreditNoteId || creditAmountToApply <= 0) {
      showToast("Select a credit note and enter a valid amount", "warning");
      return;
    }
    setApplyingCredit(true);
    try {
      await applyCreditNote(selectedCreditNoteId, {
        purchaseInvoiceId: selectedRow.id,
        amountToApply: safeNumber(creditAmountToApply),
      });
      showToast("Credit applied successfully", "success");

      const supplierId = selectedRow.supplierId || selectedRow.supplier?.id;
      if (supplierId) {
        fetchSupplierCredits(supplierId);
      }
      setSelectedCreditNoteId("");
      setCreditAmountToApply(0);
      refreshData();

      setSelectedRow((prev) => ({
        ...prev,
        balanceAmount:
          (prev.balanceAmount || prev.totalAmount || prev.total || 0) -
          creditAmountToApply,
        paidAmount: (prev.paidAmount || 0) + creditAmountToApply,
        paymentStatus:
          (prev.balanceAmount || prev.totalAmount || prev.total || 0) -
            creditAmountToApply <=
          0
            ? "PAID"
            : "PARTIALLY_PAID",
      }));
    } catch (err) {
      showToast(
        err.response?.data?.message || err.message || "Failed to apply credit",
        "error",
      );
    } finally {
      setApplyingCredit(false);
    }
  };

  useEffect(() => {
    const state = location.state;
    if (!state) return;

    if (state.action === "raise-po") {
      setTimeout(() => {
        handleOpenDrawer("new-purchase");

        if (state.medicine) {
          setPurchaseItems([
            {
              ...state.medicine,
              qty: state.medicine.reorderQty || 1,
              batchNumber: "",
              expiryDate: "",
            },
          ]);
        }

        if (state.supplierId && suppliers.length > 0) {
          const sup = suppliers.find((s) => s.id === state.supplierId);
          if (sup) {
            setSelectedSupplier(sup);
          }
        }

        // Clear route state to prevent opening the drawer again on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, suppliers, navigate, location.pathname]);

  /* ── Filtered Data Logic ── */
  const filteredInvoices = invoices.filter((inv) => {
    const supplierName =
      inv.supplier?.name || inv.supplierName || inv.supplier || "";
    const matchesSupplier =
      filters.supplier === "All Suppliers" || supplierName === filters.supplier;
    const statusVal = (inv.paymentStatus || inv.status || "")
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
    const filterVal = filters.status.toLowerCase().replace(/[\s_-]+/g, "");
    const matchesStatus =
      filters.status === "All Status" || statusVal === filterVal;
    const matchesSearch =
      (inv.supplierInvoiceNumber || inv.invoiceNumber || inv.id || "")
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      supplierName.toLowerCase().includes(filters.search.toLowerCase());
    const matchesDate =
      !filters.date || (inv.date || inv.createdAt || "").includes(filters.date);
    return matchesSupplier && matchesStatus && matchesSearch && matchesDate;
  });

  const filteredOrders = orders.filter((po) => {
    const supplierName =
      po.supplier?.name || po.supplierName || po.supplier || "";
    const matchesSupplier =
      filters.supplier === "All Suppliers" || supplierName === filters.supplier;
    const matchesStatus =
      filters.status === "All Status" ||
      (po.status || "").toLowerCase() === filters.status.toLowerCase();
    const matchesSearch =
      (po.id || po.poNumber || "")
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      supplierName.toLowerCase().includes(filters.search.toLowerCase());
    const matchesDate =
      !filters.date || (po.date || po.createdAt || "").includes(filters.date);
    return matchesSupplier && matchesStatus && matchesSearch && matchesDate;
  });

  const filteredReturns = returns.filter((ret) => {
    const supplierName =
      ret.supplier?.name || ret.supplierName || ret.supplier || "";
    const matchesSupplier =
      filters.supplier === "All Suppliers" || supplierName === filters.supplier;
    const matchesStatus =
      filters.status === "All Status" ||
      (ret.status || "").toLowerCase() === filters.status.toLowerCase();
    const matchesSearch =
      (ret.id || ret.returnNumber || "")
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      supplierName.toLowerCase().includes(filters.search.toLowerCase());
    const matchesDate =
      !filters.date || (ret.date || ret.createdAt || "").includes(filters.date);
    return matchesSupplier && matchesStatus && matchesSearch && matchesDate;
  });

  const handleReceiveOrder = async () => {
    if (isReceiving) return;
    try {
      setIsReceiving(true);
      const itemsToReceive = receiveItems.filter(
        (item) => safeNumber(item.receivedQuantity) > 0,
      );
      if (itemsToReceive.length === 0) {
        showToast(
          "Please receive at least one item with a quantity greater than 0",
          "warning",
        );
        return;
      }

      // Check that batchNumber and expiryDate are filled for all received items
      const incompleteItem = itemsToReceive.find(
        (item) => !item.batchNumber?.trim() || !item.expiryDate,
      );
      if (incompleteItem) {
        showToast(
          "Please provide a Batch Number and Expiry Date for all received items",
          "warning",
        );
        return;
      }

      // Validation 1: Receive Qty <= Pending Qty
      const exceedsPending = itemsToReceive.find(
        (item) =>
          safeNumber(item.receivedQuantity) > safeNumber(item.pendingQuantity),
      );
      if (exceedsPending) {
        showToast(
          `Received quantity for ${exceedsPending.medicine?.name || exceedsPending.medicineName || exceedsPending.name || "item"} cannot exceed the pending quantity (${exceedsPending.pendingQuantity})`,
          "warning",
        );
        return;
      }

      // Validation 2: Expiry Date < Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiredItem = itemsToReceive.find(
        (item) => new Date(item.expiryDate) < today,
      );
      if (expiredItem) {
        showToast(
          `Expiry date for ${expiredItem.medicine?.name || expiredItem.medicineName || expiredItem.name || "item"} must be in the future (today or later)`,
          "warning",
        );
        return;
      }

      // Validation 3: Purchase Price <= 0
      const invalidPrice = itemsToReceive.find(
        (item) => safeNumber(item.purchasePrice) <= 0,
      );
      if (invalidPrice) {
        showToast(
          `Purchase price for ${invalidPrice.medicine?.name || invalidPrice.medicineName || invalidPrice.name || "item"} must be greater than 0`,
          "warning",
        );
        return;
      }

      // Validation 4: MRP <= 0
      const invalidMRP = itemsToReceive.find(
        (item) => safeNumber(item.mrp) <= 0,
      );
      if (invalidMRP) {
        showToast(
          `MRP for ${invalidMRP.medicine?.name || invalidMRP.medicineName || invalidMRP.name || "item"} must be greater than 0`,
          "warning",
        );
        return;
      }

      showToast("Receiving order...", "info");
      const payload = {
        receivedItems: itemsToReceive.map((item) => ({
          medicineId: item.medicineId || item.id,
          receivedQuantity: safeNumber(item.receivedQuantity),
          batchNumber: item.batchNumber.trim(),
          expiryDate: item.expiryDate,
          purchasePrice: safeNumber(item.purchasePrice),
          sellingPrice: safeNumber(item.mrp),
          mrp: safeNumber(item.mrp),
        })),
      };
      await receivePurchaseOrder(selectedRow.id, payload);
      showToast("Order Received & Inventory Updated", "success");
      setShowReceiveModal(false);
      setDifferentBatch({});
      await refreshData();
    } catch (err) {
      console.error(err);
      const errorMessage =
        typeof err.response?.data?.error?.message === "string"
          ? err.response.data.error.message
          : typeof err.response?.data?.error === "string"
            ? err.response.data.error
            : typeof err.response?.data?.message === "string"
              ? err.response.data.message
              : typeof err.message === "string"
                ? err.message
                : "Failed to receive order";
      showToast(errorMessage, "error");
    } finally {
      setIsReceiving(false);
    }
  };

  const loadReturnBatches = async (invoice) => {
    setLoadingReturnBatches(true);
    const items = invoice?.items || [];
    const results = [];
    for (const item of items) {
      const medicineId = item.medicineId || item.medicine?.id;
      if (!medicineId) {
        results.push({
          medicineId: null,
          medicineName: item.medicine?.name || item.name || "Unknown",
          batches: [],
          selectedBatchId: "",
          quantity: 0,
        });
        continue;
      }
      try {
        const { data } = await api.get(API_ROUTES.INVENTORY_BATCHES, {
          params: { medicineId, limit: 50 },
        });
        const batches = (
          data?.data?.batches ||
          data?.batches ||
          data?.data ||
          []
        ).filter((b) => b.quantity > 0 && b.status === "ACTIVE");
        results.push({
          medicineId,
          medicineName: item.medicine?.name || item.name || "Unknown",
          batches,
          selectedBatchId: batches.length === 1 ? batches[0].id : "",
          quantity: Math.min(
            item.quantity || 0,
            batches.length > 0 ? batches[0].quantity : 0,
          ),
          maxQuantity: batches.length > 0 ? batches[0].quantity : 0,
        });
      } catch {
        results.push({
          medicineId,
          medicineName: item.medicine?.name || item.name || "Unknown",
          batches: [],
          selectedBatchId: "",
          quantity: 0,
          maxQuantity: 0,
        });
      }
    }
    setReturnSelections(results);
    setLoadingReturnBatches(false);
  };

  const handleProcessReturn = async () => {
    try {
      const supplierId = selectedRow?.supplierId || selectedRow?.supplier?.id;
      const purchaseInvoiceId = selectedRow?.id;

      if (!purchaseInvoiceId) {
        showToast("Select a valid purchase invoice", "error");
        return;
      }

      if (!supplierId) {
        showToast("Supplier information is missing", "error");
        return;
      }

      const payloadItems = returnSelections
        .filter((s) => s.selectedBatchId && s.quantity > 0)
        .map((s) => ({
          batchId: s.selectedBatchId,
          quantity: safeNumber(s.quantity),
          medicineId: s.medicineId,
        }));

      if (payloadItems.length === 0) {
        showToast("Select at least one batch and quantity to return", "error");
        return;
      }

      const reason = "Return";
      if (!reason) {
        showToast("Return reason is required", "error");
        return;
      }

      showToast("Processing return...", "info");
      const payload = {
        purchaseInvoiceId,
        items: payloadItems,
        reason,
        supplierId,
      };

      await api.post(API_ROUTES.PURCHASES_RETURNS, payload);

      showToast("Return Processed Successfully", "success");
      setShowReturnModal(false);
      setReturnSelections([]);
      await refreshData();
    } catch (err) {
      console.error("STATUS:", err.response?.status);
      console.error("DATA:", err.response?.data);
      console.error("PAYLOAD:", {
        purchaseInvoiceId: selectedRow?.id,
        items: returnSelections
          .filter((s) => s.selectedBatchId && s.quantity > 0)
          .map((s) => ({
            batchId: s.selectedBatchId,
            quantity: safeNumber(s.quantity),
            medicineId: s.medicineId,
          })),
        reason: "Return",
        supplierId: selectedRow?.supplierId || selectedRow?.supplier?.id,
      });
      showToast(
        err.response?.data?.message || "Failed to process return",
        "error",
      );
    }
  };

  const finalBranchId =
    selectedBranchId ||
    user?.branchId ||
    (branches.length > 0 ? branches[0].id : "");
  const hasMultipleBranches = branches.length > 1;
  const isFormInvalid =
    !selectedSupplier ||
    (hasMultipleBranches ? !selectedBranchId : !finalBranchId) ||
    !supplierInvNo.trim() ||
    purchaseItems.length === 0 ||
    purchaseItems.some(
      (item) =>
        !item.qty ||
        safeNumber(item.qty) <= 0 ||
        !item.purchasePrice ||
        safeNumber(item.purchasePrice) <= 0 ||
        !item.batchNumber ||
        !item.batchNumber.trim() ||
        !item.expiryDate,
    );

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center" }}>
        <Spinner size={32} />
        <p style={{ marginTop: 16, color: "var(--text-muted)" }}>
          Loading purchase management...
        </p>
      </div>
    );
  }

  return (
    <div className="purchases-container">
      {/* ── Page Header ── */}
      <div className="purchases-header">
        <div>
          <h1
            style={{ fontFamily: "Outfit", fontSize: "28px", fontWeight: 700 }}
          >
            Purchase Management
          </h1>
          <p className="result-meta">
            Supplier invoices, purchase orders, and supplier returns — all in
            one place.
          </p>

          <div className="purchases-tabs">
            {["Invoices", "Orders", "Returns"].map((t) => (
              <button
                key={t}
                className={`p-tab ${activeTab === t.toLowerCase() ? "active" : ""}`}
                onClick={() => setActiveTab(t.toLowerCase())}
              >
                {t === "Invoices"
                  ? "Purchase Invoices"
                  : t === "Orders"
                    ? "Purchase Orders"
                    : "Supplier Returns"}
              </button>
            ))}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="pos-btn teal purchase-create-btn"
            onClick={() => handleOpenDrawer("new-purchase")}
          >
            <div className="btn-glow" />
            <Plus size={18} />
            New Purchase Order
          </button>
          <button
            className="pos-btn accent purchase-create-btn"
            style={{ marginLeft: 12 }}
            onClick={() => setActiveTab("orders")}
          >
            <div className="btn-glow" />
            <Package size={18} />
            Receive Goods
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="purchases-stats">
        {[
          {
            label: "THIS MONTH PURCHASES",
            val:
              "₹" +
              invoices
                .reduce(
                  (sum, inv) =>
                    sum + safeNumber(inv.totalAmount || inv.total || 0),
                  0,
                )
                .toLocaleString(),
            icon: ShoppingCart,
            col: "var(--info)",
          },
          {
            label: "PENDING POs",
            val: orders.filter(
              (o) => o.status === "PENDING" || o.status === "SENT",
            ).length,
            icon: Clock,
            col: "var(--warning)",
          },
          {
            label: "SUPPLIER RETURNS",
            val:
              "₹" +
              returns
                .reduce(
                  (sum, r) => sum + safeNumber(r.refundAmount || r.value || 0),
                  0,
                )
                .toLocaleString(),
            icon: ArrowLeft,
            col: "var(--danger)",
          },
          {
            label: "ACTIVE SUPPLIERS",
            val: suppliers.length,
            icon: Building2,
            col: "var(--primary)",
          },
        ].map((s, i) => (
          <div key={i} className="pos-stat-card">
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

      {/* ── Main Content Area ── */}
      <div className="purchase-table-card">
        {/* Filter Row */}
        <div className="purchase-filters">
          <div className="pos-input-group" style={{ maxWidth: "200px" }}>
            <input
              required
              className="filter-input"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          <select
            className="filter-input"
            value={filters.supplier}
            onChange={(e) =>
              setFilters({ ...filters, supplier: e.target.value })
            }
          >
            <option>All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="filter-input"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option>All Status</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Partially Paid</option>
            <option>Sent</option>
            <option>Confirmed</option>
            <option>Received</option>
            <option>Approved</option>
            <option>Completed</option>
          </select>
          <div className="pos-input-group" style={{ flex: 1 }}>
            <input
              required
              className="filter-input"
              placeholder="Search by ID or Supplier..."
              style={{ width: "100%" }}
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--on-surface-variant)",
            }}
          >
            Loading live data...
          </div>
        ) : (
          activeTab === "invoices" && (
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier Inv #</th>
                  <th>Supplier</th>
                  <th>Medicines</th>
                  <th>Total ₹</th>
                  <th>GST ₹</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => handleOpenDrawer("invoice-detail", inv)}
                  >
                    <td>{inv.date || formatDate(inv.createdAt)}</td>
                    <td style={{ fontWeight: 700 }}>
                      {inv.supplierInvoiceNumber || inv.invoiceNumber || "-"}
                    </td>
                    <td>
                      {inv.supplier?.name || inv.supplierName || inv.supplier}
                    </td>
                    <td>{inv.items?.length || inv.medicines || 0} items</td>
                    <td style={{ fontWeight: 700 }}>
                      ₹{(inv.totalAmount || inv.total || 0).toLocaleString()}
                    </td>
                    <td className="result-meta">₹{inv.gstAmount || 0}</td>
                    <td>
                      <span
                        className={`p-status ${(inv.paymentStatus || inv.status || "PENDING").toLowerCase().replace(/[\s_-]+/g, "")}`}
                      >
                        {inv.paymentStatus || inv.status || "PENDING"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="micro-btn"
                          title="View"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer("invoice-detail", inv);
                          }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="micro-btn"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer("edit-purchase", inv);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="micro-btn"
                          title="Return"
                          style={{ color: "var(--danger)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRow(inv);
                            setShowReturnModal(true);
                            loadReturnBatches(inv);
                          }}
                        >
                          <ArrowLeft size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )
        )}

        {!loading && activeTab === "orders" && (
          <table className="purchase-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total ₹</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((po) => (
                <tr
                  key={po.id}
                  onClick={() => handleOpenDrawer("invoice-detail", po)}
                >
                  <td style={{ fontWeight: 700 }}>
                    {po.supplier?.name || po.supplierName || "-"}
                  </td>
                  <td>{po.date || formatDate(po.createdAt)}</td>
                  <td>{po.items?.length || po.items || 0}</td>
                  <td style={{ fontWeight: 700 }}>
                    ₹{(po.totalAmount || po.total || 0).toLocaleString()}
                  </td>
                  <td>{po.deliveryDate || po.delivery || "-"}</td>
                  <td>
                    <span
                      className={`p-status ${(po.status || "").toLowerCase()}`}
                    >
                      {po.status || "PENDING"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="micro-btn"
                        title="View"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDrawer("invoice-detail", po);
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      {(po.status === "DRAFT" ||
                        po.status === "PENDING" ||
                        po.status === "PENDING_APPROVAL") && (
                        <button
                          className="pos-btn"
                          style={{
                            padding: "4px 10px",
                            fontSize: "11px",
                            backgroundColor: "var(--primary)",
                            color: "white",
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await api.patch(
                                `${API_ROUTES.PURCHASES_ORDERS}/${po.id}/status`,
                                { status: "APPROVED" },
                              );
                              showToast(
                                "Purchase Order approved successfully!",
                                "success",
                              );
                              await refreshData();
                            } catch (err) {
                              console.error(err);
                              showToast(
                                err.response?.data?.error ||
                                  err.message ||
                                  "Failed to approve order",
                                "error",
                              );
                            }
                          }}
                        >
                          <Check size={12} /> Approve
                        </button>
                      )}
                      {(po.status === "APPROVED" ||
                        po.status === "ORDERED" ||
                        po.status === "PARTIALLY_RECEIVED") && (
                        <button
                          className="pos-btn teal"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReceiveModal(po);
                          }}
                        >
                          <Truck size={12} /> Receive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {!loading && activeTab === "returns" && (
          <table className="purchase-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Return #</th>
                <th>Supplier</th>
                <th>Orig Inv</th>
                <th>Items</th>
                <th>Value</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((ret) => (
                <tr
                  key={ret.id}
                  onClick={() => handleOpenDrawer("invoice-detail", ret)}
                >
                  <td>{ret.date || formatDate(ret.createdAt)}</td>
                  <td style={{ fontWeight: 700 }}>
                    {ret.returnNumber || ret.id}
                  </td>
                  <td>
                    {ret.supplier?.name || ret.supplierName || ret.supplier}
                  </td>
                  <td className="result-meta">
                    {ret.originalInvoiceId || ret.origInv}
                  </td>
                  <td>{ret.items?.length || ret.items || 0}</td>
                  <td style={{ fontWeight: 700, color: "var(--danger)" }}>
                    ₹{(ret.refundAmount || ret.value || 0).toLocaleString()}
                  </td>
                  <td>
                    <span
                      className="badge-paid"
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "var(--danger)",
                      }}
                    >
                      {ret.reason}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`p-status ${(ret.status || "").toLowerCase()}`}
                    >
                      {ret.status || "PROCESSED"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="micro-btn"
                      title="View"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDrawer("invoice-detail", ret);
                      }}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReturns.length === 0 && (
                <tr>
                  <td
                    colSpan="9"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    No returns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <div
          style={{
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--overlay-01)",
          }}
        >
          <div className="result-meta">
            Total this period:{" "}
            <b style={{ color: "var(--text)" }}>
              ₹
              {filteredInvoices
                .reduce((s, i) => s + safeNumber(i.totalAmount || 0), 0)
                .toLocaleString()}
            </b>{" "}
            | GST input credit:{" "}
            <b style={{ color: "var(--primary)" }}>
              ₹
              {filteredInvoices
                .reduce((s, i) => s + safeNumber(i.gstAmount || 0), 0)
                .toLocaleString()}
            </b>
          </div>
        </div>
      </div>

      {/* ── Side Drawer: New Purchase ── */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            className="stock-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeDrawer();
              }
            }}
          >
            <motion.div
              className="p-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="p-drawer-header">
                <div>
                  <h2 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                    {drawer === "new-purchase"
                      ? "Create Purchase Order"
                      : drawer === "edit-purchase"
                        ? "Edit Purchase Invoice"
                        : selectedRow?.invoiceNumber ||
                          selectedRow?.poNumber ||
                          selectedRow?.id}
                  </h2>
                  {drawer === "invoice-detail" && (
                    <span
                      className={`p-status ${(selectedRow?.paymentStatus || selectedRow?.status || "PENDING").toLowerCase().replace(/[\s_-]+/g, "")}`}
                    >
                      {selectedRow?.paymentStatus ||
                        selectedRow?.status ||
                        "PENDING"}
                    </span>
                  )}
                </div>
                <button className="micro-btn" onClick={closeDrawer}>
                  <X size={20} />
                </button>
              </div>

              <div className="p-drawer-body">
                {drawer !== "invoice-detail" ? (
                  <>
                    <div className="p-form-card">
                      <span className="p-label">SUPPLIER DETAILS</span>
                      <div className="pos-input-group">
                        <select
                          className="pos-input"
                          style={{ width: "100%" }}
                          value={selectedSupplier?.name || ""}
                          onChange={(e) => {
                            const s = suppliers.find(
                              (s) =>
                                (s.name || s.supplierName) === e.target.value,
                            );
                            setSelectedSupplier(s);
                          }}
                        >
                          <option value="">Select Supplier...</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.name || s.supplierName}>
                              {s.name || s.supplierName}
                            </option>
                          ))}
                        </select>
                      </div>
                      {hasMultipleBranches && (
                        <div
                          className="pos-input-group"
                          style={{ marginTop: "16px" }}
                        >
                          <span className="p-label">BRANCH</span>
                          <select
                            required
                            className="pos-input"
                            style={{ width: "100%" }}
                            value={selectedBranchId}
                            onChange={(e) =>
                              setSelectedBranchId(e.target.value)
                            }
                          >
                            <option value="">Select Branch...</option>
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {selectedSupplier && (
                        <div className="supplier-preview-card">
                          <div className="supplier-preview-name">
                            {selectedSupplier.name}
                          </div>
                          <div className="supplier-preview-meta">
                            {selectedSupplier.terms} | Lead Time:{" "}
                            {selectedSupplier.leadTime}
                          </div>
                        </div>
                      )}
                      <div
                        className="p-form-grid"
                        style={{ marginTop: "16px" }}
                      >
                        <div className="pos-input-group">
                          <label className="p-label">INVOICE DATE</label>
                          <input
                            required
                            className="pos-input"
                            type="date"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                          />
                        </div>
                        <div className="pos-input-group">
                          <label className="p-label">SUPPLIER INV #</label>
                          <input
                            required
                            className="pos-input"
                            placeholder="e.g. CIP-9921"
                            value={supplierInvNo}
                            onChange={(e) => setSupplierInvNo(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-form-card">
                      <span className="p-label">ADD MEDICINES</span>
                      <div className="medicine-toolbar">
                        <div
                          className="medicine-search-wrapper"
                          style={{ position: "relative" }}
                        >
                          <input
                            required
                            className="pos-input medicine-search-input"
                            placeholder="Search medicine to add..."
                            value={medicineSearch}
                            onChange={(e) => setMedicineSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                filteredMedicines.length > 0
                              ) {
                                addMedicine(filteredMedicines[0]);
                              }
                            }}
                          />
                          {loadingMedicines ? (
                            <div
                              className="medicine-suggestions"
                              style={{
                                padding: "12px",
                                color: "rgba(255,255,255,0.5)",
                                fontSize: "12px",
                              }}
                            >
                              Loading inventory...
                            </div>
                          ) : (
                            medicineSearch &&
                            filteredMedicines.length > 0 && (
                              <div className="medicine-suggestions">
                                {filteredMedicines.map((m) => (
                                  <div
                                    key={m.id}
                                    className="medicine-suggestion-item"
                                    onClick={() => addMedicine(m)}
                                  >
                                    <span>{m.name}</span>
                                    <span
                                      style={{
                                        color: "var(--primary)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      ₹{m.purchasePrice}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                        <button
                          className="medicine-tool-btn"
                          title="Scan Barcode"
                        >
                          <ScanLine size={16} />
                          Scan
                        </button>
                        <button
                          className="medicine-tool-btn"
                          title="Add Manually"
                        >
                          <Plus size={16} />
                          Manual
                        </button>
                      </div>

                      <div className="recent-medicines">
                        <span className="recent-medicines-label">Recent</span>
                        <div className="recent-medicines-list">
                          {medicines.slice(0, 4).map((m) => (
                            <button
                              key={m.id}
                              className="recent-medicine-chip"
                              onClick={() => addMedicine(m)}
                            >
                              <Package size={12} />
                              {m.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <table className="p-line-table">
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Batch #</th>
                            <th>Expiry</th>
                            <th>Qty</th>
                            <th>Cost</th>
                            <th style={{ textAlign: "right" }}>Total</th>
                            <th></th>
                          </tr>
                        </thead>
                        {purchaseItems.length === 0 ? (
                          <tbody>
                            <tr>
                              <td
                                colSpan={7}
                                style={{
                                  textAlign: "center",
                                  padding: "24px",
                                  color: "rgba(255,255,255,0.25)",
                                  fontSize: "13px",
                                }}
                              >
                                No medicines added yet. Search and add from
                                above.
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody>
                            {purchaseItems.map((item) => (
                              <tr key={item.id}>
                                <td style={{ fontSize: "12px" }}>
                                  <b>{item.name}</b>
                                  <div className="result-meta">
                                    GST: {item.gstPercentage}%
                                  </div>
                                </td>
                                <td>
                                  <input
                                    required
                                    className="p-cost-input"
                                    style={{ width: "80px" }}
                                    placeholder="Batch..."
                                    value={item.batchNumber || ""}
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,
                                        "batchNumber",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    required
                                    className="p-cost-input"
                                    type="date"
                                    style={{ width: "125px" }}
                                    value={item.expiryDate || ""}
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,
                                        "expiryDate",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    required
                                    className="p-cost-input"
                                    style={{ width: "50px" }}
                                    value={item.qty}
                                    onChange={(e) =>
                                      updateItem(item.id, "qty", e.target.value)
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    required
                                    className="p-cost-input"
                                    style={{ width: "65px" }}
                                    value={item.purchasePrice}
                                    onChange={(e) =>
                                      updateItem(
                                        item.id,
                                        "purchasePrice",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td
                                  style={{
                                    textAlign: "right",
                                    fontWeight: 700,
                                  }}
                                >
                                  ₹{(item.qty * item.purchasePrice).toFixed(2)}
                                </td>
                                <td>
                                  <button
                                    className="micro-btn"
                                    style={{ color: "var(--danger)" }}
                                    onClick={() => removeMedicine(item.id)}
                                  >
                                    <X size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        )}
                      </table>

                      <div className="purchase-summary">
                        <div className="summary-row">
                          <span>Subtotal</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {purchaseItems.map((item) => {
                          const itemGst =
                            (item.qty *
                              item.purchasePrice *
                              item.gstPercentage) /
                            100;
                          return (
                            <div
                              key={item.id}
                              className="summary-row result-meta"
                              style={{ fontSize: "11px" }}
                            >
                              <span>
                                {item.name} (GST {item.gstPercentage}%)
                              </span>
                              <span>₹{itemGst.toFixed(2)}</span>
                            </div>
                          );
                        })}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontFamily: "Outfit",
                            fontSize: "22px",
                            fontWeight: 700,
                            color: "var(--primary)",
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                            paddingTop: "12px",
                            marginTop: "8px",
                            width: "100%",
                          }}
                        >
                          <span>Total</span>
                          <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="detail-view">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">SUPPLIER</span>
                        <span className="detail-value">
                          {selectedRow?.supplier?.name ||
                            selectedRow?.supplier ||
                            "-"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">DATE</span>
                        <span className="detail-value">
                          {selectedRow?.date ||
                            formatDate(selectedRow?.createdAt)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">REF #</span>
                        <span className="detail-value">
                          {selectedRow?.referenceNumber ||
                            selectedRow?.ref ||
                            "-"}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: "32px" }}>
                      <span className="p-label">ITEMS</span>
                      <table className="p-line-table">
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Qty</th>
                            <th>Cost</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedRow?.items || []).map((item, idx) => (
                            <tr key={idx}>
                              <td>
                                {item.medicine?.name ||
                                  item.medicineName ||
                                  item.name ||
                                  "-"}
                              </td>
                              <td>{item.quantity}</td>
                              <td>
                                ₹
                                {safeNumber(
                                  item.purchasePrice ||
                                    item.unitPrice ||
                                    item.price ||
                                    0,
                                ).toFixed(2)}
                              </td>
                              <td style={{ textAlign: "right" }}>
                                ₹
                                {safeNumber(
                                  item.total ||
                                    item.totalAmount ||
                                    item.quantity *
                                      (item.purchasePrice ||
                                        item.unitPrice ||
                                        item.price ||
                                        0) ||
                                    0,
                                ).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          {(!selectedRow?.items ||
                            selectedRow?.items?.length === 0) && (
                            <tr>
                              <td colSpan="4">No item details available.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="detail-summary-card">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span>Subtotal</span>{" "}
                        <span>
                          ₹
                          {safeNumber(
                            selectedRow?.subtotal ||
                              (selectedRow?.totalAmount &&
                              selectedRow?.gstAmount !== undefined
                                ? selectedRow.totalAmount -
                                  selectedRow.gstAmount
                                : selectedRow?.totalAmount ||
                                  selectedRow?.total ||
                                  0),
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span>GST</span>{" "}
                        <span>
                          ₹{safeNumber(selectedRow?.gstAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontWeight: 800,
                          fontSize: "18px",
                          borderTop: "1px solid var(--outline-variant)",
                          paddingTop: "12px",
                          color: "var(--primary)",
                        }}
                      >
                        <span>TOTAL</span>{" "}
                        <span>
                          ₹
                          {safeNumber(
                            selectedRow?.totalAmount || selectedRow?.total || 0,
                          ).toFixed(2)}
                        </span>
                      </div>

                      {selectedRow?.paidAmount !== undefined && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "8px",
                              marginTop: "8px",
                              color: "var(--success)",
                            }}
                          >
                            <span>Paid</span>{" "}
                            <span>
                              ₹
                              {safeNumber(selectedRow?.paidAmount || 0).toFixed(
                                2,
                              )}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontWeight: 800,
                              fontSize: "16px",
                              color: "var(--danger)",
                            }}
                          >
                            <span>Balance Due</span>{" "}
                            <span>
                              ₹
                              {safeNumber(
                                selectedRow?.balanceAmount || 0,
                              ).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {supplierCredit.notes.length > 0 &&
                      selectedRow &&
                      safeNumber(
                        selectedRow.balanceAmount ||
                          selectedRow.totalAmount ||
                          selectedRow.total ||
                          0,
                      ) > 0 && (
                        <div
                          className="detail-summary-card"
                          style={{
                            marginTop: "16px",
                            border: "1px dashed var(--primary)",
                          }}
                        >
                          <h4
                            style={{
                              marginBottom: "12px",
                              color: "var(--primary)",
                            }}
                          >
                            Available Supplier Credit: ₹
                            {supplierCredit.available.toFixed(2)}
                          </h4>
                          <div
                            className="pos-input-group"
                            style={{ marginBottom: "12px" }}
                          >
                            <label>Select Credit Note</label>
                            <select
                              className="pos-input"
                              value={selectedCreditNoteId}
                              onChange={(e) => {
                                setSelectedCreditNoteId(e.target.value);
                                const maxApp = Math.min(
                                  safeNumber(
                                    supplierCredit.notes.find(
                                      (n) => n.id === e.target.value,
                                    )?.remainingAmount || 0,
                                  ),
                                  safeNumber(
                                    selectedRow.balanceAmount ||
                                      selectedRow.totalAmount ||
                                      selectedRow.total ||
                                      0,
                                  ),
                                );
                                setCreditAmountToApply(maxApp);
                              }}
                            >
                              <option value="">-- Select Credit Note --</option>
                              {supplierCredit.notes.map((note) => (
                                <option key={note.id} value={note.id}>
                                  {note.id.slice(-6).toUpperCase()} - Balance: ₹
                                  {safeNumber(note.remainingAmount).toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>
                          {selectedCreditNoteId && (
                            <div
                              className="pos-input-group"
                              style={{ marginBottom: "12px" }}
                            >
                              <label>Amount to Apply</label>
                              <input
                                type="number"
                                className="pos-input"
                                value={creditAmountToApply}
                                max={Math.min(
                                  safeNumber(
                                    supplierCredit.notes.find(
                                      (n) => n.id === selectedCreditNoteId,
                                    )?.remainingAmount || 0,
                                  ),
                                  safeNumber(
                                    selectedRow.balanceAmount ||
                                      selectedRow.totalAmount ||
                                      selectedRow.total ||
                                      0,
                                  ),
                                )}
                                onChange={(e) =>
                                  setCreditAmountToApply(e.target.value)
                                }
                              />
                            </div>
                          )}
                          <button
                            className="pos-btn teal"
                            style={{ width: "100%", marginTop: "8px" }}
                            disabled={
                              applyingCredit ||
                              !selectedCreditNoteId ||
                              creditAmountToApply <= 0
                            }
                            onClick={handleApplyCredit}
                          >
                            {applyingCredit
                              ? "Applying..."
                              : "Apply Credit to Invoice"}
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </div>

              <div className="p-drawer-footer">
                <button
                  className="pos-btn outline"
                  style={{ flex: 1 }}
                  onClick={closeDrawer}
                >
                  Cancel
                </button>
                {drawer === "invoice-detail" ? (
                  <button
                    className="pos-btn teal"
                    style={{ flex: 2 }}
                    onClick={() =>
                      selectedRow && downloadPurchasePDF(selectedRow)
                    }
                  >
                    <Download size={16} /> Download PDF
                  </button>
                ) : (
                  <button
                    className={`pos-btn teal ${saving || isFormInvalid ? "btn-disabled" : ""}`}
                    style={{ flex: 2 }}
                    onClick={handleSavePurchase}
                    disabled={saving || isFormInvalid}
                  >
                    {saving
                      ? "Saving..."
                      : drawer === "edit-purchase"
                        ? "Save Changes"
                        : "Create Purchase Order"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Supplier Return Modal ── */}
      <AnimatePresence>
        {showReturnModal && selectedRow && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "500px" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Process Supplier Return
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowReturnModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <div className="pos-input-group">
                  <label>Original Invoice</label>
                  <input
                    required
                    className="pos-input"
                    value={selectedRow?.invoiceNumber || selectedRow?.id || ""}
                    disabled
                    style={{ width: "100%" }}
                  />
                </div>
                {loadingReturnBatches ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <Loader2 className="spin" size={24} />
                    <p style={{ marginTop: 12, color: "var(--text-muted)" }}>
                      Loading available batches...
                    </p>
                  </div>
                ) : (
                  <div style={{ marginTop: "16px" }}>
                    {returnSelections.length === 0 ? (
                      <div>No items found to return.</div>
                    ) : (
                      returnSelections.map((sel, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "12px",
                            marginBottom: "12px",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            background: "var(--bg-card)",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              marginBottom: "8px",
                              fontSize: "0.9rem",
                            }}
                          >
                            {sel.medicineName}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ flex: 2, minWidth: "140px" }}>
                              <select
                                className="pos-input"
                                style={{ width: "100%", fontSize: "0.8rem" }}
                                value={sel.selectedBatchId}
                                onChange={(e) => {
                                  const batch = sel.batches.find(
                                    (b) => b.id === e.target.value,
                                  );
                                  const newSel = [...returnSelections];
                                  newSel[idx] = {
                                    ...sel,
                                    selectedBatchId: e.target.value,
                                    quantity: batch
                                      ? Math.min(sel.quantity, batch.quantity)
                                      : 0,
                                    maxQuantity: batch ? batch.quantity : 0,
                                  };
                                  setReturnSelections(newSel);
                                }}
                              >
                                <option value="">Select batch</option>
                                {sel.batches.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.batchNumber} (Qty: {b.quantity}, Exp:{" "}
                                    {b.expiryDate
                                      ? new Date(
                                          b.expiryDate,
                                        ).toLocaleDateString()
                                      : "N/A"}
                                    )
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div style={{ flex: 1, minWidth: "80px" }}>
                              <input
                                required
                                className="p-cost-input"
                                type="number"
                                min={0}
                                max={sel.maxQuantity}
                                value={sel.quantity}
                                onChange={(e) => {
                                  const newSel = [...returnSelections];
                                  newSel[idx] = {
                                    ...sel,
                                    quantity: Math.min(
                                      safeNumber(e.target.value) || 0,
                                      sel.maxQuantity,
                                    ),
                                  };
                                  setReturnSelections(newSel);
                                }}
                                style={{ width: "100%" }}
                                placeholder="Qty"
                                disabled={!sel.selectedBatchId}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Max: {sel.maxQuantity}
                            </span>
                          </div>
                          {sel.selectedBatchId && sel.quantity <= 0 && (
                            <div
                              style={{
                                color: "var(--danger)",
                                fontSize: "0.75rem",
                                marginTop: "4px",
                              }}
                            >
                              Enter a quantity to return
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  onClick={() => {
                    setShowReturnModal(false);
                    setReturnSelections([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn teal"
                  style={{
                    background: "var(--danger)",
                    color: "white",
                    border: "none",
                  }}
                  onClick={handleProcessReturn}
                  disabled={loadingReturnBatches}
                >
                  Submit Return
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Receive Order Modal ── */}
      <AnimatePresence>
        {showReceiveModal && selectedRow && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "900px", maxWidth: "95vw" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Confirm Order Receipt
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowReceiveModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <p className="result-meta" style={{ marginBottom: "16px" }}>
                  Please confirm the quantities received for{" "}
                  {selectedRow?.poNumber || selectedRow?.id}.
                </p>

                <div style={{ overflowX: "auto" }}>
                  <table className="p-line-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Ordered Qty</th>
                        <th>Prev Received Qty</th>
                        <th>Pending Qty</th>
                        <th>Receive Qty</th>
                        <th>Batch #</th>
                        <th>Expiry</th>
                        <th>Purchase Price</th>
                        <th>MRP</th>
                        <th style={{ width: 70 }}>Diff Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveItems.map((item, idx) => {
                        const isDiff = differentBatch[idx] || false;
                        const hasPrior = !!(
                          item.batchNumber || item.expiryDate
                        );
                        return (
                          <tr key={idx}>
                            <td>
                              {item.medicine?.name ||
                                item.medicineName ||
                                item.name ||
                                "-"}
                            </td>
                            <td>{item.orderedQuantity}</td>
                            <td>{item.prevReceivedQuantity}</td>
                            <td>{item.pendingQuantity}</td>
                            <td>
                              <input
                                required
                                className="p-cost-input"
                                style={{ width: "60px" }}
                                type="number"
                                min={0}
                                max={item.pendingQuantity}
                                value={item.receivedQuantity}
                                onChange={(e) => {
                                  const newItems = [...receiveItems];
                                  newItems[idx].receivedQuantity =
                                    e.target.value;
                                  setReceiveItems(newItems);
                                }}
                              />
                            </td>
                            <td>
                              <input
                                required
                                className="p-cost-input"
                                style={{
                                  opacity: hasPrior && !isDiff ? 0.6 : 1,
                                }}
                                placeholder="Batch..."
                                value={item.batchNumber || ""}
                                disabled={hasPrior && !isDiff}
                                onChange={(e) => {
                                  const newItems = [...receiveItems];
                                  newItems[idx].batchNumber = e.target.value;
                                  setReceiveItems(newItems);
                                }}
                              />
                            </td>
                            <td>
                              <input
                                required
                                className="p-cost-input"
                                style={{
                                  opacity: hasPrior && !isDiff ? 0.6 : 1,
                                }}
                                type="date"
                                value={item.expiryDate || ""}
                                disabled={hasPrior && !isDiff}
                                onChange={(e) => {
                                  const newItems = [...receiveItems];
                                  newItems[idx].expiryDate = e.target.value;
                                  setReceiveItems(newItems);
                                }}
                              />
                            </td>
                            <td>
                              <input
                                required
                                className="p-cost-input"
                                style={{
                                  width: "80px",
                                  opacity: hasPrior && !isDiff ? 0.6 : 1,
                                }}
                                type="number"
                                step="0.01"
                                value={item.purchasePrice}
                                disabled={hasPrior && !isDiff}
                                onChange={(e) => {
                                  const newItems = [...receiveItems];
                                  newItems[idx].purchasePrice = e.target.value;
                                  setReceiveItems(newItems);
                                }}
                              />
                            </td>
                            <td>
                              <input
                                required
                                className="p-cost-input"
                                style={{
                                  width: "80px",
                                  opacity: hasPrior && !isDiff ? 0.6 : 1,
                                }}
                                type="number"
                                step="0.01"
                                value={item.mrp}
                                disabled={hasPrior && !isDiff}
                                onChange={(e) => {
                                  const newItems = [...receiveItems];
                                  newItems[idx].mrp = e.target.value;
                                  setReceiveItems(newItems);
                                }}
                              />
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {hasPrior ? (
                                <input
                                  type="checkbox"
                                  checked={isDiff}
                                  onChange={() =>
                                    setDifferentBatch((prev) => ({
                                      ...prev,
                                      [idx]: !isDiff,
                                    }))
                                  }
                                  title="Different batch received"
                                />
                              ) : (
                                <span
                                  style={{
                                    color: "var(--text-muted)",
                                    fontSize: 11,
                                  }}
                                >
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {receiveItems.length === 0 && (
                        <tr>
                          <td colSpan="10">No items to receive.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  onClick={() => {
                    setShowReceiveModal(false);
                    setDifferentBatch({});
                  }}
                  disabled={isReceiving}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn teal"
                  onClick={handleReceiveOrder}
                  disabled={isReceiving}
                >
                  {isReceiving ? "Receiving..." : "Confirm Receipt"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
