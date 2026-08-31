/**
 * ClearExpiredButton
 * ─────────────────────────────────────────────────────────────────
 * Self-contained "Clear Expired Batches" feature component.
 *
 * Renders a button that shows the clearable-batch count and drives
 * the full confirm → loading → success / error flow described in the
 * "Clear Expired Batches" PRD.
 *
 * Props
 *   showToast  (fn)    – toast notification callback (msg, type)
 *   onCleared  (fn)    – called after a successful clear so parent
 *                        can refresh its data
 *   branchId   (str?)  – optional branch filter
 *   className  (str?)  – extra class names on the trigger button
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Trash2, AlertTriangle, CheckCircle2, X, Loader2 } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import api from "../api";

/* ─── tiny helpers ─────────────────────────────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ClearExpiredButton({
  showToast,
  onCleared,
  branchId,
  className = "",
}) {
  const [count, setCount] = useState(null); // null = not loaded yet
  const [loadingCount, setLoadingCount] = useState(false);

  // Modal states
  const [showConfirm, setShowConfirm] = useState(false);
  const clearingRef = useRef(false);
  const [result, setResult] = useState(null); // { cleared, skipped, failed, remaining }
  const [phase, setPhase] = useState("idle"); // idle | confirm | clearing | done

  /* ── Fetch clearable count ──────────────────────────────────── */
  const fetchCount = useCallback(async () => {
    try {
      setLoadingCount(true);
      const params = branchId ? `?branchId=${branchId}` : "";
      const res = await api.get(`/inventory/expired/clearable${params}`);
      const data = res?.data?.data ?? res?.data ?? {};
      setCount(data.count ?? 0);
    } catch {
      setCount(0);
    } finally {
      setLoadingCount(false);
    }
  }, [branchId]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const params = branchId ? `?branchId=${branchId}` : "";
        const res = await api.get(`/inventory/expired/clearable${params}`);
        if (!ignore) {
          const data = res?.data?.data ?? res?.data ?? {};
          setCount(data.count ?? 0);
        }
      } catch {
        if (!ignore) setCount(0);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [branchId]);

  /* ── Handler: user clicks the trigger button ────────────────── */
  const handleOpenConfirm = () => {
    if (!count) return;
    setResult(null);
    setPhase("confirm");
    setShowConfirm(true);
  };

  /* ── Handler: user confirms clear ──────────────────────────── */
  const handleClear = async () => {
    setPhase("clearing");
    clearingRef.current = true;
    try {
      const params = branchId ? `?branchId=${branchId}` : "";
      const res = await api.post(`/inventory/expired/clear${params}`);
      const data = res?.data?.data ?? res?.data ?? {};

      // Small artificial delay so the progress bar feels real
      await sleep(600);

      setResult(data);
      setPhase("done");

      // Refresh the count
      await fetchCount();

      // Notify parent
      onCleared?.();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to clear expired batches.";
      showToast?.(msg, "error");
      setPhase("confirm"); // revert to confirm so user can retry
    } finally {
      clearingRef.current = false;
    }
  };

  /* ── Handler: close / dismiss ───────────────────────────────── */
  const handleClose = () => {
    if (clearingRef.current) return; // prevent close during operation
    setShowConfirm(false);
    setPhase("idle");
    setResult(null);
  };

  /* ── Render ─────────────────────────────────────────────────── */
  const disabled = !count || loadingCount;

  return (
    <>
      {/* ── Trigger button ──────────────────────────────────── */}
      <button
        id="clear-expired-btn"
        className={`clear-expired-trigger-btn ${disabled ? "disabled" : ""} ${className}`}
        onClick={handleOpenConfirm}
        disabled={disabled}
        title={
          disabled
            ? "No disposed expired batches to clear"
            : `Clear ${count} disposed expired batches from active inventory`
        }
        aria-label={`Clear expired batches${count ? ` (${count} available)` : ""}`}
      >
        <Trash2 size={14} />
        <span>Clear Expired</span>
        {loadingCount ? (
          <span className="clear-expired-badge loading">…</span>
        ) : count > 0 ? (
          <span className="clear-expired-badge">{count}</span>
        ) : null}
      </button>

      {/* ── Modal overlay ───────────────────────────────────── */}
      <AnimatePresence>
        {showConfirm && (
          <m.div
            tabIndex={0}
            className="clear-expired-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.currentTarget.click();
              }
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !clearingRef.current)
                handleClose();
            }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="clear-expired-dialog-title"
          >
            <m.div
              className="clear-expired-modal"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* ── CONFIRM phase ─────────────────────────── */}
              {phase === "confirm" && (
                <>
                  <div className="cem-header">
                    <div className="cem-icon-wrap danger">
                      <AlertTriangle size={22} />
                    </div>
                    <div>
                      <h2 id="clear-expired-dialog-title" className="cem-title">
                        Clear Expired Inventory
                      </h2>
                      <p className="cem-subtitle">
                        This action cannot be undone.
                      </p>
                    </div>
                    <button
                      className="cem-close-btn"
                      onClick={handleClose}
                      aria-label="Close dialog"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="cem-body">
                    <div className="cem-info-banner">
                      <span className="cem-count">{count}</span>
                      <span className="cem-count-label">
                        disposed expired batch
                        {count !== 1 ? "es" : ""} will be removed from active
                        inventory.
                      </span>
                    </div>

                    <ul className="cem-assurance-list">
                      <li>
                        <CheckCircle2 size={14} className="cem-check" />
                        Disposal history, audit logs &amp; reports remain
                        intact.
                      </li>
                      <li>
                        <CheckCircle2 size={14} className="cem-check" />
                        Only fully disposed batches are affected.
                      </li>
                      <li>
                        <CheckCircle2 size={14} className="cem-check" />
                        Active, low-stock &amp; expiring batches are not
                        touched.
                      </li>
                    </ul>

                    <p className="cem-confirm-question">
                      Do you want to continue?
                    </p>
                  </div>

                  <div className="cem-footer">
                    <button
                      id="clear-expired-cancel-btn"
                      className="cem-btn secondary"
                      onClick={handleClose}
                    >
                      Cancel
                    </button>
                    <button
                      id="clear-expired-confirm-btn"
                      className="cem-btn primary danger"
                      onClick={handleClear}
                    >
                      <Trash2 size={14} />
                      Clear&nbsp;{count}&nbsp;Batch{count !== 1 ? "es" : ""}
                    </button>
                  </div>
                </>
              )}

              {/* ── CLEARING phase ────────────────────────── */}
              {phase === "clearing" && (
                <div className="cem-progress-container">
                  <div className="cem-progress-icon">
                    <Loader2 size={36} className="cem-spinner" />
                  </div>
                  <h2 className="cem-progress-title">Clearing batches…</h2>
                  <p className="cem-progress-subtitle">
                    Archiving {count} disposed expired batch
                    {count !== 1 ? "es" : ""}. Please wait.
                  </p>
                  <div className="cem-progress-bar-track">
                    <div className="cem-progress-bar-fill animate" />
                  </div>
                  <p className="cem-progress-note">Do not close this window.</p>
                </div>
              )}

              {/* ── DONE phase ───────────────────────────── */}
              {phase === "done" && result && (
                <>
                  <div className="cem-header">
                    <div className="cem-icon-wrap success">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h2 className="cem-title success">
                        Cleared Successfully
                      </h2>
                      <p className="cem-subtitle">Inventory refreshed.</p>
                    </div>
                    <button
                      className="cem-close-btn"
                      onClick={handleClose}
                      aria-label="Close dialog"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="cem-body">
                    <div className="cem-result-grid">
                      <div className="cem-result-item success">
                        <span className="cem-result-val">
                          {result.cleared ?? 0}
                        </span>
                        <span className="cem-result-label">
                          Batches Removed
                        </span>
                      </div>
                      {(result.skipped ?? 0) > 0 && (
                        <div className="cem-result-item warn">
                          <span className="cem-result-val">
                            {result.skipped}
                          </span>
                          <span className="cem-result-label">Skipped</span>
                        </div>
                      )}
                      <div className="cem-result-item neutral">
                        <span className="cem-result-val">
                          {result.remaining ?? 0}
                        </span>
                        <span className="cem-result-label">Remaining</span>
                      </div>
                    </div>

                    <p className="cem-done-note">
                      Disposal history, audit logs and reports remain fully
                      accessible.
                    </p>
                  </div>

                  <div className="cem-footer">
                    <button
                      id="clear-expired-done-btn"
                      className="cem-btn primary success"
                      onClick={handleClose}
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ── Scoped styles ───────────────────────────────────────── */}
      <style>{`
        /* ── Trigger Button ───────────────────────────────────── */
        .clear-expired-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1.5px solid #ef444430;
          background: #ef444408;
          color: #ef4444;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
          position: relative;
        }
        .clear-expired-trigger-btn:hover:not(.disabled) {
          background: #ef44441a;
          border-color: #ef4444;
          box-shadow: 0 0 0 3px #ef444420;
        }
        .clear-expired-trigger-btn.disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .clear-expired-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          border-radius: 10px;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
        }
        .clear-expired-badge.loading {
          background: #94a3b8;
          font-size: 12px;
        }

        /* ── Overlay ──────────────────────────────────────────── */
        .clear-expired-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        /* ── Modal card ───────────────────────────────────────── */
        .clear-expired-modal {
          background: var(--surface, #1a1d23);
          border: 1px solid var(--outline-variant, #2d3142);
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          overflow: hidden;
        }

        /* ── Header ───────────────────────────────────────────── */
        .cem-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 20px 20px 0;
        }
        .cem-icon-wrap {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cem-icon-wrap.danger {
          background: #ef444420;
          color: #ef4444;
        }
        .cem-icon-wrap.success {
          background: #22c55e20;
          color: #22c55e;
        }
        .cem-close-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--on-surface-variant, #94a3b8);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          transition: color 0.15s, background 0.15s;
        }
        .cem-close-btn:hover {
          color: var(--on-surface, #e2e8f0);
          background: rgba(255,255,255,0.06);
        }
        .cem-title {
          font-family: 'Outfit', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: var(--on-surface, #e2e8f0);
          margin: 0 0 2px;
        }
        .cem-title.success { color: #22c55e; }
        .cem-subtitle {
          font-size: 12px;
          color: var(--on-surface-variant, #94a3b8);
          margin: 0;
        }

        /* ── Body ─────────────────────────────────────────────── */
        .cem-body {
          padding: 18px 20px;
        }
        .cem-info-banner {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 14px 16px;
          border-radius: 10px;
          background: linear-gradient(135deg, #ef444415, #ef444408);
          border: 1px solid #ef444430;
          margin-bottom: 16px;
        }
        .cem-count {
          font-size: 28px;
          font-weight: 800;
          color: #ef4444;
          font-family: 'Outfit', sans-serif;
        }
        .cem-count-label {
          font-size: 13px;
          color: var(--on-surface, #e2e8f0);
          font-weight: 500;
        }
        .cem-assurance-list {
          list-style: none;
          padding: 0;
          margin: 0 0 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cem-assurance-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--on-surface-variant, #94a3b8);
        }
        .cem-check { color: #22c55e; flex-shrink: 0; }
        .cem-confirm-question {
          font-size: 14px;
          font-weight: 600;
          color: var(--on-surface, #e2e8f0);
          margin: 0;
        }

        /* ── Footer ───────────────────────────────────────────── */
        .cem-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding: 14px 20px 20px;
          border-top: 1px solid var(--outline-variant, #2d3142);
        }
        .cem-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 9px;
          font-size: 13.5px;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          border: none;
          transition: all 0.15s ease;
        }
        .cem-btn.secondary {
          background: var(--surface-variant, #252836);
          color: var(--on-surface, #e2e8f0);
          border: 1px solid var(--outline-variant, #2d3142);
        }
        .cem-btn.secondary:hover {
          background: var(--surface-hover, #2e3248);
        }
        .cem-btn.primary.danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          box-shadow: 0 4px 14px #ef444440;
        }
        .cem-btn.primary.danger:hover {
          background: linear-gradient(135deg, #f87171, #ef4444);
          box-shadow: 0 6px 18px #ef444455;
          transform: translateY(-1px);
        }
        .cem-btn.primary.success {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          box-shadow: 0 4px 14px #22c55e40;
        }
        .cem-btn.primary.success:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        /* ── Progress ─────────────────────────────────────────── */
        .cem-progress-container {
          padding: 36px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }
        .cem-progress-icon { color: #ef4444; }
        @keyframes cem-spin {
          to { transform: rotate(360deg); }
        }
        .cem-spinner {
          animation: cem-spin 0.8s linear infinite;
        }
        .cem-progress-title {
          font-family: 'Outfit', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: var(--on-surface, #e2e8f0);
          margin: 0;
        }
        .cem-progress-subtitle {
          font-size: 13px;
          color: var(--on-surface-variant, #94a3b8);
          margin: 0;
        }
        .cem-progress-bar-track {
          width: 100%;
          height: 8px;
          background: var(--surface-variant, #252836);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 6px;
        }
        @keyframes cem-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .cem-progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444, #f97316, #ef4444);
          border-radius: 4px;
          width: 60%;
        }
        .cem-progress-bar-fill.animate {
          animation: cem-sweep 1.4s ease-in-out infinite;
        }
        .cem-progress-note {
          font-size: 12px;
          color: var(--on-surface-variant, #64748b);
          margin: 0;
        }

        /* ── Result grid ──────────────────────────────────────── */
        .cem-result-grid {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }
        .cem-result-item {
          flex: 1;
          border-radius: 10px;
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          border: 1px solid transparent;
        }
        .cem-result-item.success {
          background: #22c55e12;
          border-color: #22c55e30;
        }
        .cem-result-item.warn {
          background: #f9731612;
          border-color: #f9731630;
        }
        .cem-result-item.neutral {
          background: rgba(255,255,255,0.04);
          border-color: var(--outline-variant, #2d3142);
        }
        .cem-result-val {
          font-size: 26px;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
          color: var(--on-surface, #e2e8f0);
        }
        .cem-result-item.success .cem-result-val { color: #22c55e; }
        .cem-result-item.warn .cem-result-val { color: #f97316; }
        .cem-result-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--on-surface-variant, #94a3b8);
        }
        .cem-done-note {
          font-size: 12px;
          color: var(--on-surface-variant, #64748b);
          margin: 0;
          text-align: center;
        }
      `}</style>
    </>
  );
}
