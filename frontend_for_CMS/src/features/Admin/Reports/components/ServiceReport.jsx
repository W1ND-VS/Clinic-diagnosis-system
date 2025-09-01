import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';

const COLORS = [
    '#36a2eb', '#4bc0c0', '#ff6384', '#ffcd56', '#9966ff',
    '#ff9f40', '#2ecc71', '#e67e22', '#1abc9c', '#c0392b'
];

const ServiceReport = ({ data = [], loading, dateRange }) => {
    // Tổng số lượt sử dụng dịch vụ
    const totalUsage = data.reduce((sum, item) => sum + item.usage_count, 0);

    // Top 5 dịch vụ
    const topServices = useMemo(() => {
        const sorted = [...data].sort((a, b) => b.usage_count - a.usage_count);
        return sorted.slice(0, 5);
    }, [data]);

    // Dịch vụ nhiều nhất, ít nhất
    const topService = topServices[0];
    const bottomService = topServices[topServices.length - 1];

    return (
        <>
            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Tổng lượt sử dụng */}
                <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-dark-textSecondary text-sm">Tổng lượt sử dụng dịch vụ</p>
                            <h3 className="text-2xl font-bold text-blue-400 mt-1">{totalUsage}</h3>
                            <p className="text-xs text-dark-textSecondary mt-2">
                                Khoảng thời gian: {dateRange?.startDate} đến {dateRange?.endDate}
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-900 bg-opacity-20">
                            <i className="fas fa-stethoscope text-blue-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                {/* Dịch vụ nhiều nhất */}
                <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-dark-textSecondary text-sm">Dịch vụ nhiều lượt nhất</p>
                            <h3 className="text-xl font-bold text-green-400 mt-1">{topService?.service_name || 'N/A'}</h3>
                            <p className="text-xs text-dark-textSecondary mt-2">
                                {topService ? `${topService.usage_count} lượt` : ''}
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-green-900 bg-opacity-20">
                            <i className="fas fa-award text-green-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                {/* Dịch vụ ít nhất */}
                <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-dark-textSecondary text-sm">Dịch vụ ít lượt nhất (top 5)</p>
                            <h3 className="text-xl font-bold text-yellow-400 mt-1">{bottomService?.service_name || 'N/A'}</h3>
                            <p className="text-xs text-dark-textSecondary mt-2">
                                {bottomService ? `${bottomService.usage_count} lượt` : ''}
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-yellow-900 bg-opacity-20">
                            <i className="fas fa-chart-line text-yellow-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                {/* Số lượng dịch vụ */}
                <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-dark-textSecondary text-sm">Số lượng dịch vụ</p>
                            <h3 className="text-2xl font-bold text-purple-400 mt-1">{data.length}</h3>
                            <p className="text-xs text-dark-textSecondary mt-2">
                                Có dữ liệu sử dụng
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-900 bg-opacity-20">
                            <i className="fas fa-hospital-alt text-purple-400 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Biểu đồ cột */}
            <div className="bg-dark-card rounded-lg shadow mb-6 border border-dark-border">
                <div className="p-4 border-b border-dark-border">
                    <h2 className="text-lg font-medium text-dark-text">Biểu đồ số lượt sử dụng dịch vụ (Top 5)</h2>
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
                                data={topServices}
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
                                    dataKey="service_name"
                                    stroke="#aaa"
                                    width={120}
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }}
                                    formatter={(value) => [new Intl.NumberFormat().format(value), 'Số lượt sử dụng']}
                                />
                                <Bar
                                    dataKey="usage_count"
                                    name="Số lượt sử dụng"
                                    radius={[0, 4, 4, 0]}
                                >
                                    {topServices.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    <LabelList
                                        dataKey="usage_count"
                                        position="right"
                                        fill="#aaa"
                                        formatter={(value) => new Intl.NumberFormat().format(value)}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Bảng dữ liệu */}
            <div className="bg-dark-card rounded-lg shadow border border-dark-border">
                <div className="p-4 border-b border-dark-border">
                    <h2 className="text-lg font-medium text-dark-text">Thống kê lượt sử dụng dịch vụ</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-dark-border">
                        <thead className="bg-secondary-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                    Dịch vụ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                    Số lượt sử dụng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                    Phần trăm
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-dark-card divide-y divide-dark-border">
                            {topServices.map((item, index) => {
                                const percentage = totalUsage ? Math.round((item.usage_count / totalUsage) * 100) : 0;
                                return (
                                    <tr key={index} className={`hover:bg-secondary-900 transition-colors ${index % 2 === 0 ? 'bg-secondary-800 bg-opacity-20' : ''}`}>
                                        <td className="px-6 py-3 text-sm text-dark-text whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-2 w-2 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                {item.service_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-dark-textSecondary whitespace-nowrap">
                                            {new Intl.NumberFormat().format(item.usage_count)}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-dark-textSecondary whitespace-nowrap">
                                            {`${percentage}%`}
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

export default ServiceReport;