import api from "../api";

/* ─── Barcodes ─── */
export const getBarcodes = (params) =>
  api.get("inventory/barcode/generate", { params });
export const verifyBarcode = (code) =>
  api.get(`inventory/medicines/barcode/${code}`);

/* ─── Accounting ─── */
export const getAccountingData = (params) =>
  api.get("accounting/expenses", { params });
export const createExpense = (data) => api.post("accounting/expenses", data);
export const updateExpense = (id, data) =>
  api.put(`accounting/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`accounting/expenses/${id}`);
export const getGstReport = (params) =>
  api.get("accounting/tax/gst-summary", { params });

/* ─── Audit Logs ─── */
export const getAuditLogs = (params) => api.get("audit", { params });

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
