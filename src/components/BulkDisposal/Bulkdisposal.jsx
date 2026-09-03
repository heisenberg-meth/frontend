import {
  AlertTriangle,
  Trash2,
  Download,
  Search,
  X,
  CheckCircle2,
  IndianRupee,
  Calendar,
  Package,
  Layers,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { format } from "date-fns";
import { safeNumber } from "../../utils/number.js";

const headers = ["Medicine", "Batch", "Expiry Date", "Quantity", "Value"];

function exportCSV(data) {
  if (!data || data.length === 0) return;
  const rows = data.map((b) => [
    b.medicineName,
    b.batchNumber,
    format(new Date(b.expiryDate), "MMM-yyyy"),
    b.quantity,
    b.totalValue,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], {
    type: "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `disposal-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkDisposalSection1({ overview, expiryMetrics }) {
  return (
    overview && (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          className="stat-card-v2"
          style={{
            cursor: "default",
          }}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">Expired Products</span>
            <div className="stat-v2-icon danger bg-rose-500/10 text-rose-500">
              <Package size={14} />
            </div>
          </div>
          <div className="stat-v2-val danger text-rose-500">
            {expiryMetrics
              ? (expiryMetrics.expiredProducts ?? expiryMetrics.expired)
              : overview.totalExpiredProducts}
          </div>
        </div>
        <div
          className="stat-card-v2"
          style={{
            cursor: "default",
          }}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">Total Units</span>
            <div className="stat-v2-icon warning bg-yellow-500/10 text-yellow-500">
              <Layers size={14} />
            </div>
          </div>
          <div className="stat-v2-val warning text-yellow-500">
            {overview.totalUnits}
          </div>
        </div>
        <div
          className="stat-card-v2"
          style={{
            cursor: "default",
          }}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">Inventory Loss</span>
            <div className="stat-v2-icon danger bg-rose-500/10 text-rose-500">
              <IndianRupee size={14} />
            </div>
          </div>
          <div className="stat-v2-val danger text-rose-500">
            {"\u20B9"}
            {safeNumber(overview.totalInventoryValue).toLocaleString("en-IN")}
          </div>
        </div>
        <div
          className="stat-card-v2"
          style={{
            cursor: "default",
          }}
        >
          <div className="stat-v2-header">
            <span className="stat-v2-label">MRP Loss</span>
            <div className="stat-v2-icon danger bg-rose-500/10 text-rose-500">
              <IndianRupee size={14} />
            </div>
          </div>
          <div className="stat-v2-val danger text-rose-500">
            {"\u20B9"}
            {safeNumber(overview.totalMrpLoss).toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    )
  );
}
export function BulkDisposalSection2({
  setSearchQuery,
  setShowConfirmModal,
  selectedData,
  selected,
  toggleSelect,
  selectedStats,
  filtered,
  resetAll,
  batches,
  result,
  selectAll,
  toggleSelectAll,
  searchQuery,
}) {
  return result ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        gap: 16,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--success)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckCircle2 size={32} color="white" />
      </div>
      <h3
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginTop: 8,
        }}
      >
        Disposal Processed
      </h3>
      <div
        style={{
          background: "var(--surface-container)",
          padding: 24,
          borderRadius: 12,
          border: "1px solid var(--outline-variant)",
          width: "100%",
          maxWidth: 480,
          textAlign: "left",
        }}
      >
        <h4
          style={{
            marginBottom: 16,
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Disposal Summary
        </h4>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              color: "var(--text-muted)",
            }}
          >
            Disposed
          </span>
          <span
            style={{
              fontWeight: 600,
              color: "var(--success)",
            }}
          >
            {result.disposedCount || 0}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              color: "var(--text-muted)",
            }}
          >
            Skipped
          </span>
          <span
            style={{
              fontWeight: 600,
              color: result.skippedCount > 0 ? "var(--warning)" : "var(--text)",
            }}
          >
            {result.skippedCount || 0}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              color: "var(--text-muted)",
            }}
          >
            Units Removed
          </span>
          <span
            style={{
              fontWeight: 600,
            }}
          >
            {result.stats?.totalUnits || 0}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              color: "var(--text-muted)",
            }}
          >
            Value Removed
          </span>
          <span
            style={{
              fontWeight: 600,
            }}
          >
            {"\u20B9"}
            {safeNumber(result.stats?.totalValue || 0).toLocaleString("en-IN")}
          </span>
        </div>

        {result.skippedCount > 0 && result.items && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--outline-variant)",
            }}
          >
            <h5
              style={{
                fontSize: 13,
                marginBottom: 8,
                color: "var(--text-muted)",
              }}
            >
              Skipped Reasons:
            </h5>
            <ul
              style={{
                fontSize: 13,
                paddingLeft: 16,
                margin: 0,
                color: "var(--text-dim)",
              }}
            >
              {result.items.reduce((acc, item) => {
                if (item.status === "SKIPPED") {
                  acc.push(
                    <li
                      key={item.reason}
                      style={{
                        marginBottom: 4,
                      }}
                    >
                      {item.reason || "Unknown reason"}
                    </li>,
                  );
                }
                return acc;
              }, [])}
            </ul>
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 12,
        }}
      >
        <button className="urgent-modal-btn-cancel" onClick={resetAll}>
          Back to Inventory
        </button>
        <button className="urgent-modal-btn-verify" onClick={resetAll}>
          Dispose More
        </button>
      </div>
    </div>
  ) : (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flex: 1,
          }}
        >
          <div
            className="search-box"
            style={{
              maxWidth: 320,
            }}
          >
            <Search size={14} className="search-icon" />
            <>
              <label htmlFor="field_b6lhi9" className="sr-only">
                Search medicine or batch...
              </label>
              <input
                type="text"
                placeholder="Search medicine or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                id="field_b6lhi9"
              />
            </>
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {selected.size > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <button
              className="urgent-disposal-btn"
              style={{
                fontSize: 13,
                padding: "8px 16px",
              }}
              onClick={() => setShowConfirmModal(true)}
            >
              <Trash2
                size={14}
                style={{
                  marginRight: 6,
                }}
              />
              Dispose ({selected.size})
            </button>
            <button
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--outline-variant)",
                background: "var(--surface-container)",
                color: "var(--text-muted)",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onClick={() => exportCSV(selectedData)}
            >
              <Download size={14} />
              Export
            </button>
          </div>
        )}
      </div>

      <div
        className="bento-card"
        style={{
          overflow: "auto",
          padding: 0,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--outline-variant)",
                background: "var(--surface-container)",
              }}
            >
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  width: 40,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  aria-label="Select all batches"
                  style={{
                    accentColor: "var(--primary)",
                    cursor: "pointer",
                  }}
                />
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                }}
              >
                Medicine
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                }}
              >
                Batch
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                }}
              >
                Expiry
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                }}
              >
                Qty
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                }}
              >
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  {batches.length === 0
                    ? "No expired medicines found"
                    : "No results match your search"}
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr
                  key={b.batchId}
                  style={{
                    borderBottom: "1px solid var(--outline-variant)",
                    background: selected.has(b.batchId)
                      ? "var(--overlay-05)"
                      : "transparent",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected.has(b.batchId))
                      e.currentTarget.style.background = "var(--overlay-03)";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected.has(b.batchId))
                      e.currentTarget.style.background = "transparent";
                  }}
                  onClick={() => toggleSelect(b.batchId)}
                >
                  <td
                    style={{
                      padding: "10px 16px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(b.batchId)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(b.batchId);
                      }}
                      aria-label={`Select ${b.medicineName || "batch"}`}
                      style={{
                        accentColor: "var(--primary)",
                        cursor: "pointer",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {b.medicineName}
                    </div>
                    {b.strength && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-dim)",
                        }}
                      >
                        {b.strength} {b.dosageForm || ""}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    {b.batchNumber}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "var(--overlay-10)",
                        color: "var(--danger)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <Calendar size={10} />
                      {format(new Date(b.expiryDate), "MMM-yyyy")}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    {b.quantity}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                    }}
                  >
                    {"\u20B9"}
                    {safeNumber(b.totalValue).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
            padding: "12px 20px",
            borderRadius: 12,
            background: "var(--surface-container)",
            border: "1px solid var(--outline-variant)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 24,
              fontSize: 13,
            }}
          >
            <span>
              <strong>{selected.size}</strong> Medicines Selected
            </span>
            <span>
              <strong>{selectedStats.totalUnits}</strong> Units
            </span>
            <span>
              Value:{" "}
              <strong>
                {"\u20B9"}
                {safeNumber(selectedStats.totalValue).toLocaleString("en-IN")}
              </strong>
            </span>
          </div>
          <button
            className="urgent-disposal-btn"
            style={{
              fontSize: 13,
              padding: "8px 20px",
            }}
            onClick={() => setShowConfirmModal(true)}
          >
            <Trash2
              size={14}
              style={{
                marginRight: 6,
              }}
            />
            Dispose Selected
          </button>
        </div>
      )}
    </>
  );
}
export function BulkDisposalSection3({
  setReason,
  setShowConfirmModal,
  disposing,
  showConfirmModal,
  handleDispose,
  selectedStats,
  selected,
  disposeProgress,
  reason,
}) {
  return (
    <AnimatePresence>
      {showConfirmModal && (
        <div className="modal-overlay">
          <m.div
            role="presentation"
            className="urgent-disposal-modal"
            style={{
              maxWidth: 520,
            }}
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--overlay-10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <AlertTriangle size={24} className="text-rose-500" />
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              Dispose {selected.size} medicines?
            </h3>

            <div
              className="disposal-summary-card compact-summary"
              style={{
                margin: "16px 0",
              }}
            >
              <div>
                <span>Items:</span> <b>{selectedStats.count}</b>
              </div>
              <div>
                <span>Total Units:</span> <b>{selectedStats.totalUnits}</b>
              </div>
              <div>
                <span>Total Value:</span>{" "}
                <b>
                  {"\u20B9"}
                  {safeNumber(selectedStats.totalValue).toLocaleString("en-IN")}
                </b>
              </div>
            </div>

            <div
              className="form-group"
              style={{
                marginBottom: 16,
              }}
            >
              <label
                htmlFor="field_ygyctc"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Reason for Disposal
              </label>
              <select
                id="field_ygyctc"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--outline-variant)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: 13,
                }}
              >
                <option>Expired Stock</option>
                <option>Damaged Stock</option>
                <option>Recalled Batch</option>
                <option>Quality Issue</option>
                <option>Regulatory Disposal</option>
              </select>
            </div>

            <div
              className="disposal-risk-card compact-risk"
              style={{
                marginBottom: 16,
              }}
            >
              <div className="flex gap-3">
                <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-rose-600 mb-1">
                    This action is irreversible.
                  </h4>
                  <p className="text-rose-500/80 text-xs">
                    Disposed stock will be removed from inventory and logged in
                    disposal audit history.
                  </p>
                </div>
              </div>
            </div>

            <div className="urgent-modal-actions sticky-actions">
              <button
                className="urgent-modal-btn-cancel"
                onClick={() => setShowConfirmModal(false)}
                disabled={disposing}
              >
                Cancel
              </button>
              <button
                className="urgent-modal-btn-verify flex items-center justify-center gap-2"
                disabled={disposing}
                onClick={handleDispose}
                style={{
                  opacity: disposing ? 0.6 : 1,
                  cursor: disposing ? "not-allowed" : "pointer",
                }}
              >
                {disposing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Disposing {disposeProgress.current}/{disposeProgress.total}
                    ...
                  </>
                ) : (
                  "Confirm Disposal"
                )}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
