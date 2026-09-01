import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  useRef,
} from "react";
import {
  AlertTriangle,
  Bell,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Layers,
  TrendingUp,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  Info,
  Plus,
  Eye,
  Edit3,
  Save,
  CheckSquare,
  Square,
  Archive,
  Truck,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../api";
import { safeNumber } from "../utils/number.js";
import {
  disposeInventory,
  bulkAssignBatchSupplier,
  backfillBatchSupplier,
  exportBatchesWithoutSupplier,
  importSupplierAssignments,
} from "../services/inventory.service";
import { getSuppliers } from "../services/suppliers.service";
import ClearExpiredButton from "./ClearExpiredButton";
const INV_FILTER_OPTIONS = [
  {
    label: "All Batches",
    value: "ALL",
  },
  {
    label: "Expired",
    value: "EXPIRED",
  },
  {
    label: "Critical (< 7 days)",
    value: "< 7 DAYS",
  },
  {
    label: "Warning (7-30 days)",
    value: "7-30 DAYS",
  },
  {
    label: "Attention (30-90 days)",
    value: "30-90 DAYS",
  },
  {
    label: "Safe (90+ days)",
    value: "SAFE",
  },
];
function getDays(expiryDate) {
  const exp = new Date(expiryDate);
  const today = new Date();
  const diff =
    Date.UTC(exp.getFullYear(), exp.getMonth(), exp.getDate()) -
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
function computeStatus(days, qty) {
  if (qty <= 0) return "safe";
  if (days < 0) return "expired";
  if (days <= 7) return "danger";
  if (days <= 30) return "warning";
  return "safe";
}
function ExpiryBatchIntelligenceSection1({
  setFilter,
  setShowBulkSupplierModal,
  setShowDisposeModal,
  setSearchQuery,
  selectedBatchIds,
  toggleBatch,
  handleAction,
  setSelectedBatchIds,
  activeTab,
  loading,
  timelineCounts,
  handleExportNoSupplier,
  handleBackfillSuppliers,
  backfilling,
  handleBulkReturnToSupplier,
  bulkReturning,
  searchQuery,
  expiredBatches,
  toggleSelectAll,
  filteredBatches,
}) {
  return activeTab === "timeline" && loading ? (
    <div className="empty-state">Loading batches...</div>
  ) : (
    activeTab === "timeline" && (
      <>
        <div className="visual-timeline-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                fontFamily: "Outfit",
                fontWeight: 700,
                fontSize: "16px",
              }}
            >
              Stock Aging Breakdown
            </div>
            <div className="result-meta">
              {timelineCounts.total} batches tracked
            </div>
          </div>
          <div className="timeline-bar">
            <button
              type="button"
              className="timeline-segment expired"
              style={{
                flex: Math.max(
                  (timelineCounts.expired / timelineCounts.total) * 100,
                  5,
                ),
              }}
              onClick={() => setFilter("EXPIRED")}
              title={`EXPIRED: ${timelineCounts.expired}`}
            >
              <span>EXPIRED {timelineCounts.expired}</span>
            </button>
            <button
              type="button"
              className="timeline-segment urg-7"
              style={{
                flex: Math.max(
                  (timelineCounts.urg7 / timelineCounts.total) * 100,
                  5,
                ),
              }}
              onClick={() => setFilter("< 7 DAYS")}
              title={`< 7 DAYS: ${timelineCounts.urg7}`}
            >
              <span>&lt; 7D {timelineCounts.urg7}</span>
            </button>
            <button
              type="button"
              className="timeline-segment urg-30"
              style={{
                flex: Math.max(
                  (timelineCounts.urg30 / timelineCounts.total) * 100,
                  5,
                ),
              }}
              onClick={() => setFilter("7-30 DAYS")}
              title={`7-30 DAYS: ${timelineCounts.urg30}`}
            >
              <span>7-30D {timelineCounts.urg30}</span>
            </button>
            <button
              type="button"
              className="timeline-segment urg-90"
              style={{
                flex: Math.max(
                  (timelineCounts.urg90 / timelineCounts.total) * 100,
                  5,
                ),
              }}
              onClick={() => setFilter("30-90 DAYS")}
              title={`30-90 DAYS: ${timelineCounts.urg90}`}
            >
              <span>30-90D {timelineCounts.urg90}</span>
            </button>
            <button
              type="button"
              className="timeline-segment safe"
              style={{
                flex: Math.max(
                  (timelineCounts.safe / timelineCounts.total) * 100,
                  5,
                ),
              }}
              onClick={() => setFilter("SAFE")}
              title={`SAFE: ${timelineCounts.safe}`}
            >
              <span>SAFE {timelineCounts.safe}</span>
            </button>
          </div>
        </div>

        <div className="table-controls-row">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <button
              className="pos-btn outline"
              style={{
                padding: "6px 14px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onClick={handleExportNoSupplier}
            >
              Export CSV
            </button>
            <button
              className="pos-btn outline"
              style={{
                padding: "6px 14px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onClick={handleBackfillSuppliers}
              disabled={backfilling}
            >
              {backfilling ? "Backfilling..." : "Auto-Link Suppliers"}
            </button>
            {selectedBatchIds.size > 0 && (
              <>
                <button
                  className="pos-btn"
                  style={{
                    padding: "6px 14px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--primary)",
                    color: "white",
                  }}
                  onClick={() => setShowBulkSupplierModal(true)}
                >
                  <Truck size={14} />
                  Assign Supplier ({selectedBatchIds.size})
                </button>
                <button
                  className="pos-btn"
                  style={{
                    padding: "6px 14px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--warning)",
                    color: "white",
                  }}
                  onClick={handleBulkReturnToSupplier}
                  disabled={bulkReturning}
                >
                  <RotateCcw size={14} />
                  {bulkReturning
                    ? "Returning..."
                    : `Return to Supplier (${selectedBatchIds.size})`}
                </button>
                <button
                  className="pos-btn danger"
                  style={{
                    padding: "6px 14px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onClick={() => setShowDisposeModal(true)}
                >
                  <Archive size={14} />
                  Dispose Selected ({selectedBatchIds.size})
                </button>
              </>
            )}
            <div className="table-search-wrapper">
              <Search size={16} />
              <>
                <label htmlFor="field_k7flin" className="sr-only">
                  Search medicine or batch...
                </label>
                <input
                  required
                  type="text"
                  placeholder="Search medicine or batch..."
                  className="table-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="field_k7flin"
                />
              </>
            </div>
          </div>
        </div>

        <div className="expiry-table-card">
          <table className="expiry-table">
            <thead>
              <tr>
                <th
                  style={{
                    width: 36,
                  }}
                >
                  {expiredBatches.length > 0 && (
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        color: "var(--text-muted)",
                      }}
                      title={
                        selectedBatchIds.size === expiredBatches.length
                          ? "Deselect all"
                          : "Select all expired"
                      }
                      onClick={toggleSelectAll}
                    >
                      {selectedBatchIds.size === expiredBatches.length &&
                      expiredBatches.length > 0 ? (
                        <CheckSquare size={16} color="var(--danger)" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  )}
                </th>
                <th>Medicine</th>
                <th>Batch #</th>
                <th>Supplier</th>
                <th>MFG Date</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
                <th>Qty</th>
                <th>Value ₹</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      No batches found
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      Try adjusting your search or filter criteria
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const isExpiredRow = b.days < 0 || b.status === "expired";
                  const isChecked =
                    isExpiredRow && selectedBatchIds.has(b.batchId);
                  return (
                    <tr
                      key={
                        b.id ||
                        b.batchId ||
                        `${b.med}-${b.batchNumber || b.batch}`
                      }
                      className={`expiry-row-${b.status}${isChecked ? " selected-for-disposal" : ""}`}
                      style={
                        isChecked
                          ? {
                              background: "rgba(239,68,68,0.06)",
                              outline: "1px solid rgba(239,68,68,0.25)",
                            }
                          : {}
                      }
                    >
                      <td>
                        {isExpiredRow ? (
                          <button
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              paddingLeft: 4,
                            }}
                            onClick={() => toggleBatch(b.batchId)}
                          >
                            {isChecked ? (
                              <CheckSquare size={16} color="var(--danger)" />
                            ) : (
                              <Square size={16} color="var(--text-muted)" />
                            )}
                          </button>
                        ) : null}
                      </td>
                      <td>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "var(--text)",
                          }}
                        >
                          {b.med}
                          {b.discountApplied && (
                            <span
                              className="discount-badge"
                              style={{
                                marginLeft: "8px",
                              }}
                            >
                              DISCOUNTED
                            </span>
                          )}
                        </div>
                        {b.manufacturer && (
                          <div className="result-meta">{b.manufacturer}</div>
                        )}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          fontFamily: "Outfit",
                          color: "var(--text)",
                        }}
                      >
                        {b.batchNumber}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--text-muted)",
                        }}
                      >
                        {b.supplier}
                      </td>
                      <td className="result-meta">{b.mfg}</td>
                      <td>{b.exp}</td>
                      <td>
                        <b
                          style={{
                            color:
                              b.days < 0
                                ? "var(--danger)"
                                : b.days < 7
                                  ? "var(--warning)"
                                  : b.days < 30
                                    ? "var(--warning)"
                                    : b.days < 90
                                      ? "var(--info)"
                                      : "var(--success)",
                            fontFamily: "Outfit",
                          }}
                        >
                          {b.days < 0
                            ? "EXPIRED"
                            : b.days > 120
                              ? "120+ Days"
                              : `${b.days} Days`}
                        </b>
                      </td>
                      <td>{b.qty}</td>
                      <td
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        ₹{b.val}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="micro-btn action-btn"
                            style={{
                              color: "var(--warning)",
                            }}
                            title="Return"
                            onClick={() => handleAction("RETURN", b)}
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            className="micro-btn action-btn"
                            style={{
                              color: "var(--info)",
                            }}
                            title="Discount"
                            onClick={() => handleAction("DISCOUNT", b)}
                          >
                            <TrendingUp size={14} />
                          </button>
                          {isExpiredRow && (
                            <button
                              className="micro-btn action-btn"
                              style={{
                                color: "var(--danger)",
                              }}
                              title="Dispose this batch"
                              onClick={() => {
                                setSelectedBatchIds(new Set([b.batchId]));
                                setShowDisposeModal(true);
                              }}
                            >
                              <Archive size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </>
    )
  );
}
function ExpiryBatchIntelligenceSection2({
  setInvSearch,
  setShowInvFilterDropdown,
  invFilter,
  setInvFilter,
  setShowAddBatchModal,
  handleViewBatch,
  handleEditBatch,
  handleDeleteClick,
  activeTab,
  invSearch,
  showInvFilterDropdown,
  invFilteredBatches,
}) {
  return (
    activeTab === "inventory" && (
      <>
        <div className="table-controls-row">
          <div
            className="table-search-wrapper"
            style={{
              maxWidth: "340px",
            }}
          >
            <Search size={16} />
            <>
              <label htmlFor="field_4donrh" className="sr-only">
                Search batch # or medicine...
              </label>
              <input
                required
                type="text"
                placeholder="Search batch # or medicine..."
                className="table-search-input"
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                id="field_4donrh"
              />
            </>
          </div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "relative",
              }}
            >
              <button
                className="pos-btn outline"
                onClick={() => setShowInvFilterDropdown((prev) => !prev)}
              >
                <Filter size={14} />{" "}
                {INV_FILTER_OPTIONS.find((o) => o.value === invFilter)?.label ||
                  "Filter"}
              </button>
              {showInvFilterDropdown && (
                <>
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 99,
                    }}
                    onClick={() => setShowInvFilterDropdown(false)}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      background: "var(--surface)",
                      border: "1px solid var(--outline-variant)",
                      borderRadius: "12px",
                      padding: "6px",
                      minWidth: "200px",
                      zIndex: 100,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                    }}
                  >
                    {INV_FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setInvFilter(opt.value);
                          setShowInvFilterDropdown(false);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 14px",
                          fontSize: "13px",
                          fontWeight: invFilter === opt.value ? 700 : 500,
                          background:
                            invFilter === opt.value
                              ? "var(--primary-glow)"
                              : "transparent",
                          color:
                            invFilter === opt.value
                              ? "var(--primary)"
                              : "var(--text-main)",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        {opt.label}
                        {invFilter === opt.value && (
                          <span
                            style={{
                              float: "right",
                              fontSize: "11px",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              className="pos-btn teal"
              onClick={() => setShowAddBatchModal(true)}
            >
              <Plus size={14} /> Add Batch
            </button>
          </div>
        </div>
        <div className="expiry-table-card">
          <table className="expiry-table">
            <thead>
              <tr>
                <th>Medicine / Molecule</th>
                <th>Batch #</th>
                <th>Expiry</th>
                <th>Received</th>
                <th>Qty Remaining</th>
                <th>Supplier</th>
                <th>FIFO Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invFilteredBatches.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      No inventory items found
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      Click "Add Batch" to create a new entry
                    </div>
                  </td>
                </tr>
              ) : (
                invFilteredBatches.map((b) => (
                  <tr
                    key={
                      b.id ||
                      b.batchId ||
                      `${b.med}-${b.batchNumber || b.batch}`
                    }
                  >
                    <td
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      {b.med}
                      {b.discountApplied && (
                        <span
                          className="discount-badge"
                          style={{
                            marginLeft: "8px",
                          }}
                        >
                          DISCOUNTED
                        </span>
                      )}
                    </td>
                    <td>{b.batchNumber}</td>
                    <td>{b.exp}</td>
                    <td className="result-meta">{b.received}</td>
                    <td>{b.qty} units</td>
                    <td className="result-meta">{b.supplier || "Unknown"}</td>
                    <td>
                      <span
                        className={`fifo-badge ${b.rank === 1 ? "active" : b.rank === 2 ? "next" : "queued"}`}
                      >
                        {b.rank === 1 ? "1st" : b.rank === 2 ? "2nd" : "3rd"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`p-status ${b.status === "expired" ? "danger" : "success"}`}
                      >
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="micro-btn action-btn"
                          style={{
                            color: "var(--info)",
                          }}
                          title="View Details"
                          onClick={() => handleViewBatch(b)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="micro-btn action-btn"
                          style={{
                            color: "var(--primary)",
                          }}
                          title="Edit"
                          onClick={() => handleEditBatch(b)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="micro-btn action-btn"
                          style={{
                            color: "var(--danger)",
                          }}
                          title="Delete"
                          onClick={() => handleDeleteClick(b)}
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
      </>
    )
  );
}
function ExpiryBatchIntelligenceSection3({
  fifoEnabled,
  setShowFifoConfirm,
  setFifoEnabled,
  setExpandedMed,
  expandedMed,
  activeTab,
  fifoMedicines,
}) {
  return (
    activeTab === "fifo" && (
      <>
        <div
          className="pos-card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "Outfit",
                fontWeight: 600,
                fontSize: "16px",
              }}
            >
              FIFO Enforcement
            </div>
            <p className="result-meta">
              Oldest batch is always sold first at billing
            </p>
          </div>
          <button
            type="button"
            aria-label="Toggle FIFO enforcement"
            className={`toggle-switch ${fifoEnabled ? "on" : ""}`}
            onClick={() => {
              if (fifoEnabled) {
                setShowFifoConfirm(true);
              } else {
                setFifoEnabled(true);
              }
            }}
            style={{
              background: fifoEnabled ? "var(--primary)" : "var(--overlay-10)",
              width: "50px",
              height: "24px",
              borderRadius: "12px",
              position: "relative",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                background: "white",
                borderRadius: "50%",
                position: "absolute",
                top: "3px",
                left: fifoEnabled ? "29px" : "3px",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>

        <div
          className="fifo-medicine-list"
          style={{
            marginTop: "24px",
          }}
        >
          {Object.keys(fifoMedicines).length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "30px",
                color: "var(--text-muted)",
              }}
            >
              No batches available for FIFO tracking
            </div>
          ) : (
            Object.entries(fifoMedicines).map(([med, medBatches]) => {
              const totalQty = medBatches.reduce(
                (sum, b) => sum + (b.qty || 0),
                0,
              );
              return (
                <div key={med} className="fifo-medicine-card">
                  <button
                    type="button"
                    className="fifo-card-header"
                    onClick={() =>
                      setExpandedMed(expandedMed === med ? null : med)
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "4px",
                          height: "20px",
                          background: "var(--primary)",
                          borderRadius: "2px",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "Outfit",
                          fontWeight: 600,
                        }}
                      >
                        {med}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                      }}
                    >
                      <div className="result-meta">
                        Total: <b>{totalQty} units</b>
                      </div>
                      <div className="result-meta">
                        Batches: <b>{medBatches.length}</b>
                      </div>
                      {expandedMed === med ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedMed === med && (
                      <m.div
                        layout
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        className="fifo-card-body"
                      >
                        <table
                          className="expiry-table"
                          style={{
                            background: "none",
                          }}
                        >
                          <thead>
                            <tr>
                              <th>FIFO RANK</th>
                              <th>BATCH #</th>
                              <th>EXPIRY</th>
                              <th>QTY</th>
                              <th>DAYS LEFT</th>
                              <th>AVAILABILITY</th>
                            </tr>
                          </thead>
                          <tbody>
                            {medBatches.map((b) => {
                              const pct = Math.min(
                                ((b.qty || 0) / (totalQty || 1)) * 100,
                                100,
                              );
                              return (
                                <tr
                                  key={
                                    b.id ||
                                    b.batchId ||
                                    `${b.batchNumber || b.batch}-${b.rank}`
                                  }
                                >
                                  <td>
                                    <span
                                      className={`fifo-badge ${b.rank === 1 ? "active" : "next"}`}
                                    >
                                      Rank {b.rank}
                                    </span>
                                  </td>
                                  <td
                                    style={{
                                      fontWeight: 700,
                                    }}
                                  >
                                    {b.batchNumber}
                                  </td>
                                  <td
                                    style={{
                                      color:
                                        b.days < 7
                                          ? "var(--danger)"
                                          : b.days < 30
                                            ? "var(--warning)"
                                            : "inherit",
                                    }}
                                  >
                                    {b.exp}
                                  </td>
                                  <td>{b.qty} units</td>
                                  <td>
                                    <b
                                      style={{
                                        color:
                                          b.days < 0
                                            ? "var(--danger)"
                                            : b.days < 7
                                              ? "var(--warning)"
                                              : "var(--success)",
                                        fontFamily: "Outfit",
                                      }}
                                    >
                                      {b.days < 0 ? "EXPIRED" : `${b.days}d`}
                                    </b>
                                  </td>
                                  <td
                                    style={{
                                      width: "200px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: "6px",
                                        background: "var(--overlay-05)",
                                        borderRadius: "3px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: `${pct}%`,
                                          height: "100%",
                                          background:
                                            b.days < 0
                                              ? "var(--danger)"
                                              : b.days < 7
                                                ? "var(--warning)"
                                                : "var(--primary)",
                                        }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </>
    )
  );
}
function ExpiryBatchIntelligenceSection4({
  reminders,
  suggestions,
  handleAction,
  handleRemindPos,
  activeTab,
}) {
  return (
    activeTab === "suggestions" &&
    (() => {
      const remindersSet = new Set(reminders);
      return (
        <div className="suggestion-grid">
          {suggestions.length === 0 ? (
            <div className="empty-state">No recommendations available</div>
          ) : (
            suggestions.map((s) => (
              <m.div
                key={s.id || s.batchId || `${s.med}-${s.batch}-${s.days}`}
                className={`suggestion-card ${s.urgency}`}
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "Outfit",
                        fontWeight: 600,
                        fontSize: "15px",
                      }}
                    >
                      ⚠ {s.med}
                    </div>
                    <div className="result-meta">
                      Batch {s.batch} · <b>{s.days} days left</b>
                    </div>
                  </div>
                  <Info size={18} className="result-meta" />
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {s.qty} units remaining · ₹{s.val}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "var(--text-muted)",
                    }}
                  >
                    SUGGESTED ACTIONS:
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                    }}
                  >
                    ① Offer 10% discount to move stock
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                    }}
                  >
                    ② Return {s.qty} units to {s.supplier}
                  </div>
                </div>

                <div className="sug-actions">
                  <button
                    className="pos-btn outline"
                    style={{
                      padding: "6px 12px",
                      fontSize: "11px",
                      border: "none",
                      background: "rgba(59, 130, 246, 0.1)",
                      color: "var(--info)",
                    }}
                    onClick={() => handleAction("DISCOUNT", s)}
                  >
                    Apply Discount
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{
                      padding: "6px 12px",
                      fontSize: "11px",
                      border: "none",
                      background: "rgba(245, 166, 35, 0.1)",
                      color: "var(--warning)",
                    }}
                    onClick={() => handleAction("RETURN", s)}
                  >
                    Return
                  </button>
                  <button
                    className="pos-btn outline"
                    style={{
                      padding: "6px 12px",
                      fontSize: "11px",
                      border: "none",
                      background: remindersSet.has(s.med)
                        ? "rgba(16, 185, 129, 0.1)"
                        : "var(--primary-glow)",
                      color: remindersSet.has(s.med)
                        ? "var(--success)"
                        : "var(--primary)",
                    }}
                    onClick={() => handleRemindPos(s)}
                    disabled={remindersSet.has(s.med)}
                  >
                    {remindersSet.has(s.med)
                      ? "✓ Reminder Added"
                      : "Remind POS"}
                  </button>
                  <button
                    className="micro-btn"
                    style={{
                      marginLeft: "auto",
                    }}
                    onClick={() => handleAction("DISPOSE", s)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </m.div>
            ))
          )}
        </div>
      );
    })()
  );
}
function ExpiryBatchIntelligenceSection5({
  setShowConfigModal,
  setAlertSettings,
  alertSettings,
  frequency,
  setFrequency,
  isSavingConfigRef,
  showToast,
  setShowActionModal,
  setReturnReason,
  setReturnQty,
  setDiscountPct,
  setDiscountDuration,
  setDisposalMethod,
  setDisposalNotes,
  setShowViewBatchModal,
  setShowEditBatchModal,
  setEditBatch,
  editBatch,
  setShowAddBatchModal,
  setNewBatch,
  newBatch,
  setShowFifoConfirm,
  setFifoEnabled,
  setShowDeleteModal,
  showConfigModal,
  showActionModal,
  actionType,
  processing,
  selectedItem,
  returnReason,
  returnQty,
  discountPct,
  discountDuration,
  disposalMethod,
  disposalNotes,
  confirmAction,
  showViewBatchModal,
  viewBatch,
  showEditBatchModal,
  saveEditBatch,
  showAddBatchModal,
  addNewBatch,
  showFifoConfirm,
  showDeleteModal,
  selectedBatchForDelete,
  confirmDeleteBatch,
}) {
  return (
    <AnimatePresence>
      {showConfigModal && (
        <div className="stock-modal-overlay">
          <m.div
            className="stock-modal-content"
            style={{
              width: "480px",
            }}
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 20,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                }}
              >
                Expiry Alert Settings
              </h3>
              <button
                className="micro-btn"
                onClick={() => setShowConfigModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div className="config-section">
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "var(--text-muted)",
                  }}
                >
                  THRESHOLDS (DAYS)
                </div>
                <div className="threshold-input">
                  <div
                    style={{
                      width: "80px",
                      fontSize: "12px",
                    }}
                  >
                    Warning
                  </div>
                  <input
                    required
                    className="pos-input"
                    value={alertSettings.warning}
                    onChange={(e) =>
                      setAlertSettings({
                        ...alertSettings,
                        warning: safeNumber(e.target.value),
                      })
                    }
                    style={{
                      borderColor: "var(--warning)",
                    }}
                  />
                  <div className="result-meta">Orange Alert</div>
                </div>
                <div className="threshold-input">
                  <div
                    style={{
                      width: "80px",
                      fontSize: "12px",
                    }}
                  >
                    Critical
                  </div>
                  <input
                    required
                    className="pos-input"
                    value={alertSettings.critical}
                    onChange={(e) =>
                      setAlertSettings({
                        ...alertSettings,
                        critical: safeNumber(e.target.value),
                      })
                    }
                    style={{
                      borderColor: "var(--danger)",
                    }}
                  />
                  <div className="result-meta">Red Alert</div>
                </div>
              </div>

              <div className="config-section">
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "var(--text-muted)",
                  }}
                >
                  FREQUENCY
                </div>
                <div
                  className="purchases-tabs"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                >
                  {["Daily Digest", "Real-time", "Weekly"].map((f) => (
                    <button
                      key={f}
                      className={`p-tab ${frequency === f ? "active" : ""}`}
                      style={{
                        fontSize: "11px",
                        padding: "6px 12px",
                      }}
                      onClick={() => setFrequency(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                style={{
                  flex: 1,
                }}
                onClick={() => setShowConfigModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn teal"
                style={{
                  flex: 2,
                }}
                onClick={async () => {
                  if (isSavingConfigRef.current) return;
                  isSavingConfigRef.current = true;
                  try {
                    await api.put("/settings/inventory", {
                      expiryWarningDays: alertSettings.warning,
                      expiryCriticalDays: alertSettings.critical,
                    });
                    showToast("Settings saved", "success");
                    setShowConfigModal(false);
                  } catch (err) {
                    showToast(
                      err.response?.data?.message || "Failed to save settings",
                      "error",
                    );
                  } finally {
                    isSavingConfigRef.current = false;
                  }
                }}
              >
                Save Settings
              </button>
            </div>
          </m.div>
        </div>
      )}

      {/* ───────────────────── ACTION MODAL ───────────────────── */}
      {showActionModal && (
        <div className="stock-modal-overlay">
          <m.div
            className="stock-modal-content"
            style={{
              width: "450px",
            }}
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <div className="stock-modal-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {actionType === "RETURN" && (
                  <RotateCcw size={20} color="var(--warning)" />
                )}
                {actionType === "DISCOUNT" && (
                  <TrendingUp size={20} color="var(--info)" />
                )}
                {actionType === "DISPOSE" && (
                  <Trash2 size={20} color="var(--danger)" />
                )}
                <h3
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 700,
                  }}
                >
                  {actionType === "RETURN" && "Return to Supplier"}
                  {actionType === "DISCOUNT" && "Apply Bulk Discount"}
                  {actionType === "DISPOSE" && "Stock Disposal"}
                </h3>
              </div>
              <button
                className="micro-btn"
                onClick={() => setShowActionModal(false)}
                disabled={processing}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div
                className="action-item-info"
                style={{
                  marginBottom: "20px",
                  padding: "12px",
                  background: "var(--overlay-05)",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--text-main)",
                  }}
                >
                  {selectedItem?.med}
                </div>
                <div className="result-meta">
                  Batch: {selectedItem?.id || selectedItem?.batch} · Qty:{" "}
                  {selectedItem?.qty} units
                  {selectedItem?.supplier &&
                    ` · Supplier: ${selectedItem.supplier}`}
                </div>
              </div>

              {actionType === "RETURN" && (
                <div className="form-group">
                  <label
                    htmlFor="field_sv4c5k"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Reason for Return
                  </label>
                  <select
                    id="field_sv4c5k"
                    className="pos-input"
                    style={{
                      width: "100%",
                      marginBottom: "16px",
                    }}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  >
                    <option>Near Expiry Stock</option>
                    <option>Damaged Packaging</option>
                    <option>Quality Concern</option>
                    <option>Incorrect Supply</option>
                  </select>
                  <label
                    htmlFor="field_7r6e1a"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Quantity to Return
                  </label>
                  <input
                    id="field_7r6e1a"
                    required
                    className="pos-input"
                    type="number"
                    value={returnQty}
                    onChange={(e) =>
                      setReturnQty(Math.max(1, safeNumber(e.target.value)))
                    }
                    style={{
                      width: "100%",
                    }}
                    min={1}
                    max={selectedItem?.qty}
                  />
                </div>
              )}

              {actionType === "DISCOUNT" && (
                <div className="form-group">
                  <label
                    htmlFor="field_2dxje8"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Discount Percentage (%)
                  </label>
                  <input
                    id="field_2dxje8"
                    required
                    className="pos-input"
                    type="number"
                    value={discountPct}
                    onChange={(e) =>
                      setDiscountPct(
                        Math.max(0, Math.min(100, safeNumber(e.target.value))),
                      )
                    }
                    style={{
                      width: "100%",
                      marginBottom: "16px",
                    }}
                  />
                  <div
                    className="result-meta"
                    style={{
                      marginBottom: "16px",
                    }}
                  >
                    Current Price: ₹
                    {selectedItem?.qty > 0
                      ? (
                          (selectedItem?.val || 0) / (selectedItem?.qty || 1)
                        ).toFixed(2)
                      : "0.00"}{" "}
                    / unit
                  </div>
                  <label
                    htmlFor="field_18bait"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Offer Duration (Days)
                  </label>
                  <input
                    id="field_18bait"
                    required
                    className="pos-input"
                    type="number"
                    value={discountDuration}
                    onChange={(e) =>
                      setDiscountDuration(
                        Math.max(1, safeNumber(e.target.value)),
                      )
                    }
                    style={{
                      width: "100%",
                    }}
                    min={1}
                  />
                </div>
              )}

              {actionType === "DISPOSE" && (
                <div className="form-group">
                  <div
                    style={{
                      color: "var(--danger)",
                      fontSize: "13px",
                      marginBottom: "16px",
                      fontWeight: 500,
                    }}
                  >
                    Warning: This action will permanently remove this batch from
                    active inventory and log it as waste.
                  </div>
                  <label
                    htmlFor="field_i1c5mw"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Disposal Method
                  </label>
                  <select
                    id="field_i1c5mw"
                    className="pos-input"
                    style={{
                      width: "100%",
                      marginBottom: "16px",
                    }}
                    value={disposalMethod}
                    onChange={(e) => setDisposalMethod(e.target.value)}
                  >
                    <option>Standard Medical Waste</option>
                    <option>Incineration</option>
                    <option>Chemical Neutralization</option>
                    <option>Return to Manufacturer for Disposal</option>
                  </select>
                  <label
                    htmlFor="field_h0rcw8"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Notes
                  </label>
                  <textarea
                    id="field_h0rcw8"
                    className="pos-input"
                    style={{
                      width: "100%",
                      height: "80px",
                      padding: "10px",
                    }}
                    placeholder="Add disposal authorization notes..."
                    value={disposalNotes}
                    onChange={(e) => setDisposalNotes(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                style={{
                  flex: 1,
                }}
                onClick={() => setShowActionModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className={`pos-btn ${actionType === "DISPOSE" ? "danger" : actionType === "RETURN" ? "warning" : "teal"}`}
                style={{
                  flex: 2,
                }}
                onClick={confirmAction}
                disabled={processing}
              >
                {processing
                  ? "Processing..."
                  : `Confirm ${actionType?.charAt(0) + actionType?.slice(1).toLowerCase()}`}
              </button>
            </div>
          </m.div>
        </div>
      )}

      {/* ───────────────────── VIEW BATCH MODAL ───────────────────── */}
      {showViewBatchModal && viewBatch && (
        <div className="stock-modal-overlay">
          <m.div
            className="stock-modal-content"
            style={{
              width: "500px",
            }}
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 20,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                }}
              >
                Batch Details — {viewBatch.id}
              </h3>
              <button
                className="micro-btn"
                onClick={() => setShowViewBatchModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div className="detail-grid">
                {[
                  ["Medicine", viewBatch.med],
                  ["Batch ID", viewBatch.id],
                  ["Supplier", viewBatch.supplier || viewBatch.brand],
                  ["MFG Date", viewBatch.mfg],
                  ["Expiry Date", viewBatch.exp],
                  [
                    "Days Left",
                    viewBatch.days < 0 ? "EXPIRED" : `${viewBatch.days} Days`,
                  ],
                  ["Quantity", `${viewBatch.qty} units`],
                  ["Value", `₹${viewBatch.val}`],
                  ["Received", viewBatch.received],
                  ["Status", viewBatch.status.toUpperCase()],
                  [
                    "FIFO Rank",
                    viewBatch.rank === 1
                      ? "1st (oldest)"
                      : viewBatch.rank === 2
                        ? "2nd"
                        : "3rd+",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn teal"
                style={{
                  flex: 1,
                }}
                onClick={() => setShowViewBatchModal(false)}
              >
                Close
              </button>
            </div>
          </m.div>
        </div>
      )}

      {/* ───────────────────── EDIT BATCH MODAL ───────────────────── */}
      {showEditBatchModal && editBatch && (
        <div className="stock-modal-overlay">
          <m.div
            className="stock-modal-content"
            style={{
              width: "500px",
            }}
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 20,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                }}
              >
                Edit Batch — {editBatch.id}
              </h3>
              <button
                className="micro-btn"
                onClick={() => setShowEditBatchModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div
                className="p-form-grid"
                style={{
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                <div className="pos-input-group">
                  <label htmlFor="field_w2qz7p" className="p-label">
                    Medicine
                  </label>
                  <input
                    id="field_w2qz7p"
                    required
                    className="pos-input"
                    value={editBatch.med}
                    onChange={(e) =>
                      setEditBatch({
                        ...editBatch,
                        med: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label htmlFor="field_ccyug8" className="p-label">
                    Supplier
                  </label>
                  <input
                    id="field_ccyug8"
                    required
                    className="pos-input"
                    value={editBatch.supplier || editBatch.brand}
                    onChange={(e) =>
                      setEditBatch({
                        ...editBatch,
                        supplier: e.target.value,
                        brand: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label htmlFor="field_h9sddh" className="p-label">
                    MFG Date
                  </label>
                  <input
                    id="field_h9sddh"
                    required
                    className="pos-input"
                    type="date"
                    value={editBatch.mfg}
                    onChange={(e) =>
                      setEditBatch({
                        ...editBatch,
                        mfg: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label htmlFor="field_trzr77" className="p-label">
                    Expiry Date
                  </label>
                  <input
                    id="field_trzr77"
                    required
                    className="pos-input"
                    type="date"
                    value={editBatch.exp}
                    onChange={(e) =>
                      setEditBatch({
                        ...editBatch,
                        exp: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label htmlFor="field_u4wwgc" className="p-label">
                    Quantity
                  </label>
                  <input
                    id="field_u4wwgc"
                    required
                    className="pos-input"
                    type="number"
                    value={editBatch.qty}
                    onChange={(e) =>
                      setEditBatch({
                        ...editBatch,
                        qty: safeNumber(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label htmlFor="field_j7owos" className="p-label">
                    Value (₹)
                  </label>
                  <input
                    id="field_j7owos"
                    required
                    className="pos-input"
                    type="number"
                    value={editBatch.val}
                    onChange={(e) =>
                      setEditBatch({
                        ...editBatch,
                        val: safeNumber(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                style={{
                  flex: 1,
                }}
                onClick={() => setShowEditBatchModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn teal"
                style={{
                  flex: 2,
                }}
                onClick={saveEditBatch}
              >
                <Save size={14} /> Save Changes
              </button>
            </div>
          </m.div>
        </div>
      )}

      {/* ───────────────────── ADD BATCH MODAL ───────────────────── */}
      {showAddBatchModal && (
        <div className="stock-modal-overlay">
          <m.div
            className="stock-modal-content"
            style={{
              width: "500px",
            }}
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 20,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                }}
              >
                Add New Batch
              </h3>
              <button
                className="micro-btn"
                onClick={() => setShowAddBatchModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div
                className="p-form-grid"
                style={{
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                <div className="pos-input-group">
                  <label htmlFor="field_t474xf" className="p-label">
                    MEDICINE NAME*
                  </label>
                  <input
                    id="field_t474xf"
                    required
                    className="pos-input"
                    placeholder="e.g. Amoxicillin 500mg"
                    value={newBatch.med}
                    onChange={(e) =>
                      setNewBatch({
                        ...newBatch,
                        med: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label htmlFor="field_paqjgf" className="p-label">
                    SUPPLIER
                  </label>
                  <input
                    id="field_paqjgf"
                    required
                    className="pos-input"
                    placeholder="e.g. Cipla"
                    value={newBatch.supplier}
                    onChange={(e) =>
                      setNewBatch({
                        ...newBatch,
                        supplier: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label htmlFor="field_wwhkj2" className="p-label">
                    MFG DATE
                  </label>
                  <input
                    id="field_wwhkj2"
                    required
                    className="pos-input"
                    type="date"
                    value={newBatch.mfg}
                    onChange={(e) =>
                      setNewBatch({
                        ...newBatch,
                        mfg: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label htmlFor="field_h7j6y1" className="p-label">
                    EXPIRY DATE
                  </label>
                  <input
                    id="field_h7j6y1"
                    required
                    className="pos-input"
                    type="date"
                    value={newBatch.exp}
                    onChange={(e) =>
                      setNewBatch({
                        ...newBatch,
                        exp: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label htmlFor="field_bh3et1" className="p-label">
                    QUANTITY*
                  </label>
                  <input
                    id="field_bh3et1"
                    required
                    className="pos-input"
                    type="number"
                    placeholder="e.g. 50"
                    value={newBatch.qty}
                    onChange={(e) =>
                      setNewBatch({
                        ...newBatch,
                        qty: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="pos-input-group">
                  <label htmlFor="field_spgb88" className="p-label">
                    VALUE (₹)
                  </label>
                  <input
                    id="field_spgb88"
                    required
                    className="pos-input"
                    type="number"
                    placeholder="e.g. 425"
                    value={newBatch.val}
                    onChange={(e) =>
                      setNewBatch({
                        ...newBatch,
                        val: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                style={{
                  flex: 1,
                }}
                onClick={() => setShowAddBatchModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn teal"
                style={{
                  flex: 2,
                }}
                onClick={addNewBatch}
              >
                <Plus size={14} /> Add Batch
              </button>
            </div>
          </m.div>
        </div>
      )}

      {/* ───────────────────── FIFO CONFIRM MODAL ───────────────────── */}
      {showFifoConfirm && (
        <div className="stock-modal-overlay">
          <m.div
            className="stock-modal-content"
            style={{
              width: "420px",
            }}
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                }}
              >
                Disable FIFO Enforcement?
              </h3>
              <button
                className="micro-btn"
                onClick={() => setShowFifoConfirm(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="stock-modal-body">
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                Disabling FIFO may cause compliance issues with regulatory
                requirements. Oldest stock may not be dispensed first.
              </p>
            </div>

            <div className="stock-modal-footer">
              <button
                className="pos-btn teal"
                style={{
                  flex: 1,
                }}
                onClick={() => setShowFifoConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn outline danger"
                style={{
                  flex: 1,
                }}
                onClick={() => {
                  setFifoEnabled(false);
                  setShowFifoConfirm(false);
                  showToast("FIFO disabled. Compliance risk noted.", "warning");
                }}
              >
                Disable Anyway
              </button>
            </div>
          </m.div>
        </div>
      )}

      {/* ───────────────────── DELETE CONFIRM MODAL ───────────────────── */}
      {showDeleteModal && selectedBatchForDelete && (
        <div className="stock-modal-overlay">
          <m.div
            className="stock-modal-content"
            style={{
              width: "420px",
            }}
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 700,
                  color: "var(--danger)",
                }}
              >
                Delete Batch
              </h3>
              <button
                className="micro-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="stock-modal-body">
              <div
                style={{
                  padding: "14px",
                  background: "rgba(239,68,68,0.08)",
                  borderRadius: "10px",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: "6px",
                  }}
                >
                  {selectedBatchForDelete.med}
                </div>
                <div className="result-meta">
                  Batch: {selectedBatchForDelete.id}
                </div>
              </div>

              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                This action will permanently remove this batch from inventory.
                This operation cannot be undone.
              </p>
            </div>

            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                style={{
                  flex: 1,
                }}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn danger"
                style={{
                  flex: 2,
                }}
                onClick={confirmDeleteBatch}
              >
                <Trash2 size={14} /> Delete Batch
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function ExpiryBatchIntelligenceSection6({
  disposing,
  setShowDisposeModal,
  showDisposeModal,
  disposalSummary,
  handleBulkDispose,
}) {
  return (
    <AnimatePresence>
      {showDisposeModal && (
        <div
          className="stock-modal-overlay"
          onClick={() => !disposing && setShowDisposeModal(false)}
          style={{
            zIndex: 1100,
          }}
        >
          <m.div
            className="stock-modal-content"
            style={{
              maxWidth: 480,
              width: "95vw",
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
            role="presentation"
          >
            <div className="stock-modal-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Archive size={20} color="var(--danger)" />
                <h3
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 700,
                    color: "var(--danger)",
                  }}
                >
                  Dispose Expired Inventory
                </h3>
              </div>
              {!disposing && (
                <button
                  className="micro-btn"
                  onClick={() => setShowDisposeModal(false)}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="stock-modal-body">
              {/* Summary cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                {[
                  {
                    label: "Selected Batches",
                    value: disposalSummary.count,
                    color: "var(--danger)",
                  },
                  {
                    label: "Total Units",
                    value: disposalSummary.units.toLocaleString("en-IN"),
                    color: "var(--warning)",
                  },
                  {
                    label: "Inventory Loss",
                    value: `₹${disposalSummary.loss.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}`,
                    color: "var(--danger)",
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    style={{
                      background: "rgba(239,68,68,0.07)",
                      borderRadius: 10,
                      padding: "12px 10px",
                      textAlign: "center",
                      border: "1px solid rgba(239,68,68,0.15)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      {card.label}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: card.color,
                        fontFamily: "Outfit",
                      }}
                    >
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reason */}
              <div
                style={{
                  background: "var(--surface-2, #f8f9ff)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 14,
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Reason
                </div>
                <div
                  style={{
                    fontWeight: 600,
                  }}
                >
                  Expired Stock
                </div>
              </div>

              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                  marginBottom: 0,
                }}
              >
                Batches will be archived and{" "}
                <strong
                  style={{
                    color: "var(--danger)",
                  }}
                >
                  available quantity set to zero
                </strong>
                . This updates inventory value immediately. No records will be
                deleted.
              </p>
            </div>

            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                style={{
                  flex: 1,
                }}
                disabled={disposing}
                onClick={() => setShowDisposeModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn danger"
                style={{
                  flex: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                }}
                disabled={disposing}
                onClick={handleBulkDispose}
              >
                {disposing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Archive size={14} /> Confirm Disposal
                  </>
                )}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function ExpiryBatchIntelligenceSection7({
  bulkAssigning,
  setShowBulkSupplierModal,
  setBulkSupplierId,
  showBulkSupplierModal,
  selectedBatchIds,
  bulkSupplierId,
  suppliers,
  handleBulkAssignSupplier,
}) {
  return (
    <AnimatePresence>
      {showBulkSupplierModal && (
        <div
          className="stock-modal-overlay"
          onClick={() => !bulkAssigning && setShowBulkSupplierModal(false)}
          style={{
            zIndex: 1100,
          }}
        >
          <m.div
            className="stock-modal-content"
            style={{
              maxWidth: 480,
              width: "95vw",
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
            role="presentation"
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  margin: 0,
                }}
              >
                <Truck
                  size={18}
                  style={{
                    marginRight: 8,
                  }}
                />
                Assign Supplier to {selectedBatchIds.size} Batches
              </h3>
              <button
                className="micro-btn"
                onClick={() => setShowBulkSupplierModal(false)}
                disabled={bulkAssigning}
              >
                <X size={18} />
              </button>
            </div>

            <div className="stock-modal-body">
              <div
                style={{
                  padding: "14px",
                  background: "rgba(59,130,246,0.08)",
                  borderRadius: "10px",
                  marginBottom: "18px",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Select a supplier to assign to all{" "}
                  <strong>{selectedBatchIds.size}</strong> selected batches.
                  This links the batches to the supplier for return tracking.
                </p>
              </div>

              <div
                style={{
                  marginBottom: "16px",
                }}
              >
                <label
                  htmlFor="field_2dvz13"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Supplier *
                </label>
                <select
                  id="field_2dvz13"
                  value={bulkSupplierId}
                  onChange={(e) => setBulkSupplierId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    fontSize: 14,
                  }}
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                style={{
                  flex: 1,
                }}
                disabled={bulkAssigning}
                onClick={() => setShowBulkSupplierModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-btn"
                style={{
                  flex: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                  background: "var(--primary)",
                  color: "white",
                }}
                disabled={bulkAssigning || !bulkSupplierId}
                onClick={handleBulkAssignSupplier}
              >
                {bulkAssigning ? (
                  <>Assigning...</>
                ) : (
                  <>
                    <Truck size={14} /> Assign Supplier
                  </>
                )}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function ExpiryBatchIntelligenceSection8({
  importing,
  setShowImportModal,
  setImportResult,
  setImportFile,
  showImportModal,
  importResult,
  importFile,
  handleImportCsv,
}) {
  return (
    <AnimatePresence>
      {showImportModal && (
        <div
          className="stock-modal-overlay"
          onClick={() => !importing && setShowImportModal(false)}
          style={{
            zIndex: 1100,
          }}
        >
          <m.div
            className="stock-modal-content"
            style={{
              maxWidth: 520,
              width: "95vw",
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
            role="presentation"
          >
            <div className="stock-modal-header">
              <h3
                style={{
                  margin: 0,
                }}
              >
                Import Supplier Assignments (CSV)
              </h3>
              <button
                className="micro-btn"
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                  setImportFile(null);
                }}
                disabled={importing}
              >
                <X size={18} />
              </button>
            </div>

            <div className="stock-modal-body">
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginBottom: 16,
                }}
              >
                Upload a CSV with columns: <strong>batchId</strong> and{" "}
                <strong>supplierName</strong>. Export CSV first to get the batch
                IDs and available supplier names.
              </p>

              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                style={{
                  marginBottom: 16,
                }}
              />

              {importResult && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: importResult.errors?.length
                      ? "rgba(234,179,8,0.08)"
                      : "rgba(34,197,94,0.08)",
                    marginBottom: 16,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <strong>Updated:</strong> {importResult.updated}
                  </div>
                  <div>
                    <strong>Skipped:</strong> {importResult.skipped}
                  </div>
                  {importResult.errors?.length > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                      }}
                    >
                      <strong>Errors ({importResult.errors.length}):</strong>
                      <ul
                        style={{
                          margin: "4px 0",
                          paddingLeft: 20,
                        }}
                      >
                        {importResult.errors.slice(0, 10).map((e) => (
                          <li key={e.batchId}>
                            {e.batchId?.slice(0, 8)} — {e.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="stock-modal-footer">
              <button
                className="pos-btn outline"
                style={{
                  flex: 1,
                }}
                disabled={importing}
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                  setImportFile(null);
                }}
              >
                {importResult ? "Close" : "Cancel"}
              </button>
              {!importResult && (
                <button
                  className="pos-btn"
                  style={{
                    flex: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "center",
                    background: "var(--primary)",
                    color: "white",
                  }}
                  disabled={importing || !importFile}
                  onClick={handleImportCsv}
                >
                  {importing ? "Importing..." : "Import"}
                </button>
              )}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default function ExpiryBatchIntelligence({ showToast }) {
  const [intelligenceState, dispatchIntelligence] = useReducer(
    (state, action) => {
      if (action.type === "SET_FIELD") {
        return {
          ...state,
          [action.field]:
            typeof action.value === "function"
              ? action.value(state[action.field])
              : action.value,
        };
      }
      return state;
    },
    {
      batches: [],
      suggestions: [],
      loading: true,
      activeTab: "timeline",
      filter: "ALL",
      searchQuery: "",
      showBanner: true,
      showConfigModal: false,
      showActionModal: false,
      actionType: null,
      selectedItem: null,
      processing: false,
      reminders: [],
      fifoEnabled: true,
      expandedMed: null,
      expiryMetrics: null,
      selectedBatchIds: new Set(),
      showDisposeModal: false,
      disposing: false,
      clearReloadKey: 0,
      showBulkSupplierModal: false,
      bulkSupplierId: "",
      suppliers: [],
      bulkAssigning: false,
      bulkReturning: false,
      backfilling: false,
      showImportModal: false,
      importFile: null,
      importing: false,
      importResult: null,
    },
  );
  const {
    batches,
    suggestions,
    loading,
    activeTab,
    filter,
    searchQuery,
    showBanner,
    showConfigModal,
    showActionModal,
    actionType,
    selectedItem,
    processing,
    reminders,
    fifoEnabled,
    expandedMed,
    expiryMetrics,
    selectedBatchIds,
    showDisposeModal,
    disposing,
    clearReloadKey,
    showBulkSupplierModal,
    bulkSupplierId,
    suppliers,
    bulkAssigning,
    bulkReturning,
    backfilling,
    showImportModal,
    importFile,
    importing,
    importResult,
  } = intelligenceState;
  const isExportingRef = useRef(false);
  const isSavingEditRef = useRef(false);
  const isDeletingBatchRef = useRef(false);
  const isSavingConfigRef = useRef(false);
  const setBatches = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "batches",
        value: val,
      }),
    [],
  );
  const setSuggestions = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "suggestions",
        value: val,
      }),
    [],
  );
  const setLoading = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "loading",
        value: val,
      }),
    [],
  );
  const setActiveTab = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "activeTab",
        value: val,
      }),
    [],
  );
  const setFilter = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "filter",
        value: val,
      }),
    [],
  );
  const setSearchQuery = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "searchQuery",
        value: val,
      }),
    [],
  );
  const setShowBanner = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "showBanner",
        value: val,
      }),
    [],
  );
  const setShowConfigModal = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "showConfigModal",
        value: val,
      }),
    [],
  );
  const setShowActionModal = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "showActionModal",
        value: val,
      }),
    [],
  );
  const setActionType = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "actionType",
        value: val,
      }),
    [],
  );
  const setSelectedItem = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "selectedItem",
        value: val,
      }),
    [],
  );
  const setProcessing = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "processing",
        value: val,
      }),
    [],
  );
  const setReminders = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "reminders",
        value: val,
      }),
    [],
  );
  const setFifoEnabled = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "fifoEnabled",
        value: val,
      }),
    [],
  );
  const setExpandedMed = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "expandedMed",
        value: val,
      }),
    [],
  );
  const setExpiryMetrics = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "expiryMetrics",
        value: val,
      }),
    [],
  );
  const setSelectedBatchIds = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "selectedBatchIds",
        value: val,
      }),
    [],
  );
  const setShowDisposeModal = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "showDisposeModal",
        value: val,
      }),
    [],
  );
  const setDisposing = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "disposing",
        value: val,
      }),
    [],
  );
  const setClearReloadKey = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "clearReloadKey",
        value: val,
      }),
    [],
  );
  const setShowBulkSupplierModal = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "showBulkSupplierModal",
        value: val,
      }),
    [],
  );
  const setBulkSupplierId = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "bulkSupplierId",
        value: val,
      }),
    [],
  );
  const setSuppliers = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "suppliers",
        value: val,
      }),
    [],
  );
  const setBulkAssigning = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "bulkAssigning",
        value: val,
      }),
    [],
  );
  const setBulkReturning = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "bulkReturning",
        value: val,
      }),
    [],
  );
  const setBackfilling = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "backfilling",
        value: val,
      }),
    [],
  );
  const setShowImportModal = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "showImportModal",
        value: val,
      }),
    [],
  );
  const setImportFile = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "importFile",
        value: val,
      }),
    [],
  );
  const setImporting = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "importing",
        value: val,
      }),
    [],
  );
  const setImportResult = useCallback(
    (val) =>
      dispatchIntelligence({
        type: "SET_FIELD",
        field: "importResult",
        value: val,
      }),
    [],
  );
  useEffect(() => {
    getSuppliers({
      limit: 500,
    })
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setSuppliers(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [setSuppliers]);
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [batchRes, recRes, metricsRes] = await Promise.all([
          api.get("/intelligence/batches"),
          api.get("/intelligence/recommendations").catch(() => null),
          api.get("/inventory/expiry-metrics").catch(() => null),
        ]);
        if (!active) return;
        const rawBatches = Array.isArray(batchRes.data?.data)
          ? batchRes.data.data
          : Array.isArray(batchRes.data)
            ? batchRes.data
            : [];
        const mapped = rawBatches.reduce((acc, b) => {
          if (b.quantity > 0) {
            const days = getDays(b.expiryDate);
            acc.push({
              id: b.id,
              // real UUID for API calls and React keys
              batchNumber: b.batchNumber || "N/A",
              batchId: b.id,
              // kept for backwards compatibility in the component
              med: b.medicine?.name || "Unknown",
              exp: b.expiryDate,
              days,
              qty: b.availableQuantity ?? b.quantity,
              val:
                safeNumber(b.availableQuantity ?? b.quantity) *
                safeNumber(b.purchasePrice || 0),
              status:
                b.status?.toLowerCase() || computeStatus(days, b.quantity),
              rank: 1,
              received: b.createdAt?.split("T")[0] || "",
              mfg: b.manufacturingDate?.split("T")[0] || "N/A",
              supplier: b.supplier?.name || "N/A",
              supplierId: b.supplierId || b.supplier?.id || null,
              medicineId: b.medicineId || b.medicine?.id || null,
              manufacturer: b.manufacturerName || "",
              purchaseInvoice: b.purchaseInvoiceNumber || "",
              purchaseDate: b.purchaseDate?.split("T")[0] || "",
              purchasePrice: safeNumber(b.purchasePrice || 0),
              returnEligible:
                days < 0 && (b.supplier || b.supplierId) ? "YES" : "NO",
              returnStatus: "PENDING",
            });
          }
          return acc;
        }, []);
        setBatches(mapped);

        // Store unified expiry metrics from backend
        const metrics = metricsRes?.data?.data || metricsRes?.data || null;
        if (metrics) {
          setExpiryMetrics(metrics);
        }
        const recs = recRes?.data?.data || recRes?.data || [];
        const mappedRecs = Array.isArray(recs)
          ? recs.map((r) => {
              const batch = r.batch || {};
              const days = r.recommendedDays ?? getDays(batch.expiryDate);
              const qty = batch.quantity || 0;
              return {
                med: batch.medicine?.name || "Unknown",
                batch: batch.batchNumber || r.id || "",
                days,
                qty,
                val: safeNumber(qty) * safeNumber(batch.purchasePrice || 0),
                urgency: days <= 7 ? "danger" : days <= 30 ? "warning" : "info",
                supplier: batch.supplier?.name || "",
              };
            })
          : [];
        setSuggestions(mappedRecs);
      } catch (error) {
        console.error("Failed to load expiry intelligence:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [
    clearReloadKey,
    setBatches,
    setExpiryMetrics,
    setLoading,
    setSuggestions,
  ]);
  const [alertSettings, setAlertSettings] = useState({
    warning: 30,
    critical: 7,
    email: true,
    whatsapp: false,
  });
  const [frequency, setFrequency] = useState("Daily Digest");
  const [showFifoConfirm, setShowFifoConfirm] = useState(false);
  const [actionModalState, dispatchActionModal] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "INIT_ACTION":
          return {
            ...state,
            returnQty: action.payload?.qty || 1,
            returnReason: "Near Expiry Stock",
            discountPct: 15,
            discountDuration: 7,
            disposalMethod: "Standard Medical Waste",
            disposalNotes: "",
          };
        case "SET_FIELD":
          return {
            ...state,
            [action.field]:
              typeof action.value === "function"
                ? action.value(state[action.field])
                : action.value,
          };
        default:
          return state;
      }
    },
    {
      returnQty: 1,
      returnReason: "Near Expiry Stock",
      discountPct: 15,
      discountDuration: 7,
      disposalMethod: "Standard Medical Waste",
      disposalNotes: "",
    },
  );
  const {
    returnQty,
    returnReason,
    discountPct,
    discountDuration,
    disposalMethod,
    disposalNotes,
  } = actionModalState;
  const setReturnQty = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "returnQty",
        value: val,
      }),
    [],
  );
  const setReturnReason = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "returnReason",
        value: val,
      }),
    [],
  );
  const setDiscountPct = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "discountPct",
        value: val,
      }),
    [],
  );
  const setDiscountDuration = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "discountDuration",
        value: val,
      }),
    [],
  );
  const setDisposalMethod = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "disposalMethod",
        value: val,
      }),
    [],
  );
  const setDisposalNotes = useCallback(
    (val) =>
      dispatchActionModal({
        type: "SET_FIELD",
        field: "disposalNotes",
        value: val,
      }),
    [],
  );
  const [invSearch, setInvSearch] = useState("");
  const [invFilter, setInvFilter] = useState("ALL");
  const [showInvFilterDropdown, setShowInvFilterDropdown] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  const [showViewBatchModal, setShowViewBatchModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBatchForDelete, setSelectedBatchForDelete] = useState(null);
  const [editBatch, setEditBatch] = useState(null);
  const [viewBatch, setViewBatch] = useState(null);
  const [newBatch, setNewBatch] = useState({
    med: "",
    brand: "",
    supplier: "",
    exp: "",
    mfg: "",
    qty: "",
    val: "",
    received: new Date().toISOString().split("T")[0],
  });
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if ((b.qty ?? b.quantity ?? 0) <= 0) return false;
      const q = (searchQuery || "").toLowerCase();
      const matchesSearch =
        !q ||
        b.med?.toLowerCase().includes(q) ||
        b.medicineName?.toLowerCase().includes(q) ||
        b.supplier?.toLowerCase().includes(q) ||
        b.batch?.toLowerCase().includes(q) ||
        b.batchNumber?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      const f = (filter || "ALL").toUpperCase();
      if (f === "ALL") return true;
      if (f === "EXPIRED")
        return b.days < 0 || b.status?.toLowerCase() === "expired";
      if (
        f === "DANGER" ||
        f === "< 7 DAYS" ||
        f === "0-7 DAYS" ||
        f === "EXPIRING < 7 DAYS"
      )
        return (
          b.days >= 0 && b.days <= 7 && b.status?.toLowerCase() !== "expired"
        );
      if (
        f === "WARNING" ||
        f === "7-30 DAYS" ||
        f === "8-30 DAYS" ||
        f === "< 30 DAYS" ||
        f === "EXPIRING 7-30 DAYS"
      )
        return (
          b.days > 7 && b.days <= 30 && b.status?.toLowerCase() !== "expired"
        );
      if (
        f === "ATTENTION" ||
        f === "30-90 DAYS" ||
        f === "31-90 DAYS" ||
        f === "< 90 DAYS" ||
        f === "EXPIRING 30-90 DAYS"
      )
        return (
          b.days > 30 && b.days <= 90 && b.status?.toLowerCase() !== "expired"
        );
      if (f === "SAFE" || f === "90+ DAYS" || f === "SAFE (90+ DAYS)")
        return b.days > 90 && b.status?.toLowerCase() !== "expired";
      if (f === "ACTIVE")
        return b.days >= 0 && b.status?.toLowerCase() !== "expired";
      return b.status?.toLowerCase() === f.toLowerCase();
    });
  }, [batches, searchQuery, filter]);
  const invFilteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if ((b.qty ?? b.quantity ?? 0) <= 0) return false;
      const q = (invSearch || "").toLowerCase();
      const matchesSearch =
        !q ||
        b.med?.toLowerCase().includes(q) ||
        b.medicineName?.toLowerCase().includes(q) ||
        b.supplier?.toLowerCase().includes(q) ||
        b.batch?.toLowerCase().includes(q) ||
        b.batchNumber?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      const f = (invFilter || "ALL").toUpperCase();
      if (f === "ALL") return true;
      if (f === "EXPIRED")
        return b.days < 0 || b.status?.toLowerCase() === "expired";
      if (f === "DANGER" || f === "< 7 DAYS" || f === "0-7 DAYS")
        return (
          b.days >= 0 && b.days <= 7 && b.status?.toLowerCase() !== "expired"
        );
      if (
        f === "WARNING" ||
        f === "7-30 DAYS" ||
        f === "8-30 DAYS" ||
        f === "< 30 DAYS"
      )
        return (
          b.days > 7 && b.days <= 30 && b.status?.toLowerCase() !== "expired"
        );
      if (
        f === "ATTENTION" ||
        f === "30-90 DAYS" ||
        f === "31-90 DAYS" ||
        f === "< 90 DAYS"
      )
        return (
          b.days > 30 && b.days <= 90 && b.status?.toLowerCase() !== "expired"
        );
      if (f === "SAFE" || f === "90+ DAYS")
        return b.days > 90 && b.status?.toLowerCase() !== "expired";
      if (f === "ACTIVE")
        return b.days >= 0 && b.status?.toLowerCase() !== "expired";
      return b.status?.toLowerCase() === f.toLowerCase();
    });
  }, [batches, invSearch, invFilter]);
  const dynamicStats = useMemo(() => {
    // Use unified backend metrics if available, fallback to local calculation
    if (expiryMetrics) {
      return [
        {
          label: "EXPIRED NOW",
          val: expiryMetrics.expiredBatches ?? 0,
          col: "var(--danger)",
          icon: CalendarX,
          key: "EXPIRED",
        },
        {
          label: "EXPIRING < 7 DAYS",
          val: expiryMetrics.expiring7Batches ?? 0,
          col: "var(--warning)",
          icon: CalendarX,
          key: "< 7 DAYS",
        },
        {
          label: "EXPIRING 7-30 DAYS",
          val: expiryMetrics.expiring30Batches ?? 0,
          col: "var(--warning)",
          icon: CalendarDays,
          key: "7-30 DAYS",
        },
        {
          label: "EXPIRING 30-90 DAYS",
          val: expiryMetrics.expiring90Batches ?? 0,
          col: "var(--info)",
          icon: CalendarCheck,
          key: "30-90 DAYS",
        },
        {
          label: "TOTAL BATCHES",
          val: expiryMetrics.totalBatches ?? batches.length,
          col: "var(--primary)",
          icon: Layers,
          key: "ALL",
        },
      ];
    }

    // Fallback: local calculation from batch data
    const activeBatches = batches.filter((b) => (b.qty || b.quantity) > 0);
    const expired = activeBatches.filter(
      (b) => b.days < 0 || b.status?.toLowerCase() === "expired",
    ).length;
    const expiring7Days = activeBatches.filter(
      (b) =>
        b.days >= 0 && b.days <= 7 && b.status?.toLowerCase() !== "expired",
    ).length;
    const expiring30Days = activeBatches.filter(
      (b) =>
        b.days > 7 && b.days <= 30 && b.status?.toLowerCase() !== "expired",
    ).length;
    const expiring90Days = activeBatches.filter(
      (b) =>
        b.days > 30 && b.days <= 90 && b.status?.toLowerCase() !== "expired",
    ).length;
    return [
      {
        label: "EXPIRED NOW",
        val: expired,
        col: "var(--danger)",
        icon: CalendarX,
        key: "EXPIRED",
      },
      {
        label: "EXPIRING < 7 DAYS",
        val: expiring7Days,
        col: "var(--warning)",
        icon: CalendarX,
        key: "< 7 DAYS",
      },
      {
        label: "EXPIRING 7-30 DAYS",
        val: expiring30Days,
        col: "var(--warning)",
        icon: CalendarDays,
        key: "7-30 DAYS",
      },
      {
        label: "EXPIRING 30-90 DAYS",
        val: expiring90Days,
        col: "var(--info)",
        icon: CalendarCheck,
        key: "30-90 DAYS",
      },
      {
        label: "TOTAL BATCHES",
        val: activeBatches.length,
        col: "var(--primary)",
        icon: Layers,
        key: "ALL",
      },
    ];
  }, [batches, expiryMetrics]);
  const timelineCounts = useMemo(() => {
    // Use unified backend metrics if available
    if (expiryMetrics) {
      const expired = expiryMetrics.expiredBatches ?? 0;
      const urg7 = expiryMetrics.expiring7Batches ?? 0;
      const urg30 = expiryMetrics.expiring30Batches ?? 0;
      const urg90 = expiryMetrics.expiring90Batches ?? 0;
      const total = expiryMetrics.totalBatches ?? (batches.length || 1);
      const safe =
        expiryMetrics.safeBatches ??
        Math.max(0, total - expired - urg7 - urg30 - urg90);
      return {
        expired,
        urg7,
        urg30,
        urg90,
        safe,
        total: total || 1,
      };
    }

    // Fallback: local calculation
    const activeBatches = batches.filter((b) => (b.qty || b.quantity) > 0);
    const expired = activeBatches.filter(
      (b) => b.status === "expired" || b.days < 0,
    ).length;
    const urg7 = activeBatches.filter(
      (b) => b.days >= 0 && b.days <= 7 && b.status !== "expired",
    ).length;
    const urg30 = activeBatches.filter(
      (b) => b.days > 7 && b.days <= 30 && b.status !== "expired",
    ).length;
    const urg90 = activeBatches.filter(
      (b) => b.days > 30 && b.days <= 90 && b.status !== "expired",
    ).length;
    const safe = activeBatches.filter(
      (b) => (b.days > 90 || b.status === "safe") && b.status !== "expired",
    ).length;
    const total = activeBatches.length || 1;
    return {
      expired,
      urg7,
      urg30,
      urg90,
      safe,
      total,
    };
  }, [batches, expiryMetrics]);
  const fifoMedicines = useMemo(() => {
    const grouped = {};
    batches.forEach((b) => {
      if (!grouped[b.med]) grouped[b.med] = [];
      grouped[b.med].push(b);
    });
    Object.keys(grouped).forEach((med) => {
      grouped[med].sort((a, b) => (a.days || 999) - (b.days || 999));
      grouped[med] = grouped[med].map((b, i) => ({
        ...b,
        rank: i + 1,
      }));
    });
    return grouped;
  }, [batches]);
  const expiredCount = batches.filter(
    (b) => b.status === "expired" || b.days < 0,
  ).length;
  const exportExpiryReport = async () => {
    if (isExportingRef.current) return;
    isExportingRef.current = true;
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Expiry Report");
      worksheet.columns = [
        {
          header: "Medicine Name",
          key: "Medicine",
          width: 25,
        },
        {
          header: "Batch Number",
          key: "Batch",
          width: 15,
        },
        {
          header: "Supplier Name",
          key: "Supplier",
          width: 20,
        },
        {
          header: "Manufacturer Name",
          key: "Manufacturer",
          width: 20,
        },
        {
          header: "Purchase Invoice",
          key: "PurchaseInvoice",
          width: 15,
        },
        {
          header: "Purchase Date",
          key: "PurchaseDate",
          width: 12,
        },
        {
          header: "Received Date",
          key: "ReceivedDate",
          width: 12,
        },
        {
          header: "Manufacturing Date",
          key: "MFG",
          width: 12,
        },
        {
          header: "Expiry Date",
          key: "Expiry",
          width: 12,
        },
        {
          header: "Days Left",
          key: "DaysLeft",
          width: 12,
        },
        {
          header: "Quantity",
          key: "Quantity",
          width: 10,
        },
        {
          header: "Purchase Price",
          key: "PurchasePrice",
          width: 15,
        },
        {
          header: "Stock Value",
          key: "Value",
          width: 12,
        },
        {
          header: "Status",
          key: "Status",
          width: 12,
        },
        {
          header: "Return Eligible",
          key: "ReturnEligible",
          width: 15,
        },
        {
          header: "Return Status",
          key: "ReturnStatus",
          width: 15,
        },
      ];
      const reportData = batches.map((b) => ({
        Medicine: b.med,
        Batch: b.batchNumber,
        Supplier: b.supplier || "Unknown",
        Manufacturer: b.manufacturer || "Unknown",
        PurchaseInvoice: b.purchaseInvoice || "N/A",
        PurchaseDate: b.purchaseDate || "N/A",
        ReceivedDate: b.received || "N/A",
        MFG: b.mfg,
        Expiry: b.exp,
        DaysLeft: b.days < 0 ? "EXPIRED" : `${b.days} Days`,
        Quantity: b.qty,
        PurchasePrice: `₹${b.purchasePrice.toFixed(2)}`,
        Value: `₹${b.val.toFixed(2)}`,
        Status: b.status.toUpperCase(),
        ReturnEligible: b.returnEligible,
        ReturnStatus: b.returnStatus,
      }));
      worksheet.addRows(reportData);
      const buffer = await workbook.xlsx.writeBuffer();
      const fileData = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(fileData, `expiry-report-${Date.now()}.xlsx`);
      showToast("Expiry report exported successfully", "success");
    } catch (error) {
      console.error("Failed to export expiry report", error);
      showToast("Export failed", "error");
    } finally {
      isExportingRef.current = false;
    }
  };
  const handleAction = (type, item) => {
    setSelectedItem(item);
    setActionType(type);
    dispatchActionModal({
      type: "INIT_ACTION",
      payload: item,
    });
    setProcessing(false);
    setShowActionModal(true);
  };
  const matchesSelectedItem = (item) => {
    if (selectedItem?.id) return item.id === selectedItem.id;
    if (selectedItem?.batch) return item.batch === selectedItem.batch;
    return false;
  };
  const confirmAction = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      if (actionType === "RETURN") {
        const selectedItemData = batches.find((b) => matchesSelectedItem(b));
        if (!selectedItemData) throw new Error("Batch not found");
        if (!selectedItemData.supplierId) {
          throw new Error(
            "No supplier assigned to this batch. Please assign a supplier first using the 'Assign Supplier' button.",
          );
        }
        await api.post("/supplier-returns", {
          supplierId: selectedItemData.supplierId,
          items: [
            {
              medicineId: selectedItemData.medicineId,
              batchId: selectedItemData.batchId,
              quantity: returnQty || 1,
              reason: returnReason || "Expired Stock Return",
            },
          ],
          reason: returnReason || "Expired stock returned to supplier",
        });
        setBatches((prev) =>
          prev.map((item) => {
            if (matchesSelectedItem(item)) {
              const newQty = Math.max((item.qty || 0) - (returnQty || 1), 0);
              return {
                ...item,
                qty: newQty,
              };
            }
            return item;
          }),
        );
        showToast(`Return of ${returnQty} units initiated`, "success");
      } else if (actionType === "DISCOUNT") {
        setBatches((prev) =>
          prev.map((item) => {
            if (matchesSelectedItem(item)) {
              return {
                ...item,
                discountApplied: true,
              };
            }
            return item;
          }),
        );
        showToast(`${discountPct}% discount applied`, "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed", "error");
    } finally {
      setProcessing(false);
      setShowActionModal(false);
    }
  };

  // ─── Bulk Disposal helpers ───────────────────────────────────
  const expiredBatches = useMemo(
    () => filteredBatches.filter((b) => b.days < 0 || b.status === "expired"),
    [filteredBatches],
  );
  const toggleBatch = useCallback(
    (batchId) => {
      setSelectedBatchIds((prev) => {
        const next = new Set(prev);
        next.has(batchId) ? next.delete(batchId) : next.add(batchId);
        return next;
      });
    },
    [setSelectedBatchIds],
  );
  const toggleSelectAll = useCallback(() => {
    setSelectedBatchIds((prev) => {
      if (prev.size === expiredBatches.length) return new Set();
      return new Set(expiredBatches.map((b) => b.batchId));
    });
  }, [expiredBatches, setSelectedBatchIds]);
  const selectedExpiredBatches = useMemo(
    () => expiredBatches.filter((b) => selectedBatchIds.has(b.batchId)),
    [expiredBatches, selectedBatchIds],
  );
  const disposalSummary = useMemo(() => {
    const units = selectedExpiredBatches.reduce((s, b) => s + (b.qty || 0), 0);
    const loss = selectedExpiredBatches.reduce((s, b) => s + (b.val || 0), 0);
    return {
      count: selectedExpiredBatches.length,
      units,
      loss,
    };
  }, [selectedExpiredBatches]);
  const disposingRef = useRef(false);
  const handleBulkDispose = async () => {
    if (disposingRef.current) return;
    if (!selectedBatchIds.size) return;
    disposingRef.current = true;
    setDisposing(true);
    try {
      const batchIds = [...selectedBatchIds];
      const res = await disposeInventory({
        batchIds,
        reason: "EXPIRED",
        notes: "Bulk disposal via Expiry & Batch Intelligence",
      });
      const data = res.data?.data || res.data || {};
      showToast(
        `✅ ${data.disposedBatches ?? batchIds.length} batches disposed — ₹${(
          data.inventoryLoss ?? disposalSummary.loss
        ).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })} written off`,
        "success",
      );
      // Remove disposed batches from local state immediately
      setBatches((prev) =>
        prev.filter((b) => !selectedBatchIds.has(b.batchId)),
      );
      setSelectedBatchIds(new Set());
      setShowDisposeModal(false);
    } catch (err) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Disposal failed";
      showToast(msg, "error");
    } finally {
      disposingRef.current = false;
      setDisposing(false);
    }
  };
  const bulkAssigningRef = useRef(false);
  const handleBulkAssignSupplier = async () => {
    if (bulkAssigningRef.current) return;
    if (!selectedBatchIds.size || !bulkSupplierId) return;
    bulkAssigningRef.current = true;
    setBulkAssigning(true);
    try {
      const batchIds = [...selectedBatchIds];
      await bulkAssignBatchSupplier(batchIds, bulkSupplierId);
      const supplierName =
        suppliers.find((s) => s.id === bulkSupplierId)?.name || "";
      showToast(
        `Supplier "${supplierName}" assigned to ${batchIds.length} batches`,
        "success",
      );
      setBatches((prev) =>
        prev.map((b) =>
          selectedBatchIds.has(b.batchId)
            ? {
                ...b,
                supplierId: bulkSupplierId,
                supplier: supplierName,
              }
            : b,
        ),
      );
      setSelectedBatchIds(new Set());
      setShowBulkSupplierModal(false);
      setBulkSupplierId("");
    } catch (err) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Assignment failed";
      showToast(msg, "error");
    } finally {
      bulkAssigningRef.current = false;
      setBulkAssigning(false);
    }
  };
  const bulkReturningRef = useRef(false);
  const handleBulkReturnToSupplier = async () => {
    if (bulkReturningRef.current) return;
    if (!selectedBatchIds.size) return;
    const selectedBatches = batches.filter((b) =>
      selectedBatchIds.has(b.batchId),
    );
    const withoutSupplier = selectedBatches.filter((b) => !b.supplierId);
    if (withoutSupplier.length > 0) {
      showToast(
        `${withoutSupplier.length} batches have no supplier assigned. Please assign suppliers first.`,
        "error",
      );
      return;
    }
    const grouped = {};
    for (const b of selectedBatches) {
      if (!grouped[b.supplierId]) grouped[b.supplierId] = [];
      grouped[b.supplierId].push(b);
    }
    bulkReturningRef.current = true;
    setBulkReturning(true);
    try {
      await Promise.all(
        Object.entries(grouped).map(async ([supplierId, items]) => {
          await api.post("/supplier-returns", {
            supplierId,
            items: items.map((b) => ({
              medicineId: b.medicineId,
              batchId: b.batchId,
              quantity: b.qty || 1,
              reason: "EXPIRED",
            })),
            reason: "Bulk expired stock return to supplier",
          });
        }),
      );
      const totalReturns = Object.values(grouped).reduce(
        (acc, items) => acc + items.length,
        0,
      );
      showToast(
        `${totalReturns} batches returned across ${Object.keys(grouped).length} supplier(s)`,
        "success",
      );
      setBatches((prev) =>
        prev.filter((b) => !selectedBatchIds.has(b.batchId)),
      );
      setSelectedBatchIds(new Set());
    } catch (err) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Return failed";
      showToast(msg, "error");
    } finally {
      bulkReturningRef.current = false;
      setBulkReturning(false);
    }
  };
  const handleExportNoSupplier = async () => {
    if (isExportingRef.current) return;
    isExportingRef.current = true;
    try {
      const res = await exportBatchesWithoutSupplier();
      const { batches, suppliers } = res.data?.data || {};
      const supplierNames = suppliers.map((s) => s.name);
      const rows = [
        [
          "batchId",
          "batchNumber",
          "medicineName",
          "expiryDate",
          "quantity",
          "supplierName",
        ],
        ...batches.map((b) => [
          b.batchId,
          b.batchNumber,
          b.med,
          b.exp?.split("T")[0] || "",
          b.qty,
          b.supplier,
        ]),
      ];
      const csv = rows
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
      const supplierList =
        "\n\n# Available suppliers:\n" + supplierNames.join("\n");
      const blob = new Blob([csv + supplierList], {
        type: "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batches-no-supplier-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(
        `Exported ${batches.length} batches. Edit supplierName column and import back.`,
        "success",
      );
    } catch (err) {
      showToast("Export failed: " + (err.message || "Unknown error"), "error");
    } finally {
      isExportingRef.current = false;
    }
  };
  const importingRef = useRef(false);
  const handleImportCsv = async () => {
    if (importingRef.current) return;
    if (!importFile) return;
    importingRef.current = true;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await importFile.text();
      const lines = text
        .split("\n")
        .filter((l) => l.trim() && !l.startsWith("#"));
      if (lines.length < 2)
        throw new Error("CSV must have a header row and at least one data row");
      const header = lines[0]
        .split(",")
        .map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      const batchIdIdx = header.indexOf("batchid");
      const supplierIdx = header.indexOf("suppliername");
      if (batchIdIdx === -1 || supplierIdx === -1) {
        throw new Error("CSV must have 'batchId' and 'supplierName' columns");
      }
      const assignments = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
        const batchId = cols[batchIdIdx];
        const supplierName = cols[supplierIdx];
        if (batchId && supplierName) {
          assignments.push({
            batchId,
            supplierName,
          });
        }
      }
      if (assignments.length === 0)
        throw new Error("No valid assignments found in CSV");
      const res = await importSupplierAssignments(assignments);
      const data = res.data?.data || {};
      setImportResult(data);
      showToast(
        `Import complete: ${data.updated || 0} updated, ${data.skipped || 0} skipped`,
        "success",
      );
    } catch (err) {
      showToast("Import failed: " + (err.message || "Unknown error"), "error");
    } finally {
      importingRef.current = false;
      setImporting(false);
    }
  };
  const backfillingRef = useRef(false);
  const handleBackfillSuppliers = async () => {
    if (backfillingRef.current) return;
    backfillingRef.current = true;
    setBackfilling(true);
    try {
      const res = await backfillBatchSupplier();
      const data = res.data?.data || {};
      showToast(
        `Backfill complete: ${data.batchesUpdated || 0} batches updated across ${data.medicinesProcessed || 0} medicines`,
        "success",
      );
    } catch (err) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Backfill failed";
      showToast(msg, "error");
    } finally {
      backfillingRef.current = false;
      setBackfilling(false);
    }
  };
  const handleRemindPos = (item) => {
    setReminders((prev) => [...prev, item.med || item.batch]);
    showToast(`POS reminder set for ${item.med}`, "success");
  };
  const handleViewBatch = (b) => {
    setViewBatch(b);
    setShowViewBatchModal(true);
  };
  const handleEditBatch = (b) => {
    setEditBatch({
      ...b,
    });
    setShowEditBatchModal(true);
  };
  const saveEditBatch = async () => {
    if (isSavingEditRef.current) return;
    isSavingEditRef.current = true;
    try {
      await api.put(`/inventory/batches/${editBatch.batchId}`, {
        batchNumber: editBatch.batch,
        expiryDate: editBatch.exp,
        manufacturingDate: editBatch.mfg
          ? new Date(editBatch.mfg).toISOString()
          : null,
        purchasePrice: editBatch.purchasePrice,
        rackLocation: editBatch.rackLocation || undefined,
      });
      setBatches((prev) =>
        prev.map((b) =>
          b.batchId === editBatch.batchId
            ? {
                ...b,
                ...editBatch,
              }
            : b,
        ),
      );
      setShowEditBatchModal(false);
      showToast("Batch updated successfully", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update batch",
        "error",
      );
    } finally {
      isSavingEditRef.current = false;
    }
  };
  const handleDeleteClick = (b) => {
    setSelectedBatchForDelete(b);
    setShowDeleteModal(true);
  };
  const confirmDeleteBatch = async () => {
    if (isDeletingBatchRef.current) return;
    isDeletingBatchRef.current = true;
    if (!selectedBatchForDelete) return;
    try {
      await api.delete(`/inventory/batches/${selectedBatchForDelete.batchId}`);
      setBatches((prev) =>
        prev.filter((item) => item.batchId !== selectedBatchForDelete.batchId),
      );
      showToast("Batch deleted successfully", "success");
      setShowDeleteModal(false);
      setSelectedBatchForDelete(null);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete batch",
        "error",
      );
    } finally {
      isDeletingBatchRef.current = false;
    }
  };
  const addNewBatch = () => {
    if (!newBatch.med || !newBatch.qty) {
      showToast("Medicine name and quantity are required", "error");
      return;
    }
    const id = `B-${Date.now().toString(36).toUpperCase()}`;
    const today = new Date();
    const expDate = new Date(newBatch.exp || today);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    let status = "safe";
    if (diffDays < 0) status = "expired";
    else if (diffDays < 7) status = "danger";
    else if (diffDays < 30) status = "warning";
    const batch = {
      id,
      med: newBatch.med,
      brand: newBatch.brand || newBatch.supplier || "Unknown",
      supplier: newBatch.supplier || newBatch.brand || "Unknown",
      exp: newBatch.exp,
      days: diffDays,
      qty: safeNumber(newBatch.qty),
      val: safeNumber(newBatch.val) || 0,
      status,
      rank: 1,
      received: newBatch.received || today.toISOString().split("T")[0],
      mfg: newBatch.mfg || "",
    };
    setBatches((prev) => [...prev, batch]);
    setShowAddBatchModal(false);
    setNewBatch({
      med: "",
      brand: "",
      supplier: "",
      exp: "",
      mfg: "",
      qty: "",
      val: "",
      received: new Date().toISOString().split("T")[0],
    });
    showToast("Batch added successfully", "success");
  };
  return (
    <div className="expiry-container">
      <div className="expiry-header">
        <div>
          <h1
            style={{
              fontFamily: "Outfit",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            Expiry & Batch Intelligence
          </h1>
          <p className="result-meta">
            FIFO-enforced tracking, auto-alerts, and near-expiry action
            suggestions.
          </p>
          <div className="expiry-tabs">
            {["Timeline", "Inventory"].map((t) => (
              <button
                key={t}
                className={`expiry-tab ${activeTab === t.toLowerCase() ? "active" : ""}`}
                onClick={() => setActiveTab(t.toLowerCase())}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="expiry-header-actions">
          <button
            className="pos-btn outline"
            onClick={() => setShowConfigModal(true)}
          >
            <Bell size={16} /> Configure Alerts
          </button>
          <button className="pos-btn teal" onClick={exportExpiryReport}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* ── Alert Banner ── */}
      {showBanner && expiredCount > 0 && (
        <div className="expiry-alert-banner">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <AlertTriangle size={24} color="var(--danger)" />
            <span
              style={{
                fontFamily: "Outfit",
                fontWeight: 600,
                fontSize: "14px",
                color: "var(--danger)",
              }}
            >
              {expiredCount}{" "}
              {expiredCount === 1 ? "medicine has" : "medicines have"} EXPIRED —
              Immediate action required
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >
            <button
              className="pos-btn danger"
              style={{
                padding: "6px 12px",
                fontSize: "12px",
              }}
              onClick={() => {
                setFilter("EXPIRED");
                setActiveTab("timeline");
              }}
            >
              Take Action
            </button>
            <button className="micro-btn" onClick={() => setShowBanner(false)}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="expiry-stats-grid">
        {dynamicStats.map((s) => {
          const isExpiredCard = s.key === "EXPIRED";
          return (
            <div
              key={s.key}
              className="pos-stat-card"
              onClick={() => setFilter(s.key)}
              style={{
                borderLeft:
                  filter === s.key
                    ? `4px solid ${s.col}`
                    : "1px solid var(--outline-variant)",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div className="stat-card-header">
                <span className="stat-label">{s.label}</span>
                <div
                  className="stat-icon"
                  style={{
                    backgroundColor: `${s.col}15`,
                    color: s.col,
                  }}
                >
                  <s.icon size={16} />
                </div>
              </div>
              <div className="stat-value">{s.val}</div>
              {isExpiredCard && (
                <div
                  style={{
                    marginTop: 8,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <ClearExpiredButton
                    showToast={showToast}
                    onCleared={() => {
                      // Refresh batch list after clearing
                      setClearReloadKey((k) => k + 1);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ───────────────────── TIMELINE TAB ───────────────────── */}
      <ExpiryBatchIntelligenceSection1
        setFilter={setFilter}
        setShowBulkSupplierModal={setShowBulkSupplierModal}
        setShowDisposeModal={setShowDisposeModal}
        setSearchQuery={setSearchQuery}
        selectedBatchIds={selectedBatchIds}
        toggleBatch={toggleBatch}
        handleAction={handleAction}
        setSelectedBatchIds={setSelectedBatchIds}
        activeTab={activeTab}
        loading={loading}
        timelineCounts={timelineCounts}
        handleExportNoSupplier={handleExportNoSupplier}
        handleBackfillSuppliers={handleBackfillSuppliers}
        backfilling={backfilling}
        handleBulkReturnToSupplier={handleBulkReturnToSupplier}
        bulkReturning={bulkReturning}
        searchQuery={searchQuery}
        expiredBatches={expiredBatches}
        toggleSelectAll={toggleSelectAll}
        filteredBatches={filteredBatches}
      />

      {/* ───────────────────── INVENTORY TAB ───────────────────── */}
      <ExpiryBatchIntelligenceSection2
        setInvSearch={setInvSearch}
        setShowInvFilterDropdown={setShowInvFilterDropdown}
        invFilter={invFilter}
        setInvFilter={setInvFilter}
        setShowAddBatchModal={setShowAddBatchModal}
        handleViewBatch={handleViewBatch}
        handleEditBatch={handleEditBatch}
        handleDeleteClick={handleDeleteClick}
        activeTab={activeTab}
        invSearch={invSearch}
        showInvFilterDropdown={showInvFilterDropdown}
        invFilteredBatches={invFilteredBatches}
      />

      {/* ───────────────────── FIFO TAB ───────────────────── */}
      <ExpiryBatchIntelligenceSection3
        fifoEnabled={fifoEnabled}
        setShowFifoConfirm={setShowFifoConfirm}
        setFifoEnabled={setFifoEnabled}
        setExpandedMed={setExpandedMed}
        expandedMed={expandedMed}
        activeTab={activeTab}
        fifoMedicines={fifoMedicines}
      />

      {/* ───────────────────── SUGGESTIONS TAB ───────────────────── */}
      <ExpiryBatchIntelligenceSection4
        reminders={reminders}
        suggestions={suggestions}
        handleAction={handleAction}
        handleRemindPos={handleRemindPos}
        activeTab={activeTab}
      />

      {/* ───────────────────── CONFIG MODAL ───────────────────── */}
      <ExpiryBatchIntelligenceSection5
        setShowConfigModal={setShowConfigModal}
        setAlertSettings={setAlertSettings}
        alertSettings={alertSettings}
        frequency={frequency}
        setFrequency={setFrequency}
        isSavingConfigRef={isSavingConfigRef}
        showToast={showToast}
        setShowActionModal={setShowActionModal}
        setReturnReason={setReturnReason}
        setReturnQty={setReturnQty}
        setDiscountPct={setDiscountPct}
        setDiscountDuration={setDiscountDuration}
        setDisposalMethod={setDisposalMethod}
        setDisposalNotes={setDisposalNotes}
        setShowViewBatchModal={setShowViewBatchModal}
        setShowEditBatchModal={setShowEditBatchModal}
        setEditBatch={setEditBatch}
        editBatch={editBatch}
        setShowAddBatchModal={setShowAddBatchModal}
        setNewBatch={setNewBatch}
        newBatch={newBatch}
        setShowFifoConfirm={setShowFifoConfirm}
        setFifoEnabled={setFifoEnabled}
        setShowDeleteModal={setShowDeleteModal}
        showConfigModal={showConfigModal}
        showActionModal={showActionModal}
        actionType={actionType}
        processing={processing}
        selectedItem={selectedItem}
        returnReason={returnReason}
        returnQty={returnQty}
        discountPct={discountPct}
        discountDuration={discountDuration}
        disposalMethod={disposalMethod}
        disposalNotes={disposalNotes}
        confirmAction={confirmAction}
        showViewBatchModal={showViewBatchModal}
        viewBatch={viewBatch}
        showEditBatchModal={showEditBatchModal}
        saveEditBatch={saveEditBatch}
        showAddBatchModal={showAddBatchModal}
        addNewBatch={addNewBatch}
        showFifoConfirm={showFifoConfirm}
        showDeleteModal={showDeleteModal}
        selectedBatchForDelete={selectedBatchForDelete}
        confirmDeleteBatch={confirmDeleteBatch}
      />

      {/* ── Disposal Confirmation Modal ── */}
      <ExpiryBatchIntelligenceSection6
        disposing={disposing}
        setShowDisposeModal={setShowDisposeModal}
        showDisposeModal={showDisposeModal}
        disposalSummary={disposalSummary}
        handleBulkDispose={handleBulkDispose}
      />

      {/* ── Bulk Assign Supplier Modal ── */}
      <ExpiryBatchIntelligenceSection7
        bulkAssigning={bulkAssigning}
        setShowBulkSupplierModal={setShowBulkSupplierModal}
        setBulkSupplierId={setBulkSupplierId}
        showBulkSupplierModal={showBulkSupplierModal}
        selectedBatchIds={selectedBatchIds}
        bulkSupplierId={bulkSupplierId}
        suppliers={suppliers}
        handleBulkAssignSupplier={handleBulkAssignSupplier}
      />

      {/* ── Import CSV Modal ── */}
      <ExpiryBatchIntelligenceSection8
        importing={importing}
        setShowImportModal={setShowImportModal}
        setImportResult={setImportResult}
        setImportFile={setImportFile}
        showImportModal={showImportModal}
        importResult={importResult}
        importFile={importFile}
        handleImportCsv={handleImportCsv}
      />
    </div>
  );
}
