import { useState, useEffect, useCallback, useRef } from "react";
import { adminApi } from "../../services/admin.service";
import { downloadCsv } from "../../utils/exportCsv";
import {
  Clock,
  RefreshCw,
  Search,
  ArrowUpDown,
  XCircle,
  Plus,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { safeNumber } from '../../utils/number.js';


export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionSub, setActionSub] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionValue, setActionValue] = useState("");

  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const fetchSubscriptions = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const res = await adminApi.listSubscriptions({
        status: statusFilter || undefined,
        search: searchRef.current || undefined,
        page,
        limit: 15,
      });
      if (res.success) {
        setSubscriptions(res.data.subscriptions);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    Promise.resolve().then(() => fetchSubscriptions());
  }, [fetchSubscriptions]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSubscriptions();
  };

  const doAction = async (fn, ...args) => {
    try {
      const res = await fn(...args);
      if (res.success) {
        toast.success("Done");
        fetchSubscriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const openAction = (sub, type) => {
    setActionSub(sub);
    setActionType(type);
    setActionValue(type === "extend" ? "30" : type === "renew" ? "365" : "");
  };

  const executeAction = () => {
    if (!actionSub || !actionType) return;
    if (actionType === "extend")
      doAction(adminApi.extendSubscription, actionSub.id, {
        days: safeNumber(actionValue) || 30,
      });
    else if (actionType === "renew")
      doAction(adminApi.renewSubscription, actionSub.id, {
        days: safeNumber(actionValue) || 365,
      });
    else if (actionType === "cancel")
      doAction(adminApi.cancelSubscription, actionSub.id);
    else if (actionType === "upgrade")
      doAction(adminApi.updateSubscription, actionSub.id, {
        planId: actionValue,
      });
    setActionSub(null);
    setActionType(null);
  };

  const totalPages = Math.ceil(total / 15);
  const statusColors = {
    ACTIVE: "#22c55e",
    TRIAL: "#3b82f6",
    GRACE_PERIOD: "#f59e0b",
    EXPIRED: "#ef4444",
    CANCELLED: "#666",
  };

  return (
    <div className="admin-page">
      <h2>
        <Clock size={20} /> Subscriptions
      </h2>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <form
          onSubmit={handleSearch}
          style={{ display: "flex", gap: 8, flex: 1, maxWidth: 400 }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop or email..."
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #333",
              borderRadius: 6,
              background: "#1a1a1a",
              color: "#fff",
            }}
          />
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ padding: "8px 14px" }}
          >
            <Search size={16} />
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #333",
            borderRadius: 6,
            background: "#1a1a1a",
            color: "#fff",
          }}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="TRIAL">Trial</option>
          <option value="GRACE_PERIOD">Grace Period</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <button
          onClick={() =>
            downloadCsv(
              subscriptions.map((s) => ({
                Shop: s.tenant?.name || "",
                Email: s.tenant?.email || "",
                Plan: s.plan?.name || "",
                Price: s.plan?.price || 0,
                Status: s.status,
                Start: s.startDate
                  ? new Date(s.startDate).toLocaleDateString()
                  : "",
                Expiry: s.endDate
                  ? new Date(s.endDate).toLocaleDateString()
                  : "",
              })),
              "subscriptions-export",
            )
          }
          className="admin-btn"
          style={{
            background: "#222",
            color: "#fff",
            padding: "8px 14px",
            fontSize: 12,
          }}
        >
          <Download size={14} /> CSV
        </button>
      </div>

      {loading ? (
        <div className="admin-loading-inline">Loading...</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-empty">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.tenant?.name || "N/A"}</strong>
                      </td>
                      <td>{s.tenant?.email || "—"}</td>
                      <td>{s.plan?.name || "—"}</td>
                      <td>₹{safeNumber(s.plan?.price || 0).toLocaleString()}</td>
                      <td>
                        <span
                          className="admin-badge"
                          style={{
                            background: statusColors[s.status] || "#666",
                          }}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td>
                        {s.startDate
                          ? new Date(s.startDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        {s.endDate
                          ? new Date(s.endDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="admin-icon-btn"
                            style={{ color: "#22c55e" }}
                            title="Renew"
                            onClick={() => openAction(s, "renew")}
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            className="admin-icon-btn"
                            style={{ color: "#3b82f6" }}
                            title="Extend"
                            onClick={() => openAction(s, "extend")}
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            className="admin-icon-btn"
                            style={{ color: "#f59e0b" }}
                            title="Upgrade"
                            onClick={() => openAction(s, "upgrade")}
                          >
                            <ArrowUpDown size={14} />
                          </button>
                          {s.status !== "EXPIRED" &&
                            s.status !== "CANCELLED" && (
                              <button
                                className="admin-icon-btn"
                                style={{ color: "#ef4444" }}
                                title="Cancel"
                                onClick={() => {
                                  if (confirm("Cancel this subscription?"))
                                    doAction(adminApi.cancelSubscription, s.id);
                                }}
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="admin-btn"
                style={{ background: "#222", color: "#fff" }}
              >
                Prev
              </button>
              <span style={{ color: "#888", padding: "8px 12px" }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="admin-btn"
                style={{ background: "#222", color: "#fff" }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {actionSub && actionType && (
        <div
          className="admin-overlay"
          onClick={() => {
            setActionSub(null);
            setActionType(null);
          }}
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <h3>
              {actionType === "renew"
                ? "Renew"
                : actionType === "extend"
                  ? "Extend"
                  : "Change Plan"}{" "}
              — {actionSub.tenant?.name}
            </h3>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>
              Current plan: {actionSub.plan?.name} | Expires:{" "}
              {actionSub.endDate
                ? new Date(actionSub.endDate).toLocaleDateString()
                : "N/A"}
            </p>
            {actionType === "upgrade" ? (
              <div className="admin-form-group">
                <label>New Plan ID</label>
                <input
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  placeholder="Enter planId..."
                />
              </div>
            ) : (
              <div className="admin-form-group">
                <label>Days to {actionType}</label>
                <input
                  type="number"
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  min={1}
                />
              </div>
            )}
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                className="admin-btn"
                style={{ background: "#333", color: "#fff" }}
                onClick={() => {
                  setActionSub(null);
                  setActionType(null);
                }}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={executeAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
