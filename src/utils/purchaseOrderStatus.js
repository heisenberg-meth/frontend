/**
 * Shared utility for Purchase Order status normalization and pending count.
 * Single source of truth across Purchase Management and Supplier Ecosystem.
 */

export const normalizePOStatus = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

export const isPendingPOStatus = (status) => {
  const normalized = normalizePOStatus(status);
  return normalized === "PENDING" || normalized === "SENT";
};

export const getPendingPOCount = (orders = []) =>
  (Array.isArray(orders) ? orders : []).filter((order) =>
    isPendingPOStatus(order?.status),
  ).length;
