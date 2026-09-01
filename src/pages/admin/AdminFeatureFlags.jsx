import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../services/admin.service";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    key: "",
    name: "",
    description: "",
    targetType: "ALL",
    targetIds: "",
  });
  const fetchFlags = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const res = await adminApi.getFeatureFlags();
      if (res.success) setFlags(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    Promise.resolve().then(() => fetchFlags());
  }, [fetchFlags]);
  const handleToggle = async (id, current) => {
    try {
      await adminApi.toggleFeatureFlag(id, !current);
      toast.success("Feature flag updated");
      fetchFlags();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to toggle feature flag",
      );
    }
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createFeatureFlag({
        ...form,
        targetIds: form.targetIds
          ? form.targetIds.split(",").map((s) => s.trim())
          : [],
      });
      setShowForm(false);
      setForm({
        key: "",
        name: "",
        description: "",
        targetType: "ALL",
        targetIds: "",
      });
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
            <>
              <label htmlFor="field_q7r4h1" className="sr-only">
                Key (e.g. AI_MODULE)
              </label>
              <input
                placeholder="Key (e.g. AI_MODULE)"
                value={form.key}
                onChange={(e) =>
                  setForm({
                    ...form,
                    key: e.target.value,
                  })
                }
                required
                id="field_q7r4h1"
              />
            </>
            <>
              <label htmlFor="field_a7hjp3" className="sr-only">
                Name (e.g. AI Module)
              </label>
              <input
                placeholder="Name (e.g. AI Module)"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
                id="field_a7hjp3"
              />
            </>
          </div>
          <div className="admin-form-row">
            <>
              <label htmlFor="field_9hoz02" className="sr-only">
                Description
              </label>
              <input
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                id="field_9hoz02"
              />
            </>
            <select
              value={form.targetType}
              onChange={(e) =>
                setForm({
                  ...form,
                  targetType: e.target.value,
                })
              }
            >
              <option value="ALL">All</option>
              <option value="PLAN">By Plan</option>
              <option value="SHOP">By Shop</option>
            </select>
          </div>
          {form.targetType !== "ALL" && (
            <>
              <label htmlFor="field_vdq7is" className="sr-only">
                Target IDs (comma-separated)
              </label>
              <input
                placeholder="Target IDs (comma-separated)"
                value={form.targetIds}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targetIds: e.target.value,
                  })
                }
                id="field_vdq7is"
              />
            </>
          )}
          <div className="admin-form-actions">
            <button className="admin-btn" type="submit">
              Create
            </button>
            <button
              className="admin-btn-outline"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
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
              <tr>
                <td colSpan={7} className="admin-empty">
                  Loading...
                </td>
              </tr>
            ) : flags.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty">
                  No feature flags created yet
                </td>
              </tr>
            ) : (
              flags.map((f) => (
                <tr key={f.id}>
                  <td>
                    <code>{f.key}</code>
                  </td>
                  <td>
                    <strong>{f.name}</strong>
                  </td>
                  <td>
                    <small>{f.description || "—"}</small>
                  </td>
                  <td>{f.targetType || "ALL"}</td>
                  <td>
                    {f.enabled ? (
                      <span className="admin-status admin-status-active">
                        ENABLED
                      </span>
                    ) : (
                      <span className="admin-status admin-status-blocked">
                        DISABLED
                      </span>
                    )}
                  </td>
                  <td>{new Date(f.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="admin-icon-btn"
                      onClick={() => handleToggle(f.id, f.enabled)}
                    >
                      {f.enabled ? (
                        <ToggleRight size={20} color="#22c55e" />
                      ) : (
                        <ToggleLeft size={20} color="#666" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
