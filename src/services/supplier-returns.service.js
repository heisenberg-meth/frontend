import api from "../api";
import { API_ROUTES } from "../constants/api.routes";

const BASE = API_ROUTES.SUPPLIER_RETURNS;

export const getDashboardMetrics = () => api.get(`${BASE}/dashboard/metrics`);

export const getExpiredGroupedBySupplier = () =>
  api.get(API_ROUTES.SUPPLIER_RETURNS_EXPIRED_GROUPED);

export const getExpiredInventorySummary = () =>
  api.get(API_ROUTES.SUPPLIER_RETURNS_EXPIRED_SUMMARY);

export const createSupplierReturn = (data) => api.post(BASE, data);

export const getSupplierReturns = (params) => api.get(BASE, { params });

export const getSupplierReturnById = (id) => api.get(`${BASE}/${id}`);

export const updateReturnStatus = (id, status) =>
  api.patch(`${BASE}/${id}/status`, { status });

export const generateCreditNote = (returnId, data) =>
  api.post(`${BASE}/${returnId}/credit-notes`, data);

export const getCreditNotes = (params) =>
  api.get(API_ROUTES.SUPPLIER_RETURNS_CREDIT_NOTES, { params });

export const generateCreditNotePdf = (id) =>
  api.post(`${BASE}/credit-notes/${id}/pdf`);

export const applyCreditNote = (id, data) =>
  api.post(API_ROUTES.PURCHASE_CREDIT_NOTE_APPLY.replace("{id}", id), data);

export const getSupplierCreditBalance = (id) =>
  api.get(API_ROUTES.PURCHASE_SUPPLIER_CREDIT_BALANCE.replace("{id}", id));

export const updateDispatchStatus = (id, dispatchStatus) =>
  api.patch(`${BASE}/${id}/dispatch-status`, { dispatchStatus });
