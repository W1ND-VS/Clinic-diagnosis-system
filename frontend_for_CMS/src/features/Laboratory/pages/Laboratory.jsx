import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../service/apiService";
import { toast } from 'react-toastify';
import LaboratorySidebar from "../../../layouts/LaboratorySidebar";
import CompleteService from "../components/CompleteService";

const Laboratory = () => {
    const navigate = useNavigate();

    // States
    const [serviceRequests, setServiceRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Thêm states cho nhập kết quả
    const [isCompleteServiceModalOpen, setIsCompleteServiceModalOpen] = useState(false);
    const [selectedServices, setSelectedServices] = useState([]);
    const [serviceResults, setServiceResults] = useState(null);
    const [loadingServices, setLoadingServices] = useState(false);

    // Fetch service requests data
    useEffect(() => {
        fetchServiceRequests();
    }, []);

    const fetchServiceRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/phieu-cddvyt');

            if (response.data.success) {
                setServiceRequests(response.data.data);
            } else {
                toast.error('Không thể tải danh sách phiếu chỉ định');
            }
        } catch (error) {
            console.error('Error fetching service requests:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // Lấy dữ liệu dịch vụ và kết quả từ API
    const fetchDetailedResults = async (pcdMa) => {
        try {
            setLoadingServices(true);
            const response = await api.get(`/ketqua/detailed-results/${pcdMa}`);

            if (response.data.success) {
                return response.data.data;
            } else {
                toast.error('Không thể tải danh sách dịch vụ');
                return null;
            }
        } catch (error) {
            console.error('Error fetching detailed results:', error);
            toast.error('Có lỗi xảy ra khi tải dịch vụ');
            return null;
        } finally {
            setLoadingServices(false);
        }
    };

    // Handle nhập/xem kết quả
    const handleCompleteService = async (request) => {
        try {
            setLoadingServices(true);

            // Lấy chi tiết dịch vụ và kết quả
            const detailedData = await fetchDetailedResults(request.pcd_ma);

            if (!detailedData || !detailedData.dich_vu || detailedData.dich_vu.length === 0) {
                toast.error('Không tìm thấy dịch vụ nào trong phiếu chỉ định này');
                return;
            }

            // Kiểm tra trạng thái dựa trên phieu_info
            const isCompleted = detailedData.phieu_info.pcd_ngay && detailedData.phieu_info.pcd_gio;

            setSelectedRequest(request);
            setSelectedServices(detailedData.dich_vu);
            
            // Nếu đã hoàn thành, truyền toàn bộ data để xem
            // Nếu chưa hoàn thành, chỉ truyền dich_vu để nhập
            setServiceResults(isCompleted ? detailedData : null);
            setIsCompleteServiceModalOpen(true);

        } catch (error) {
            console.error('Error preparing service completion:', error);
            toast.error('Có lỗi xảy ra khi chuẩn bị nhập kết quả');
        } finally {
            setLoadingServices(false);
        }
    };

    // Handle save results
    const handleSaveResults = (results) => {
        toast.success('Kết quả đã được lưu thành công');
        setIsCompleteServiceModalOpen(false);
        setSelectedRequest(null);
        setSelectedServices([]);
        setServiceResults(null);

        // Refresh danh sách
        fetchServiceRequests();
    };

    // Handle cancel
    const handleCancelResults = () => {
        setIsCompleteServiceModalOpen(false);
        setSelectedRequest(null);
        setSelectedServices([]);
        setServiceResults(null);
    };

    // Filter logic
    const filteredRequests = serviceRequests.filter(request => {
        const matchesSearch = request.pcd_ma.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.pk_ma.toString().includes(searchTerm);

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'completed' && request.pcd_ngay && request.pcd_gio) ||
            (statusFilter === 'pending' && (!request.pcd_ngay || !request.pcd_gio));

        const matchesDate = !dateFilter || request.pk_ngaykham === dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Get status info
    const getStatusInfo = (request) => {
        if (request.pcd_ngay && request.pcd_gio) {
            return {
                text: 'Đã hoàn thành',
                className: 'bg-green-900 text-green-300',
                icon: 'fas fa-check-circle'
            };
        }
        return {
            text: 'Đang chờ thực hiện',
            className: 'bg-yellow-900 text-yellow-300',
            icon: 'fas fa-clock'
        };
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Format date time
    const formatDateTime = (date, time) => {
        if (!date || !time) return 'Chưa thực hiện';
        return `${date} ${time}`;
    };

    // Handle view details
    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setIsDetailModalOpen(true);
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex h-screen bg-dark-bg">
                <LaboratorySidebar />
                <div className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
                        <p className="text-dark-textSecondary">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-dark-bg">
            <LaboratorySidebar />
            <div className="flex-1 p-6 overflow-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-dark-text">Quản lý phiếu chỉ định dịch vụ y tế</h2>
                            <p className="text-dark-textSecondary mt-1">
                                Theo dõi và quản lý các phiếu chỉ định từ bác sĩ
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={fetchServiceRequests}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 flex items-center"
                            >
                                <i className="fas fa-sync-alt mr-2"></i>
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center">
                            <div className="p-2 bg-primary-900 rounded-lg">
                                <i className="fas fa-file-medical text-primary-300 text-xl"></i>
                            </div>
                            <div className="ml-4">
                                <p className="text-dark-textSecondary text-sm">Tổng phiếu</p>
                                <p className="text-2xl font-bold text-dark-text">{serviceRequests.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-900 rounded-lg">
                                <i className="fas fa-clock text-yellow-300 text-xl"></i>
                            </div>
                            <div className="ml-4">
                                <p className="text-dark-textSecondary text-sm">Chờ thực hiện</p>
                                <p className="text-2xl font-bold text-dark-text">
                                    {serviceRequests.filter(r => !r.pcd_ngay || !r.pcd_gio).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-900 rounded-lg">
                                <i className="fas fa-check-circle text-green-300 text-xl"></i>
                            </div>
                            <div className="ml-4">
                                <p className="text-dark-textSecondary text-sm">Đã hoàn thành</p>
                                <p className="text-2xl font-bold text-dark-text">
                                    {serviceRequests.filter(r => r.pcd_ngay && r.pcd_gio).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-900 rounded-lg">
                                <i className="fas fa-money-bill-wave text-blue-300 text-xl"></i>
                            </div>
                            <div className="ml-4">
                                <p className="text-dark-textSecondary text-sm">Tổng giá trị</p>
                                <p className="text-lg font-bold text-dark-text">
                                    {formatCurrency(serviceRequests.reduce((sum, r) => sum + r.pcd_tongtien, 0))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-dark-card rounded-lg border border-dark-border p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-text mb-2">
                                Tìm kiếm
                            </label>
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary"></i>
                                <input
                                    type="text"
                                    placeholder="Mã phiếu, mã khám..."
                                    className="w-full pl-10 pr-4 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-text mb-2">
                                Trạng thái
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                <option value="pending">Chờ thực hiện</option>
                                <option value="completed">Đã hoàn thành</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-text mb-2">
                                Ngày khám
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setDateFilter('');
                                }}
                                className="w-full px-4 py-2 bg-secondary-700 text-dark-text rounded-md hover:bg-secondary-600 border border-dark-border"
                            >
                                <i className="fas fa-times mr-2"></i>
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Service Requests Table */}
                <div className="bg-dark-card rounded-lg border border-dark-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-dark-border">
                        <h3 className="text-lg font-medium text-dark-text">
                            Danh sách phiếu chỉ định ({filteredRequests.length})
                        </h3>
                    </div>

                    {filteredRequests.length === 0 ? (
                        <div className="p-8 text-center">
                            <i className="fas fa-file-medical text-4xl text-dark-textSecondary mb-4"></i>
                            <h3 className="text-lg font-medium text-dark-text mb-2">Không có phiếu chỉ định nào</h3>
                            <p className="text-dark-textSecondary">
                                {searchTerm || statusFilter !== 'all' || dateFilter
                                    ? 'Không tìm thấy phiếu chỉ định phù hợp với điều kiện lọc'
                                    : 'Chưa có phiếu chỉ định dịch vụ nào được tạo'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-dark-border">
                                <thead className="bg-secondary-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                            Mã phiếu
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                            Mã khám
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                            Ngày khám
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                            Tổng tiền
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                            Thời gian hoàn thành
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-border">
                                    {filteredRequests.map((request) => {
                                        const status = getStatusInfo(request);
                                        return (
                                            <tr key={request.pcd_ma} className="hover:bg-secondary-900 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <i className="fas fa-file-medical text-primary-300 mr-2"></i>
                                                        <span className="text-sm font-medium text-dark-text">
                                                            {request.pcd_ma}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                                    {request.pk_ma}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                                    {request.pk_ngaykham}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                                                    {formatCurrency(request.pcd_tongtien)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                                                        <i className={`${status.icon} mr-1`}></i>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                                    {formatDateTime(request.pcd_ngay, request.pcd_gio)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex justify-center space-x-2">
                                                        <button
                                                            onClick={() => handleViewDetails(request)}
                                                            className="text-primary-300 hover:text-primary-400"
                                                            title="Xem chi tiết"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>

                                                        {/* Nút nhập/xem kết quả */}
                                                        <button
                                                            onClick={() => handleCompleteService(request)}
                                                            disabled={loadingServices}
                                                            className={`${request.pcd_ngay && request.pcd_gio
                                                                    ? 'text-blue-400 hover:text-blue-300'
                                                                    : 'text-green-400 hover:text-green-300'
                                                                } ${loadingServices ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title={request.pcd_ngay && request.pcd_gio ? "Xem kết quả" : "Nhập kết quả"}
                                                        >
                                                            {loadingServices ? (
                                                                <i className="fas fa-spinner fa-spin"></i>
                                                            ) : (
                                                                <i className={request.pcd_ngay && request.pcd_gio ? "fas fa-file-alt" : "fas fa-edit"}></i>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {isDetailModalOpen && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                        <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
                            <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                                <h3 className="text-lg font-medium">
                                    Chi tiết phiếu chỉ định {selectedRequest.pcd_ma}
                                </h3>
                                <button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="text-white hover:text-gray-200"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                            Mã phiếu chỉ định
                                        </label>
                                        <p className="text-dark-text font-medium">{selectedRequest.pcd_ma}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                            Mã phiếu khám
                                        </label>
                                        <p className="text-dark-text font-medium">{selectedRequest.pk_ma}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                            Ngày khám
                                        </label>
                                        <p className="text-dark-text font-medium">{selectedRequest.pk_ngaykham}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                            Tổng tiền
                                        </label>
                                        <p className="text-green-400 font-bold text-lg">
                                            {formatCurrency(selectedRequest.pcd_tongtien)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                            Trạng thái
                                        </label>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(selectedRequest).className}`}>
                                            <i className={`${getStatusInfo(selectedRequest).icon} mr-1`}></i>
                                            {getStatusInfo(selectedRequest).text}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                            Thời gian hoàn thành
                                        </label>
                                        <p className="text-dark-text font-medium">
                                            {formatDateTime(selectedRequest.pcd_ngay, selectedRequest.pcd_gio)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-secondary-800 rounded-b-lg flex justify-end">
                                <button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="px-4 py-2 bg-secondary-700 text-dark-text rounded-md hover:bg-secondary-600 border border-dark-border"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Complete Service Modal */}
                {isCompleteServiceModalOpen && selectedRequest && selectedServices.length > 0 && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                            <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                                <h3 className="text-lg font-medium">
                                    {serviceResults ? 'Xem kết quả xét nghiệm' : 'Nhập kết quả xét nghiệm'} - Phiếu {selectedRequest.pcd_ma}
                                </h3>
                                <button
                                    onClick={handleCancelResults}
                                    className="text-white hover:text-gray-200"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <CompleteService
                                services={selectedServices}
                                pcd_ma={selectedRequest.pcd_ma}
                                results={serviceResults}
                                isViewOnly={!!(serviceResults && serviceResults.phieu_info.pcd_ngay && serviceResults.phieu_info.pcd_gio)}
                                onSave={handleSaveResults}
                                onCancel={handleCancelResults}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Laboratory;