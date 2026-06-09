export function normalizeInvoice(invoice) {
  if (!invoice) return null;

  const normalizedItems = (invoice.items || invoice.itemsList || invoice.invoiceItems || []).map((item) => ({
    id: item.id || item.medicineId,
    invoiceItemId: item.id || null,
    medicineId: item.medicineId || item.medicine?.id || null,
    name: item.name || item.medicineName || item.medicine?.name || "Unknown Medicine",
    qty: Number(item.qty ?? item.quantity ?? 0),
    price: Number(item.price ?? item.unitPrice ?? item.mrp ?? 0),
    mrp: Number(item.mrp ?? item.price ?? item.unitPrice ?? 0),
    gst: Number(item.gst ?? item.gstPercentage ?? 0),
    batchId: item.batchId || null,
    total: Number(item.total ?? item.totalPrice ?? item.totalAmount ?? 0)
  }));

  const patient =
    invoice.patientName ||
    (invoice.patient && typeof invoice.patient === 'object' ? (invoice.patient.name || invoice.patient.fullName) : null) ||
    invoice.patient ||
    invoice.customerName ||
    "Walk-in Customer";

  const phone =
    invoice.patientPhone ||
    (invoice.patient && typeof invoice.patient === 'object' ? invoice.patient.phone : null) ||
    invoice.phone ||
    invoice.customerPhone ||
    "N/A";

  const total = Number(invoice.total ?? invoice.totalAmount ?? invoice.grandTotal ?? 0);

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber || invoice.billNumber || `INV-${String(invoice.id).slice(0, 8)}`,
    patient,
    phone,
    subtotal: Number(invoice.subtotal ?? invoice.subTotal ?? 0),
    cgst: Number(invoice.cgst ?? 0),
    sgst: Number(invoice.sgst ?? 0),
    discount: Number(invoice.discount ?? invoice.discountAmount ?? 0),
    total,
    amount: total,
    paymentMethod: invoice.paymentMethod || invoice.paymentMode || "CASH",
    status: invoice.status || "PAID",
    date: invoice.date || invoice.createdAt || invoice.soldAt || new Date().toISOString(),
    itemsList: normalizedItems,
    items: normalizedItems
  };
}
