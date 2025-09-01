import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Dashboard from "./pages/Dashboard";
import LoginForm from "./pages/LoginForm";
import Patients from "./features/Patient/pages/Patients";
import AppointmentRep from "./features/Appointments/pages/AppointmentRep";
import Examination from "./features/Examinations/pages/Examination";
import PatientDetail from './features/Patient/pages/PatientDetail';
import MedicalSchedule from "./features/MedicalSchedule/pages/MedicalSchedule";
import DoctorMedicalSchedule from "./features/MedicalSchedule/pages/DoctorMedicalSchedule";
import WorkingSchedule from "./features/WorkingSchedule/pages/WorkingSchedule";
import { isTokenValid, logout } from './service/authService';
import AdminSidebar from "./layouts/AdminSidebar"; // Import AdminSidebar nếu cần thiết
import AdminRoutes from "./routes/AdminRoutes";
import Appointments from "./features/Appointments/pages/Appointments";
import Laboratory from "./features/Laboratory/pages/Laboratory";
import PaymentManagement from "./features/Payment/pages/PaymentManagement";
import RegisterForm from "./pages/RegisterForm";
import DoctorManagement from "./features/Admin/Employee/pages/doctor/DoctorManagement";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DoctorProfile from "./layouts/DoctorProfile";
const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("access_token");
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setRole(decoded.role);
        if (!allowedRoles.includes(decoded.role)) {
          navigate("/unauthorized");
        }
      } catch (error) {
        localStorage.removeItem("access_token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    } else {
      navigate("/login");
    }
  }, [navigate, token, allowedRoles]);

  if (loading) return <div>Loading...</div>;
  return children;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("access_token") || "");
  useEffect(() => {
    // Kiểm tra token khi ứng dụng khởi động
    if (!isTokenValid() && window.location.pathname !== '/login') {
      console.log("Token hết hạn khi khởi động ứng dụng!");
      logout();
      window.location.href = '/login';
      return;
    }

    // Thiết lập kiểm tra token mỗi phút
    const tokenCheckInterval = setInterval(() => {
      if (!isTokenValid() && window.location.pathname !== '/login') {
        console.log("Token hết hạn trong quá trình sử dụng!");
        clearInterval(tokenCheckInterval);
        logout();
        window.location.href = '/login';
      }
    }, 60000); // Kiểm tra mỗi 60 giây

    return () => clearInterval(tokenCheckInterval);
  }, []);

  // Cập nhật token khi người dùng đăng nhập
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("access_token") || "");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <>
      <Routes>
        {/* Nếu có token, vào Dashboard, nếu không thì về Login */}
        <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/login" element={<LoginForm setToken={setToken} />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointmentrep" element={<AppointmentRep />} />

        <Route path="/patientdetail/:id" element={<PatientDetail />} />
        <Route path="/laboratory" element={<Laboratory />} />
        <Route path="/payment" element={<PaymentManagement />} />


        {/* Thêm cả hai routes cho trang khám bệnh */}
        <Route path="/examination" element={<Examination />} />
        <Route path="/examination/:id" element={<Examination />} />

        <Route path="/medicalrecords" element={<MedicalSchedule />} />
        <Route path="/doctormedicalrecords" element={<DoctorMedicalSchedule />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/workingschedule" element={<WorkingSchedule />} />
        <Route path="/doctorappointments" element={<Appointments />} />
        <Route path="/benhnhan/doctors" element={<DoctorManagement isPatientView={true} />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />
        {/* Thêm các route khác nếu cần */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminRoutes />
            </PrivateRoute>
          }
        />
      </Routes>
      <ToastContainer position="top-right" autoClose={2000} />
    </>
  );

}

export default App;
