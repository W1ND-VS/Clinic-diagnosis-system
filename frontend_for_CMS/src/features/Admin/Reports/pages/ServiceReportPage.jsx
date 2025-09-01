import React, { useState, useEffect } from "react";
import api from "../../../../service/apiService";
import { toast } from "react-toastify";
import ReportLayout from "../components/ReportLayout";
import ServiceReport from "../components/ServiceReport";
import { format, startOfMonth, endOfMonth } from "date-fns";

const SAMPLE_SERVICE_DATA = [
    { service_name: "Xét nghiệm máu", usage_count: 120 },
    { service_name: "Siêu âm", usage_count: 95 },
    { service_name: "Chụp X-quang", usage_count: 80 },
    { service_name: "Khám tổng quát", usage_count: 60 },
    { service_name: "Điện tim", usage_count: 45 },
    { service_name: "Nội soi", usage_count: 30 },
];

const ServiceReportPage = () => {
    const [loading, setLoading] = useState(false);
    const [serviceData, setServiceData] = useState(SAMPLE_SERVICE_DATA); // Sử dụng dữ liệu mẫu mặc định
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    });

    const fetchReportData = async (startDate, endDate) => {
        setLoading(true);
        try {
            const response = await api.get(
                `/baocao/dich-vu?start_date=${startDate}&end_date=${endDate}`
            );
            if (response.data && response.data.success) {
                setServiceData(response.data.data || []);
                setDateRange({ startDate, endDate });
            }
        } catch (error) {
            toast.error(
                "Không thể tải dữ liệu báo cáo dịch vụ. Vui lòng thử lại!"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData(dateRange.startDate, dateRange.endDate);
    }, []);

    return (
        <ReportLayout
            title="Báo Cáo Dịch Vụ Y Tế"
            onApplyFilter={fetchReportData}
            reportType="service"
            loading={loading}
        >
            <ServiceReport data={serviceData} loading={loading} />
        </ReportLayout>
    );
};

export default ServiceReportPage;