import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../../../layouts/AdminSidebar';
import PageHeader from '../../../../layouts/PageHeader';
import api from '../../../../service/apiService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isValid } from 'date-fns';

const ReportLayout = ({
    title,
    children,
    onApplyFilter,
    reportType,
    loading,
    breadcrumbs = ["Admin", "Báo cáo"]
}) => {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });

    // Xử lý chọn khoảng thời gian có sẵn
    const handleSelectTimeRange = (range) => {
        const today = new Date();
        let start, end;

        switch (range) {
            case 'thisMonth':
                start = startOfMonth(today);
                end = endOfMonth(today);
                break;
            case 'lastMonth':
                start = startOfMonth(subMonths(today, 1));
                end = endOfMonth(subMonths(today, 1));
                break;
            case 'last3Months':
                start = startOfMonth(subMonths(today, 2));
                end = endOfMonth(today);
                break;
            default:
                return;
        }

        const newDateRange = {
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd')
        };

        setDateRange(newDateRange);
        onApplyFilter(newDateRange.startDate, newDateRange.endDate);
    };

    // Xử lý thay đổi ngày tháng
    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Xử lý áp dụng filter
    const handleApplyFilter = () => {
        if (!isValid(parseISO(dateRange.startDate)) || !isValid(parseISO(dateRange.endDate))) {
            toast.error('Ngày không hợp lệ!');
            return;
        }
        onApplyFilter(dateRange.startDate, dateRange.endDate);
    };

    // Xử lý xuất báo cáo
    const handleExportReport = async (format) => {
        try {
            const endpoint = `/reports/export?type=${reportType}&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}&format=${format}`;

            const response = await api.get(endpoint, { responseType: 'blob' });

            // Tạo URL và download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report-${reportType}-${dateRange.startDate}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success(`Xuất báo cáo dạng ${format.toUpperCase()} thành công!`);
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Không thể xuất báo cáo. Vui lòng thử lại!');
        }
    };

    return (
        <div className="flex h-screen bg-dark-bg overflow-hidden">
            <AdminSidebar />
            <div className="flex-1 overflow-auto">
                <div className="p-4 md:p-6">
                    <ToastContainer position="top-right" autoClose={3000} />

                    <PageHeader
                        title={title}
                        breadcrumbs={[...breadcrumbs, title]}
                    >
                        <button onClick={() => navigate('/admin/reports')}
                            className="px-3 py-2 bg-secondary-800 text-dark-text rounded-md hover:bg-secondary-700 mr-2">
                            <i className="fas fa-arrow-left mr-2"></i> Quay lại
                        </button>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleExportReport('pdf')}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                                disabled={loading}
                            >
                                <i className="fas fa-file-pdf mr-2"></i> Xuất PDF
                            </button>
                            <button
                                onClick={() => handleExportReport('excel')}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                                disabled={loading}
                            >
                                <i className="fas fa-file-excel mr-2"></i> Xuất Excel
                            </button>
                        </div>
                    </PageHeader>

                    {/* Lọc theo thời gian */}
                    <div className="bg-dark-card rounded-lg shadow p-4 mb-6 border border-dark-border">
                        <h3 className="text-lg font-medium text-dark-text mb-4">Khoảng thời gian</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <button
                                onClick={() => handleSelectTimeRange('thisMonth')}
                                className="py-2 px-4 bg-secondary-800 hover:bg-secondary-700 rounded-md border border-dark-border text-sm"
                            >
                                Tháng này
                            </button>
                            <button
                                onClick={() => handleSelectTimeRange('lastMonth')}
                                className="py-2 px-4 bg-secondary-800 hover:bg-secondary-700 rounded-md border border-dark-border text-sm"
                            >
                                Tháng trước
                            </button>
                            <button
                                onClick={() => handleSelectTimeRange('last3Months')}
                                className="py-2 px-4 bg-secondary-800 hover:bg-secondary-700 rounded-md border border-dark-border text-sm"
                            >
                                3 tháng gần nhất
                            </button>
                        </div>

                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                    Từ ngày
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={dateRange.startDate}
                                    onChange={handleDateChange}
                                    className="rounded-md border-dark-border bg-secondary-800 text-dark-text"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                                    Đến ngày
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={dateRange.endDate}
                                    onChange={handleDateChange}
                                    className="rounded-md border-dark-border bg-secondary-800 text-dark-text"
                                />
                            </div>

                            <button
                                onClick={handleApplyFilter}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 flex items-center h-[38px]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                                ) : (
                                    <i className="fas fa-filter mr-2"></i>
                                )}
                                Áp dụng
                            </button>
                        </div>
                    </div>

                    {/* Nội dung báo cáo */}
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ReportLayout;