import api from "../api";

/* ─── Patient CRUD ─── */
export const getPatients = (params) => api.get("patients", { params });
export const getPatientById = (id) => api.get(`patients/${id}`);
export const createPatient = (data) => api.post("patients", data);
export const updatePatient = (id, data) => api.put(`patients/${id}`, data);
export const deletePatient = (id) => api.delete(`patients/${id}`);

/* ─── Patient Search ─── */
export const searchPatient = (phone) =>
  api.get("patients", { params: { phone } });
export const searchPatientsByName = (name) =>
  api.get("patients", { params: { name } });

/* ─── Patient Sub-resources ─── */
export const getVipPatients = () => api.get("patients/vip");
export const getInactivePatients = () => api.get("patients/inactive");
export const getChronicPatients = () => api.get("patients/chronic");
export const getPatientRecommendations = (id) =>
  api.get(`patients/${id}/recommendations`);
export const getPatientPurchaseHistory = (id) =>
  api.get(`patients/${id}/purchase-history`);
export const getPatientPrescriptions = (id) =>
  api.get(`patients/${id}/prescriptions`);
export const getPatientInvoices = (id) => api.get(`patients/${id}/invoices`);
export const getPatientRefills = (id) => api.get(`patients/${id}/refills`);

/* ─── Patient Prescriptions ─── */
export const createPatientPrescription = (data) =>
  api.post("prescriptions", data);
export const getCustomerPrescriptions = (patientId) =>
  api.get(`patients/${patientId}/prescriptions`);
export const getPrescriptionById = (id) => api.get(`prescriptions/${id}`);
