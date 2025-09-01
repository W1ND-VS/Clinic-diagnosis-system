import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DoctorReport = ({ data, loading }) => {
  // Format tiền tệ
  console.log("Rendering DoctorReport with data:", data, "loading:", loading);
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  // Tìm bác sĩ có số bệnh nhân nhiều nhất
  const topDoctor = data.length > 0 ? [...data].sort((a, b) => b.patientCount - a.patientCount)[0] : null;

  return (
    <>
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Bác sĩ hàng đầu */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Bác sĩ hàng đầu</p>
              <h3 className="text-xl font-bold text-purple-400 mt-1">{topDoctor?.doctor_name || 'N/A'}</h3>
            </div>
            <div className="p-3 rounded-full bg-purple-900 bg-opacity-20">
              <i className="fas fa-user-md text-purple-400"></i>
            </div>
          </div>
          <p className="text-xs text-dark-textSecondary mt-2">
            Dựa trên số lượng bệnh nhân
          </p>
        </div>
        
        {/* Tổng số bác sĩ */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Tổng số bác sĩ</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1">{data.length}</h3>
            </div>
            <div className="p-3 rounded-full bg-blue-900 bg-opacity-20">
              <i className="fas fa-user-md text-blue-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="bg-dark-card rounded-lg shadow mb-6 border border-dark-border">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-lg font-medium text-dark-text">Biểu đồ thống kê theo bác sĩ</h2>
        </div>
        <div className="p-4 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-3"></div>
              <p className="text-dark-textSecondary">Đang tải dữ liệu báo cáo...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-dark-text mb-4">Số lượng bệnh nhân theo bác sĩ</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis type="number" stroke="#aaa" />
                    <YAxis type="category" dataKey="doctor_name" stroke="#aaa" width={120} />
                    <Tooltip contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }} />
                    <Legend />
                    <Bar dataKey="patientCount" name="Số bệnh nhân" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-lg font-medium text-dark-text mb-4">Doanh thu theo bác sĩ</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis type="number" stroke="#aaa" />
                    <YAxis type="category" dataKey="doctor_name" stroke="#aaa" width={120} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }}
                      formatter={(value) => formatCurrency(value)} 
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Doanh thu" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-dark-card rounded-lg shadow border border-dark-border">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-lg font-medium text-dark-text">Thống kê theo bác sĩ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-border">
            <thead className="bg-secondary-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Bác sĩ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Chuyên khoa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Số bệnh nhân
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Doanh thu
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-card divide-y divide-dark-border">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-secondary-900">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                    {item.doctor_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                    {item.specialty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                    {item.patientCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                    {formatCurrency(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DoctorReport;