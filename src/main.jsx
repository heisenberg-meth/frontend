import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import "./index.css";
import "./styles/AppShell.css";
import "./styles/ConfirmModal.css";
import "./styles/DataTable.css";
import "./styles/SubscriptionCRUD.css";
import "./styles/LogoutModal.css";
import "./styles/BarcodeEcosystem.css";
import "./styles/Suppliers.css";
import "./styles/SystemSettings.css";
import "./styles/AuthSplit.css";
import "./styles/BulkImport.css";
import "./styles/PurchaseManagement.css";
import "./styles/BillingPOS.css";
import "./styles/SalesManagement.css";
import "./styles/LowStockAlerts.css";
import "./styles/Select.css";
import "./styles/AccountingTax.css";
import "./styles/AuditLogs.css";
import "./styles/ExpiryBatchIntelligence.css";
import "./styles/IntelligenceHub.css";
import "./styles/InventoryCRUD.css";
import "./styles/PrescriptionsCRUD.css";
import "./styles/ManageTeam.css";
import "./styles/ReportsHub.css";
import "./styles/Patients.css";
import "./styles/Profile.css";
import "./styles/admin.css";
import App from "./App.jsx";
import { safeNumber } from './utils/number.js';


// Global logging and self-healing auto-reload when Vite/React chunk loading fails (e.g., after deployment or asset hash change)
const handleDynamicModuleError = (errorMsg) => {
  const msg = typeof errorMsg === "string" ? errorMsg : errorMsg?.message || "";
  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("disallowed MIME type") ||
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading module from")
  ) {
    console.error(
      "[Global Error] Dynamic import/Chunk Load Error detected. Reloading page to fetch latest build...",
    );
    const lastReload = sessionStorage.getItem("chunk_reload");
    if (!lastReload || Date.now() - safeNumber(lastReload) > 10000) {
      sessionStorage.setItem("chunk_reload", Date.now().toString());
      window.location.reload();
      return true;
    }
  }
  return false;
};

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  handleDynamicModuleError(
    event.payload || "error loading dynamically imported module",
  );
});

window.addEventListener("unhandledrejection", (event) => {
  if (handleDynamicModuleError(event.reason)) {
    event.preventDefault();
    return;
  }
  console.error("[Global Error] Unhandled Promise Rejection:", event.reason);
});

window.addEventListener("error", (event) => {
  handleDynamicModuleError(event.message || event.error);
});

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="error-boundary-v2">
          <h2>Something went wrong</h2>
          <pre style={{ color: "red" }}>{error.message}</pre>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      <App />
    </ErrorBoundary>
  </BrowserRouter>,
);
