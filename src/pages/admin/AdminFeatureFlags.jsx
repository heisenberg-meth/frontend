import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.service";
import { Plus, ToggleLeft, ToggleRight, Edit3 } from "lucide-react";

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: "", name: "", description: "", targetType: "ALL", targetIds: "" });

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFeatureFlags();
      if (res.success) setFlags(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFlags(); }, []);

  const handleToggle = async (id, current) => {
    await adminApi.toggleFeatureFlag(id, !current);
    fetchFlags();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createFeatureFlag({
        ...form,
        targetIds: form.targetIds ? form.targetIds.split(",").map((s) => s.trim()) : [],
      });
      setShowForm(false);
      setForm({ key: "", name: "", description: "", targetType: "ALL", targetIds: "" });
      fetchFlags();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <button className="admin-btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Flag
        </button>
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleCreate}>
          <div className="admin-form-row">
            <input placeholder="Key (e.g. AI_MODULE)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required />
            <input placeholder="Name (e.g. AI Module)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="admin-form-row">
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
              <option value="ALL">All</option>
              <option value="PLAN">By Plan</option>
              <option value="SHOP">By Shop</option>
            </select>
          </div>
          {form.targetType !== "ALL" && (
            <input placeholder="Target IDs (comma-separated)" value={form.targetIds} onChange={(e) => setForm({ ...form, targetIds: e.target.value })} />
          )}
          <div className="admin-form-actions">
            <button className="admin-btn" type="submit">Create</button>
            <button className="admin-btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Name</th>
              <th>Description</th>
              <th>Target</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="admin-empty">Loading...</td></tr>
            ) : flags.length === 0 ? (
              <tr><td colSpan={7} className="admin-empty">No feature flags created yet</td></tr>
            ) : flags.map((f) => (
              <tr key={f.id}>
                <td><code>{f.key}</code></td>
                <td><strong>{f.name}</strong></td>
                <td><small>{f.description || "—"}</small></td>
                <td>{f.targetType || "ALL"}</td>
                <td>
                  {f.enabled
                    ? <span className="admin-status admin-status-active">ENABLED</span>
                    : <span className="admin-status admin-status-blocked">DISABLED</span>}
                </td>
                <td>{new Date(f.updatedAt).toLocaleDateString()}</td>
                <td>
                  <button className="admin-icon-btn" onClick={() => handleToggle(f.id, f.enabled)}>
                    {f.enabled ? <ToggleRight size={20} color="#22c55e" /> : <ToggleLeft size={20} color="#666" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
