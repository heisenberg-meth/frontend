/**
 * Escapes HTML special characters to prevent XSS when inserting
 * user-supplied values into HTML strings (e.g., document.write).
 *
 * @param {*} str - The value to escape
 * @returns {string} - The escaped HTML-safe string
 */
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
