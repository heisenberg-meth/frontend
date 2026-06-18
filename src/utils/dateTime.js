import { format } from "date-fns";

export function formatInvoiceTime(date) {
  if (!date) return "";
  return format(new Date(date), "hh:mm a");
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount)))
    return "0.00";
  return Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatInvoiceDate(date) {
  if (!date) return "";
  return format(new Date(date), "yyyy-MM-dd");
}
