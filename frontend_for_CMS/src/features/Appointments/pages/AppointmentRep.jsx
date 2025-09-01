import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../../../layouts/Sidebar";
import api from "../../../service/apiService";
import BookAppointmentModal from "../../../components/BookAppointmentModal";
import EventDetailModal from '../../../components/AppointmentActionsModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../../assets/calendar-custom.css';
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';
import PageHeader from "../../../layouts/PageHeader";
import { jwtDecode } from "jwt-decode";
import AdminSidebar from "../../../layouts/AdminSidebar";
import DoctorSidebar from "../../../layouts/DoctorSidebar";
import PatientSidebar from "../../../layouts/PatientSidebar";
import { format, parseISO, isValid, addDays, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { WORKING_SHIFTS } from "../../../constants/workingShifts";

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';

const AppointmentRep = () => {
  // Core states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const calendarRef = useRef(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState({
    start: '',
    end: '',
    doctorId: null,
    doctorName: null
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [resources, setResources] = useState([]);
  const [role, setRole] = useState("");

  // List view states
  const [viewMode, setViewMode] = useState('calendar');
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [selectedDateForList, setSelectedDateForList] = useState(new Date());
  const [appointmentsByDate, setAppointmentsByDate] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState({});
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
  console.log('User data:', userData);
  // Utility functions
  const safeFormatDate = (dateString) => {
    try {
      if (!dateString) return 'Không có ngày';
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Ngày không hợp lệ';
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Lỗi định dạng ngày';
    }
  };

  const safeGet = (obj, path, defaultValue = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch (error) {
      console.error('Safe get error:', error);
      return defaultValue;
    }
  };

  // Group appointments by date
  const groupAppointmentsByDate = (events) => {
    try {
      const grouped = {};
      const dates = new Set();

      events.forEach(event => {
        const extendedProps = safeGet(event, 'extendedProps', {});
        const dateStr = safeGet(extendedProps, 'ph_ngayhen', '');

        if (dateStr) {
          dates.add(dateStr);
          if (!grouped[dateStr]) grouped[dateStr] = [];

          grouped[dateStr].push({
            ...extendedProps,
            patientName: safeGet(extendedProps, 'patientName', 'Không có tên'),
            status: safeGet(extendedProps, 'status', 'pending'),
            ph_ngayhen: dateStr,
            ph_giohen: safeGet(extendedProps, 'ph_giohen', ''),
            ph_gioketthuc: safeGet(extendedProps, 'ph_gioketthuc', ''),
            bn_ma: safeGet(extendedProps, 'bn_ma', ''),
            nv_ma: safeGet(extendedProps, 'nv_ma', ''),
            patientDetails: safeGet(extendedProps, 'patientDetails', null)
          });
        }
      });

      // Sort appointments by time
      Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => {
          if (!a.ph_giohen || !b.ph_giohen) return 0;
          return a.ph_giohen.localeCompare(b.ph_giohen);
        });
      });

      const sortedDates = Array.from(dates).sort();
      setAppointmentsByDate(grouped);
      setAvailableDates(sortedDates);

      // Set default date
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      if (sortedDates.includes(todayStr)) {
        // Chỉ set nếu ngày hiện tại khác ngày đang chọn
        if (format(selectedDateForList, 'yyyy-MM-dd') !== todayStr) {
          setSelectedDateForList(new Date());
        }
      } else if (sortedDates.length > 0) {
        if (format(selectedDateForList, 'yyyy-MM-dd') !== sortedDates[0]) {
          setSelectedDateForList(new Date(sortedDates[0]));
        }
      }
    } catch (error) {
      console.error('Group appointments error:', error);
      setAppointmentsByDate({});
      setAvailableDates([]);
    }
  };

  // API functions
  const fetchDoctors = async (specialtyId = 'all', date = new Date()) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      let endpoint = `/bacsi/getall?date=${formattedDate}`;
      if (specialtyId !== 'all') {
        endpoint += `&ck_ma=${specialtyId}`;
      }
      const response = await api.get(endpoint);
      const doctorsData = response.data.data || [];

      const doctorResources = doctorsData.map(doctor => ({
        id: doctor.nv_ma,
        title: 'BS. ' + doctor.nv_hoten,
        ck_ma: doctor.ck_ma
      }));

      setResources(doctorResources);
    } catch (err) {
      console.error("Lỗi khi tải danh sách bác sĩ:", err);
      toast.error("Không thể tải danh sách bác sĩ. Vui lòng thử lại sau!");
    }
  };

  const fetchDoctorSchedules = async (date) => {
    try {
      setIsLoadingSchedules(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await api.get(`/lichlv/date/${formattedDate}`);
      const scheduleData = response.data.data || [];

      const scheduleMap = {};
      scheduleData.forEach(schedule => {
        const doctorId = schedule.nv_ma;
        const shiftInfo = schedule.ca_lam_viec;
        if (!scheduleMap[doctorId]) {
          scheduleMap[doctorId] = [];
        }
        scheduleMap[doctorId].push({
          startTime: shiftInfo.clv_giobatdau,
          endTime: shiftInfo.clv_gioketthuc,
          shiftNumber: shiftInfo.clv_stt,
          shiftType: getShiftName(shiftInfo.clv_stt),
          roomId: schedule.phong_ma,
          date: schedule.nl_ngay,
          doctorName: schedule.bac_si?.bs_ten || 'N/A'
        });
      });

      setDoctorSchedules(scheduleMap);
    } catch (error) {
      setDoctorSchedules({});
      toast.error('Không thể tải lịch làm việc của bác sĩ!');
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  // Thêm function helper để chuyển đổi số ca thành tên ca (thêm sau fetchDoctorSchedules)
  const getShiftName = (shiftNumber) => {
    switch (shiftNumber) {
      case 1: return 'Ca Sáng';
      case 2: return 'Ca Chiều';
      case 3: return 'Ca Tối';
      default: return `Ca ${shiftNumber}`;
    }
  };

  // Thêm function isTimeSlotAvailable (thêm sau function getShiftName, dòng 250)
  const isTimeSlotAvailable = (doctorId, timeSlot, selectedDate) => {
    const schedules = doctorSchedules[doctorId] || [];
    if (schedules.length === 0) return false;
    let slotTime;
    try {
      if (timeSlot.includes(':')) {
        slotTime = timeSlot;
      } else {
        slotTime = format(new Date(`2000-01-01T${timeSlot}`), 'HH:mm');
      }
    } catch (error) {
      return false;
    }
    return schedules.some(schedule => {
      const startTime = schedule.startTime;
      const endTime = schedule.endTime;
      return slotTime >= startTime && slotTime <= endTime;
    });
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      const dateToUse = viewMode === 'calendar' ? selectedDate : selectedDateForList;
      const formattedDate = format(dateToUse, 'yyyy-MM-dd');
      let url = `/phieuhen/getall?date=${formattedDate}`;
      if (selectedSpecialty !== 'all') {
        url += `&ck_ma=${selectedSpecialty}`;
      }
      console.log('request URL:', url);

      console.log('Fetching events for date:', formattedDate);
      const response = await api.get(url);
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);

      // Fetch patient details
      const patientIds = [...new Set(data.map(appt => appt.bn_ma).filter(Boolean))];
      const patientDetailsMap = {};

      await Promise.allSettled(
        patientIds.map(async (patientId) => {
          try {
            const patientResponse = await api.get(`/benhnhan/getbyid/${patientId}`);
            if (patientResponse.data?.data) {
              patientDetailsMap[patientId] = patientResponse.data.data;
            }
          } catch (error) {
            console.error(`Không thể lấy thông tin bệnh nhân ${patientId}:`, error);
          }
        })
      );


      // Format events
      const formattedEvents = data.map(appt => {
        try {
          const { ph_ngayhen: dateStr, ph_giohen: startTime, ph_gioketthuc: endTime } = appt;

          if (!dateStr || !startTime || !endTime) return null;

          const patientDetails = patientDetailsMap[appt.bn_ma];
          const patientName = patientDetails ? patientDetails.bn_hoten : `BN#${(appt.bn_ma || '').substring(2)}`;

          const [eventColor, eventTextColor, eventBorderColor] = appt.pk_ma
            ? ['#2c4975', '#f7fafc', '#4299e1']
            : ['#183657', '#b3e0ff', '#1f94ca'];

          return {
            id: appt.ph_ma || `temp-${Math.random()}`,
            title: patientName,
            start: `${dateStr}T${startTime}:00`,
            end: `${dateStr}T${endTime}:00`,
            resourceId: appt.nv_ma,
            color: eventColor,
            textColor: eventTextColor,
            borderColor: eventBorderColor,
            extendedProps: {
              ...appt,
              patientDetails: patientDetails || null,
              patientName,
              status: appt.pk_ma ? 'completed' : appt.ph_trangthai === 'Đã hủy' ? 'canceled' : 'pending',
            }
          };
        } catch (error) {
          console.error('Error formatting appointment:', error);
          return null;
        }
      }).filter(Boolean);

      setEvents(formattedEvents);
      console.log('Events loaded:', formattedEvents.length);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
      toast.error('Không thể tải dữ liệu lịch. Vui lòng làm mới trang!');
    }
  };

  // Event handlers
  const handleSpecialtyChange = (e) => setSelectedSpecialty(e.target.value);

  const getDoctorNameById = (doctorId) => {
    if (!doctorId) return 'Không có bác sĩ';
    const doctor = resources.find(res => res.id === doctorId);
    return doctor ? doctor.title : `BS. ${doctorId}`;
  };

  const handleAppointmentClick = (appointment) => {
    try {
      const mockEvent = {
        id: appointment.ph_ma || '',
        extendedProps: appointment
      };
      setSelectedEvent(mockEvent);
      setIsEventModalOpen(true);
    } catch (error) {
      console.error('Appointment click error:', error);
      toast.error('Có lỗi khi mở chi tiết lịch hẹn');
    }
  };

  const handleDateChange = (date) => {
    try {
      console.log('Date changed to:', format(date, 'yyyy-MM-dd'));

      if (viewMode === 'calendar') {
        setSelectedDate(date);
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          calendarApi.gotoDate(date);
          // Force refresh calendar view
          setTimeout(() => {
            calendarApi.render();
          }, 100);
        }
      } else {
        setSelectedDateForList(date);
      }
    } catch (error) {
      console.error('Date change error:', error);
    }
  };

  const handleToday = () => {
    try {
      const today = new Date();
      console.log('Going to today:', format(today, 'yyyy-MM-dd'));

      if (viewMode === 'calendar') {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          calendarApi.today();
          // Force refresh calendar view
          setTimeout(() => {
            calendarApi.render();
          }, 100);
        }
        setSelectedDate(today);
      } else {
        setSelectedDateForList(today);
      }
    } catch (error) {
      console.error('Today button error:', error);
    }
  };

  const handlePreviousClick = () => {
    try {
      const currentDate = viewMode === 'calendar' ? selectedDate : selectedDateForList;
      const newDate = subDays(currentDate, 1);
      console.log('Going to previous day:', format(newDate, 'yyyy-MM-dd'));
      handleDateChange(newDate);
    } catch (error) {
      console.error('Previous click error:', error);
    }
  };

  const handleNextClick = () => {
    try {
      const currentDate = viewMode === 'calendar' ? selectedDate : selectedDateForList;
      const newDate = addDays(currentDate, 1);
      console.log('Going to next day:', format(newDate, 'yyyy-MM-dd'));
      handleDateChange(newDate);
    } catch (error) {
      console.error('Next click error:', error);
    }
  };

  const handleAddMedical = async (newMedical) => {
    try {
      const formattedData = {
        bn_ma: newMedical.bn_ma,
        nv_ma: newMedical.nv_ma,
        ph_ngayhen: newMedical.ph_ngayhen,
        ph_giohen: newMedical.ph_giohen,
        ph_gioketthuc: newMedical.ph_gioketthuc,
        trieu_chung: Array.isArray(newMedical.trieu_chung)
          ? newMedical.trieu_chung.map(tc => typeof tc === 'string' && !isNaN(tc) ? parseInt(tc) : tc)
          : []
      };

      const response = await api.post("/phieuhen/create", formattedData);

      if (response.data.success === false) {
        if (response.data.message === "Khung giờ đã được đặt, vui lòng chọn thời gian khác") {
          toast.warning('Đã có lịch khám vào ngày và giờ này! Vui lòng chọn thời gian khác.');
          return;
        }
        toast.error(response.data.message || 'Có lỗi xảy ra khi tạo lịch hẹn');
        return;
      }

      if (response.data.data) {
        setIsModalOpen(false);
        toast.success('Thêm phiếu khám thành công!', {
          autoClose: 200,
          onClose: () => setTimeout(() => window.location.reload(), 500)
        });
      }
    } catch (error) {
      console.error("Lỗi khi thêm phiếu khám:", error);

      if (error.response?.data) {
        const errorMessage = error.response.data.message;
        if (errorMessage === "Khung giờ đã được đặt, vui lòng chọn thời gian khác") {
          toast.warning('Đã có lịch khám vào ngày và giờ này! Vui lòng chọn thời gian khác.');
          return;
        }
        toast.error(errorMessage || `Lỗi ${error.response.status}: Không thể tạo lịch hẹn`);
      } else {
        toast.error('Có lỗi xảy ra khi thêm phiếu khám!');
      }
    }
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setIsEventModalOpen(true);
  };

  const handleSelect = (selectInfo) => {
    const { startStr: start, endStr: end } = selectInfo;
    const resourceId = selectInfo.resource?.id || null;
    const doctorName = selectInfo.resource?.title || null;

    // Luôn kiểm tra slot khả dụng cho mọi ngày
    if (resourceId) {
      const startTime = format(new Date(start), 'HH:mm');
      const endTime = format(new Date(end), 'HH:mm');
      const startDate = new Date(start);
      const endDate = new Date(end);
      let isValid = true;
      for (let time = new Date(startDate); time < endDate; time.setMinutes(time.getMinutes() + 15)) {
        const timeStr = format(time, 'HH:mm');
        if (!isTimeSlotAvailable(resourceId, timeStr, selectedDate)) {
          isValid = false;
          break;
        }
      }
      if (!isValid) {
        toast.warning('Không thể đặt lịch vào thời gian này. Bác sĩ không có ca làm việc!');
        return;
      }
    }
    setSelectedTimeSlot({ start, end, doctorId: resourceId, doctorName });
    setIsModalOpen(true);
  };

  // Render functions
  const renderSidebar = () => {
    switch (role) {
      case "bacsi": return <DoctorSidebar />;
      case "tieptan": return <Sidebar />;
      case "admin": return <AdminSidebar />;
      case "benhnhan": return <PatientSidebar />;
      default: return <Sidebar />;
    }
  };

  const renderAppointmentsList = () => {
    const selectedDateStr = format(selectedDateForList, 'yyyy-MM-dd');
    const dayAppointments = appointmentsByDate[selectedDateStr] || [];
    const totalAppointmentsForDay = dayAppointments.length;
    const completedForDay = dayAppointments.filter(apt => apt.status === 'completed').length;
    const pendingForDay = dayAppointments.filter(apt => apt.status === 'pending').length;

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <h3 className="text-lg font-medium text-dark-text flex items-center mb-4">
            <i className="fas fa-filter mr-2 text-primary-300"></i>
            Bộ lọc
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                Bác sĩ
              </label>
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
              >
                <option value="all">Tất cả bác sĩ</option>
                {resources.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Daily Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-textSecondary text-sm">Tổng lịch hẹn</p>
                <h3 className="text-2xl font-bold text-primary-300 mt-1">{totalAppointmentsForDay}</h3>
                <p className="text-xs text-dark-textSecondary mt-1">{safeFormatDate(selectedDateStr)}</p>
              </div>
              <i className="fas fa-calendar-alt text-primary-300"></i>
            </div>
          </div>
          <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-textSecondary text-sm">Chưa đến</p>
                <h3 className="text-2xl font-bold text-orange-400 mt-1">{pendingForDay}</h3>
                <p className="text-xs text-dark-textSecondary mt-1">
                  {filteredAppointments.filter(apt => apt.status === 'pending').length} (đã lọc)
                </p>
              </div>
              <i className="fas fa-clock text-orange-400"></i>
            </div>
          </div>
          <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-textSecondary text-sm">Đã đến</p>
                <h3 className="text-2xl font-bold text-green-400 mt-1">{completedForDay}</h3>
                <p className="text-xs text-dark-textSecondary mt-1">
                  {filteredAppointments.filter(apt => apt.status === 'completed').length} (đã lọc)
                </p>
              </div>
              <i className="fas fa-check-circle text-green-400"></i>
            </div>
          </div>
          <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-textSecondary text-sm">Bác sĩ trực</p>
                <h3 className="text-2xl font-bold text-blue-400 mt-1">
                  {new Set(dayAppointments.map(apt => apt.nv_ma)).size}
                </h3>
                <p className="text-xs text-dark-textSecondary mt-1">Có lịch hẹn</p>
              </div>
              <i className="fas fa-user-md text-blue-400"></i>
            </div>
          </div>
        </div>

        {/* Quick date navigation */}
        {availableDates.length > 1 && (
          <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-dark-text">
                Chuyển nhanh đến ngày khác
              </h4>
              <span className="text-xs text-dark-textSecondary">
                {availableDates.length} ngày có lịch hẹn
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableDates.slice(0, 7).map(dateStr => {
                const isSelected = dateStr === selectedDateStr;
                const appointmentCount = appointmentsByDate[dateStr]?.length || 0;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDateForList(new Date(dateStr))}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${isSelected
                      ? 'bg-primary text-white'
                      : 'bg-secondary-800 text-dark-textSecondary hover:bg-secondary-700 hover:text-dark-text'
                      }`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{safeFormatDate(dateStr)}</span>
                      <span className="text-xs opacity-75">{appointmentCount} lịch</span>
                    </div>
                  </button>
                );
              })}
              {availableDates.length > 7 && (
                <div className="flex items-center px-2 text-dark-textSecondary text-sm">
                  +{availableDates.length - 7} ngày khác
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointments List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-dark-text">
              Lịch hẹn ngày {safeFormatDate(selectedDateStr)}
            </h4>
            <span className="text-sm text-dark-textSecondary">
              {filteredAppointments.length} / {totalAppointmentsForDay} lịch hẹn
            </span>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="bg-dark-card rounded-lg p-8 text-center border border-dark-border">
              <i className="fas fa-calendar-times text-4xl text-dark-textSecondary mb-4"></i>
              <p className="text-dark-textSecondary">
                {totalAppointmentsForDay === 0
                  ? 'Không có lịch hẹn nào trong ngày này'
                  : 'Không có lịch hẹn nào phù hợp với bộ lọc'
                }
              </p>
            </div>
          ) : (
            filteredAppointments.map((appointment, index) => (
              <div
                key={`appointment-${index}-${appointment.ph_ma || index}`}
                className="bg-dark-card rounded-lg p-4 border border-dark-border hover:bg-secondary-900 transition-colors cursor-pointer"
                onClick={() => handleAppointmentClick(appointment)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-full mr-3 ${appointment.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'
                        }`}></div>
                      <h3 className="text-lg font-medium text-dark-text">
                        {appointment.patientName || 'Không có tên'}
                      </h3>
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs ${appointment.status === 'completed'
                        ? 'bg-green-900 bg-opacity-20 text-green-400'
                        : 'bg-orange-900 bg-opacity-20 text-orange-400'
                        }`}>
                        {appointment.status === 'completed' ? 'Đã đến' : 'Chưa đến'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-dark-textSecondary">
                      <div>
                        <i className="fas fa-clock mr-2"></i>
                        {appointment.ph_giohen || 'N/A'} - {appointment.ph_gioketthuc || 'N/A'}
                      </div>
                      <div>
                        <i className="fas fa-user-md mr-2"></i>
                        {getDoctorNameById(appointment.nv_ma)}
                      </div>
                      <div>
                        <i className="fas fa-id-card mr-2"></i>
                        {appointment.bn_ma || 'N/A'}
                      </div>
                      <div>
                        <i className="fas fa-hashtag mr-2"></i>
                        {appointment.ph_ma || 'N/A'}
                      </div>
                    </div>

                    {appointment.patientDetails && (
                      <div className="mt-2 text-sm text-dark-textSecondary">
                        <i className="fas fa-phone mr-2"></i>
                        {safeGet(appointment, 'patientDetails.bn_sdt', 'Chưa có')}
                        <span className="ml-4">
                          <i className="fas fa-birthday-cake mr-2"></i>
                          Sinh: {safeFormatDate(safeGet(appointment, 'patientDetails.bn_ngaysinh', ''))}
                        </span>
                        <span className="ml-4">
                          <i className="fas fa-venus-mars mr-2"></i>
                          {safeGet(appointment, 'patientDetails.bn_gioitinh', 'N/A')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <button className="p-2 text-primary-300 hover:text-primary-200">
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Effects
  useEffect(() => {
    const selectedDateStr = format(selectedDateForList, 'yyyy-MM-dd');
    let dayAppointments = appointmentsByDate[selectedDateStr] || [];

    // Apply filters
    if (searchTerm) {
      dayAppointments = dayAppointments.filter(apt => {
        const name = (apt.patientName || '').toLowerCase();
        const bnMa = (apt.bn_ma || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || bnMa.includes(search);
      });
    }

    if (statusFilter !== 'all') {
      dayAppointments = dayAppointments.filter(apt => apt.status === statusFilter);
    }

    if (doctorFilter !== 'all') {
      dayAppointments = dayAppointments.filter(apt => apt.nv_ma === doctorFilter);
    }

    setFilteredAppointments(dayAppointments);
  }, [appointmentsByDate, selectedDateForList, searchTerm, statusFilter, doctorFilter]);

  useEffect(() => {
    if (events.length > 0) {
      groupAppointmentsByDate(events);
    }
  }, [events]);

  useEffect(() => {
    fetchEvents();
  }, [selectedDate, selectedDateForList, selectedSpecialty, viewMode]);

  useEffect(() => {
    fetchDoctors(selectedSpecialty, selectedDate);
  }, [selectedSpecialty, selectedDate, selectedDateForList, viewMode]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const decoded = jwtDecode(token);
      setRole(decoded.role);
    }

    const fetchInitialData = async () => {
      try {
        const specialtiesResponse = await api.get("/chuyenkhoa/getall");
        const allSpecialties = [
          { ck_ma: 'all', ck_ten: 'Tất cả chuyên khoa' },
          ...(specialtiesResponse.data.data || [])
        ];
        setSpecialties(allSpecialties);
        fetchDoctors('all', new Date()); // truyền ngày hôm nay
      } catch (err) {
        console.error("Lỗi khi khởi tạo dữ liệu:", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const dateToUse = viewMode === 'calendar' ? selectedDate : selectedDateForList;
    fetchDoctorSchedules(dateToUse);
  }, [selectedDate, selectedDateForList, viewMode]);

  useEffect(() => {
    const additionalStyles = `
      /* Slot không khả dụng - màu đỏ đậm hơn */
      .unavailable-slot {
        background: linear-gradient(
          135deg,
          rgba(220, 38, 38, 0.2) 0%,
          rgba(239, 68, 68, 0.15) 50%,
          rgba(220, 38, 38, 0.2) 100%
        ) !important;
        position: relative;
        pointer-events: none !important;
        border-left: 4px solid #dc2626 !important;
      }
      
      .unavailable-slot::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 3px,
          rgba(220, 38, 38, 0.3) 3px,
          rgba(220, 38, 38, 0.3) 6px
        );
        pointer-events: none;
        z-index: 1;
      }
      
      .unavailable-slot::after {
        content: '🚫';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
        z-index: 2;
        opacity: 0.7;
      }
      
      /* Slot khả dụng - màu xanh tươi */
      .available-slot {
        background: linear-gradient(
          135deg,
          rgba(34, 197, 94, 0.15) 0%,
          rgba(16, 185, 129, 0.1) 50%,
          rgba(34, 197, 94, 0.15) 100%
        ) !important;
        border-left: 4px solid #22c55e !important;
        position: relative;
      }
      
      .available-slot::after {
        content: '✅';
        position: absolute;
        top: 2px;
        right: 2px;
        font-size: 10px;
        z-index: 2;
        opacity: 0.6;
      }
      
      .available-slot:hover {
        background: linear-gradient(
          135deg,
          rgba(34, 197, 94, 0.25) 0%,
          rgba(16, 185, 129, 0.2) 50%,
          rgba(34, 197, 94, 0.25) 100%
        ) !important;
        cursor: pointer !important;
      }
      
      /* Style cho FullCalendar slots */
      .fc-timegrid-slot {
        border-bottom: 1px solid #374151 !important;
        transition: all 0.3s ease;
      }
      
      .fc-resource-cell {
        border-right: 1px solid #374151 !important;
        background-color: #1f2937 !important;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);

    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  useEffect(() => {
    console.log('Doctor schedules updated:', doctorSchedules);
    console.log('Number of doctors with schedules:', Object.keys(doctorSchedules).length);
  }, [doctorSchedules]);

  // Thêm useEffect này vào bên trong AppointmentRep, ngay sau các useEffect khác
  useEffect(() => {
    const dateToUse = viewMode === 'calendar' ? selectedDate : selectedDateForList;

    fetchDoctorSchedules(dateToUse);

  }, [selectedDate, selectedDateForList, viewMode]);






  return (
    <div className="flex h-screen bg-dark-bg">
      {renderSidebar()}
      <div className="flex-1 p-6 overflow-auto flex flex-col">
        <PageHeader title="Quản Lý Lịch Hẹn" breadcrumbs={["Quản Lý Lịch Hẹn"]}>
          {/* View Mode Toggle */}
          <div className="flex bg-secondary-800 rounded-lg p-1 border border-dark-border">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${viewMode === 'calendar'
                ? 'bg-primary text-white'
                : 'text-dark-textSecondary hover:text-dark-text'
                }`}
            >
              <i className="fas fa-calendar-alt mr-2"></i>Lịch
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${viewMode === 'list'
                ? 'bg-primary text-white'
                : 'text-dark-textSecondary hover:text-dark-text'
                }`}
            >
              <i className="fas fa-list mr-2"></i>Theo ngày
            </button>
          </div>

          {/* Date Controls */}
          <button
            onClick={handlePreviousClick}
            className="p-2 rounded-md hover:bg-secondary-700 text-dark-text border border-dark-border"
            title="Ngày trước"
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          <div className="relative">
            <DatePicker
              selected={viewMode === 'calendar' ? selectedDate : selectedDateForList}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy"
              className="appearance-none bg-secondary-800 border border-dark-border text-dark-text rounded-lg py-2 px-4 leading-tight focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer pr-8 min-w-[140px] text-center"
              onKeyDown={e => e.preventDefault()}
            />
            <i className="fas fa-calendar-alt absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary pointer-events-none"></i>
          </div>

          <button
            onClick={handleNextClick}
            className="p-2 rounded-md hover:bg-secondary-700 text-dark-text border border-dark-border"
            title="Ngày sau"
          >
            <i className="fas fa-chevron-right"></i>
          </button>

          <button
            onClick={handleToday}
            className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
            title="Về hôm nay"
          >
            Hôm nay
          </button>

          {/* Specialty Filter */}
          <div className="relative">
            <select
              value={selectedSpecialty}
              onChange={handleSpecialtyChange}
              className="appearance-none bg-dark-card border border-dark-border text-dark-text rounded-lg py-2 px-4 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {specialties.map(specialty => (
                <option key={specialty.ck_ma} value={specialty.ck_ma}>
                  {specialty.ck_ten}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-dark-textSecondary">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </PageHeader>

        {/* Main Content */}
        {viewMode === 'calendar' ? (
          <>


            {isLoadingSchedules && (
              <div className="bg-dark-card border border-dark-border rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2 text-primary"></i>
                  <span className="text-dark-text">Đang tải lịch làm việc của bác sĩ...</span>
                </div>
              </div>
            )}

            <div className="calendar-container bg-dark-card border border-dark-border shadow-md rounded-lg mb-5">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, resourceTimeGridPlugin]}
                initialView="resourceTimeGridDay"
                initialDate={selectedDate}
                headerToolbar={false}
                resources={resources}
                events={events}
                eventClick={handleEventClick}
                height="auto"
                slotMinTime="07:30:00"
                slotMaxTime="22:00:00"
                allDaySlot={false}
                locale="en"
                slotLabelFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
                nowIndicator={true}
                editable={true}
                selectable={true}
                select={handleSelect}
                dayMaxEvents={true}
                selectMinDistance={5}
                snapDuration="00:15:00"

                // Tùy chỉnh slot classes cho ngày tương lai
                slotLaneClassNames={(slotInfo) => {
                  const slotTime = format(slotInfo.date, 'HH:mm');
                  const resourceId = slotInfo.resource?.id;
                  if (!resourceId) return [];
                  const isAvailable = isTimeSlotAvailable(resourceId, slotTime, selectedDate);
                  if (!isAvailable) {
                    return ['unavailable-slot'];
                  } else {
                    return ['available-slot'];
                  }
                }}

                // Prevent selection on unavailable slots for future dates
                selectAllow={(selectInfo) => {
                  const resourceId = selectInfo.resource?.id;
                  if (!resourceId) return false;

                  const start = new Date(selectInfo.start);
                  const end = new Date(selectInfo.end);
                  const now = new Date();

                  // Không cho đặt lịch nếu thời gian bắt đầu < thời gian hiện tại (ngày hoặc giờ đều bị chặn)
                  if (start < now) {
                    return false;
                  }

                  // Kiểm tra slot khả dụng
                  for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + 15)) {
                    const timeStr = format(time, 'HH:mm');
                    if (!isTimeSlotAvailable(resourceId, timeStr, selectedDate)) {
                      return false;
                    }
                  }
                  return true;
                }}

                eventContent={(eventInfo) => {
                  try {
                    const patientDetails = safeGet(eventInfo, 'event.extendedProps.patientDetails');
                    const patientName = patientDetails ?
                      safeGet(patientDetails, 'bn_hoten', 'Không có tên') :
                      `BN#${(safeGet(eventInfo, 'event.extendedProps.bn_ma', '') || '').substring(2)}`;

                    const status = safeGet(eventInfo, 'event.extendedProps.status', 'pending');
                    const isCompleted = status === 'completed';
                    const isCanceled = status === 'canceled';

                    const start = new Date(eventInfo.event.start);
                    const end = new Date(eventInfo.event.end);
                    const durationMinutes = (end - start) / (1000 * 60);

                    let borderClass = 'border-primary-400';
                    if (isCompleted) borderClass = 'border-green-500';
                    else if (isCanceled) borderClass = 'border-red-500';

                    return (
                      <div className={`p-1 h-full w-full overflow-hidden rounded-xl border-l-4 ${borderClass} ${isCanceled ? 'opacity-60' : ''}`}>
                        <div className={`font-medium text-xs truncate ${isCanceled ? 'line-through text-red-400' : 'text-dark-text'}`} title={patientName}>
                          {patientName}
                        </div>

                        {durationMinutes >= 30 && (
                          <div className="flex justify-between items-center mt-1">
                            <div className={`text-xs truncate max-w-[60%] ${isCanceled ? 'text-red-400' : 'text-dark-textSecondary'}`}>
                              {eventInfo.timeText}
                            </div>

                            {isCompleted ? (
                              <span className="text-xs bg-green-900 text-green-300 px-1 py-0.5 rounded-sm font-medium whitespace-nowrap shrink-0">
                                Đã đến
                              </span>
                            ) : isCanceled ? (
                              <span className="text-xs bg-red-900 text-red-300 px-1 py-0.5 rounded-sm font-medium whitespace-nowrap shrink-0">
                                Đã hủy
                              </span>
                            ) : (
                              <span className="text-xs bg-secondary-800 text-secondary-300 px-1 py-0.5 rounded-sm font-medium whitespace-nowrap shrink-0">
                                Chưa đến
                              </span>
                            )}
                          </div>
                        )}

                        {durationMinutes < 30 && isCanceled && (
                          <div className="flex justify-end mt-1">
                            <i className="fas fa-times-circle text-red-400 text-xs"></i>
                          </div>
                        )}
                      </div>
                    );
                  } catch (error) {
                    console.error('Event content error:', error);
                    return <div className="p-1 text-xs">Lỗi hiển thị</div>;
                  }
                }}

                resourceLabelContent={(arg) => {
                  const doctorId = arg.resource.id;
                  const schedules = doctorSchedules[doctorId] || [];
                  // Lấy các khung giờ làm việc, ví dụ: "07:00-11:00", "13:00-17:00"
                  const workingTimes = schedules
                    .map(sch => `${sch.startTime} - ${sch.endTime}`)
                    .join(', ');

                  return (
                    <div style={{
                      color: '#66b7d7',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '2px',
                      padding: '8px 4px',
                      minHeight: '60px',
                      textAlign: 'left'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-user-md text-blue-400"></i>
                        <span>{arg.resource.title}</span>
                      </div>
                      {workingTimes && (
                        <span style={{ color: '#a7f3d0', fontSize: '12px', fontWeight: 400 }}>
                          🕒 {workingTimes}
                        </span>
                      )}
                    </div>
                  );
                }}
              />
            </div>

            {/* Legend cập nhật */}
            <div className="bg-dark-card rounded-lg shadow-md p-4 mb-5 border border-dark-border">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h3 className="font-medium text-dark-text mb-2 flex items-center">
                    <i className="fas fa-info-circle mr-2 text-primary"></i> Hướng dẫn
                  </h3>
                  <div className="flex flex-col gap-2 text-sm text-dark-textSecondary">
                    <p className="flex items-center">
                      <i className="fas fa-mouse-pointer mr-2"></i>
                      Click và kéo chuột trên vùng khả dụng để đặt lịch hẹn mới
                    </p>
                    <p className="flex items-center">
                      <i className="fas fa-calendar-check mr-2"></i>
                      Click vào sự kiện đã có để xem chi tiết và xử lý
                    </p>

                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-dark-text mb-2 flex items-center">
                    <i className="fas fa-palette mr-2 text-primary"></i> Chú thích
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-[#183657] rounded-sm mr-2 border border-primary-400"></div>
                        <span className="text-sm text-dark-textSecondary">Đã đặt lịch</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-[#2c4975] rounded-sm mr-2 border border-blue-400"></div>
                        <span className="text-sm text-dark-textSecondary">Đang khám</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <i className="fas fa-circle text-green-400 mr-2"></i>
                        <span className="text-sm text-dark-textSecondary">Có ca làm việc</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-circle text-red-400 mr-2"></i>
                        <span className="text-sm text-dark-textSecondary">Không có ca làm việc</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          renderAppointmentsList()
        )}
      </div>

      {/* Modals */}
      <BookAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddMedical}
        selectedTimeSlot={selectedTimeSlot}
      />

      <EventDetailModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
        resources={resources}
        userRole={userData.role}
      />

      <ToastContainer theme="dark" />

      {/* Floating Add Button */}
      <div className="absolute bottom-6 right-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
        >
          <i className="fas fa-plus text-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default AppointmentRep;
