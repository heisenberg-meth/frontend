import { useState, useMemo, useEffect } from "react";
import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";
import { useAuth } from "../hooks/useAuth";
import InvoiceModal from "./invoice/InvoiceModal";
import InvoiceGeneratedModal from "./invoice/InvoiceGeneratedModal";
import {
  Calendar,
  FileText,
  Receipt,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  MessageCircle,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Smartphone,
  Banknote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
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

export default function SalesManagement({ showToast, storeProfile }) {
  const { user } = useAuth();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showGeneratedInvoiceModal, setShowGeneratedInvoiceModal] =
    useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState("daily");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredBar, setHoveredBar] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [sales, setSales] = useState([]);
  const [returns, setReturns] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnChecked, setReturnChecked] = useState({});
  const [returnModalReason, setReturnModalReason] = useState("Patient Request");
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  const [tempDateRange, setTempDateRange] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });

  const [filters, setFilters] = useState({
    search: "",
    payment: "All Payment Modes",
    status: "All Status",
  });

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
        api.get(API_ROUTES.SALES_HOURLY),
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
          api.get(API_ROUTES.SALES_HOURLY),
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
        setError("Failed to fetch sales data");

        if (mounted) {
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
  }, [dateRange, showToast]);

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
        (it) =>
          `<tr>
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
        { header: "Invoice No", key: "Invoice No", width: 18 },
        { header: "Date", key: "Date", width: 12 },
        { header: "Time", key: "Time", width: 10 },
        { header: "Patient Name", key: "Patient Name", width: 20 },
        { header: "Phone", key: "Phone", width: 15 },
        { header: "Medicine Names", key: "Medicine Names", width: 35 },
        { header: "Discount", key: "Discount", width: 10 },
        { header: "GST", key: "GST", width: 10 },
        { header: "Total", key: "Total", width: 12 },
        { header: "Payment Type", key: "Payment Type", width: 15 },
        { header: "Payment Status", key: "Payment Status", width: 15 },
        { header: "Invoice Status", key: "Invoice Status", width: 15 },
        { header: "Returned Amount", key: "Returned Amount", width: 15 },
        { header: "Return Count", key: "Return Count", width: 12 },
        { header: "Created By", key: "Created By", width: 15 },
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
        { header: "Property", key: "Property", width: 20 },
        { header: "Value", key: "Value", width: 30 },
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
        { Property: "Generated By", Value: user?.name || "Admin" },
        { Property: "Store", Value: "Viyan MedAssist" },
        { Property: "Total Records", Value: filteredSales.length },
        { Property: "Total Revenue", Value: `₹${totalRevenue.toFixed(2)}` },
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
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 10, left: 14, right: 14 },
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
            style={{ fontFamily: "Outfit", fontSize: "28px", fontWeight: 700 }}
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
        ].map((s, i) => (
          <div key={s.label} className="pos-stat-card" style={{ cursor: "default" }}>
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
        <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Showing Records:{" "}
          <strong style={{ color: "var(--text)" }}>
            {dateRange.start
              ? format(new Date(dateRange.start), "dd MMM yyyy")
              : "All Time"}
          </strong>{" "}
          →{" "}
          <strong style={{ color: "var(--text)" }}>
            {dateRange.end
              ? format(new Date(dateRange.end), "dd MMM yyyy")
              : "All Time"}
          </strong>
        </div>
        {(dateRange.start || dateRange.end) && (
          <button
            className="pos-btn outline"
            style={{ padding: "4px 12px", fontSize: "12px" }}
            onClick={() => {
              setDateRange({ start: "", end: "" });
              setTempDateRange({ start: "", end: "" });
            }}
          >
            Reset Filter
          </button>
        )}
      </div>

      {loading ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--on-surface-variant)",
          }}
        >
          {dateRange.start || dateRange.end
            ? "Applying Date Filter..."
            : "Loading live data..."}
        </div>
      ) : error ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      ) : (
        activeTab === "daily" && (
          <>
            {!dateRange.start && !dateRange.end && (
              <div className="date-navigator">
                <button className="micro-btn" onClick={handlePrevDate}>
                  <ChevronLeft size={18} />
                </button>
                <span className="date-display">
                  {format(currentDate, "dd MMM yyyy")}
                </span>
                <button className="micro-btn" onClick={handleNextDate}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            <div className="sales-summary-bar">
              <div className="summary-stats-left">
                <span>
                  Total Bills: <b>{filteredSales.length}</b>
                </span>
                <span>
                  Revenue:{" "}
                  <b>
                    ₹
                    {formatCurrency(
                      filteredSales.reduce(
                        (sum, s) => sum + (s.totalAmount || s.total || 0),
                        0,
                      ),
                    )}
                  </b>
                </span>
              </div>
            </div>

            <div className="sales-table-card">
              <table className="purchase-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Bill #</th>
                    <th>Patient</th>
                    <th>Medicines</th>
                    <th>Disc</th>
                    <th>GST</th>
                    <th>Total</th>
                    <th>Payment Type</th>
                    <th>Payment Status</th>
                    <th>Invoice Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        {dateRange.start || dateRange.end
                          ? `No sales found between ${format(new Date(dateRange.start), "dd MMM yyyy")} and ${format(new Date(dateRange.end), "dd MMM yyyy")}`
                          : "No sales found for this date"}
                      </td>
                    </tr>
                  ) : (
                    dailySales.map((sale) => (
                      <tr
                        key={sale.id}
                        onClick={() => handleOpenDetail(sale)}
                        style={{ cursor: "pointer" }}
                        className="table-row-hover"
                      >
                        <td className="result-meta">
                          {formatInvoiceTime(sale.createdAt || sale.date) ||
                            "--"}
                        </td>
                        <td
                          style={{ fontWeight: 700, color: "var(--primary)" }}
                        >
                          {sale.invoiceNumber || sale.id}
                        </td>
                        <td>
                          <div>
                            {sale.patient?.fullName ||
                              sale.patient?.name ||
                              sale.patientName ||
                              sale.customerName ||
                              "Walk-in"}
                          </div>
                          {(sale.patient?.phone || sale.phone) && (
                            <div
                              className="result-meta"
                              style={{ fontSize: "12px", marginTop: "2px" }}
                            >
                              {sale.patient?.phone || sale.phone}
                            </div>
                          )}
                        </td>
                        <td>
                          {sale.items && sale.items.length > 0 ? (
                            <div>
                              {sale.items.slice(0, 2).map((it, idx) => (
                                <div
                                  key={it.qty}
                                  style={{
                                    fontSize: "12px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: "180px",
                                  }}
                                >
                                  {getMedicineName(it)} x
                                  {it.quantity || it.qty || 1}
                                </div>
                              ))}
                              {sale.items.length > 2 && (
                                <div
                                  className="result-meta"
                                  style={{ fontSize: "11px", marginTop: "2px" }}
                                >
                                  +{sale.items.length - 2} More
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="result-meta">—</span>
                          )}
                        </td>
                        <td>
                          ₹
                          {parseFloat(
                            sale.discountAmount || sale.disc || 0,
                          ).toFixed(2)}
                        </td>
                        <td className="result-meta">
                          ₹
                          {parseFloat(
                            sale.taxAmount || sale.gstAmount || sale.gst || 0,
                          ).toFixed(2)}
                        </td>
                        <td
                          style={{ fontWeight: 700, color: "var(--primary)" }}
                        >
                          ₹
                          {parseFloat(
                            sale.totalAmount || sale.total || 0,
                          ).toFixed(2)}
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {(sale.paymentMode || sale.payment) === "UPI" && (
                              <Smartphone size={12} color="var(--info)" />
                            )}
                            {(sale.paymentMode || sale.payment) === "CASH" && (
                              <Banknote size={12} color="var(--primary)" />
                            )}
                            {(sale.paymentMode || sale.payment) === "CARD" && (
                              <CreditCard size={12} color="var(--info)" />
                            )}
                            <span className="payment-badge">
                              {sale.paymentMode ||
                                sale.payment ||
                                sale.paymentMethod ||
                                "UNKNOWN"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`p-status ${
                              sale.paymentStatus === "PAID"
                                ? "paid"
                                : sale.paymentStatus === "FAILED"
                                  ? "cancelled"
                                  : sale.paymentStatus === "PENDING"
                                    ? "low"
                                    : sale.paymentStatus === "PARTIAL"
                                      ? "low"
                                      : sale.paymentStatus === "REFUNDED"
                                        ? "expired"
                                        : "low"
                            }`}
                          >
                            {(sale.paymentStatus || "UNKNOWN").toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`p-status ${
                              (sale.invoiceStatus || sale.status) ===
                              "COMPLETED"
                                ? "paid"
                                : (sale.invoiceStatus || sale.status) ===
                                    "CANCELLED"
                                  ? "cancelled"
                                  : (sale.invoiceStatus || sale.status) ===
                                      "PARTIAL_RETURN"
                                    ? "low"
                                    : (sale.invoiceStatus || sale.status) ===
                                        "REFUNDED"
                                      ? "expired"
                                      : (sale.invoiceStatus || sale.status) ===
                                          "PENDING"
                                        ? "low"
                                        : "low"
                            }`}
                          >
                            {(
                              sale.invoiceStatus ||
                              sale.status ||
                              "UNKNOWN"
                            ).toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 700,
                    fontSize: "16px",
                  }}
                >
                  Hourly Revenue
                </div>
              </div>
              <div className="bar-chart-container">
                {hourlyData && hourlyData.length > 0 ? (
                  hourlyData.map((d, i) => (
                    <div
                      key={d.count}
                      className="chart-bar-wrapper"
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <motion.div
                        className="chart-bar"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        style={{
                          height: `${(d.revenue / (Math.max(...hourlyData.map((h) => h.revenue)) || 1)) * 100}%`,
                          transformOrigin: "bottom",
                          background: hoveredBar === i ? "var(--primary)" : "",
                        }}
                      />
                      <span className="chart-label">{d.hour}</span>
                      {hoveredBar === i && (
                        <motion.div
                          className="chart-tooltip"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <b>{d.hour}</b>
                          <br />
                          {d.count} bills
                          <br />
                          <span style={{ color: "var(--primary)" }}>
                            ₹{(d.revenue || 0).toLocaleString()}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "40px",
                      width: "100%",
                      textAlign: "center",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    No hourly data available
                  </div>
                )}
              </div>
            </div>
          </>
        )
      )}

      {!loading && activeTab === "bills" && (
        <div className="sales-table-card">
          <div className="sales-filters">
            <input
              required
              className="sales-input"
              placeholder="Search Invoice # or Patient..."
              style={{ flex: 1 }}
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
            <select
              className="sales-input"
              value={filters.payment}
              onChange={(e) =>
                setFilters({ ...filters, payment: e.target.value })
              }
            >
              <option>All Payment Modes</option>
              <option>CASH</option>
              <option>UPI</option>
              <option>CARD</option>
            </select>
            <select
              className="sales-input"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option>All Status</option>
              <option>PAID</option>
              <option>CREDIT</option>
            </select>
          </div>
          <table className="purchase-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Medicines</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Payment Status</th>
                <th>Invoice Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    {dateRange.start || dateRange.end
                      ? `No sales found between ${format(new Date(dateRange.start), "dd MMM yyyy")} and ${format(new Date(dateRange.end), "dd MMM yyyy")}`
                      : "No sales found"}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      {format(
                        new Date(sale.date || sale.createdAt),
                        "dd MMM yyyy",
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {sale.invoiceNumber || sale.id}
                    </td>
                    <td>
                      <div>
                        {sale.patient?.fullName ||
                          sale.patient?.name ||
                          sale.patientName ||
                          sale.customerName ||
                          "Walk-in"}
                      </div>
                      {(sale.patient?.phone || sale.phone) && (
                        <div
                          className="result-meta"
                          style={{ fontSize: "12px", marginTop: "2px" }}
                        >
                          {sale.patient?.phone || sale.phone}
                        </div>
                      )}
                    </td>
                    <td>
                      {sale.items && sale.items.length > 0 ? (
                        <div>
                          {sale.items.slice(0, 2).map((it, idx) => (
                            <div
                              key={it.qty}
                              style={{
                                fontSize: "12px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "180px",
                              }}
                            >
                              {getMedicineName(it)} x
                              {it.quantity || it.qty || 1}
                            </div>
                          ))}
                          {sale.items.length > 2 && (
                            <div
                              className="result-meta"
                              style={{ fontSize: "11px", marginTop: "2px" }}
                            >
                              +{sale.items.length - 2} More
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="result-meta">—</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      ₹{sale.totalAmount || sale.total || 0}
                    </td>
                    <td>
                      <span
                        className="badge-outline"
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          border: "1px solid var(--outline)",
                          borderRadius: "4px",
                        }}
                      >
                        {sale.paymentMode ||
                          sale.payment ||
                          sale.paymentMethod ||
                          "UNKNOWN"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`p-status ${
                          sale.paymentStatus === "PAID"
                            ? "paid"
                            : sale.paymentStatus === "FAILED"
                              ? "cancelled"
                              : sale.paymentStatus === "PENDING"
                                ? "low"
                                : sale.paymentStatus === "PARTIAL"
                                  ? "low"
                                  : sale.paymentStatus === "REFUNDED"
                                    ? "expired"
                                    : "paid"
                        }`}
                      >
                        {(sale.paymentStatus || "PAID").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`p-status ${
                          (sale.invoiceStatus || sale.status) === "COMPLETED"
                            ? "paid"
                            : (sale.invoiceStatus || sale.status) ===
                                "CANCELLED"
                              ? "cancelled"
                              : (sale.invoiceStatus || sale.status) ===
                                  "PARTIAL_RETURN"
                                ? "low"
                                : (sale.invoiceStatus || sale.status) ===
                                    "REFUNDED"
                                  ? "expired"
                                  : (sale.invoiceStatus || sale.status) ===
                                      "PENDING"
                                    ? "low"
                                    : "low"
                        }`}
                      >
                        {(
                          sale.invoiceStatus ||
                          sale.status ||
                          "COMPLETED"
                        ).toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === "returns" && (
        <div className="sales-table-card">
          <table className="purchase-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Return #</th>
                <th>Orig Invoice #</th>
                <th>Patient</th>
                <th>Items</th>
                <th>Return Value</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "var(--text-muted)",
                    }}
                  >
                    No returns found
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id}>
                    <td>
                      {format(
                        new Date(ret.date || ret.createdAt),
                        "dd MMM yyyy",
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {ret.returnNumber || ret.id}
                    </td>
                    <td className="result-meta">
                      {ret.sale?.invoiceNumber ||
                        ret.invoice?.invoiceNumber ||
                        ret.origInv ||
                        "—"}
                    </td>
                    <td>
                      {ret.patient?.fullName || ret.patientName || "Walk-in"}
                    </td>
                    <td>{ret.items?.length || ret.itemsCount || 0}</td>
                    <td style={{ fontWeight: 700, color: "var(--danger)" }}>
                      ₹
                      {formatCurrency(
                        ret.refundAmount ||
                          ret.totalReturnAmount ||
                          ret.value ||
                          0,
                      )}
                    </td>
                    <td>
                      <span
                        className="badge-paid"
                        style={{
                          background: "rgba(59, 130, 246, 0.1)",
                          color: "var(--info)",
                        }}
                      >
                        {ret.returnReason || ret.reason || "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`p-status ${(ret.status || "").toLowerCase()}`}
                      >
                        {ret.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {showDetailModal && selectedSale && (
          <div className="stock-modal-overlay">
            <motion.div
              className="sale-details-modal stock-modal-content"
              style={{
                width: "95vw",
                maxWidth: "1400px",
                height: "90vh",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Sale Details: {selectedSale.invoiceNumber || selectedSale.id}
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <div className="result-meta">Patient</div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedSale.patient?.name ||
                        selectedSale.patient?.fullName ||
                        selectedSale.patientName ||
                        selectedSale.customerName ||
                        "Walk-in"}
                    </div>
                    <div className="result-meta" style={{ marginTop: "4px" }}>
                      Phone
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedSale.patient?.phone ||
                        selectedSale.patientPhone ||
                        "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="result-meta">Date & Time</div>
                    <div style={{ fontWeight: 700 }}>
                      {formatInvoiceDate(
                        selectedSale.createdAt || selectedSale.date,
                      )}{" "}
                      {formatInvoiceTime(
                        selectedSale.createdAt || selectedSale.date,
                      )}
                    </div>
                    <div className="result-meta" style={{ marginTop: "4px" }}>
                      Payment
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedSale.paymentMode ||
                        selectedSale.payment ||
                        "Unknown Payment Method"}
                      {selectedSale.paymentStatus
                        ? ` (${selectedSale.paymentStatus})`
                        : ""}
                    </div>
                  </div>
                </div>

                <div className="pos-input-group">
                  <label>Bill Items</label>
                  <div
                    className="table-wrapper"
                    style={{
                      background: "var(--surface-container)",
                      borderRadius: "8px",
                    }}
                  >
                    <table
                      className="bill-items-table"
                      style={{
                        fontSize: "14px",
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "rgba(0,0,0,0.05)",
                            textAlign: "left",
                          }}
                        >
                          <th style={{ padding: "8px" }}>Medicine</th>
                          <th style={{ padding: "8px" }}>Batch</th>
                          <th style={{ padding: "8px", textAlign: "right" }}>
                            Qty
                          </th>
                          <th style={{ padding: "8px", textAlign: "right" }}>
                            Price
                          </th>
                          <th style={{ padding: "8px", textAlign: "right" }}>
                            GST
                          </th>
                          <th style={{ padding: "8px", textAlign: "right" }}>
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedSale.items || []).map((it, idx) => (
                          <tr
                            key={it.gst}
                            style={{
                              borderBottom: "1px solid var(--outline-variant)",
                            }}
                          >
                            <td style={{ padding: "8px" }}>
                              {getMedicineName(it)}
                            </td>
                            <td style={{ padding: "8px" }}>
                              {it.batchNumber || it.batch?.batchNumber || "N/A"}
                            </td>
                            <td style={{ padding: "8px", textAlign: "right" }}>
                              {it.quantity || it.qty || 1}
                            </td>
                            <td style={{ padding: "8px", textAlign: "right" }}>
                              ₹
                              {safeNumber(
                                it.unitPrice || it.price || 0,
                              ).toFixed(2)}
                            </td>
                            <td style={{ padding: "8px", textAlign: "right" }}>
                              ₹{safeNumber(it.gstAmount || 0).toFixed(2)} (
                              {it.gstRate || it.gst || 0}%)
                            </td>
                            <td style={{ padding: "8px", textAlign: "right" }}>
                              ₹
                              {safeNumber(
                                it.lineTotal ||
                                  it.totalAmount ||
                                  it.total ||
                                  it.totalPrice ||
                                  (it.quantity || it.qty || 1) *
                                    (it.unitPrice || it.price || 0),
                              ).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div
                      style={{
                        padding: "12px",
                        borderTop: "2px solid var(--outline-variant)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        alignItems: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "200px",
                        }}
                      >
                        <span className="result-meta">Subtotal</span>
                        <span>
                          ₹{safeNumber(selectedSale.subtotal || 0).toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "200px",
                        }}
                      >
                        <span className="result-meta">Discount</span>
                        <span>
                          ₹
                          {safeNumber(
                            selectedSale.discountAmount ||
                              selectedSale.discount ||
                              0,
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "200px",
                        }}
                      >
                        <span className="result-meta">GST</span>
                        <span>
                          ₹
                          {safeNumber(
                            selectedSale.gstAmount || selectedSale.gst || 0,
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "200px",
                          fontWeight: 700,
                          fontSize: "16px",
                          marginTop: "4px",
                        }}
                      >
                        <span>Grand Total</span>
                        <span style={{ color: "var(--primary)" }}>
                          ₹
                          {safeNumber(
                            selectedSale.totalAmount || selectedSale.total || 0,
                          ).toFixed(2)}
                        </span>
                      </div>
                      {safeNumber(selectedSale.returnedAmount) > 0 && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "200px",
                            fontWeight: 700,
                            fontSize: "14px",
                            marginTop: "8px",
                            color: "var(--danger)",
                          }}
                        >
                          <span>Returned Amount</span>
                          <span>
                            -₹
                            {safeNumber(selectedSale.returnedAmount).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="stock-modal-footer modal-footer"
                style={{
                  position: "sticky",
                  bottom: 0,
                  background: "var(--surface)",
                  zIndex: 100,
                  padding: "16px",
                  borderTop: "1px solid var(--outline-variant)",
                }}
              >
                <button
                  className="pos-btn outline"
                  onClick={() => {
                    setShowDetailModal(false);
                  }}
                >
                  Close
                </button>
                <button
                  className="pos-btn outline"
                  onClick={() => {
                    downloadInvoicePDF(selectedSale);
                    setShowDetailModal(false);
                  }}
                >
                  <Download size={16} /> PDF
                </button>
                <button
                  className="pos-btn outline"
                  style={{
                    color: "var(--danger)",
                    borderColor: "var(--danger)",
                  }}
                  onClick={() => {
                    handleReturn(selectedSale);
                    setShowDetailModal(false);
                  }}
                >
                  <RefreshCw size={16} /> Return Items
                </button>
                <button
                  className="pos-btn outline"
                  style={{
                    color: "var(--success)",
                    borderColor: "var(--success)",
                  }}
                  onClick={() => {
                    handleWhatsApp(selectedSale);
                    setShowDetailModal(false);
                  }}
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button
                  className="pos-btn teal"
                  onClick={() => {
                    handlePrintBill(selectedSale);
                    setShowDetailModal(false);
                  }}
                >
                  <Printer size={16} /> Print Bill
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── WhatsApp Integration Modal ── */}
      <AnimatePresence>
        {showWhatsAppModal && selectedSale && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "450px" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Share Bill via WhatsApp
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowWhatsAppModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <div className="pos-input-group">
                  <label>Phone Number</label>
                  <input
                    required
                    className="pos-input"
                    style={{ width: "100%" }}
                    defaultValue={selectedSale.patient?.phone || "+91 "}
                  />
                </div>
                <div className="pos-input-group" style={{ marginTop: "16px" }}>
                  <label>Message Preview</label>
                  <textarea
                    className="pos-input"
                    rows={4}
                    style={{ width: "100%", fontSize: "12px" }}
                    defaultValue={`Hello ${selectedSale.patient?.fullName || "Customer"},\nYour bill for ${selectedSale.invoiceNumber || selectedSale.id} (₹${selectedSale.totalAmount || selectedSale.total}) from Viyan MedAssist is ready.\nView it here: https://viyan.med/b/${(selectedSale.invoiceNumber || selectedSale.id || "").split("-").pop()}`}
                  />
                </div>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  onClick={() => setShowWhatsAppModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn teal"
                  style={{
                    background: "#25D366",
                    color: "white",
                    border: "none",
                  }}
                  onClick={() => sendWhatsApp(selectedSale)}
                >
                  <MessageCircle size={16} /> Send WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Return Processing Modal ── */}
      <AnimatePresence>
        {showReturnModal && selectedSale && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "500px" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="stock-modal-header">
                <h3
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 700,
                    color: "var(--danger)",
                  }}
                >
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
                <p className="result-meta">
                  Initiating return for{" "}
                  {selectedSale.invoiceNumber || selectedSale.id} (
                  {selectedSale.patient?.fullName ||
                    selectedSale.patientName ||
                    selectedSale.customerName ||
                    "Walk-in"}
                  )
                </p>

                <div style={{ marginTop: "16px" }}>
                  {(selectedSale.items || []).map((item, idx) => (
                    <div
                      key={item.qty}
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
                        checked={returnChecked[idx] ?? true}
                        onChange={(e) =>
                          setReturnChecked((prev) => ({
                            ...prev,
                            [idx]: e.target.checked,
                          }))
                        }
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>
                          {getMedicineName(item)}
                        </div>
                        <div
                          className="result-meta"
                          style={{ fontSize: "12px" }}
                        >
                          Sold Qty: {item.quantity || item.qty || 1}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          className="result-meta"
                          style={{ fontSize: "12px" }}
                        >
                          Return Qty:
                        </span>
                        <input
                          required
                          className="p-cost-input"
                          style={{ width: "60px", padding: "4px 8px" }}
                          type="number"
                          min={0}
                          max={item.quantity || item.qty || 1}
                          value={
                            returnQuantities[idx] ??
                            (item.quantity || item.qty || 1)
                          }
                          onChange={(e) =>
                            setReturnQuantities((prev) => ({
                              ...prev,
                              [idx]: Math.min(
                                item.quantity || item.qty || 1,
                                Math.max(0, safeNumber(e.target.value)),
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                  {(!selectedSale.items || selectedSale.items.length === 0) && (
                    <div>No items found to return.</div>
                  )}
                </div>

                <div className="pos-input-group" style={{ marginTop: "20px" }}>
                  <label>Return Reason</label>
                  <select
                    className="pos-input"
                    style={{ width: "100%" }}
                    value={returnModalReason}
                    onChange={(e) => setReturnModalReason(e.target.value)}
                  >
                    <option>Patient Request</option>
                    <option>Expired Medicine</option>
                    <option>Wrong Medicine</option>
                    <option>Damaged Packaging</option>
                  </select>
                </div>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  onClick={() => setShowReturnModal(false)}
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
                  onClick={processReturnApi}
                >
                  Process Refund
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ── Date Range Modal ── */}
      <AnimatePresence>
        {showDateRangeModal && (
          <div className="stock-modal-overlay">
            <motion.div
              className="stock-modal-content"
              style={{ width: "400px" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="stock-modal-header">
                <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                  Select Date Range
                </h3>
                <button
                  className="micro-btn"
                  onClick={() => setShowDateRangeModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="stock-modal-body">
                <div className="pos-input-group">
                  <label>Start Date</label>
                  <input
                    required
                    type="date"
                    className="pos-input"
                    style={{ width: "100%" }}
                    value={tempDateRange.start}
                    onChange={(e) =>
                      setTempDateRange({
                        ...tempDateRange,
                        start: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group" style={{ marginTop: "16px" }}>
                  <label>End Date</label>
                  <input
                    required
                    type="date"
                    className="pos-input"
                    style={{ width: "100%" }}
                    value={tempDateRange.end}
                    onChange={(e) =>
                      setTempDateRange({
                        ...tempDateRange,
                        end: e.target.value,
                      })
                    }
                  />
                </div>

                <div
                  className="range-presets"
                  style={{
                    marginTop: "20px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <button
                    className="pos-btn outline"
                    style={{ fontSize: "12px", padding: "8px" }}
                    onClick={() =>
                      setTempDateRange({
                        start: format(new Date(), "yyyy-MM-dd"),
                        end: format(new Date(), "yyyy-MM-dd"),
                      })
                    }
                  >
                    Today
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{ fontSize: "12px", padding: "8px" }}
                    onClick={() =>
                      setTempDateRange({
                        start: format(subDays(new Date(), 1), "yyyy-MM-dd"),
                        end: format(subDays(new Date(), 1), "yyyy-MM-dd"),
                      })
                    }
                  >
                    Yesterday
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{ fontSize: "12px", padding: "8px" }}
                    onClick={() =>
                      setTempDateRange({
                        start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
                        end: format(new Date(), "yyyy-MM-dd"),
                      })
                    }
                  >
                    Last 7 Days
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{ fontSize: "12px", padding: "8px" }}
                    onClick={() =>
                      setTempDateRange({
                        start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
                        end: format(new Date(), "yyyy-MM-dd"),
                      })
                    }
                  >
                    Last 30 Days
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{ fontSize: "12px", padding: "8px" }}
                    onClick={() => {
                      const today = new Date();
                      setTempDateRange({
                        start: format(
                          new Date(today.getFullYear(), today.getMonth(), 1),
                          "yyyy-MM-dd",
                        ),
                        end: format(
                          new Date(
                            today.getFullYear(),
                            today.getMonth() + 1,
                            0,
                          ),
                          "yyyy-MM-dd",
                        ),
                      });
                    }}
                  >
                    This Month
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{ fontSize: "12px", padding: "8px" }}
                    onClick={() => {
                      const today = new Date();
                      setTempDateRange({
                        start: format(
                          new Date(
                            today.getFullYear(),
                            today.getMonth() - 1,
                            1,
                          ),
                          "yyyy-MM-dd",
                        ),
                        end: format(
                          new Date(today.getFullYear(), today.getMonth(), 0),
                          "yyyy-MM-dd",
                        ),
                      });
                    }}
                  >
                    Previous Month
                  </button>
                </div>
              </div>
              <div className="stock-modal-footer">
                <button
                  className="pos-btn outline"
                  onClick={() => setShowDateRangeModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="pos-btn teal"
                  onClick={() => {
                    if (
                      tempDateRange.start &&
                      tempDateRange.end &&
                      tempDateRange.start > tempDateRange.end
                    ) {
                      showToast("End date must be after start date", "error");
                      return;
                    }
                    setDateRange(tempDateRange);
                    setShowDateRangeModal(false);
                    showToast("Date Filter Applied", "success");
                  }}
                >
                  Apply Filter
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showInvoiceModal && (
          <InvoiceModal
            isOpen={showInvoiceModal}
            onClose={() => setShowInvoiceModal(false)}
            onSaveSuccess={(inv) => {
              refreshSalesData();
              setShowInvoiceModal(false);
              setGeneratedInvoice(inv);
              setShowGeneratedInvoiceModal(true);
            }}
            showToast={showToast}
            user={user}
            storeProfile={storeProfile}
          />
        )}
        {showGeneratedInvoiceModal && (
          <InvoiceGeneratedModal
            isOpen={showGeneratedInvoiceModal}
            invoice={generatedInvoice}
            onClose={() => {
              setShowGeneratedInvoiceModal(false);
              setGeneratedInvoice(null);
            }}
            showToast={showToast}
            storeProfile={storeProfile}
            onNewBill={() => {
              setShowGeneratedInvoiceModal(false);
              setGeneratedInvoice(null);
              setShowInvoiceModal(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
