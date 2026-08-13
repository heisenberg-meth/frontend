export const safeNumber = (value) => {
  const num = safeNumber(value);
  return Number.isFinite(num) ? num : 0;
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
};
