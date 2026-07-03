/**
 * Inventory Status Utility - Single Source of Truth
 *
 * All inventory status calculations MUST use this function.
 * No module may calculate status independently.
 *
 * Usage:
 *   import { getMedicineStatus } from '../utils/inventoryStatus';
 *   const status = getMedicineStatus(medicine);
 */

/**
 * Calculate the status of a medicine based on stock and expiry
 *
 * @param {Object} medicine - Medicine object with stock/batches data
 * @returns {string} Status: "Expired" | "Out of Stock" | "Low Stock" | "Expiring Soon" | "In Stock"
 */
export function getMedicineStatus(medicine) {
  if (!medicine) return "In Stock";

  // Get stock quantity - try multiple field names
  const stock = Number(
    medicine.availableStock ??
      medicine.stock ??
      medicine.currentStock ??
      medicine.availableQuantity ??
      0,
  );

  // Get reorder level - try multiple field names
  const reorder = Number(medicine.reorderLevel ?? medicine.reorderPoint ?? 10);

  // Get expiry date - try multiple sources
  const expiryDate = getExpiryDate(medicine);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  const thirtyDays = new Date(today);
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  // Check out of stock
  if (stock === 0) {
    return "Out of Stock";
  }

  // Check expired
  if (expiryDate) {
    const expDate = new Date(expiryDate);
    expDate.setHours(0, 0, 0, 0);
    if (expDate <= today) {
      return "Expired";
    }
  }

  // Check low stock
  if (stock <= reorder) {
    return "Low Stock";
  }

  // Check expiring soon
  if (expiryDate) {
    const expDate = new Date(expiryDate);
    expDate.setHours(0, 0, 0, 0);
    if (expDate <= thirtyDays) {
      return "Expiring Soon";
    }
  }

  return "In Stock";
}

export function getExpiryDate(medicine) {
  if (!medicine) return null;

  if (medicine.expiryDate) {
    return medicine.expiryDate;
  }

  // Check inventoryBatches array
  if (medicine.inventoryBatches && Array.isArray(medicine.inventoryBatches)) {
    const activeBatches = medicine.inventoryBatches
      .filter((b) => b.quantity > 0 && b.expiryDate)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (activeBatches.length > 0) {
      return activeBatches[0].expiryDate;
    }
  }

  // Check batch (single batch)
  if (medicine.batch?.expiryDate) {
    return medicine.batch.expiryDate;
  }

  // Check batches array
  if (medicine.batches && Array.isArray(medicine.batches)) {
    const activeBatches = medicine.batches
      .filter((b) => b.quantity > 0 && b.expiryDate)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (activeBatches.length > 0) {
      return activeBatches[0].expiryDate;
    }
  }

  return null;
}

/**
 * Get stock quantity from a medicine
 *
 * @param {Object} medicine - Medicine object
 * @returns {number} Stock quantity
 */
export function getStock(medicine) {
  if (!medicine) return 0;
  return Number(
    medicine.availableStock ??
      medicine.stock ??
      medicine.currentStock ??
      medicine.availableQuantity ??
      0,
  );
}

/**
 * Get reorder level from a medicine
 *
 * @param {Object} medicine - Medicine object
 * @returns {number} Reorder level
 */
export function getReorderLevel(medicine) {
  if (!medicine) return 10;
  return Number(medicine.reorderLevel ?? medicine.reorderPoint ?? 10);
}

/**
 * Get all status options for filter dropdown
 */
export const STATUS_OPTIONS = [
  "All Status",
  "In Stock",
  "Low Stock",
  "Out of Stock",
  "Expiring Soon",
  "Expired",
];

/**
 * Get status color for badge display
 *
 * @param {string} status - Medicine status
 * @returns {string} CSS color class
 */
export function getStatusColor(status) {
  switch (status) {
    case "Expired":
      return "danger";
    case "Out of Stock":
      return "danger";
    case "Low Stock":
      return "warning";
    case "Expiring Soon":
      return "warning";
    case "In Stock":
      return "success";
    default:
      return "default";
  }
}
