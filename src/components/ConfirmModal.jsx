import { m } from "framer-motion";
import { AlertTriangle, X, Loader2 } from "lucide-react";

function Spinner({ size = 16 }) {
  return (
    <Loader2 size={size} style={{ animation: "spin 0.8s linear infinite" }} />
  );
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  loading = false,
  icon: Icon = AlertTriangle,
}) {
  if (!isOpen) return null;

  const confirmClass =
    confirmVariant === "danger"
      ? "confirm-modal-btn danger"
      : confirmVariant === "success"
        ? "confirm-modal-btn success"
        : "confirm-modal-btn primary";

  return (
    <div role="button" tabIndex={0} className="confirm-modal-overlay" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }} onClick={onClose}>
      <m.div role="button" tabIndex={0}
        className="confirm-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }} onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-header">
          <div
            className="confirm-modal-icon"
            style={{
              background:
                confirmVariant === "danger"
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(79, 219, 200, 0.1)",
              color:
                confirmVariant === "danger"
                  ? "var(--danger)"
                  : "var(--primary)",
            }}
          >
            <Icon size={24} />
          </div>
          <h3>{title}</h3>
          <button className="confirm-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-footer">
          <button
            className="confirm-modal-btn cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className={confirmClass}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size={16} /> Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </m.div>
    </div>
  );
}
