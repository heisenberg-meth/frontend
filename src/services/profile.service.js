import api from "../api";

/* ─── Profile / User CRUD ─── */
export const getProfile = () => api.get("auth/me");
export const updateProfile = (id, data) => api.put(`team/${id}`, data);
export const changePassword = (data) =>
  api.put("auth/change-password", data);
export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return api.post("uploads/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/* ─── Sessions ─── */
export const getActiveSessions = () => api.get("auth/sessions");
export const terminateSession = (sessionId) =>
  api.delete(`auth/sessions/${sessionId}`);

/* ─── 2FA ─── */
export const enable2FA = () => api.post("users/2fa/enable");
export const disable2FA = () => api.post("users/2fa/disable");
export const verify2FA = (token) =>
  api.post("users/2fa/verify", { token });

/* ─── Team / HR CRUD ─── */
export const getTeamMembers = (params) => api.get("team", { params });
export const getTeamMemberById = (id) => api.get(`team/${id}`);
export const inviteTeamMember = (data) => api.post("team", data);
export const updateTeamMember = (id, data) => api.put(`team/${id}`, data);
export const removeTeamMember = (id) => api.delete(`team/${id}`);

/* ─── Team Shifts ─── */
export const getShifts = () => api.get("team/shifts");
export const createShift = (data) => api.post("team/shifts", data);
export const startShift = (data) => api.post("team/shifts/start", data);
export const endShift = (shiftId) => api.put(`team/shifts/${shiftId}/end`);
export const getActiveShifts = () => api.get("team/shifts/active");

/* ─── Team Performance ─── */
export const getTeamPerformance = () => api.get("team/performance");
export const getTeamPerformanceOverview = () =>
  api.get("team/performance/overview");
export const getMemberPerformance = (id) =>
  api.get(`team/${id}/performance`);
export const getBillingPerformance = () =>
  api.get("team/billing-performance");

/* ─── Team Permissions ─── */
export const getMemberPermissions = (id) =>
  api.get(`team/${id}/permissions`);
export const updateMemberPermissions = (id, data) =>
  api.patch(`team/${id}/permissions`, data);
export const updateMemberRole = (id, data) =>
  api.put(`team/${id}/permissions`, data);

/* ─── Team Avatar ─── */
export const uploadTeamAvatar = (id, file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return api.post(`team/${id}/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
