import React, { useState, useEffect } from 'react';
import api from '../../../../service/apiService';
import { toast } from 'react-toastify';
import ReportLayout from '../components/ReportLayout';
import PatientReport from '../components/PatientReport';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const PatientReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Fetch dữ liệu báo cáo
  const fetchReportData = async (startDate, endDate) => {
    setLoading(true);
    try {
      const response = await api.get(`baocao/benh-nhan-theo-ngay?start_date=${startDate}&end_date=${endDate}`);
      
      if (response.data && response.data.success) {
        setPatientData(response.data.data || []);
        setDateRange({ startDate, endDate });
      }
    } catch (error) {
      console.error('Error fetching patient report:', error);
      toast.error('Không thể tải dữ liệu báo cáo bệnh nhân. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Load dữ liệu ban đầu
  useEffect(() => {
    // Dữ liệu mẫu khi API chưa sẵn sàng
    const generateSampleData = () => {
      const samplePatientData = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-06-${String(i + 1).padStart(2, '0')}`,
        count: Math.floor(Math.random() * 30) + 5
      }));
      setPatientData(samplePatientData);
    };

    generateSampleData();
    fetchReportData(dateRange.startDate, dateRange.endDate);
  }, []);

  return (
    <ReportLayout 
      title="Báo Cáo Bệnh Nhân" 
      onApplyFilter={fetchReportData}
      reportType="patients"
      loading={loading}
    >
      <PatientReport 
        data={patientData} 
        loading={loading} 
        dateRange={dateRange} 
      />
    </ReportLayout>
  );
};

export default PatientReportPage;