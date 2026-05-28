import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";

export async function fetchSales(params) {
  const res = await api.get(API_ROUTES.SALES, { params });
  return res.data?.data || res.data || [];
}

export async function fetchReturns(params) {
  const res = await api.get(API_ROUTES.BILLING_RETURNS, { params });
  return res.data?.data || res.data || [];
}

export async function fetchHourlyData() {
  const res = await api.get(API_ROUTES.SALES_HOURLY);
  return res.data?.data || res.data || [];
}

export async function createSale(saleData) {
  const res = await api.post(API_ROUTES.SALES, saleData);
  return res.data?.data || res.data;
}

export async function deleteSale(id) {
  const res = await api.delete(`${API_ROUTES.SALES}/${id}`);
  return res.data?.data || res.data;
}

export async function processSalesRefund(id, refundData) {
  const res = await api.post(`${API_ROUTES.SALES}/${id}/refund`, refundData);
  return res.data?.data || res.data;
}

export async function processReturn(returnData) {
  const res = await api.post(API_ROUTES.BILLING_RETURNS, returnData);
  return res.data?.data || res.data;
}
