import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LabelList, Sector
} from 'recharts';

const SpecialtyReport = ({ data, loading, dateRange }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [sortBy, setSortBy] = useState('caseCount'); // 'caseCount' hoặc 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' hoặc 'desc'

  // Sort và xử lý dữ liệu
  const processedData = useMemo(() => {
    // Tạo bản sao của dữ liệu để không ảnh hưởng đến dữ liệu gốc
    const sortedData = [...data];

    // Sắp xếp dữ liệu theo tiêu chí đã chọn
    sortedData.sort((a, b) => {
      if (sortBy === 'caseCount') {
        return sortOrder === 'asc' ? a.caseCount - b.caseCount : b.caseCount - a.caseCount;
      } else {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
    });

    return sortedData;
  }, [data, sortBy, sortOrder]);

  // Tạo dữ liệu cho biểu đồ tròn (nhóm chuyên khoa nhỏ)
  const pieChartData = useMemo(() => {
    if (!data.length) return [];

    // Sắp xếp dữ liệu theo số ca bệnh giảm dần
    const sortedData = [...data].sort((a, b) => b.caseCount - a.caseCount);

    // Lấy top 5 chuyên khoa
    const topSpecialties = sortedData.slice(0, 5);

    // Nhóm các chuyên khoa còn lại vào "Khác"
    const otherSpecialties = sortedData.slice(5);

    // Tính tổng số ca bệnh của các chuyên khoa còn lại
    const otherCaseCount = otherSpecialties.reduce((sum, item) => sum + item.caseCount, 0);

    // Tạo dữ liệu cho biểu đồ
    const result = [...topSpecialties];

    // Thêm nhóm "Khác" nếu có
    if (otherSpecialties.length > 0) {
      result.push({
        name: 'Khác',
        caseCount: otherCaseCount,
        isGroup: true,
        details: otherSpecialties
      });
    }

    return result;
  }, [data]);

  // Tổng số ca bệnh
  const totalCases = data.reduce((sum, item) => sum + item.caseCount, 0);

  // Tìm chuyên khoa có số ca bệnh nhiều nhất
  const topSpecialty = data.length > 0
    ? [...data].sort((a, b) => b.caseCount - a.caseCount)[0]
    : null;

  // Tìm chuyên khoa có số ca bệnh thấp nhất
  const bottomSpecialty = data.length > 0
    ? [...data].sort((a, b) => a.caseCount - b.caseCount)[0]
    : null;

  // Màu sắc đẹp và tương phản cao cho biểu đồ
  const COLORS = [
    '#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6',
    '#1abc9c', '#d35400', '#27ae60', '#8e44ad', '#c0392b',
    '#16a085', '#f1c40f', '#2980b9', '#e67e22', '#7f8c8d'
  ];

  // Chức năng sắp xếp bảng
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Xử lý khi di chuột qua biểu đồ tròn
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Tùy chỉnh label cho biểu đồ tròn
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Chỉ hiển thị nhãn cho các phân khúc lớn
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#cccccc"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} (${(percent * 100).toFixed(1)}%)`}
      </text>
    );
  };

  // Tùy chỉnh tooltip cho biểu đồ
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-secondary-800 border border-dark-border p-3 rounded shadow-lg">
          <p className="font-medium text-sm text-white mb-1">{data.name}</p>
          <p className="text-sm text-primary-300">{`${data.caseCount} ca bệnh`}</p>
          <p className="text-xs text-gray-300 mt-1">{`${(data.caseCount / totalCases * 100).toFixed(1)}%`}</p>
          {data.isGroup && data.details && (
            <div className="mt-2 pt-2 border-t border-dark-border">
              <p className="text-xs text-gray-400 mb-1">Bao gồm:</p>
              <div className="max-h-40 overflow-y-auto">
                {data.details.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs py-1">
                    <span className="text-gray-300">{item.name}</span>
                    <span className="text-primary-300 ml-3">{item.caseCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Tùy chỉnh hiệu ứng active cho biểu đồ tròn
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.9}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius - 4}
          outerRadius={innerRadius - 1}
          fill="#fff"
        />
      </g>
    );
  };

  return (
    <>
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tổng số ca bệnh */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Tổng số ca bệnh</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1">{totalCases}</h3>
              <p className="text-xs text-dark-textSecondary mt-2">
                Trong khoảng thời gian báo cáo
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-900 bg-opacity-20">
              <i className="fas fa-file-medical-alt text-blue-400 text-xl"></i>
            </div>
          </div>
        </div>

        {/* Chuyên khoa có nhiều ca nhất */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Chuyên khoa nhiều ca nhất</p>
              <h3 className="text-xl font-bold text-green-400 mt-1">{topSpecialty?.name || 'N/A'}</h3>
              <p className="text-xs text-dark-textSecondary mt-2">
                {topSpecialty ? `${topSpecialty.caseCount} ca (${Math.round(topSpecialty.caseCount / totalCases * 100)}%)` : ''}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-900 bg-opacity-20">
              <i className="fas fa-award text-green-400 text-xl"></i>
            </div>
          </div>
        </div>

        {/* Chuyên khoa có ít ca nhất */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Chuyên khoa ít ca nhất</p>
              <h3 className="text-xl font-bold text-yellow-400 mt-1">{bottomSpecialty?.name || 'N/A'}</h3>
              <p className="text-xs text-dark-textSecondary mt-2">
                {bottomSpecialty ? `${bottomSpecialty.caseCount} ca (${Math.round(bottomSpecialty.caseCount / totalCases * 100)}%)` : ''}
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-900 bg-opacity-20">
              <i className="fas fa-chart-line text-yellow-400 text-xl"></i>
            </div>
          </div>
        </div>

        {/* Số lượng chuyên khoa */}
        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-dark-textSecondary text-sm">Số lượng chuyên khoa</p>
              <h3 className="text-2xl font-bold text-purple-400 mt-1">{data.length}</h3>
              <p className="text-xs text-dark-textSecondary mt-2">
                Có dữ liệu ca bệnh
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-900 bg-opacity-20">
              <i className="fas fa-hospital-alt text-purple-400 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="bg-dark-card rounded-lg shadow mb-6 border border-dark-border">
        <div className="p-4 border-b border-dark-border flex justify-between items-center">
          <h2 className="text-lg font-medium text-dark-text">Biểu đồ thống kê ca bệnh theo chuyên khoa</h2>
          <div className="flex space-x-2">
            <select
              className="bg-secondary-800 border border-dark-border rounded text-sm px-2 py-1 text-dark-text"
              onChange={(e) => setSortOrder(e.target.value)}
              value={sortOrder}
            >
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>
        </div>
        <div className="p-4 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-3"></div>
              <p className="text-dark-textSecondary">Đang tải dữ liệu báo cáo...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Biểu đồ tròn */}
              <div>
                <h3 className="text-lg font-medium text-dark-text mb-4 text-center">Phân bố ca bệnh theo chuyên khoa</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={120}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="caseCount"
                      nameKey="name"
                      label={renderCustomizedLabel}
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ paddingLeft: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Biểu đồ cột (thanh) */}
              <div>
                <h3 className="text-lg font-medium text-dark-text mb-4 text-center">Số ca bệnh theo chuyên khoa</h3>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart
                    data={pieChartData} // Đổi từ processedData sang pieChartData
                    margin={{ top: 10, right: 30, left: 120, bottom: 30 }}
                    layout="vertical"
                    barSize={20}
                    barGap={2}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      stroke="#aaa"
                      tickFormatter={(value) => new Intl.NumberFormat().format(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#aaa"
                      width={120}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }}
                      formatter={(value) => [new Intl.NumberFormat().format(value), 'Số ca bệnh']}
                    />
                    <Bar
                      dataKey="caseCount"
                      name="Số ca bệnh"
                      radius={[0, 4, 4, 0]}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <LabelList
                        dataKey="caseCount"
                        position="right"
                        fill="#aaa"
                        formatter={(value) => new Intl.NumberFormat().format(value)}
                      />
                    </Bar>
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
          <h2 className="text-lg font-medium text-dark-text">Thống kê ca bệnh theo chuyên khoa</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-border">
            <thead className="bg-secondary-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Chuyên khoa
                    {sortBy === 'name' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('caseCount')}
                >
                  <div className="flex items-center">
                    Số ca bệnh
                    {sortBy === 'caseCount' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Phần trăm
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  Biểu đồ
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-card divide-y divide-dark-border">
              {processedData.map((item, index) => {
                const percentage = Math.round((item.caseCount / totalCases) * 100);
                const maxCaseCount = Math.max(...data.map(d => d.caseCount));
                const widthPercentage = Math.max(Math.round((item.caseCount / maxCaseCount) * 100), 5);

                return (
                  <tr
                    key={index}
                    className={`hover:bg-secondary-900 transition-colors ${index % 2 === 0 ? 'bg-secondary-800 bg-opacity-20' : ''}`}
                  >
                    <td className="px-6 py-3 text-sm text-dark-text whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-dark-textSecondary whitespace-nowrap">
                      {new Intl.NumberFormat().format(item.caseCount)}
                    </td>
                    <td className="px-6 py-3 text-sm text-dark-textSecondary whitespace-nowrap">
                      {`${percentage}%`}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center">
                        <div className="w-full bg-secondary-800 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${widthPercentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          ></div>
                        </div>
                      </div>
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

export default SpecialtyReport;
