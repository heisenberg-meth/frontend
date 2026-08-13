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
