const ARRAY_KEYS = [
  "medicines",
  "patients",
  "sales",
  "orders",
  "invoices",
  "items",
  "results",
  "records",
  "list",
  "batches",
  "alerts",
  "recommendations",
  "notifications",
  "returns",
  "payments",
  "transactions",
  "logs",
  "users",
  "suppliers",
  "purchaseOrders",
  "data",
];

export function normalizeArray(data) {
  if (!data) return [];

  if (Array.isArray(data)) return data;

  if (Array.isArray(data.data)) return data.data;

  for (const key of ARRAY_KEYS) {
    if (Array.isArray(data[key])) return data[key];
  }

  return [];
}
