import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

const PatientReport = ({ data, loading, dateRange }) => {
  console.log("Rendering PatientReport with data:", data, "loading:", loading, "dateRange:", dateRange);
  // Tính tổng số bệnh nhân
  const totalPatients = data.reduce((sum, item) => sum + item.count, 0);
  const avgPatientsPerDay = Math.round(totalPatients / (data.length || 1));

  return (
    <>
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tổng bệnh nhân */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Tổng số bệnh nhân</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1">{totalPatients}</h3>
            </div>
            <div className="p-3 rounded-full bg-blue-900 bg-opacity-20">
              <i className="fas fa-user-injured text-blue-400"></i>
            </div>
          </div>
          <p className="text-xs text-dark-textSecondary mt-2">
            Khoảng thời gian: {dateRange.startDate} đến {dateRange.endDate}
          </p>
        </div>
        
        {/* Trung bình bệnh nhân mỗi ngày */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Trung bình bệnh nhân / ngày</p>
              <h3 className="text-2xl font-bold text-teal-400 mt-1">{avgPatientsPerDay}</h3>
            </div>
            <div className="p-3 rounded-full bg-teal-900 bg-opacity-20">
              <i className="fas fa-procedures text-teal-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="bg-dark-card rounded-lg shadow mb-6 border border-dark-border">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-lg font-medium text-dark-text">Biểu đồ số lượng bệnh nhân</h2>
        </div>
        <div className="p-4 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-3"></div>
              <p className="text-dark-textSecondary">Đang tải dữ liệu báo cáo...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }} />
                <Legend />
                <Bar dataKey="count" name="Số bệnh nhân" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-dark-card rounded-lg shadow border border-dark-border">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-lg font-medium text-dark-text">Số lượng bệnh nhân theo ngày</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-border">
            <thead className="bg-secondary-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Ngày
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Số bệnh nhân
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-card divide-y divide-dark-border">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-secondary-900">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                    {format(new Date(item.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                    {item.count}
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

export default PatientReport;