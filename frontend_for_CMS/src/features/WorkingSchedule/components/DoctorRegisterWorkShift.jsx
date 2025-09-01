import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, addDays, eachDayOfInterval, isBefore, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { WORKING_SHIFTS } from '../../../constants/workingShifts';
import api from '../../../service/apiService';
import { toast } from 'react-toastify';

const RegisterWorkShiftDoctor = ({
    isOpen,
    onClose,
    currentUser,
    initialShift
}) => {
    const [newShift, setNewShift] = useState(initialShift);
    const [currentModalDate, setCurrentModalDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [bookedSchedules, setBookedSchedules] = useState([]); // Lưu trữ lịch làm việc đã đăng ký

    // Reset form khi initialShift thay đổi
    const FetchDoctor = async () => {
        if (!currentUser) {
            return;
        } else {
            const response = await api.get(`/bacsi/${currentUser.nv_ma}`);
            if (response.data && response.data.success) {
                currentUser.role = response.data.data.nv_hoten;
            }
        }
    };

    // Fetch lịch đã đăng ký khi modal mở
    const fetchExistingSchedules = async () => {
        if (!isOpen || !currentUser?.nv_ma) return;

        try {
            setLoading(true);

            // Sử dụng endpoint API mới để lấy lịch làm việc của bác sĩ
            const response = await api.get(`/dangky-lich/doctor/${currentUser.nv_ma}`);

            if (response.data && response.data.success) {
                console.log("Lịch làm việc đã đăng ký:", response.data.data);
                setBookedSchedules(response.data.data);
            } else {
                setBookedSchedules([]);
            }
        } catch (error) {
            console.error('Lỗi khi lấy lịch làm việc:', error);
            toast.error('Không thể lấy thông tin lịch làm việc');
            setBookedSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        FetchDoctor();
        fetchExistingSchedules();
    }, [isOpen, currentModalDate]);

    useEffect(() => {
        setNewShift(initialShift);
        console.log("người user hiện tại:", currentUser);
    }, [initialShift]);

    // Lấy danh sách ngày trong tuần hiện tại của modal
    const modalWeekStart = startOfWeek(currentModalDate, { weekStartsOn: 1 });
    const modalWeekEnd = endOfWeek(currentModalDate, { weekStartsOn: 1 });
    const modalWeekDays = eachDayOfInterval({ start: modalWeekStart, end: modalWeekEnd });

    // Lấy các ca làm việc đã được đăng ký cho một ngày và ca cụ thể
    const getSchedulesForDayAndShift = (day, shiftId) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return bookedSchedules.filter(schedule =>
            schedule.nl_ngay === dateStr &&
            schedule.clv_stt.toString() === shiftId
        );
    };

    // Xử lý đăng ký ca làm việc
    const handleSubmit = async () => {
        if (!newShift.date || !newShift.shift) {
            toast.error("Vui lòng chọn ngày và ca làm việc");
            return;
        }

        // Kiểm tra ngày đăng ký có phải là ngày trong quá khứ không
        if (isBefore(parseISO(newShift.date), startOfDay(new Date()))) {
            toast.error("Không thể đăng ký ca làm việc vào ngày trong quá khứ");
            return;
        }

        setLoading(true);

        try {
            // Chuẩn bị dữ liệu theo format API chính xác
            const requestData = {
                nl_ngay: newShift.date,
                clv_stt: Number(newShift.shift),
                nv_ma: currentUser.nv_ma
            };

            console.log("Đăng ký lịch làm việc:", requestData);

            // Gọi API đăng ký lịch
            const response = await api.post('/dangky-lich/create', requestData);
            console.log("Phản hồi từ API:", response.data);

            // Xử lý phản hồi API
            if (response.data.data) {
                toast.success("Đăng ký lịch làm việc thành công!", {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored"
                });

                // Cập nhật lại danh sách lịch làm việc
                fetchExistingSchedules();

                setTimeout(() => {
                    onClose();
                }, 2000); // 2000ms = 2s, trùng với autoClose của toast
            } else {
                throw new Error(response.data?.message || "Lỗi khi đăng ký lịch làm việc");
            }
        } catch (error) {
            console.error("Lỗi đăng ký lịch làm việc:", error);

            // Xử lý lỗi chi tiết hơn
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Đăng ký lịch làm việc thất bại. Vui lòng thử lại sau.";

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
                <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                    <h3 className="text-lg font-medium">Đăng Ký Ca Làm Việc</h3>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6">
                    {/* Thông tin bác sĩ */}
                    <div className="mb-5 bg-secondary-800 p-4 rounded-md flex items-center">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white mr-3">
                            <i className="fas fa-user-md"></i>
                        </div>
                        <div>
                            <div className="text-dark-text font-medium">
                                {currentUser?.role || "Bác sĩ"}
                            </div>
                            <div className="text-dark-textSecondary text-sm">
                                {currentUser?.ck_ten ? `Chuyên khoa ${currentUser.ck_ten}` : "Bác sĩ"}
                            </div>
                        </div>
                    </div>

                    {/* Điều hướng tuần */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentModalDate(prevDate => addDays(prevDate, -7))}
                                className="p-2 bg-dark-card border border-dark-border rounded-md hover:bg-secondary-800 text-dark-text"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>

                            <button
                                onClick={() => setCurrentModalDate(new Date())}
                                className="p-2 bg-primary-900 bg-opacity-20 text-primary-300 border border-primary-700 rounded-md hover:bg-primary-900 hover:bg-opacity-30"
                            >
                                Tuần này
                            </button>

                            <button
                                onClick={() => setCurrentModalDate(prevDate => addDays(prevDate, 7))}
                                className="p-2 bg-dark-card border border-dark-border rounded-md hover:bg-secondary-800 text-dark-text"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <span className="font-medium text-dark-text">
                            {format(modalWeekStart, "'Tuần từ' dd/MM/yyyy", { locale: vi })} -
                            {format(modalWeekEnd, " dd/MM/yyyy", { locale: vi })}
                        </span>
                    </div>

                    {/* Lịch làm việc */}
                    <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                        {/* Header ngày trong tuần */}
                        <div className="grid grid-cols-7 bg-secondary-800 border-b border-dark-border">
                            {modalWeekDays.map((day, i) => {
                                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                const isPast = isBefore(day, startOfDay(new Date()));

                                return (
                                    <div
                                        key={i}
                                        className={`p-3 text-center border-r last:border-r-0 
                                            ${isToday ? 'bg-primary-900 bg-opacity-20 text-primary-300' : 'text-dark-text'}
                                            ${isPast ? 'text-dark-textSecondary' : ''}
                                        `}
                                    >
                                        <div className="font-medium">{format(day, 'EEEE', { locale: vi })}</div>
                                        <div className="text-lg">{format(day, 'dd/MM')}</div>
                                        {isPast && <div className="text-xs">(Đã qua)</div>}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Ca làm việc cho mỗi ngày */}
                        {WORKING_SHIFTS.map(shift => (
                            <div key={shift.id} className="grid grid-cols-7">
                                {/* Tiêu đề ca */}
                                <div className="col-span-7 bg-secondary-800 px-4 py-2 border-b border-t border-dark-border">
                                    <div className="flex items-center">
                                        <span className="font-medium text-dark-text">{shift.name}</span>
                                        <span className="text-dark-textSecondary text-sm ml-2">{shift.time}</span>
                                    </div>
                                </div>

                                {/* Ô cho mỗi ngày */}
                                {modalWeekDays.map((day, dayIndex) => {
                                    const isSelected =
                                        newShift.date === format(day, 'yyyy-MM-dd') &&
                                        newShift.shift === shift.id;

                                    const daySchedules = getSchedulesForDayAndShift(day, shift.id);
                                    const isBooked = daySchedules.length > 0;
                                    const isPast = isBefore(day, startOfDay(new Date()));

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`border-b border-r border-dark-border min-h-[80px] p-2 relative
                                                ${isSelected ? 'bg-primary-900 bg-opacity-20' : ''}
                                                ${isBooked ? 'bg-secondary-900' : ''}
                                                ${isPast ? 'bg-secondary-900 bg-opacity-50' : 'hover:bg-secondary-800'}
                                                ${!isPast && !isBooked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                            onClick={() => {
                                                if (!isPast && !isBooked) {
                                                    setNewShift({
                                                        ...newShift,
                                                        date: format(day, 'yyyy-MM-dd'),
                                                        shift: shift.id,
                                                    });
                                                }
                                            }}
                                        >
                                            {isPast ? (
                                                <div className="h-full flex items-center justify-center text-dark-textSecondary text-sm">
                                                    <i className="fas fa-lock mr-1"></i> Ngày đã qua
                                                </div>
                                            ) : isBooked ? (
                                                <div className="h-full flex items-center justify-center text-dark-textSecondary text-sm">
                                                    <i className="fas fa-calendar-check mr-1"></i> Đã đăng ký
                                                </div>
                                            ) : isSelected ? (
                                                <div className="h-full flex items-center justify-center text-primary-300 font-medium">
                                                    <i className="fas fa-check-circle mr-1"></i> Đã chọn
                                                </div>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-dark-textSecondary text-sm group-hover:text-primary-300">
                                                    <i className="fas fa-plus-circle mr-1"></i> Đăng ký ca này
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Thông tin ca làm việc đã chọn */}
                    {newShift.date && newShift.shift && (
                        <div className="mt-6 p-4 border border-dark-border rounded-lg bg-secondary-900">
                            <h4 className="font-medium mb-3 text-dark-text">Thông tin ca làm việc đã chọn</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-dark-textSecondary mb-1">Ngày làm việc:</div>
                                    <div className="font-medium text-dark-text">
                                        {newShift.date ? format(parseISO(newShift.date), 'EEEE, dd/MM/yyyy', { locale: vi }) : 'Chưa chọn'}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-dark-textSecondary mb-1">Ca làm việc:</div>
                                    <div className="font-medium text-dark-text">
                                        {WORKING_SHIFTS.find(s => s.id === newShift.shift)?.name || 'Chưa chọn'}
                                        {WORKING_SHIFTS.find(s => s.id === newShift.shift) &&
                                            <span className="text-sm text-dark-textSecondary ml-1">
                                                ({WORKING_SHIFTS.find(s => s.id === newShift.shift)?.time})
                                            </span>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-secondary-800 rounded-b-lg flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-dark-text bg-secondary-700 border border-dark-border rounded-md hover:bg-secondary-600"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !newShift.date || !newShift.shift}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center justify-center min-w-[120px] ${loading || !newShift.date || !newShift.shift
                            ? 'bg-secondary-800 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-600'
                            }`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang xử lý...
                            </>
                        ) : (
                            'Đăng ký ca làm việc'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterWorkShiftDoctor;