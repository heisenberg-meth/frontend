import { useState, useEffect } from "react";
import {
  Calculator,
  Download,
  FileText,
  Plus,
  Search,
  Trash2,
  Edit3,
  TrendingUp,
  Coins,
  X,
  Receipt,
  FileJson,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { safeNumber } from "../utils/number.js";
import {
  getAccountingData,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../services/reports.service";
import { SUPPORTED_EXPENSE_CATEGORIES } from "../constants/expenseCategories.js";
function Spinner({ size = 14 }) {
  return (
    <Loader2
      size={size}
      style={{
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}
function AccountingTaxSection1({ totalExpenses, expenses, gstData }) {
  return (
    <div className="acc-stats-row">
      <div className="acc-stat-card">
        <div
          className="acc-stat-icon"
          style={{
            backgroundColor: "var(--primary-glow)",
            color: "var(--primary)",
          }}
        >
          <Coins size={20} />
        </div>
        <div>
          <span className="acc-stat-label">TOTAL EXPENSES</span>
          <div className="acc-stat-value">
            ₹{totalExpenses.toLocaleString("en-IN")}
          </div>
        </div>
      </div>
      <div className="acc-stat-card">
        <div
          className="acc-stat-icon"
          style={{
            backgroundColor: "rgba(59,130,246,0.1)",
            color: "var(--info)",
          }}
        >
          <TrendingUp size={20} />
        </div>
        <div>
          <span className="acc-stat-label">THIS MONTH</span>
          <div className="acc-stat-value">
            ₹
            {expenses
              .filter((e) => {
                const d = new Date(e.date);
                const now = new Date();
                return (
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear()
                );
              })
              .reduce((s, e) => s + (e.amount || 0), 0)
              .toLocaleString("en-IN")}
          </div>
        </div>
      </div>
      <div className="acc-stat-card">
        <div
          className="acc-stat-icon"
          style={{
            backgroundColor: "rgba(245,158,11,0.1)",
            color: "var(--warning)",
          }}
        >
          <FileJson size={20} />
        </div>
        <div>
          <span className="acc-stat-label">GST LIABILITY</span>
          <div className="acc-stat-value">
            ₹
            {gstData
              .reduce((s, g) => s + (g.net || 0), 0)
              .toLocaleString("en-IN")}
          </div>
        </div>
      </div>
      <div className="acc-stat-card">
        <div
          className="acc-stat-icon"
          style={{
            backgroundColor: "rgba(16,185,129,0.1)",
            color: "var(--success)",
          }}
        >
          <Receipt size={20} />
        </div>
        <div>
          <span className="acc-stat-label">RECEIPTS</span>
          <div className="acc-stat-value">
            {expenses.filter((e) => e.hasReceipt || e.receipt).length}
          </div>
        </div>
      </div>
    </div>
  );
}
function AccountingTaxSection2({
  activeTab,
  expenses,
  totalExpenses,
  gstData,
  search,
  setSearch,
  loading,
  filteredExpenses,
  setEditExpense,
  setExpenseForm,
  setShowExpenseModal,
  handleDeleteExpense,
  showToast,
}) {
  return (
    <div className="acc-content-card">
      <AccountingTaxSection2Section1
        activeTab={activeTab}
        search={search}
        setSearch={setSearch}
        loading={loading}
        filteredExpenses={filteredExpenses}
        setEditExpense={setEditExpense}
        setExpenseForm={setExpenseForm}
        setShowExpenseModal={setShowExpenseModal}
        handleDeleteExpense={handleDeleteExpense}
      />

      <AccountingTaxSection2Section2
        activeTab={activeTab}
        loading={loading}
        gstData={gstData}
        showToast={showToast}
      />

      {activeTab === "summary" && (
        <div
          style={{
            padding: "32px",
          }}
        >
          <h3
            style={{
              marginBottom: "24px",
            }}
          >
            Tax Summary
          </h3>
          <div className="acc-summary-grid">
            <div className="acc-summary-card">
              <span>Total Revenue</span>
              <div className="acc-summary-value">
                ₹
                {(expenses.length > 0
                  ? expenses.reduce((s, e) => s + (e.amount || 0), 0) * 3
                  : 0
                ).toLocaleString("en-IN")}
              </div>
            </div>
            <div className="acc-summary-card">
              <span>Total Expenses</span>
              <div className="acc-summary-value">
                ₹{totalExpenses.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="acc-summary-card">
              <span>GST Collected</span>
              <div className="acc-summary-value">
                ₹
                {gstData
                  .reduce((s, g) => s + (g.net || 0), 0)
                  .toLocaleString("en-IN")}
              </div>
            </div>
            <div className="acc-summary-card">
              <span>Net Profit</span>
              <div
                className="acc-summary-value"
                style={{
                  color: "var(--success)",
                }}
              >
                ₹
                {(
                  (expenses.length > 0
                    ? expenses.reduce((s, e) => s + (e.amount || 0), 0) * 3
                    : 0) - totalExpenses
                ).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function AccountingTaxSection3({
  showExpenseModal,
  setShowExpenseModal,
  editExpense,
  expenseForm,
  setExpenseForm,
  handleSaveExpense,
  saving,
}) {
  return (
    <AnimatePresence>
      {showExpenseModal && (
        <div
          role="button"
          tabIndex={0}
          className="modal-overlay"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
          onClick={() => setShowExpenseModal(false)}
        >
          <m.div
            className="modal-content"
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 480,
            }}
            role="presentation"
          >
            <div className="modal-header">
              <h3>{editExpense ? "Edit Expense" : "Add Expense"}</h3>
              <button
                className="modal-close-btn"
                aria-label="Close modal"
                onClick={() => setShowExpenseModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body-p">
              <div className="form-group">
                <label htmlFor="field_gxfb8w">Category</label>
                <select
                  id="field_gxfb8w"
                  className="pos-input"
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="">Select Category</option>
                  {SUPPORTED_EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="field_w5tsrt">Description</label>
                <input
                  id="field_w5tsrt"
                  required
                  className="pos-input"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Description..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="field_q81tdh">Amount (₹)</label>
                <input
                  id="field_q81tdh"
                  required
                  className="pos-input"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label htmlFor="field_uhywql">Payment Method</label>
                <select
                  id="field_uhywql"
                  className="pos-input"
                  value={expenseForm.paymentMethod}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      paymentMethod: e.target.value,
                    })
                  }
                >
                  <option value="">Select</option>
                  {["Cash", "UPI", "Bank Transfer", "Card"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input
                    required
                    type="checkbox"
                    checked={expenseForm.receipt}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        receipt: e.target.checked,
                      })
                    }
                  />{" "}
                  Has Receipt
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="pos-btn outline"
                onClick={() => setShowExpenseModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn teal"
                onClick={handleSaveExpense}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner size={16} /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> {editExpense ? "Update" : "Add"}{" "}
                    Expense
                  </>
                )}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function AccountingTaxSection2Section1({
  activeTab,
  search,
  setSearch,
  loading,
  filteredExpenses,
  setEditExpense,
  setExpenseForm,
  setShowExpenseModal,
  handleDeleteExpense,
}) {
  return (
    activeTab === "expenses" && (
      <>
        <div className="acc-toolbar">
          <div className="search-input-wrapper">
            <Search size={18} />
            <>
              <label htmlFor="field_s0agua" className="sr-only">
                Search expenses...
              </label>
              <input
                required
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="field_s0agua"
              />
            </>
          </div>
        </div>
        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--text-dim)",
            }}
          >
            <Spinner size={20} /> Loading expenses...
          </div>
        ) : (
          <table className="acc-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th>AMOUNT</th>
                <th>PAYMENT</th>
                <th>RECEIPT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--text-dim)",
                    }}
                  >
                    No expenses found. Add your first expense →
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id}>
                    <td>
                      {e.date || e.expenseDate
                        ? new Date(e.date || e.expenseDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )
                        : "—"}
                    </td>
                    <td>
                      <span className="acc-cat-badge">
                        {typeof e.category === "object"
                          ? e.category?.name || "—"
                          : e.category || "—"}
                      </span>
                    </td>
                    <td>{e.description || e.notes || e.title || "—"}</td>
                    <td
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      ₹{(e.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td>{e.paymentMethod || e.via || "—"}</td>
                    <td>
                      {e.hasReceipt || e.receipt || e.attachmentUrl ? (
                        <CheckCircle
                          size={16}
                          style={{
                            color: "var(--success)",
                          }}
                        />
                      ) : (
                        <X
                          size={16}
                          style={{
                            color: "var(--text-dim)",
                          }}
                        />
                      )}
                    </td>
                    <td>
                      <div className="acc-actions">
                        <button
                          className="acc-action-icon"
                          aria-label="Edit expense"
                          onClick={() => {
                            setEditExpense(e);
                            setExpenseForm({
                              date: e.date || "",
                              category: e.category || "",
                              description: e.description || "",
                              amount: String(e.amount || ""),
                              paymentMethod: e.paymentMethod || e.via || "",
                              receipt: e.hasReceipt || e.receipt || false,
                            });
                            setShowExpenseModal(true);
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="acc-action-icon danger"
                          aria-label="Delete expense"
                          onClick={() => handleDeleteExpense(e.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </>
    )
  );
}
function AccountingTaxSection2Section2({
  activeTab,
  loading,
  gstData,
  showToast,
}) {
  return (
    activeTab === "gst" && (
      <>
        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--text-dim)",
            }}
          >
            <Spinner size={20} /> Loading GST data...
          </div>
        ) : (
          <table className="acc-table">
            <thead>
              <tr>
                <th>GST RATE</th>
                <th>SALES</th>
                <th>OUTPUT CGST</th>
                <th>OUTPUT SGST</th>
                <th>INPUT CGST</th>
                <th>INPUT SGST</th>
                <th>NET LIABILITY</th>
              </tr>
            </thead>
            <tbody>
              {gstData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--text-dim)",
                    }}
                  >
                    No GST data available
                  </td>
                </tr>
              ) : (
                gstData.map((g) => (
                  <tr key={g.inputCgst}>
                    <td
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      {g.rate || "—"}
                    </td>
                    <td>₹{(g.sales || 0).toLocaleString("en-IN")}</td>
                    <td>
                      ₹{(g.outC || g.outputCgst || 0).toLocaleString("en-IN")}
                    </td>
                    <td>
                      ₹{(g.outS || g.outputSgst || 0).toLocaleString("en-IN")}
                    </td>
                    <td>
                      ₹{(g.inC || g.inputCgst || 0).toLocaleString("en-IN")}
                    </td>
                    <td>
                      ₹{(g.inS || g.inputSgst || 0).toLocaleString("en-IN")}
                    </td>
                    <td
                      style={{
                        fontWeight: 700,
                        color: "var(--primary)",
                      }}
                    >
                      ₹{(g.net || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        <div
          style={{
            padding: "16px",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            className="pos-btn outline"
            onClick={() => showToast("Generating GSTR-1...", "info")}
          >
            <FileText size={16} /> GSTR-1
          </button>
          <button
            className="pos-btn outline"
            onClick={() => showToast("Generating GSTR-3B...", "info")}
          >
            <FileText size={16} /> GSTR-3B
          </button>
          <button
            className="pos-btn teal"
            onClick={() => showToast("Exporting GST report...", "success")}
          >
            <Download size={16} /> Export GST Report
          </button>
        </div>
      </>
    )
  );
}
export default function AccountingTax({ showToast }) {
  const [activeTab, setActiveTab] = useState("expenses");
  const [expenses, setExpenses] = useState([]);
  const [gstData, setGstData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    date: "",
    category: "",
    description: "",
    amount: "",
    paymentMethod: "",
    receipt: false,
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const loadAccounting = async () => {
    setLoading(true);
    try {
      const res = await getAccountingData();
      const data = res.data.data || res.data;
      const expensesList = Array.isArray(data?.expenses)
        ? data.expenses
        : Array.isArray(data)
          ? data
          : [];
      setExpenses(expensesList);
      if (data?.gst) setGstData(Array.isArray(data.gst) ? data.gst : []);
    } catch {
      showToast("Failed to load accounting data", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        const res = await getAccountingData();
        if (!mounted) return;
        const data = res.data.data || res.data;
        const expensesList = Array.isArray(data?.expenses)
          ? data.expenses
          : Array.isArray(data)
            ? data
            : [];
        setExpenses(expensesList);
        setGstData(Array.isArray(data?.gst) ? data.gst : []);
      } catch {
        if (mounted) {
          showToast("Failed to load accounting data", "error");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [showToast]);
  const handleSaveExpense = async () => {
    if (!expenseForm.category || !expenseForm.amount) {
      showToast("Category and amount required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: expenseForm.date || new Date().toISOString(),
        category: expenseForm.category,
        description: expenseForm.description,
        amount: safeNumber(expenseForm.amount),
        paymentMethod: expenseForm.paymentMethod,
        hasReceipt: expenseForm.receipt,
      };
      if (editExpense) {
        await updateExpense(editExpense.id, payload);
        showToast("Expense updated", "success");
      } else {
        await createExpense(payload);
        showToast("Expense added", "success");
      }
      await loadAccounting();
      setShowExpenseModal(false);
      setEditExpense(null);
      setExpenseForm({
        date: "",
        category: "",
        description: "",
        amount: "",
        paymentMethod: "",
        receipt: false,
      });
    } catch (err) {
      const errData = err.response?.data;
      const errorObj = errData?.error;
      const details = errorObj?.details || errData?.errors || [];
      if (Array.isArray(details) && details.length > 0) {
        const firstErr = details[0];
        showToast(
          `Validation Error (${firstErr.field}): ${firstErr.message}`,
          "error",
        );
      } else {
        const msg =
          typeof errorObj === "object"
            ? errorObj.message
            : errorObj ||
              errData?.message ||
              err.message ||
              "Failed to save expense";
        showToast(msg, "error");
      }
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      showToast("Expense deleted", "success");
      await loadAccounting();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to delete", "error");
    }
  };
  const filteredExpenses = expenses.filter(
    (e) =>
      (e.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.description || "").toLowerCase().includes(search.toLowerCase()),
  );
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  return (
    <div className="acc-container">
      <div className="acc-header">
        <div className="acc-title-group">
          <h2>
            <Calculator
              size={28}
              style={{
                color: "var(--primary)",
              }}
            />{" "}
            Accounting & Tax
          </h2>
          <p>
            Expense tracking, GST reports, and tax compliance for your pharmacy
          </p>
        </div>
        <div className="acc-header-actions">
          <button
            className="acc-action-btn secondary"
            onClick={() => showToast("Exporting...", "info")}
          >
            <Download size={14} /> Export
          </button>
          <button
            className="acc-action-btn primary"
            onClick={() => {
              setEditExpense(null);
              setExpenseForm({
                date: "",
                category: "",
                description: "",
                amount: "",
                paymentMethod: "",
                receipt: false,
              });
              setShowExpenseModal(true);
            }}
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      <AccountingTaxSection1
        totalExpenses={totalExpenses}
        expenses={expenses}
        gstData={gstData}
      />

      <div className="acc-tabs">
        {["expenses", "gst", "summary"].map((tab) => (
          <button
            key={tab}
            className={`acc-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "expenses"
              ? "Expenses"
              : tab === "gst"
                ? "GST Reports"
                : "Tax Summary"}
          </button>
        ))}
      </div>

      <AccountingTaxSection2
        activeTab={activeTab}
        expenses={expenses}
        totalExpenses={totalExpenses}
        gstData={gstData}
        search={search}
        setSearch={setSearch}
        loading={loading}
        filteredExpenses={filteredExpenses}
        setEditExpense={setEditExpense}
        setExpenseForm={setExpenseForm}
        setShowExpenseModal={setShowExpenseModal}
        handleDeleteExpense={handleDeleteExpense}
        showToast={showToast}
      />

      <AccountingTaxSection3
        showExpenseModal={showExpenseModal}
        setShowExpenseModal={setShowExpenseModal}
        editExpense={editExpense}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        handleSaveExpense={handleSaveExpense}
        saving={saving}
      />
    </div>
  );
}
