import { useState, useEffect, useCallback, useRef } from "react";
import { adminApi } from "../../services/admin.service";
import { Search, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { safeNumber } from "../../utils/number.js";
import toast from "react-hot-toast";
const STATUS_COLORS = {
  SUCCESS: {
    bg: "#22c55e",
  },
  FAILED: {
    bg: "#ef4444",
  },
  PENDING: {
    bg: "#f59e0b",
  },
  REFUNDED: {
    bg: "#8b5cf6",
  },
  CANCELLED: {
    bg: "#6b7280",
  },
  INITIATED: {
    bg: "#3b82f6",
  },
};
export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);
  const fetchPayments = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
      };
      if (searchRef.current) params.search = searchRef.current;
      if (filterStatus) params.status = filterStatus;
      const res = await adminApi.listPayments(params);
      if (res.success) {
        setPayments(res.data || []);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);
  useEffect(() => {
    Promise.resolve().then(() => fetchPayments());
  }, [fetchPayments]);
  const handleRefund = async (id) => {
    const reason = prompt("Refund reason:");
    if (!reason) return;
    try {
      await adminApi.refundPayment(id, reason);
      toast.success("Refund processed");
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process refund");
    }
  };
  const handleStatusChange = async (id, status) => {
    try {
      await adminApi.updatePaymentStatus(id, status);
      toast.success(`Payment status updated to ${status}`);
      fetchPayments();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update payment status",
      );
    }
  };
  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <form
          className="admin-search"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchPayments();
          }}
        >
          <Search size={16} />
          <>
            <label htmlFor="field_wy022d" className="sr-only">
              Search by transaction ID, order ID, shop...
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by transaction ID, order ID, shop..."
              id="field_wy022d"
            />
          </>
        </form>
        <div className="admin-filter-group">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Shop</th>
              <th>Transaction ID</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="admin-empty">
                  Loading...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.tenant?.name || "—"}</strong>
                  </td>
                  <td>
                    <code className="admin-fp">
                      {(p.transactionId || p.razorpayPaymentId || p.id).slice(
                        0,
                        16,
                      )}
                      ...
                    </code>
                  </td>
                  <td>
                    <strong>₹{safeNumber(p.amount).toLocaleString()}</strong>
                  </td>
                  <td>{p.paymentMethod || p.paymentProvider || "—"}</td>
                  <td>
                    <span
                      className="admin-badge"
                      style={{
                        background: STATUS_COLORS[p.status]?.bg || "#666",
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="admin-actions-cell">
                    {p.status === "SUCCESS" && (
                      <button
                        className="admin-icon-btn warn"
                        title="Refund"
                        onClick={() => handleRefund(p.id)}
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                    {p.status === "PENDING" && (
                      <>
                        <button
                          className="admin-icon-btn success"
                          title="Mark Paid"
                          onClick={() => handleStatusChange(p.id, "SUCCESS")}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          className="admin-icon-btn danger"
                          title="Mark Failed"
                          onClick={() => handleStatusChange(p.id, "FAILED")}
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
