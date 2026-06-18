import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Inventory / Medicine CRUD ─── */
export const getMedicines = ({ signal, ...params } = {}) =>
  api.get(API_ROUTES.INVENTORY_MEDICINES, { params, signal });
export const getMedicineById = (id) =>
  api.get(`${API_ROUTES.INVENTORY_MEDICINES}/${id}`);
export const createMedicine = (data) =>
  api.post(API_ROUTES.INVENTORY_MEDICINES, data);
export const updateMedicine = (id, data) =>
  api.put(`${API_ROUTES.INVENTORY_MEDICINES}/${id}`, data);
export const deleteMedicine = (id) =>
  api.delete(`${API_ROUTES.INVENTORY_MEDICINES}/${id}`);
export const searchMedicines = (params) =>
  api.get(`${API_ROUTES.INVENTORY_MEDICINES}/search`, { params });
export const searchByBarcode = (barcode) =>
  api.get(`${API_ROUTES.INVENTORY_MEDICINES}/barcode/${barcode}`);
export const getLowStockMedicines = () =>
  api.get(API_ROUTES.INVENTORY_LOW_STOCK);
export const getNearExpiryMedicines = () =>
  api.get(API_ROUTES.INVENTORY_EXPIRY_NEAR);
export const getExpirySummary = () =>
  api.get(API_ROUTES.INVENTORY_EXPIRY_SUMMARY);
export const getInventorySummary = (params) =>
  api.get(API_ROUTES.INVENTORY_SUMMARY, { params });

/* ─── Categories ─── */
export const getCategories = () => api.get(API_ROUTES.INVENTORY_CATEGORIES);
export const createCategory = (data) =>
  api.post(API_ROUTES.INVENTORY_CATEGORIES, data);
export const updateCategory = (id, data) =>
  api.put(`${API_ROUTES.INVENTORY_CATEGORIES}/${id}`, data);
export const deleteCategory = (id) =>
  api.delete(`${API_ROUTES.INVENTORY_CATEGORIES}/${id}`);

/* ─── Manufacturers ─── */
export const getManufacturers = () =>
  api.get(API_ROUTES.INVENTORY_MANUFACTURERS);
export const createManufacturer = (data) =>
  api.post(API_ROUTES.INVENTORY_MANUFACTURERS, data);
export const updateManufacturer = (id, data) =>
  api.put(`${API_ROUTES.INVENTORY_MANUFACTURERS}/${id}`, data);
export const deleteManufacturer = (id) =>
  api.delete(`${API_ROUTES.INVENTORY_MANUFACTURERS}/${id}`);

/* ─── Batches ─── */
export const addBatch = (data) => api.post(API_ROUTES.INVENTORY_BATCHES, data);
export const updateBatch = (batchId, data) =>
  api.put(`${API_ROUTES.INVENTORY_BATCHES}/${batchId}`, data);
export const deleteBatch = (batchId) =>
  api.delete(`${API_ROUTES.INVENTORY_BATCHES}/${batchId}`);

/* ─── Barcode ─── */
export const generateBarcode = (text, type = "code128") =>
  api.get(API_ROUTES.INVENTORY_BARCODE_GENERATE, {
    params: { text, type },
    responseType: "blob",
  });

/* ─── Bulk Import ─── */
export const bulkImportMedicines = (data) =>
  api.post(API_ROUTES.IMPORT_BULK, data);

/* 📊 Inventory Analytics */
export const getInventoryValueSummary = () =>
  api.get(API_ROUTES.INVENTORY_ANALYTICS_SUMMARY);

export const getInventoryCategoryBreakdown = () =>
  api.get(API_ROUTES.INVENTORY_ANALYTICS_CATEGORIES);

export const getHighValueStock = () =>
  api.get(API_ROUTES.INVENTORY_ANALYTICS_HIGH_VALUE);

export const getExpiryRisk = () =>
  api.get(API_ROUTES.INVENTORY_ANALYTICS_EXPIRY_RISK);

/* ─── Unified Expiry Metrics (Single Source of Truth) ─── */
export const getExpiryMetrics = (params) =>
  api.get(API_ROUTES.INVENTORY_EXPIRY_METRICS, { params });
export const getExpiryAudit = () =>
  api.get(API_ROUTES.INVENTORY_EXPIRY_AUDIT);

/* ─── Unified Inventory Reconciliation (Single Source of Truth) ─── */
export const getInventoryReconciliation = (params) =>
  api.get(API_ROUTES.INVENTORY_RECONCILIATION, { params });

/* ─── Unified Inventory Reconciliation (Single Source of Truth) ─── */
export const getInventoryReconciliation = (params) =>
  api.get(API_ROUTES.INVENTORY_RECONCILIATION, { params });
