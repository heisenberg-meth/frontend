export const calculateTotalStockValue = (medicines) => {
  if (!Array.isArray(medicines)) return 0;

  return medicines.reduce((total, med) => {
    const stock = Number(med.stock ?? med.currentStock ?? 0);
    const purchasePrice = Number(med.purchasePrice ?? med.purchaseCost ?? 0);
    return total + stock * purchasePrice;
  }, 0);
};
