import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import api from "../api";
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
    setToast({ message, type });
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
        `${api.defaults.baseURL}/auth/refresh`,
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
      const newRefreshToken = payload?.refreshToken;

      if (!newToken) {
        throw new Error("Token refresh failed: Invalid response from server.");
      }

      localStorage.setItem("viyan_token", newToken);
      if (newRefreshToken) {
        localStorage.setItem("viyan_refresh_token", newRefreshToken);
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
      const res = await api.post("auth/login", credentials);
      const payload = res.data?.data || res.data;

      if (!payload || !payload.token) {
        throw new Error("Login failed: Invalid response from server.");
      }

      const {
        user: userData,
        subscriptionExpired,
        redirectTo,
        token,
        refreshToken,
      } = payload;

      if (token) {
        localStorage.setItem("viyan_token", token);
      }
      if (refreshToken) {
        localStorage.setItem("viyan_refresh_token", refreshToken);
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
    const payload = res.data?.data;
    if (!payload || !payload.userId) {
      throw new Error("Registration failed: Invalid response from server.");
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
