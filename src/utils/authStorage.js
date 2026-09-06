const USER_KEY = "viyan_user:v1";
const TOKEN_KEY = "viyan_token:v1";
const REFRESH_TOKEN_KEY = "viyan_refresh_token:v1";

export function setUser(user) {
  try {
    // Only store safe display fields to prevent privilege escalation via XSS
    const safeUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  } catch {
    /* noop */
  }
}

export function getStoredUser() {
  try {
    localStorage.removeItem("viyan_user");
    const raw = localStorage.getItem(USER_KEY);
    return raw && raw !== "undefined" && raw !== "null"
      ? JSON.parse(raw)
      : null;
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* noop */
  }
}

export function getToken() {
  try {
    localStorage.removeItem("viyan_token");
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw && raw !== "undefined" && raw !== "null" ? raw : null;
  } catch {
    return null;
  }
}

export function setRefreshToken(token) {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    /* noop */
  }
}

export function getRefreshToken() {
  try {
    const raw = localStorage.getItem(REFRESH_TOKEN_KEY);
    return raw && raw !== "undefined" && raw !== "null" ? raw : null;
  } catch {
    return null;
  }
}

function clearUser() {
  try {
    localStorage.removeItem("viyan_user");
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export function clearAllAuth() {
  clearUser();
}
