// features/Admin/Employee/pages/doctor/EditDoctor.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminSidebar from '../../../../../layouts/AdminSidebar';
import PageHeader from '../../../../../layouts/PageHeader';
import DoctorForm from '../../components/doctor/DoctorForm';
import api from '../../../../../service/apiService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditDoctor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/bacsi/${id}`);

                if (response.data && response.data.data) {
                    setDoctor(response.data.data);
                } else {
                    setError('Không thể tải thông tin bác sĩ');
                }
            } catch (err) {
                console.error('Error fetching doctor:', err);
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        fetchDoctor();
    }, [id]);

    const handleSuccess = () => {
        toast.success('Cập nhật bác sĩ thành công!');
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
                        title="Chỉnh sửa thông tin bác sĩ"
                        breadcrumbs={["Admin", "Quản lý nhân viên", "Bác sĩ", "Chỉnh sửa"]}
                        backButton={true}
                        backButtonLink="/admin/employee/doctor"
                    />

                    <div className="mt-6">
                        {loading ? (
                            <div className="bg-dark-card rounded-lg p-6 border border-dark-border text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-3"></div>
                                <p className="text-dark-textSecondary">Đang tải thông tin bác sĩ...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-dark-card rounded-lg p-6 border border-red-700 text-center">
                                <div className="text-red-500 mb-3">
                                    <i className="fas fa-exclamation-triangle text-3xl"></i>
                                </div>
                                <p className="text-dark-text mb-4">{error}</p>
                                <Link
                                    to="/admin/employee/doctor"
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 inline-block"
                                >
                                    Quay lại danh sách
                                </Link>
                            </div>
                        ) : (
                            <DoctorForm
                                onSuccess={handleSuccess}
                                initialData={doctor}
                                isEditing={true}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditDoctor;