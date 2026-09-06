export const validatePatientPhone = (phone) => {
  const value = String(phone || "").trim();

  if (!value) {
    return "Phone number is required";
  }

  if (!/^\d+$/.test(value)) {
    return "Phone number must contain digits only";
  }

  if (value.length !== 10) {
    return "Phone number must be exactly 10 digits";
  }

  if (!/^[6-9]\d{9}$/.test(value)) {
    return "Enter a valid 10-digit Indian mobile number";
  }

  return "";
};
