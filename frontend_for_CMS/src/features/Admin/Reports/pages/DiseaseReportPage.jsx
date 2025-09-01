import React, { useState, useEffect } from 'react';
import api from '../../../../service/apiService';
import { toast } from 'react-toastify';
import ReportLayout from '../components/ReportLayout';
import DiseaseReport from '../components/DiseaseReport';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const DiseaseReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [diseaseData, setDiseaseData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Fetch dữ liệu báo cáo
  const fetchReportData = async (startDate, endDate) => {
    setLoading(true);
    try {
      const response = await api.get(`/baocao/benh?start_date=${startDate}&end_date=${endDate}`);
      
      if (response.data && response.data.success) {
        setDiseaseData(response.data.data.most_common || []);
        setDateRange({ startDate, endDate });
      }
    } catch (error) {
      console.error('Error fetching disease report:', error);
      toast.error('Không thể tải dữ liệu báo cáo bệnh. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Load dữ liệu ban đầu 
  useEffect(() => {
    // Dữ liệu mẫu khi API chưa sẵn sàng
    fetchReportData(dateRange.startDate, dateRange.endDate);
  }, []);

  return (
    <ReportLayout 
      title="Báo Cáo Bệnh" 
      onApplyFilter={fetchReportData}
      reportType="diseases"
      loading={loading}
    >
      <DiseaseReport 
        data={diseaseData} 
        loading={loading} 
        dateRange={dateRange} 
      />
    </ReportLayout>
  );
};

export default DiseaseReportPage;