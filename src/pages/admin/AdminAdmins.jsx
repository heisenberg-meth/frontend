import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../services/admin.service";
import { Plus, Trash2 } from "lucide-react";
const ROLE_COLORS = {
  ROOT_ADMIN: "#ef4444",
  ADMIN: "#3b82f6",
  SUPPORT: "#22c55e",
  SALES: "#f59e0b",
  FINANCE: "#8b5cf6"
};
export default function AdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "SUPPORT",
    permissions: ""
  });
  const fetchAdmins = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const res = await adminApi.getAdmins({
        page,
        limit: 20
      });
      if (res.success) {
        setAdmins(res.data || []);
        setTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => {
    Promise.resolve().then(() => fetchAdmins());
  }, [fetchAdmins]);
  const handleCreate = async e => {
    e.preventDefault();
    try {
      await adminApi.createAdmin({
        ...form,
        permissions: form.permissions ? form.permissions.split(",").map(s => s.trim()) : []
      });
      setShowForm(false);
      setForm({
        email: "",
        password: "",
        name: "",
        role: "SUPPORT",
        permissions: ""
      });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to create admin");
    }
  };
  const handleDelete = async id => {
    if (!confirm("Delete this admin user?")) return;
    try {
      await adminApi.deleteAdmin(id);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to delete");
    }
  };
  return <div className="admin-page">
      <div className="admin-toolbar">
        <button className="admin-btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Admin
        </button>
      </div>

      {showForm && <form className="admin-form" onSubmit={handleCreate}>
          <div className="admin-form-row">
            <><label htmlFor="field_7boho3" className="sr-only">Name</label><input placeholder="Name" value={form.name} onChange={e => setForm({
            ...form,
            name: e.target.value
          })} required id="field_7boho3" /></>
            <><label htmlFor="field_xx0ad1" className="sr-only">Email</label><input type="email" placeholder="Email" value={form.email} onChange={e => setForm({
            ...form,
            email: e.target.value
          })} required id="field_xx0ad1" /></>
          </div>
          <div className="admin-form-row">
            <><label htmlFor="field_5g401e" className="sr-only">Password (min 8 chars)</label><input type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={e => setForm({
            ...form,
            password: e.target.value
          })} required minLength={8} id="field_5g401e" /></>
            <select value={form.role} onChange={e => setForm({
          ...form,
          role: e.target.value
        })}>
              <option value="SUPPORT">Support</option>
              <option value="SALES">Sales</option>
              <option value="FINANCE">Finance</option>
              <option value="ADMIN">Admin</option>
              <option value="ROOT_ADMIN">Root Admin</option>
            </select>
          </div>
          <><label htmlFor="field_4ppx9y" className="sr-only">Permissions (comma-separated)</label><input placeholder="Permissions (comma-separated)" value={form.permissions} onChange={e => setForm({
          ...form,
          permissions: e.target.value
        })} id="field_4ppx9y" /></>
          <div className="admin-form-actions">
            <button className="admin-btn" type="submit">
              Create Admin
            </button>
            <button className="admin-btn-outline" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr>
                <td colSpan={8} className="admin-empty">
                  Loading...
                </td>
              </tr> : admins.length === 0 ? <tr>
                <td colSpan={8} className="admin-empty">
                  No admin users found
                </td>
              </tr> : admins.map(a => <tr key={a.id}>
                  <td>
                    <strong>{a.name}</strong>
                  </td>
                  <td>{a.email}</td>
                  <td>
                    <span className="admin-badge" style={{
                background: ROLE_COLORS[a.role] || "#666"
              }}>
                      {a.role}
                    </span>
                  </td>
                  <td>
                    <small>{(a.permissions || []).join(", ") || "—"}</small>
                  </td>
                  <td>
                    {a.isActive ? <span className="admin-status admin-status-active">
                        ACTIVE
                      </span> : <span className="admin-status admin-status-blocked">
                        INACTIVE
                      </span>}
                  </td>
                  <td>
                    {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : "Never"}
                  </td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="admin-actions-cell">
                    <button className="admin-icon-btn danger" title="Delete" onClick={() => handleDelete(a.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>)}
          </tbody>
        </table>
      </div>

      {total > 20 && <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>}
    </div>;
}