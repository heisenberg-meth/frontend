import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import api, { getBaseUrl } from "../api";
import axios from "axios";
import { API_ROUTES } from "../constants/api.routes.js";
import { clearAllAuth, getStoredUser, setUser } from "../utils/authStorage";
import { AuthContext } from "./authContextInstance";

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getStoredUser());
  const [tenant, setTenant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restored, setRestored] = useState(false);
  const [toast, setToast] = useState(null);
  const restoredRef = useRef(false);
  const restoreAttemptedRef = useRef(false);

  const showToast = useCallback((message, type = "success") => {
    let finalMessage = "An unexpected error occurred";
    if (typeof message === "string") {
      finalMessage = message;
    } else if (message && typeof message === "object") {
      if (message.response?.data?.error?.message) {
        finalMessage = message.response.data.error.message;
      } else if (message.response?.data?.message) {
        finalMessage = message.response.data.message;
      } else if (message.error?.message) {
        finalMessage = message.error.message;
      } else if (message.message && typeof message.message === "string") {
        finalMessage = message.message;
      } else if (message.error && typeof message.error === "string") {
        finalMessage = message.error;
      } else {
        finalMessage = JSON.stringify(message);
      }
    }
    setToast({ message: finalMessage, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const clearAuthState = useCallback(() => {
    clearAllAuth();
    setUserState(null);
    setTenant(null);
    setSubscription(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get(API_ROUTES.AUTH_ME);
      const payload = res?.data?.data || res?.data;

      if (!payload) {
        return null;
      }

      const userData = payload.user || null;
      const tenantData = payload.tenant || null;
      const subData = payload.subscription || null;

      if (userData && !userData.id) {
        clearAuthState();
        return null;
      }

      setUserState(userData);
      setTenant(tenantData);
      setSubscription(subData);
      if (userData) setUser(userData);
      return { user: userData, tenant: tenantData, subscription: subData };
    } catch (error) {
      if (error.response?.status === 401) {
        clearAuthState();
      }
      return null;
    }
  }, [clearAuthState]);

  const refreshToken = useCallback(async () => {
    try {
      const res = await axios.post(
        `${getBaseUrl()}/auth/refresh`,
        {},
        {
          withCredentials: true,
          timeout: 10000,
          headers: {
            ...(import.meta.env.DEV && {
              "ngrok-skip-browser-warning": "69420",
            }),
          },
        },
      );

      const payload = res.data?.data || res.data;
      const newToken = payload?.token || payload?.accessToken;

      if (!newToken) {
        throw new Error("Token refresh failed: Invalid response from server.");
      }

      return newToken;
    } catch (error) {
      console.error("[AUTH] Token refresh failed:", error.message || error);
      clearAuthState();
      return null;
    }
  }, [clearAuthState]);

  useEffect(() => {
    if (restoreAttemptedRef.current) return;
    restoreAttemptedRef.current = true;

    const restoreSession = async () => {
      if (!getStoredUser()) {
        setLoading(false);
        restoredRef.current = true;
        setRestored(true);
        return;
      }

      const newToken = await refreshToken();
      if (!newToken) {
        clearAuthState();
        setLoading(false);
        restoredRef.current = true;
        setRestored(true);
        return;
      }

      await refreshUser();
      setLoading(false);
      restoredRef.current = true;
      setRestored(true);
    };

    restoreSession();
  }, [clearAuthState, refreshToken, refreshUser]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthState();
    };

    window.addEventListener("auth:sessionExpired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:sessionExpired", handleSessionExpired);
  }, [clearAuthState]);

  const login = useCallback(
    async (credentials) => {
      const storedDeviceToken = localStorage.getItem("viyan_device_token");
      const res = await api.post("auth/login", {
        ...credentials,
        deviceToken: credentials.deviceToken || storedDeviceToken || undefined,
      });
      const payload = res.data?.data || res.data;

      if (!payload) {
        throw new Error("Login failed: Invalid response from server.");
      }

      if (payload.deviceVerificationRequired) {
        return {
          deviceVerificationRequired: true,
          message: payload.message,
        };
      }

      const {
        user: userData,
        subscriptionExpired,
        redirectTo,
        deviceToken,
      } = payload;

      if (deviceToken) {
        localStorage.setItem("viyan_device_token", deviceToken);
      }

      if (userData) {
        setUser(userData);
        setUserState(userData);
      }

      const context = await refreshUser();
      return {
        ...context,
        isNew: false,
        subscriptionExpired: !!subscriptionExpired,
        redirectTo,
      };
    },
    [refreshUser],
  );

  const register = useCallback(async (userData) => {
    const res = await api.post(API_ROUTES.AUTH_REGISTER, userData);
    const payload = res.data?.data || res.data;
    if (!payload || !payload.userId) {
      throw new Error("Registration failed: Invalid response from server.");
    }

    if (payload.deviceToken) {
      localStorage.setItem("viyan_device_token", payload.deviceToken);
    }

    return { isNew: true, userId: payload.userId };
  }, []);

  const logout = useCallback(
    async (options = {}) => {
      try {
        if (!options.silent) {
          await api.post(API_ROUTES.AUTH_LOGOUT).catch(() => {});
        }
      } finally {
        clearAuthState();
      }
    },
    [clearAuthState],
  );

  const updateUser = useCallback((updates) => {
    setUserState((prev) => {
      const updated = { ...prev, ...updates };
      setUser(updated);
      return updated;
    });
  }, []);

  const refreshSubscription = useCallback(async () => {
    try {
      const res = await api.get("subscriptions/status");
      const subData = res?.data?.data || res?.data || null;
      setSubscription(subData);
      return subData;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      tenant,
      subscription,
      loading,
      restored,
      toast,
      showToast,
      login,
      register,
      logout,
      updateUser,
      refreshToken,
      refreshUser,
      refreshSubscription,
    }),
    [
      user,
      tenant,
      subscription,
      loading,
      restored,
      toast,
      showToast,
      login,
      register,
      logout,
      updateUser,
      refreshToken,
      refreshUser,
      refreshSubscription,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
