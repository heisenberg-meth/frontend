import api from "../api";

export const getNotifications = (params) =>
  api.get("notifications/history", { params });

export const markNotificationRead = (id) => api.put(`notifications/${id}/read`);

export const markAllNotificationsRead = () => api.put("notifications/read-all");

export const deleteNotification = (id) => api.delete(`notifications/${id}`);
