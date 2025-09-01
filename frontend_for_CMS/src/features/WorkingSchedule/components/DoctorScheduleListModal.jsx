import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import api from '../../../service/apiService';
import { WORKING_SHIFTS } from '../../../constants/workingShifts';
import { toast } from 'react-toastify';
import ConfirmationDialogModal from '../../../components/ConfirmationDialogModal';

const DoctorScheduleListModal = ({
    isOpen,
    onClose,
    specialty = null,
    date = null,
    shift = null,
    onSelect = null, // Callback khi chọn bác sĩ thành công
    room // Nhận prop room từ parent component
}) => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [assigningDoctor, setAssigningDoctor] = useState(false);
    
    // Fetch danh sách bác sĩ đã đăng ký lịch
    useEffect(() => {
        const fetchDoctors = async () => {
            if (!isOpen || !date || !shift) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Sử dụng API endpoint đúng
                const endpoint = `/dangky-lich/date/${date}/shift/${shift}/department/${specialty ? specialty : 'all'}`;
                const params = new URLSearchParams();
                const response = await api.get(`${endpoint}${params.toString() ? `?${params.toString()}` : ''}`);
                console.log("Fetching doctors with params:", { date, shift, specialty, room });

                if (response.data && response.data.success) {
                    console.log("API response:", response.data);
                    setDoctors(response.data.data || []);
                } else {
                    setError('Không thể lấy danh sách bác sĩ');
                    setDoctors([]);
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách bác sĩ:', error);
                setError('Đã xảy ra lỗi khi tải dữ liệu');
                setDoctors([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDoctors();
    }, [isOpen, specialty, date, shift]);
    
    // Hàm xử lý khi click vào bác sĩ để chọn
    const handleSelectDoctor = (doctor) => {
        setSelectedDoctor(doctor);
        setShowConfirmation(true);
    };
    
    // Hàm xử lý khi xác nhận chọn bác sĩ
    const handleConfirmSelection = async () => {
        if (!selectedDoctor) return;
        
        try {
            setAssigningDoctor(true);
            
            // Gọi API chỉ định bác sĩ với endpoint và cấu trúc dữ liệu đúng
            const response = await api.post('/dangky-lich/convert-to-schedule', {
                nl_ngay: date,
                clv_stt: parseInt(shift),
                nv_ma: selectedDoctor.nv_ma || selectedDoctor.doctor_info?.nv_ma,
                phong_ma: room // Sử dụng phòng được truyền từ parent component
            });
            
            if (response.data && response.data.success) {
                toast.success('Đã chỉ định bác sĩ phụ trách ca làm việc thành công!');
                setShowConfirmation(false);
                
                // Gọi callback nếu có để thông báo thành công và cập nhật lịch làm việc
                if (typeof onSelect === 'function') {
                    onSelect(selectedDoctor);
                }
                
                // Đóng modal sau khi chỉ định thành công
                onClose();
            } else {
                toast.error(response.data?.message || 'Có lỗi khi chỉ định bác sĩ phụ trách!');
            }
        } catch (error) {
            console.error('Lỗi khi chỉ định bác sĩ phụ trách:', error);
            toast.error('Đã xảy ra lỗi, vui lòng thử lại sau!');
        } finally {
            setAssigningDoctor(false);
        }
    };
    
    // Format thông tin ca làm việc
    const getShiftInfo = (shiftId) => {
        const shift = WORKING_SHIFTS.find(s => s.id === shiftId);
        return shift ? `${shift.name} (${shift.time})` : `Ca ${shiftId}`;
    };
    
    if (!isOpen) return null;
    
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
                <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                    <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                        <h3 className="text-lg font-medium">Danh Sách Bác Sĩ Đã Đăng Ký</h3>
                        <button onClick={onClose} className="text-white hover:text-gray-200">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {/* Thông tin tìm kiếm */}
                        <div className="mb-5 bg-secondary-800 p-4 rounded-md">
                            <h4 className="text-dark-text font-medium mb-3">Thông Tin Lịch</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {date && (
                                    <div>
                                        <span className="text-dark-textSecondary">Ngày: </span>
                                        <span className="text-dark-text font-medium">
                                            {format(new Date(date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                                        </span>
                                    </div>
                                )}
                                
                                {shift && (
                                    <div>
                                        <span className="text-dark-textSecondary">Ca: </span>
                                        <span className="text-dark-text font-medium">{getShiftInfo(shift)}</span>
                                    </div>
                                )}
                                
                                {specialty && (
                                    <div>
                                        <span className="text-dark-textSecondary">Chuyên khoa: </span>
                                        <span className="text-dark-text font-medium">{specialty}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Hướng dẫn chọn bác sĩ */}
                        <div className="mb-4 bg-primary-900 bg-opacity-20 border border-primary-700 rounded-md p-3 text-sm">
                            <div className="flex items-start">
                                <i className="fas fa-info-circle text-primary-300 mt-0.5 mr-2"></i>
                                <div>
                                    <p className="text-dark-text">Nhấp vào một bác sĩ để chỉ định phụ trách ca làm việc này</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Danh sách bác sĩ */}
                        <div>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-3"></div>
                                    <p className="text-dark-textSecondary ml-2">Đang tải dữ liệu...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-red-900 bg-opacity-20 text-red-400 p-4 rounded-md">
                                    <i className="fas fa-exclamation-circle mr-2"></i>
                                    {error}
                                </div>
                            ) : doctors.length === 0 ? (
                                <div className="bg-secondary-900 p-6 rounded-md text-center">
                                    <i className="fas fa-calendar-times text-3xl text-dark-textSecondary mb-3"></i>
                                    <p className="text-dark-textSecondary">
                                        Không có bác sĩ nào đăng ký lịch làm việc cho thông tin này
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {doctors.map((doctor, idx) => {
                                        const doctorInfo = doctor.doctor_info || {};
                                        
                                        return (
                                            <div 
                                                key={idx} 
                                                className="bg-secondary-900 rounded-md p-4 border border-dark-border flex items-center cursor-pointer hover:bg-secondary-800 transition-colors"
                                                onClick={() => handleSelectDoctor(doctor)}
                                            >
                                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white mr-4">
                                                    {doctorInfo.nv_gioitinh === "Nam" ? 
                                                        <i className="fas fa-male"></i> : 
                                                        <i className="fas fa-female"></i>
                                                    }
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <div className="text-dark-text font-medium">
                                                        {doctorInfo.nv_hoten || `BS.${doctor.nv_ma}`}
                                                    </div>
                                                    
                                                    <div className="text-dark-textSecondary text-sm mt-1 flex flex-wrap gap-x-4">
                                                        {doctorInfo.bs_bcapchuyenmon && (
                                                            <span>
                                                                <i className="fas fa-certificate mr-1"></i> 
                                                                {doctorInfo.bs_bcapchuyenmon}
                                                            </span>
                                                        )}
                                                        
                                                        {doctorInfo.ck_ma && (
                                                            <span>
                                                                <i className="fas fa-stethoscope mr-1"></i> 
                                                                Chuyên khoa: {doctorInfo.ck_ma}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {doctorInfo.bs_csdaotao && (
                                                        <div className="text-dark-textSecondary text-xs mt-1">
                                                            <i className="fas fa-university mr-1"></i> 
                                                            {doctorInfo.bs_csdaotao}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="text-primary-300 flex flex-col items-end">
                                                    <div className="text-xs mb-1">
                                                        <i className="fas fa-id-card mr-1"></i>
                                                        {doctorInfo.nv_ma}
                                                    </div>
                                                    <div className="text-sm">
                                                        <i className="fas fa-hand-pointer"></i>
                                                        <span className="ml-1">Chọn</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-secondary-800 rounded-b-lg flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-dark-text bg-secondary-700 border border-dark-border rounded-md hover:bg-secondary-600"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Modal xác nhận */}
            <ConfirmationDialogModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={handleConfirmSelection}
                title="Xác Nhận Chỉ Định Bác Sĩ"
                message={
                    selectedDoctor ? (
                        <div>
                            <p className="mb-2">Bạn có chắc chắn muốn chỉ định bác sĩ sau đây phụ trách ca làm việc?</p>
                            <div className="bg-secondary-800 p-3 rounded-md text-dark-text">
                                <p className="font-medium">{selectedDoctor.doctor_info?.nv_hoten}</p>
                                <p className="text-sm text-primary-300">{selectedDoctor.doctor_info?.nv_ma}</p>
                            </div>
                            <p className="mt-3 text-sm text-dark-textSecondary">
                                <i className="fas fa-info-circle mr-1"></i>
                                Bác sĩ này sẽ được chỉ định phụ trách ca làm việc vào ngày {format(new Date(date), 'dd/MM/yyyy')} - {getShiftInfo(shift)}
                            </p>
                        </div>
                    ) : "Vui lòng chọn bác sĩ"
                }
                confirmButtonText={assigningDoctor ? "Đang xử lý..." : "Xác nhận"}
                cancelButtonText="Hủy"
                icon="user-check"
                iconColor="text-primary-300"
                confirmButtonColor="bg-primary hover:bg-primary-600"
                dangerConfirm={false}
            />
        </>
    );
};

export default DoctorScheduleListModal;