import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Stock Operations ─── */
export const getStockAlerts = () => api.get(`${API_ROUTES.STOCK}/alerts`);
