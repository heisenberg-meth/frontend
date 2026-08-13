import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Inventory / Medicine CRUD ─── */
export const getMedicines = ({ signal, ...params } = {}) =>
  api.get(API_ROUTES.INVENTORY_MEDICINES, { params, signal });
export const createMedicine = (data) =>
  api.post(API_ROUTES.INVENTORY_MEDICINES, data);
export const updateMedicine = (id, data) =>
  api.put(`${API_ROUTES.INVENTORY_MEDICINES}/${id}`, data);
export const deleteMedicine = (id) =>
  api.delete(`${API_ROUTES.INVENTORY_MEDICINES}/${id}`);
export const searchByBarcode = (barcode) =>
  api.get(`${API_ROUTES.INVENTORY_MEDICINES}/barcode/${barcode}`);
export const getLowStockMedicines = () =>
  api.get(API_ROUTES.INVENTORY_LOW_STOCK);
export const getInventorySummary = (params) =>
  api.get(API_ROUTES.INVENTORY_SUMMARY, { params });

/* ─── Categories ─── */
export const getCategories = () => api.get(API_ROUTES.INVENTORY_CATEGORIES);

/* ─── Batches ─── */
export const addBatch = (data) => api.post(API_ROUTES.INVENTORY_BATCHES, data);
export const updateBatch = (batchId, data) =>
  api.put(`${API_ROUTES.INVENTORY_BATCHES}/${batchId}`, data);
export const assignBatchSupplier = (batchId, supplierId) =>
  api.patch(`${API_ROUTES.INVENTORY_BATCHES}/${batchId}/supplier`, {
    supplierId,
  });
export const bulkAssignBatchSupplier = (batchIds, supplierId) =>
  api.post(`${API_ROUTES.INVENTORY_BATCHES}/bulk-assign-supplier`, {
    batchIds,
    supplierId,
  });
export const backfillBatchSupplier = () =>
  api.post(`${API_ROUTES.INVENTORY_BATCHES}/backfill-supplier`);
export const exportBatchesWithoutSupplier = () =>
  api.get(`${API_ROUTES.INVENTORY_BATCHES}/export-no-supplier`);
export const importSupplierAssignments = (assignments) =>
  api.post(`${API_ROUTES.INVENTORY_BATCHES}/import-supplier-assignments`, {
    assignments,
  });

/* ─── Barcode ─── */
export const generateBarcode = (text, type = "code128") =>
  api.get(API_ROUTES.INVENTORY_BARCODE_GENERATE, {
    params: { text, type },
    responseType: "blob",
  });

/* 📊 Inventory Analytics */
export const getInventoryValueSummary = () =>
  api.get(API_ROUTES.INVENTORY_ANALYTICS_SUMMARY);

export const getInventoryCategoryBreakdown = () =>
  api.get(API_ROUTES.INVENTORY_ANALYTICS_CATEGORIES);

export const getHighValueStock = () =>
  api.get(API_ROUTES.INVENTORY_ANALYTICS_HIGH_VALUE);

export const getExpiryRisk = () =>
  api.get(API_ROUTES.INVENTORY_ANALYTICS_EXPIRY_RISK);

/* ─── Expired Stock Disposal ─── */
export const disposeInventory = (data) => api.post("/inventory/dispose", data);
