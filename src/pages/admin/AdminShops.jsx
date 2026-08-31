import { useState, useEffect, useCallback, useRef } from "react";
import { adminApi } from "../../services/admin.service";
import { downloadCsv } from "../../utils/exportCsv";
import {
  Search,
  Eye,
  CheckCircle,
  Ban,
  ShieldAlert,
  Trash2,
  Store,
  Download,
} from "lucide-react";

export default function AdminShops() {
  const [shops, setShops] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");

  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const fetchShops = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const res = await adminApi.listShops({
        search: searchRef.current || undefined,
        status: statusFilter || undefined,
        page,
        limit: 15,
      });
      if (res.success) {
        setShops(res.data.shops);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    Promise.resolve().then(() => fetchShops());
  }, [fetchShops]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchShops();
  };

  const doAction = async (fn, ...args) => {
    try {
      const res = await fn(...args);
      if (res.success) fetchShops();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleExport = () => {
    downloadCsv(
      shops.map((s) => ({
        "Shop Name": s.name || s.shopName,
        Email: s.email,
        Phone: s.phone || "",
        GST: s.gstNumber || s.storeProfiles?.[0]?.gstin || "",
        "Drug License":
          s.drugLicenseNumber || s.storeProfiles?.[0]?.drugLicenseNumber || "",
        Status: s.status,
        Verified: s.blacklisted ? "BLOCKED" : s.isVerified ? "Yes" : "No",
        Users: s._count?.users || 0,
        Created: new Date(s.createdAt).toLocaleDateString(),
      })),
      "shops-export",
    );
  };

  const totalPages = Math.ceil(total / 15);

  const statusColors = {
    ACTIVE: "#22c55e",
    SUSPENDED: "#f59e0b",
    INACTIVE: "#666",
    EXPIRED: "#ef4444",
  };

  return (
    <div className="admin-page">
      <h2>
        <Store size={20} /> Shops Management
      </h2>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <form
          onSubmit={handleSearch}
          style={{ display: "flex", gap: 8, flex: 1, maxWidth: 400 }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shops..."
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #333",
              borderRadius: 6,
              background: "#1a1a1a",
              color: "#fff",
            }}
          />
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ padding: "8px 14px" }}
          >
            <Search size={16} />
          </button>
        </form>
        <button
          onClick={handleExport}
          className="admin-btn"
          style={{
            background: "#222",
            color: "#fff",
            padding: "8px 14px",
            fontSize: 12,
          }}
        >
          <Download size={14} /> Export CSV
        </button>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #333",
            borderRadius: 6,
            background: "#1a1a1a",
            color: "#fff",
          }}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading-inline">Loading...</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>GST</th>
                  <th>Drug License</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="admin-empty">
                      No shops found
                    </td>
                  </tr>
                ) : (
                  shops.map((shop) => (
                    <tr key={shop.id}>
                      <td style={{ fontWeight: 600 }}>
                        {shop.name || shop.shopName}
                      </td>
                      <td>{shop.name || "—"}</td>
                      <td>{shop.email}</td>
                      <td>{shop.phone || "—"}</td>
                      <td style={{ fontSize: 12 }}>
                        {shop.gstNumber ||
                          shop.storeProfiles?.[0]?.gstin ||
                          "—"}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {shop.drugLicenseNumber ||
                          shop.storeProfiles?.[0]?.drugLicenseNumber ||
                          "—"}
                      </td>
                      <td>
                        {shop.blacklisted ? (
                          <span
                            className="admin-badge"
                            style={{ background: "#dc2626" }}
                          >
                            BLOCKED
                          </span>
                        ) : shop.isVerified ? (
                          <span
                            className="admin-badge"
                            style={{ background: "#22c55e" }}
                          >
                            VERIFIED
                          </span>
                        ) : (
                          <span
                            className="admin-badge"
                            style={{ background: "#f59e0b" }}
                          >
                            PENDING
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className="admin-badge"
                          style={{
                            background: statusColors[shop.status] || "#666",
                          }}
                        >
                          {shop.status}
                        </span>
                      </td>
                      <td>{shop._count?.users || 0}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() =>
                              setSelected(
                                selected?.id === shop.id ? null : shop,
                              )
                            }
                            className="admin-icon-btn"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          {!shop.isVerified && !shop.blacklisted && (
                            <button
                              onClick={() =>
                                doAction(adminApi.verifyTenant, shop.id)
                              }
                              className="admin-icon-btn"
                              style={{ color: "#22c55e" }}
                              title="Approve"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {shop.status !== "SUSPENDED" ? (
                            <button
                              onClick={() =>
                                doAction(adminApi.suspendShop, shop.id)
                              }
                              className="admin-icon-btn"
                              style={{ color: "#f59e0b" }}
                              title="Suspend"
                            >
                              <ShieldAlert size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                doAction(
                                  adminApi.updateUserStatus,
                                  shop.id,
                                  "ACTIVE",
                                )
                              }
                              className="admin-icon-btn"
                              style={{ color: "#22c55e" }}
                              title="Activate"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {!shop.blacklisted ? (
                            <button
                              onClick={() => {
                                setSelected(shop);
                                setReason("");
                              }}
                              className="admin-icon-btn"
                              style={{ color: "#ef4444" }}
                              title="Block"
                            >
                              <Ban size={14} />
                            </button>
                          ) : null}
                          <button
                            onClick={() =>
                              doAction(adminApi.deleteShop, shop.id)
                            }
                            className="admin-icon-btn"
                            style={{ color: "#ef4444" }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="admin-btn"
                style={{ background: "#222", color: "#fff" }}
              >
                Prev
              </button>
              <span style={{ color: "#888", padding: "8px 12px" }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="admin-btn"
                style={{ background: "#222", color: "#fff" }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {selected &&
        !selected.blacklistReason &&
        selected !== null &&
        reason !== undefined && (
          <div
            role="button"
            tabIndex={0}
            className="admin-overlay"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.currentTarget.click();
              }
            }}
            onClick={() => {
              setSelected(null);
              setReason("");
            }}
          >
            <div
              role="button"
              tabIndex={0}
              className="admin-modal"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.currentTarget.click();
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Block Shop — {selected?.name || selected?.shopName}</h3>
              <div className="admin-form-group">
                <label htmlFor="blockReason">Reason</label>
                <textarea
                  id="blockReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Enter block reason..."
                />
              </div>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  className="admin-btn"
                  style={{ background: "#333", color: "#fff" }}
                  onClick={() => {
                    setSelected(null);
                    setReason("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={async () => {
                    await doAction(
                      adminApi.blacklistTenant,
                      selected.id,
                      reason,
                    );
                    setSelected(null);
                    setReason("");
                  }}
                >
                  Block
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
