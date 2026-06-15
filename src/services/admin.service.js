import axios from "axios";
import { getBaseUrl, getCsrfToken, cyrb128 } from "../api";
import { API_ROUTES } from "../constants/api.routes";

const REFRESH_KEY = "viyan_admin_refresh";
const ADMIN_KEY = "viyan_admin_user";

const adminHttp = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

adminHttp.interceptors.request.use(async (config) => {
  const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  const excludeCsrfRoutes = ["csrf-token"];

  if (
    stateChangingMethods.includes(config.method?.toUpperCase()) &&
    !excludeCsrfRoutes.some((route) => config.url?.includes(route))
  ) {
    const activeCsrfToken = await getCsrfToken();
    if (activeCsrfToken) {
      config.headers["x-csrf-token"] = activeCsrfToken;
    }
  }

  const idempotentMethods = ["POST", "PUT", "PATCH", "DELETE"];
  const excludeIdempotencyRoutes = ["admin/login", "admin/refresh"];

  if (
    idempotentMethods.includes(config.method?.toUpperCase()) &&
    !excludeIdempotencyRoutes.some((route) => config.url?.includes(route))
  ) {
    if (!config.headers["X-Idempotency-Key"]) {
      const key = `${config.method}:${config.url}:${JSON.stringify(config.data || {})}`;
      config.headers["X-Idempotency-Key"] = cyrb128(key);
    }
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
        const { data } = await axios.post(`${getBaseUrl()}/admin/refresh`, {
          refreshToken,
        });
        if (data.success && data.data.accessToken) {
          return adminHttp(original);
        }
      } catch {
        localStorage.removeItem(ADMIN_KEY);
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  },
);

export const adminApi = {
  async login(email, password) {
    const { data } = await adminHttp.post(API_ROUTES.ADMIN_LOGIN, {
      email,
      password,
    });
    if (data.success && data.data.accessToken) {
      localStorage.setItem(ADMIN_KEY, JSON.stringify(data.data.admin));
    }
    return data;
  },

  async refresh() {
    const { data } = await adminHttp.post(API_ROUTES.ADMIN_REFRESH);
    if (data.success && data.data.accessToken) {
      localStorage.setItem(ADMIN_KEY, JSON.stringify(data.data.admin));
    }
    return data;
  },

  async logout() {
    try {
      await adminHttp.post(API_ROUTES.ADMIN_LOGOUT);
    } catch (err) {
      console.log(err);
    } finally {
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
    return null;
  },

  async getDashboardStats() {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_DASHBOARD_STATS);
    return data;
  },

  async getDashboardTrends() {
    const { data } = await adminHttp.get("/admin/dashboard/trends");
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
    const { data } = await adminHttp.put(
      `${API_ROUTES.ADMIN_ADMINS}/${id}`,
      payload,
    );
    return data;
  },

  async deleteAdmin(id) {
    const { data } = await adminHttp.delete(`${API_ROUTES.ADMIN_ADMINS}/${id}`);
    return data;
  },

  async getAuditLogs(params = {}) {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_AUDIT_LOGS, {
      params,
    });
    return data;
  },

  async getOtpLogs(params = {}) {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_OTP_LOGS, {
      params,
    });
    return data;
  },

  async getLatestOtp(email) {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_OTP_LATEST, {
      params: { email },
    });
    return data;
  },

  async getDevices(params = {}) {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_DEVICES, { params });
    return data;
  },

  async blockDevice(id, reason) {
    const { data } = await adminHttp.put(
      `${API_ROUTES.ADMIN_DEVICES_BLOCK}/${id}/block`,
      { reason },
    );
    return data;
  },

  async unlinkDevice(id) {
    const { data } = await adminHttp.put(`/admin/devices/${id}/unlink`);
    return data;
  },

  async unblockDevice(id) {
    const { data } = await adminHttp.put(
      `${API_ROUTES.ADMIN_DEVICES_UNBLOCK}/${id}/unblock`,
    );
    return data;
  },

  async getFeatureFlags() {
    const { data } = await adminHttp.get(API_ROUTES.ADMIN_FEATURE_FLAGS);
    return data;
  },

  async createFeatureFlag(payload) {
    const { data } = await adminHttp.post(
      API_ROUTES.ADMIN_FEATURE_FLAGS,
      payload,
    );
    return data;
  },

  async updateFeatureFlag(id, payload) {
    const { data } = await adminHttp.put(
      `${API_ROUTES.ADMIN_FEATURE_FLAGS}/${id}`,
      payload,
    );
    return data;
  },

  async toggleFeatureFlag(id, enabled) {
    const { data } = await adminHttp.put(
      `${API_ROUTES.ADMIN_FEATURE_FLAGS}/${id}/toggle`,
      { enabled },
    );
    return data;
  },

  async getUsers(params = {}) {
    const { data } = await adminHttp.get("/admin/users", { params });
    return data;
  },

  async updateTenantStatus(id, status) {
    const { data } = await adminHttp.put(`/admin/users/${id}/status`, {
      status,
    });
    return data;
  },

  async getTenantDetail(id) {
    const { data } = await adminHttp.get(`/admin/users/${id}`);
    return data;
  },

  async verifyTenant(id) {
    const { data } = await adminHttp.put(`/admin/users/${id}/verify`);
    return data;
  },

  async blacklistTenant(id, reason) {
    const { data } = await adminHttp.put(`/admin/users/${id}/blacklist`, {
      reason,
    });
    return data;
  },

  async unblacklistTenant(id) {
    const { data } = await adminHttp.put(`/admin/users/${id}/unblacklist`);
    return data;
  },

  async listShops(params = {}) {
    const { data } = await adminHttp.get("/admin/shops", { params });
    return data;
  },

  async getShopDetail(id) {
    const { data } = await adminHttp.get(`/admin/shops/${id}`);
    return data;
  },

  async updateShop(id, payload) {
    const { data } = await adminHttp.patch(`/admin/shops/${id}`, payload);
    return data;
  },

  async approveShop(id) {
    const { data } = await adminHttp.post(`/admin/shops/${id}/approve`);
    return data;
  },

  async suspendShop(id) {
    const { data } = await adminHttp.post(`/admin/shops/${id}/suspend`);
    return data;
  },

  async blockShop(id, reason) {
    const { data } = await adminHttp.post(`/admin/shops/${id}/block`, {
      reason,
    });
    return data;
  },

  async deleteShop(id) {
    const { data } = await adminHttp.delete(`/admin/shops/${id}`);
    return data;
  },

  async deleteUser(tenantId, userId) {
    const { data } = await adminHttp.delete(
      `/admin/users/${tenantId}/users/${userId}`,
    );
    return data;
  },

  async resetUserPassword(tenantId, userId) {
    const { data } = await adminHttp.post(
      `/admin/users/${tenantId}/users/${userId}/reset-password`,
    );
    return data;
  },

  async resetUserDevice(tenantId, userId) {
    const { data } = await adminHttp.post(
      `/admin/users/${tenantId}/users/${userId}/reset-device`,
    );
    return data;
  },

  async getSystemHealth() {
    const { data } = await adminHttp.get("/admin/system-health");
    return data;
  },

  async listSupportTickets(params = {}) {
    const { data } = await adminHttp.get("/admin/support-tickets", { params });
    return data;
  },

  async getSupportTicket(id) {
    const { data } = await adminHttp.get(`/admin/support-tickets/${id}`);
    return data;
  },

  async replySupportTicket(id, payload) {
    const { data } = await adminHttp.post(
      `/admin/support-tickets/${id}/reply`,
      payload,
    );
    return data;
  },

  async updateSupportTicketStatus(id, payload) {
    const { data } = await adminHttp.put(
      `/admin/support-tickets/${id}/status`,
      payload,
    );
    return data;
  },

  async getExpiryOverview() {
    const { data } = await adminHttp.get("/admin/expiry/overview");
    return data;
  },

  async sendExpiryReminders(payload) {
    const { data } = await adminHttp.post(
      "/admin/expiry/send-reminders",
      payload,
    );
    return data;
  },

  async sendBroadcast(payload) {
    const { data } = await adminHttp.post("/admin/broadcast", payload);
    return data;
  },

  async getRevenueOverview() {
    const { data } = await adminHttp.get("/admin/revenue/overview");
    return data;
  },

  async getMonthlyRevenue(months = 12) {
    const { data } = await adminHttp.get("/admin/revenue/monthly", {
      params: { months },
    });
    return data;
  },

  async listPayments(params = {}) {
    const { data } = await adminHttp.get("/admin/payments", { params });
    return data;
  },

  async generateInvoice(payload) {
    const { data } = await adminHttp.post("/admin/payments/invoice", payload);
    return data;
  },

  async refundPayment(id, reason) {
    const { data } = await adminHttp.put(`/admin/payments/${id}/refund`, {
      reason,
    });
    return data;
  },

  async updatePaymentStatus(id, status) {
    const { data } = await adminHttp.put(`/admin/payments/${id}/status`, {
      status,
    });
    return data;
  },

  async getSecurityOverview() {
    const { data } = await adminHttp.get("/admin/security/overview");
    return data;
  },

  async getLoginAttempts(params = {}) {
    const { data } = await adminHttp.get("/admin/security/login-attempts", {
      params,
    });
    return data;
  },

  async getSecurityAlerts() {
    const { data } = await adminHttp.get("/admin/security/alerts");
    return data;
  },

  async listSubscriptions(params = {}) {
    const { data } = await adminHttp.get("/admin/subscriptions", { params });
    return data;
  },

  async updateSubscription(id, payload) {
    const { data } = await adminHttp.patch(
      `/admin/subscriptions/${id}`,
      payload,
    );
    return data;
  },

  async renewSubscription(id, payload) {
    const { data } = await adminHttp.post(
      `/admin/subscriptions/${id}/renew`,
      payload,
    );
    return data;
  },

  async extendSubscription(id, payload) {
    const { data } = await adminHttp.post(
      `/admin/subscriptions/${id}/extend`,
      payload,
    );
    return data;
  },

  async cancelSubscription(id) {
    const { data } = await adminHttp.post(`/admin/subscriptions/${id}/cancel`);
    return data;
  },

  async getExpiringSubscriptions(days = 7) {
    const { data } = await adminHttp.get(
      API_ROUTES.ADMIN_SUBSCRIPTIONS_EXPIRING,
      { params: { days } },
    );
    return data;
  },

  // ---- Individual User Management ----
  async updateUserStatus(tenantId, userId, status) {
    const { data } = await adminHttp.put(
      `/admin/users/${tenantId}/users/${userId}/status`,
      { status },
    );
    return data;
  },

  async blockUser(tenantId, userId, reason) {
    const { data } = await adminHttp.put(
      `/admin/users/${tenantId}/users/${userId}/block`,
      { reason },
    );
    return data;
  },

  async unblockUser(tenantId, userId) {
    const { data } = await adminHttp.put(
      `/admin/users/${tenantId}/users/${userId}/unblock`,
    );
    return data;
  },

  async listAllUsers(params = {}) {
    const { data } = await adminHttp.get("/admin/users/list-all", { params });
    return data;
  },
};
