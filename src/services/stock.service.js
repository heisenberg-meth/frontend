import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Stock Operations ─── */

/**
 * Get active stock alerts (low stock, expiring soon, out of stock).
 * @returns {Promise<Object>} { success: true, data: { lowStockCount, expiringSoonCount, lowStock, expiringSoon, outOfStock } }
 */
export const getStockAlerts = () => api.get(`${API_ROUTES.STOCK}/alerts`);

/**
 * Record stock inbound (new batch / stock replenishment).
 * @param {Object} payload
 * @param {string} payload.medicineId - Medicine ID (required)
 * @param {string} payload.batchNumber - Batch number (required)
 * @param {number} payload.quantity - Quantity received (required, >= 1)
 * @param {string} payload.expiryDate - Expiry date ISO string or YYYY-MM-DD (required)
 * @param {string} [payload.branchId] - Target branch ID
 * @param {string} [payload.manufacturingDate] - Manufacturing date
 * @param {number} [payload.purchasePrice] - Cost price per unit
 * @param {number} [payload.sellingPrice] - Selling price per unit
 * @param {number} [payload.mrp] - Maximum retail price
 * @param {string} [payload.supplierId] - Supplier ID
 * @param {string} [payload.referenceType] - Reference type (e.g. PURCHASE)
 * @param {string} [payload.referenceId] - Reference document ID
 * @param {string} [payload.notes] - Notes
 * @returns {Promise<Object>} Created InventoryBatch object
 */
const stockIn = (payload) => api.post(`${API_ROUTES.STOCK}/in`, payload);

/**
 * Record stock outbound (sale, transfer, adjustment).
 * Deducts stock using FEFO (First Expiry First Out) strategy.
 * @param {Object} payload
 * @param {string} payload.medicineId - Medicine ID (required)
 * @param {number} payload.quantity - Quantity to deduct (required, >= 1)
 * @param {('SALE'|'ADJUSTMENT'|'RETURN'|'DAMAGE'|'EXPIRED'|'TRANSFER_OUT'|'SUPPLIER_RETURN'|'DISPOSAL')} [payload.type='SALE'] - Movement type
 * @param {string} [payload.branchId] - Branch ID filter
 * @param {string} [payload.batchId] - Specific batch ID (optional)
 * @returns {Promise<Object>} { totalDeducted: number, batches: Array<{ batchId: string, quantity: number }> }
 */
const stockOut = (payload) => api.post(`${API_ROUTES.STOCK}/out`, payload);

/**
 * Record stock damage or disposal write-off.
 * @param {Object} payload
 * @param {string} payload.batchId - Batch ID (required)
 * @param {number} payload.quantity - Quantity damaged (required, >= 1)
 * @param {string} [payload.reason] - Reason for damage
 * @param {string} [payload.branchId] - Branch ID
 * @param {string} [payload.medicineId] - Medicine ID
 * @param {string} [payload.notes] - Additional notes
 * @returns {Promise<Object>} Created StockMovement ledger record
 */
const recordDamage = (payload) =>
  api.post(`${API_ROUTES.STOCK}/damage`, payload);

/**
 * Get stock movement transaction history.
 * @param {Object} [params]
 * @param {string} [params.medicineId] - Filter by medicine ID
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Records per page
 * @returns {Promise<Object>} { transactions: Array, total: number, page: number, limit: number }
 */
const getStockHistory = (params) =>
  api.get(`${API_ROUTES.STOCK}/history`, { params });

/**
 * Resolve an active stock alert.
 * @param {string} alertId - Stock alert ID
 * @returns {Promise<Object>} { message: 'Alert resolved' }
 */
const resolveStockAlert = (alertId) =>
  api.put(`${API_ROUTES.STOCK}/alerts/${alertId}/resolve`);

/**
 * Get current stock and batch breakdown for a medicine.
 * @param {string} medicineId - Medicine ID
 * @returns {Promise<Object>} { totalQuantity: number, batches: Array }
 */
const getCurrentStock = (medicineId) =>
  api.get(`${API_ROUTES.STOCK}/current/${medicineId}`);

export default {
  getStockAlerts,
  stockIn,
  stockOut,
  recordDamage,
  getStockHistory,
  resolveStockAlert,
  getCurrentStock,
};
