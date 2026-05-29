import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

export const SubscriptionService = {
  async getStatus() {
    const res = await api.get(API_ROUTES.SUBSCRIPTIONS_STATUS);
    return res.data?.data || res.data;
  },

  async create(planId, billingCycle) {
    const res = await api.post("subscriptions", { planId, billingCycle });
    return res.data;
  },

  async cancel() {
    const res = await api.post("subscriptions/cancel");
    return res.data;
  },

  async activate() {
    const res = await api.post("subscriptions/activate");
    return res.data;
  },

  async refreshStatus() {
    const res = await api.get(API_ROUTES.SUBSCRIPTIONS_STATUS);
    const data = res.data?.data || res.data;
    return {
      status: data.status?.toLowerCase() || "active",
      expiresAt: data.expiresAt,
      planName: data.planName || "Unknown",
      plan: data.planName || "Unknown",
    };
  },
};
