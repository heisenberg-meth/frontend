import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Prescription CRUD ─── */
export const getPrescriptions = (params) =>
  api.get(API_ROUTES.PRESCRIPTIONS, { params });
export const createPrescription = (data) =>
  api.post(API_ROUTES.PRESCRIPTIONS, data);

/* ─── Prescription Actions ─── */
export const verifyPrescription = (id) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/${id}/verify`);
export const rejectPrescription = (id, data) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/${id}/reject`, data);
export const convertPrescriptionToInvoice = (id) =>
  api.post(`${API_ROUTES.PRESCRIPTIONS}/${id}/convert-to-invoice`);
