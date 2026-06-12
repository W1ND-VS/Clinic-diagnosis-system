import axios from "axios";
// URL backend API (chỉnh lại nếu Flask chạy ở cổng khác)
const API_BASE_URL = "https://clinic-diagnosis-system-production.up.railway.app/api";

// Tạo instance Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để tự động đính kèm token nếu có
api.interceptors.request.use((config) => {
  // Sử dụng access_token thay vì user.token để phù hợp với hệ thống hiện tại
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Xử lý lỗi khi API trả về lỗi 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Token hết hạn hoặc không hợp lệ!");
      // Xóa tất cả thông tin đăng nhập
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_data");

      // Lưu lại đường dẫn hiện tại để sau khi đăng nhập lại có thể quay về
      localStorage.setItem("redirect_after_login", window.location.pathname);

      // Chuyển hướng về trang đăng nhập
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Tạo bản sao của axios.defaults để áp dụng cho axios global
const originalAxios = { ...axios };

// Áp dụng interceptors cho axios global - ĐIỂM MẤU CHỐT!
axios.interceptors.request.use(api.interceptors.request.handlers[0].fulfilled,
  api.interceptors.request.handlers[0].rejected);
axios.interceptors.response.use(api.interceptors.response.handlers[0].fulfilled,
  api.interceptors.response.handlers[0].rejected);

// Export cả instance và axios gốc
export { originalAxios };
export default api;
