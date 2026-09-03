import { useState, useEffect, useCallback, useRef } from "react";
import { adminApi } from "../../services/admin.service";
import { downloadCsv } from "../../utils/exportCsv";
import { Search, ShieldOff, ShieldCheck, Unlink, Download } from "lucide-react";
import toast from "react-hot-toast";
import { TableHeader } from "../../components/common/TableHeader.jsx";
const getRiskBadge = (score) => {
  if (score >= 80)
    return (
      <span
        className="admin-badge"
        style={{
          background: "#dc2626",
        }}
      >
        Critical
      </span>
    );
  if (score >= 50)
    return (
      <span
        className="admin-badge"
        style={{
          background: "#f59e0b",
        }}
      >
        High
      </span>
    );
  if (score >= 20)
    return (
      <span
        className="admin-badge"
        style={{
          background: "#6366f1",
        }}
      >
        Medium
      </span>
    );
  return (
    <span
      className="admin-badge"
      style={{
        background: "#22c55e",
      }}
    >
      Low
    </span>
  );
};
const daysBetween = (a, b) =>
  Math.max(1, Math.ceil((new Date(b) - new Date(a)) / 86400000));
export default function AdminDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);
  const fetchDevices = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
      };
      if (searchRef.current) params.search = searchRef.current;
      const res = await adminApi.getDevices(params);
      if (res.success) {
        setDevices(res.data || []);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => {
    Promise.resolve().then(() => fetchDevices());
  }, [fetchDevices]);
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDevices();
  };
  const handleBlock = async (id) => {
    if (!confirm("Block this device?")) return;
    try {
      await adminApi.blockDevice(id, "Admin action");
      toast.success("Device blocked");
      fetchDevices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to block device");
    }
  };
  const handleUnblock = async (id) => {
    try {
      await adminApi.unblockDevice(id);
      toast.success("Device unblocked");
      fetchDevices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unblock device");
    }
  };
  const handleUnlink = async (id) => {
    if (!confirm("Unlink this device? It will be blocked and disassociated."))
      return;
    try {
      await adminApi.unlinkDevice(id);
      toast.success("Device unlinked");
      fetchDevices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unlink");
    }
  };
  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <form className="admin-search" onSubmit={handleSearch}>
          <Search size={16} />
          <>
            <label htmlFor="field_bunx4s" className="sr-only">
              Search by fingerprint, browser, OS, IP...
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by fingerprint, browser, OS, IP..."
              id="field_bunx4s"
            />
          </>
        </form>
        <button
          onClick={() =>
            downloadCsv(
              devices.map((d) => ({
                Fingerprint: d.fingerprintHash,
                "Browser/OS": `${d.browser || ""} / ${d.os || ""}`,
                IP: d.ipAddress || "",
                "Risk Score": d.riskScore,
                Status: d.isBlocked ? "Blocked" : "Active",
                "First Seen": new Date(d.firstSeen).toLocaleDateString(),
                "Last Seen": new Date(d.lastSeen).toLocaleString(),
              })),
              "devices-export",
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

      <div className="admin-table-container">
        <table className="admin-table">
          <TableHeader
            columns={[
              "Fingerprint",
              "Shop",
              "Browser / OS",
              "IP",
              "Risk",
              "Login Days",
              "Status",
              "First Seen",
              "Last Seen",
              "Actions",
            ]}
          />
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="admin-empty">
                  Loading...
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={10} className="admin-empty">
                  No devices found
                </td>
              </tr>
            ) : (
              devices.map((d) => (
                <tr key={d.id}>
                  <td>
                    <code className="admin-fp">
                      {d.fingerprintHash?.slice(0, 16)}...
                    </code>
                  </td>
                  <td
                    style={{
                      fontSize: 12,
                    }}
                  >
                    {d.shopId?.slice(0, 8)}
                  </td>
                  <td>
                    <small>
                      {d.browser || "—"} / {d.os || "—"}
                    </small>
                  </td>
                  <td>{d.ipAddress || "—"}</td>
                  <td>{getRiskBadge(d.riskScore)}</td>
                  <td
                    style={{
                      fontSize: 12,
                      color: "#888",
                    }}
                  >
                    {daysBetween(d.firstSeen, d.lastSeen)}
                  </td>
                  <td>
                    {d.isBlocked ? (
                      <span className="admin-status admin-status-blocked">
                        BLOCKED
                      </span>
                    ) : (
                      <span className="admin-status admin-status-active">
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td>{new Date(d.firstSeen).toLocaleDateString()}</td>
                  <td>{new Date(d.lastSeen).toLocaleString()}</td>
                  <td className="admin-actions-cell">
                    {d.isBlocked ? (
                      <button
                        aria-label="Unblock"
                        className="admin-icon-btn success"
                        title="Unblock"
                        onClick={() => handleUnblock(d.id)}
                      >
                        <ShieldCheck size={16} />
                      </button>
                    ) : (
                      <button
                        aria-label="Block"
                        className="admin-icon-btn warn"
                        title="Block"
                        onClick={() => handleBlock(d.id)}
                      >
                        <ShieldOff size={16} />
                      </button>
                    )}
                    <button
                      aria-label="Unlink"
                      className="admin-icon-btn"
                      style={{
                        color: "#8b5cf6",
                      }}
                      title="Unlink"
                      onClick={() => handleUnlink(d.id)}
                    >
                      <Unlink size={14} />
                    </button>
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
