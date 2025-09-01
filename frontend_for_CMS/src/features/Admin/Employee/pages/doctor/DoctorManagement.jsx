import React, { useState, useEffect } from 'react';
import PatientSidebar from '../../../../../layouts/PatientSidebar';
import AdminSidebar from '../../../../../layouts/AdminSidebar';
import PageHeader from '../../../../../layouts/PageHeader';
import DoctorList from '../../components/doctor/DoctorList';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import api from '../../../../../service/apiService';
import { toast, ToastContainer } from 'react-toastify';
import { Link } from 'react-router-dom';

const DoctorManagement = ({ isPatientView = false }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [specialties, setSpecialties] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 10;

  // Fetch doctors and specialties on component mount
  useEffect(() => {

    Promise.all([fetchSpecialties(), fetchDoctors()]);
  }, []);

  // Fetch doctors when filters change
  useEffect(() => {
    fetchDoctors();
  }, [currentPage, searchQuery, selectedSpecialty]);

  // Fetch specialties for filtering
  const fetchSpecialties = async () => {
    try {
      const response = await api.get('/chuyenkhoa/getall');
      if (response.data && response.data.data) {
        setSpecialties([
          { ck_ma: 'all', ck_ten: 'Tất cả chuyên khoa' },
          ...response.data.data
        ]);
      }
    } catch (error) {
      console.error('Error fetching specialties:', error);
      toast.error('Không thể tải danh sách chuyên khoa. Vui lòng thử lại!');
    }
  };

  // Fetch doctors based on filters
  const fetchDoctors = async () => {
    try {

      setLoading(true);
      const offset = (currentPage - 1) * recordsPerPage;

      let endpoint = `/bacsi/getall_paginated?offset=${offset}&limit=${recordsPerPage}`;

      // Add search filter
      if (searchQuery) {
        endpoint += `&search=${encodeURIComponent(searchQuery)}`;
      }

      // Add specialty filter
      if (selectedSpecialty !== 'all') {
        endpoint += `&ck_ma=${selectedSpecialty}`;
      }

      const response = await api.get(endpoint);

      if (response.data && response.data.data) {
        setDoctors(response.data.data.data || []);
        const total = response.data.data.total || 0;
        setTotalPages(Math.ceil(total / recordsPerPage));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Không thể tải danh sách bác sĩ. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Không cho phép xóa bác sĩ khi là bệnh nhân
  const handleDeleteDoctor = async () => { };

  // Open delete modal
  const openDeleteModal = (doctor) => {
    if (!isPatientView) {
      setCurrentDoctor(doctor);
      setShowDeleteModal(true);
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {isPatientView ? <PatientSidebar /> : <AdminSidebar />}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          <ToastContainer position="top-right" autoClose={3000} />

          <PageHeader
            title={isPatientView ? "Danh Sách Bác Sĩ" : "Quản Lý Bác Sĩ"}
            breadcrumbs={isPatientView ? ["Bệnh nhân", "Danh sách bác sĩ"] : ["Admin", "Quản lý nhân viên", "Bác sĩ"]}
          >
            {!isPatientView && (
              <Link to="/admin/employee/doctor/add">
                <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 flex items-center">
                  <i className="fas fa-plus mr-2"></i> Thêm bác sĩ
                </button>
              </Link>
            )}
          </PageHeader>

          {/* Search and filter */}
          <div className="bg-dark-card rounded-lg shadow p-4 mb-6 border border-dark-border">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-2 pl-10 pr-4 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                    placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page when search changes
                    }}
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-dark-textSecondary"></i>
                </div>
              </div>

              {/* Specialty filter */}
              <div>
                <select
                  className="p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text"
                  value={selectedSpecialty}
                  onChange={(e) => {
                    setSelectedSpecialty(e.target.value);
                    setCurrentPage(1); // Reset to first page when filter changes
                  }}
                >
                  {specialties.map(specialty => (
                    <option key={specialty.ck_ma} value={specialty.ck_ma}>
                      {specialty.ck_ten}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Doctor list */}
          <DoctorList
            doctors={doctors}
            loading={loading}
            onDelete={openDeleteModal}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Không hiển thị modal xóa khi là bệnh nhân */}
      {!isPatientView && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteDoctor}
          title="Xóa bác sĩ"
          message={`Bạn có chắc chắn muốn xóa bác sĩ ${currentDoctor?.nv_hoten || ''}? Hành động này không thể hoàn tác.`}
        />
      )}
    </div>
  );
};

export default DoctorManagement;