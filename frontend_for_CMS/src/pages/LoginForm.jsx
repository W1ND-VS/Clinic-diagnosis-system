import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../service/authApi";
import "@fortawesome/fontawesome-free/css/all.min.css";

const LoginForm = ({ setToken = () => { } }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            // 1. Thử đăng nhập với endpoint bác sĩ
            try {
                const doctorResponse = await authApi.post("/auth/login", {
                    nv_ma: username,
                    nv_password: password,
                });

                if (doctorResponse?.data?.success && doctorResponse.data?.data?.access_token) {
                    handleSuccessfulLogin(doctorResponse.data.data, 'doctor');
                    return;
                }
            } catch (doctorError) {
                console.log("Không đăng nhập được với vai trò bác sĩ");
            }

            // 2. Thử đăng nhập với endpoint tiếp tân
            try {
                const receptionistResponse = await authApi.post("/auth/login_tieptan", {
                    nv_ma: username,
                    nv_password: password,
                });

                if (receptionistResponse?.data?.success && receptionistResponse.data?.data?.access_token) {
                    handleSuccessfulLogin(receptionistResponse.data.data, 'receptionist');
                    return;
                }
            } catch (receptionistError) {
                console.log("Không đăng nhập được với vai trò tiếp tân");
            }

            // 3. Thử đăng nhập với endpoint quản lý
            try {
                const adminResponse = await authApi.post('/auth/login/admin', {
                    username: username,
                    password: password
                });

                if (adminResponse?.data?.success && adminResponse.data?.data?.access_token) {
                    handleSuccessfulLogin(adminResponse.data.data, 'admin');
                    return;
                }
            } catch (adminError) {
                console.log("Không đăng nhập được với vai trò quản lý");
            }

            // 4. Thử đăng nhập với endpoint bệnh nhân
            try {
                const patientResponse = await authApi.post("/auth/login/benhnhan", {
                    bn_sdt: username,
                    bn_password: password
                });

                if (patientResponse?.data?.success && patientResponse.data?.data?.access_token) {
                    // Lưu token và thông tin bệnh nhân
                    localStorage.setItem("access_token", patientResponse.data.data.access_token);
                    localStorage.setItem("user_data", JSON.stringify({
                        ...patientResponse.data.data.user_info,
                        role: "benhnhan"
                    }));
                    setToken(patientResponse.data.data.access_token);
                    console.log("Đăng nhập thành công với vai trò: benhnhan");
                    navigate("/benhnhan/dashboard"); // Chuyển hướng sang trang bệnh nhân
                    return;
                }
            } catch (patientError) {
                console.log("Không đăng nhập được với vai trò bệnh nhân");
            }

            // Nếu tất cả đều không thành công
            setMessage("Tên đăng nhập hoặc mật khẩu không đúng!");

        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            setMessage("Có lỗi xảy ra. Vui lòng thử lại sau!");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessfulLogin = (data, role) => {
        const { access_token, user } = data;

        // Lưu token và thông tin người dùng
        localStorage.setItem("access_token", access_token);

        // Lưu thông tin user với role được xác định
        const userData = {
            ...user,
            role: role // Gán role được xác định từ endpoint thành công
        };

        if (userData) {
            localStorage.setItem("user_data", JSON.stringify(userData));
        }

        setToken(access_token);
        console.log("Đăng nhập thành công với vai trò:", role);

        // Chuyển hướng dựa trên vai trò
        switch (role) {
            case 'admin':
                navigate("/admin/dashboard");
                break;
            case 'doctor':
                navigate("/");
                break;
            case 'receptionist':
                navigate("/");
                break;
            default:
                navigate("/");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-dark-bg">
            <div className="bg-dark-card p-8 rounded-lg shadow-lg w-96 border border-dark-border">
                <h2 className="text-2xl font-bold mb-6 text-center text-dark-text">
                    Đăng Nhập Hệ Thống
                </h2>

                {message && (
                    <div className="bg-red-900 bg-opacity-20 text-red-400 p-3 rounded-lg mb-4 text-center">
                        <i className="fas fa-exclamation-circle mr-2"></i>
                        {message}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-4 relative">
                        <label htmlFor="username" className="block text-sm font-bold mb-2 text-dark-textSecondary">
                            Tên đăng nhập
                        </label>
                        <div className="relative">
                            <i className="fa fa-user absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary-400"></i>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nhập tên đăng nhập hoặc SĐT"
                                className="pl-10 pr-4 py-3 w-full border rounded-lg bg-secondary-800 border-dark-border text-dark-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-6 relative">
                        <label htmlFor="password" className="block text-sm font-bold mb-2 text-dark-textSecondary">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <i className="fa fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary-400"></i>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                className="pl-10 pr-4 py-3 w-full border rounded-lg bg-secondary-800 border-dark-border text-dark-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full ${loading
                            ? 'bg-primary-700 opacity-70 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-600 hover:shadow-lg'
                            } text-white py-3 px-4 rounded-lg font-bold transition-all duration-200 flex items-center justify-center`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang đăng nhập...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-sign-in-alt mr-2"></i>
                                Đăng nhập
                            </>
                        )}
                    </button>
                </form>

                {/* Footer với thông tin các vai trò được hỗ trợ */}
                <div className="mt-6 pt-4 border-t border-dark-border">
                    <p className="text-xs text-dark-textSecondary text-center mb-2">Vai trò được hỗ trợ:</p>
                    <div className="flex justify-center space-x-4 text-xs">
                        <span className="flex items-center text-dark-textSecondary">
                            <i className="fas fa-user-md mr-1 text-blue-400"></i>
                            Bác sĩ
                        </span>
                        <span className="flex items-center text-dark-textSecondary">
                            <i className="fas fa-user-tie mr-1 text-green-400"></i>
                            Tiếp tân
                        </span>
                        <span className="flex items-center text-dark-textSecondary">
                            <i className="fas fa-user-shield mr-1 text-purple-400"></i>
                            Quản lý
                        </span>
                    </div>
                </div>

                {/* Nút đăng ký dành cho bệnh nhân */}
                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate("/register")}
                        className="text-primary hover:underline font-semibold"
                    >
                        Đăng ký tài khoản bệnh nhân
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
