import { useState, useEffect } from "react";
import {
  TrendingUp,
  Receipt,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileText,
  Printer,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";
import { escapeHtml } from "../../utils/escapeHtml";
import { safeNumber } from "../../utils/number.js";

export default function SalesReport({ from, to, showToast }) {
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      setErrorState(null);
      try {
        const res = await api.get(API_ROUTES.REPORTS_SALES || "reports/sales", {
          params: { from, to },
        });
        if (res.data && res.data.success) {
          setData(res.data.data);
        } else {
          setErrorState("Invalid API response format");
        }
      } catch (err) {
        console.error("Sales fetch error:", err);
        setErrorState(
          err.response?.data?.error ||
            err.message ||
            "Failed to load sales report",
        );
      } finally {
        setLoading(false);
      }
    };

    if (from && to) {
      fetchSales();
    }
  }, [from, to]);

  const exportCSV = () => {
    if (!data || !data.chart.length) return;
    const headers = ["Date", "Invoices", "Revenue (Rs.)"];
    const rows = data.chart.map((item) => [
      item.date,
      item.bills,
      item.revenue,
    ]);
    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("CSV Exported", "success");
  };

  const exportPDF = () => {
    if (!data) return;
    try {
      const doc = new jsPDF();
      doc.text(`Sales Analytics Report (${from} to ${to})`, 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [["Date", "Invoices Count", "Revenue Amount (Rs.)"]],
        body: data.chart.map((item) => [
          item.date,
          item.bills,
          `${item.revenue.toLocaleString()}`,
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [79, 219, 200] },
      });
      doc.save(`sales-report-${from}-to-${to}.pdf`);
      showToast("PDF Downloaded", "success");
    } catch (err) {
      console.error("PDF export error:", err);
      showToast("PDF export failed: " + err.message, "error");
    }
  };

  const handlePrint = () => {
    const section = document.getElementById("sales-report-table");
    if (!section) {
      showToast("Report section not found", "error");
      return;
    }
    const win = window.open("", "_blank");
    if (!win) {
      showToast("Pop-up blocked. Please allow pop-ups.", "error");
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>Sales Report Print</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .header { margin-bottom: 20px; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Viyan MedAssist - Sales Analytics Report</h2>
            <p>Period: ${escapeHtml(from)} to ${escapeHtml(to)}</p>
          </div>
          ${section.outerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  const renderLineChart = () => {
    if (!data || !data.chart || data.chart.length === 0) return null;
    const width = 800;
    const height = 200;
    const revenues = data.chart.map((d) => safeNumber(d.revenue || 0));
    const maxRevenue = Math.max(...revenues, 15000);

    const points = data.chart
      .map((d, i) => {
        const x = (i / (data.chart.length - 1 || 1)) * width;
        const y = height - (d.revenue / maxRevenue) * height;
        return `${x},${y}`;
      })
      .join(" ");

    const areaPoints = `${points} ${width},${height} 0,${height}`;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="line-chart-svg"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={areaPoints} fill="url(#areaGradient)" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div
        className="reports-loading"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "300px",
          gap: "12px",
        }}
      >
        <Loader2 className="animate-spin" size={36} color="var(--primary)" />
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Loading sales intelligence data...
        </p>
      </div>
    );
  }

  if (errorState) {
    return (
      <div
        className="empty-state-card"
        style={{
          padding: "40px",
          textAlign: "center",
          border: "1px solid rgba(220,53,69,0.2)",
          background: "rgba(220,53,69,0.05)",
          borderRadius: "8px",
        }}
      >
        <AlertTriangle
          size={36}
          color="var(--danger)"
          style={{ marginBottom: "12px" }}
        />
        <h4 style={{ fontWeight: 700, color: "var(--danger)" }}>
          Sales Report Error
        </h4>
        <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>
          {errorState?.message || String(errorState)}
        </p>
      </div>
    );
  }

  if (!data || !data.chart.length) {
    return (
      <div
        className="empty-state-card"
        style={{ padding: "60px 20px", textAlign: "center" }}
      >
        <Receipt
          size={40}
          color="var(--text-muted)"
          style={{ marginBottom: "12px" }}
        />
        <h4 style={{ fontWeight: 700 }}>No sales data found</h4>
        <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>
          There are no invoices generated in the selected range.
        </p>
      </div>
    );
  }

  const { summary, trend, topMedicines, paymentDistribution } = data;
  const paymentMethods = [
    {
      method: "Cash",
      percentage:
        summary.grossRevenue > 0
          ? Math.round((paymentDistribution.cash / summary.grossRevenue) * 100)
          : 0,
    },
    {
      method: "UPI",
      percentage:
        summary.grossRevenue > 0
          ? Math.round((paymentDistribution.upi / summary.grossRevenue) * 100)
          : 0,
    },
    {
      method: "Card",
      percentage:
        summary.grossRevenue > 0
          ? Math.round((paymentDistribution.card / summary.grossRevenue) * 100)
          : 0,
    },
  ];

  const totalPercent = paymentMethods.reduce(
    (sum, method) => sum + method.percentage,
    0,
  );
  if (totalPercent > 100.1) {
    console.error(
      `[Validation Error] Payment distribution exceeds 100%: ${totalPercent}%`,
    );
  }

  const pCash = paymentMethods[0].percentage;
  const pUpi = paymentMethods[1].percentage;
  const pCard = paymentMethods[2].percentage;

  const donutBg = (() => {
    const activeSegments = [];
    if (pCash > 0)
      activeSegments.push({ color: "var(--primary)", value: pCash });
    if (pUpi > 0) activeSegments.push({ color: "var(--info)", value: pUpi });
    if (pCard > 0)
      activeSegments.push({ color: "var(--success)", value: pCard });

    if (activeSegments.length === 0) return "var(--overlay-03)";
    if (activeSegments.length === 1) return activeSegments[0].color;

    let currentPos = 0;
    const parts = activeSegments.map((seg, idx) => {
      const start = currentPos;
      const end =
        idx === activeSegments.length - 1 ? 100 : currentPos + seg.value;
      currentPos = end;
      return `${seg.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${parts.join(", ")})`;
  })();

  return (
    <>
      <div className="reports-kpi-grid">
        {[
          {
            label: "TOTAL REVENUE",
            val: `₹${(summary.totalRevenue || 0).toLocaleString()}`,
            trend: `${trend.revenueTrend >= 0 ? "+" : ""}${Math.round(trend.revenueTrend)}%`,
            dir: trend.revenueTrend < 0 ? "down" : "up",
            icon: TrendingUp,
            col: "var(--primary)",
          },
          {
            label: "TOTAL BILLS",
            val: summary.totalBills || 0,
            trend: "Overall count",
            dir: "up",
            icon: Receipt,
            col: "var(--info)",
          },
          {
            label: "AVG BILL VALUE",
            val: `₹${Math.round(summary.avgBillValue || 0)}`,
            trend: `${trend.avgBillTrend >= 0 ? "+" : ""}${Math.round(trend.avgBillTrend)}%`,
            dir: trend.avgBillTrend < 0 ? "down" : "up",
            icon: Activity,
            col: "var(--info)",
          },
        ].map((kpi, i) => (
          <div key={i} className="report-kpi-card">
            <div className="stat-card-header">
              <span className="stat-label">{kpi.label}</span>
              <div
                className="stat-icon"
                style={{ backgroundColor: `${kpi.col}15`, color: kpi.col }}
              >
                <kpi.icon size={16} />
              </div>
            </div>
            <div className="stat-value">{kpi.val}</div>
            <div className={`kpi-trend ${kpi.dir}`}>
              {kpi.dir === "up" ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="line-chart-card">
        <div className="chart-header">
          <div
            style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: "16px" }}
          >
            Revenue Trend
          </div>
        </div>
        <div style={{ height: "220px", width: "100%", marginTop: "20px" }}>
          {renderLineChart()}
        </div>
      </div>

      <div className="report-charts-grid">
        <div className="pos-card">
          <div className="pos-card-title">Top medicines by Revenue</div>
          <div style={{ marginTop: "20px" }}>
            {topMedicines.map((m, idx) => (
              <div
                key={idx}
                className="med-revenue-row"
                onClick={() =>
                  showToast(`Opening detail for ${m.medicineName}`, "info")
                }
              >
                <span className="med-name-label">{m.medicineName}</span>
                <div className="med-bar-bg">
                  <div
                    className="med-bar-fill"
                    style={{
                      width: `${(m.revenue / (topMedicines[0]?.revenue || 1)) * 100}%`,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "13px",
                    width: "80px",
                    textAlign: "right",
                  }}
                >
                  ₹{(m.revenue || 0).toLocaleString()}
                </span>
              </div>
            ))}
            {topMedicines.length === 0 && (
              <div
                className="result-meta"
                style={{ textAlign: "center", padding: "20px" }}
              >
                No top medicines for range.
              </div>
            )}
          </div>
        </div>

        <div className="pos-card">
          <div className="pos-card-title">Payment Mode Distribution</div>
          <div className="donut-container" style={{ marginTop: "20px" }}>
            <div className="donut-visual" style={{ background: donutBg }}>
              <div className="donut-inner-text">
                ₹{(summary.totalRevenue || 0).toLocaleString()}
                <br />
                <span className="result-meta">Total</span>
              </div>
            </div>
            <div className="donut-legend">
              {paymentMethods.map((pm, idx) => (
                <div className="legend-item" key={idx}>
                  <div
                    className="legend-dot"
                    style={{
                      background:
                        idx === 0
                          ? "var(--primary)"
                          : idx === 1
                            ? "var(--info)"
                            : "var(--success)",
                    }}
                  />
                  <span>{pm.method?.toUpperCase()}</span>
                  <b>{pm.percentage}%</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id="sales-report-table">
        <div className="purchase-table-card">
          <table className="purchase-table">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Date</th>
                <th style={{ textAlign: "right", width: "30%" }}>Invoices</th>
                <th style={{ textAlign: "right", width: "40%" }}>
                  Revenue Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.chart.map((d, i) => (
                <tr key={i}>
                  <td>{d.date}</td>
                  <td style={{ fontWeight: 700, textAlign: "right" }}>
                    {d.bills}
                  </td>
                  <td
                    style={{
                      fontWeight: 800,
                      color: "var(--primary)",
                      textAlign: "right",
                    }}
                  >
                    ₹{(d.revenue || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr style={{ background: "rgba(79, 219, 200, 0.05)" }}>
                <td
                  colSpan={2}
                  style={{
                    textAlign: "right",
                    fontWeight: 800,
                    paddingRight: "20px",
                  }}
                >
                  TOTAL THIS PERIOD:
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    color: "var(--primary)",
                    fontSize: "16px",
                    textAlign: "right",
                  }}
                >
                  ₹{(summary.totalRevenue || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
          <div
            style={{ padding: "16px", display: "flex", gap: "12px" }}
            className="no-print"
          >
            <button
              className="pos-btn outline"
              style={{ padding: "6px 12px", fontSize: "12px" }}
              onClick={exportCSV}
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              className="pos-btn outline"
              style={{ padding: "6px 12px", fontSize: "12px" }}
              onClick={exportPDF}
            >
              <FileText size={14} /> Export PDF
            </button>
            <button
              className="pos-btn outline"
              style={{ padding: "6px 12px", fontSize: "12px" }}
              onClick={handlePrint}
            >
              <Printer size={14} /> Print Report
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
