import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../../../layouts/AdminSidebar';
import PageHeader from '../../../../layouts/PageHeader';
import api from '../../../../service/apiService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReceptionistManagement = () => {
  const navigate = useNavigate();
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 10;

  // Modal states - giữ lại để sử dụng sau
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentReceptionist, setCurrentReceptionist] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    nv_hoten: '',
    nv_email: '',
    nv_sdt: '',
    nv_diachi: '',
    nv_ngaysinh: '',
    nv_gioitinh: 'Nam',
    nv_matkhau: ''
  });

  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchReceptionists();
  }, []);

  // Fetch receptionists with pagination
  const fetchReceptionists = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * recordsPerPage;

      let endpoint = `/tieptan/getall?offset=${offset}&limit=${recordsPerPage}`;
      if (searchQuery) {
        endpoint += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await api.get(endpoint);

      if (response.data && response.data.data) {
        setReceptionists(response.data.data || []);
        const total = response.data.total || 0;
        setTotalPages(Math.ceil(total / recordsPerPage));
      }
    } catch (error) {
      console.error('Error fetching receptionists:', error);
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  useEffect(() => {
    fetchReceptionists();
  }, [currentPage, searchQuery]);

  // Phần còn lại giữ nguyên
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle adding new receptionist
  const handleAddReceptionist = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/tieptan', formData);
      if (response.data && response.data.success) {
        toast.success('Thêm tiếp tân thành công!');
        setShowAddModal(false);
        setFormData({
          nv_hoten: '',
          nv_email: '',
          nv_sdt: '',
          nv_diachi: '',
          nv_ngaysinh: '',
          nv_gioitinh: 'Nam',
          nv_matkhau: ''
        });
        fetchReceptionists();
      }
    } catch (error) {
      console.error('Error adding receptionist:', error);
      toast.error(error.response?.data?.message || 'Thêm tiếp tân thất bại. Vui lòng thử lại!');
    }
  };

  // Handle editing receptionist
  const handleEditReceptionist = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/tieptan/${currentReceptionist.nv_ma}`, formData);
      if (response.data && response.data.success) {
        toast.success('Cập nhật thông tin tiếp tân thành công!');
        setShowEditModal(false);
        fetchReceptionists();
      }
    } catch (error) {
      console.error('Error updating receptionist:', error);
      toast.error(error.response?.data?.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại!');
    }
  };

  // Handle deleting receptionist
  const handleDeleteReceptionist = async () => {
    try {
      const response = await api.delete(`/tieptan/${currentReceptionist.nv_ma}`);
      if (response.data && response.data.success) {
        toast.success('Xóa tiếp tân thành công!');
        setShowDeleteModal(false);
        fetchReceptionists();
      }
    } catch (error) {
      console.error('Error deleting receptionist:', error);
      toast.error(error.response?.data?.message || 'Xóa tiếp tân thất bại. Vui lòng thử lại!');
    }
  };

  // Open edit modal and populate form
  const openEditModal = (receptionist) => {
    setCurrentReceptionist(receptionist);
    setFormData({
      nv_hoten: receptionist.nv_hoten || '',
      nv_email: receptionist.nv_email || '',
      nv_sdt: receptionist.nv_sdt || '',
      nv_diachi: receptionist.nv_diachi || '',
      nv_ngaysinh: receptionist.nv_ngaysinh ? receptionist.nv_ngaysinh.substring(0, 10) : '',
      nv_gioitinh: receptionist.nv_gioitinh || 'Nam',
      nv_matkhau: '' // Không hiển thị mật khẩu cũ
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (receptionist) => {
    setCurrentReceptionist(receptionist);
    setShowDeleteModal(true);
  };

  // Phần return giữ nguyên
  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          <ToastContainer position="top-right" autoClose={3000} />

          <PageHeader
            title="Quản Lý Tiếp Tân"
            breadcrumbs={["Admin", "Quản lý tiếp tân"]}
          >
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 flex items-center"
            >
              <i className="fas fa-plus mr-2"></i> Thêm tiếp tân
            </button>
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-dark-textSecondary"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Receptionist list */}
          <div className="bg-dark-card rounded-lg shadow border border-dark-border overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-3"></div>
                <p className="text-dark-textSecondary">Đang tải danh sách tiếp tân...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-dark-border">
                    <thead className="bg-secondary-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                          Mã NV
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                          Họ tên
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                          Thông tin liên hệ
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                          Giới tính
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                          Ngày sinh
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-dark-card divide-y divide-dark-border">
                      {receptionists.length > 0 ? (
                        receptionists.map((receptionist) => (
                          <tr key={receptionist.nv_ma} className="hover:bg-secondary-900">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">
                              {receptionist.nv_ma}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                              {receptionist.nv_hoten || '---'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                              <div><i className="fas fa-envelope mr-1 text-primary-300"></i> {receptionist.nv_email || '---'}</div>
                              <div><i className="fas fa-phone mr-1 text-primary-300"></i> {receptionist.nv_sdt || '---'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${receptionist.nv_gioitinh === 'Nam'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-pink-100 text-pink-800'
                                }`}>
                                {receptionist.nv_gioitinh || '---'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                              {receptionist.nv_ngaysinh
                                ? new Date(receptionist.nv_ngaysinh).toLocaleDateString('vi-VN')
                                : '---'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                              <div className="flex justify-center space-x-3">
                                <button
                                  onClick={() => openEditModal(receptionist)}
                                  className="text-primary-300 hover:text-primary"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  onClick={() => openDeleteModal(receptionist)}
                                  className="text-red-400 hover:text-red-500"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-dark-textSecondary">
                            <i className="fas fa-user-slash text-4xl mb-3 block"></i>
                            Không tìm thấy tiếp tân nào
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-secondary-800 px-4 py-3 flex items-center justify-between border-t border-dark-border">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 text-sm rounded-md border border-dark-border ${currentPage === 1
                            ? 'bg-secondary-700 text-dark-textSecondary cursor-not-allowed'
                            : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'
                          }`}
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 text-sm rounded-md border border-dark-border ${currentPage === totalPages
                            ? 'bg-secondary-700 text-dark-textSecondary cursor-not-allowed'
                            : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'
                          }`}
                      >
                        Sau
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-dark-textSecondary">
                          Hiển thị <span className="font-medium">{(currentPage - 1) * recordsPerPage + 1}</span> đến <span className="font-medium">
                            {Math.min(currentPage * recordsPerPage, (totalPages - 1) * recordsPerPage + receptionists.length)}
                          </span> trong <span className="font-medium">{totalPages * recordsPerPage}</span> kết quả
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-2 rounded-l-md border border-dark-border text-sm ${currentPage === 1
                                ? 'bg-secondary-700 text-dark-textSecondary cursor-not-allowed'
                                : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'
                              }`}
                          >
                            <i className="fas fa-angle-double-left"></i>
                          </button>
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-2 border border-dark-border text-sm ${currentPage === 1
                                ? 'bg-secondary-700 text-dark-textSecondary cursor-not-allowed'
                                : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'
                              }`}
                          >
                            <i className="fas fa-angle-left"></i>
                          </button>

                          {/* Page numbers */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Logic to show pages around current page
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 border border-dark-border text-sm ${currentPage === pageNum
                                    ? 'bg-primary-900 text-primary-300 border-primary-700'
                                    : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-2 border border-dark-border text-sm ${currentPage === totalPages
                                ? 'bg-secondary-700 text-dark-textSecondary cursor-not-allowed'
                                : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'
                              }`}
                          >
                            <i className="fas fa-angle-right"></i>
                          </button>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-2 rounded-r-md border border-dark-border text-sm ${currentPage === totalPages
                                ? 'bg-secondary-700 text-dark-textSecondary cursor-not-allowed'
                                : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'
                              }`}
                          >
                            <i className="fas fa-angle-double-right"></i>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals đã được loại bỏ - sẽ được thêm vào sau */}
    </div>
  );
};

export default ReceptionistManagement;