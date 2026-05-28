export const normalizePatient = (data) => {
  if (!data) return {};
  return {
    ...data,
    id: String(data.id || ""),
    firstName: String(data.firstName || ""),
    lastName: String(data.lastName || ""),
    email: String(data.email || ""),
    phone: String(data.phone || data.phoneNumber || ""),
    address: data.address || {},
    dob: String(data.dob || data.dateOfBirth || ""),
    gender: String(data.gender || ""),
    medicalHistory: Array.isArray(data.medicalHistory)
      ? data.medicalHistory
      : [],
    prescriptions: Array.isArray(data.prescriptions) ? data.prescriptions : [],
  };
};
