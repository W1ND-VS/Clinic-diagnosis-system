const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? "https://clinic-diagnosis-system-production.up.railway.app/api"
  : "http://localhost:5000/api";

const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

const normalizeApiBaseUrl = (url) => {
  const normalizedUrl = url.replace(/\/+$/, "");
  return normalizedUrl.endsWith("/api")
    ? normalizedUrl
    : `${normalizedUrl}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);
