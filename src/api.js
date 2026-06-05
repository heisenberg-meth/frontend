import axios from "axios";
import {
  getToken,
  setToken,
  getRefreshToken,
  setRefreshToken,
  clearAllAuth,
} from "./utils/authStorage";

const getBaseUrl = () => {
  const envUrl =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl !== undefined && envUrl !== null && envUrl !== "") return envUrl;
  return "https://medassist-backend-hryu.onrender.com/api";
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
    "ngrok-skip-browser-warning": "69420",
  },
});

let isRefreshing = false;
let failedQueue = [];
let sessionExpiredDispatched = false;

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
  window.dispatchEvent(
    new CustomEvent("auth:sessionExpired", {
      detail: { reason },
    }),
  );
  setTimeout(() => {
    sessionExpiredDispatched = false;
  }, 5000);
}

function cyrb128(str) {
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
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const idempotentMethods = ["POST", "PUT", "PATCH", "DELETE"];
    const excludeIdempotencyRoutes = [
      "auth/login",
      "auth/register",
      "auth/refresh",
      "auth/refresh-token",
    ];

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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const refreshToken = getRefreshToken();

    const excludedRoutes = [
      "/auth/login",
      "/auth/register",
      "/auth/logout",
      "/auth/refresh",
    ];

    const isExcluded = excludedRoutes.some((route) =>
      originalRequest?.url?.includes(route),
    );

    if (
      status === 401 &&
      refreshToken &&
      !originalRequest._retry &&
      !isExcluded
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentRefreshToken = getRefreshToken ? getRefreshToken() : null;

        console.log("Refreshing token...");
        console.log("Refresh token: ", currentRefreshToken);

        const res = await axios.post(
          `${getBaseUrl()}/auth/refresh`,
          { refreshToken: currentRefreshToken },
          {
            withCredentials: true,
            timeout: 10000,
            headers: {
              "ngrok-skip-browser-warning": "69420",
            },
          },
        );

        const newToken =
          res.data?.data?.token || res.data?.token || res.data?.accessToken;

        const newRefreshToken =
          res.data?.data?.refreshToken || res.data?.refreshToken;

        if (newRefreshToken) {
          setRefreshToken(newRefreshToken);
        }

        if (!newToken) {
          throw new Error("No token in refresh response");
        }

        setToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAllAuth();
        dispatchSessionExpired("Session expired. Please log in again.");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401 && !isExcluded) {
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
            detail: { message: "Service is temporarily unavailable." },
          }),
        );
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
