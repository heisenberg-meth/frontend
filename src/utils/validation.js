import { safeNumber } from '../utils/number.js';
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === "string" && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateEmail = (value) => {
  if (!value) return null;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(value) ? null : "Invalid email format";
};

export const validatePhone = (value) => {
  if (!value) return null;
  const cleaned = value.replace(/[\s\-()]/g, "");
  const regex = /^\+?[0-9]{10,15}$/;
  return regex.test(cleaned) ? null : "Invalid phone number (10-15 digits)";
};

export const validateGST = (value) => {
  if (!value) return null;
  const regex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/;
  return regex.test(value)
    ? null
    : "Invalid GSTIN format (e.g., 27AAPFC1234M1ZL)";
};

export const validateNumber = (value, fieldName, min = 0, max = Infinity) => {
  if (value === "" || value === null || value === undefined) return null;
  const num = safeNumber(value);
  if (isNaN(num)) return `${fieldName} must be a number`;
  if (num < min) return `${fieldName} must be at least ${min}`;
  if (num > max) return `${fieldName} must be at most ${max}`;
  return null;
};

export const validateDate = (value, fieldName, futureOnly = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return `${fieldName} must be a valid date`;
  if (futureOnly && date < new Date())
    return `${fieldName} must be in the future`;
  return null;
};

export const validateExpiryDate = (value) => {
  if (!value) return "Expiry date is required";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Invalid expiry date";
  if (date <= new Date()) return "Expiry date must be in the future";
  return null;
};

export const validateDuplicate = (value, list, field, fieldName) => {
  if (!value) return null;
  const exists = list.some(
    (item) => item[field]?.toLowerCase() === value.toLowerCase(),
  );
  return exists ? `${fieldName} already exists` : null;
};

export const validatePassword = (value) => {
  if (!value) return "Password is required";
  if (value.length < 6) return "Password must be at least 6 characters";
  return null;
};

export const validateForm = (rules, form) => {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const error = validator(form[field], form);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return errors;
};
