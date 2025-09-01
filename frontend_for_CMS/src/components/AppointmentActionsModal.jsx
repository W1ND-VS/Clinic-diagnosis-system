import React, { use } from 'react';
import api from '../service/apiService';
import { toast } from 'react-toastify';

// Thêm prop userRole để xác định quyền
const EventDetailModal = ({
    isOpen,
    onClose,
    event,
    userRole = 'doctor' // Mặc định là bác sĩ
}) => {
    if (!isOpen || !event) return null;


    // Hàm xử lý lập phiếu khám
    const handleCreateMedicalRecord = async () => {
        const appointmentData = event.extendedProps;

        try {
            const response = await api.post(`/phieukham/from-appointment/${appointmentData.ph_ma}`);

            if (response.data.success) {
                onClose(); // Đóng modal
                toast.success("Lập phiếu khám thành công!", {
                    position: "top-right",
                    autoClose: 1500,
                    onClose: () => {
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    }
                });
            } else {
                toast.error("Lập phiếu khám thất bại.", {
                    position: "top-right"
                });
            }
        } catch (error) {
            console.error("Lỗi khi lập phiếu khám:", error);

            const errMsg =
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Không thể lập phiếu khám. Vui lòng thử lại!";

            toast.error(errMsg, {
                position: "top-right"
            });
        }
    };

    // Hàm xử lý hủy phiếu hẹn
    const handleCancelAppointment = async () => {
        try {
            const appointmentData = event.extendedProps;

            // Gọi API để hủy phiếu hẹn
            const response = await api.put(`/phieuhen/huy-hen/${appointmentData.ph_ma}`);

            if (response.data.success) {
                onClose();
                toast.success('Hủy phiếu hẹn thành công!', {
                    position: "top-right",
                    autoClose: 1500,
                    onClose: () => {
                        setTimeout(() => window.location.reload(), 500);
                    }
                });
            }
        } catch (error) {
            console.error("Lỗi khi hủy phiếu hẹn:", error);

            const errMsg =
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Không thể hủy phiếu hẹn. Vui lòng thử lại!";

            toast.error(errMsg, {
                position: "top-right"
            });
        }
    };

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? '' : 'hidden'}`}>
            <div className="bg-dark-card rounded-lg p-6 w-full max-w-2xl border border-dark-border">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-medium text-dark-text">Chi tiết lịch hẹn</h2>
                    <button
                        onClick={onClose}
                        className="text-dark-textSecondary hover:text-dark-text"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Content */}
                {event && (
                    <div className="space-y-4">
                        {/* Patient Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                    Tên bệnh nhân
                                </label>
                                <p className="text-dark-text">{event.extendedProps?.patientName || 'Không có thông tin'}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                    Mã bệnh nhân
                                </label>
                                <p className="text-dark-text">{event.extendedProps?.bn_ma || 'Không có'}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                    Ngày hẹn
                                </label>
                                <p className="text-dark-text">{event.extendedProps?.ph_ngayhen || 'Không có'}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                    Giờ hẹn
                                </label>
                                <p className="text-dark-text">
                                    {event.extendedProps?.ph_giohen || 'Không có'} - {event.extendedProps?.ph_gioketthuc || 'Không có'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                    Trạng thái
                                </label>
                                <span className={`px-2 py-1 rounded-full text-xs ${event.extendedProps?.status === 'completed'
                                        ? 'bg-green-900 bg-opacity-20 text-green-400'
                                        : event.extendedProps?.status === 'canceled'
                                            ? 'bg-red-900 bg-opacity-20 text-red-400'
                                            : 'bg-orange-900 bg-opacity-20 text-orange-400'
                                    }`}>
                                    {event.extendedProps?.status === 'completed' ? 'Đã khám' :
                                        event.extendedProps?.status === 'canceled' ? 'Đã hủy' :
                                            'Chưa khám'}
                                </span>
                            </div>

                            {event.extendedProps?.pk_ma && (
                                <div>
                                    <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                        Mã phiếu khám
                                    </label>
                                    <p className="text-dark-text">{event.extendedProps.pk_ma}</p>
                                </div>
                            )}
                        </div>

                        {/* Patient Details */}
                        {event.extendedProps?.patientDetails && (
                            <div className="border-t border-dark-border pt-4">
                                <h3 className="text-lg font-medium text-dark-text mb-3">Thông tin bệnh nhân</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                            Số điện thoại
                                        </label>
                                        <p className="text-dark-text">
                                            {event.extendedProps.patientDetails.bn_sdt || 'Không có'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                            Ngày sinh
                                        </label>
                                        <p className="text-dark-text">
                                            {event.extendedProps.patientDetails.bn_ngaysinh || 'Không có'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                            Giới tính
                                        </label>
                                        <p className="text-dark-text">
                                            {event.extendedProps.patientDetails.bn_gioitinh || 'Không có'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                            Địa chỉ
                                        </label>
                                        <p className="text-dark-text">
                                            {event.extendedProps.patientDetails.bn_diachi || 'Không có'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions - CHỈ HIỂN THỊ CHO ADMIN VÀ TIẾPTÂN */}
                        {(userRole === 'admin' || userRole === 'tieptan' || userRole === 'receptionist') && (
                            <div className="border-t border-dark-border pt-4">
                                <h3 className="text-lg font-medium text-dark-text mb-3">Thao tác</h3>
                                <div className="flex space-x-3">
                                    {/* Chỉ hiển thị nút "Tạo phiếu khám" nếu chưa có phiếu khám */}
                                    {!event.extendedProps?.pk_ma && event.extendedProps?.status !== 'canceled' && (
                                        <button
                                            onClick={() => handleCreateMedicalRecord()}
                                            className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md flex items-center"
                                        >
                                            <i className="fas fa-plus mr-2"></i>
                                            Tạo phiếu khám
                                        </button>
                                    )}

                                    {/* Nút xem phiếu khám nếu đã có */}
                                    {event.extendedProps?.pk_ma && (
                                        <button
                                            onClick={() => handleViewExamination()}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                                        >
                                            <i className="fas fa-eye mr-2"></i>
                                            Xem phiếu khám
                                        </button>
                                    )}

                                    {/* Nút hủy lịch hẹn */}
                                    {event.extendedProps?.status !== 'canceled' && !event.extendedProps?.pk_ma && (
                                        <button
                                            onClick={() => handleCancelAppointment()}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
                                        >
                                            <i className="fas fa-times mr-2"></i>
                                            Hủy lịch hẹn
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Thông báo cho bác sĩ */}
                        {userRole === 'doctor' && (
                            <div className="border-t border-dark-border pt-4">
                                <div className="bg-blue-900 bg-opacity-20 text-blue-300 p-3 rounded-lg">
                                    <div className="flex items-start">
                                        <i className="fas fa-info-circle mr-2 mt-0.5"></i>
                                        <div>
                                            <p className="font-medium">Thông tin cho bác sĩ</p>
                                            <p className="text-sm mt-1">
                                                {event.extendedProps?.pk_ma
                                                    ? 'Bệnh nhân đã có phiếu khám. Vui lòng liên hệ quản trị viên để xem chi tiết.'
                                                    : 'Lịch hẹn này chưa được tạo phiếu khám. Vui lòng liên hệ quản trị viên để tạo phiếu khám.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Thao tác cho bệnh nhân */}
                        {userRole === 'benhnhan' && (
                            <div className="border-t border-dark-border pt-4">
                                <h3 className="text-lg font-medium text-dark-text mb-3">Thao tác</h3>
                                <div className="flex space-x-3">
                                    {/* Xem phiếu khám nếu đã có */}
                                    {event.extendedProps?.pk_ma && (
                                        <button
                                            onClick={() => handleViewExamination()}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                                        >
                                            <i className="fas fa-eye mr-2"></i>
                                            Xem phiếu khám
                                        </button>
                                    )}
                                    {/* Hủy lịch hẹn nếu chưa có phiếu khám và chưa bị hủy */}
                                    {event.extendedProps?.status !== 'canceled' && !event.extendedProps?.pk_ma && (
                                        <button
                                            onClick={() => handleCancelAppointment()}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
                                        >
                                            <i className="fas fa-times mr-2"></i>
                                            Hủy lịch hẹn
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-dark-border text-dark-text rounded-md hover:bg-secondary-800"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventDetailModal;