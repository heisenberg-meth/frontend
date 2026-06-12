import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.service";
import { downloadCsv } from "../../utils/exportCsv";
import {
  Search, ShieldAlert, CheckCircle, Eye, XCircle, Ban,
  Building2, Phone, FileText, Award, Calendar, CreditCard,
  Monitor, Users, ShieldCheck, Trash2, Key, Smartphone, RefreshCw, Download,
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  ACTIVE: { bg: "#22c55e", text: "ACTIVE" },
  SUSPENDED: { bg: "#f59e0b", text: "SUSPENDED" },
  EXPIRED: { bg: "#ef4444", text: "EXPIRED" },
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [filterVerified, setFilterVerified] = useState("");
  const [filterBlacklisted, setFilterBlacklisted] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (filterVerified) params.verified = filterVerified;
      if (filterBlacklisted) params.blacklisted = filterBlacklisted;
      const res = await adminApi.getUsers(params);
      if (res.success) {
        setUsers(res.data || []);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleStatusChange = async (id, status) => {
    try {
      await adminApi.updateUserStatus(id, status);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (id) => {
    try {
      await adminApi.verifyTenant(id);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlacklist = async (id) => {
    const reason = prompt("Reason for blacklisting:");
    if (!reason) return;
    try {
      await adminApi.blacklistTenant(id, reason);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblacklist = async (id) => {
    if (!confirm("Remove blacklist for this shop?")) return;
    try {
      await adminApi.unblacklistTenant(id);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelectedUser(id);
    try {
      const res = await adminApi.getTenantDetail(id);
      if (res.success) setDetail(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteUser = async (tenantId, userId, userName) => {
    if (!confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(tenantId, userId);
      toast.success("User deleted");
      openDetail(tenantId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleResetPassword = async (tenantId, userId) => {
    if (!confirm("Reset password for this user? They will receive a temporary password.")) return;
    try {
      const res = await adminApi.resetUserPassword(tenantId, userId);
      if (res.success) toast.success(`Temporary password: ${res.data.tempPassword}`, { duration: 15000 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  const handleResetDevice = async (tenantId, userId) => {
    if (!confirm("Reset all devices for this user? All sessions will be invalidated.")) return;
    try {
      await adminApi.resetUserDevice(tenantId, userId);
      toast.success("User devices reset");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset devices");
    }
  };

  const getGstDisplay = (u) => {
    return u.gstNumber || u.storeProfiles?.[0]?.gstin || "—";
  };

  const getDrugLicenseDisplay = (u) => {
    return u.drugLicenseNumber || u.storeProfiles?.[0]?.drugLicenseNumber || "—";
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <form className="admin-search" onSubmit={handleSearch}>
          <Search size={16} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, GST, license..."
          />
        </form>
        <div className="admin-filter-group">
          <select value={filterVerified} onChange={(e) => { setFilterVerified(e.target.value); setPage(1); }}>
            <option value="">All Shops</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>
        <div className="admin-filter-group">
          <select value={filterBlacklisted} onChange={(e) => { setFilterBlacklisted(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="true">Blacklisted</option>
            <option value="false">Not Blacklisted</option>
          </select>
        </div>
        <button onClick={() => downloadCsv(users.map((u) => ({
          "Shop Name": u.name,
          Email: u.email,
          Phone: u.phone || "",
          GST: u.gstNumber || u.storeProfiles?.[0]?.gstin || "",
          "Drug License": u.drugLicenseNumber || u.storeProfiles?.[0]?.drugLicenseNumber || "",
          Status: u.status,
          Verified: u.blacklisted ? "BLOCKED" : u.isVerified ? "Yes" : "No",
          Plan: u.subscription?.plan?.name || "Trial",
          Created: new Date(u.createdAt).toLocaleDateString(),
        })), "users-export")} className="admin-btn" style={{ background: "#222", color: "#fff", padding: "8px 14px", fontSize: 12 }}>
          <Download size={14} /> CSV
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Shop / Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>GST</th>
              <th>Drug License</th>
              <th>Verification</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Last Login</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="admin-empty">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={10} className="admin-empty">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className={u.blacklisted ? "admin-row-danger" : ""}>
                <td>
                  <strong>{u.name || "N/A"}</strong>
                  <small>{u.email}</small>
                </td>
                <td>{u.email}</td>
                <td>{u.phone || "—"}</td>
                <td><code className="admin-fp">{getGstDisplay(u)}</code></td>
                <td><code className="admin-fp">{getDrugLicenseDisplay(u)}</code></td>
                <td>
                  {u.blacklisted ? (
                    <span className="admin-badge" style={{ background: "#dc2626" }}>BLACKLISTED</span>
                  ) : u.isVerified ? (
                    <span className="admin-badge" style={{ background: "#22c55e" }}>VERIFIED</span>
                  ) : (
                    <span className="admin-badge" style={{ background: "#f59e0b" }}>PENDING</span>
                  )}
                </td>
                <td>
                  <span className={`admin-status admin-status-${(u.status || "active").toLowerCase()}`}>
                    {u.status || "ACTIVE"}
                  </span>
                </td>
                <td>{u.subscription?.plan?.name || "Trial"}</td>
                <td style={{ fontSize: 12, color: "#888" }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "—"}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="admin-actions-cell">
                  <button className="admin-icon-btn" title="View Details" onClick={() => openDetail(u.id)}>
                    <Eye size={16} />
                  </button>
                  {!u.isVerified && !u.blacklisted && (
                    <button className="admin-icon-btn success" title="Verify Shop" onClick={() => handleVerify(u.id)}>
                      <CheckCircle size={16} />
                    </button>
                  )}
                  {u.status === "ACTIVE" ? (
                    <button className="admin-icon-btn warn" title="Suspend" onClick={() => handleStatusChange(u.id, "SUSPENDED")}>
                      <ShieldAlert size={16} />
                    </button>
                  ) : (
                    <button className="admin-icon-btn success" title="Activate" onClick={() => handleStatusChange(u.id, "ACTIVE")}>
                      <CheckCircle size={16} />
                    </button>
                  )}
                  {u.blacklisted ? (
                    <button className="admin-icon-btn success" title="Remove Blacklist" onClick={() => handleUnblacklist(u.id)}>
                      <Ban size={16} />
                    </button>
                  ) : (
                    <button className="admin-icon-btn danger" title="Blacklist" onClick={() => handleBlacklist(u.id)}>
                      <XCircle size={16} />
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

      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => { setSelectedUser(null); setDetail(null); }}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="admin-empty">Loading details...</div>
            ) : detail ? (
              <>
                <div className="admin-modal-header">
                  <h3>{detail.name || "Unnamed Shop"}</h3>
                  <button className="admin-icon-btn" onClick={() => { setSelectedUser(null); setDetail(null); }}>✕</button>
                </div>

                <div className="admin-detail-grid">
                  <div className="admin-detail-section">
                    <h4><Building2 size={16} /> Shop Identity</h4>
                    <div className="admin-detail-rows">
                      <div><span>Email</span><strong>{detail.email}</strong></div>
                      <div><span>Phone</span><strong>{detail.phone || "—"}</strong></div>
                      <div><span>GST Number</span><strong><code>{detail.gstNumber || "—"}</code></strong></div>
                      <div><span>Drug License</span><strong><code>{detail.drugLicenseNumber || "—"}</code></strong></div>
                      <div><span>Address</span><strong>{detail.address || "—"}</strong></div>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4><Award size={16} /> Verification</h4>
                    <div className="admin-detail-rows">
                      <div>
                        <span>Status</span>
                        <strong>
                          {detail.blacklisted ? (
                            <span className="admin-badge" style={{ background: "#dc2626" }}>BLACKLISTED</span>
                          ) : detail.isVerified ? (
                            <span className="admin-badge" style={{ background: "#22c55e" }}>VERIFIED</span>
                          ) : (
                            <span className="admin-badge" style={{ background: "#f59e0b" }}>PENDING VERIFICATION</span>
                          )}
                        </strong>
                      </div>
                      {detail.blacklisted && detail.blacklistReason && (
                        <div><span>Blacklist Reason</span><strong>{detail.blacklistReason}</strong></div>
                      )}
                      {detail.verifiedAt && (
                        <div><span>Verified At</span><strong>{new Date(detail.verifiedAt).toLocaleString()}</strong></div>
                      )}
                      <div><span>Account Status</span><strong>{detail.status}</strong></div>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4><CreditCard size={16} /> Subscription</h4>
                    <div className="admin-detail-rows">
                      <div><span>Plan</span><strong>{detail.subscription?.plan?.name || "Trial"}</strong></div>
                      <div><span>Status</span><strong>{detail.subscription?.status || "NONE"}</strong></div>
                      <div><span>Start</span><strong>{detail.subscription?.startDate ? new Date(detail.subscription.startDate).toLocaleDateString() : "—"}</strong></div>
                      <div><span>Expiry</span><strong>{detail.subscription?.endDate ? new Date(detail.subscription.endDate).toLocaleDateString() : "—"}</strong></div>
                    </div>
                  </div>

                  <div className="admin-detail-section">
                    <h4><Users size={16} /> Users & Devices</h4>
                    <div className="admin-detail-rows">
                      <div><span>Total Users</span><strong>{detail._count?.users || 0}</strong></div>
                      <div><span>Branches</span><strong>{detail._count?.branches || 0}</strong></div>
                      <div><span>Devices</span><strong>{detail.deviceCount || 0}</strong></div>
                      <div><span>Created</span><strong>{new Date(detail.createdAt).toLocaleDateString()}</strong></div>
                    </div>
                  </div>
                </div>

                {detail.devices?.length > 0 && (
                  <div className="admin-detail-section">
                    <h4><Monitor size={16} /> Recent Devices ({detail.deviceCount})</h4>
                    <div className="admin-table-container">
                      <table className="admin-table admin-table-compact">
                        <thead>
                          <tr>
                            <th>Fingerprint</th>
                            <th>Browser</th>
                            <th>OS</th>
                            <th>User</th>
                            <th>Last Seen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.devices.slice(0, 5).map((d) => (
                            <tr key={d.id}>
                              <td><code className="admin-fp">{d.fingerprintId?.slice(0, 16)}...</code></td>
                              <td>{d.browser || "—"}</td>
                              <td>{d.os || "—"}</td>
                              <td>{d.user?.fullName || "—"}</td>
                              <td>{new Date(d.lastSeen).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {detail.users?.length > 0 && (
                  <div className="admin-detail-section">
                    <h4><Users size={16} /> Staff Members</h4>
                    <div className="admin-table-container">
                      <table className="admin-table admin-table-compact">
                        <thead>
                          <tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Joined</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                          {detail.users.map((u) => (
                            <tr key={u.id}>
                              <td>{u.fullName}</td>
                              <td>{u.email}</td>
                              <td>{u.role}</td>
                              <td>{u.phone || "—"}</td>
                              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button className="admin-icon-btn" style={{ color: "#f59e0b" }} title="Reset Password" onClick={() => handleResetPassword(detail.id, u.id)}><Key size={14} /></button>
                                  <button className="admin-icon-btn" style={{ color: "#3b82f6" }} title="Reset Device" onClick={() => handleResetDevice(detail.id, u.id)}><Smartphone size={14} /></button>
                                  <button className="admin-icon-btn" style={{ color: "#ef4444" }} title="Delete User" onClick={() => handleDeleteUser(detail.id, u.id, u.fullName)}><Trash2 size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="admin-modal-actions">
                  {!detail.isVerified && !detail.blacklisted && (
                    <button className="admin-btn" style={{ background: "#22c55e" }} onClick={() => { handleVerify(detail.id); setDetail({ ...detail, isVerified: true }); }}>
                      <CheckCircle size={16} /> Verify Shop
                    </button>
                  )}
                  {detail.blacklisted ? (
                    <button className="admin-btn" style={{ background: "#22c55e" }} onClick={() => { handleUnblacklist(detail.id); setDetail({ ...detail, blacklisted: false, blacklistReason: null }); }}>
                      <Ban size={16} /> Remove Blacklist
                    </button>
                  ) : (
                    <button className="admin-btn" style={{ background: "#dc2626" }} onClick={() => {
                      const reason = prompt("Reason for blacklisting:");
                      if (reason) { handleBlacklist(detail.id); setDetail({ ...detail, blacklisted: true, blacklistReason: reason }); }
                    }}>
                      <XCircle size={16} /> Blacklist Shop
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="admin-empty">Failed to load details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}