export const normalizeMedicine = (data) => {
  if (!data) return {};
  const batch = data.inventoryBatches?.[0];

  const categoryObj =
    data.category && typeof data.category === "object" ? data.category : null;
  const categoryName = categoryObj
    ? categoryObj.name
    : typeof data.category === "string"
      ? data.category
      : "";
  const categoryId = data.categoryId || categoryObj?.id || "";

  const manufacturerObj =
    data.manufacturer && typeof data.manufacturer === "object"
      ? data.manufacturer
      : null;
  const manufacturerName = manufacturerObj
    ? manufacturerObj.name
    : typeof data.manufacturer === "string"
      ? data.manufacturer
      : "";
  const manufacturerId = data.manufacturerId || manufacturerObj?.id || "";

  return {
    ...data,
    name: String(data.name || ""),
    genericName: String(data.genericName || ""),
    category: categoryName,
    categoryId: categoryId,
    manufacturer: manufacturerName,
    manufacturerId: manufacturerId,
    batchNumber: data.batchNumber || batch?.batchNumber || null,
    expiryDate: data.expiryDate || batch?.expiryDate || null,
    mrp: Number(data.mrp ?? batch?.mrp ?? 0),
    purchaseCost: Number(
      data.purchaseCost ?? data.purchasePrice ?? batch?.purchasePrice ?? 0,
    ),
    stock: Number(data.currentStock ?? data.stock ?? data.quantity ?? 0),
    reorderLevel: Number(data.reorderLevel ?? data.reorderPoint ?? 10),
    gst: Number(data.gst ?? data.gstPercentage ?? 12),
    supplier: data.supplier || "",
    barcode: String(data.barcode || ""),
    hsnCode: String(data.hsnCode || ""),
    schedule: String(data.schedule || data.scheduleType || "OTC"),
    notes: String(data.notes || data.description || ""),
    status: String(data.status || (data.isActive ? "active" : "inactive")),
    inventoryBatches: Array.isArray(data.inventoryBatches)
      ? data.inventoryBatches
      : [],
  };
};
