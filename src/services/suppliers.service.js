import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Supplier CRUD ─── */
export const getSuppliers = (params) =>
  api.get(API_ROUTES.SUPPLIERS, { params });
export const createSupplier = (data) => api.post(API_ROUTES.SUPPLIERS, data);
export const updateSupplier = (id, data) =>
  api.put(`${API_ROUTES.SUPPLIERS}/${id}`, data);
export const deleteSupplier = (id) =>
  api.delete(`${API_ROUTES.SUPPLIERS}/${id}`);
