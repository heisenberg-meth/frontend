export function getErrorMessage(error) {
  if (!error) return "An unexpected error occurred";

  if (typeof error === "string") return error;

  if (error?.message && typeof error.message === "string") return error.message;

  if (error?.error?.message) return error.error.message;

  if (error?.error && typeof error.error === "string") return error.error;

  return "An unexpected error occurred";
}

export function normalizeErrorResponse(error) {
  if (!error) return error;

  if (error.response?.data) {
    const data = error.response.data;
    if (data.error && typeof data.error === "object" && data.error !== null) {
      data.error = data.error.message || "An unexpected error occurred";
    }
    if (data.message && typeof data.message === "object") {
      data.message = data.message.message || "An unexpected error occurred";
    }
  }

  if (error.message === "[object Object]") {
    error.message = "An unexpected error occurred";
  }

  return error;
}
