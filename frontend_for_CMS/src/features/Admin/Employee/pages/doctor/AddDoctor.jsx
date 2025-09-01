// features/Admin/Employee/pages/doctor/AddDoctor.jsx
import React from 'react';
import AdminSidebar from '../../../../../layouts/AdminSidebar';
import PageHeader from '../../../../../layouts/PageHeader';
import DoctorForm from '../../components/doctor/DoctorForm';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const AddDoctor = () => {
    const navigate = useNavigate();

    const handleSuccess = () => {
        toast.success('Thêm bác sĩ thành công!');
        // Delay navigation để người dùng thấy thông báo
        setTimeout(() => navigate('/admin/employee/doctor'), 1500);
    };

    return (
        <div className="flex h-screen bg-dark-bg overflow-hidden">
            <AdminSidebar />
            <div className="flex-1 overflow-auto">
                <div className="p-4 md:p-6">
                    <ToastContainer position="top-right" autoClose={3000} />

                    <PageHeader
                        title="Thêm Bác Sĩ Mới"
                        breadcrumbs={["Admin", "Quản lý nhân viên", "Bác sĩ", "Thêm mới"]}
                        backButton={true}
                        backButtonLink="/admin/employee/doctor"
                    />

                    <div className="mt-6">
                        <DoctorForm onSuccess={handleSuccess} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddDoctor;