import { useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SalesReport from "./reports/SalesReport";
import PurchaseReport from "./reports/PurchaseReport";
import PnLReport from "./reports/PnLReport";
import ExpiryReport from "./reports/ExpiryReport";
const getDatesForPeriod = (period) => {
  const to = new Date();
  const from = new Date();
  if (period === "7D") {
    from.setDate(to.getDate() - 7);
  } else if (period === "30D") {
    from.setDate(to.getDate() - 30);
  } else if (period === "3M") {
    from.setDate(to.getDate() - 90);
  } else if (period === "6M") {
    from.setDate(to.getDate() - 180);
  } else if (period === "1Y") {
    from.setDate(to.getDate() - 365);
  }
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
};

export default function ReportsHub({ showToast }) {
  const [activeTab, setActiveTab] = useState("sales");
  const [activePeriod, setActivePeriod] = useState("30D");
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRange, setDateRange] = useState(() => getDatesForPeriod("30D"));

  const handlePeriodChange = (period) => {
    setActivePeriod(period);
    const dates = getDatesForPeriod(period);
    setDateRange(dates);
    showToast(`Time period updated: Last ${period}`, "success");
  };

  const getActivePeriodLabel = () => {
    if (activePeriod === "custom") {
      return `${new Date(dateRange.from).toLocaleDateString("en-IN")} - ${new Date(dateRange.to).toLocaleDateString("en-IN")}`;
    }
    return `Last ${activePeriod}`;
  };

  return (
    <div className="reports-container">
      {/* ── Page Header ── */}
      <div
        className="reports-header"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "Outfit",
                fontSize: "28px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Reports & Analytics
            </h1>
            <p
              className="result-meta"
              style={{ marginTop: "8px", marginBottom: 0 }}
            >
              Real-time business intelligence: sales aggregates, supply spend,
              net profit, and expiry risks.
            </p>
          </div>

          <div
            className="header-actions"
            style={{ display: "flex", gap: "12px", alignItems: "center" }}
          >
            {activeTab !== "expiry" && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  background: "var(--surface-container)",
                  borderRadius: "8px",
                  padding: "4px",
                }}
              >
                {["7D", "30D", "3M", "6M"].map((p) => (
                  <button
                    key={p}
                    className="pos-btn outline"
                    style={{
                      border: "none",
                      background:
                        activePeriod === p
                          ? "var(--primary-container)"
                          : "transparent",
                      color:
                        activePeriod === p
                          ? "var(--primary)"
                          : "var(--text-muted)",
                      padding: "6px 12px",
                      fontSize: "12px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                    onClick={() => handlePeriodChange(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {activeTab !== "expiry" && (
              <button
                className="pos-btn outline"
                onClick={() => setShowDateRangeModal(true)}
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Calendar size={16} /> {getActivePeriodLabel()}{" "}
                <ChevronDown size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="purchases-tabs">
          {[
            { key: "sales", label: "Daily Sales Report" },
            { key: "purchase", label: "Purchase Report" },
            { key: "pnl", label: "Profit & Loss" },
            { key: "expiry", label: "Expiry Report" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`p-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Tab Component Mounting ── */}
      <div className="report-main-content">
        {activeTab === "sales" && dateRange.from && (
          <SalesReport
            from={dateRange.from}
            to={dateRange.to}
            showToast={showToast}
          />
        )}

        {activeTab === "purchase" && dateRange.from && (
          <PurchaseReport from={dateRange.from} to={dateRange.to} />
        )}

        {activeTab === "pnl" && dateRange.from && (
          <PnLReport
            from={dateRange.from}
            to={dateRange.to}
            showToast={showToast}
          />
        )}

        {activeTab === "expiry" && <ExpiryReport showToast={showToast} />}
      </div>

      {/* ── Custom Date Range Modal ── */}
      {createPortal(
        <AnimatePresence>
          {showDateRangeModal && (
            <div className="stock-modal-overlay" style={{ zIndex: 1100 }}>
              <motion.div
                className="stock-modal-content"
                style={{ width: "420px" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="stock-modal-header">
                  <h3 style={{ fontFamily: "Outfit", fontWeight: 700 }}>
                    <Calendar
                      size={18}
                      style={{ marginRight: "8px", verticalAlign: "middle" }}
                    />
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
                  <div
                    className="p-form-grid"
                    style={{ gridTemplateColumns: "1fr" }}
                  >
                    <div className="pos-input-group">
                      <label className="p-label">FROM DATE</label>
                      <input
                        required
                        className="pos-input"
                        type="date"
                        value={dateRange.from}
                        onChange={(e) =>
                          setDateRange((prev) => ({
                            ...prev,
                            from: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="pos-input-group">
                      <label className="p-label">TO DATE</label>
                      <input
                        required
                        className="pos-input"
                        type="date"
                        value={dateRange.to}
                        onChange={(e) =>
                          setDateRange((prev) => ({
                            ...prev,
                            to: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div
                      style={{
                        padding: "12px 16px",
                        background: "rgba(79, 219, 200, 0.05)",
                        borderRadius: "12px",
                        fontSize: "13px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {dateRange.from && dateRange.to
                        ? `Showing data from ${new Date(dateRange.from).toLocaleDateString("en-IN")} to ${new Date(dateRange.to).toLocaleDateString("en-IN")}`
                        : "Select a date range to filter the report data"}
                    </div>
                  </div>
                </div>
                <div className="stock-modal-footer">
                  <button
                    className="pos-btn outline"
                    style={{ flex: 1 }}
                    onClick={() => setShowDateRangeModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="pos-btn teal"
                    style={{ flex: 2 }}
                    onClick={() => {
                      if (!dateRange.from || !dateRange.to) {
                        showToast("Please select both dates", "error");
                        return;
                      }
                      if (new Date(dateRange.to) < new Date(dateRange.from)) {
                        showToast("End date must be after start date", "error");
                        return;
                      }
                      setActivePeriod("custom");
                      showToast(
                        `Report filtered: ${new Date(dateRange.from).toLocaleDateString("en-IN")} → ${new Date(dateRange.to).toLocaleDateString("en-IN")}`,
                        "success",
                      );
                      setShowDateRangeModal(false);
                    }}
                  >
                    Apply Filter
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
