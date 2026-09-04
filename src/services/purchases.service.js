import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Purchase Orders CRUD ─── */
export const createPurchaseOrder = (data) =>
  api.post(API_ROUTES.PURCHASES_ORDERS, data);
export const updatePurchaseOrder = (id, data) =>
  api.put(`${API_ROUTES.PURCHASES_ORDERS}/${id}`, data);
export const receivePurchaseOrder = (id, data) =>
  api.post(`${API_ROUTES.PURCHASES_ORDERS}/${id}/receive`, data);

/* ─── Smart Reorder ─── */
export const createReorder = (data) =>
  api.post(`${API_ROUTES.PURCHASES_ORDERS}/reorder`, data);

/* ─── PO PDF URL ─── */
export const getPurchaseOrderPdfUrl = (id) => {
  const base =
    api.defaults?.baseURL ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:3000/api";
  return `${base}/purchase-orders/${id}/pdf`;
};
