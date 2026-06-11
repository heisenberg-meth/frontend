import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.service";
import { Search, ShieldAlert, CheckCircle, Eye } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
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

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <form className="admin-search" onSubmit={handleSearch}>
          <Search size={16} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone or shop..."
          />
        </form>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Shop / Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Branches</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="admin-empty">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} className="admin-empty">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name || "N/A"}</strong>
                  <small>{u.email}</small>
                </td>
                <td>{u.email}</td>
                <td>{u.phone || "—"}</td>
                <td>
                  <span className={`admin-status admin-status-${(u.status || "active").toLowerCase()}`}>
                    {u.status || "ACTIVE"}
                  </span>
                </td>
                <td>{u.subscription?.plan?.name || "Trial"}</td>
                <td>{u._count?.branches || 0}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="admin-actions-cell">
                  <button className="admin-icon-btn" title="View" onClick={() => setSelectedUser(u)}>
                    <Eye size={16} />
                  </button>
                  {u.status === "ACTIVE" ? (
                    <button className="admin-icon-btn warn" title="Suspend" onClick={() => handleStatusChange(u.id, "SUSPENDED")}>
                      <ShieldAlert size={16} />
                    </button>
                  ) : (
                    <button className="admin-icon-btn success" title="Activate" onClick={() => handleStatusChange(u.id, "ACTIVE")}>
                      <CheckCircle size={16} />
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
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Shop Details</h3>
            <pre>{JSON.stringify(selectedUser, null, 2)}</pre>
            <button className="admin-btn" onClick={() => setSelectedUser(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
