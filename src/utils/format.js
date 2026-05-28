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
