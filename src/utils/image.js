import { getBackendOrigin } from "../api.js";

const PRIVATE_IP_PATTERNS = [
  /^http:\/\/localhost/i,
  /^http:\/\/127\.0\.0\.1/i,
  /^http:\/\/192\.168\./i,
  /^http:\/\/10\./i,
  /^http:\/\/172\.(1[6-9]|2\d|3[01])\./i,
];

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNlNWU3ZWIiLz48dGV4dCB4PSI2NCIgeT0iNjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYmYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+";

function isPrivateUrl(url) {
  if (!url || typeof url !== "string") return true;
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(url));
}

function isRelativePath(url) {
  return (
    url &&
    typeof url === "string" &&
    url.startsWith("/") &&
    !url.startsWith("//")
  );
}

function sanitizeImageUrl(url) {
  if (!url || typeof url !== "string") return null;

  let cleaned = url.trim();

  if (isPrivateUrl(cleaned)) {
    const relativePath = cleaned.replace(/^https?:\/\/[^/]+/, "");
    if (
      relativePath &&
      relativePath.startsWith("/") &&
      !relativePath.startsWith("//")
    ) {
      cleaned = relativePath;
    } else {
      return null;
    }
  }

  if (cleaned.startsWith("http://")) {
    cleaned = "https://" + cleaned.slice(7);
  }

  if (isRelativePath(cleaned)) {
    return `${getBackendOrigin()}${cleaned}`;
  }

  if (cleaned.startsWith("https://")) {
    return cleaned;
  }

  return null;
}

export function getAvatarUrl(avatarPath, fullName) {
  if (avatarPath) {
    const sanitized = sanitizeImageUrl(avatarPath);
    if (sanitized) return sanitized;
  }

  if (fullName) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4FDBC8&color=0A0F1C`;
  }

  return PLACEHOLDER_IMAGE;
}
