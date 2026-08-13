export function normalizeArrayResponse(response, fallbackKey = null) {
  if (!response) return [];

  const data = response.data;
  if (!data) return [];

  if (Array.isArray(data.data)) return data.data;
  if (data.data && Array.isArray(data.data.items)) return data.data.items;

  if (fallbackKey && Array.isArray(data[fallbackKey])) return data[fallbackKey];
  if (fallbackKey && data.data && Array.isArray(data.data[fallbackKey]))
    return data.data[fallbackKey];

  if (Array.isArray(data.invoices)) return data.invoices;
  if (data.data && Array.isArray(data.data.invoices)) return data.data.invoices;

  if (Array.isArray(data.sales)) return data.sales;
  if (data.data && Array.isArray(data.data.sales)) return data.data.sales;

  if (Array.isArray(data.notifications)) return data.notifications;
  if (data.data && Array.isArray(data.data.notifications))
    return data.data.notifications;

  if (Array.isArray(data.medicines)) return data.medicines;
  if (data.data && Array.isArray(data.data.medicines))
    return data.data.medicines;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data.items)) return data.items;

  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    Object.keys(data).length > 0
  ) {
    if (data.success === true && !data.data) return [];
  }

  return [];
}

export function normalizeObjectResponse(response) {
  if (!response) return null;
  const data = response.data;
  if (!data) return null;

  if (data.success && data.data) return data.data;
  return data;
}

export const getMedicineName = (item) => {
  if (!item) return "Unknown Medicine";
  return (
    item.medicineName || item.medicine?.name || item.name || "Unknown Medicine"
  );
};
