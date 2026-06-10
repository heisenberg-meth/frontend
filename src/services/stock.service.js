import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Stock Operations ─── */
export const stockIn = (data) => api.post(`${API_ROUTES.STOCK}/in`, data);
export const stockOut = (data) => api.post(`${API_ROUTES.STOCK}/out`, data);
export const recordDamage = (data) =>
  api.post(`${API_ROUTES.STOCK}/damage`, data);
export const getStockHistory = (params) =>
  api.get(`${API_ROUTES.STOCK}/history`, { params });
export const getStockAlerts = () => api.get(`${API_ROUTES.STOCK}/alerts`);
export const resolveStockAlert = (id) =>
  api.put(`${API_ROUTES.STOCK}/alerts/${id}/resolve`);
export const getCurrentStock = (medicineId) =>
  api.get(`${API_ROUTES.STOCK}/current/${medicineId}`);
