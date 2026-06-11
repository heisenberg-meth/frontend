import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.service";
import { Search, ShieldOff, ShieldCheck, AlertTriangle } from "lucide-react";

export default function AdminDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
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
  };

  useEffect(() => { fetchDevices(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDevices();
  };

  const handleBlock = async (id) => {
    if (!confirm("Block this device?")) return;
    await adminApi.blockDevice(id, "Admin action");
    fetchDevices();
  };

  const handleUnblock = async (id) => {
    await adminApi.unblockDevice(id);
    fetchDevices();
  };

  const getRiskBadge = (score) => {
    if (score >= 80) return <span className="admin-badge" style={{ background: "#dc2626" }}>Critical</span>;
    if (score >= 50) return <span className="admin-badge" style={{ background: "#f59e0b" }}>High</span>;
    if (score >= 20) return <span className="admin-badge" style={{ background: "#6366f1" }}>Medium</span>;
    return <span className="admin-badge" style={{ background: "#22c55e" }}>Low</span>;
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <form className="admin-search" onSubmit={handleSearch}>
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by fingerprint, browser, OS, IP..." />
        </form>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Fingerprint</th>
              <th>Shop</th>
              <th>Browser / OS</th>
              <th>IP</th>
              <th>Risk</th>
              <th>Status</th>
              <th>First Seen</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="admin-empty">Loading...</td></tr>
            ) : devices.length === 0 ? (
              <tr><td colSpan={9} className="admin-empty">No devices found</td></tr>
            ) : devices.map((d) => (
              <tr key={d.id}>
                <td><code className="admin-fp">{d.fingerprintHash?.slice(0, 16)}...</code></td>
                <td>{d.shopId?.slice(0, 8)}</td>
                <td><small>{d.browser || "—"} / {d.os || "—"}</small></td>
                <td>{d.ipAddress || "—"}</td>
                <td>{getRiskBadge(d.riskScore)}</td>
                <td>
                  {d.isBlocked
                    ? <span className="admin-status admin-status-blocked">BLOCKED</span>
                    : <span className="admin-status admin-status-active">ACTIVE</span>}
                </td>
                <td>{new Date(d.firstSeen).toLocaleDateString()}</td>
                <td>{new Date(d.lastSeen).toLocaleString()}</td>
                <td className="admin-actions-cell">
                  {d.isBlocked ? (
                    <button className="admin-icon-btn success" title="Unblock" onClick={() => handleUnblock(d.id)}>
                      <ShieldCheck size={16} />
                    </button>
                  ) : (
                    <button className="admin-icon-btn warn" title="Block" onClick={() => handleBlock(d.id)}>
                      <ShieldOff size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
