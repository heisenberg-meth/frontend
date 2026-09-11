/**
 * Shared utility for Purchase Order and Invoice status normalization.
 * Single canonical source of truth across Purchase Management and Supplier Ecosystem.
 */

export const PURCHASE_ORDER_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  ORDERED: "ORDERED",
  SENT: "SENT",
  SENT_TO_SUPPLIER: "SENT_TO_SUPPLIER",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  PARTIALLY_RECEIVED: "PARTIALLY_RECEIVED",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
  CLOSED: "CLOSED",
  RECONCILED: "RECONCILED",
});

export const PURCHASE_PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  PARTIAL: "PARTIAL",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
});

export const normalizePOStatus = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

export const isPendingPOStatus = (status) => {
  const normalized = normalizePOStatus(status);
  return (
    normalized === "PENDING" ||
    normalized === "DRAFT" ||
    normalized === "PENDING_APPROVAL" ||
    normalized === "APPROVED" ||
    normalized === "ORDERED" ||
    normalized === "SENT" ||
    normalized === "SENT_TO_SUPPLIER" ||
    normalized === "ACKNOWLEDGED" ||
    normalized === "PARTIALLY_RECEIVED"
  );
};

export const isPendingInvoiceStatus = (status) => {
  const normalized = normalizePOStatus(status);
  return (
    normalized === "PENDING" ||
    normalized === "PARTIAL" ||
    normalized === "PARTIALLY_PAID" ||
    normalized === "OVERDUE"
  );
};

export const getPendingPOCount = (orders = []) =>
  (Array.isArray(orders) ? orders : []).filter((order) =>
    isPendingPOStatus(order?.status),
  ).length;

export const getPendingInvoiceCount = (invoices = []) =>
  (Array.isArray(invoices) ? invoices : []).filter((inv) => {
    const status = inv?.paymentStatus || inv?.status;
    return normalizePOStatus(status) === "PENDING";
  }).length;
