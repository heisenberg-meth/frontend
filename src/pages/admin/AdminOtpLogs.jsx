import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../services/admin.service";
import { Filter, Search, Eye, X } from "lucide-react";
import { TableHeader } from "../../components/common/TableHeader.jsx";
const STATUS_COLORS = {
  GENERATED: {
    bg: "#1e3a8a",
    text: "#93c5fd",
  },
  VERIFIED: {
    bg: "#14532d",
    text: "#86efac",
  },
  EXPIRED: {
    bg: "#422006",
    text: "#fde68a",
  },
  FAILED_INVALID_OTP: {
    bg: "#450a0a",
    text: "#fca5a5",
  },
  FAILED_MAX_ATTEMPTS: {
    bg: "#450a0a",
    text: "#fca5a5",
  },
};
function AdminOtpLogsSection1({ loading, logs }) {
  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <TableHeader
          columns={["Time", "User", "Email", "Purpose", "OTP", "Status"]}
        />
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="admin-loading">
                Loading...
              </td>
            </tr>
          ) : logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="admin-empty">
                No OTP logs found
              </td>
            </tr>
          ) : (
            logs.map((log) => {
              const statusColor = STATUS_COLORS[log.status] || {
                bg: "#1f2937",
                text: "#9ca3af",
              };
              return (
                <tr key={log.id}>
                  <td className="admin-cell-time">
                    {new Date(log.createdAt).toLocaleString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td>{log.user?.name || "-"}</td>
                  <td>{log.email}</td>
                  <td>
                    <span className="admin-badge">{log.purpose}</span>
                  </td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                    }}
                  >
                    {log.status === "GENERATED"
                      ? "••••••"
                      : log.status === "VERIFIED"
                        ? "✓"
                        : "-"}
                  </td>
                  <td>
                    <span
                      className="admin-status-badge"
                      style={{
                        background: statusColor.bg,
                        color: statusColor.text,
                      }}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
function AdminOtpLogsSection2({
  debugEmail,
  setDebugEmail,
  handleDebugLookup,
  debugOtp,
}) {
  return (
    <div
      className="admin-section"
      style={{
        marginTop: 24,
      }}
    >
      <h3 className="admin-section-title">
        <Eye size={16} /> OTP Debug Lookup
      </h3>
      <p className="admin-section-desc">
        Look up the latest generated OTP for a user (only available if LOG_OTP
        is enabled).
      </p>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <>
          <label htmlFor="field_n90yzt" className="sr-only">
            Enter user email...
          </label>
          <input
            type="email"
            placeholder="Enter user email..."
            value={debugEmail}
            onChange={(e) => setDebugEmail(e.target.value)}
            style={{
              flex: 1,
              maxWidth: 400,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--outline-variant)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 14,
            }}
            id="field_n90yzt"
          />
        </>
        <button
          className="admin-btn"
          onClick={handleDebugLookup}
          disabled={!debugEmail}
        >
          Lookup
        </button>
      </div>
      {debugOtp && (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--outline-variant)",
          }}
        >
          <p>
            <strong>Email:</strong> {debugOtp.email}
          </p>
          <p>
            <strong>OTP:</strong>{" "}
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--primary)",
              }}
            >
              {debugOtp.otp}
            </span>
          </p>
          <p>
            <strong>Purpose:</strong> {debugOtp.purpose}
          </p>
          <p>
            <strong>Expires:</strong>{" "}
            {debugOtp.expiresAt
              ? new Date(debugOtp.expiresAt).toLocaleString("en-IN")
              : "N/A"}
          </p>
          <p>
            <strong>Generated:</strong>{" "}
            {new Date(debugOtp.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
      )}
    </div>
  );
}
export default function AdminOtpLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [debugOtp, setDebugOtp] = useState(null);
  const [debugEmail, setDebugEmail] = useState("");
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 50,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (purposeFilter) params.purpose = purposeFilter;
      const res = await adminApi.getOtpLogs(params);
      if (res.success) {
        setLogs(res.data || []);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, purposeFilter]);
  useEffect(() => {
    Promise.resolve().then(() => fetchLogs());
  }, [fetchLogs]);
  const handleDebugLookup = async () => {
    if (!debugEmail) return;
    try {
      const res = await adminApi.getLatestOtp(debugEmail);
      if (res.success) {
        setDebugOtp(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const totalPages = Math.ceil(total / 50);
  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div
          className="admin-filter-group"
          style={{
            flex: 1,
            maxWidth: 300,
          }}
        >
          <Search size={16} />
          <>
            <label htmlFor="field_1mjjhp" className="sr-only">
              Search by email...
            </label>
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              id="field_1mjjhp"
            />
          </>
          {search && (
            <button
              aria-label="Close"
              className="admin-filter-clear"
              onClick={() => setSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="admin-filter-group">
          <Filter size={16} />
          <select
            aria-label="select field"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="GENERATED">Generated</option>
            <option value="VERIFIED">Verified</option>
            <option value="EXPIRED">Expired</option>
            <option value="FAILED_INVALID_OTP">Failed (Invalid)</option>
            <option value="FAILED_MAX_ATTEMPTS">Failed (Max Attempts)</option>
          </select>
        </div>
        <div className="admin-filter-group">
          <Filter size={16} />
          <select
            aria-label="select field"
            value={purposeFilter}
            onChange={(e) => {
              setPurposeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Purposes</option>
            <option value="PASSWORD_RESET">Password Reset</option>
            <option value="VERIFICATION">Verification</option>
            <option value="DEVICE_VERIFICATION">Device Verification</option>
          </select>
        </div>
      </div>

      <AdminOtpLogsSection1 loading={loading} logs={logs} />

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      <AdminOtpLogsSection2
        debugEmail={debugEmail}
        setDebugEmail={setDebugEmail}
        handleDebugLookup={handleDebugLookup}
        debugOtp={debugOtp}
      />
    </div>
  );
}
