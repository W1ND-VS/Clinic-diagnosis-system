import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminSidebar from '../../../../layouts/AdminSidebar';
import PageHeader from '../../../../layouts/PageHeader';
import api from '../../../../service/apiService';

const MedicineManagement = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredMedicines, setFilteredMedicines] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMedicines, setTotalMedicines] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentMedicine, setCurrentMedicine] = useState(null);

    const itemsPerPage = 10;

    // Form state
    const [formData, setFormData] = useState({
        thuoc_ma: '',
        thuoc_ten: '',
        thuoc_dvt: ''
    });

    // Fetch medicines data
    const fetchMedicines = async (page = 1) => {
        setLoading(true);
        try {
            const offset = (page - 1) * itemsPerPage;
            const response = await api.get(`/thuoc/paged?offset=${offset}&limit=${itemsPerPage}`);

            if (response.data?.success && response.data?.data) {
                const { data, total } = response.data.data;
                setMedicines(data);
                setFilteredMedicines(data);
                setTotalMedicines(total);
                setTotalPages(Math.ceil(total / itemsPerPage));
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách thuốc:', error);
            toast.error('Không thể tải danh sách thuốc');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines(currentPage);
    }, [currentPage]);

    // Filter medicines based on search term
    useEffect(() => {
        const filtered = medicines.filter(medicine =>
            medicine.thuoc_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
            medicine.thuoc_ma.toLowerCase().includes(searchTerm.toLowerCase()) ||
            medicine.thuoc_dvt.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredMedicines(filtered);
    }, [searchTerm, medicines]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isEditMode) {
                // Update medicine
                await api.put(`/thuoc/${currentMedicine.thuoc_ma}`, formData);
                toast.success('Cập nhật thuốc thành công!');
            } else {
                // Create new medicine
                await api.post('/thuoc', formData);
                toast.success('Thêm thuốc mới thành công!');
            }

            setIsModalOpen(false);
            resetForm();
            fetchMedicines(currentPage);
        } catch (error) {
            console.error('Lỗi khi lưu thuốc:', error);
            toast.error(isEditMode ? 'Lỗi khi cập nhật thuốc' : 'Lỗi khi thêm thuốc mới');
        }
    };

    // Handle edit
    const handleEdit = (medicine) => {
        setCurrentMedicine(medicine);
        setFormData({
            thuoc_ma: medicine.thuoc_ma,
            thuoc_ten: medicine.thuoc_ten,
            thuoc_dvt: medicine.thuoc_dvt
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    // Handle delete
    const handleDelete = async (medicineId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thuốc này?')) {
            try {
                await api.delete(`/thuoc/${medicineId}`);
                toast.success('Xóa thuốc thành công!');
                fetchMedicines(currentPage);
            } catch (error) {
                console.error('Lỗi khi xóa thuốc:', error);
                toast.error('Lỗi khi xóa thuốc');
            }
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            thuoc_ma: '',
            thuoc_ten: '',
            thuoc_dvt: ''
        });
        setCurrentMedicine(null);
        setIsEditMode(false);
    };

    // Handle modal close
    const handleModalClose = () => {
        setIsModalOpen(false);
        resetForm();
    };

    // Handle add new
    const handleAddNew = () => {
        resetForm();
        setIsModalOpen(true);
    };

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const renderPagination = () => {
        const pages = [];
        const maxPagesToShow = 5;
        const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        // Previous button
        if (currentPage > 1) {
            pages.push(
                <button
                    key="prev"
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-3 py-2 rounded-md bg-secondary-800 text-dark-text hover:bg-secondary-700 transition-colors"
                >
                    <i className="fas fa-chevron-left"></i>
                </button>
            );
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-2 rounded-md transition-colors ${i === currentPage
                            ? 'bg-primary text-white'
                            : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'
                        }`}
                >
                    {i}
                </button>
            );
        }

        // Next button
        if (currentPage < totalPages) {
            pages.push(
                <button
                    key="next"
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-3 py-2 rounded-md bg-secondary-800 text-dark-text hover:bg-secondary-700 transition-colors"
                >
                    <i className="fas fa-chevron-right"></i>
                </button>
            );
        }

        return pages;
    };

    const dvtOptions = [
        'viên', 'vỉ', 'hộp', 'lọ', 'ống', 'gói', 'chai', 'tuýp', 'ml', 'mg'
    ];

    return (
        <div className="flex h-screen bg-dark-bg">
            <AdminSidebar />
            <div className="flex-1 p-6 overflow-auto">
                <PageHeader title="Quản Lý Thuốc" breadcrumbs={["Quản lý", "Thuốc"]}>
                    <button
                        onClick={handleAddNew}
                        className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md flex items-center"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Thêm thuốc mới
                    </button>
                </PageHeader>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-textSecondary text-sm">Tổng số thuốc</p>
                                <h3 className="text-2xl font-bold text-primary-300 mt-1">{totalMedicines}</h3>
                            </div>
                            <i className="fas fa-pills text-primary-300 text-2xl"></i>
                        </div>
                    </div>

                    <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-textSecondary text-sm">Đang hiển thị</p>
                                <h3 className="text-2xl font-bold text-green-400 mt-1">{filteredMedicines.length}</h3>
                            </div>
                            <i className="fas fa-eye text-green-400 text-2xl"></i>
                        </div>
                    </div>

                    <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-textSecondary text-sm">Trang hiện tại</p>
                                <h3 className="text-2xl font-bold text-orange-400 mt-1">{currentPage}/{totalPages}</h3>
                            </div>
                            <i className="fas fa-bookmark text-orange-400 text-2xl"></i>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-dark-card rounded-lg p-4 mb-6 border border-dark-border">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                Tìm kiếm thuốc
                            </label>
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary"></i>
                                <input
                                    type="text"
                                    placeholder="Nhập tên thuốc, mã thuốc hoặc đơn vị tính..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Medicine List */}
                <div className="bg-dark-card rounded-lg border border-dark-border">
                    <div className="p-4 border-b border-dark-border">
                        <h3 className="text-lg font-semibold text-dark-text">
                            Danh sách thuốc ({filteredMedicines.length})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            <p className="text-dark-textSecondary ml-2">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                            Mã thuốc
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                            Tên thuốc
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                            Đơn vị tính
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-border">
                                    {filteredMedicines.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-dark-textSecondary">
                                                <i className="fas fa-pills text-4xl mb-4 opacity-50"></i>
                                                <p>Không có thuốc nào được tìm thấy</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMedicines.map((medicine, index) => (
                                            <tr key={medicine.thuoc_ma} className="hover:bg-secondary-900 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-300">
                                                    {medicine.thuoc_ma}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                                                    {medicine.thuoc_ten}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                                    <span className="px-2 py-1 bg-secondary-800 rounded-md text-xs">
                                                        {medicine.thuoc_dvt}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(medicine)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs flex items-center"
                                                        >
                                                            <i className="fas fa-edit mr-1"></i>
                                                            Sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(medicine.thuoc_ma)}
                                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs flex items-center"
                                                        >
                                                            <i className="fas fa-trash mr-1"></i>
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-dark-border">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-dark-textSecondary">
                                    Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalMedicines)} của {totalMedicines} thuốc
                                </div>
                                <div className="flex space-x-2">
                                    {renderPagination()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-dark-card rounded-lg p-6 w-full max-w-md border border-dark-border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-dark-text">
                                    {isEditMode ? 'Chỉnh sửa thuốc' : 'Thêm thuốc mới'}
                                </h3>
                                <button
                                    onClick={handleModalClose}
                                    className="text-dark-textSecondary hover:text-dark-text"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                            Mã thuốc *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.thuoc_ma}
                                            onChange={(e) => setFormData({ ...formData, thuoc_ma: e.target.value })}
                                            className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                            disabled={isEditMode}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                            Tên thuốc *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.thuoc_ten}
                                            onChange={(e) => setFormData({ ...formData, thuoc_ten: e.target.value })}
                                            className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                            Đơn vị tính *
                                        </label>
                                        <select
                                            value={formData.thuoc_dvt}
                                            onChange={(e) => setFormData({ ...formData, thuoc_dvt: e.target.value })}
                                            className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        >
                                            <option value="">Chọn đơn vị tính</option>
                                            {dvtOptions.map(dvt => (
                                                <option key={dvt} value={dvt}>{dvt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={handleModalClose}
                                        className="px-4 py-2 bg-secondary-800 text-dark-text rounded-md hover:bg-secondary-700 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
                                    >
                                        {isEditMode ? 'Cập nhật' : 'Thêm mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <ToastContainer theme="dark" />
        </div>
    );
};

export default MedicineManagement;