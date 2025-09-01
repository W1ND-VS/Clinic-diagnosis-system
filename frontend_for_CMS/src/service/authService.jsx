import api from "./apiService";
import { jwtDecode } from "jwt-decode";

export const login = async (username, password) => {
    try {
        const response = await api.post("/auth/login", {
            nv_ma: username,
            nv_password: password,
        });
        if (response.data && response.data.success && response.data.data?.access_token) {
            localStorage.setItem("access_token", response.data.data.access_token);

            // Nếu API trả về thông tin user
            if (response.data.data.user) {
                localStorage.setItem("user_data", JSON.stringify(response.data.data.user));
            }

            return response.data.data;
        }
        return null; // Thêm return rõ ràng khi không có token

    } catch (error) {
        throw (error.response && error.response.data && error.response.data.message) || error.message || "Đăng nhập thất bại!";
    }
}

export const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");  // Nếu có lưu thêm dữ liệu người dùng
};

export const getCurrentUser = async () => {
    // Lấy thông tin user từ API sử dụng token
    try {
        const response = await api.get("/auth/user");
        return response.data.user;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        return null;
    }
}

export const isAuthenticated = () => {
    return !!localStorage.getItem("access_token");
}

// Thêm hàm kiểm tra token còn hạn hay không
export const isTokenValid = () => {
  const token = localStorage.getItem("access_token");
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Chuyển đổi từ milliseconds sang seconds
    
    // Token còn hạn nếu thời gian hết hạn > thời gian hiện tại
    return decoded.exp > currentTime;
  } catch (error) {
    console.error("Lỗi khi giải mã token:", error);
    return false;
  }
};

// Thêm hàm tự động đăng xuất nếu token hết hạn
export const checkTokenAndLogout = () => {
  if (!isTokenValid()) {
    console.log("Token hết hạn, đang đăng xuất...");
    logout();
    window.location.href = "/login";
    return false;
  }
  return true;
};