import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  const navigate = useNavigate();
  const [reason, setReason] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchReason = async () => {
      try {
        const response = await fetch("https://naas.isalman.dev/no");
        if (!response.ok) throw new Error("API failed");
        const data = await response.json();
        if (isMounted) {
          setReason(
            data.reason || "We couldn't find the page you were looking for.",
          );
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setReason("We couldn't find the page you were looking for.", err);
          setLoading(false);
        }
      }
    };
    fetchReason();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "var(--bg-dark)",
        color: "var(--text-main)",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: "var(--surface-container)",
          padding: "40px",
          borderRadius: "16px",
          border: "1px solid var(--outline-variant)",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <ShieldAlert
          size={64}
          color="var(--primary)"
          style={{ margin: "0 auto 20px" }}
        />
        <h1
          style={{
            fontSize: "5rem",
            margin: 0,
            color: "var(--primary)",
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: "1.8rem",
            margin: "10px 0 24px",
            fontWeight: "bold",
          }}
        >
          Page Not Found
        </h2>

        <div
          style={{
            minHeight: "60px",
            marginBottom: "32px",
            fontStyle: "italic",
            color: "var(--text-muted)",
            fontSize: "1.1rem",
            lineHeight: 1.6,
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Loading reason...
            </div>
          ) : (
            <p>"{reason}"</p>
          )}
        </div>

        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 28px",
            backgroundColor: "var(--primary)",
            color: "#031424",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "1rem",
            transition: "opacity 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.opacity = 0.9)}
          onMouseOut={(e) => (e.target.style.opacity = 1)}
        >
          Go Home
        </button>
      </motion.div>
    </div>
  );
}
