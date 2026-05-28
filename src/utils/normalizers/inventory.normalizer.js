export const normalizeInventory = (data) => {
  if (!data) return {};
  return {
    ...data,
    id: String(data.id || ""),
    batchNumber: String(data.batchNumber || ""),
    quantity: Number(data.quantity || data.stock || 0),
    mrp: Number(data.mrp || 0),
    purchasePrice: Number(data.purchasePrice || data.purchaseCost || 0),
    expiryDate: String(data.expiryDate || ""),
    supplier: String(data.supplier || ""),
    status: String(data.status || ""),
  };
};
