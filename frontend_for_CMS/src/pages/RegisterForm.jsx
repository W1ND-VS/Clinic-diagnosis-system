import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../service/apiService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RegisterForm = () => {
    const [form, setForm] = useState({
        bn_hoten: "",
        bn_sdt: "",
        bn_ngaysinh: "",
        bn_gioitinh: "",
        password: "",
        confirmPassword: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }
        setIsLoading(true);
        try {
            const res = await api.post("/benhnhan/create", {
                bn_hoten: form.bn_hoten,
                bn_ngaysinh: form.bn_ngaysinh,
                bn_gioitinh: form.bn_gioitinh,
                bn_sdt: form.bn_sdt,
                bn_cccd: form.bn_cccd,
                bn_password: form.password,
            });
            if (res.data.success) {
                toast.success("Đăng ký thành công! Đang chuyển sang trang đăng nhập...");
                setTimeout(() => {
                    navigate("/login");
                }, 1500);
            } else {
                // Hiển thị lỗi trả về từ API (ví dụ: "Số điện thoại phải đúng 10 chữ số")
                toast.error(res.data.message || "Đăng ký thất bại!");
            }
        } catch (error) {
            // Nếu backend trả về lỗi dạng response.data.message
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Có lỗi xảy ra, vui lòng thử lại!");
            }
            console.error("Error occurred during registration:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-bg">
            <div className="bg-dark-card p-8 rounded-lg shadow-lg w-full max-w-md border border-dark-border">
                <h2 className="text-2xl font-bold mb-6 text-center text-primary">Đăng ký tài khoản bệnh nhân</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-textSecondary">Họ tên</label>
                        <input
                            type="text"
                            name="bn_hoten"
                            value={form.bn_hoten}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-textSecondary">Số điện thoại</label>
                        <input
                            type="text"
                            name="bn_sdt"
                            value={form.bn_sdt}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-textSecondary">Ngày sinh</label>
                        <input
                            type="date"
                            name="bn_ngaysinh"
                            value={form.bn_ngaysinh}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-textSecondary">Giới tính</label>
                        <select
                            name="bn_gioitinh"
                            value={form.bn_gioitinh}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                        >
                            <option value="">Chọn giới tính</option>
                            <option value="1">Nam</option>
                            <option value="2">Nữ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-textSecondary">CCCD</label>
                        <input
                            type="text"
                            name="bn_cccd"
                            value={form.bn_cccd}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-textSecondary">Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-textSecondary">Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 bg-primary text-white rounded-md hover:bg-primary-600 font-semibold"
                    >
                        {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-primary hover:underline font-semibold"
                    >
                        Đã có tài khoản bệnh nhân
                    </button>
                </div>
                <ToastContainer theme="dark" />
            </div>
        </div>
    );
};

export default RegisterForm;