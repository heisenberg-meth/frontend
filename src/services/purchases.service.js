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
export const receiveGoods = (data) =>
  api.post(`${API_ROUTES.PURCHASES_ORDERS}/receive`, data);
export const processPurchaseReturn = (data) =>
  api.post("billing/returns", data);
