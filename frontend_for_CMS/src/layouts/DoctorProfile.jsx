import DoctorSidebar from "./DoctorSidebar";
import { useState, useEffect } from "react";
import api from "../service/apiService";

const DoctorProfile = () => {
    const [doctor, setDoctor] = useState(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const nv_ma = userData.bs_ma || userData.nv_ma;
        if (nv_ma) {
            api.get(`/bacsi/${nv_ma}`).then(res => {
                if (res.data?.success && res.data?.data) {
                    setDoctor(res.data.data);
                }
            });
        }
    }, []);

    return (
        <div className="flex min-h-screen bg-dark-bg">
            <DoctorSidebar />
            <div className="flex-1 flex justify-center items-start">
                {!doctor ? (
                    <div className="p-4">Đang tải thông tin...</div>
                ) : (
                    <div className="p-4 max-w-xl mx-auto bg-white rounded shadow text-gray-900 mt-8">
                        <h1 className="text-2xl font-bold mb-4">Thông tin cá nhân bác sĩ</h1>
                        <p><b>Mã bác sĩ:</b> {doctor.nv_ma}</p>
                        <p><b>Họ tên:</b> {doctor.nv_hoten}</p>
                        <p><b>Giới tính:</b> {doctor.nv_gioitinh}</p>
                        <p><b>Ngày sinh:</b> {doctor.nv_ngaysinh}</p>
                        <p><b>Bằng cấp chuyên môn:</b> {doctor.bs_bcapchuyenmon}</p>
                        <p><b>Cơ sở đào tạo:</b> {doctor.bs_csdaotao}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorProfile;

localStorage.setItem('user_data', JSON.stringify({
    role: 'doctor',
    nv_ma: 'BS000011', // hoặc bs_ma: 'BS000011'
    // ...các trường khác
}));