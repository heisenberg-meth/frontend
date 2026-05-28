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
  api.post(`${API_ROUTES.PURCHASES_ORDERS}/${id}/submit`);
export const approvePurchaseOrder = (id) =>
  api.post(`${API_ROUTES.PURCHASES_ORDERS}/${id}/approve`);
export const cancelPurchaseOrder = (id) =>
  api.post(`${API_ROUTES.PURCHASES_ORDERS}/${id}/cancel`);
export const receivePurchaseOrder = (id, data) =>
  api.post(`${API_ROUTES.PURCHASES_ORDERS}/${id}/receive`, data);

/* ─── Purchase Operations ─── */
export const receiveGoods = (data) => api.post(API_ROUTES.PURCHASES_RECEIVE, data);
export const processPurchaseReturn = (data) =>
  api.post(API_ROUTES.PURCHASES_RETURNS, data);

/* ─── Purchase (Legacy) ─── */
export const getPurchaseSuppliers = () => api.get("purchase/suppliers");
export const createPurchaseSupplier = (data) =>
  api.post("purchase/suppliers", data);
export const getPurchaseSupplierById = (id) =>
  api.get(`purchase/suppliers/${id}`);
export const updatePurchaseSupplier = (id, data) =>
  api.put(`purchase/suppliers/${id}`, data);
export const deletePurchaseSupplier = (id) =>
  api.delete(`purchase/suppliers/${id}`);
export const getPurchaseOrdersLegacy = () => api.get("purchase/orders");
export const createPurchaseOrderLegacy = (data) =>
  api.post("purchase/orders", data);
export const getPurchaseOrderByIdLegacy = (id) =>
  api.get(`purchase/orders/${id}`);
export const getPurchaseReturns = () => api.get(API_ROUTES.PURCHASES_RETURNS);
