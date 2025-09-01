import React, { useState, useEffect } from 'react';
import api from '../../../../service/apiService';
import { toast } from 'react-toastify';
import ReportLayout from '../components/ReportLayout';
import DoctorReport from '../components/DoctorReport';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const DoctorReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [doctorData, setDoctorData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Fetch dữ liệu báo cáo
  const fetchReportData = async (startDate, endDate) => {
    setLoading(true);
    try {
      const response = await api.get(`/baocao/bac-si?start_date=${startDate}&end_date=${endDate}`);
      console.log("Doctor report response:", response.data);
      if (response.data && response.data.success) {
        setDoctorData(response.data.data || []);
        setDateRange({ startDate, endDate });
      }
    } catch (error) {
      console.error('Error fetching doctor report:', error);
      toast.error('Không thể tải dữ liệu báo cáo bác sĩ. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Load dữ liệu ban đầu
  useEffect(() => {
    // Dữ liệu mẫu khi API chưa sẵn sàng
    const generateSampleData = () => {
      const specialties = ['Nội tổng quát', 'Tim mạch', 'Tai mũi họng', 'Cơ xương khớp', 'Da liễu'];
      const doctors = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'];
      const sampleDoctorData = doctors.map(doctor => ({
        doctor_name: doctor,
        patientCount: Math.floor(Math.random() * 80) + 10,
        revenue: Math.floor(Math.random() * 40000000) + 5000000,
        specialty: specialties[Math.floor(Math.random() * specialties.length)]
      }));
      setDoctorData(sampleDoctorData);
    };

    generateSampleData();
    fetchReportData(dateRange.startDate, dateRange.endDate);
    
  }, []);

  return (
    <ReportLayout 
      title="Báo Cáo Bác Sĩ" 
      onApplyFilter={fetchReportData}
      reportType="doctors"
      loading={loading}
    >
      <DoctorReport 
        data={doctorData} 
        loading={loading} 
      />
    </ReportLayout>
  );
};

export default DoctorReportPage;