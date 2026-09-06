import { safeNumber } from "../utils/number.js";
export function normalizeInvoice(invoice) {
  if (!invoice) return null;

  const normalizedItems = (
    invoice.items ||
    invoice.itemsList ||
    invoice.invoiceItems ||
    []
  ).map((item) => ({
    id: item.id || item.medicineId,
    invoiceItemId: item.id || null,
    medicineId: item.medicineId || item.medicine?.id || null,
    name:
      item.name ||
      item.medicineName ||
      item.medicine?.name ||
      "Unknown Medicine",
    qty: safeNumber(item.qty ?? item.quantity ?? 0),
    price: safeNumber(item.price ?? item.unitPrice ?? item.mrp ?? 0),
    mrp: safeNumber(item.mrp ?? item.price ?? item.unitPrice ?? 0),
    gst: safeNumber(item.gst ?? item.gstPercentage ?? 0),
    batchId: item.batchId || item.batch?.id || null,
    batchNumber:
      item.batchNumber ||
      item.batchNo ||
      item.batch?.batchNumber ||
      item.batch?.batchNo ||
      item.batchCode ||
      " — ",
    discPercent: safeNumber(
      item.discPercent ??
        item.discountPercentage ??
        item.discountPercent ??
        item.discount ??
        0,
    ),
    total: safeNumber(item.total ?? item.totalPrice ?? item.totalAmount ?? 0),
  }));

  const patient =
    invoice.patientName ||
    (invoice.patient && typeof invoice.patient === "object"
      ? invoice.patient.name || invoice.patient.fullName
      : null) ||
    invoice.patient ||
    invoice.customerName ||
    "Walk-in Customer";

  const phone =
    invoice.patientPhone ||
    (invoice.patient && typeof invoice.patient === "object"
      ? invoice.patient.phone
      : null) ||
    invoice.phone ||
    invoice.customerPhone ||
    "N/A";

  const total = safeNumber(
    invoice.total ?? invoice.totalAmount ?? invoice.grandTotal ?? 0,
  );
  const discountAmount = safeNumber(
    invoice.discountAmount ?? invoice.discount ?? 0,
  );
  const discountPercentage = safeNumber(
    invoice.discountPercentage ?? invoice.discountPercent ?? 0,
  );

  return {
    id: invoice.id,
    invoiceNumber:
      invoice.invoiceNumber ||
      invoice.billNumber ||
      `INV-${String(invoice.id).slice(0, 8)}`,
    patient,
    phone,
    subtotal: safeNumber(invoice.subtotal ?? invoice.subTotal ?? 0),
    cgst: safeNumber(invoice.cgst ?? 0),
    sgst: safeNumber(invoice.sgst ?? 0),
    discount: discountAmount,
    discountAmount,
    discountPercentage,
    total,
    amount: total,
    paymentMethod: invoice.paymentMethod || invoice.paymentMode || "CASH",
    status: invoice.status || "PAID",
    date:
      invoice.date ||
      invoice.createdAt ||
      invoice.soldAt ||
      new Date().toISOString(),
    itemsList: normalizedItems,
    items: normalizedItems,
  };
}
