const USER_KEY = "viyan_user";

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
    return raw && raw !== "undefined" && raw !== "null"
      ? JSON.parse(raw)
      : null;
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
  clearUser();
}
