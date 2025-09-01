import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../../layouts/Sidebar";
import PageHeader from "../../../layouts/PageHeader";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import api from '../../../service/apiService';
import { WORKING_SHIFTS } from '../../../constants/workingShifts';

const MedicalSchedule = () => {
  // States giữ nguyên
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [status, setStatus] = useState("all");
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [role, setRole] = useState(null);

  // Pagination
  const recordsPerPage = 10;

  // Fetch specialists
  useEffect(() => {
  
    fetchSpecialties();
    fetchDoctors('all');
  }, []);

  // Fetch medical records based on filters

  const fetchSpecialties = async () => {
    try {
      // Thay đổi axios.get -> api.get
      const response = await api.get("/chuyenkhoa/getall");

      if (response.data && response.data.data) {
        setSpecialties([{ ck_ma: 'all', ck_ten: 'Tất cả chuyên khoa' }, ...response.data.data]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách chuyên khoa:", error);
    }
  };

  const fetchDoctors = async (specialtyId = 'all') => {
    try {
      let endpoint = ``;
      if (specialtyId !== 'all') {
        endpoint = `bacsi/chuyenkhoa/${specialtyId}`;
        console.log(`Lấy bác sĩ theo chuyên khoa: ${specialtyId}`);
      } else {
        endpoint = `bacsi/getall`;
        console.log("Lấy tất cả bác sĩ");
      }

      const response = await api.get(endpoint);
      console.log("Danh sách bác sĩ:", response.data.data);

      if (response.data && response.data.data) {
        setDoctors([{ nv_ma: 'all', nv_hoten: 'Tất cả bác sĩ' }, ...response.data.data]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách bác sĩ:", error);
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);

      // Tính toán offset từ currentPage
      const offset = (currentPage - 1) * recordsPerPage;

      // Xây dựng endpoint API với tham số
      let endpoint = `/phieukham/paged?offset=${offset}&limit=${recordsPerPage}`;

      // Thêm ngày (hoặc phạm vi ngày)
      const selectedDateFormatted = format(selectedDate, 'yyyy-MM-dd');
      endpoint += `&ngay=${selectedDateFormatted}`;

      // Các filter khác giữ nguyên
      if (selectedDoctor !== 'all') {
        endpoint += `&bacsi=${selectedDoctor}`;
      }
      
      if (status !== 'all') {
        const statusMapping = {
          'waiting': 'Chờ khám',
          'in_progress': 'Đang khám',
          'completed': 'Hoàn thành',
          'cancelled': 'Đã hủy'
        };
        endpoint += `&trangthai=${statusMapping[status]}`;
      }

      if (searchQuery) {
        endpoint += `&keyword=${encodeURIComponent(searchQuery)}`;
      }

      console.log(`Gọi API: ${endpoint}`);
      const response = await api.get(endpoint);

      if (response.data && response.data.data && response.data.data.data) {
        // Chuẩn hóa dữ liệu từ API
        const recordsData = await Promise.all(response.data.data.data.map(async record => {
          const phieuHen = record.phieu_hen || {};
          const bn_ma = phieuHen.bn_ma || '';
          const nv_ma = phieuHen.nv_ma || record.nv_ma || '';

          // Lấy thông tin bệnh nhân và bác sĩ (giữ nguyên code hiện tại)
          let patient_name = null;
          if (bn_ma) {
            try {
              const patientResponse = await api.get(`/benhnhan/getbyid/${bn_ma}`);
              patient_name = patientResponse.data.data.bn_hoten;
            } catch (error) {
              console.error("Lỗi khi lấy thông tin bệnh nhân:", error);
            }
          }

          let doctor_name = null;
          let specialty_name = null;
          if (nv_ma) {
            try {
              const doctorResponse = await api.get(`/bacsi/${nv_ma}`);
              doctor_name = doctorResponse.data.data.nv_hoten;
              specialty_name = doctorResponse.data.data.ck_ten;
            } catch (error) {
              console.error("Lỗi khi lấy thông tin bác sĩ:", error);
            }
          }

          // Xác định ca làm việc dựa trên giờ bắt đầu
          const startTime = record.pk_giokhamdukien || phieuHen.ph_giohen;
          const shiftId = determineWorkingShift(startTime);
          
          // Lấy thông tin phòng nếu có đủ thông tin
          let roomInfo = null;
          if (nv_ma && shiftId) {
            roomInfo = await fetchRoomInfo(nv_ma, selectedDate, shiftId);
          }

          return {
            pk_ma: record.pk_ma,
            nv_ma: nv_ma,
            bn_ma: bn_ma,
            patient_name: patient_name,
            doctor_name: doctor_name,
            specialty_name: specialty_name,
            pk_ngay: record.pk_ngaykham,
            pk_giobatdau: startTime,
            pk_gioketthuc: record.pk_gioketthuc || phieuHen.ph_gioketthuc,
            status: record.pk_trangthai === "Chờ khám" ? "waiting"
              : record.pk_trangthai === "Đang khám" ? "in_progress"
                : record.pk_trangthai === "Hoàn thành" ? "completed"
                  : record.pk_trangthai === "Đã hủy" ? "cancelled"
                    : "waiting",
            rawData: record,
            shiftId: shiftId,  // Thêm thông tin ca làm việc
            roomInfo: roomInfo // Thêm thông tin phòng
          };
        }));

        setRecords(recordsData);
        const total = response.data.data.total || recordsData.length;
        setTotalPages(Math.ceil(total / recordsPerPage));
      }

      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu lịch khám:", error);
      toast.error("Không thể tải dữ liệu lịch khám. Vui lòng thử lại sau!");
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMedicalRecords();
  };

  const handleSpecialtyChange = (e) => {
    const specialtyId = e.target.value;
    setSelectedSpecialty(specialtyId);
    setSelectedDoctor('all'); // Reset bác sĩ khi chọn chuyên khoa mới
    fetchDoctors(specialtyId);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs font-medium">Hoàn thành</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-primary-900 text-primary-300 rounded-full text-xs font-medium">Đang khám</span>;
      case 'waiting':
        return <span className="px-2 py-1 bg-yellow-900 text-yellow-300 rounded-full text-xs font-medium">Chờ khám</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-900 text-red-300 rounded-full text-xs font-medium">Đã hủy</span>;
      default:
        return <span className="px-2 py-1 bg-secondary-800 text-secondary-300 rounded-full text-xs font-medium">Không xác định</span>;
    }
  };
  console.log("Dữ liệu lịch khám:", records);
  records.forEach(record => {
    console.log(`Mã phiếu: ${record.pk_ma}, Bệnh nhân: ${record.patient_name || `BN#${record.bn_ma}`}, Bác sĩ: ${record.doctor_name || `BS#${record.nv_ma}`}, Ngày khám: ${record.pk_ngay}`);
  });

  // Thêm hàm này vào component MedicalSchedule
  const determineWorkingShift = useCallback((startTime) => {
    if (!startTime) return null;
    
    try {
      // Chuyển đổi thời gian từ string sang định dạng giờ
      const [hours, minutes] = startTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return null;
      
      const timeInMinutes = hours * 60 + minutes;
      
      // Xác định ca làm việc dựa vào khung giờ từ WORKING_SHIFTS
      if (timeInMinutes >= 7 * 60 + 30 && timeInMinutes < 11 * 60 + 30) {
        return '1'; // Ca sáng
      } else if (timeInMinutes >= 13 * 60 + 30 && timeInMinutes < 17 * 60 + 30) {
        return '2'; // Ca chiều
      } else if (timeInMinutes >= 18 * 60 && timeInMinutes < 21 * 60) {
        return '3'; // Ca tối
      }
    } catch (error) {
      console.error("Lỗi khi xác định ca làm việc:", error);
    }
    
    return null;
  }, []);

  // Thêm hàm này vào component MedicalSchedule
  const fetchRoomInfo = useCallback(async (doctorId, date, shiftId) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log("ca làm việc:", shiftId);
      console.log(`Đang lấy thông tin phòng: nv_ma=${doctorId}, nl_ngay=${formattedDate}, clv_stt=${shiftId}`);
      
      const response = await api.get(`/lichlv/get-room?nv_ma=${doctorId}&nl_ngay=${formattedDate}&clv_stt=${shiftId}`);
      
      if (response.data && response.data.data) {
        console.log("Thông tin phòng:", response.data.data);
        return response.data.data.phong_ma || null;
      }
      return null;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin phòng:", error);
      return null;
    }
  }, []);
  useEffect(() => {
    fetchMedicalRecords();
  }, [selectedDate, selectedDoctor, selectedSpecialty, status, currentPage, fetchRoomInfo, determineWorkingShift]);

  // Thêm useEffect để xác định vai trò người dùng khi component được tải
  useEffect(() => {
    const getCurrentUserRole = async () => {
      try {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setRole('tieptan'); // Mặc định là tiếp tân nếu không có token
          return;
        }
        
        // Gọi API để lấy thông tin người dùng hiện tại
        const response = await api.get('/auth/me');
        
        if (response.data && response.data.success) {
          const userInfo = response.data.data;
          
          // Xác định vai trò dựa trên thông tin người dùng
          if (userInfo.role === 'admin' || userInfo.vt_ma === 'ADMIN') {
            setRole('admin');
          } else if (userInfo.role === 'doctor' || userInfo.vt_ma === 'BACSI') {
            setRole('bacsi');
          } else {
            setRole('tieptan');
          }
          
          console.log('Vai trò người dùng:', role);
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        setRole('tieptan'); // Mặc định là tiếp tân nếu có lỗi
      }
    };

    getCurrentUserRole();
  }, []);

  const renderSidebar = () => {
    if (role === "admin") return <AdminSidebar />;
    if (role === "bacsi") return <DoctorSidebar />;
    if (role === "tieptan") return <Sidebar />;
    return null;
  };
  return (
    <div className="flex h-screen bg-dark-bg">
      {renderSidebar()}
      <div className="flex-1 p-6 overflow-auto flex flex-col">

        <PageHeader title="Quản Lý Lịch Khám" breadcrumbs={["Quản Lý Lịch Khám"]}>

        </PageHeader>

        {/* Filters */}
        <div className="bg-dark-card rounded-lg shadow p-4 mb-2 border border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">Ngày khám</label>
              <div className="relative">
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="dd/MM/yyyy"
                  className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                  onKeyDown={e => e.preventDefault()}
                />
                <i className="fas fa-calendar-alt absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary pointer-events-none"></i>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">Chuyên khoa</label>
              <select
                value={selectedSpecialty}
                onChange={handleSpecialtyChange}
                className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
              >
                {specialties.map(specialty => (
                  <option key={specialty.ck_ma} value={specialty.ck_ma}>
                    {specialty.ck_ten}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">Bác sĩ</label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
              >
                {doctors.map(doctor => (
                  <option key={doctor.nv_ma} value={doctor.nv_ma}>
                    {doctor.nv_hoten}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="waiting">Chờ khám</option>
                <option value="in_progress">Đang khám</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center">
            <form onSubmit={handleSearch} className="flex w-full max-w-md">
              <input
                type="text"
                placeholder="Tìm theo mã hoặc tên bệnh nhân..."
                className="flex-grow p-2 border border-dark-border rounded-l-md bg-secondary-800 text-dark-text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-600"
              >
                <i className="fas fa-search mr-2"></i> Tìm kiếm
              </button>
            </form>
            <button
              onClick={fetchMedicalRecords}
              className="ml-2 p-2 border border-dark-border rounded-md hover:bg-secondary-700 text-dark-text"
              title="Làm mới"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        {/* Medical Records Table */}
        <div className="bg-dark-card rounded-lg shadow flex-grow overflow-hidden border border-dark-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-border">
              <thead className="bg-secondary-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                    Mã phiếu
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                    Bệnh nhân
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                    Bác sĩ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                    Phòng
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-card divide-y divide-dark-border">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-dark-text">Đang tải...</span>
                      </div>
                    </td>
                  </tr>
                ) : !Array.isArray(records) || records.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-dark-textSecondary">
                      Không có dữ liệu lịch khám
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.pk_ma} className="hover:bg-secondary-900">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">
                        {record.pk_ma}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                        <div className="font-medium text-dark-text">{record.patient_name || `BN#${record.bn_ma}`}</div>
                        <div className="text-xs text-dark-textSecondary">{record.bn_ma}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                        <div className="text-dark-text">{record.doctor_name || `BS#${record.nv_ma}`}</div>
                        <div className="text-xs text-dark-textSecondary">{record.specialty_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                        <div>
                          {(() => {
                            try {
                              const date = new Date(record.pk_ngay);
                              return !isNaN(date.getTime())
                                ? format(date, 'dd/MM/yyyy')
                                : 'Không có ngày';
                            } catch (e) {
                              return 'Không có ngày';
                            }
                          })()}
                        </div>
                        <div className="text-xs">{record.pk_giobatdau || '--'} - {record.pk_gioketthuc || '--'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status || 'waiting')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                        <div className="bg-secondary-800 text-primary-300 py-1 px-2 rounded-md inline-flex items-center">
                          <i className="fas fa-door-open mr-2"></i>
                          {record.roomInfo || record.rawData?.pk_phongkham || `P-${record.pk_ma % 5 + 101}`}
                          {record.shiftId && (
                            <span className="ml-2 text-xs bg-primary bg-opacity-20 px-1 py-0.5 rounded">
                              {WORKING_SHIFTS.find(s => s.id === record.shiftId)?.name || `Ca ${record.shiftId}`}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && records.length > 0 && (
            <div className="px-6 py-3 flex justify-between items-center border-t border-dark-border">
              <div className="text-sm text-dark-textSecondary">
                Hiển thị <span className="font-medium">{(currentPage - 1) * recordsPerPage + 1}</span> đến <span className="font-medium">{Math.min(currentPage * recordsPerPage, records.length)}</span> của <span className="font-medium">{records.length}</span> kết quả
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-secondary-900 text-dark-textSecondary cursor-not-allowed' : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'}`}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-secondary-900 text-dark-textSecondary cursor-not-allowed' : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'}`}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ToastContainer theme="dark" />
    </div>
  );
};

export default MedicalSchedule;