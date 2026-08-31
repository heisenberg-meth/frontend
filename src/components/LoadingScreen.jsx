import { m } from "framer-motion";

export default function LoadingScreen({
  message = "Loading clinical module...",
}) {
  return (
    <div
      className="auth-loading-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "var(--bg-dark)",
        color: "var(--text)",
      }}
    >
      <m.div
        className="auth-loading-spinner"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={{
          width: 40,
          height: 40,
          border: "4px solid rgba(79, 219, 200, 0.2)",
          borderTopColor: "var(--primary)",
          borderRadius: "50%",
          marginBottom: 16,
        }}
      />
      <p style={{ color: "var(--text-muted)" }}>{message}</p>
    </div>
  );
}
