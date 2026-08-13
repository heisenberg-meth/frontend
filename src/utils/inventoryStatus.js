/**
 * Inventory Status Utility - Single Source of Truth
 *
 * All inventory status calculations MUST use this function.
 * No module may calculate status independently.
 *
 * Status Precedence:
 *   Expired > Out of Stock > Expiring Soon > Low Stock > In Stock
 *
 * Usage:
 *   import { getMedicineStatus, getExpiryDate, STATUS_OPTIONS } from '../utils/inventoryStatus';
 *   const status = getMedicineStatus(medicine);
 */

/**
 * Calculate the status of a medicine based on stock and expiry
 *
 * @param {Object} medicine - Medicine object with stock/batches data
 * @returns {string} Status: "Expired" | "Out of Stock" | "Expiring Soon" | "Low Stock" | "In Stock"
 */
export function getMedicineStatus(medicine) {
  if (!medicine) return "In Stock";

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  const thirtyDays = new Date(today);
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const batches = Array.isArray(medicine.inventoryBatches)
    ? medicine.inventoryBatches
    : Array.isArray(medicine.batches)
      ? medicine.batches
      : null;

  let usableStock = Number(
    medicine.availableStock ??
      medicine.stock ??
      medicine.currentStock ??
      medicine.availableQuantity ??
      0,
  );
  const reorder = Number(medicine.reorderLevel ?? medicine.reorderPoint ?? 10);

  let hasExpiredStock = false;
  let nextExpiryDate = null;

  if (batches && batches.length > 0) {
    const activeBatchesWithStock = batches.filter(
      (b) =>
        (b.availableQuantity ?? b.quantity ?? 0) > 0 &&
        !b.deletedAt &&
        b.status !== "ARCHIVED",
    );

    const expiredBatchesWithStock = activeBatchesWithStock.filter((b) => {
      if (b.status === "EXPIRED") return true;
      if (!b.expiryDate) return false;
      const d = new Date(b.expiryDate);
      d.setHours(0, 0, 0, 0);
      return d < today;
    });

    const unexpiredBatchesWithStock = activeBatchesWithStock.filter((b) => {
      if (b.status === "EXPIRED") return false;
      if (!b.expiryDate) return true;
      const d = new Date(b.expiryDate);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    });

    hasExpiredStock = expiredBatchesWithStock.length > 0;

    // Recalculate usable unexpired stock from batches if batches with stock exist
    if (activeBatchesWithStock.length > 0) {
      usableStock = unexpiredBatchesWithStock.reduce(
        (sum, b) => sum + (b.availableQuantity ?? b.quantity ?? 0),
        0,
      );
    }

    if (unexpiredBatchesWithStock.length > 0) {
      const sorted = [...unexpiredBatchesWithStock]
        .filter((b) => b.expiryDate)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      if (sorted.length > 0) {
        nextExpiryDate = sorted[0].expiryDate;
      }
    } else if (expiredBatchesWithStock.length > 0) {
      const sorted = [...expiredBatchesWithStock]
        .filter((b) => b.expiryDate)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      if (sorted.length > 0) {
        nextExpiryDate = sorted[0].expiryDate;
      }
    }
  } else {
    const exp = getExpiryDate(medicine);
    if (exp) {
      const expDate = new Date(exp);
      expDate.setHours(0, 0, 0, 0);
      if (expDate < today) {
        hasExpiredStock = true;
      } else {
        nextExpiryDate = exp;
      }
    }
  }

  // Precedence: Expired > Out of Stock > Expiring Soon > Low Stock > In Stock

  // 1. Expired: Has expired stock and 0 usable unexpired stock
  if (hasExpiredStock && usableStock === 0) {
    return "Expired";
  }

  // 2. Out of Stock: 0 usable stock and no expired stock
  if (usableStock === 0) {
    return "Out of Stock";
  }

  // 3. Expiring Soon: usable stock > 0, nextExpiry within 30 days
  if (nextExpiryDate) {
    const expDate = new Date(nextExpiryDate);
    expDate.setHours(0, 0, 0, 0);
    if (expDate <= thirtyDays && expDate >= today) {
      return "Expiring Soon";
    }
  }

  // 4. Low Stock: usableStock <= reorder
  if (usableStock <= reorder) {
    return "Low Stock";
  }

  // 5. In Stock
  return "In Stock";
}

export function getExpiryDate(medicine) {
  if (!medicine) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const batches = Array.isArray(medicine.inventoryBatches)
    ? medicine.inventoryBatches
    : Array.isArray(medicine.batches)
      ? medicine.batches
      : null;

  if (batches && batches.length > 0) {
    const activeBatchesWithStock = batches.filter(
      (b) =>
        (b.availableQuantity ?? b.quantity ?? 0) > 0 &&
        !b.deletedAt &&
        b.status !== "ARCHIVED" &&
        b.expiryDate,
    );

    const unexpired = activeBatchesWithStock
      .filter((b) => b.status !== "EXPIRED" && new Date(b.expiryDate) >= today)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (unexpired.length > 0) {
      return unexpired[0].expiryDate;
    }

    const expired = activeBatchesWithStock
      .filter((b) => b.status === "EXPIRED" || new Date(b.expiryDate) < today)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (expired.length > 0) {
      return expired[0].expiryDate;
    }
  }

  if (medicine.expiryDate) {
    return medicine.expiryDate;
  }

  if (medicine.batch?.expiryDate) {
    return medicine.batch.expiryDate;
  }

  return null;
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
