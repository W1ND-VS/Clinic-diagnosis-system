import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { NavLink, useNavigate } from "react-router-dom";

const PatientSidebar = () => {
    const navigate = useNavigate();
    const handleLogOutClick = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_data");
        navigate("/login");
    };
    const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
    const patientId = userData.bn_ma;
    return (
        <div className="h-screen w-60 bg-dark-card border-r border-dark-border text-dark-text flex flex-col p-4">
            {/* Logo và tiêu đề */}
            <div className="flex items-center mb-5">
                <i className="fas fa-user-injured text-primary text-xl mr-2"></i>
                <h3 className="text-xl font-bold text-primary-300">Bệnh nhân</h3>
            </div>

            {/* Menu */}
            <ul className="space-y-2">
                <li>
                    <NavLink
                        to={`/patientdetail/${patientId}`}
                        className={({ isActive }) =>
                            `flex items-center p-3 rounded-md transition ${isActive
                                ? "bg-primary-900 text-primary-300"
                                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                            }`
                        }
                    >
                        <i className="fas fa-user mr-3"></i> Thông tin cá nhân
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/appointmentrep"
                        className={({ isActive }) =>
                            `flex items-center p-3 rounded-md transition ${isActive
                                ? "bg-primary-900 text-primary-300"
                                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                            }`
                        }
                    >
                        <i className="fas fa-calendar-alt mr-3"></i> Lịch hẹn khám
                    </NavLink>
                </li>
                
                <li>
                    <NavLink
                        to="/benhnhan/doctors"
                        className={({ isActive }) =>
                            `flex items-center p-3 rounded-md transition ${isActive
                                ? "bg-primary-900 text-primary-300"
                                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                            }`
                        }
                    >
                        <i className="fas fa-user-md mr-3"></i> Thông tin bác sĩ
                    </NavLink>
                </li>
            </ul>

            {/* Đăng xuất */}
            <div className="mt-auto pt-4 border-t border-dark-border">
                <button
                    onClick={handleLogOutClick}
                    className="w-full py-2 bg-secondary-800 hover:bg-secondary-700 text-dark-text rounded-md flex justify-center items-center transition-colors"
                >
                    <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default PatientSidebar;