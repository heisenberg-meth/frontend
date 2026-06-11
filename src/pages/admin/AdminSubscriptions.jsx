import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.service";
import { Clock, AlertTriangle, CheckCircle, RefreshCw, Search, Filter } from "lucide-react";

export default function AdminSubscriptions() {
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    adminApi.getExpiringSubscriptions(filterDays)
      .then((res) => { if (res.success) setExpiring(res.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterDays]);

  const getExpiryBadge = (date) => {
    const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return <span className="admin-badge" style={{ background: "#dc2626" }}>EXPIRED</span>;
    if (diff <= 3) return <span className="admin-badge" style={{ background: "#ef4444" }}>{diff}d left</span>;
    if (diff <= 7) return <span className="admin-badge" style={{ background: "#f59e0b" }}>{diff}d left</span>;
    return <span className="admin-badge" style={{ background: "#22c55e" }}>{diff}d left</span>;
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div className="admin-filter-group">
          <Filter size={16} />
          <select value={filterDays} onChange={(e) => setFilterDays(Number(e.target.value))}>
            <option value={3}>Expiring in 3 days</option>
            <option value={7}>Expiring in 7 days</option>
            <option value={14}>Expiring in 14 days</option>
            <option value={30}>Expiring in 30 days</option>
          </select>
        </div>
        <button className="admin-btn-icon" onClick={() => setFilterDays(filterDays)}>
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="admin-summary-cards">
        <div className="admin-mini-card">
          <AlertTriangle size={20} color="#f59e0b" />
          <div>
            <strong>{expiring.filter(s => new Date(s.endDate) <= new Date()).length}</strong>
            <span>Expired</span>
          </div>
        </div>
        <div className="admin-mini-card">
          <Clock size={20} color="#3b82f6" />
          <div>
            <strong>{expiring.filter(s => new Date(s.endDate) > new Date()).length}</strong>
            <span>Expiring Soon</span>
          </div>
        </div>
        <div className="admin-mini-card">
          <CheckCircle size={20} color="#22c55e" />
          <div>
            <strong>{expiring.length}</strong>
            <span>Total in Range</span>
          </div>
        </div>
      </div>

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
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="admin-empty">Loading...</td></tr>
            ) : expiring.length === 0 ? (
              <tr><td colSpan={8} className="admin-empty">No subscriptions expiring in this range</td></tr>
            ) : expiring.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.tenant?.name || "N/A"}</strong></td>
                <td>{s.tenant?.email || "—"}</td>
                <td>{s.plan?.name || "—"}</td>
                <td>₹{Number(s.plan?.price || 0).toLocaleString()}</td>
                <td>
                  <span className={`admin-status admin-status-${s.status.toLowerCase()}`}>
                    {s.status}
                  </span>
                </td>
                <td>{s.startDate ? new Date(s.startDate).toLocaleDateString() : "—"}</td>
                <td>{s.endDate ? new Date(s.endDate).toLocaleDateString() : "—"}</td>
                <td>{getExpiryBadge(s.endDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
