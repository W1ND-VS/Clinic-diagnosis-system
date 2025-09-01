import React, { useState, useEffect } from 'react';
import api from '../../../../service/apiService';
import { toast } from 'react-toastify';
import ReportLayout from '../components/ReportLayout';
import SpecialtyReport from '../components/SpecialtyReport';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const SpecialtyReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [specialtyData, setSpecialtyData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Fetch dữ liệu báo cáo
  const fetchReportData = async (startDate, endDate) => {
    setLoading(true);
    try {
      const response = await api.get(`/baocao/chuyen-khoa?start_date=${startDate}&end_date=${endDate}`);

      if (response.data && response.data.success) {
        setSpecialtyData(response.data.data || []);
        setDateRange({ startDate, endDate });
      }
    } catch (error) {
      console.error('Error fetching specialty report:', error);
      toast.error('Không thể tải dữ liệu báo cáo chuyên khoa. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Load dữ liệu ban đầu
  useEffect(() => {
    // Dữ liệu mẫu khi API chưa sẵn sàng
    const generateSampleData = () => {
      const specialties = ['Nội tổng quát', 'Tim mạch', 'Tai mũi họng', 'Cơ xương khớp', 'Da liễu', 'Mắt'];

      // Dữ liệu đơn giản chỉ với name và caseCount
      const sampleSpecialtyData = specialties.map((specialty) => ({
        name: specialty,
        caseCount: Math.floor(Math.random() * 150) + 30
      }));

      setSpecialtyData(sampleSpecialtyData);
    };

    generateSampleData();
    fetchReportData(dateRange.startDate, dateRange.endDate);
  }, []);

  return (
    <ReportLayout
      title="Báo Cáo Ca Bệnh Theo Chuyên Khoa"
      onApplyFilter={fetchReportData}
      reportType="specialty-cases"
      loading={loading}
    >
      <SpecialtyReport
        data={specialtyData}
        loading={loading}
        dateRange={dateRange}
      />
    </ReportLayout>
  );
};

export default SpecialtyReportPage;