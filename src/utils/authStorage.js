const TOKEN_KEY = "viyan_token";
const USER_KEY = "viyan_user";
const REFRESH_TOKEN_KEY = "viyan_refresh_token";
const SESSION_ID_KEY = "viyan_session_id";

export function getToken() {
  try {
    const val = localStorage.getItem(TOKEN_KEY);
    return (val && val !== "undefined" && val !== "null") ? val : null;
  } catch {
    return null;
  }
}

export function setToken(token) {
  if (!token || token === "undefined" || token === "null") {
    clearToken();
    return;
  }
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* noop */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export function getRefreshToken() {
  try {
    const val = localStorage.getItem(REFRESH_TOKEN_KEY);
    return (val && val !== "undefined" && val !== "null") ? val : null;
  } catch {
    return null;
  }
}

export function setRefreshToken(token) {
  if (!token || token === "undefined" || token === "null") {
    clearRefreshToken();
    return;
  }
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    /* noop */
  }
}

export function clearRefreshToken() {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export function getSessionId() {
  try {
    return localStorage.getItem(SESSION_ID_KEY);
  } catch {
    return null;
  }
}

export function setSessionId(sessionId) {
  try {
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  } catch {
    /* noop */
  }
}

export function clearSessionId() {
  try {
    localStorage.removeItem(SESSION_ID_KEY);
  } catch {
    /* noop */
  }
}

export function setUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* noop */
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return (raw && raw !== "undefined" && raw !== "null") ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* noop */
  }
}

export function clearAllAuth() {
  clearToken();
  clearRefreshToken();
  clearSessionId();
  clearUser();
}
