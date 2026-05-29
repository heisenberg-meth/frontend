import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Prescription CRUD ─── */
export const getPrescriptions = (params) =>
  api.get(API_ROUTES.PRESCRIPTIONS, { params });
export const getPrescriptionById = (id) => api.get(`${API_ROUTES.PRESCRIPTIONS}/${id}`);
export const createPrescription = (data) =>
  api.post(API_ROUTES.PRESCRIPTIONS, data);

/* ─── Prescription Actions ─── */
export const uploadPrescription = (id, formData) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/${id}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const verifyPrescription = (id) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/${id}/verify`);
export const rejectPrescription = (id, data) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/${id}/reject`, data);
export const convertPrescriptionToInvoice = (id) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/${id}/convert-to-invoice`);

/* ─── Dispensing ─── */
export const getDispensingHistory = (id) =>
  api.get(`${API_ROUTES.PRESCRIPTIONS}/${id}/dispensing-history`);

/* ─── Doctors ─── */
export const getDoctors = (params) =>
  api.get(`${API_ROUTES.PRESCRIPTIONS}/doctors`, { params });
export const createDoctor = (data) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/doctors`, data);
