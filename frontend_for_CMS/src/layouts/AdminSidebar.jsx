import React, { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reportsExpanded, setReportsExpanded] = useState(
    location.pathname.includes('/admin/reports')
  );

  const handleLogOutClick = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  }

  // Kiểm tra xem đường dẫn hiện tại có phù hợp với một trong các báo cáo không
  const isReportActive = (path) => {
    return location.pathname === path;
  }

  return (
    <div className="h-screen w-60 bg-dark-card border-r border-dark-border text-dark-text flex flex-col p-4">
      {/* Logo và tiêu đề */}
      <div className="flex items-center mb-5">
        <i className="fas fa-clinic-medical text-primary text-xl mr-2"></i>
        <h3 className="text-xl font-bold text-primary-300">New Clinic</h3>
      </div>

      {/* Menu */}
      <ul className="space-y-2 overflow-y-auto flex-1">
        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-md transition ${isActive
                ? "bg-primary-900 text-primary-300"
                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
              }`
            }
          >
            <i className="fas fa-chart-line mr-3"></i> Tổng quan
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/admin/doctors"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-md transition ${isActive
                ? "bg-primary-900 text-primary-300"
                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
              }`
            }
          >
            <i className="fas fa-user-md mr-3"></i> Quản lý bác sĩ
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/admin/receptionists"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-md transition ${isActive
                ? "bg-primary-900 text-primary-300"
                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
              }`
            }
          >
            <i className="fas fa-user-tie mr-3"></i> Quản lý tiếp tân
          </NavLink>
        </li>

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
            <i className="fas fa-calendar-check mr-3"></i> Lịch hẹn
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/admin/workingscheduleadmin"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-md transition ${isActive
                ? "bg-primary-900 text-primary-300"
                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
              }`
            }
          >
            <i className="fas fa-calendar-week mr-3"></i> Lịch làm việc
          </NavLink>
        </li>

        {/* Quản lý dịch vụ y tế */}
        <li>
          <NavLink
            to="/admin/services"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-md transition ${isActive
                ? "bg-primary-900 text-primary-300"
                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
              }`
            }
          >
            <i className="fas fa-hospital mr-3"></i> Dịch vụ y tế
          </NavLink>
        </li>

        {/* Quản lý thuốc */}
        <li>
          <NavLink
            to="/admin/medicines"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-md transition ${isActive
                ? "bg-primary-900 text-primary-300"
                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
              }`
            }
          >
            <i className="fas fa-pills mr-3"></i> Quản lý thuốc
          </NavLink>
        </li>

        {/* Báo cáo với submenu */}
        <li className="space-y-1">
          <div
            onClick={() => setReportsExpanded(!reportsExpanded)}
            className={`flex items-center justify-between p-3 rounded-md transition cursor-pointer ${location.pathname.includes('/admin/reports')
              ? "bg-primary-900 text-primary-300"
              : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
              }`}
          >
            <div className="flex items-center">
              <i className="fas fa-file-medical-alt mr-3"></i> Báo cáo
            </div>
            <i className={`fas fa-chevron-${reportsExpanded ? 'down' : 'right'} text-xs`}></i>
          </div>

          {/* Submenu báo cáo */}
          {reportsExpanded && (
            <ul className="pl-6 space-y-1">
              <li>
                <NavLink
                  to="/admin/reports"
                  end
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-md transition text-sm ${isActive
                      ? "bg-primary-900 bg-opacity-50 text-primary-300"
                      : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                    }`
                  }
                >
                  <i className="fas fa-home mr-2"></i> Tổng quan báo cáo
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/reports/revenue"
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-md transition text-sm ${isActive
                      ? "bg-primary-900 bg-opacity-50 text-primary-300"
                      : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                    }`
                  }
                >
                  <i className="fas fa-chart-line mr-2"></i> Doanh thu
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/reports/patients"
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-md transition text-sm ${isActive
                      ? "bg-primary-900 bg-opacity-50 text-primary-300"
                      : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                    }`
                  }
                >
                  <i className="fas fa-user-injured mr-2"></i> Bệnh nhân
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/reports/diseases"
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-md transition text-sm ${isActive
                      ? "bg-primary-900 bg-opacity-50 text-primary-300"
                      : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                    }`
                  }
                >
                  <i className="fas fa-disease mr-2"></i> Bệnh
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/reports/specialties"
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-md transition text-sm ${isActive
                      ? "bg-primary-900 bg-opacity-50 text-primary-300"
                      : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                    }`
                  }
                >
                  <i className="fas fa-stethoscope mr-2"></i> Chuyên khoa
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/reports/doctors"
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-md transition text-sm ${isActive
                      ? "bg-primary-900 bg-opacity-50 text-primary-300"
                      : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                    }`
                  }
                >
                  <i className="fas fa-user-md mr-2"></i> Bác sĩ
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/reports/services"
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-md transition text-sm ${isActive
                      ? "bg-primary-900 bg-opacity-50 text-primary-300"
                      : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                    }`
                  }
                >
                  <i className="fas fa-hospital mr-2"></i> Dịch vụ
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/reports/medicines"
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-md transition text-sm ${isActive
                      ? "bg-primary-900 bg-opacity-50 text-primary-300"
                      : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
                    }`
                  }
                >
                  <i className="fas fa-pills mr-2"></i> Thuốc
                </NavLink>
              </li>
            </ul>
          )}
        </li>

        <li>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-md transition ${isActive
                ? "bg-primary-900 text-primary-300"
                : "hover:bg-secondary-800 text-dark-textSecondary hover:text-dark-text"
              }`
            }
          >
            <i className="fas fa-cog mr-3"></i> Cài đặt
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

export default AdminSidebar;