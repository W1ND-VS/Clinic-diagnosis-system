import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import AdminSidebar from '../../../layouts/AdminSidebar';
import PageHeader from '../../../layouts/PageHeader';
import api from '../../../service/apiService';
import { WORKING_SHIFTS } from '../../../constants/workingShifts';
import DoctorScheduleListModal from '../components/DoctorScheduleListModal';

const WorkingScheduleAdmin = () => {
    // State hiện tại
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);

    // Filter states
    const [specialties, setSpecialties] = useState([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    // State để kiểm soát việc hiển thị lịch
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduleError, setScheduleError] = useState('');

    // Calculate the week days
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // New shift initial state
    const [newShift, setNewShift] = useState({
        doctorId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        shift: '1',
        status: 'scheduled',
        phong_ma: 'P01'
    });

    // Cập nhật phần useEffect cho phần kiểm tra xác thực và tải dữ liệu ban đầu
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                await fetchSpecialties();
                await fetchDoctors();
                setLoading(false);
            } catch (error) {
                console.error('Error fetching initial data:', error);
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch chuyên khoa
    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/chuyenkhoa/getall');
            if (response.data && response.data.data) {
                setSpecialties([{ ck_ma: '', ck_ten: '-- Chọn chuyên khoa --' }, ...response.data.data]);
            }
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    // Fetch phòng khám theo chuyên khoa
    const fetchRooms = async (specialtyId) => {
        if (!specialtyId) {
            setRooms([{ phong_ma: '', phong_ten: '-- Chọn phòng --' }]);
            return;
        }

        try {
            setLoadingRooms(true);

            // Lấy phòng theo chuyên khoa
            const response = await api.get(`/chuyenkhoa/${specialtyId}/rooms/codes`);
            if (response.data && response.data.success) {
                const roomCodes = response.data.data.room_codes || [];

                if (roomCodes.length > 0) {
                    const formattedRooms = [
                        { phong_ma: '', phong_ten: '-- Chọn phòng --' },
                        ...roomCodes.map(code => ({
                            phong_ma: code,
                            phong_ten: `Phòng ${code}`
                        }))
                    ];
                    setRooms(formattedRooms);
                } else {
                    setRooms([{ phong_ma: '', phong_ten: 'Không có phòng' }]);
                }
            } else {
                setRooms([{ phong_ma: '', phong_ten: 'Không có phòng' }]);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
            setRooms([{ phong_ma: '', phong_ten: 'Không có phòng' }]);
        } finally {
            setLoadingRooms(false);
        }
    };

    // Fetch bác sĩ (có thể lọc theo chuyên khoa)
    const fetchDoctors = async () => {
        try {
            const response = await api.get('/bacsi');
            if (response.data && response.data.data) {
                const doctorsData = Array.isArray(response.data.data)
                    ? response.data.data
                    : [response.data.data];

                setDoctors(doctorsData);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setDoctors([]);
        }
    };

    // Fetch lịch làm việc khi người dùng nhấn nút Xem lịch
    const handleViewSchedule = async (roomValue = null) => {
        const roomToUse = roomValue || selectedRoom;

        // Kiểm tra xem đã chọn đầy đủ thông tin chưa
        if (!selectedSpecialty) {
            setScheduleError('Vui lòng chọn chuyên khoa');
            setShowSchedule(false);
            return;
        }

        if (!roomToUse) {
            setScheduleError('Vui lòng chọn phòng');
            setShowSchedule(false);
            return;
        }

        setScheduleError('');

        try {
            setLoadingSchedule(true);
            const startDate = format(weekStart, 'yyyy-MM-dd');
            const endDate = format(weekEnd, 'yyyy-MM-dd');

            // Sử dụng API lấy lịch theo phòng
            const response = await api.get(`/lichlv/room/${roomToUse.toLowerCase()}/date-range?start_date=${startDate}&end_date=${endDate}`);

            // Xử lý dữ liệu và cập nhật state
            const rawData = response.data.data || [];

            // Lấy thông tin bổ sung về bác sĩ
            const scheduleData = await Promise.all(rawData.map(async (schedule) => {
                let doctorInfo = {};

                try {
                    // Lấy thông tin bác sĩ
                    const doctorResponse = await api.get(`/bacsi/${schedule.nv_ma}`);
                    if (doctorResponse.data && doctorResponse.data.data) {
                        doctorInfo = doctorResponse.data.data;
                    }
                } catch (error) {
                    console.error(`Error fetching doctor info for ${schedule.nv_ma}:`, error);
                }

                // Trả về đối tượng với đầy đủ thông tin
                return {
                    nlv_ma: `${schedule.phong_ma}_${schedule.nl_ngay}_${schedule.clv_stt}_${schedule.nv_ma}`, // Tạo ID duy nhất
                    nl_ngay: schedule.nl_ngay,
                    clv_stt: schedule.clv_stt,
                    nv_ma: schedule.nv_ma,
                    phong_ma: schedule.phong_ma,
                    bs_hoten: doctorInfo.bs_hoten || doctorInfo.nv_hoten || 'Bác sĩ',
                    ck_ten: doctorInfo.ck_ten || 'Chuyên khoa'
                };
            }));

            setSchedules(scheduleData);
            setShowSchedule(true);
        } catch (error) {
            console.error('Error fetching schedules:', error);
            setSchedules([]);
            setScheduleError('Không thể tải lịch làm việc. Vui lòng thử lại!');
        } finally {
            setLoadingSchedule(false);
        }
    };

    // Update danh sách phòng khi chuyên khoa thay đổi
    const handleSpecialtyChange = (e) => {
        const value = e.target.value;
        setSelectedSpecialty(value);
        setSelectedRoom(''); // Reset phòng
        setShowSchedule(false); // Ẩn lịch làm việc
        fetchRooms(value);
    };

    // Update phòng khi người dùng chọn
    const handleRoomChange = (e) => {
        const value = e.target.value;
        setSelectedRoom(value);

        // Tự động tải lịch làm việc khi phòng được chọn
        if (value) {
            handleViewSchedule(value);
        } else {
            setShowSchedule(false); // Ẩn lịch làm việc nếu không có phòng được chọn
        }
    };

    // Navigation functions
    const previousWeek = () => {
        setCurrentDate(prevDate => addDays(prevDate, -7));
        // Nếu đã chọn phòng, tự động cập nhật lịch làm việc
        if (selectedRoom) {
            handleViewSchedule();
        } else {
            setShowSchedule(false);
        }
    };

    const nextWeek = () => {
        setCurrentDate(prevDate => addDays(prevDate, 7));
        // Nếu đã chọn phòng, tự động cập nhật lịch làm việc
        if (selectedRoom) {
            handleViewSchedule();
        } else {
            setShowSchedule(false);
        }
    };

    const goToCurrentWeek = () => {
        setCurrentDate(new Date());
        // Nếu đã chọn phòng, tự động cập nhật lịch làm việc
        if (selectedRoom) {
            handleViewSchedule();
        } else {
            setShowSchedule(false);
        }
    };

    // Handlers
    const handleAddShift = async (shiftData) => {
        try {
            const formattedData = {
                nv_ma: shiftData.doctorId,
                nl_ngay: shiftData.date,
                clv_stt: parseInt(shiftData.shift),
                phong_ma: shiftData.phong_ma
            };

            const response = await api.post("/lichlamviec", formattedData);

            if (response.data && response.data.success) {
                fetchSchedules();
                setShowAddModal(false);
                setNewShift({
                    doctorId: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    shift: '1',
                    phong_ma: 'P01'
                });
            }
        } catch (error) {
            console.error('Error adding shift:', error);
            alert('Không thể thêm ca làm việc. Vui lòng thử lại.');
        }
    };

    const handleDeleteShift = async (scheduleId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa ca làm việc này?')) {
            return;
        }

        try {
            // Nếu là ID tổng hợp từ API mới
            if (typeof scheduleId === 'string' && scheduleId.includes('_')) {
                const [phong_ma, nl_ngay, clv_stt, nv_ma] = scheduleId.split('_');
                await api.delete(`/lichlamviec/custom?phong_ma=${phong_ma}&nl_ngay=${nl_ngay}&clv_stt=${clv_stt}&nv_ma=${nv_ma}`);
            } else {
                // ID thông thường từ API cũ
                await api.delete(`/lichlamviec/${scheduleId}`);
            }
            fetchSchedules();
        } catch (error) {
            console.error('Error deleting shift:', error);
            alert('Không thể xóa ca làm việc. Vui lòng thử lại.');
        }
    };

    // Get schedules for a day and shift
    const getSchedulesForDayAndShift = (day, shiftId) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return schedules.filter(schedule =>
            schedule.nl_ngay === dateStr &&
            schedule.clv_stt.toString() === shiftId
        );
    };

    // Thêm hàm xử lý khi người dùng nhấp vào ô trống
    const handleClickEmptyCell = (day, shiftId) => {
        // Cập nhật thông tin ca mới dựa trên ô được chọn
        setNewShift({
            doctorId: '',
            date: format(day, 'yyyy-MM-dd'),
            shift: shiftId,
            status: 'scheduled',
            phong_ma: selectedRoom
        });

        // Hiển thị modal đăng ký ca làm việc
        setShowAddModal(true);
    };

    // State cho modal
    const [showDoctorListModal, setShowDoctorListModal] = useState(false);
    const [filterParams, setFilterParams] = useState({
        specialty: '',
        date: null,
        shift: null
    });

    // Hàm hiển thị modal
    const handleViewDoctorsForCell = (day, shiftId) => {
        setFilterParams({
            specialty: selectedSpecialty,
            date: format(day, 'yyyy-MM-dd'),
            shift: shiftId
        });
        setShowDoctorListModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-dark-bg">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-3"></div>
                    <p className="text-dark-textSecondary">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-dark-bg overflow-hidden">
            <AdminSidebar />
            <div className="flex-1 overflow-auto">
                <div className="p-4 md:p-6">
                    <PageHeader
                        title="Quản Lý Lịch Làm Việc"
                        breadcrumbs={["Admin", "Quản lý lịch làm việc"]}
                    >
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 flex items-center"
                        >
                            <i className="fas fa-plus mr-2"></i> Thêm ca làm việc
                        </button>
                    </PageHeader>

                    <p className="text-dark-textSecondary mb-4">
                        Quản lý và xem lịch làm việc của các bác sĩ theo phòng khám
                    </p>

                    {/* Bộ lọc - đã loại bỏ nút "Xem lịch" */}
                    <div className="bg-dark-card rounded-lg shadow p-4 mb-6 border border-dark-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-text mb-1">Chuyên khoa <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                                    value={selectedSpecialty}
                                    onChange={handleSpecialtyChange}
                                    required
                                >
                                    {specialties.map(specialty => (
                                        <option key={specialty.ck_ma} value={specialty.ck_ma}>
                                            {specialty.ck_ten}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-text mb-1">
                                    Phòng khám <span className="text-red-500">*</span>
                                    {loadingRooms && <span className="ml-2 text-dark-textSecondary text-xs"><i className="fas fa-spinner fa-spin"></i> Đang tải...</span>}
                                </label>
                                <select
                                    className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                                    value={selectedRoom}
                                    onChange={handleRoomChange}
                                    disabled={loadingRooms || !selectedSpecialty}
                                    required
                                >
                                    {loadingRooms ? (
                                        <option value="">Đang tải phòng...</option>
                                    ) : (
                                        rooms.map(room => (
                                            <option key={room.phong_ma} value={room.phong_ma}>
                                                {room.phong_ten}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        {loadingSchedule && (
                            <div className="mt-3 text-primary-300 text-sm flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-300 mr-2"></div>
                                Đang tải lịch làm việc...
                            </div>
                        )}

                        {scheduleError && (
                            <div className="mt-3 text-red-400 text-sm">
                                <i className="fas fa-exclamation-circle mr-2"></i>
                                {scheduleError}
                            </div>
                        )}
                    </div>

                    {/* Chỉ hiển thị phần điều hướng và bảng lịch nếu đã nhấn nút Xem lịch */}
                    {showSchedule && (
                        <>
                            {/* Điều hướng tuần */}
                            <div className="mb-6 flex flex-wrap justify-between items-center gap-2 sm:gap-4">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        onClick={previousWeek}
                                        className="p-1 sm:p-2 bg-dark-card border border-dark-border rounded-md hover:bg-secondary-800"
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>

                                    <button
                                        onClick={goToCurrentWeek}
                                        className="p-1 sm:p-2 text-sm sm:text-base bg-primary-900 bg-opacity-20 text-primary-300 border border-primary-700 rounded-md hover:bg-primary-900 hover:bg-opacity-30"
                                    >
                                        Tuần này
                                    </button>

                                    <button
                                        onClick={nextWeek}
                                        className="p-1 sm:p-2 bg-dark-card border border-dark-border rounded-md hover:bg-secondary-800"
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>

                                    <span className="ml-1 sm:ml-3 text-sm sm:text-lg font-medium text-dark-text">
                                        {format(weekStart, "'Tuần từ' dd/MM", { locale: vi })} -
                                        {format(weekEnd, " dd/MM/yyyy", { locale: vi })}
                                    </span>
                                </div>
                            </div>

                            {/* Bảng lịch */}
                            <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border overflow-hidden">
                                <div className="grid grid-cols-7 bg-secondary-800 border-b border-dark-border">
                                    {weekDays.map((day, i) => (
                                        <div
                                            key={i}
                                            className={`p-3 text-center border-r last:border-r-0 ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                                ? 'bg-primary-900 bg-opacity-20 text-primary-300'
                                                : ''
                                                }`}
                                        >
                                            <div className="font-medium text-dark-text">{format(day, 'EEEE', { locale: vi })}</div>
                                            <div className="text-lg text-dark-text">{format(day, 'dd/MM')}</div>
                                        </div>
                                    ))}
                                </div>

                                {WORKING_SHIFTS.map(shift => (
                                    <div key={shift.id} className="grid grid-cols-7">
                                        {/* Shift header */}
                                        <div className="col-span-7 bg-secondary-800 px-4 py-2 border-b border-t border-dark-border">
                                            <div className="flex items-center">
                                                <span className="font-medium text-dark-text">{shift.name}</span>
                                                <span className="text-dark-textSecondary text-sm ml-2">{shift.time}</span>
                                            </div>
                                        </div>

                                        {/* Shift cells for each day */}
                                        {weekDays.map((day, dayIndex) => {
                                            const daySchedules = getSchedulesForDayAndShift(day, shift.id);

                                            // Nhóm lịch làm việc theo phòng
                                            const roomsWithDoctors = {};
                                            daySchedules.forEach(schedule => {
                                                if (!roomsWithDoctors[schedule.phong_ma]) {
                                                    roomsWithDoctors[schedule.phong_ma] = [];
                                                }
                                                roomsWithDoctors[schedule.phong_ma].push(schedule);
                                            });

                                            return (
                                                <div
                                                    key={dayIndex}
                                                    className="border-b border-r border-dark-border p-2 min-h-[120px] relative"
                                                >
                                                    {Object.keys(roomsWithDoctors).length > 0 ? (
                                                        <div className="space-y-2">
                                                            {Object.entries(roomsWithDoctors).map(([room, doctorSchedules], roomIdx) => (
                                                                <div
                                                                    key={roomIdx}
                                                                    className="bg-secondary-900 rounded-md p-2 cursor-pointer hover:bg-secondary-800 transition-colors"
                                                                    onClick={() => handleViewDoctorsForCell(day, shift.id)}
                                                                    title="Nhấp để xem danh sách bác sĩ"
                                                                >
                                                                    <div className="font-medium text-primary-300 text-sm flex items-center justify-between mb-1">
                                                                        <span>
                                                                            <i className="fas fa-door-open mr-1"></i> {room}
                                                                        </span>

                                                                        <span className="text-primary-300 text-xs flex items-center">
                                                                            <i className="fas fa-user-md mr-1"></i>
                                                                            <span>{doctorSchedules.length}</span>
                                                                        </span>
                                                                    </div>

                                                                    {/* Phần hiển thị các bác sĩ không thay đổi, nhưng cần ngăn sự kiện bubbling */}
                                                                    <div onClick={(e) => e.stopPropagation()}>
                                                                        {doctorSchedules.map((schedule, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="bg-primary-900 bg-opacity-20 border border-primary-700 rounded p-2 text-sm mb-1 last:mb-0"
                                                                            >
                                                                                <div className="font-medium text-dark-text flex items-center">
                                                                                    <i className="fas fa-user-md mr-1 text-primary-300"></i>
                                                                                    {schedule.bs_hoten || schedule.nv_hoten || (
                                                                                        <span>
                                                                                            Mã BS: <span className="text-primary-300">{schedule.nv_ma}</span>
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {schedule.ck_ten && (
                                                                                    <div className="text-dark-textSecondary text-xs mt-1">
                                                                                        {schedule.ck_ten}
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex justify-end mt-1">
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleDeleteShift(schedule.nlv_ma);
                                                                                        }}
                                                                                        className="text-red-400 hover:text-red-300 text-xs"
                                                                                        title="Xóa ca làm việc"
                                                                                    >
                                                                                        <i className="fas fa-trash"></i>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div
                                                            onClick={() => handleViewDoctorsForCell(day, shift.id)}
                                                            className="h-full flex items-center justify-center text-dark-textSecondary hover:bg-secondary-800 cursor-pointer transition-colors duration-200 group"
                                                            title="Nhấp để thêm ca làm việc"
                                                        >
                                                            <div className="text-center">
                                                                <i className="fas fa-calendar-plus mb-1 group-hover:text-primary-300"></i>
                                                                <div className="text-sm">Thêm ca làm việc</div>
                                                                <div className="text-xs opacity-0 group-hover:opacity-100 text-primary-300 transition-opacity duration-200">
                                                                    Nhấp để thêm
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Hiển thị thông báo khi chưa chọn filter */}
                    {!showSchedule && !scheduleError && !loadingSchedule && (
                        <div className="bg-dark-card rounded-lg p-10 text-center">
                            <div className="text-6xl text-dark-textSecondary mb-4">
                                <i className="fas fa-calendar-alt"></i>
                            </div>
                            <h3 className="text-xl text-dark-text font-medium mb-2">Chọn chuyên khoa và phòng để xem lịch làm việc</h3>
                            <p className="text-dark-textSecondary">
                                Vui lòng chọn chuyên khoa và phòng khám, sau đó nhấn "Xem lịch" để hiển thị lịch làm việc
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal hiển thị danh sách bác sĩ */}
            <DoctorScheduleListModal
                isOpen={showDoctorListModal}
                onClose={() => setShowDoctorListModal(false)}
                specialty={filterParams.specialty}
                date={filterParams.date}
                shift={filterParams.shift}
                onSelect={(selectedDoctor) => {
                    // Cập nhật lại lịch làm việc khi chỉ định bác sĩ thành công
                    handleViewSchedule(selectedRoom);
                    // Thông báo thành công (toast notification đã được xử lý trong modal)
                }}
                room={selectedRoom} // Thêm thông tin phòng để modal có thể sử dụng cho API
            />
        </div>
    );
};

export default WorkingScheduleAdmin;