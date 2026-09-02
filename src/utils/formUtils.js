export const formatDate = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "-"
    : parsed.toLocaleDateString("en-IN");
};

export const getErrorMessage = (err) => {
  if (!err) return "Unexpected error";
  return (
    err.response?.data?.error?.message ||
    err.response?.data?.message ||
    err.message ||
    "Unexpected error"
  );
};
