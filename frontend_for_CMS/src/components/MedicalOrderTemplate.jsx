import React from 'react';

const MedicalOrderTemplate = ({ patient, services }) => {
    return (
        <div className="p-8 bg-white">
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold">PHÒNG KHÁM NHA KHOA</h1>
                <p className="text-sm">Địa chỉ: 123 Đường ABC, Quận XYZ, TP.Cần Thơ</p>
                <p className="text-sm">Điện thoại: 0123.456.789</p>
                <h2 className="text-lg font-bold mt-4 uppercase">Phiếu chỉ định dịch vụ</h2>
            </div>

            <div className="space-y-2 mb-6 text-sm">
                <p><span className="font-medium w-24 inline-block">Họ và tên:</span> {patient?.bn_hoten || '_______________'}</p>
                <p><span className="font-medium w-24 inline-block">Giới tính:</span> {patient?.bn_gioitinh || '____'}</p>
                <p><span className="font-medium w-24 inline-block">Ngày sinh:</span> {patient?.bn_ngaysinh || '__/__/____'}</p>
            </div>

            <table className="w-full border-collapse border border-gray-400 mb-6 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2">STT</th>
                        <th className="border border-gray-400 p-2">Tên dịch vụ</th>
                        <th className="border border-gray-400 p-2">Ghi chú</th>
                        <th className="border border-gray-400 p-2">Đơn giá</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((service, index) => (
                        <tr key={index}>
                            <td className="border border-gray-400 p-2 text-center">{index + 1}</td>
                            <td className="border border-gray-400 p-2">{service.dvyt_ten}</td>
                            <td className="border border-gray-400 p-2">{service.ghi_chu}</td>
                            <td className="border border-gray-400 p-2 text-right">
                                {service.don_gia?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="text-right text-sm">
                <p className="font-bold">
                    Tổng cộng: {services.reduce((sum, service) => sum + (service.don_gia || 0), 0)
                        .toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                </p>
            </div>

            <div className="mt-8 text-sm">
                <div className="text-right">
                    <p>Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                    <p className="mt-4 font-bold">Bác sĩ chỉ định</p>
                    <p className="mt-20 font-medium">BS. Nguyễn Văn A</p>
                </div>
            </div>
        </div>
    );
};

export default MedicalOrderTemplate;