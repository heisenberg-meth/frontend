import axios from "axios";
import { clearAllAuth } from "./utils/authStorage";
const PRIVATE_IP_PATTERNS = [
  /^http:\/\/localhost/i,
  /^http:\/\/127\.0\.0\.1/i,
  /^http:\/\/192\.168\./i,
  /^http:\/\/10\./i,
  /^http:\/\/172\.(1[6-9]|2\d|3[01])\./i,
];
const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
const excludeCsrfRoutes = ["csrf-token", "payments/webhook"];
const idempotentMethods = ["POST", "PUT", "PATCH", "DELETE"];
const excludeIdempotencyRoutes = [
  "auth/login",
  "auth/register",
  "auth/refresh",
  "auth/refresh-token",
  "payments/create-order",
];
const excludedRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/refresh",
];
function sanitizeUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (PRIVATE_IP_PATTERNS.some((p) => p.test(url))) {
    const relative = url.replace(/^https?:\/\/[^/]+/, "");
    return relative.startsWith("/") ? relative : url;
  }
  if (url.startsWith("http://")) return "https://" + url.slice(7);
  return url;
}
function sanitizeImageUrls(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeImageUrls);
  const result = {
    ...obj,
  };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === "string" && /url|image|logo|avatar|photo/i.test(key)) {
      result[key] = sanitizeUrl(value);
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeImageUrls(value);
    }
  }
  return result;
}
export const getBaseUrl = () => {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    "https://api.medassist.viyaninfo.com/api"
  );
};
export const getBackendOrigin = () => {
  const baseUrl = getBaseUrl();
  return baseUrl.replace(/\/api$/, "");
};
const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
    ...(import.meta.env.DEV && {
      "ngrok-skip-browser-warning": "69420",
    }),
  },
});
let isRefreshing = false;
let failedQueue = [];
let sessionExpiredDispatched = false;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;
let csrfToken = null;
let csrfPromise = null;

/**
 * Invalidate the cached CSRF token so the next getCsrfToken() call
 * fetches a fresh value from the server. Call this after login, logout,
 * and session expiry — any event where the backend issues a new CSRF cookie.
 */
export function invalidateCsrfToken() {
  csrfToken = null;
  csrfPromise = null;
}
export async function getCsrfToken(forceRefresh = false) {
  if (csrfToken && !forceRefresh) return csrfToken;
  if (csrfPromise && !forceRefresh) return csrfPromise;

  // If forcing, discard any in-flight promise too
  if (forceRefresh) {
    csrfToken = null;
    csrfPromise = null;
  }
  csrfPromise = axios
    .get(`${getBaseUrl()}/csrf-token`, {
      withCredentials: true,
      headers: {
        ...(import.meta.env.DEV && {
          "ngrok-skip-browser-warning": "69420",
        }),
      },
    })
    .then((res) => {
      csrfToken = res.data?.csrfToken || res.data?.data?.csrfToken;
      csrfPromise = null;
      return csrfToken;
    })
    .catch(() => {
      csrfPromise = null;
      return null;
    });
  return csrfPromise;
}
function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}
function dispatchSessionExpired(reason) {
  if (sessionExpiredDispatched) return;
  sessionExpiredDispatched = true;
  refreshAttempts = 0;
  window.dispatchEvent(
    new CustomEvent("auth:sessionExpired", {
      detail: {
        reason,
      },
    }),
  );
  setTimeout(() => {
    sessionExpiredDispatched = false;
  }, 5000);
}
export function cyrb128(str) {
  let h1 = 1779033703,
    h2 = 3024733165,
    h3 = 3362453659,
    h4 = 502493250;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return (
    (h1 >>> 0).toString(16).padStart(8, "0") +
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h3 >>> 0).toString(16).padStart(8, "0") +
    (h4 >>> 0).toString(16).padStart(8, "0")
  );
}
api.interceptors.request.use(
  async (config) => {
    if (
      stateChangingMethods.includes(config.method?.toUpperCase()) &&
      !excludeCsrfRoutes.some((route) => config.url?.includes(route))
    ) {
      const activeCsrfToken = await getCsrfToken();
      if (activeCsrfToken) {
        config.headers["x-csrf-token"] = activeCsrfToken;
      }
    }
    if (
      idempotentMethods.includes(config.method?.toUpperCase()) &&
      !excludeIdempotencyRoutes.some((route) => config.url?.includes(route))
    ) {
      if (!config.headers["X-Idempotency-Key"]) {
        const key = `${config.method}:${config.url}:${JSON.stringify(config.data || {})}`;
        config.headers["X-Idempotency-Key"] = cyrb128(key);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === "object") {
      response.data = sanitizeImageUrls(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    if (!error.response) {
      return Promise.reject(error);
    }
    const status = error.response.status;
    const isExcluded = excludedRoutes.some((route) =>
      originalRequest?.url?.includes(route),
    );
    if (status === 401 && !originalRequest._retry && !isExcluded) {
      if (!localStorage.getItem("viyan_user")) {
        return Promise.reject(error);
      }
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        csrfToken = null;
        csrfPromise = null;
        clearAllAuth();
        dispatchSessionExpired("Session expired. Please log in again.");
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
          });
        }).then(() => {
          originalRequest._retry = true;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      refreshAttempts++;
      try {
        await axios.post(
          `${getBaseUrl()}/auth/refresh`,
          {},
          {
            withCredentials: true,
            timeout: 60000,
            headers: {
              ...(import.meta.env.DEV && {
                "ngrok-skip-browser-warning": "69420",
              }),
            },
          },
        );
        refreshAttempts = 0;
        isRefreshing = false;
        processQueue(null);

        // Backend rotates the accessToken/refresh_token HttpOnly cookies.
        // The browser sends them automatically on the retry.
        invalidateCsrfToken();
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        csrfToken = null;
        csrfPromise = null;
        clearAllAuth();
        dispatchSessionExpired("Session expired. Please log in again.");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    if (status === 401 && !isExcluded && !originalRequest._retry) {
      csrfToken = null;
      csrfPromise = null;
      clearAllAuth();
      dispatchSessionExpired("Session expired. Please log in again.");
    }
    if (status === 403) {
      const errData = error.response?.data;
      if (
        errData?.error?.code === "SUBSCRIPTION_EXPIRED" ||
        errData?.code === "SUBSCRIPTION_EXPIRED"
      ) {
        window.dispatchEvent(
          new CustomEvent("subscription:expired", {
            detail: errData.error || errData,
          }),
        );
      }
    }
    if (status === 409) {
      console.warn(
        "[API] Conflict:",
        error.response?.data?.error?.message || "",
      );
    }
    if (status >= 500) {
      const errorMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Internal Server Error";
      console.error(`[API] Server error (${status}):`, errorMsg);
      if (status === 503) {
        window.dispatchEvent(
          new CustomEvent("api:serviceUnavailable", {
            detail: {
              message: "Database or service is temporarily unavailable.",
            },
          }),
        );
        return Promise.reject(error);
      }
    }
    if (error.response?.data?.error?.message) {
      error.message = error.response.data.error.message;
    } else if (error.response?.data?.error) {
      error.message =
        typeof error.response.data.error === "string"
          ? error.response.data.error
          : error.response.data.error.message || error.message;
    }
    return Promise.reject(error);
  },
);
export default api;
