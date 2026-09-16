import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/**
 * Helper to retry transient request failures with exponential backoff.
 * Does not retry aborted requests or 4xx client errors.
 */
async function fetchWithRetry(fn, retries = 2, delayMs = 500, signal = null) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) {
      const abortError = new Error("Request aborted");
      abortError.name = "CanceledError";
      throw abortError;
    }
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isCanceled =
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED" ||
        signal?.aborted;
      const status = error?.response?.status;
      // Do not retry cancellations or 4xx client errors (400, 401, 403, 404, etc.)
      if (isCanceled || (status && status >= 400 && status < 500)) {
        throw error;
      }
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, attempt)),
        );
      }
    }
  }
  throw lastError;
}

/* ─── Inventory / Medicine CRUD ─── */
export const getMedicines = ({ signal, ...params } = {}, retries = 2) =>
  fetchWithRetry(
    () => api.get(API_ROUTES.INVENTORY_MEDICINES, { params, signal }),
    retries,
    500,
    signal,
  );
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
export const getInventorySummary = (params, retries = 2) =>
  fetchWithRetry(
    () => api.get(API_ROUTES.INVENTORY_SUMMARY, { params }),
    retries,
    500,
  );

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
