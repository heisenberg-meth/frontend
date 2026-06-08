import { ErrorBoundary } from "react-error-boundary";
import { ShieldAlert } from "lucide-react";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        height: "100%",
        minHeight: "400px",
        backgroundColor: "var(--surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--outline-variant)",
        textAlign: "center",
      }}
    >
      <ShieldAlert
        size={48}
        style={{ color: "var(--danger)", marginBottom: "16px" }}
      />
      <h3 style={{ color: "var(--text)", marginBottom: "8px" }}>
        Component Error
      </h3>
      <p
        style={{
          color: "var(--text-muted)",
          marginBottom: "16px",
          maxWidth: "400px",
        }}
      >
        An unexpected error occurred while rendering this section.
      </p>
      <pre
        style={{
          background: "var(--surface-container-highest)",
          padding: "12px",
          borderRadius: "8px",
          color: "var(--danger)",
          fontSize: "12px",
          overflowX: "auto",
          maxWidth: "100%",
          marginBottom: "24px",
        }}
      >
        {error.message}
      </pre>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: "10px 20px",
          background: "var(--primary)",
          color: "#031424",
          border: "none",
          borderRadius: "8px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Try Again
      </button>
    </div>
  );
}

export default function PageErrorBoundary({ children }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
  );
}
