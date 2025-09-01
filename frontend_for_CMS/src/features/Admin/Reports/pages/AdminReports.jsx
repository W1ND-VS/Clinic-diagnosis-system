import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../../../layouts/AdminSidebar';
import PageHeader from '../../../../layouts/PageHeader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminReports = () => {
  const navigate = useNavigate();

  // Danh sách các báo cáo
  const reportTypes = [
    {
      id: 'revenue',
      title: 'Doanh thu',
      description: 'Báo cáo doanh thu theo thời gian',
      icon: 'fas fa-chart-line',
      path: '/admin/reports/revenue'
    },
    {
      id: 'patients',
      title: 'Bệnh nhân',
      description: 'Báo cáo số lượng bệnh nhân theo thời gian',
      icon: 'fas fa-user-injured',
      path: '/admin/reports/patients'
    },
    {
      id: 'diseases',
      title: 'Bệnh',
      description: 'Báo cáo thống kê các loại bệnh',
      icon: 'fas fa-disease',
      path: '/admin/reports/diseases'
    },
    {
      id: 'specialty',
      title: 'Chuyên khoa',
      description: 'Báo cáo theo từng chuyên khoa',
      icon: 'fas fa-stethoscope',
      path: '/admin/reports/specialties'
    },
    {
      id: 'doctors',
      title: 'Bác sĩ',
      description: 'Báo cáo theo từng bác sĩ',
      icon: 'fas fa-user-md',
      path: '/admin/reports/doctors'
    }
  ];

  // Thống kê tổng quan (có thể thêm sau)
  const overviewStats = [
    { title: 'Doanh thu tháng này', value: '425.000.000 đ', icon: 'fas fa-money-bill-wave', change: '+12.5%', color: 'text-green-500' },
    { title: 'Số bệnh nhân tháng này', value: '385', icon: 'fas fa-users', change: '+8.3%', color: 'text-green-500' },
    { title: 'Tỉ lệ chuyển đổi', value: '92.4%', icon: 'fas fa-percentage', change: '+1.2%', color: 'text-green-500' },
    { title: 'Chuyên khoa hot nhất', value: 'Nội tổng quát', icon: 'fas fa-award', change: '', color: 'text-blue-500' }
  ];

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          <ToastContainer position="top-right" autoClose={3000} />

          <PageHeader
            title="Báo Cáo & Thống Kê"
            breadcrumbs={["Admin", "Báo cáo"]}
          />

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {overviewStats.map((stat, index) => (
              <div key={index} className="bg-dark-card rounded-lg shadow p-4 border border-dark-border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-dark-textSecondary">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-dark-text mt-1">{stat.value}</h3>
                    {stat.change && (
                      <p className={`text-xs mt-1 ${stat.color} flex items-center`}>
                        {stat.change.includes('+') ? <i className="fas fa-arrow-up mr-1"></i> : <i className="fas fa-arrow-down mr-1"></i>}
                        {stat.change} so với tháng trước
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-primary bg-opacity-20 rounded-full">
                    <i className={`${stat.icon} text-primary-300 text-xl`}></i>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Danh sách loại báo cáo */}
          <h3 className="text-lg font-medium text-dark-text mb-4">Chọn loại báo cáo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {reportTypes.map(report => (
              <div
                key={report.id}
                onClick={() => navigate(report.path)}
                className="bg-dark-card rounded-lg shadow p-4 border border-dark-border hover:bg-secondary-900 transition-colors cursor-pointer"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-primary bg-opacity-20 rounded-full mr-4">
                    <i className={`${report.icon} text-primary-300 text-xl`}></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-dark-text">{report.title}</h3>
                    <p className="text-sm text-dark-textSecondary">{report.description}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="text-primary-300 hover:text-primary-400">
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;