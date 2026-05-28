import axios from "axios";
import api from "../api";

const DEFAULT_RETRIES = 2;
const RETRY_DELAY = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function safeApiCall(fn, options = {}) {
  const { retries = DEFAULT_RETRIES, onError, fallback } = options;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fn();
      return res;
    } catch (error) {
      lastError = error;
      if (axios.isCancel(error)) throw error;

      const status = error.response?.status;
      if (status === 401 || status === 403 || status === 404) break;
      if (status >= 500 && attempt < retries) {
        await sleep(RETRY_DELAY * (attempt + 1));
        continue;
      }
      if (status === 0 || !status) {
        await sleep(RETRY_DELAY * (attempt + 1));
        continue;
      }
      break;
    }
  }

  if (onError) onError(lastError);
  if (fallback !== undefined) return fallback;
  throw lastError;
}

export function normalizeResponse(res, dataKey) {
  if (!res) return null;
  const payload = res.data?.data || res.data || res;
  if (dataKey && payload?.[dataKey] !== undefined) return payload[dataKey];
  return payload;
}

export function normalizeArray(res, dataKey) {
  const data = normalizeResponse(res, dataKey);
  return Array.isArray(data) ? data : [];
}

export function getErrorMessage(error) {
  if (error?.response?.data?.error?.message) return error.response.data.error.message;
  if (error?.response?.data?.error) return typeof error.response.data.error === "string" ? error.response.data.error : "Request failed";
  if (error?.message) return error.message;
  return "An unexpected error occurred";
}

export { api };
