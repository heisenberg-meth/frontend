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

/* ─── Analytics ─── */
export const getAnalytics = (params) => api.get("analytics", { params });
export const getDashboardData = (params) =>
  api.get("dashboard", { params });

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
export const getBarcodes = (params) => api.get("v1/barcodes", { params });
export const verifyBarcode = (code) =>
  api.get(`inventory/barcode/${code}`);

/* ─── Accounting ─── */
export const getAccountingData = (params) =>
  api.get("accounting", { params });
export const createExpense = (data) =>
  api.post("accounting/expenses", data);
export const updateExpense = (id, data) =>
  api.put(`accounting/expenses/${id}`, data);
export const deleteExpense = (id) =>
  api.delete(`accounting/expenses/${id}`);
export const getGstReport = (params) =>
  api.get("accounting/gst", { params });

/* ─── Audit Logs ─── */
export const getAuditLogs = (params) => api.get("audit", { params });

/* ─── Notifications ─── */
export const getNotifications = (params) =>
  api.get("notifications", { params });
export const markNotificationRead = (id) =>
  api.put(`notifications/${id}/read`);
export const markAllNotificationsRead = () =>
  api.put("notifications/read-all");
export const deleteNotification = (id) =>
  api.delete(`notifications/${id}`);

/* ─── Subscriptions ─── */
export const getSubscriptionStatus = () => api.get("subscriptions/status");
export const createPaymentOrder = (data) =>
  api.post("payments/create-order", data);
export const verifyPayment = (data) => api.post("payments/verify", data);
export const getPaymentHistory = () => api.get("payments/history");

/* ─── Recalls ─── */
export const getRecalls = (params) => api.get("recalls", { params });
export const createRecall = (data) => api.post("recalls", data);

/* ─── Refill Reminders ─── */
export const getRefillReminders = (params) =>
  api.get("refills", { params });
export const createRefillReminder = (data) => api.post("refills", data);

/* ─── Import ─── */
export const bulkImport = (formData) =>
  api.post("import/bulk", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const importOCR = (formData) =>
  api.post("import/ocr", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const validateGST = (data) => api.post("import/gst-validate", data);
