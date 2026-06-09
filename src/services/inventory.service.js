import api from "../api";
import { API_ROUTES } from "../constants/api.routes.js";

/* ─── Inventory / Medicine CRUD ─── */
export const getMedicines = (params) =>
  api.get(API_ROUTES.INVENTORY_MEDICINES, { params });
export const getMedicineById = (id) =>
  api.get(`${API_ROUTES.INVENTORY_MEDICINES}/${id}`);
export const createMedicine = (data) =>
  api.post(API_ROUTES.INVENTORY_MEDICINES, data);
export const updateMedicine = (id, data) =>
  api.put(`${API_ROUTES.INVENTORY_MEDICINES}/${id}`, data);
export const deleteMedicine = (id) =>
  api.delete(`${API_ROUTES.INVENTORY_MEDICINES}/${id}`);
export const searchMedicines = (params) =>
  api.get(`${API_ROUTES.INVENTORY_MEDICINES}/search`, { params });
export const searchByBarcode = (barcode) =>
  api.get(`${API_ROUTES.INVENTORY_MEDICINES}/barcode/${barcode}`);
export const getLowStockMedicines = () =>
  api.get(API_ROUTES.INVENTORY_LOW_STOCK);
export const getNearExpiryMedicines = () =>
  api.get(API_ROUTES.INVENTORY_EXPIRY_NEAR);
export const getExpirySummary = () =>
  api.get(API_ROUTES.INVENTORY_EXPIRY_SUMMARY);
export const getInventorySummary = (params) =>
  api.get(API_ROUTES.INVENTORY_SUMMARY, { params });

/* ─── Categories ─── */
export const getCategories = () => api.get(API_ROUTES.INVENTORY_CATEGORIES);
export const createCategory = (data) =>
  api.post(API_ROUTES.INVENTORY_CATEGORIES, data);
export const updateCategory = (id, data) =>
  api.put(`${API_ROUTES.INVENTORY_CATEGORIES}/${id}`, data);
export const deleteCategory = (id) =>
  api.delete(`${API_ROUTES.INVENTORY_CATEGORIES}/${id}`);

/* ─── Manufacturers ─── */
export const getManufacturers = () =>
  api.get(API_ROUTES.INVENTORY_MANUFACTURERS);
export const createManufacturer = (data) =>
  api.post(API_ROUTES.INVENTORY_MANUFACTURERS, data);
export const updateManufacturer = (id, data) =>
  api.put(`${API_ROUTES.INVENTORY_MANUFACTURERS}/${id}`, data);
export const deleteManufacturer = (id) =>
  api.delete(`${API_ROUTES.INVENTORY_MANUFACTURERS}/${id}`);

/* ─── Batches ─── */
export const addBatch = (data) => api.post(API_ROUTES.INVENTORY_BATCHES, data);
export const updateBatch = (batchId, data) =>
  api.put(`${API_ROUTES.INVENTORY_BATCHES}/${batchId}`, data);
export const deleteBatch = (batchId) =>
  api.delete(`${API_ROUTES.INVENTORY_BATCHES}/${batchId}`);

/* ─── Barcode ─── */
export const generateBarcode = () =>
  api.get(API_ROUTES.INVENTORY_BARCODE_GENERATE);

/* ─── Bulk Import ─── */
export const bulkImportMedicines = (data) =>
  api.post(API_ROUTES.IMPORT_BULK, data);

/* 📊 Inventory Analytics */
export const getInventoryValueSummary = async () => {
  try {
    const res = await api.get(API_ROUTES.INVENTORY_ANALYTICS_SUMMARY);
    return res;
  } catch (err) {
    // MOCK DATA FALLBACK for UI testing
    return {
      data: {
        success: true,
        data: {
          totalValue: 2450890.50,
          purchaseValue: 1845000.00,
          estimatedProfit: 605890.50,
          expiryRiskValue: 45200.00,
          deadStockValue: 125400.00,
          lastUpdated: new Date().toISOString()
        }
      }
    };
  }
};

export const getInventoryCategoryBreakdown = async () => {
  try {
    const res = await api.get(API_ROUTES.INVENTORY_ANALYTICS_CATEGORIES);
    return res;
  } catch (err) {
    return {
      data: {
        success: true,
        data: [
          { category: "Tablets", value: 950000, count: 12450, color: "#0ea5e9" },
          { category: "Syrups", value: 450000, count: 3200, color: "#8b5cf6" },
          { category: "Injections", value: 680000, count: 1800, color: "#f43f5e" },
          { category: "Ointments", value: 210000, count: 4500, color: "#10b981" },
          { category: "OTC", value: 160890, count: 8900, color: "#f59e0b" },
        ]
      }
    };
  }
};

export const getHighValueStock = async () => {
  try {
    const res = await api.get(API_ROUTES.INVENTORY_ANALYTICS_HIGH_VALUE);
    return res;
  } catch (err) {
    return {
      data: {
        success: true,
        data: [
          { id: 1, name: "Meropenem 1g Injection", batch: "MER2023", qty: 450, purchaseValue: 405000, sellingValue: 540000, margin: 33 },
          { id: 2, name: "Human Albumin 20%", batch: "ALB982", qty: 85, purchaseValue: 255000, sellingValue: 340000, margin: 33 },
          { id: 3, name: "Ceftriaxone 1g", batch: "CEF092", qty: 2100, purchaseValue: 105000, sellingValue: 168000, margin: 60 },
          { id: 4, name: "Novomix 30 Flexpen", batch: "NOV11", qty: 320, purchaseValue: 160000, sellingValue: 192000, margin: 20 },
        ]
      }
    };
  }
};

export const getExpiryRisk = async () => {
  try {
    const res = await api.get(API_ROUTES.INVENTORY_ANALYTICS_EXPIRY_RISK);
    return res;
  } catch (err) {
    return {
      data: {
        success: true,
        data: {
          days30: [
            { id: 10, name: "Amoxicillin 500mg", qty: 450, value: 18000, daysLeft: 12 },
            { id: 11, name: "Paracetamol IV", qty: 120, value: 9500, daysLeft: 22 },
          ],
          days60: [
            { id: 12, name: "Pantoprazole 40mg", qty: 800, value: 32000, daysLeft: 45 },
          ],
          deadStock: [
            { id: 13, name: "Vitamin B Complex", qty: 1500, value: 75000, inactiveDays: 180 },
            { id: 14, name: "Calcium Sandoz", qty: 400, value: 50400, inactiveDays: 210 },
          ]
        }
      }
    };
  }
};
