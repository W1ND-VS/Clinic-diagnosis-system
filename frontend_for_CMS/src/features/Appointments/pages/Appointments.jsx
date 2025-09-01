import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../layouts/DoctorSidebar";
import api from "../../../service/apiService";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import PageHeader from "../../../layouts/PageHeader";
import EventDetailModal from '../../../components/AppointmentActionsModal';
// Thêm import DatePicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Appointments = () => {
  const navigate = useNavigate();
  const [currentDoctorId, setCurrentDoctorId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Thêm state ngày chọn
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Lấy thông tin bác sĩ đang đăng nhập từ token
  useEffect(() => {
    const fetchCurrentDoctor = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          const decoded = jwtDecode(token);
          setCurrentDoctorId(decoded.sub || decoded.nv_ma);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin bác sĩ từ token:", error);
      }
    };

    fetchCurrentDoctor();
  }, []);

  // Hàm làm mới lịch
  const refreshCalendar = () => {
    setRefreshCounter(prev => prev + 1);
    toast.info("Đang cập nhật lịch khám...");
  };

  // Lấy lịch khám của bác sĩ theo ngày chọn
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentDoctorId) return;

      setIsLoading(true);
      try {
        // Sử dụng ngày được chọn
        const dateStr = selectedDate.toLocaleDateString('en-CA');
        const response = await api.get(`/phieuhen/ngaybacsi/${currentDoctorId}?date=${dateStr}`);

        if (response.data && Array.isArray(response.data.data)) {
          const appointmentData = response.data.data;

          // Lấy thông tin chi tiết bệnh nhân
          const patientIds = [...new Set(appointmentData.map(appt => appt.bn_ma))];
          const patientDetailsMap = {};

          await Promise.all(
            patientIds.map(async (patientId) => {
              try {
                const patientResponse = await api.get(`/benhnhan/getbyid/${patientId}`);
                if (patientResponse.data && patientResponse.data.data) {
                  patientDetailsMap[patientId] = patientResponse.data.data;
                }
              } catch (error) {
                console.error(`Không thể lấy thông tin bệnh nhân ${patientId}:`, error);
              }
            })
          );

          // Tạo dữ liệu appointments với thông tin đầy đủ
          const enrichedAppointments = appointmentData.map(appointment => {
            const patientDetails = patientDetailsMap[appointment.bn_ma];
            const patientName = patientDetails ? patientDetails.bn_hoten : `BN#${appointment.bn_ma}`;

            // Xử lý status dựa vào pk_ma và ph_trangthai - CHỈ 3 TRẠNG THÁI
            let status = 'pending'; // mặc định là "Chưa đến"

            if (appointment.pk_ma) {
              // Nếu có phiếu khám (pk_ma) thì "Đã đến"
              status = 'completed';
            } else if (appointment.ph_trangthai === 'Đã hủy') {
              // Nếu trạng thái là "Đã hủy"
              status = 'canceled';
            } else {
              // Tất cả các trạng thái khác đều là "Chưa đến"
              status = 'pending';
            }

            return {
              ...appointment,
              patientName,
              patientDetails,
              status
            };
          });

          console.log("Lịch khám đã tải:", enrichedAppointments);
          console.log("Chi tiết trạng thái:", enrichedAppointments.map(apt => ({
            ph_ma: apt.ph_ma,
            ph_trangthai: apt.ph_trangthai,
            pk_ma: apt.pk_ma,
            status: apt.status
          })));

          setAppointments(enrichedAppointments);
        }
      } catch (error) {
        console.error("Lỗi khi tải lịch khám:", error);
        toast.error("Không thể tải lịch khám. Vui lòng thử lại sau!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();

    const refreshInterval = setInterval(() => {
      fetchAppointments();
    }, 300000);

    return () => clearInterval(refreshInterval);
  }, [currentDoctorId, refreshCounter, selectedDate]); // Thêm selectedDate vào dependency

  // Lọc appointments theo tìm kiếm và trạng thái
  useEffect(() => {
    let filtered = appointments;

    // Lọc theo tìm kiếm
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.bn_ma.includes(searchTerm)
      );
    }

    // Lọc theo trạng thái
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Sắp xếp theo thời gian
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.ph_ngayhen}T${a.ph_giohen}`);
      const dateB = new Date(`${b.ph_ngayhen}T${b.ph_giohen}`);
      return dateA - dateB;
    });

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter]);

  const handleAppointmentClick = (appointment) => {
    // Tạo mock event object tương tự như FullCalendar event
    const mockEvent = {
      extendedProps: {
        ...appointment,
        ph_ma: appointment.ph_ma,
        bn_ma: appointment.bn_ma,
        pk_ma: appointment.pk_ma,
        patientDetails: appointment.patientDetails
      }
    };

    setSelectedEvent(mockEvent);
    setIsEventModalOpen(true);
  };

  // Thêm function helper để format ngày an toàn
  const formatDateSafe = (dateString, formatStr = 'dd/MM/yyyy') => {
    try {
      if (!dateString) return 'Không có thông tin';

      // Kiểm tra xem dateString có phải là ISO format không
      const date = typeof dateString === 'string' && dateString.includes('T')
        ? parseISO(dateString)
        : new Date(dateString);

      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
      }

      return format(date, formatStr, { locale: vi });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Lỗi định dạng ngày';
    }
  };

  // Render danh sách lịch hẹn
  const renderAppointmentsList = () => {
    // Thống kê
    const totalAppointments = filteredAppointments.length;
    const completedAppointments = filteredAppointments.filter(apt => apt.status === 'completed').length;
    const pendingAppointments = filteredAppointments.filter(apt => apt.status === 'pending').length;
    const canceledAppointments = filteredAppointments.filter(apt => apt.status === 'canceled').length;

    return (
      <div className="space-y-4">
        {/* Thống kê tổng quan - cập nhật tên */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-textSecondary text-sm">Tổng lịch hẹn</p>
                <h3 className="text-2xl font-bold text-primary-300 mt-1">{totalAppointments}</h3>
              </div>
              <i className="fas fa-calendar text-primary-300"></i>
            </div>
          </div>

          <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-textSecondary text-sm">Chưa đến</p>
                <h3 className="text-2xl font-bold text-orange-400 mt-1">{pendingAppointments}</h3>
              </div>
              <i className="fas fa-clock text-orange-400"></i>
            </div>
          </div>

          <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-textSecondary text-sm">Đã đến</p>
                <h3 className="text-2xl font-bold text-green-400 mt-1">{completedAppointments}</h3>
              </div>
              <i className="fas fa-check-circle text-green-400"></i>
            </div>
          </div>

          <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-textSecondary text-sm">Đã hủy</p>
                <h3 className="text-2xl font-bold text-red-400 mt-1">{canceledAppointments}</h3>
              </div>
              <i className="fas fa-times-circle text-red-400"></i>
            </div>
          </div>
        </div>

        {/* Bộ lọc - cập nhật tên */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                Tìm kiếm bệnh nhân
              </label>
              <input
                type="text"
                placeholder="Nhập tên hoặc mã bệnh nhân..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chưa đến</option>
                <option value="completed">Đã đến</option>
                <option value="canceled">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danh sách */}
        <div className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <div className="bg-dark-card rounded-lg p-8 text-center border border-dark-border">
              <i className="fas fa-calendar-times text-4xl text-dark-textSecondary mb-4"></i>
              <p className="text-dark-textSecondary">Không có lịch hẹn nào</p>
            </div>
          ) : (
            filteredAppointments.map((appointment, index) => (
              <div
                key={appointment.ph_ma || index}
                onClick={() => handleAppointmentClick(appointment)}
                className="bg-dark-card rounded-lg p-4 border border-dark-border hover:bg-secondary-900 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-full mr-3 ${appointment.status === 'completed' ? 'bg-green-500' :
                        appointment.status === 'canceled' ? 'bg-red-500' :
                          'bg-orange-500'
                        }`}></div>
                      <h3 className={`text-lg font-medium ${appointment.status === 'canceled' ? 'line-through text-red-400' : 'text-dark-text'
                        }`}>
                        {appointment.patientName}
                      </h3>
                      {/* Cập nhật phần hiển thị status badge */}
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs ${appointment.status === 'completed'
                          ? 'bg-green-900 bg-opacity-20 text-green-400'
                          : appointment.status === 'canceled'
                            ? 'bg-red-900 bg-opacity-20 text-red-400'
                            : 'bg-orange-900 bg-opacity-20 text-orange-400'
                        }`}>
                        {appointment.status === 'completed' ? 'Đã đến' :
                          appointment.status === 'canceled' ? 'Đã hủy' :
                            'Chưa đến'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-dark-textSecondary">
                      <div>
                        <i className="fas fa-calendar mr-2"></i>
                        {formatDateSafe(appointment.ph_ngayhen)}
                      </div>
                      <div>
                        <i className="fas fa-clock mr-2"></i>
                        {appointment.ph_giohen || 'Chưa có'} - {appointment.ph_gioketthuc || 'Chưa có'}
                      </div>
                      <div>
                        <i className="fas fa-id-card mr-2"></i>
                        {appointment.bn_ma || 'Chưa có'}
                      </div>
                      {appointment.patientDetails && (
                        <div>
                          <i className="fas fa-phone mr-2"></i>
                          {appointment.patientDetails.bn_sdt || 'Chưa có'}
                        </div>
                      )}
                    </div>

                    {appointment.patientDetails && (
                      <div className="mt-2 text-sm text-dark-textSecondary">
                        <i className="fas fa-birthday-cake mr-2"></i>
                        Sinh: {formatDateSafe(appointment.patientDetails.bn_ngaysinh)}
                        <span className="ml-4">
                          <i className="fas fa-venus-mars mr-2"></i>
                          {appointment.patientDetails.bn_gioitinh || 'Chưa có'}
                        </span>
                        <span className="ml-4">
                          <i className="fas fa-info-circle mr-2"></i>
                          Trạng thái: {appointment.ph_trangthai}
                          {appointment.pk_ma && ' (Có phiếu khám)'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <i className="fas fa-chevron-right text-dark-textSecondary"></i>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto flex flex-col">
        <PageHeader title="Lịch Khám Của Tôi" breadcrumbs={["Lịch khám"]}>
          <button
            onClick={refreshCalendar}
            className="bg-primary hover:bg-primary-600 text-white rounded-md p-2 flex items-center"
          >
            <i className="fas fa-sync-alt mr-2"></i> Làm mới
          </button>
          {/* Thêm DatePicker để chọn ngày */}
          <div className="ml-4">
            <DatePicker
              selected={selectedDate}
              onChange={date => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy"
              className="appearance-none bg-secondary-800 border border-dark-border text-dark-text rounded-lg py-2 px-4 leading-tight focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer pr-8 min-w-[140px] text-center"
            />
          </div>
        </PageHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="text-dark-textSecondary ml-2">Đang tải lịch khám...</p>
          </div>
        ) : (
          <div className="flex-1 mt-6">
            {renderAppointmentsList()}
          </div>
        )}
      </div>

      <EventDetailModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
      />

      <ToastContainer theme="dark" />
    </div>
  );
};

export default Appointments;
