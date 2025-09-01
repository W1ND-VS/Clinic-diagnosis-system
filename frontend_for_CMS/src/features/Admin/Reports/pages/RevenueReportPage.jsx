import React, { useState, useEffect } from 'react';
import api from '../../../../service/apiService';
import { toast } from 'react-toastify';
import ReportLayout from '../components/ReportLayout';
import RevenueReport from '../components/RevenueReport';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const RevenueReportPage = () => {
    const [loading, setLoading] = useState(false);
    const [revenueData, setRevenueData] = useState([]);
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });

    // Fetch dữ liệu báo cáo
    const fetchReportData = async (startDate, endDate) => {
        setLoading(true);
        try {
            const response = await api.get(`/baocao/doanh-thu?start_date=${startDate}&end_date=${endDate}`);

            if (response.data && response.data.success) {
                console.log('Revenue report data:', response.data.data);
                setRevenueData(response.data.data || []);
                setDateRange({ startDate, endDate });
            }
        } catch (error) {
            console.error('Error fetching revenue report:', error);
            toast.error('Không thể tải dữ liệu báo cáo doanh thu. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    // Load dữ liệu ban đầu
    useEffect(() => {
        // Dữ liệu mẫu khi API chưa sẵn sàng
       
        const generateSampleData = () => {
            const sampleRevenueData = Array.from({ length: 30 }, (_, i) => ({
                date: `2025-06-${String(i + 1).padStart(2, '0')}`,
                revenue: Math.floor(Math.random() * 5000000) + 1000000
            }));
            setRevenueData(sampleRevenueData);
        };

        generateSampleData();
        // Uncomment dòng dưới và comment hàm generateSampleData khi API đã sẵn sàng
        fetchReportData(dateRange.startDate, dateRange.endDate);
    }, []);

    return (
        <ReportLayout
            title="Báo Cáo Doanh Thu"
            onApplyFilter={fetchReportData}
            reportType="revenue"
            loading={loading}
        >
            <RevenueReport
                data={revenueData}
                loading={loading}
                dateRange={dateRange}
            />
        </ReportLayout>
    );
};

export default RevenueReportPage;