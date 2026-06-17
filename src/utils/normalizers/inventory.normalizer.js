import { safeNumber } from '../../utils/number.js';
export const normalizeInventory = (data) => {
  if (!data) return {};
  return {
    ...data,
    id: String(data.id || ""),
    batchNumber: String(data.batchNumber || ""),
    quantity: safeNumber(data.quantity || data.stock || 0),
    mrp: safeNumber(data.mrp || 0),
    purchasePrice: safeNumber(data.purchasePrice || data.purchaseCost || 0),
    expiryDate: String(data.expiryDate || ""),
    supplier: String(data.supplier || ""),
    status: String(data.status || ""),
  };
};
