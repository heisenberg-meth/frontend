import { useState } from "react";
import { ShieldAlert, Clock, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SessionExpiredModal({ isOpen, onDismiss, onLogin }) {
  const [showLogin, setShowLogin] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="session-expired-overlay">
        <motion.div
          className="session-expired-card"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="session-expired-icon">
            <ShieldAlert size={48} />
          </div>

          <div className="session-expired-badge">
            <Clock size={14} />
            <span>SESSION EXPIRED</span>
          </div>

          <h2>Your session has timed out</h2>
          <p>
            For your security, you have been logged out due to inactivity.
            Please sign in again to continue.
          </p>

          <div className="session-expired-actions">
            <button
              className="session-expired-btn primary"
              onClick={() => {
                setShowLogin(true);
                onLogin();
              }}
            >
              <LogIn size={18} />
              Sign In Again
            </button>
            <button
              className="session-expired-btn secondary"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          </div>

          <p className="session-expired-note">
            This helps protect your patient data and facility information.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
