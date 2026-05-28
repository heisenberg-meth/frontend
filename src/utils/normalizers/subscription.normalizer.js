export const normalizeSubscription = (data) => {
  if (!data) return {};
  return {
    ...data,
    id: String(data.id || ""),
    patientId: String(data.patientId || ""),
    planName: String(data.planName || ""),
    status: String(data.status || ""),
    startDate: String(data.startDate || ""),
    endDate: String(data.endDate || ""),
    medicines: Array.isArray(data.medicines) ? data.medicines : [],
  };
};
