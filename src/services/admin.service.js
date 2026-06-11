import axios from "axios";
import { getBaseUrl } from "../api";
import { API_ROUTES } from "../constants/api.routes";

const TOKEN_KEY = "viyan_admin_token";
const REFRESH_KEY = "viyan_admin_refresh";
const ADMIN_KEY = "viyan_admin_user";

const adminHttp = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

adminHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminHttp.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(`${getBaseUrl()}/admin/refresh`, { refreshToken });
        if (data.success && data.data.accessToken) {
          localStorage.setItem(TOKEN_KEY, data.data.accessToken);
          localStorage.setItem(REFRESH_KEY, data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return adminHttp(original);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(ADMIN_KEY);
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  },
);

export const adminApi = {
  async login(email, password) {
    const { data } = await adminHttp.post(API_ROUTES.ADMIN_LOGIN, { email, password });
    if (data.success && data.data.accessToken) {
      localStorage.setItem(TOKEN_KEY, data.data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.data.refreshToken);
      localStorage.setItem(ADMIN_KEY, JSON.stringify(data.data.admin));
    }
    return data;
  },

  async refresh() {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) throw new Error("No refresh token");
    const { data } = await adminHttp.post(API_ROUTES.ADMIN_REFRESH, { refreshToken });
    if (data.success && data.data.accessToken) {
      localStorage.setItem(TOKEN_KEY, data.data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.data.refreshToken);
      localStorage.setItem(ADMIN_KEY, JSON.stringify(data.data.admin));
    }
    return data;
  },

  async logout() {
    try {
      await adminHttp.post(API_ROUTES.ADMIN_LOGOUT);
    } catch {} finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(ADMIN_KEY);
    }
  },

  getStoredAdmin() {
    try {
      const raw = localStorage.getItem(ADMIN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  async getDashboardStats() {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_DASHBOARD_STATS);
    return data;
  },

  async getAdmins(params = {}) {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_ADMINS, { params });
    return data;
  },

  async createAdmin(payload) {
    const { data } = await adminHttp.post(API_ROUTES.ADMIN_ADMINS, payload);
    return data;
  },

  async updateAdmin(id, payload) {
    const { data } = await adminHttp.put(`${API_ROUTES.ADMIN_ADMINS}/${id}`, payload);
    return data;
  },

  async deleteAdmin(id) {
    const { data } = await adminHttp.delete(`${API_ROUTES.ADMIN_ADMINS}/${id}`);
    return data;
  },

  async getAuditLogs(params = {}) {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_AUDIT_LOGS, { params });
    return data;
  },

  async getDevices(params = {}) {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_DEVICES, { params });
    return data;
  },

  async blockDevice(id, reason) {
    const { data } = await adminHttp.put(`${API_ROUTES.ADMIN_DEVICES_BLOCK}/${id}/block`, { reason });
    return data;
  },

  async unblockDevice(id) {
    const { data } = await adminHttp.put(`${API_ROUTES.ADMIN_DEVICES_UNBLOCK}/${id}/unblock`);
    return data;
  },

  async getFeatureFlags() {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_FEATURE_FLAGS);
    return data;
  },

  async createFeatureFlag(payload) {
    const { data } = await adminHttp.post(API_ROUTES.ADMIN_FEATURE_FLAGS, payload);
    return data;
  },

  async updateFeatureFlag(id, payload) {
    const { data } = await adminHttp.put(`${API_ROUTES.ADMIN_FEATURE_FLAGS}/${id}`, payload);
    return data;
  },

  async toggleFeatureFlag(id, enabled) {
    const { data } = await adminHttp.put(`${API_ROUTES.ADMIN_FEATURE_FLAGS}/${id}/toggle`, { enabled });
    return data;
  },

  async getUsers(params = {}) {
    const { data } = await adminHttp.get("/admin/users", { params });
    return data;
  },

  async updateUserStatus(id, status) {
    const { data } = await adminHttp.put(`/admin/users/${id}/status`, { status });
    return data;
  },

  async getExpiringSubscriptions(days = 7) {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_SUBSCRIPTIONS_EXPIRING, { params: { days } });
    return data;
  },
};
