import api from "../api";
export const updateNotificationSettings = (data) =>
  api.put("settings/notifications", data);
