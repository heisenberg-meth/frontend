import { useMemo, useEffect, useReducer, useCallback } from "react";
import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";
import { useAuth } from "../hooks/useAuth";
import {
  Calendar,
  FileText,
  Receipt,
  ArrowLeft,
  Download,
  TrendingUp,
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  normalizeArrayResponse,
  getMedicineName,
} from "../utils/apiNormalizer";
import { escapeHtml } from "../utils/escapeHtml";
import "../styles/SalesManagement.css";
import { safeNumber } from "../utils/number.js";
import {
  formatInvoiceTime,
  formatCurrency,
  formatInvoiceDate,
} from "../utils/dateTime";
import {
  SalesManagementSection1,
  SalesManagementSection2,
  SalesManagementSection3,
  SalesManagementSection4,
  SalesManagementSection5,
  SalesManagementSection6,
  SalesManagementSection7,
} from "./Sales/Sales.jsx";

export default function SalesManagement({ showToast, storeProfile }) {
  const { user } = useAuth();
  const [salesState, dispatchSales] = useReducer(
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
    null,
    () => {
      const start = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const end = format(new Date(), "yyyy-MM-dd");
      return {
        showInvoiceModal: false,
        showGeneratedInvoiceModal: false,
        generatedInvoice: null,
        activeTab: "daily",
        currentDate: new Date(),
        hoveredBar: null,
        selectedSale: null,
        showDetailModal: false,
        showWhatsAppModal: false,
        showReturnModal: false,
        showDateRangeModal: false,
        sales: [],
        returns: [],
        hourlyData: [],
        loading: true,
        error: null,
        returnQuantities: {},
        returnChecked: {},
        returnModalReason: "Patient Request",
        dateRange: {
          start,
          end,
        },
        tempDateRange: {
          start,
          end,
        },
        filters: {
          search: "",
          payment: "All Payment Modes",
          status: "All Status",
        },
      };
    },
  );
  const {
    showInvoiceModal,
    showGeneratedInvoiceModal,
    generatedInvoice,
    activeTab,
    currentDate,
    hoveredBar,
    selectedSale,
    showDetailModal,
    showWhatsAppModal,
    showReturnModal,
    showDateRangeModal,
    sales,
    returns,
    hourlyData,
    loading,
    error,
    returnQuantities,
    returnChecked,
    returnModalReason,
    dateRange,
    tempDateRange,
    filters,
  } = salesState;
  const setShowInvoiceModal = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "showInvoiceModal",
        value: val,
      }),
    [],
  );
  const setShowGeneratedInvoiceModal = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "showGeneratedInvoiceModal",
        value: val,
      }),
    [],
  );
  const setGeneratedInvoice = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "generatedInvoice",
        value: val,
      }),
    [],
  );
  const setActiveTab = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "activeTab",
        value: val,
      }),
    [],
  );
  const setCurrentDate = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "currentDate",
        value: val,
      }),
    [],
  );
  const setHoveredBar = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "hoveredBar",
        value: val,
      }),
    [],
  );
  const setSelectedSale = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "selectedSale",
        value: val,
      }),
    [],
  );
  const setShowDetailModal = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "showDetailModal",
        value: val,
      }),
    [],
  );
  const setShowWhatsAppModal = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "showWhatsAppModal",
        value: val,
      }),
    [],
  );
  const setShowReturnModal = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "showReturnModal",
        value: val,
      }),
    [],
  );
  const setShowDateRangeModal = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "showDateRangeModal",
        value: val,
      }),
    [],
  );
  const setSales = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "sales",
        value: val,
      }),
    [],
  );
  const setReturns = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "returns",
        value: val,
      }),
    [],
  );
  const setHourlyData = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "hourlyData",
        value: val,
      }),
    [],
  );
  const setLoading = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "loading",
        value: val,
      }),
    [],
  );
  const setError = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "error",
        value: val,
      }),
    [],
  );
  const setReturnQuantities = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "returnQuantities",
        value: val,
      }),
    [],
  );
  const setReturnChecked = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "returnChecked",
        value: val,
      }),
    [],
  );
  const setReturnModalReason = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "returnModalReason",
        value: val,
      }),
    [],
  );
  const setDateRange = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "dateRange",
        value: val,
      }),
    [],
  );
  const setTempDateRange = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "tempDateRange",
        value: val,
      }),
    [],
  );
  const setFilters = useCallback(
    (val) =>
      dispatchSales({
        type: "SET_FIELD",
        field: "filters",
        value: val,
      }),
    [],
  );
  const refreshSalesData = async () => {
    try {
      setError(null);
      const [salesRes, returnsRes, trendsRes] = await Promise.all([
        api.get(API_ROUTES.SALES, {
          params: {
            startDate: dateRange.start,
            endDate: dateRange.end,
          },
        }),
        api.get(API_ROUTES.BILLING_RETURNS),
        api.get(API_ROUTES.SALES_HOURLY, {
          params: {
            startDate: dateRange.start,
            endDate: dateRange.end,
          },
        }),
      ]);
      const salesData = normalizeArrayResponse(salesRes);
      const returnsData = normalizeArrayResponse(returnsRes);
      const hourly = normalizeArrayResponse(trendsRes);
      setSales(Array.isArray(salesData) ? salesData : []);
      setReturns(Array.isArray(returnsData) ? returnsData : []);
      setHourlyData(Array.isArray(hourly) ? hourly : []);
    } catch (error) {
      console.error(error);
      setError("Failed to fetch sales data");
      showToast("Failed to fetch sales data", "error");
    }
  };
  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);
        const [salesRes, returnsRes, trendsRes] = await Promise.all([
          api.get(API_ROUTES.SALES, {
            params: {
              startDate: dateRange.start,
              endDate: dateRange.end,
            },
          }),
          api.get(API_ROUTES.BILLING_RETURNS),
          api.get(API_ROUTES.SALES_HOURLY, {
            params: {
              startDate: dateRange.start,
              endDate: dateRange.end,
            },
          }),
        ]);
        if (!mounted) return;
        const salesData = normalizeArrayResponse(salesRes);
        const returnsData = normalizeArrayResponse(returnsRes);
        const hourly = normalizeArrayResponse(trendsRes);
        setSales(Array.isArray(salesData) ? salesData : []);
        setReturns(Array.isArray(returnsData) ? returnsData : []);
        setHourlyData(Array.isArray(hourly) ? hourly : []);
      } catch (error) {
        console.error(error);
        if (mounted) {
          setError("Failed to fetch sales data");
          showToast("Failed to fetch sales data", "error");
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
  }, [
    dateRange,
    setError,
    setHourlyData,
    setLoading,
    setReturns,
    setSales,
    showToast,
  ]);

  /* ── Filter Logic (memoized) ── */
  const filteredSales = useMemo(
    () =>
      sales.filter((sale) => {
        const patientName =
          sale.patient?.fullName ||
          sale.patientName ||
          sale.customerName ||
          "Walk-in";
        const matchesSearch =
          (sale.invoiceNumber || sale.id || "")
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          patientName.toLowerCase().includes(filters.search.toLowerCase());
        const matchesPayment =
          filters.payment === "All Payment Modes" ||
          (sale.paymentMode || sale.payment) === filters.payment;

        // Extract yyyy-MM-dd part of the sale date safely
        const saleDateOnly = new Date(
          formatInvoiceDate(sale.createdAt || sale.date),
        );
        const matchesDate =
          (!dateRange.start || saleDateOnly >= new Date(dateRange.start)) &&
          (!dateRange.end || saleDateOnly <= new Date(dateRange.end));
        return matchesSearch && matchesPayment && matchesDate;
      }),
    [sales, filters, dateRange],
  );
  const dailySales = useMemo(() => {
    if (dateRange.start || dateRange.end) {
      return filteredSales;
    }
    return filteredSales.filter((sale) => {
      const formattedTarget = format(currentDate, "yyyy-MM-dd");
      const saleDateOnly = formatInvoiceDate(sale.createdAt || sale.date);
      return saleDateOnly === formattedTarget;
    });
  }, [filteredSales, currentDate, dateRange]);

  // Always shows only today's invoices, independent of any date-range filter
  const todaysSales = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return sales.filter((sale) => {
      const saleDateOnly = formatInvoiceDate(sale.createdAt || sale.date);
      return saleDateOnly === todayStr;
    });
  }, [sales]);
  const filteredReturns = useMemo(
    () =>
      returns.filter((ret) => {
        const patientName =
          ret.patient?.fullName ||
          ret.patientName ||
          ret.customerName ||
          "Walk-in";
        const matchesSearch =
          (ret.returnNumber || ret.id || "")
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          patientName.toLowerCase().includes(filters.search.toLowerCase());
        const matchesStatus =
          filters.status === "All Status" ||
          (ret.status || "").toUpperCase() === filters.status;
        const returnDateOnly = new Date(
          formatInvoiceDate(ret.createdAt || ret.date),
        );
        const matchesDate =
          (!dateRange.start || returnDateOnly >= new Date(dateRange.start)) &&
          (!dateRange.end || returnDateOnly <= new Date(dateRange.end));
        return matchesSearch && matchesStatus && matchesDate;
      }),
    [returns, filters, dateRange],
  );
  const handlePrevDate = () => setCurrentDate((prev) => subDays(prev, 1));
  const handleNextDate = () => setCurrentDate((prev) => addDays(prev, 1));
  const fetchInvoiceDetail = async (invoiceId) => {
    try {
      setLoading(true);
      const res = await api.get(`${API_ROUTES.SALES}/${invoiceId}`);
      if (res.data && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch full invoice details", "error");
      return null;
    } finally {
      setLoading(false);
    }
  };
  const handleOpenDetail = async (sale) => {
    const fullSale = await fetchInvoiceDetail(sale.id);
    if (fullSale) {
      setSelectedSale(fullSale);
      setShowDetailModal(true);
    }
  };
  const handleWhatsApp = async (sale) => {
    const fullSale = await fetchInvoiceDetail(sale.id);
    if (fullSale) {
      setSelectedSale(fullSale);
      setShowWhatsAppModal(true);
    }
  };
  const handleReturn = async (sale) => {
    const fullSale = await fetchInvoiceDetail(sale.id);
    if (fullSale) {
      setSelectedSale(fullSale);
      setReturnQuantities({});
      setReturnChecked({});
      setReturnModalReason("Patient Request");
      setShowReturnModal(true);
    }
  };
  const processReturnApi = async () => {
    try {
      if (!selectedSale) return;
      setLoading(true);
      const reasonText = returnModalReason || "Patient Request";

      // Map frontend reason labels to backend enum values
      const reasonMap = {
        "Patient Request": "CUSTOMER_RETURN",
        "Expired Medicine": "EXPIRED_RETURN",
        "Wrong Medicine": "BILLING_CORRECTION",
        "Damaged Packaging": "DAMAGED_RETURN",
      };
      const backendReason = reasonMap[reasonText] || "CUSTOMER_RETURN";

      // Aggregate all checked items into a single items array
      const returnItems = [];
      (selectedSale.items || []).forEach((saleItem, idx) => {
        const qty = returnQuantities[idx] ?? saleItem.qty ?? saleItem.quantity;
        const isChecked = returnChecked[idx] ?? true;
        if (isChecked && qty > 0) {
          returnItems.push({
            invoiceItemId: saleItem.id,
            quantity: qty,
          });
        }
      });
      if (returnItems.length === 0) {
        showToast("Please select at least one item to return", "warning");
        setLoading(false);
        return;
      }

      // Single bulk POST matching backend createReturnSchema
      await api.post(API_ROUTES.BILLING_RETURNS, {
        invoiceId: selectedSale.invoiceId || selectedSale.id,
        saleId: selectedSale.id,
        reason: backendReason,
        items: returnItems,
      });
      showToast("Return processed successfully", "success");
      setShowReturnModal(false);
      await refreshSalesData();
    } catch (error) {
      console.error("Failed to process return:", error);
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to process return";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };
  const handlePrintBill = async (sale) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(
      "<html><body><h2>Loading Invoice...</h2></body></html>",
    );
    const fullSale = await fetchInvoiceDetail(sale.id);
    if (!fullSale) {
      printWindow.close();
      return;
    }
    const itemsHtml = (fullSale.items || [])
      .map(
        (it) => `<tr>
            <td>${escapeHtml(getMedicineName(it))}</td>
            <td>${escapeHtml(String(it.quantity || it.qty || 1))}</td>
            <td>₹${safeNumber(it.unitPrice || it.price || 0).toFixed(2)}</td>
            <td>₹${safeNumber((it.quantity || it.qty || 1) * (it.unitPrice || it.price || 0)).toFixed(2)}</td>
          </tr>`,
      )
      .join("");
    const shopName = storeProfile?.shopName || "Viyan MedAssist";
    const address = storeProfile?.address || "";
    const phone = storeProfile?.phone || "";
    const email = storeProfile?.email || "";
    const gstin = storeProfile?.gstin || "";
    const invoiceNum = fullSale.invoiceNumber || fullSale.id;
    const patientName =
      fullSale.patient?.name ||
      fullSale.patient?.fullName ||
      fullSale.patientName ||
      fullSale.customerName ||
      "Walk-in";
    const dateStr =
      fullSale.date || fullSale.createdAt
        ? format(new Date(fullSale.date || fullSale.createdAt), "dd MMM yyyy")
        : "";
    const timeStr = formatInvoiceTime(fullSale.createdAt || fullSale.date);
    const html = `
      <html>
        <head>
          <title>${escapeHtml(invoiceNum)}</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h2 { margin-bottom: 5px; }
            p { margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .total { margin-top: 20px; font-size: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>${escapeHtml(shopName)}</h2>
          ${address ? `<p>${escapeHtml(address)}</p>` : ""}
          <p>${phone ? `<b>Phone:</b> ${escapeHtml(phone)}` : ""} ${email ? `| <b>Email:</b> ${escapeHtml(email)}` : ""}</p>
          ${gstin ? `<p><b>GSTIN:</b> ${escapeHtml(gstin)}</p>` : ""}
          <hr style="margin: 20px 0;"/>
          
          <h3 style="margin-bottom:10px;">INVOICE</h3>
          <p><b>Invoice No:</b> ${escapeHtml(invoiceNum)}</p>
          <p><b>Date:</b> ${escapeHtml(dateStr)} ${escapeHtml(timeStr)}</p>
          <p><b>Patient:</b> ${escapeHtml(patientName)}</p>
          <p><b>Payment:</b> ${escapeHtml(fullSale.paymentMode || fullSale.payment || "Unknown Payment Method")}</p>
          <table>
            <thead><tr><th>Medicine</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="total">Total Amount: ₹${safeNumber(fullSale.totalAmount || fullSale.total || 0).toFixed(2)}</div>
        </body>
      </html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales");
      worksheet.columns = [
        {
          header: "Invoice No",
          key: "Invoice No",
          width: 18,
        },
        {
          header: "Date",
          key: "Date",
          width: 12,
        },
        {
          header: "Time",
          key: "Time",
          width: 10,
        },
        {
          header: "Patient Name",
          key: "Patient Name",
          width: 20,
        },
        {
          header: "Phone",
          key: "Phone",
          width: 15,
        },
        {
          header: "Medicine Names",
          key: "Medicine Names",
          width: 35,
        },
        {
          header: "Discount",
          key: "Discount",
          width: 10,
        },
        {
          header: "GST",
          key: "GST",
          width: 10,
        },
        {
          header: "Total",
          key: "Total",
          width: 12,
        },
        {
          header: "Payment Type",
          key: "Payment Type",
          width: 15,
        },
        {
          header: "Payment Status",
          key: "Payment Status",
          width: 15,
        },
        {
          header: "Invoice Status",
          key: "Invoice Status",
          width: 15,
        },
        {
          header: "Returned Amount",
          key: "Returned Amount",
          width: 15,
        },
        {
          header: "Return Count",
          key: "Return Count",
          width: 12,
        },
        {
          header: "Created By",
          key: "Created By",
          width: 15,
        },
      ];
      const exportData = filteredSales.map((sale) => {
        if (
          !sale.invoiceNumber ||
          !sale.createdAt ||
          !sale.paymentMode ||
          !sale.items
        ) {
          console.warn("Export Validation Warning: Incomplete Record", sale);
        }
        return {
          "Invoice No": sale.invoiceNumber || sale.id || "DATA MISSING",
          Date: formatInvoiceDate(sale.createdAt || sale.date),
          Time: formatInvoiceTime(sale.createdAt || sale.date),
          "Patient Name":
            sale.patient?.fullName ||
            sale.patient?.name ||
            sale.patientName ||
            sale.customerName ||
            "Walk-in Customer",
          Phone: sale.patient?.phone || sale.phone || sale.patientPhone || "",
          "Medicine Names": (sale.items || [])
            .map(
              (item) =>
                `${getMedicineName(item)} x${item.quantity || item.qty || 1}`,
            )
            .join(", "),
          Discount: sale.discountAmount || sale.discount || sale.disc || 0,
          GST: sale.taxAmount || sale.gstAmount || sale.gst || 0,
          Total: sale.totalAmount || sale.total || 0,
          "Payment Type":
            sale.paymentMode || sale.paymentMethod || sale.payment || "UNKNOWN",
          "Payment Status": sale.paymentStatus || "UNKNOWN",
          "Invoice Status": sale.invoiceStatus || sale.status || "UNKNOWN",
          "Returned Amount": sale.returnedAmount || 0,
          "Return Count": sale.returnCount || 0,
          "Created By": sale.createdBy?.name || sale.user?.name || "",
        };
      });
      worksheet.addRows(exportData);
      const metadataSheet = workbook.addWorksheet("Metadata");
      metadataSheet.columns = [
        {
          header: "Property",
          key: "Property",
          width: 20,
        },
        {
          header: "Value",
          key: "Value",
          width: 30,
        },
      ];
      const totalRevenue = filteredSales.reduce(
        (sum, sale) => sum + (sale.totalAmount || sale.total || 0),
        0,
      );
      metadataSheet.addRows([
        {
          Property: "Generated On",
          Value: `${format(new Date(), "dd MMM yyyy")} ${format(new Date(), "hh:mm a")}`,
        },
        {
          Property: "Generated By",
          Value: user?.name || "Admin",
        },
        {
          Property: "Store",
          Value: "Viyan MedAssist",
        },
        {
          Property: "Total Records",
          Value: filteredSales.length,
        },
        {
          Property: "Total Revenue",
          Value: `₹${totalRevenue.toFixed(2)}`,
        },
      ]);
      const buffer = await workbook.xlsx.writeBuffer();
      const data = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(data, `sales-report-${Date.now()}.xlsx`);
      showToast("Sales exported successfully", "success");
    } catch (error) {
      console.error("Failed to export sales", error);
      showToast("Export failed", "error");
    }
  };
  const sendWhatsApp = (sale) => {
    const fullSale = selectedSale || sale;
    const phone =
      fullSale.phone ||
      fullSale.patientPhone ||
      fullSale.patient?.phone ||
      "919840012345";
    const patientName =
      fullSale.patient?.name ||
      fullSale.patient?.fullName ||
      fullSale.patientName ||
      "Customer";
    let itemsText = (fullSale.items || [])
      .map((it) => `• ${getMedicineName(it)} x${it.qty || it.quantity || 1}`)
      .join("%0A");
    const text = `Hello ${patientName},%0A%0AInvoice: ${fullSale.invoiceNumber || fullSale.id}%0AAmount: ₹${fullSale.totalAmount || fullSale.total}%0APayment: ${fullSale.paymentMode || fullSale.payment || "Unknown Payment Method"}%0A%0AMedicines:%0A${itemsText}%0A%0AThank you for choosing Viyan MedAssist.`;
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
    setShowWhatsAppModal(false);
    showToast("WhatsApp opened", "success");
  };
  const downloadInvoicePDF = async (sale) => {
    const fullSale = await fetchInvoiceDetail(sale.id);
    if (!fullSale) return;
    const doc = new jsPDF();

    // Store Profile
    const shopName = storeProfile?.shopName || "Viyan MedAssist";
    const address = storeProfile?.address || "";
    const phone = storeProfile?.phone || "";
    const email = storeProfile?.email || "";
    const gstin = storeProfile?.gstin || "";
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

    // Invoice Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const invoiceNum = fullSale.invoiceNumber || fullSale.id;
    const patientName =
      fullSale.patient?.name ||
      fullSale.patient?.fullName ||
      fullSale.patientName ||
      fullSale.customerName ||
      "Walk-in";
    const dateStr =
      fullSale.date || fullSale.createdAt
        ? format(new Date(fullSale.date || fullSale.createdAt), "dd MMM yyyy")
        : "";
    const timeStr = formatInvoiceTime(fullSale.createdAt || fullSale.date);
    doc.text(`Invoice No: ${invoiceNum}`, 14, y);
    doc.text(`Date: ${dateStr} ${timeStr}`, 120, y);
    y += 8;
    doc.text(`Patient: ${patientName}`, 14, y);
    doc.text(
      `Payment: ${fullSale.paymentMode || fullSale.payment || "Unknown Payment Method"}`,
      120,
      y,
    );
    y += 12;

    // Table
    autoTable(doc, {
      startY: y,
      head: [["Medicine", "Qty", "Unit Price", "Total"]],
      body: (fullSale.items || []).map((it) => [
        getMedicineName(it),
        String(it.quantity || it.qty || 1),
        `Rs. ${safeNumber(it.unitPrice || it.price || 0).toFixed(2)}`,
        `Rs. ${safeNumber((it.quantity || it.qty || 1) * (it.unitPrice || it.price || 0)).toFixed(2)}`,
      ]),
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: {
        top: 10,
        left: 14,
        right: 14,
      },
    });
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const totalAmount = fullSale.totalAmount || fullSale.total || 0;
    doc.text(
      `Total Amount: Rs. ${safeNumber(totalAmount).toFixed(2)}`,
      140,
      finalY,
    );
    doc.save(`Invoice_${invoiceNum}.pdf`);
    showToast("PDF downloaded", "success");
  };
  return (
    <div className="sales-container">
      {/* ── Page Header ── */}
      <div className="purchases-header">
        <div>
          <h1
            style={{
              fontFamily: "Outfit",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            Sales Management
          </h1>
          <p className="result-meta">
            Daily records, customer bills, and return processing.
          </p>

          <div className="purchases-tabs">
            {["Daily", "Bills", "Returns"].map((t) => (
              <button
                key={t}
                className={`p-tab ${activeTab === t.toLowerCase() ? "active" : ""}`}
                onClick={() => setActiveTab(t.toLowerCase())}
              >
                {t === "Daily"
                  ? "Daily Sales"
                  : t === "Bills"
                    ? "Customer Bills"
                    : "Sales Returns"}
              </button>
            ))}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="pos-btn outline"
            onClick={() => {
              setTempDateRange(dateRange);
              setShowDateRangeModal(true);
            }}
          >
            <Calendar size={16} /> Date Range
          </button>
          <button className="pos-btn outline" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
          <button
            className="pos-btn teal"
            onClick={() => setShowInvoiceModal(true)}
          >
            <Receipt size={18} /> Generate Invoice
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="purchases-stats">
        {[
          {
            label: "TODAY'S SALES",
            val:
              "₹" +
              formatCurrency(
                todaysSales.reduce(
                  (sum, s) => sum + (s.totalAmount || s.total || 0),
                  0,
                ),
              ),
            sub: `${todaysSales.length} bill${todaysSales.length !== 1 ? "s" : ""}`,
            icon: TrendingUp,
            col: "var(--primary)",
          },
          {
            label: "SELECTED RANGE",
            val:
              "₹" +
              formatCurrency(
                filteredSales.reduce(
                  (sum, s) => sum + (s.totalAmount || s.total || 0),
                  0,
                ),
              ),
            sub: `${filteredSales.length} bill${filteredSales.length !== 1 ? "s" : ""}`,
            icon: Calendar,
            col: "var(--info)",
          },
          {
            label: "TOTAL BILLS",
            val: filteredSales.length,
            sub: `in selected range`,
            icon: FileText,
            col: "var(--info)",
          },
          {
            label: "RETURNS",
            val:
              "₹" +
              formatCurrency(
                filteredReturns.reduce(
                  (sum, r) =>
                    sum +
                    (r.refundAmount || r.totalReturnAmount || r.value || 0),
                  0,
                ),
              ),
            sub: `${filteredReturns.length} return${filteredReturns.length !== 1 ? "s" : ""}`,
            icon: ArrowLeft,
            col: "var(--danger)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="pos-stat-card"
            style={{
              cursor: "default",
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
            {s.sub && (
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "4px",
                }}
              >
                {s.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Active Filter Banner ── */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--surface)",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid var(--outline-variant)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
          }}
        >
          Showing Records:{" "}
          <strong
            style={{
              color: "var(--text)",
            }}
          >
            {dateRange.start
              ? format(new Date(dateRange.start), "dd MMM yyyy")
              : "All Time"}
          </strong>{" "}
          →{" "}
          <strong
            style={{
              color: "var(--text)",
            }}
          >
            {dateRange.end
              ? format(new Date(dateRange.end), "dd MMM yyyy")
              : "All Time"}
          </strong>
        </div>
        {(dateRange.start || dateRange.end) && (
          <button
            className="pos-btn outline"
            style={{
              padding: "4px 12px",
              fontSize: "12px",
            }}
            onClick={() => {
              setDateRange({
                start: "",
                end: "",
              });
              setTempDateRange({
                start: "",
                end: "",
              });
            }}
          >
            Reset Filter
          </button>
        )}
      </div>

      <SalesManagementSection1
        loading={loading}
        dateRange={dateRange}
        error={error}
        activeTab={activeTab}
        handlePrevDate={handlePrevDate}
        currentDate={currentDate}
        handleNextDate={handleNextDate}
        filteredSales={filteredSales}
        dailySales={dailySales}
        handleOpenDetail={handleOpenDetail}
        hourlyData={hourlyData}
        setHoveredBar={setHoveredBar}
        hoveredBar={hoveredBar}
      />

      <SalesManagementSection2
        loading={loading}
        activeTab={activeTab}
        setFilters={setFilters}
        filters={filters}
        filteredSales={filteredSales}
        dateRange={dateRange}
      />

      <SalesManagementSection3
        loading={loading}
        activeTab={activeTab}
        filteredReturns={filteredReturns}
      />
      {/* ── Detail Modal ── */}
      <SalesManagementSection4
        showDetailModal={showDetailModal}
        setShowDetailModal={setShowDetailModal}
        downloadInvoicePDF={downloadInvoicePDF}
        selectedSale={selectedSale}
        handleReturn={handleReturn}
        handleWhatsApp={handleWhatsApp}
        handlePrintBill={handlePrintBill}
      />

      {/* ── WhatsApp Integration Modal ── */}
      <SalesManagementSection5
        showWhatsAppModal={showWhatsAppModal}
        setShowWhatsAppModal={setShowWhatsAppModal}
        sendWhatsApp={sendWhatsApp}
        selectedSale={selectedSale}
      />

      {/* ── Return Processing Modal ── */}
      <SalesManagementSection6
        showReturnModal={showReturnModal}
        selectedSale={selectedSale}
        setShowReturnModal={setShowReturnModal}
        returnChecked={returnChecked}
        setReturnChecked={setReturnChecked}
        returnQuantities={returnQuantities}
        setReturnQuantities={setReturnQuantities}
        returnModalReason={returnModalReason}
        setReturnModalReason={setReturnModalReason}
        processReturnApi={processReturnApi}
      />
      {/* ── Date Range Modal ── */}
      <SalesManagementSection7
        showDateRangeModal={showDateRangeModal}
        setShowDateRangeModal={setShowDateRangeModal}
        tempDateRange={tempDateRange}
        setTempDateRange={setTempDateRange}
        setDateRange={setDateRange}
        showToast={showToast}
        showInvoiceModal={showInvoiceModal}
        setShowInvoiceModal={setShowInvoiceModal}
        refreshSalesData={refreshSalesData}
        user={user}
        storeProfile={storeProfile}
        generatedInvoice={generatedInvoice}
        setGeneratedInvoice={setGeneratedInvoice}
        showGeneratedInvoiceModal={showGeneratedInvoiceModal}
        setShowGeneratedInvoiceModal={setShowGeneratedInvoiceModal}
      />
    </div>
  );
}
