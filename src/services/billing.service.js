import api from "../api";

export const getInvoices = (params) =>
  api.get("billing/invoices", { params });
export const getInvoiceById = (id) => api.get(`billing/invoices/${id}`);
export const createInvoice = (data) => api.post("billing/invoices", data);
export const processRefund = (id, data) =>
  api.post(`billing/invoices/${id}/refund`, data);
export const voidInvoice = (id) => api.post(`billing/invoices/${id}/cancel`);
export const scanItem = (barcode) => api.get(`billing/scan/${barcode}`);

/* ─── Draft ─── */
export const saveDraft = (data) =>
  api.post("billing/invoices", { ...data, isDraft: true });
export const updateDraft = (id, data) =>
  api.post(`billing/invoices/${id}`, { ...data, isDraft: true });

/* ─── Billing Actions ─── */
export const generateInvoicePDF = (id) => api.post(`billing/invoices/${id}/pdf`);
export const sendInvoiceEmail = (id, data) =>
  api.post(`billing/invoices/${id}/email`, data);
export const sendInvoiceWhatsApp = (id, data) =>
  api.post(`billing/invoices/${id}/whatsapp`, data);

/* ─── Sales ─── */
export const getSalesHistory = (params) => api.get("sales", { params });
export const getSaleById = (id) => api.get(`sales/${id}`);
export const getSalesTrends = (params) =>
  api.get("sales/trends", { params });
export const getSalesReturns = (params) =>
  api.get("billing/returns", { params });
export const processSalesReturn = (data) =>
  api.post("billing/returns", data);
export const getSalesCustomers = () => api.get("patients");
export const createSalesCustomer = (data) =>
  api.post("patients", data);
export const getSalesCustomerById = (id) =>
  api.get(`patients/${id}`);
export const updateSalesCustomer = (id, data) =>
  api.put(`patients/${id}`, data);
export const deleteSalesCustomer = (id) =>
  api.delete(`patients/${id}`);
