import { useState, useMemo, useEffect } from "react";
import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import InvoiceModal from "./invoice/InvoiceModal";
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
  Eye,
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
import { normalizeArrayResponse } from "../utils/apiNormalizer";
export default function SalesManagement({ showToast }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
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
        api.get(API_ROUTES.BILLING_RETURNS, {
          params: {
            startDate: dateRange.start,
            endDate: dateRange.end,
          },
        }),
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
          api.get(API_ROUTES.BILLING_RETURNS, {
            params: {
              startDate: dateRange.start,
              endDate: dateRange.end,
            },
          }),
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
          sale.patient?.fullName || sale.patientName || sale.customerName || "Walk-in";
        const matchesSearch =
          (sale.invoiceNumber || sale.id || "")
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          patientName.toLowerCase().includes(filters.search.toLowerCase());
        const matchesPayment =
          filters.payment === "All Payment Modes" ||
          (sale.paymentMode || sale.payment) === filters.payment;
        const matchesDate =
          (!dateRange.start || sale.date >= dateRange.start) &&
          (!dateRange.end || sale.date <= dateRange.end);
        return matchesSearch && matchesPayment && matchesDate;
      }),
    [sales, filters, dateRange],
  );

  const dailySales = useMemo(
    () =>
      filteredSales.filter((sale) => {
        const formattedTarget = format(currentDate, "yyyy-MM-dd");
        return (sale.date || "").startsWith(formattedTarget);
      }),
    [filteredSales, currentDate],
  );

  const filteredReturns = useMemo(
    () =>
      returns.filter((ret) => {
        const patientName =
          ret.patient?.fullName || ret.patientName || ret.customerName || "Walk-in";
        const matchesSearch =
          (ret.returnNumber || ret.id || "")
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          patientName.toLowerCase().includes(filters.search.toLowerCase());
        const matchesStatus =
          filters.status === "All Status" ||
          (ret.status || "").toUpperCase() === filters.status;
        return matchesSearch && matchesStatus;
      }),
    [returns, filters],
  );

  const handlePrevDate = () => setCurrentDate((prev) => subDays(prev, 1));
  const handleNextDate = () => setCurrentDate((prev) => addDays(prev, 1));

  const handleOpenDetail = (sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const handleWhatsApp = (sale) => {
    setSelectedSale(sale);
    setShowWhatsAppModal(true);
  };

  const handleReturn = (sale) => {
    setSelectedSale(sale);
    setReturnQuantities({});
    setReturnChecked({});
    setReturnModalReason("Patient Request");
    setShowReturnModal(true);
  };

  const processReturnApi = async () => {
    try {
      if (!selectedSale) return;
      setLoading(true);

      const reasonText = returnModalReason || "Patient Request";
      let condition = "sealed";
      if (reasonText === "Expired Medicine") {
        condition = "expired";
      } else if (reasonText === "Damaged Packaging") {
        condition = "damaged";
      }

      const returnPromises = [];

      (selectedSale.items || []).forEach((saleItem, idx) => {
        if (returnChecked[idx] && returnQuantities[idx] > 0) {
          returnPromises.push(
            api.post(API_ROUTES.BILLING_RETURNS, {
              saleItemId: saleItem.id || saleItem.uuid,
              quantity: returnQuantities[idx],
              reason: reasonText,
              condition: condition,
            }),
          );
        }
      });

      if (returnPromises.length === 0) {
        showToast("Please select at least one item to return", "warning");
        setLoading(false);
        return;
      }

      await Promise.all(returnPromises);

      showToast("Return processed successfully", "success");
      setShowReturnModal(false);
      await refreshSalesData();
    } catch (error) {
      console.error("Failed to process return:", error);
      showToast("Failed to process return", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = (sale) => {
    const printWindow = window.open("", "_blank");
    const itemsHtml = (sale.items || [])
      .map(
        (it) =>
          `<tr><td>${it.name}</td><td>${it.qty}</td><td>₹${it.price * it.qty}</td></tr>`,
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>${sale.id}</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h2 { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .total { margin-top: 20px; font-size: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Viyan MedAssist</h2>
          <p><b>Invoice:</b> ${sale.id}</p>
          <p><b>Patient:</b> ${sale.patient}</p>
          <p><b>Date:</b> ${sale.date}</p>
          <p><b>Time:</b> ${sale.time}</p>
          <p><b>Payment:</b> ${sale.payment}</p>
          <table>
            <thead><tr><th>Medicine</th><th>Qty</th><th>Price</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="total">Total: ₹${sale.total}</div>
        </body>
      </html>`;

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
        { header: "Invoice", key: "Invoice", width: 15 },
        { header: "Date", key: "Date", width: 12 },
        { header: "Time", key: "Time", width: 10 },
        { header: "Patient", key: "Patient", width: 20 },
        { header: "Items", key: "Items", width: 30 },
        { header: "Discount", key: "Discount", width: 10 },
        { header: "GST", key: "GST", width: 10 },
        { header: "Total", key: "Total", width: 12 },
        { header: "Payment", key: "Payment", width: 12 },
      ];

      const exportData = filteredSales.map((sale) => ({
        Invoice: sale.id,
        Date: sale.date,
        Time: sale.time,
        Patient: sale.patient,
        Items: (sale.items || [])
          .map((it) => `${it.name} x${it.qty}`)
          .join("; "),
        Discount: sale.disc,
        GST: sale.gst,
        Total: sale.total,
        Payment: sale.payment,
      }));

      worksheet.addRows(exportData);

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
    const phone = sale.phone || "919840012345";
    const text = `Hello ${sale.patient}, Your bill ${sale.id} of ₹${sale.total} from Viyan MedAssist is ready.`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
    setShowWhatsAppModal(false);
    showToast("WhatsApp opened", "success");
  };

  const downloadInvoicePDF = (sale) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Viyan MedAssist", 14, 20);
    doc.setFontSize(12);
    doc.text(`Invoice: ${sale.id}`, 14, 35);
    doc.text(`Patient: ${sale.patient}`, 14, 43);
    doc.text(`Date: ${sale.date}`, 14, 51);

    autoTable(doc, {
      startY: 60,
      head: [["Medicine", "Qty", "Price"]],
      body: (sale.items || []).map((it) => [
        it.name,
        String(it.qty),
        `₹${it.price * it.qty}`,
      ]),
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: ₹${sale.total}`, 14, finalY);
    doc.save(`${sale.id}.pdf`);
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
            onClick={() => setShowDateRangeModal(true)}
          >
            <Calendar size={16} /> Date Range
          </button>
          <button className="pos-btn outline" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
          <button className="pos-btn teal" onClick={() => setShowInvoiceModal(true)}>
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
              dailySales
                .reduce((sum, s) => sum + (s.totalAmount || s.total || 0), 0)
                .toLocaleString(),
            icon: TrendingUp,
            col: "var(--primary)",
          },
          {
            label: "SELECTED RANGE",
            val:
              "₹" +
              filteredSales
                .reduce((sum, s) => sum + (s.totalAmount || s.total || 0), 0)
                .toLocaleString(),
            icon: Calendar,
            col: "var(--info)",
          },
          {
            label: "TOTAL BILLS",
            val: filteredSales.length,
            icon: FileText,
            col: "var(--info)",
          },
          {
            label: "RETURNS",
            val:
              "₹" +
              filteredReturns
                .reduce((sum, r) => sum + (r.refundAmount || r.value || 0), 0)
                .toLocaleString(),
            icon: ArrowLeft,
            col: "var(--danger)",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="pos-stat-card"
            onClick={() => setActiveTab("daily")}
          >
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

            <div className="sales-summary-bar">
              <div className="summary-stats-left">
                <span>
                  Total Bills: <b>{dailySales.length}</b>
                </span>
                <span>
                  Revenue:{" "}
                  <b>
                    ₹
                    {dailySales.reduce(
                      (sum, s) => sum + (s.totalAmount || s.total || 0),
                      0,
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
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        style={{
                          textAlign: "center",
                          padding: "30px",
                          color: "var(--text-muted)",
                        }}
                      >
                        No sales for this date
                      </td>
                    </tr>
                  ) : (
                    dailySales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="result-meta">
                          {sale.time ||
                            new Date(sale.createdAt).toLocaleTimeString()}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {sale.invoiceNumber || sale.id}
                        </td>
                        <td>
                          {sale.patient?.fullName ||
                            sale.patientName ||
                            sale.customerName ||
                            "Walk-in"}
                        </td>
                        <td>
                          {sale.items
                            ? sale.items.length
                            : sale.medicinesCount || 0}{" "}
                          medicines
                        </td>
                        <td>₹{sale.discountAmount || sale.disc || 0}</td>
                        <td className="result-meta">
                          ₹{sale.taxAmount || sale.gst || 0}
                        </td>
                        <td
                          style={{ fontWeight: 700, color: "var(--primary)" }}
                        >
                          ₹{sale.totalAmount || sale.total || 0}
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
                            {sale.paymentMode || sale.payment}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              className="micro-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(sale);
                              }}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="micro-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintBill(sale);
                              }}
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              className="micro-btn"
                              style={{ color: "var(--danger)" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReturn(sale);
                              }}
                            >
                              <RefreshCw size={14} />
                            </button>
                          </div>
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
                      key={i}
                      className="chart-bar-wrapper"
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <motion.div
                        className="chart-bar"
                        initial={{ height: 0 }}
                        animate={{
                          height: `${(d.revenue / (Math.max(...hourlyData.map((h) => h.revenue)) || 1)) * 100}%`,
                        }}
                        style={{
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
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "var(--text-muted)",
                    }}
                  >
                    No sales found
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
                      {sale.patient?.fullName || sale.patientName || sale.customerName || "Walk-in"}
                    </td>
                    <td className="result-meta">
                      {sale.patient?.phone || sale.phone || "—"}
                    </td>
                    <td>
                      {sale.items
                        ? sale.items.length
                        : sale.medicinesCount || 0}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      ₹{sale.totalAmount || sale.total || 0}
                    </td>
                    <td>{sale.paymentMode || sale.payment}</td>
                    <td>
                      <span className="p-status paid">
                        {(sale.status || "PAID").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="micro-btn"
                          style={{ color: "var(--success)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(sale);
                          }}
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button
                          className="micro-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(sale);
                          }}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
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
                      {ret.sale?.invoiceNumber || ret.origInv || "—"}
                    </td>
                    <td>
                      {ret.patient?.fullName || ret.patientName || "Walk-in"}
                    </td>
                    <td>{ret.items?.length || ret.itemsCount || 0}</td>
                    <td style={{ fontWeight: 700, color: "var(--danger)" }}>
                      ₹{ret.refundAmount || ret.value || 0}
                    </td>
                    <td>
                      <span
                        className="badge-paid"
                        style={{
                          background: "rgba(59, 130, 246, 0.1)",
                          color: "var(--info)",
                        }}
                      >
                        {ret.reason}
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
              className="stock-modal-content"
              style={{ width: "500px" }}
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
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <div className="result-meta">Patient</div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedSale.patient?.fullName ||
                        selectedSale.patientName ||
                        selectedSale.customerName ||
                        "Walk-in"}
                    </div>
                  </div>
                  <div>
                    <div className="result-meta">Time</div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedSale.time ||
                        new Date(selectedSale.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <div className="result-meta">Payment</div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedSale.paymentMode || selectedSale.payment}
                    </div>
                  </div>
                </div>

                <div className="pos-input-group">
                  <label>Bill Items</label>
                  <div
                    style={{
                      padding: "12px",
                      background: "var(--surface-container)",
                      borderRadius: "8px",
                    }}
                  >
                    {(selectedSale.items || []).map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span>
                          {it.name} x{it.qty}
                        </span>
                        <span>₹{it.price * it.qty}</span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderTop: "1px solid var(--outline-variant)",
                        paddingTop: "8px",
                        marginTop: "8px",
                        fontWeight: 700,
                      }}
                    >
                      <span>Total Amount</span>
                      <span style={{ color: "var(--primary)" }}>
                        ₹{selectedSale.totalAmount || selectedSale.total || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="stock-modal-footer">
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
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <input
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
                        {item.medicine?.name || item.name}
                      </div>
                      <input
                        className="p-cost-input"
                        style={{ width: "50px" }}
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={returnQuantities[idx] ?? item.quantity}
                        onChange={(e) =>
                          setReturnQuantities((prev) => ({
                            ...prev,
                            [idx]: Math.min(
                              item.quantity,
                              Math.max(0, Number(e.target.value)),
                            ),
                          }))
                        }
                      />
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
                    type="date"
                    className="pos-input"
                    style={{ width: "100%" }}
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, start: e.target.value })
                    }
                  />
                </div>
                <div className="pos-input-group" style={{ marginTop: "16px" }}>
                  <label>End Date</label>
                  <input
                    type="date"
                    className="pos-input"
                    style={{ width: "100%" }}
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, end: e.target.value })
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
                      setDateRange({
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
                      setDateRange({
                        start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
                        end: format(new Date(), "yyyy-MM-dd"),
                      })
                    }
                  >
                    This Month
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
                    showToast("Date Filter Applied", "success");
                    setShowDateRangeModal(false);
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
            onSaveSuccess={() => refreshSalesData()}
            showToast={showToast}
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
