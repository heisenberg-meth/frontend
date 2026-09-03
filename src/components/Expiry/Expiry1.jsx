import {
  X,
  TrendingUp,
  RotateCcw,
  Trash2,
  Info,
  Plus,
  Save,
  Archive,
  Truck,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import api from "../../api";
import { safeNumber } from "../../utils/number.js";

export function ExpiryBatchIntelligenceSection4({
  reminders,
  suggestions,
  handleAction,
  handleRemindPos,
  activeTab,
}) {
  if (activeTab !== "suggestions") return null;

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
                {remindersSet.has(s.med) ? "✓ Reminder Added" : "Remind POS"}
              </button>
              <button
                aria-label="Delete"
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
}
function ExpiryConfigModal({
  showConfigModal,
  setShowConfigModal,
  alertSettings,
  setAlertSettings,
  frequency,
  setFrequency,
  isSavingConfigRef,
  showToast,
}) {
  if (!showConfigModal) return null;
  return (
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
            aria-label="Close"
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
                aria-label="input field"
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
                aria-label="input field"
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
  );
}

function ExpiryActionModal({
  showActionModal,
  setShowActionModal,
  actionType,
  processing,
  selectedItem,
  returnReason,
  setReturnReason,
  returnQty,
  setReturnQty,
  discountPct,
  setDiscountPct,
  discountDuration,
  setDiscountDuration,
  disposalMethod,
  setDisposalMethod,
  disposalNotes,
  setDisposalNotes,
  confirmAction,
}) {
  if (!showActionModal) return null;
  return (
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
            aria-label="Close"
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
                  setDiscountDuration(Math.max(1, safeNumber(e.target.value)))
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
  );
}

function ExpiryViewBatchModal({
  showViewBatchModal,
  setShowViewBatchModal,
  viewBatch,
}) {
  if (!showViewBatchModal || !viewBatch) return null;
  return (
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
            aria-label="Close"
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
  );
}

function ExpiryEditBatchModal({
  showEditBatchModal,
  setShowEditBatchModal,
  editBatch,
  setEditBatch,
  saveEditBatch,
}) {
  if (!showEditBatchModal || !editBatch) return null;
  return (
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
            aria-label="Close"
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
  );
}

function ExpiryAddBatchModal({
  showAddBatchModal,
  setShowAddBatchModal,
  newBatch,
  setNewBatch,
  addNewBatch,
}) {
  if (!showAddBatchModal) return null;
  return (
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
            aria-label="Close"
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
  );
}

function ExpiryFifoConfirmModal({
  showFifoConfirm,
  setShowFifoConfirm,
  setFifoEnabled,
  showToast,
}) {
  if (!showFifoConfirm) return null;
  return (
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
            aria-label="Close"
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
  );
}

function ExpiryDeleteBatchModal({
  showDeleteModal,
  setShowDeleteModal,
  selectedBatchForDelete,
  confirmDeleteBatch,
}) {
  if (!showDeleteModal || !selectedBatchForDelete) return null;
  return (
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
            aria-label="Close"
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
            This action will permanently remove this batch from inventory. This
            operation cannot be undone.
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
  );
}

export function ExpiryBatchIntelligenceSection5({
  configState = {},
  actionState = {},
  viewState = {},
  editState = {},
  addState = {},
  fifoState = {},
  deleteState = {},
}) {
  return (
    <AnimatePresence>
      <ExpiryConfigModal
        key="expiry-config-modal"
        showConfigModal={configState.show}
        setShowConfigModal={configState.setShow}
        alertSettings={configState.settings}
        setAlertSettings={configState.setSettings}
        frequency={configState.frequency}
        setFrequency={configState.setFrequency}
        isSavingConfigRef={configState.isSavingRef}
        showToast={configState.showToast}
      />
      <ExpiryActionModal
        key="expiry-action-modal"
        showActionModal={actionState.show}
        setShowActionModal={actionState.setShow}
        actionType={actionState.type}
        processing={actionState.processing}
        selectedItem={actionState.item}
        returnReason={actionState.returnReason}
        setReturnReason={actionState.setReturnReason}
        returnQty={actionState.returnQty}
        setReturnQty={actionState.setReturnQty}
        discountPct={actionState.discountPct}
        setDiscountPct={actionState.setDiscountPct}
        discountDuration={actionState.discountDuration}
        setDiscountDuration={actionState.setDiscountDuration}
        disposalMethod={actionState.disposalMethod}
        setDisposalMethod={actionState.setDisposalMethod}
        disposalNotes={actionState.disposalNotes}
        setDisposalNotes={actionState.setDisposalNotes}
        confirmAction={actionState.confirm}
      />
      <ExpiryViewBatchModal
        key="expiry-view-batch-modal"
        showViewBatchModal={viewState.show}
        setShowViewBatchModal={viewState.setShow}
        viewBatch={viewState.batch}
      />
      <ExpiryEditBatchModal
        key="expiry-edit-batch-modal"
        showEditBatchModal={editState.show}
        setShowEditBatchModal={editState.setShow}
        editBatch={editState.batch}
        setEditBatch={editState.setBatch}
        saveEditBatch={editState.save}
      />
      <ExpiryAddBatchModal
        key="expiry-add-batch-modal"
        showAddBatchModal={addState.show}
        setShowAddBatchModal={addState.setShow}
        newBatch={addState.batch}
        setNewBatch={addState.setBatch}
        addNewBatch={addState.add}
      />
      <ExpiryFifoConfirmModal
        key="expiry-fifo-confirm-modal"
        showFifoConfirm={fifoState.show}
        setShowFifoConfirm={fifoState.setShow}
        setFifoEnabled={fifoState.setFifoEnabled}
        showToast={fifoState.showToast}
      />
      <ExpiryDeleteBatchModal
        key="expiry-delete-batch-modal"
        showDeleteModal={deleteState.show}
        setShowDeleteModal={deleteState.setShow}
        selectedBatchForDelete={deleteState.batch}
        confirmDeleteBatch={deleteState.confirm}
      />
    </AnimatePresence>
  );
}
export function ExpiryBatchIntelligenceSection6({
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
          role="presentation"
          className="stock-modal-overlay"
          onClick={() => !disposing && setShowDisposeModal(false)}
          style={{
            zIndex: 1100,
          }}
        >
          <m.div
            role="presentation"
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
                  aria-label="Close"
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
export function ExpiryBatchIntelligenceSection7({
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
          role="presentation"
          className="stock-modal-overlay"
          onClick={() => !bulkAssigning && setShowBulkSupplierModal(false)}
          style={{
            zIndex: 1100,
          }}
        >
          <m.div
            role="presentation"
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
                aria-label="Close"
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
export function ExpiryBatchIntelligenceSection8({
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
          role="presentation"
          className="stock-modal-overlay"
          onClick={() => !importing && setShowImportModal(false)}
          style={{
            zIndex: 1100,
          }}
        >
          <m.div
            role="presentation"
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
                aria-label="Close"
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
                aria-label="input field"
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
