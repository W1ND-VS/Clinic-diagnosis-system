import axios from "axios";

// Tạo một instance axios riêng cho việc đăng nhập không có interceptor 401
const authApi = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default authApi;