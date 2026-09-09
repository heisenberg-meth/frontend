import { useState, useEffect, useCallback, useRef } from "react";
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  ShieldAlert,
  PackageOpen,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import api from "../../api";

export default function ClearInventoryModal({
  isOpen,
  onClose,
  onSuccess,
  showToast,
  branchId,
}) {
  const [phase, setPhase] = useState("loading"); // loading | step1_preview | step2_confirm | clearing | done | empty
  const [summary, setSummary] = useState({
    batchCount: 0,
    totalUnits: 0,
    branchName: null,
  });
  const [confirmInput, setConfirmInput] = useState("");
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const isClearingRef = useRef(false);
  const inputRef = useRef(null);

  // Reset all modal state to initial when closed
  const resetState = useCallback(() => {
    setPhase("loading");
    setConfirmInput("");
    setResult(null);
    setErrorMsg("");
  }, []);

  // Fetch summary whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    async function loadSummary() {
      try {
        const params = branchId ? `?branchId=${branchId}` : "";
        const res = await api.get(`/inventory/clear-summary${params}`);
        if (!isSubscribed) return;

        const data = res?.data?.data || res?.data?.summary || {};
        const batchCount = Number(data.batchCount ?? 0);
        const totalUnits = Number(data.totalUnits ?? 0);
        const branchName = data.branchName || null;

        setSummary({ batchCount, totalUnits, branchName });

        if (batchCount === 0 && totalUnits === 0) {
          setPhase("empty");
        } else {
          setPhase("step1_preview");
        }
      } catch (err) {
        if (!isSubscribed) return;
        const msg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Failed to load inventory summary.";
        setErrorMsg(msg);
        setPhase("step1_preview");
        showToast?.(msg, "error");
      }
    }

    loadSummary();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, branchId, showToast]);

  // Focus input on step2
  useEffect(() => {
    if (phase === "step2_confirm") {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [phase]);

  // Handle clear submission
  const handleClear = async () => {
    if (confirmInput.trim() !== "CLEAR") return;

    setPhase("clearing");
    isClearingRef.current = true;
    setErrorMsg("");

    try {
      const params = branchId ? `?branchId=${branchId}` : "";
      const res = await api.post(`/inventory/clear${params}`);
      const data = res?.data?.summary || res?.data?.data || {};

      setResult({
        batchesCleared: data.batchesCleared ?? summary.batchCount,
        unitsCleared: data.unitsCleared ?? summary.totalUnits,
      });
      setPhase("done");

      showToast?.(
        res?.data?.message || "Inventory cleared successfully.",
        "success",
      );

      // Trigger parent reload
      onSuccess?.(data);
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Failed to clear inventory. Please try again.";
      setErrorMsg(msg);
      showToast?.(msg, "error");
      setPhase("step2_confirm"); // allow retry
    } finally {
      isClearingRef.current = false;
    }
  };

  const handleClose = () => {
    if (isClearingRef.current) return;
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="cim-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isClearingRef.current) {
            handleClose();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cim-modal-title"
      >
        <m.div
          className="cim-modal"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 1. LOADING PHASE */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {phase === "loading" && (
            <div className="cim-loading-box">
              <Loader2 size={36} className="cim-spinner" />
              <p className="cim-loading-text">Analyzing active inventory…</p>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 2. EMPTY INVENTORY PHASE */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {phase === "empty" && (
            <>
              <div className="cim-header">
                <div className="cim-icon-wrap neutral">
                  <PackageOpen size={22} />
                </div>
                <div>
                  <h2 id="cim-modal-title" className="cim-title">
                    Clear Inventory
                  </h2>
                  <p className="cim-subtitle">
                    {summary.branchName
                      ? `Branch: ${summary.branchName}`
                      : "Current Branch"}
                  </p>
                </div>
                <button
                  className="cim-close-btn"
                  onClick={handleClose}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="cim-body">
                <div className="cim-empty-card">
                  <PackageOpen size={40} className="cim-empty-icon" />
                  <h3>No Active Inventory Found</h3>
                  <p>
                    There is currently no active inventory or available stock to
                    clear for this branch.
                  </p>
                </div>
              </div>

              <div className="cim-footer">
                <button className="cim-btn primary" onClick={handleClose}>
                  Close
                </button>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 3. STEP 1: IMPACT PREVIEW */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {phase === "step1_preview" && (
            <>
              <div className="cim-header">
                <div className="cim-icon-wrap danger">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h2 id="cim-modal-title" className="cim-title">
                    Clear Entire Inventory?
                  </h2>
                  <p className="cim-subtitle">
                    {summary.branchName
                      ? `Branch: ${summary.branchName}`
                      : "Destructive operation for current branch"}
                  </p>
                </div>
                <button
                  className="cim-close-btn"
                  onClick={handleClose}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="cim-body">
                <div className="cim-stats-banner">
                  <div className="cim-stat-col">
                    <span className="cim-stat-num">
                      {summary.batchCount.toLocaleString()}
                    </span>
                    <span className="cim-stat-lbl">Inventory Batches</span>
                  </div>
                  <div className="cim-stat-divider" />
                  <div className="cim-stat-col">
                    <span className="cim-stat-num">
                      {summary.totalUnits.toLocaleString()}
                    </span>
                    <span className="cim-stat-lbl">Total Units Stock</span>
                  </div>
                </div>

                <div className="cim-impact-section">
                  <h4 className="cim-section-title danger-text">
                    What will be affected:
                  </h4>
                  <ul className="cim-bullet-list danger-bullets">
                    <li>All active inventory batches will be archived.</li>
                    <li>Stock quantities will be reset to 0.</li>
                    <li>Immediate stock availability will become 0.</li>
                  </ul>
                </div>

                <div className="cim-impact-section">
                  <h4 className="cim-section-title safe-text">
                    What will be preserved:
                  </h4>
                  <ul className="cim-bullet-list safe-bullets">
                    <li>
                      <CheckCircle2 size={14} className="cim-check" />
                      <strong>Medicine Catalog:</strong> Master records &amp;
                      medicines remain intact.
                    </li>
                    <li>
                      <CheckCircle2 size={14} className="cim-check" />
                      <strong>Business Records:</strong> Purchase invoices,
                      sales history, and GST data remain intact.
                    </li>
                    <li>
                      <CheckCircle2 size={14} className="cim-check" />
                      <strong>Traceability:</strong> Full audit logs &amp;
                      inventory ledger history are preserved.
                    </li>
                  </ul>
                </div>

                {errorMsg && <div className="cim-error-bar">{errorMsg}</div>}
              </div>

              <div className="cim-footer">
                <button className="cim-btn secondary" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  id="cim-proceed-step2-btn"
                  className="cim-btn primary danger"
                  onClick={() => setPhase("step2_confirm")}
                >
                  <span>Continue</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 4. STEP 2: TYPING CONFIRMATION (SAFETY GATE) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {phase === "step2_confirm" && (
            <>
              <div className="cim-header">
                <div className="cim-icon-wrap danger">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h2 id="cim-modal-title" className="cim-title">
                    Final Safety Confirmation
                  </h2>
                  <p className="cim-subtitle">
                    Action cannot be undone automatically
                  </p>
                </div>
                <button
                  className="cim-close-btn"
                  onClick={handleClose}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="cim-body">
                <div className="cim-confirm-box">
                  <p className="cim-confirm-lead">
                    You are about to clear <strong>{summary.batchCount}</strong>{" "}
                    inventory batches and{" "}
                    <strong>{summary.totalUnits.toLocaleString()}</strong> units
                    from active inventory
                    {summary.branchName ? ` at ${summary.branchName}` : ""}.
                  </p>
                  <p className="cim-confirm-instruction">
                    To prevent accidental data loss, please type{" "}
                    <span className="cim-badge-clear">CLEAR</span> below to
                    confirm:
                  </p>

                  <div className="cim-input-wrapper">
                    <input
                      ref={inputRef}
                      id="cim-confirm-input"
                      type="text"
                      className="cim-confirm-input"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      placeholder="Type CLEAR"
                      autoComplete="off"
                      spellCheck="false"
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          confirmInput.trim() === "CLEAR"
                        ) {
                          handleClear();
                        }
                      }}
                    />
                  </div>
                </div>

                {errorMsg && <div className="cim-error-bar">{errorMsg}</div>}
              </div>

              <div className="cim-footer">
                <button
                  className="cim-btn secondary"
                  onClick={() => setPhase("step1_preview")}
                >
                  <ArrowLeft size={15} />
                  <span>Back</span>
                </button>
                <button
                  id="cim-final-clear-btn"
                  className={`cim-btn primary danger ${confirmInput.trim() !== "CLEAR" ? "disabled" : ""}`}
                  disabled={confirmInput.trim() !== "CLEAR"}
                  onClick={handleClear}
                >
                  <Trash2 size={16} />
                  <span>Clear Entire Inventory</span>
                </button>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 5. CLEARING IN PROGRESS */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {phase === "clearing" && (
            <div className="cim-progress-box">
              <div className="cim-progress-icon">
                <Loader2 size={40} className="cim-spinner" />
              </div>
              <h2 className="cim-progress-title">Clearing Inventory…</h2>
              <p className="cim-progress-subtitle">
                Archiving {summary.batchCount} batches and resetting stock
                quantities.
              </p>
              <div className="cim-bar-track">
                <div className="cim-bar-fill" />
              </div>
              <p className="cim-progress-note">
                Please do not close or refresh this window.
              </p>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 6. DONE PHASE */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {phase === "done" && (
            <>
              <div className="cim-header">
                <div className="cim-icon-wrap success">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h2 id="cim-modal-title" className="cim-title text-success">
                    Inventory Cleared Successfully
                  </h2>
                  <p className="cim-subtitle">
                    Active stock has been reset to zero
                  </p>
                </div>
                <button
                  className="cim-close-btn"
                  onClick={handleClose}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="cim-body">
                <div className="cim-result-grid">
                  <div className="cim-result-card success">
                    <span className="cim-result-val">
                      {result?.batchesCleared ?? 0}
                    </span>
                    <span className="cim-result-lbl">Batches Cleared</span>
                  </div>
                  <div className="cim-result-card neutral">
                    <span className="cim-result-val">
                      {result?.unitsCleared?.toLocaleString() ?? 0}
                    </span>
                    <span className="cim-result-lbl">Units Removed</span>
                  </div>
                  <div className="cim-result-card highlight">
                    <span className="cim-result-val">0</span>
                    <span className="cim-result-lbl">Active Stock</span>
                  </div>
                </div>

                <p className="cim-done-assurance">
                  Medicine master records, historical purchase invoices, and
                  audit records remain safely stored and accessible.
                </p>
              </div>

              <div className="cim-footer">
                <button
                  id="cim-done-btn"
                  className="cim-btn primary success"
                  onClick={handleClose}
                >
                  Done
                </button>
              </div>
            </>
          )}
        </m.div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SCOPED COMPONENT STYLES */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <style>{`
          .cim-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            background: rgba(10, 12, 16, 0.72);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
          }

          .cim-modal {
            background: var(--surface, #131720);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px;
            width: 100%;
            max-width: 520px;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.04);
            overflow: hidden;
            color: var(--on-surface, #f1f5f9);
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          }

          .cim-header {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            position: relative;
          }

          .cim-icon-wrap {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .cim-icon-wrap.danger {
            background: rgba(239, 68, 68, 0.12);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.25);
          }

          .cim-icon-wrap.success {
            background: rgba(34, 197, 94, 0.12);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.25);
          }

          .cim-icon-wrap.neutral {
            background: rgba(148, 163, 184, 0.12);
            color: #94a3b8;
            border: 1px solid rgba(148, 163, 184, 0.2);
          }

          .cim-title {
            margin: 0;
            font-size: 17px;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: #f8fafc;
          }

          .cim-title.text-success {
            color: #22c55e;
          }

          .cim-subtitle {
            margin: 2px 0 0;
            font-size: 13px;
            color: #94a3b8;
          }

          .cim-close-btn {
            margin-left: auto;
            background: transparent;
            border: none;
            color: #64748b;
            cursor: pointer;
            padding: 6px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
          }

          .cim-close-btn:hover {
            color: #f1f5f9;
            background: rgba(255, 255, 255, 0.08);
          }

          .cim-body {
            padding: 22px 24px;
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .cim-stats-banner {
            display: flex;
            align-items: center;
            justify-content: space-around;
            background: rgba(239, 68, 68, 0.06);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 12px;
            padding: 14px 16px;
          }

          .cim-stat-col {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .cim-stat-num {
            font-size: 22px;
            font-weight: 800;
            color: #ef4444;
            letter-spacing: -0.02em;
          }

          .cim-stat-lbl {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #cbd5e1;
            font-weight: 600;
            margin-top: 2px;
          }

          .cim-stat-divider {
            width: 1px;
            height: 36px;
            background: rgba(239, 68, 68, 0.2);
          }

          .cim-impact-section {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .cim-section-title {
            margin: 0;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .cim-section-title.danger-text {
            color: #f87171;
          }

          .cim-section-title.safe-text {
            color: #34d399;
          }

          .cim-bullet-list {
            margin: 0;
            padding-left: 20px;
            font-size: 13px;
            color: #cbd5e1;
            line-height: 1.55;
          }

          .cim-bullet-list.danger-bullets li::marker {
            color: #ef4444;
          }

          .cim-bullet-list.safe-bullets {
            list-style: none;
            padding-left: 0;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .cim-bullet-list.safe-bullets li {
            display: flex;
            align-items: flex-start;
            gap: 8px;
          }

          .cim-check {
            color: #22c55e;
            margin-top: 2px;
            flex-shrink: 0;
          }

          .cim-confirm-box {
            background: rgba(239, 68, 68, 0.05);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 12px;
            padding: 18px;
            text-align: center;
          }

          .cim-confirm-lead {
            margin: 0 0 10px;
            font-size: 14px;
            line-height: 1.5;
            color: #f1f5f9;
          }

          .cim-confirm-instruction {
            margin: 0 0 14px;
            font-size: 13px;
            color: #94a3b8;
          }

          .cim-badge-clear {
            display: inline-block;
            background: #ef4444;
            color: #fff;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 800;
            letter-spacing: 0.05em;
            font-size: 12px;
          }

          .cim-confirm-input {
            width: 100%;
            max-width: 260px;
            text-align: center;
            background: rgba(15, 23, 42, 0.85);
            border: 1.5px solid rgba(239, 68, 68, 0.4);
            border-radius: 8px;
            color: #ef4444;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.18em;
            padding: 10px 14px;
            outline: none;
            transition: all 0.2s ease;
          }

          .cim-confirm-input:focus {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
          }

          .cim-error-bar {
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
          }

          .cim-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(0, 0, 0, 0.18);
          }

          .cim-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 18px;
            border-radius: 9px;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.18s ease;
          }

          .cim-btn.secondary {
            background: rgba(255, 255, 255, 0.07);
            color: #e2e8f0;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .cim-btn.secondary:hover {
            background: rgba(255, 255, 255, 0.12);
          }

          .cim-btn.primary {
            background: #0ea5e9;
            color: #fff;
          }

          .cim-btn.primary.danger {
            background: #ef4444;
            color: #fff;
            box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
          }

          .cim-btn.primary.danger:hover:not(.disabled) {
            background: #dc2626;
            box-shadow: 0 6px 18px rgba(239, 68, 68, 0.45);
          }

          .cim-btn.primary.danger.disabled {
            opacity: 0.4;
            cursor: not-allowed;
            box-shadow: none;
          }

          .cim-btn.primary.success {
            background: #22c55e;
            color: #fff;
          }

          .cim-btn.primary.success:hover {
            background: #16a34a;
          }

          .cim-loading-box,
          .cim-progress-box {
            padding: 48px 24px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }

          .cim-spinner {
            animation: cim-spin 0.9s linear infinite;
            color: #ef4444;
          }

          @keyframes cim-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .cim-loading-text,
          .cim-progress-title {
            font-size: 16px;
            font-weight: 700;
            margin: 0;
            color: #f1f5f9;
          }

          .cim-progress-subtitle {
            margin: 0;
            font-size: 13px;
            color: #94a3b8;
          }

          .cim-bar-track {
            width: 100%;
            max-width: 280px;
            height: 6px;
            border-radius: 3px;
            background: rgba(255, 255, 255, 0.08);
            overflow: hidden;
            margin: 8px 0;
          }

          .cim-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #ef4444, #f97316);
            width: 60%;
            border-radius: 3px;
            animation: cim-bar-move 1.4s ease-in-out infinite alternate;
          }

          @keyframes cim-bar-move {
            0% { transform: translateX(-40%); width: 30%; }
            100% { transform: translateX(180%); width: 60%; }
          }

          .cim-progress-note {
            font-size: 12px;
            color: #64748b;
            margin: 0;
          }

          .cim-empty-card {
            padding: 24px;
            text-align: center;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            border: 1px dashed rgba(255, 255, 255, 0.1);
          }

          .cim-empty-icon {
            color: #64748b;
            margin-bottom: 8px;
          }

          .cim-empty-card h3 {
            margin: 0 0 6px;
            font-size: 15px;
            color: #e2e8f0;
          }

          .cim-empty-card p {
            margin: 0;
            font-size: 13px;
            color: #94a3b8;
          }

          .cim-result-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }

          .cim-result-card {
            padding: 14px 8px;
            border-radius: 12px;
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .cim-result-card.success {
            background: rgba(34, 197, 94, 0.08);
            border: 1px solid rgba(34, 197, 94, 0.2);
          }

          .cim-result-card.success .cim-result-val {
            color: #22c55e;
          }

          .cim-result-card.neutral {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
          }

          .cim-result-card.neutral .cim-result-val {
            color: #f1f5f9;
          }

          .cim-result-card.highlight {
            background: rgba(14, 165, 233, 0.08);
            border: 1px solid rgba(14, 165, 233, 0.2);
          }

          .cim-result-card.highlight .cim-result-val {
            color: #38bdf8;
          }

          .cim-result-val {
            font-size: 20px;
            font-weight: 800;
          }

          .cim-result-lbl {
            font-size: 11px;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
          }

          .cim-done-assurance {
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.5;
            text-align: center;
            margin: 0;
          }
        `}</style>
      </div>
    </AnimatePresence>
  );
}
