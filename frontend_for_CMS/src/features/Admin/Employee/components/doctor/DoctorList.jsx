// features/Admin/Employee/components/doctor/DoctorList.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DoctorDetail from './DoctorDetail'; // Import component DoctorDetail

const DoctorList = ({ doctors, loading, onDelete, currentPage, totalPages, onPageChange }) => {
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    console.log('DoctorList props:', { currentPage, totalPages, doctorsCount: doctors.length });
    const handleViewDetail = (doctor) => {
        setSelectedDoctor(doctor);
        setShowDetailModal(true);
    };

    if (loading) {
        return (
            <div className="bg-dark-card rounded-lg shadow border border-dark-border p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-3"></div>
                <p className="text-dark-textSecondary">Đang tải danh sách bác sĩ...</p>
            </div>
        );
    }

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pageNumbers = [];
        const maxPageButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = startPage + maxPageButtons - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="bg-secondary-800 px-4 py-3 flex items-center justify-between border-t border-dark-border">
                <div>
                    <p className="text-sm text-dark-textSecondary">
                        Hiển thị trang <span className="font-medium">{currentPage}</span> / {totalPages}
                    </p>
                </div>
                <div>
                    <nav className="flex items-center">
                        <button
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-dark-border bg-secondary-800 text-sm font-medium ${currentPage === 1
                                    ? 'text-dark-textSecondary cursor-not-allowed'
                                    : 'text-dark-text hover:bg-secondary-700'
                                }`}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>

                        {pageNumbers.map((number) => (
                            <button
                                key={number}
                                onClick={() => onPageChange(number)}
                                className={`relative inline-flex items-center px-4 py-2 border border-dark-border ${currentPage === number
                                        ? 'bg-primary text-white'
                                        : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'
                                    } text-sm font-medium`}
                            >
                                {number}
                            </button>
                        ))}

                        <button
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-dark-border bg-secondary-800 text-sm font-medium ${currentPage === totalPages
                                    ? 'text-dark-textSecondary cursor-not-allowed'
                                    : 'text-dark-text hover:bg-secondary-700'
                                }`}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </nav>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-dark-card rounded-lg shadow border border-dark-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-border">
                    <thead className="bg-secondary-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                Mã NV
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                Họ tên
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                Cơ sở đào tạo
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                Chuyên khoa
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                Bậc cấp chuyên môn
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-dark-card divide-y divide-dark-border">
                        {doctors.length > 0 ? (
                            doctors.map((doctor) => (
                                <tr key={doctor.nv_ma} className="hover:bg-secondary-900">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">
                                        {doctor.nv_ma}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                                        <div>{doctor.nv_hoten || '---'}</div>
                                        <div className="text-xs text-dark-textSecondary mt-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                              doctor.nv_gioitinh
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-pink-100 text-pink-800'
                                            }`}>
                                              {doctor.nv_gioitinh ? 'Nam' : 'Nữ'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                        {doctor.bs_csdaotao || '---'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-900 bg-opacity-20 text-primary-300 border border-primary-700">
                                            {doctor.ck_ten || '---'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                        {doctor.bs_bcapchuyenmon || '---'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                        <div className="flex justify-center space-x-3">
                                            <button
                                                onClick={() => handleViewDetail(doctor)}
                                                className="text-blue-400 hover:text-blue-500"
                                                title="Xem chi tiết"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <Link to={`/admin/employee/doctor/edit/${doctor.nv_ma}`} className="text-primary-300 hover:text-primary" title="Chỉnh sửa">
                                                <i className="fas fa-edit"></i>
                                            </Link>
                                            <button
                                                onClick={() => onDelete(doctor)}
                                                className="text-red-400 hover:text-red-500"
                                                title="Xóa"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-dark-textSecondary">
                                    <i className="fas fa-user-md text-4xl mb-3 block"></i>
                                    Không tìm thấy bác sĩ nào
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {renderPagination()}

            {/* Modal chi tiết bác sĩ */}
            {showDetailModal && selectedDoctor && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <DoctorDetail
                        doctor={selectedDoctor}
                        onClose={() => setShowDetailModal(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default DoctorList;