const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? "https://clinic-diagnosis-system-production.up.railway.app/api"
  : "http://localhost:5000/api";

const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

const normalizeApiBaseUrl = (value) => {
  if (!value) {
    return DEFAULT_API_BASE_URL;
  }

  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (value.startsWith("/")) {
    return value;
  }

  return `https://${value}`;
};

export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl).replace(
  /\/+$/,
  ""
);
 
