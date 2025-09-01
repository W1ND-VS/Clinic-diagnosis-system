import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { NavLink, useNavigate } from "react-router-dom";

const Sidebar = () => {
    const navigate = useNavigate();
    const handleLogOutClick = () => {
        localStorage.removeItem("access_token");
        navigate("/login");
    }

    return (
        <div className="h-screen w-60 bg-dark-card border-r border-dark-border text-dark-text flex flex-col p-4">
            {/* Logo và tiêu đề */}
            <div className="flex items-center mb-5">
                <i className="fas fa-clinic-medical text-primary text-xl mr-2"></i>
                <h3 className="text-xl font-bold text-primary-300">New Clinic</h3>
            </div>

            {/* Menu */}
            <ul className="space-y-2">
                <li>
                    <NavLink
                        to="/patients"
                        className={({ isActive }) =>
                            `flex items-center p-3 rounded-md transition ${isActive
                                ? "bg-primary-900 text-primary-300"
                                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                            }`
                        }
                    >
                        <i className="fas fa-users mr-3"></i> Bệnh nhân
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
                        <i className="fas fa-calendar-plus mr-3"></i> Lịch hẹn
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/medicalrecords"
                        className={({ isActive }) =>
                            `flex items-center p-3 rounded-md transition ${isActive
                                ? "bg-primary-900 text-primary-300"
                                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                            }`
                        }
                    >
                        <i className="fas fa-stethoscope mr-3"></i> Lịch Khám
                    </NavLink>
                </li>

                {/* Payment Management */}
                <li>
                    <NavLink
                        to="/payment"
                        className={({ isActive }) =>
                            `flex items-center p-3 rounded-md transition ${
                                isActive
                                    ? "bg-primary-900 text-primary-300"
                                    : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                            }`
                        }
                    >
                        <i className="fas fa-credit-card mr-3"></i> Thanh toán
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
}

export default Sidebar;
