import { safeNumber } from '../utils/number.js';
export const calculateTotalStockValue = (medicines) => {
  if (!Array.isArray(medicines)) return 0;

  return medicines.reduce((total, med) => {
    const stock = safeNumber(med.stock ?? med.currentStock ?? 0);
    const purchasePrice = safeNumber(med.purchasePrice ?? med.purchaseCost ?? 0);
    return total + stock * purchasePrice;
  }, 0);
};
