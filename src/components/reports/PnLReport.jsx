import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertTriangle,
  Briefcase,
  Plus,
  X,
  UploadCloud,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api.js";
import { API_ROUTES } from "../../constants/api.routes.js";

export default function PnLReport({ from, to, showToast }) {
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [data, setData] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("Salary");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);

  const fetchPnL = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const res = await api.get(
        API_ROUTES.REPORTS_FINANCE || "reports/finance",
        {
          params: { from, to },
        },
      );
      if (res.data && res.data.success) {
        setData(res.data.data);
      } else {
        setErrorState("Invalid API response format");
      }
    } catch (err) {
      console.error("PnL fetch error:", err);
      const apiError = err.response?.data?.error;
      const errorMsg =
        typeof apiError === "object" ? apiError.message : apiError;
      setErrorState(errorMsg || err.message || "Failed to load PnL report");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    let isMounted = true;
    if (from && to) {
      const loadData = async () => {
        if (!isMounted) return;
        await fetchPnL();
      };
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, [from, to, fetchPnL]);

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
          Loading financial intelligence data...
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
          PnL Report Error
        </h4>
        <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>
          {errorState?.message || String(errorState)}
        </p>
      </div>
    );
  }

  if (!data || !data.summary || typeof data.summary.revenue !== "number") {
    return (
      <div
        className="empty-state-card"
        style={{ padding: "60px 20px", textAlign: "center" }}
      >
        <Briefcase
          size={40}
          color="var(--text-muted)"
          style={{ marginBottom: "12px" }}
        />
        <h4 style={{ fontWeight: 700 }}>No financial data found</h4>
        <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>
          There are no transactions recorded in this period to aggregate.
        </p>
        <button
          className="pos-btn teal"
          style={{ padding: "8px 16px", fontSize: "13px", marginTop: "16px" }}
          onClick={() => setShowExpenseModal(true)}
        >
          <Plus size={14} /> Add First Expense
        </button>

        <AnimatePresence>
          {showExpenseModal && renderExpenseModal()}
        </AnimatePresence>
      </div>
    );
  }

  const { summary, expensesDistribution } = data;

  function renderExpenseModal() {
    return (
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
              Add New Expense
            </h3>
            <button
              className="micro-btn"
              onClick={() => setShowExpenseModal(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="stock-modal-body" style={{ textAlign: "left" }}>
            <div className="p-form-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="pos-input-group">
                <label className="p-label">CATEGORY</label>
                <select
                  className="pos-input"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                >
                  <option>Salary</option>
                  <option>Rent</option>
                  <option>Utilities</option>
                  <option>Maintenance</option>
                </select>
              </div>
              <div className="pos-input-group">
                <label className="p-label">AMOUNT ₹</label>
                <input
                  required
                  required
                  className="pos-input"
                  type="number"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>
              <div className="pos-input-group">
                <label className="p-label">DESCRIPTION</label>
                <textarea
                  className="pos-input"
                  style={{ minHeight: "80px" }}
                  placeholder="Notes about this expense..."
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                />
              </div>
              <div
                className="p-upload-zone"
                style={{ padding: "12px", cursor: "pointer" }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    setReceiptFile(file);
                    showToast("Receipt Uploaded", "success");
                  }
                }}
              >
                <input
                  required
                  required
                  type="file"
                  hidden
                  id="receiptUpload"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setReceiptFile(file);
                      showToast("Receipt Uploaded", "success");
                    }
                  }}
                />
                <label
                  htmlFor="receiptUpload"
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <UploadCloud
                    size={20}
                    style={{
                      color: "var(--primary)",
                      marginBottom: "4px",
                    }}
                  />
                  <div style={{ fontSize: "11px" }}>
                    {receiptFile
                      ? receiptFile.name
                      : "Drag & Drop or Click Upload"}
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div className="stock-modal-footer">
            <button
              className="pos-btn outline"
              style={{ flex: 1 }}
              onClick={() => setShowExpenseModal(false)}
            >
              Cancel
            </button>
            <button
              className="pos-btn teal"
              style={{ flex: 2 }}
              disabled={expenseSaving || !expenseAmount}
              onClick={async () => {
                if (!expenseAmount || Number(expenseAmount) <= 0) {
                  showToast("Enter a valid amount", "error");
                  return;
                }
                setExpenseSaving(true);
                try {
                  await api.post("accounting/expenses", {
                    category: expenseCategory,
                    amount: Number(expenseAmount),
                    description: expenseDescription || undefined,
                  });
                  showToast("Expense Saved", "success");
                  setShowExpenseModal(false);
                  setExpenseAmount("");
                  setExpenseDescription("");
                  setReceiptFile(null);
                  fetchPnL();
                } catch (err) {
                  showToast(
                    err.response?.data?.error || "Failed to save expense",
                    "error",
                  );
                } finally {
                  setExpenseSaving(false);
                }
              }}
            >
              {expenseSaving ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="pnl-summary-card">
        <div className="pnl-col-left">
          <div className="pnl-row">
            <span className="pnl-label">REVENUE</span>
            <span className="pnl-val" style={{ color: "var(--primary)" }}>
              ₹{(summary.revenue || 0).toLocaleString()}
            </span>
          </div>
          <div className="pnl-row">
            <span className="pnl-label">– Cost of Goods</span>
            <span className="pnl-val" style={{ color: "var(--info)" }}>
              ₹{(summary.cogs || 0).toLocaleString()} ({summary.cogsPct || 0}%)
            </span>
          </div>
          <div className="pnl-row total">
            <span className="pnl-label">GROSS PROFIT</span>
            <span
              className="pnl-val"
              style={{ color: "var(--success)", fontSize: "20px" }}
            >
              ₹{(summary.grossProfit || 0).toLocaleString()} (
              {summary.grossProfitPct || 0}%)
            </span>
          </div>
          <div className="pnl-row">
            <span className="pnl-label">– Expenses</span>
            <span className="pnl-val" style={{ color: "var(--warning)" }}>
              ₹{(summary.expenses || 0).toLocaleString()} (
              {summary.expensePct || 0}%)
            </span>
          </div>
          <div className="pnl-row total">
            <span className="pnl-label">NET PROFIT</span>
            <span className="pnl-val large">
              ₹{(summary.netProfit || 0).toLocaleString()}
            </span>
          </div>
          <div
            style={{
              color: "var(--primary)",
              fontWeight: 800,
              fontSize: "14px",
            }}
          >
            {summary.netMargin || 0}% NET MARGIN
          </div>
        </div>

        <div
          className="pnl-col-right"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            className="donut-visual"
            style={{
              background: `conic-gradient(var(--primary) 0% ${Math.max(0, summary.netMargin || 0)}%, var(--info) ${Math.max(0, summary.netMargin || 0)}% ${Math.min(100, (summary.cogsPct || 0) + Math.max(0, summary.netMargin || 0))}%, var(--warning) ${Math.min(100, (summary.cogsPct || 0) + Math.max(0, summary.netMargin || 0))}% ${Math.min(100, (summary.expensePct || 0) + (summary.cogsPct || 0) + Math.max(0, summary.netMargin || 0))}%, var(--success) ${Math.min(100, (summary.expensePct || 0) + (summary.cogsPct || 0) + Math.max(0, summary.netMargin || 0))}% 100%)`,
              width: "180px",
              height: "180px",
            }}
          >
            <div className="donut-inner-text" style={{ fontSize: "24px" }}>
              {summary.netMargin || 0}%
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              width: "100%",
              marginTop: "32px",
            }}
          >
            <div className="legend-item">
              <div
                className="legend-dot"
                style={{ background: "var(--primary)" }}
              />
              <span>Net Profit</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-dot"
                style={{ background: "var(--info)" }}
              />
              <span>COGS</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-dot"
                style={{ background: "var(--warning)" }}
              />
              <span>Expenses</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-dot"
                style={{ background: "var(--success)" }}
              />
              <span>Gross</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pos-card" style={{ marginTop: "24px" }}>
        <div className="pos-card-title">
          <span>Expense Breakdown</span>
          <button
            className="pos-btn teal"
            style={{ padding: "6px 12px", fontSize: "12px" }}
            onClick={() => setShowExpenseModal(true)}
          >
            <Plus size={14} /> Add Expense
          </button>
        </div>
        <div className="expense-categories" style={{ marginTop: "20px" }}>
          {expensesDistribution.length === 0 ? (
            <div
              className="result-meta"
              style={{ textAlign: "center", padding: "40px 0", width: "100%" }}
            >
              No operational expenses logged for this range.
            </div>
          ) : (
            expensesDistribution.map((c, i) => (
              <div key={i} className="expense-cat-card">
                <div
                  className="cat-icon-box"
                  style={{
                    background: `${c.color || "var(--info)"}15`,
                    color: c.color || "var(--info)",
                  }}
                >
                  <Briefcase size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="cat-name">{c.name}</div>
                  <div className="cat-amount">
                    ₹{(c.amount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="cat-pct">{c.percentage || 0}%</div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showExpenseModal && renderExpenseModal()}
      </AnimatePresence>
    </>
  );
}
