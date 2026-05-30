import api from "../api";
export const getSettings = () => api.get("settings");
export const updateSettings = (data) => api.put("settings", data);
export const getInventorySettings = () => api.get("settings/inventory");
export const updateInventorySettings = (data) =>
  api.put("settings/inventory", data);
export const getBillingSettings = () => api.get("settings/billing");
export const updateBillingSettings = (data) =>
  api.put("settings/billing", data);
export const getTaxSettings = () => api.get("settings/tax");
export const updateTaxSettings = (data) => api.put("settings/tax", data);
export const getNotificationSettings = () =>
  api.get("settings/notifications");
export const updateNotificationSettings = (data) =>
  api.put("settings/notifications", data);
export const getLoyaltySettings = () => api.get("settings/loyalty");
export const updateLoyaltySettings = (data) =>
  api.put("settings/loyalty", data);
export const getSecuritySettings = () => api.get("settings/security");
export const updateSecuritySettings = (data) =>
  api.put("settings/security", data);
export const getAlertThresholds = () => api.get("settings/alerts");
export const updateAlertThresholds = (data) =>
  api.put("settings/alerts", data);
export const getStoreProfile = () => api.get("settings/store-profile");
export const updateStoreProfile = (data) =>
  api.put("settings/store-profile", data);
export const getIntegrations = () => api.get("settings/integrations");
export const updateIntegrations = (data) =>
  api.put("settings/integrations", data);
export const getGstSettings = () => api.get("settings/gst");
export const updateGstSettings = (data) => api.put("settings/gst", data);
export const getGstHistory = (category) =>
  api.get(`settings/gst/history/${category}`);
export const getInvoiceTemplate = () =>
  api.get("settings/invoice-template");
export const updateInvoiceTemplate = (data) =>
  api.put("settings/invoice-template", data);
export const previewInvoiceTemplate = (data) =>
  api.post("settings/invoice-template/preview", data);
export const getInvoiceTemplateVersions = () =>
  api.get("settings/invoice-template/versions");
export const restoreInvoiceTemplateVersion = (versionId) =>
  api.post(`settings/invoice-template/restore/${versionId}`);
export const testRenderInvoiceTemplate = (data) =>
  api.post("settings/invoice-template/test-render", data);
export const getSettingsAuditLogs = () => api.get("settings/audit");
