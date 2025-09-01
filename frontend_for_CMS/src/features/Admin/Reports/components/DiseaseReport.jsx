import React from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const DiseaseReport = ({ data, loading, dateRange }) => {
  // Màu sắc cho biểu đồ
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ff6361', '#bc5090'];
  console.log('DiseaseReport data:', data);
  
  // Tìm bệnh phổ biến nhất
  const topDisease = data.length > 0 ? [...data].sort((a, b) => b.count - a.count)[0] : null;

  return (
    <>
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Bệnh phổ biến nhất */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Bệnh phổ biến nhất</p>
              <h3 className="text-xl font-bold text-orange-400 mt-1">{topDisease?.name || 'N/A'}</h3>
            </div>
            <div className="p-3 rounded-full bg-orange-900 bg-opacity-20">
              <i className="fas fa-disease text-orange-400"></i>
            </div>
          </div>
          <p className="text-xs text-dark-textSecondary mt-2">
            Khoảng thời gian: {dateRange.startDate} đến {dateRange.endDate}
          </p>
        </div>
        
        {/* Tổng số bệnh đã điều trị */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Tổng số bệnh đã điều trị</p>
              <h3 className="text-2xl font-bold text-red-400 mt-1">{data.reduce((sum, item) => sum + item.count, 0)}</h3>
            </div>
            <div className="p-3 rounded-full bg-red-900 bg-opacity-20">
              <i className="fas fa-viruses text-red-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="bg-dark-card rounded-lg shadow mb-6 border border-dark-border">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-lg font-medium text-dark-text">Biểu đồ thống kê bệnh</h2>
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
                <h3 className="text-lg font-medium text-dark-text mb-4">Phân bố các loại bệnh</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }} 
                      formatter={(value, name, props) => [value, 'Số ca']} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-lg font-medium text-dark-text mb-4">Số ca bệnh</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis type="number" stroke="#aaa" />
                    <YAxis type="category" dataKey="name" stroke="#aaa" width={150} />
                    <Tooltip contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }} />
                    <Legend />
                    <Bar dataKey="count" name="Số ca" fill="#ff7c43" />
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
          <h2 className="text-lg font-medium text-dark-text">Thống kê các loại bệnh</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-border">
            <thead className="bg-secondary-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Tên bệnh
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Số ca
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Tỉ lệ
                </th>
              
              </tr>
            </thead>
            <tbody className="bg-dark-card divide-y divide-dark-border">
              {data.map((item, index) => {
                const totalCases = data.reduce((sum, item) => sum + item.count, 0);
                const percentage = totalCases > 0 ? ((item.count / totalCases) * 100).toFixed(1) : 0;
                
                return (
                  <tr key={index} className="hover:bg-secondary-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                      {percentage}%
                    </td>
                 
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DiseaseReport;