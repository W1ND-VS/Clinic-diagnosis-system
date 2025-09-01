// features/MedicalServices/components/ServiceResultModal.jsx
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../../service/apiService';
import { toast } from 'react-toastify';

const ServiceResultModal = ({ isOpen, onClose, service, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);

    // Nếu modal không mở, không render gì cả
    if (!isOpen) return null;

    // Formik setup
    const formik = useFormik({
        initialValues: {
            ketqua: service?.ketqua || '',
            ghichu: service?.ghichu || ''
        },
        validationSchema: Yup.object({
            ketqua: Yup.string().required('Vui lòng nhập kết quả dịch vụ'),
        }),
        onSubmit: async (values) => {
            if (!service || !service.ctdv_ma) {
                toast.error("Không tìm thấy thông tin dịch vụ!");
                return;
            }

            setIsLoading(true);
            try {
                const response = await api.put(`/chitietdichvu/updateketqua/${service.ctdv_ma}`, {
                    ketqua: values.ketqua,
                    ghichu: values.ghichu
                });

                if (response.data && response.data.success) {
                    toast.success("Cập nhật kết quả dịch vụ thành công!");
                    if (onSuccess) onSuccess(service.ctdv_ma, values);
                    onClose();
                } else {
                    toast.error(response.data?.message || "Lỗi khi cập nhật kết quả!");
                }
            } catch (error) {
                console.error("Error updating service result:", error);
                toast.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật kết quả!");
            } finally {
                setIsLoading(false);
            }
        },
    });

    // Cập nhật giá trị form khi service thay đổi
    useEffect(() => {
        if (service) {
            formik.setValues({
                ketqua: service.ketqua || '',
                ghichu: service.ghichu || ''
            });
        }
    }, [service]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-dark-card rounded-lg shadow-lg max-w-md w-full border border-dark-border animate-modal-appear">
                <div className="px-6 py-4 border-b border-dark-border bg-primary text-white rounded-t-lg flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                        Nhập kết quả dịch vụ y tế
                    </h3>
                    <button
                        onClick={onClose}
                        type="button"
                        className="text-white hover:text-gray-200 focus:outline-none"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6">
                    {service && (
                        <div className="mb-4">
                            <div className="text-dark-textSecondary text-sm mb-1">Bệnh nhân:</div>
                            <div className="font-medium text-dark-text">{service.bn_hoten || 'Không xác định'}</div>

                            <div className="text-dark-textSecondary text-sm mt-2 mb-1">Dịch vụ:</div>
                            <div className="font-medium text-dark-text">{service.dv_ten || 'Không xác định'}</div>

                            <div className="text-dark-textSecondary text-sm mt-2 mb-1">Bác sĩ chỉ định:</div>
                            <div className="font-medium text-dark-text">{service.bs_hoten || 'Không xác định'}</div>

                            <div className="border-t border-dark-border mt-4 pt-4"></div>
                        </div>
                    )}

                    <form onSubmit={formik.handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-dark-text mb-1">
                                Kết quả dịch vụ <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="ketqua"
                                name="ketqua"
                                rows="4"
                                placeholder="Nhập kết quả chi tiết của dịch vụ y tế..."
                                className={`w-full p-2 border ${formik.touched.ketqua && formik.errors.ketqua
                                        ? 'border-red-500'
                                        : 'border-dark-border'
                                    } rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary`}
                                value={formik.values.ketqua}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                            {formik.touched.ketqua && formik.errors.ketqua ? (
                                <div className="text-red-500 text-xs mt-1">{formik.errors.ketqua}</div>
                            ) : null}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-dark-text mb-1">
                                Ghi chú
                            </label>
                            <textarea
                                id="ghichu"
                                name="ghichu"
                                rows="2"
                                placeholder="Nhập ghi chú (nếu cần)..."
                                className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary"
                                value={formik.values.ghichu}
                                onChange={formik.handleChange}
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text hover:bg-secondary-700"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`px-4 py-2 ${isLoading ? 'bg-primary-800 cursor-not-allowed' : 'bg-primary hover:bg-primary-600'
                                    } text-white rounded-md flex items-center`}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save mr-2"></i> Lưu kết quả
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ServiceResultModal;