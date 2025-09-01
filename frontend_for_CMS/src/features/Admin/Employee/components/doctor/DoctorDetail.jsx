// features/Admin/Employee/components/doctor/DoctorDetail.jsx
import React from 'react';

const DoctorDetail = ({ doctor, onClose }) => {
    if (!doctor) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="bg-dark-card rounded-lg shadow-lg border border-dark-border">
            <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                <h3 className="text-lg font-medium">
                    Thông tin chi tiết bác sĩ
                </h3>
                <button onClick={onClose} className="text-white hover:text-gray-200">
                    <i className="fas fa-times"></i>
                </button>
            </div>

            <div className="p-6">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4 mb-4 md:mb-0 flex justify-center">
                        <div className="h-32 w-32 bg-secondary-700 rounded-full flex items-center justify-center text-4xl text-primary-300">
                            <i className="fas fa-user-md"></i>
                        </div>
                    </div>

                    <div className="md:w-3/4">
                        <h2 className="text-xl font-medium text-dark-text mb-1">
                            {doctor.nv_hoten || 'Không có tên'}
                        </h2>
                        <div className="flex items-center mb-6">
                            <span className="text-sm bg-primary-900 bg-opacity-20 text-primary-300 px-2 py-0.5 rounded-full border border-primary-700">
                                {doctor.ck_ten || 'Không có chuyên khoa'}
                            </span>
                            <span className="text-xs text-dark-textSecondary ml-4">
                                Mã NV: {doctor.nv_ma}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-3">
                                <div>
                                    <div className="text-dark-textSecondary">Giới tính</div>
                                    <div className="text-dark-text">{doctor.bs_gioitinh || 'N/A'}</div>
                                </div>

                                <div>
                                    <div className="text-dark-textSecondary">Ngày sinh</div>
                                    <div className="text-dark-text">{formatDate(doctor.nv_ngaysinh)}</div>
                                </div>

                                <div>
                                    <div className="text-dark-textSecondary">Số điện thoại</div>
                                    <div className="text-dark-text">{doctor.bs_sdt || 'N/A'}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="text-dark-textSecondary">Bậc cấp chuyên môn</div>
                                    <div className="text-dark-text">{doctor.bs_bcapchuyenmon || 'N/A'}</div>
                                </div>

                                <div>
                                    <div className="text-dark-textSecondary">Cơ sở đào tạo</div>
                                    <div className="text-dark-text">{doctor.bs_csdaotao || 'N/A'}</div>
                                </div>

                                <div>
                                    <div className="text-dark-textSecondary">Địa chỉ</div>
                                    <div className="text-dark-text">{doctor.bs_diachi || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        {doctor.bs_ghichu && (
                            <div className="mt-4">
                                <div className="text-dark-textSecondary">Ghi chú</div>
                                <div className="text-dark-text bg-secondary-800 p-3 rounded-md mt-1 text-sm">
                                    {doctor.bs_ghichu}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Statistics and additional info can be added here */}

                <div className="mt-8 border-t border-dark-border pt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-secondary-700 text-dark-text rounded-md hover:bg-secondary-600"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorDetail;