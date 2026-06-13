export const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const formatCurrency = (value) => {
  return safeNumber(value).toFixed(2);
};

export const formatNumber = (value, decimals = 2) => {
  return safeNumber(value).toFixed(decimals);
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
};
