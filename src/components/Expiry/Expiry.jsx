import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  Plus,
  Eye,
  Edit3,
  CheckSquare,
  Square,
  Archive,
  Truck,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";

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
export function ExpiryBatchIntelligenceSection1({
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
export function ExpiryBatchIntelligenceSection2({
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
export function ExpiryBatchIntelligenceSection3({
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
