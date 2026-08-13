import api from "../api";

/* ─── Profile / User CRUD ─── */
export const changePassword = (data) => api.put("auth/change-password", data);

/* ─── Sessions ─── */
export const getActiveSessions = () => api.get("auth/sessions");
export const terminateSession = (sessionId) =>
  api.delete(`auth/sessions/${sessionId}`);

/* ─── Team / HR CRUD ─── */
export const getTeamMembers = (params) => api.get("team", { params });
export const inviteTeamMember = (data) => api.post("team", data);
export const removeTeamMember = (id) => api.delete(`team/${id}`);

/* ─── Team Avatar ─── */
export const uploadTeamAvatar = (id, file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return api.post(`team/${id}/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
