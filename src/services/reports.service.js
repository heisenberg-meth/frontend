import api from "../api";

/* ─── Reports ─── */
export const getSalesReport = (params) =>
  api.get("reports/sales", { params });
export const getPurchaseReport = (params) =>
  api.get("reports/purchases", { params });
export const getFinanceReport = (params) =>
  api.get("reports/finance", { params });
export const getExpiryReport = (params) =>
  api.get("reports/expiry", { params });
export const exportSalesReport = (params) =>
  api.get("reports/export/sales", { params, responseType: "blob" });
export const triggerManualAggregation = (data) =>
  api.post("reports/aggregate/manual", data);

/* ─── Expiry Intelligence ─── */
export const getExpiryAlerts = () => api.get("intelligence/alerts");
export const getCriticalExpiryAlerts = () =>
  api.get("intelligence/critical");
export const resolveExpiryAlert = (id) =>
  api.put(`intelligence/alerts/${id}/resolve`);
export const triggerManualScan = () =>
  api.post("intelligence/scan/manual");
export const getExpiryBatches = (params) =>
  api.get("intelligence/batches", { params });
export const getNearExpiryBatches = () =>
  api.get("intelligence/batches/near-expiry");
export const quarantineBatch = (data) =>
  api.post("intelligence/batches/quarantine", data);
export const getExpiryRecommendations = () =>
  api.get("intelligence/recommendations");
export const triggerRecommendationGeneration = () =>
  api.post("intelligence/recommendations/generate");

/* ─── Barcodes ─── */
export const getBarcodes = (params) => api.get("inventory/barcode/generate", { params });
export const verifyBarcode = (code) =>
  api.get(`inventory/medicines/barcode/${code}`);

/* ─── Accounting ─── */
export const getAccountingData = (params) =>
  api.get("accounting/expenses", { params });
export const createExpense = (data) =>
  api.post("accounting/expenses", data);
export const updateExpense = (id, data) =>
  api.put(`accounting/expenses/${id}`, data);
export const deleteExpense = (id) =>
  api.delete(`accounting/expenses/${id}`);
export const getGstReport = (params) =>
  api.get("accounting/tax/gst-summary", { params });

/* ─── Audit Logs ─── */
export const getAuditLogs = (params) => api.get("audit-logs", { params });

/* ─── Subscriptions ─── */
export const getSubscriptionStatus = () => api.get("subscriptions/status");
export const createPaymentOrder = (data) =>
  api.post("payments/create-order", data);
export const verifyPayment = (data) => api.post("payments/verify", data);
export const getPaymentHistory = () => api.get("payments/history");

/* ─── Refill Reminders ─── */
export const getRefillReminders = (params) =>
  api.get("refills/upcoming-refills", { params });

/* ─── Import ─── */
export const bulkImport = (formData) =>
  api.post("import/bulk", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
