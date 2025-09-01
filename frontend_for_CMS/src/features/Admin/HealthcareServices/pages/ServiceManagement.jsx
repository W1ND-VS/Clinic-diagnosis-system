import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminSidebar from '../../../../layouts/AdminSidebar';
import PageHeader from '../../../../layouts/PageHeader';
import api from '../../../../service/apiService';

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  
  // Modal states
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isIndexModalOpen, setIsIndexModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  
  const itemsPerPage = 5;

  // Form states
  const [serviceFormData, setServiceFormData] = useState({
    dvyt_ma: '',
    dvyt_ten: '',
    dvyt_mota: ''
  });

  const [priceFormData, setPriceFormData] = useState({
    gia: '',
    ngay_ap_dung: ''
  });

  const [indexFormData, setIndexFormData] = useState({
    cs_ma: '',
    cs_ten: '',
    cs_donvi: '',
    cs_mucbthuong: ''
  });

  // Fetch services data
  const fetchServices = async (page = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await api.get(`/dichvu/paged?offset=${offset}&limit=${itemsPerPage}`);
      
      if (response.data?.success && response.data?.data) {
        const { items, total, total_pages } = response.data.data;
        setServices(items);
        setFilteredServices(items);
        setTotalServices(total);
        setTotalPages(total_pages);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách dịch vụ:', error);
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(currentPage);
  }, [currentPage]);

  // Filter services based on search term
  useEffect(() => {
    const filtered = services.filter(service =>
      service.dvyt_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.dvyt_ma.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.dvyt_mota.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [searchTerm, services]);

  // Service CRUD operations
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/dichvu/${currentService.dvyt_ma}`, serviceFormData);
        toast.success('Cập nhật dịch vụ thành công!');
      } else {
        await api.post('/dichvu', serviceFormData);
        toast.success('Thêm dịch vụ mới thành công!');
      }
      setIsServiceModalOpen(false);
      resetServiceForm();
      fetchServices(currentPage);
    } catch (error) {
      console.error('Lỗi khi lưu dịch vụ:', error);
      toast.error(isEditMode ? 'Lỗi khi cập nhật dịch vụ' : 'Lỗi khi thêm dịch vụ mới');
    }
  };

  const handleServiceEdit = (service) => {
    setCurrentService(service);
    setServiceFormData({
      dvyt_ma: service.dvyt_ma,
      dvyt_ten: service.dvyt_ten,
      dvyt_mota: service.dvyt_mota
    });
    setIsEditMode(true);
    setIsServiceModalOpen(true);
  };

  const handleServiceDelete = async (serviceId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      try {
        await api.delete(`/dichvu/${serviceId}`);
        toast.success('Xóa dịch vụ thành công!');
        fetchServices(currentPage);
      } catch (error) {
        console.error('Lỗi khi xóa dịch vụ:', error);
        toast.error('Lỗi khi xóa dịch vụ');
      }
    }
  };

  // Price management
  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/dichvu/${selectedServiceId}/gia`, priceFormData);
      toast.success('Cập nhật giá thành công!');
      setIsPriceModalOpen(false);
      resetPriceForm();
      fetchServices(currentPage);
    } catch (error) {
      console.error('Lỗi khi cập nhật giá:', error);
      toast.error('Lỗi khi cập nhật giá');
    }
  };

  const openPriceModal = (service) => {
    setSelectedServiceId(service.dvyt_ma);
    setPriceFormData({
      gia: service.dongia.gia.toString(),
      ngay_ap_dung: new Date().toISOString().split('T')[0]
    });
    setIsPriceModalOpen(true);
  };

  // Index management
  const handleIndexSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...indexFormData,
        dvyt_ma: selectedServiceId
      };
      await api.post('/chiso', payload);
      toast.success('Thêm chỉ số thành công!');
      setIsIndexModalOpen(false);
      resetIndexForm();
      fetchServices(currentPage);
    } catch (error) {
      console.error('Lỗi khi thêm chỉ số:', error);
      toast.error('Lỗi khi thêm chỉ số');
    }
  };

  const handleIndexDelete = async (indexId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chỉ số này?')) {
      try {
        await api.delete(`/chiso/${indexId}`);
        toast.success('Xóa chỉ số thành công!');
        fetchServices(currentPage);
      } catch (error) {
        console.error('Lỗi khi xóa chỉ số:', error);
        toast.error('Lỗi khi xóa chỉ số');
      }
    }
  };

  const openIndexModal = (serviceId) => {
    setSelectedServiceId(serviceId);
    setIsIndexModalOpen(true);
  };

  // Reset forms
  const resetServiceForm = () => {
    setServiceFormData({
      dvyt_ma: '',
      dvyt_ten: '',
      dvyt_mota: ''
    });
    setCurrentService(null);
    setIsEditMode(false);
  };

  const resetPriceForm = () => {
    setPriceFormData({
      gia: '',
      ngay_ap_dung: ''
    });
    setSelectedServiceId(null);
  };

  const resetIndexForm = () => {
    setIndexFormData({
      cs_ma: '',
      cs_ten: '',
      cs_donvi: '',
      cs_mucbthuong: ''
    });
    setSelectedServiceId(null);
  };

  // Modal close handlers
  const handleServiceModalClose = () => {
    setIsServiceModalOpen(false);
    resetServiceForm();
  };

  const handlePriceModalClose = () => {
    setIsPriceModalOpen(false);
    resetPriceForm();
  };

  const handleIndexModalClose = () => {
    setIsIndexModalOpen(false);
    resetIndexForm();
  };

  // Add new service
  const handleAddNewService = () => {
    resetServiceForm();
    setIsServiceModalOpen(true);
  };

  // Pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 rounded-md bg-secondary-800 text-dark-text hover:bg-secondary-700 transition-colors"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 rounded-md transition-colors ${
            i === currentPage
              ? 'bg-primary text-white'
              : 'bg-secondary-800 text-dark-text hover:bg-secondary-700'
          }`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 rounded-md bg-secondary-800 text-dark-text hover:bg-secondary-700 transition-colors"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      );
    }

    return pages;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-auto">
        <PageHeader title="Quản Lý Dịch Vụ Y Tế" breadcrumbs={["Quản lý", "Dịch vụ y tế"]}>
          <button
            onClick={handleAddNewService}
            className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <i className="fas fa-plus mr-2"></i>
            Thêm dịch vụ mới
          </button>
        </PageHeader>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textSecondary text-sm">Tổng dịch vụ</p>
                <h3 className="text-2xl font-bold text-primary-300 mt-1">{totalServices}</h3>
              </div>
              <i className="fas fa-hospital text-primary-300 text-2xl"></i>
            </div>
          </div>
          
          <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textSecondary text-sm">Đang hiển thị</p>
                <h3 className="text-2xl font-bold text-green-400 mt-1">{filteredServices.length}</h3>
              </div>
              <i className="fas fa-eye text-green-400 text-2xl"></i>
            </div>
          </div>
          
          <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textSecondary text-sm">Tổng chỉ số</p>
                <h3 className="text-2xl font-bold text-orange-400 mt-1">
                  {filteredServices.reduce((total, service) => total + service.so_luong_chi_so, 0)}
                </h3>
              </div>
              <i className="fas fa-chart-line text-orange-400 text-2xl"></i>
            </div>
          </div>

          <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textSecondary text-sm">Trang hiện tại</p>
                <h3 className="text-2xl font-bold text-blue-400 mt-1">{currentPage}/{totalPages}</h3>
              </div>
              <i className="fas fa-bookmark text-blue-400 text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-dark-card rounded-lg p-4 mb-6 border border-dark-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                Tìm kiếm dịch vụ
              </label>
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary"></i>
                <input
                  type="text"
                  placeholder="Nhập tên dịch vụ, mã dịch vụ hoặc mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Service List */}
        <div className="bg-dark-card rounded-lg border border-dark-border">
          <div className="p-4 border-b border-dark-border">
            <h3 className="text-lg font-semibold text-dark-text">
              Danh sách dịch vụ y tế ({filteredServices.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="text-dark-textSecondary ml-2">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {filteredServices.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-hospital text-4xl text-dark-textSecondary mb-4 opacity-50"></i>
                  <p className="text-dark-textSecondary">Không có dịch vụ nào được tìm thấy</p>
                </div>
              ) : (
                filteredServices.map((service) => (
                  <div key={service.dvyt_ma} className="bg-secondary-900 rounded-lg p-4 border border-dark-border">
                    {/* Service Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="text-lg font-semibold text-dark-text mr-3">
                            {service.dvyt_ten}
                          </h4>
                          <span className="px-2 py-1 bg-primary-900 bg-opacity-50 text-primary-300 rounded-md text-xs">
                            {service.dvyt_ma}
                          </span>
                        </div>
                        <p className="text-dark-textSecondary text-sm mb-2">{service.dvyt_mota}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-green-400 font-semibold">
                            <i className="fas fa-money-bill-wave mr-1"></i>
                            {service.dongia.formatted_price}
                          </span>
                          <span className="text-dark-textSecondary">
                            <i className="fas fa-chart-bar mr-1"></i>
                            {service.so_luong_chi_so} chỉ số
                          </span>
                          <span className="text-dark-textSecondary">
                            <i className="fas fa-calendar mr-1"></i>
                            Áp dụng: {new Date(service.dongia.ngay_ap_dung).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openPriceModal(service)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs flex items-center"
                        >
                          <i className="fas fa-dollar-sign mr-1"></i>
                          Giá
                        </button>
                        <button
                          onClick={() => openIndexModal(service.dvyt_ma)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs flex items-center"
                        >
                          <i className="fas fa-plus mr-1"></i>
                          Chỉ số
                        </button>
                        <button
                          onClick={() => handleServiceEdit(service)}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-md text-xs flex items-center"
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Sửa
                        </button>
                        <button
                          onClick={() => handleServiceDelete(service.dvyt_ma)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs flex items-center"
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Xóa
                        </button>
                      </div>
                    </div>

                    {/* Indices */}
                    {service.chi_so && service.chi_so.length > 0 && (
                      <div className="border-t border-dark-border pt-4">
                        <h5 className="text-sm font-medium text-dark-text mb-3">Chỉ số xét nghiệm:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {service.chi_so.map((index) => (
                            <div key={index.cs_ma} className="bg-secondary-800 rounded-md p-3 relative group">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h6 className="text-sm font-medium text-dark-text">{index.cs_ten}</h6>
                                  <p className="text-xs text-dark-textSecondary mt-1">
                                    Mã: {index.cs_ma}
                                  </p>
                                  <p className="text-xs text-dark-textSecondary">
                                    Đơn vị: {index.cs_donvi || 'Không có'}
                                  </p>
                                  <p className="text-xs text-green-400 mt-1">
                                    Bình thường: {index.cs_mucbthuong}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleIndexDelete(index.cs_ma)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1"
                                  title="Xóa chỉ số"
                                >
                                  <i className="fas fa-times text-xs"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-dark-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-dark-textSecondary">
                  Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalServices)} của {totalServices} dịch vụ
                </div>
                <div className="flex space-x-2">
                  {renderPagination()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Service Modal */}
        {isServiceModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-card rounded-lg p-6 w-full max-w-md border border-dark-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-dark-text">
                  {isEditMode ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
                </h3>
                <button
                  onClick={handleServiceModalClose}
                  className="text-dark-textSecondary hover:text-dark-text"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleServiceSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                      Mã dịch vụ *
                    </label>
                    <input
                      type="text"
                      value={serviceFormData.dvyt_ma}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, dvyt_ma: e.target.value })}
                      className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      disabled={isEditMode}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                      Tên dịch vụ *
                    </label>
                    <input
                      type="text"
                      value={serviceFormData.dvyt_ten}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, dvyt_ten: e.target.value })}
                      className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={serviceFormData.dvyt_mota}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, dvyt_mota: e.target.value })}
                      className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleServiceModalClose}
                    className="px-4 py-2 bg-secondary-800 text-dark-text rounded-md hover:bg-secondary-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
                  >
                    {isEditMode ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Price Modal */}
        {isPriceModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-card rounded-lg p-6 w-full max-w-md border border-dark-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-dark-text">
                  Cập nhật giá dịch vụ
                </h3>
                <button
                  onClick={handlePriceModalClose}
                  className="text-dark-textSecondary hover:text-dark-text"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handlePriceUpdate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                      Giá mới (VNĐ) *
                    </label>
                    <input
                      type="number"
                      value={priceFormData.gia}
                      onChange={(e) => setPriceFormData({ ...priceFormData, gia: e.target.value })}
                      className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                      Ngày áp dụng *
                    </label>
                    <input
                      type="date"
                      value={priceFormData.ngay_ap_dung}
                      onChange={(e) => setPriceFormData({ ...priceFormData, ngay_ap_dung: e.target.value })}
                      className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handlePriceModalClose}
                    className="px-4 py-2 bg-secondary-800 text-dark-text rounded-md hover:bg-secondary-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Cập nhật giá
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Index Modal */}
        {isIndexModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-card rounded-lg p-6 w-full max-w-md border border-dark-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-dark-text">
                  Thêm chỉ số xét nghiệm
                </h3>
                <button
                  onClick={handleIndexModalClose}
                  className="text-dark-textSecondary hover:text-dark-text"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleIndexSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                      Mã chỉ số *
                    </label>
                    <input
                      type="text"
                      value={indexFormData.cs_ma}
                      onChange={(e) => setIndexFormData({ ...indexFormData, cs_ma: e.target.value })}
                      className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                      Tên chỉ số *
                    </label>
                    <input
                      type="text"
                      value={indexFormData.cs_ten}
                      onChange={(e) => setIndexFormData({ ...indexFormData, cs_ten: e.target.value })}
                      className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                      Đơn vị
                    </label>
                    <input
                      type="text"
                      value={indexFormData.cs_donvi}
                      onChange={(e) => setIndexFormData({ ...indexFormData, cs_donvi: e.target.value })}
                      className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="VD: mg/dL, U/L, %..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                      Mức bình thường *
                    </label>
                    <input
                      type="text"
                      value={indexFormData.cs_mucbthuong}
                      onChange={(e) => setIndexFormData({ ...indexFormData, cs_mucbthuong: e.target.value })}
                      className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      placeholder="VD: 70-99, < 5.7, > 90..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleIndexModalClose}
                    className="px-4 py-2 bg-secondary-800 text-dark-text rounded-md hover:bg-secondary-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Thêm chỉ số
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      <ToastContainer theme="dark" />
    </div>
  );
};

export default ServiceManagement;