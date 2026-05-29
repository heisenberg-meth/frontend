import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Supplier CRUD ─── */
export const getSuppliers = (params) => api.get(API_ROUTES.SUPPLIERS, { params });
export const getSupplierById = (id) => api.get(`${API_ROUTES.SUPPLIERS}/${id}`);
export const createSupplier = (data) => api.post(API_ROUTES.SUPPLIERS, data);
export const updateSupplier = (id, data) =>
  api.put(`${API_ROUTES.SUPPLIERS}/${id}`, data);
export const deleteSupplier = (id) => api.delete(`${API_ROUTES.SUPPLIERS}/${id}`);

/* ─── Supplier Stats & Analytics ─── */
export const getSupplierStats = () => api.get(API_ROUTES.SUPPLIERS_STATS);
export const getSupplierRankings = () => api.get("suppliers/rankings");
export const getSupplierPerformance = (id) =>
  api.get(`suppliers/${id}/performance`);
export const getSupplierLedger = (id, params) =>
  api.get(`suppliers/${id}/ledger`, { params });
export const getSupplierPurchaseHistory = (id) =>
  api.get(`suppliers/${id}/purchase-history`);
export const getSupplierDrugs = (id) => api.get(`suppliers/${id}/medicines`);

/* ─── Supplier Payments ─── */
export const recordSupplierPayment = (id, data) =>
  api.post(`suppliers/${id}/payments`, data);
export const getPendingPayments = (id) =>
  api.get(`suppliers/${id}/pending-payments`);
