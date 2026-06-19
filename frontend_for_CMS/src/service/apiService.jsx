import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Token expired or invalid.");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_data");
      localStorage.setItem("redirect_after_login", window.location.pathname);
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

const originalAxios = { ...axios };

axios.interceptors.request.use(
  api.interceptors.request.handlers[0].fulfilled,
  api.interceptors.request.handlers[0].rejected
);
axios.interceptors.response.use(
  api.interceptors.response.handlers[0].fulfilled,
  api.interceptors.response.handlers[0].rejected
);

export { originalAxios };
export default api;
