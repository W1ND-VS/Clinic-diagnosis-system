import React, { useEffect } from "react";
import DoctorSidebar from "../../../layouts/DoctorSidebar";
import Sidebar from "../../../layouts/Sidebar";
import AdminSidebar from "../../../layouts/AdminSidebar";
import PageHeader from "../../../layouts/PageHeader";
import api from "../../../service/apiService";
import { jwtDecode } from "jwt-decode";
import ModalAddPatient from "../../../components/ModalAddPatient";
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Patients = () => {
  const [patients, setPatients] = React.useState([]);
  const [role, setRole] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [error, setError] = React.useState("");
  const navigate = useNavigate();

  const handleAddPatient = (newPatient) => {
    console.log("Thông tin bệnh nhân mới:", newPatient);
    
    api.post("/benhnhan/create", newPatient)
      .then((response) => {
        // Khi thành công (status 200)
        console.log("Response success:", response.data);

        // Nếu thành công
        setPatients([...patients, response.data.data]);
        toast.success("Thêm bệnh nhân thành công!");
        setIsModalOpen(false); // Đóng modal sau khi thêm thành công
      })
      .catch((error) => {
        console.error("Lỗi thêm bệnh nhân:", error);

        // Log chi tiết cấu trúc lỗi
        console.error("Error structure:", JSON.stringify(error.response?.data));
        console.error("Error status:", error.response?.status);

        // Kiểm tra cụ thể lỗi 400 và thông điệp trùng SĐT
        toast.error(error.response?.data?.message || "Thêm bệnh nhân thất bại!");

        // Để đảm bảo toast luôn được gọi, không phụ thuộc vào điều kiện
        console.log("Toast đã được gọi");
      });
  };
  const HandelPatientDetail = (patient) => {
    navigate(`/patientdetail/${patient}`);
    console.log("Chuyển đến chi tiết bệnh nhân:", patient);
  }

  useEffect(() => {
    const fetchPatients = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        const decoded = jwtDecode(token); // giải mã token
        setRole(decoded.role); // lấy vai trò từ token
        console.log("Vai trò người dùng:", role);
      }
      try {
        const response = await api.get("/benhnhan/getall");
        setPatients(response.data.data);
      } catch (error) {
        console.error("Error fetching patients:", error);
        if (error.response && error.response.status === 401) {
          setError(
            "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
          );
        } else {
          setError("Không thể tải danh sách bệnh nhân.");
        }
      }
    };
    fetchPatients();
  }, []);

  const renderSidebar = () => {
    if (role === "bacsi") return <DoctorSidebar />;
    if (role === "tieptan") return <Sidebar />;
    if (role === "admin") return <AdminSidebar />;
    return null;
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      {renderSidebar()}
      <div className="flex-1 p-6 overflow-auto">
        <div className="container mx-auto">
          <PageHeader title="Quản Lý Bệnh Nhân" breadcrumbs={["Quản lý bệnh nhân"]}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <i className="fas fa-user-plus mr-2"></i> Thêm mới bệnh nhân
            </button>
          </PageHeader>

          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                className="border border-dark-border rounded-lg py-2 px-4 w-full bg-dark-card text-dark-text"
                placeholder="Tìm theo mã, số điện thoại, họ tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white p-1 rounded-md">
                <i className="fas fa-search px-2"></i>
              </button>
            </div>
          </div>

          <div className="bg-dark-card shadow-md rounded-lg overflow-hidden border border-dark-border">
            <table className="w-full min-w-full">
              <thead className="bg-secondary-800 text-dark-text">
                <tr>
                  <th className="py-3 px-4 font-semibold text-md text-left">
                    Số hồ sơ
                  </th>
                  <th className="py-3 px-4 font-semibold text-md text-left">
                    Họ tên
                  </th>
                  <th className="py-3 px-4 font-semibold text-md text-left">
                    Năm sinh
                  </th>
                  <th className="py-3 px-4 font-semibold text-md text-left">
                    Giới tính
                  </th>

                  <th className="py-3 px-4 font-semibold text-md text-left">
                    Số điện thoại
                  </th>
                  <th className="py-3 px-4 font-semibold text-md text-left">
                    Email
                  </th>

                  <th className="py-3 px-4 font-semibold text-md text-left">
                    Ghi chú
                  </th>
                  <th className="py-3 px-4 font-semibold text-md text-left">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="text-dark-text">
                {patients.map((patient) => (
                  <tr
                    key={patient.bn_ma}
                    onClick={() => HandelPatientDetail(patient.bn_ma)/*navigate(`/patient/${patient.bn_ma}`)*/}
                    className="hover:bg-secondary-900 cursor-pointer"
                  >
                    <td className="py-3 px-4 border-b border-dark-border">{patient.bn_ma}</td>
                    <td className="py-3 px-4 border-b border-dark-border">{patient.bn_hoten}</td>
                    <td className="py-3 px-4 border-b border-dark-border">{patient.bn_ngaysinh}</td>
                    <td className="py-3 px-4 border-b border-dark-border">{patient.bn_gioitinh}</td>
                    <td className="py-3 px-4 border-b border-dark-border">{patient.bn_sdt}</td>
                    <td className="py-3 px-4 border-b border-dark-border">{patient.bn_email || "-"}</td>
                    <td className="py-3 px-4 border-b border-dark-border">Ghi chú ở đây</td>
                    <td className="py-3 px-4 border-b border-dark-border">
                      <i className="fas fa-edit text-primary-400 cursor-pointer"></i>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ModalAddPatient
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddPatient}
      />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark" // Thêm theme dark cho toasts
        style={{ zIndex: 9999 }}
      />
    </div>
  );
};

export default Patients;
