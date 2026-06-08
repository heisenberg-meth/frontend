const USER_KEY = "viyan_user";

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
  try {
    localStorage.removeItem("viyan_token");
    localStorage.removeItem("viyan_refresh_token");
  } catch {
    /* noop */
  }
}
