import axios from "axios";

// Tạo một instance axios riêng cho việc đăng nhập không có interceptor 401
const authApi = axios.create({
  baseURL: "https://clinic-diagnosis-system-production.up.railway.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default authApi;