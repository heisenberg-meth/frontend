import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Purchase Orders CRUD ─── */
export const getPurchaseOrders = (params) =>
  api.get(API_ROUTES.PURCHASES_ORDERS, { params });
export const getPurchaseOrderById = (id) =>
  api.get(`${API_ROUTES.PURCHASES_ORDERS}/${id}`);
export const createPurchaseOrder = (data) =>
  api.post(API_ROUTES.PURCHASES_ORDERS, data);
export const submitPurchaseOrder = (id) =>
  api.patch(`${API_ROUTES.PURCHASES_ORDERS}/${id}/status`, {
    status: "PENDING_APPROVAL",
  });
export const approvePurchaseOrder = (id) =>
  api.post(`${API_ROUTES.PURCHASES_ORDERS}/${id}/approve`);
export const cancelPurchaseOrder = (id, reason) =>
  api.post(`${API_ROUTES.PURCHASES_ORDERS}/${id}/cancel`, { reason });
export const receivePurchaseOrder = (id, data) =>
  api.post(`${API_ROUTES.PURCHASES_ORDERS}/${id}/receive`, data);

export const getPurchaseInvoices = () => api.get(API_ROUTES.PURCHASES_INVOICES);

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


