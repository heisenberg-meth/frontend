import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../services/admin.service";
import { Filter, Calendar } from "lucide-react";

const ACTION_COLORS = {
  ADMIN_LOGIN: "#3b82f6",
  ADMIN_LOGOUT: "#6366f1",
  USER_CREATED: "#22c55e",
  USER_UPDATED: "#22c55e",
  USER_DELETED: "#ef4444",
  USER_SUSPENDED: "#f59e0b",
  USER_ACTIVATED: "#22c55e",
  USER_BLOCKED: "#dc2626",
  SHOP_CREATED: "#22c55e",
  SHOP_SUSPENDED: "#f59e0b",
  SHOP_BLACKLISTED: "#dc2626",
  DEVICE_BLOCKED: "#dc2626",
  DEVICE_UNBLOCKED: "#22c55e",
  SUBSCRIPTION_EXTENDED: "#22c55e",
  SUBSCRIPTION_CANCELLED: "#ef4444",
  FEATURE_FLAG_TOGGLED: "#8b5cf6",
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ action: "", targetType: "" });

  const fetchLogs = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const params = { page, limit: 50, ...filters };
      if (filters.action === "") delete params.action;
      if (filters.targetType === "") delete params.targetType;
      const res = await adminApi.getAuditLogs(params);
      if (res.success) {
        setLogs(res.data || []);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    Promise.resolve().then(() => fetchLogs());
  }, [fetchLogs]);

  const uniqActions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div className="admin-filter-group">
          <Filter size={16} />
          <select
            value={filters.action}
            onChange={(e) => {
              setFilters((f) => ({ ...f, action: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">All Actions</option>
            {uniqActions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-filter-group">
          <Calendar size={16} />
          <select
            value={filters.targetType}
            onChange={(e) => {
              setFilters((f) => ({ ...f, targetType: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="ADMIN">Admin</option>
            <option value="TENANT">Tenant</option>
            <option value="DEVICE">Device</option>
            <option value="FEATURE_FLAG">Feature Flag</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Target</th>
              <th>Admin</th>
              <th>IP</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="admin-cell-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span
                      className="admin-badge"
                      style={{
                        background: ACTION_COLORS[log.action] || "#666",
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <small>
                      {log.targetType} / {log.targetId?.slice(0, 8)}
                    </small>
                  </td>
                  <td>
                    <code>{log.adminUserId?.slice(0, 8)}</code>
                  </td>
                  <td>{log.ipAddress || "—"}</td>
                  <td className="admin-cell-mono">
                    {log.metadata
                      ? JSON.stringify(log.metadata).slice(0, 60)
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {Math.ceil(total / 50)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 50)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
