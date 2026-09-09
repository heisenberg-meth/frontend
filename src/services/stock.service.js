import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Stock Operations ─── */

/**
 * Get active stock alerts (low stock, expiring soon, out of stock).
 * @returns {Promise<Object>} { success: true, data: { lowStockCount, expiringSoonCount, lowStock, expiringSoon, outOfStock } }
 */
export const getStockAlerts = () => api.get(`${API_ROUTES.STOCK}/alerts`);
