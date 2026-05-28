import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Prescription CRUD ─── */
export const getPrescriptions = (params) =>
  api.get(API_ROUTES.PRESCRIPTIONS, { params });
export const getPrescriptionById = (id) => api.get(`${API_ROUTES.PRESCRIPTIONS}/${id}`);
export const createPrescription = (data) =>
  api.post(API_ROUTES.PRESCRIPTIONS, data);
export const updatePrescription = (id, data) =>
  api.put(`${API_ROUTES.PRESCRIPTIONS}/${id}`, data);
export const deletePrescription = (id) =>
  api.delete(`${API_ROUTES.PRESCRIPTIONS}/${id}`);

/* ─── Prescription Actions ─── */
export const uploadPrescription = (formData) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const verifyPrescription = (id) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/${id}/verify`);
export const rejectPrescription = (id, data) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/${id}/reject`, data);
export const convertPrescriptionToInvoice = (id) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/${id}/convert-to-invoice`);

/* ─── Prescription Insurance & Claims ─── */
export const getPrescriptionInsurance = (id) =>
  api.get(`${API_ROUTES.PRESCRIPTIONS}/${id}/insurance`);
export const applyPrescriptionDiscount = (id, data) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/${id}/discount`, data);
export const getDispensingHistory = (id) =>
  api.get(`${API_ROUTES.PRESCRIPTIONS}/${id}/dispensing`);
export const getPrescriptionClaims = (id) =>
  api.get(`${API_ROUTES.PRESCRIPTIONS}/${id}/claims`);

/* ─── Doctors ─── */
export const getDoctors = (params) =>
  api.get(`${API_ROUTES.PRESCRIPTIONS}/doctors`, { params });
export const createDoctor = (data) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/doctors`, data);
export const updateDoctor = (id, data) =>
  api.put(`${API_ROUTES.PRESCRIPTIONS}/doctors/${id}`, data);
export const deleteDoctor = (id) =>
  api.delete(`${API_ROUTES.PRESCRIPTIONS}/doctors/${id}`);
