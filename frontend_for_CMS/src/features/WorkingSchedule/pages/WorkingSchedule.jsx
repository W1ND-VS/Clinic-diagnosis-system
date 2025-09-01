import React, { useState, useEffect } from 'react';
import api from '../../../service/apiService';
import { useNavigate } from 'react-router-dom';
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import DoctorSidebar from '../../../layouts/DoctorSidebar';
import PageHeader from '../../../layouts/PageHeader';
import { WORKING_SHIFTS } from '../../../constants/workingShifts';
import RegisterWorkShift from '../components/DoctorRegisterWorkShift';

const DoctorWorkingSchedule = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [newShift, setNewShift] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        shift: '1',
        status: 'scheduled'
    });

    // Check authentication and get user data
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await api.get('/auth/me');
                if (response.data.data) {
                    const userData = response.data.data;
                    setCurrentUser(userData);

                    // Nếu không phải bác sĩ, chuyển hướng
                    if (userData.role !== 'bacsi') {
                        navigate('/dashboard');
                        return;
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    // Fetch schedules for the current doctor
    useEffect(() => {
        if (!currentUser || !currentUser.nv_ma) return;

        const fetchDoctorSchedules = async () => {
            try {
                setLoading(true);
                const startDate = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                const endDate = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

                const endpoint = `/lichlv/doctor/${currentUser.nv_ma}/date-range?start_date=${startDate}&end_date=${endDate}`;
                const response = await api.get(endpoint);

                if (response.data && response.data.data) {
                    setSchedules(response.data.data);
                } else {
                    setSchedules([]);
                }
            } catch (error) {
                console.error('Error fetching schedules:', error);
                setSchedules([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorSchedules();
    }, [currentDate, currentUser]);

    // Handle adding a new shift
    const handleAddShift = async (shiftData) => {
        try {
            // Format data theo API
            const formattedData = {
                nv_ma: currentUser.nv_ma,
                nl_ngay: shiftData.date,
                clv_stt: parseInt(shiftData.shift),
                phong_ma: shiftData.phong_ma || 'P01' // Mặc định nếu không có
            };

            const response = await api.post("/dangky-lich", formattedData);

            if (response.data && response.data.success) {
                // Refresh lịch làm việc
                const startDate = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                const endDate = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

                const endpoint = `/lichlv/doctor/${currentUser.nv_ma}/date-range?start_date=${startDate}&end_date=${endDate}`;
                const scheduleResponse = await api.get(endpoint);

                if (scheduleResponse.data && scheduleResponse.data.data) {
                    setSchedules(scheduleResponse.data.data);
                }

                // Đóng modal và reset form
                setShowAddModal(false);
                setNewShift({
                    date: format(new Date(), 'yyyy-MM-dd'),
                    shift: '1',
                    status: 'scheduled'
                });
            }
        } catch (error) {
            console.error('Error registering work shift:', error);
            alert('Không thể đăng ký ca làm việc. Vui lòng thử lại.');
        }
    };

    // Navigate to previous week
    const previousWeek = () => {
        setCurrentDate(prevDate => addDays(prevDate, -7));
    };

    // Navigate to next week
    const nextWeek = () => {
        setCurrentDate(prevDate => addDays(prevDate, 7));
    };

    // Navigate to current week
    const goToCurrentWeek = () => {
        setCurrentDate(new Date());
    };

    // Calculate the week days
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Get schedules for a specific day and shift
    const getSchedulesForDayAndShift = (day, shiftId) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return schedules.filter(schedule =>
            schedule.nl_ngay === dateStr &&
            schedule.clv_stt.toString() === shiftId
        );
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
            <DoctorSidebar />
            <div className="flex-1 overflow-auto">
                <div className="p-4 md:p-6">
                    <PageHeader
                        title="Lịch Làm Việc Cá Nhân"
                        breadcrumbs={["Lịch làm việc"]}
                    >
                        <button
                            onClick={() => {
                                setNewShift({
                                    date: format(new Date(), 'yyyy-MM-dd'),
                                    shift: '1',
                                    status: 'scheduled'
                                });
                                setShowAddModal(true);
                            }}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 flex items-center"
                        >
                            <i className="fas fa-calendar-plus mr-2"></i> Đăng ký ca làm việc
                        </button>
                    </PageHeader>

                    <p className="text-dark-textSecondary mb-4">
                        Xem và đăng ký lịch làm việc của bạn
                    </p>

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
                                <div className="col-span-7 bg-secondary-800 px-4 py-2 border-b border-t border-dark-border">
                                    <div className="flex items-center">
                                        <span className="font-medium text-dark-text">{shift.name}</span>
                                        <span className="text-dark-textSecondary text-sm ml-2">{shift.time}</span>
                                    </div>
                                </div>

                                {weekDays.map((day, dayIndex) => {
                                    const daySchedules = getSchedulesForDayAndShift(day, shift.id);
                                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                    const isPast = day < new Date().setHours(0, 0, 0, 0);

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`border-b border-r min-h-[120px] p-2 relative overflow-y-auto max-h-[180px]
                                                ${isToday ? 'bg-primary-900 bg-opacity-5' : ''}
                                                ${isPast ? 'bg-secondary-900 bg-opacity-10' : ''}
                                            `}
                                        >
                                            {daySchedules.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-dark-textSecondary text-sm">
                                                    {!isPast ? (
                                                        <>
                                                            <i className="fas fa-calendar mb-1 text-xl"></i>
                                                            <span>Trống</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-calendar-times mb-1 text-xl"></i>
                                                            <span>Trống (ngày đã qua)</span>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {daySchedules.map((schedule, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="p-2 mb-1 rounded-md border text-sm bg-primary-900 bg-opacity-20 border-primary-700 text-dark-text"
                                                        >
                                                            <div className="font-medium">
                                                                <i className="fas fa-user-md mr-1 text-primary-300"></i>
                                                                {currentUser?.nv_hoten || 'Bác sĩ'}
                                                            </div>
                                                            <div className="text-xs mt-1 flex justify-between items-center">
                                                                <span>
                                                                    <i className="fas fa-door-open mr-1"></i>
                                                                    Phòng {schedule.phong_ma}
                                                                </span>

                                                                {!isPast && (
                                                                    <button
                                                                        className="text-red-400 hover:text-red-600 transition-colors"
                                                                        title="Hủy đăng ký"
                                                                    >
                                                                        <i className="fas fa-times-circle"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <RegisterWorkShift
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                currentUser={currentUser}
                initialShift={newShift}
            />
        </div>
    );
};

export default DoctorWorkingSchedule;