import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../../layouts/Sidebar';
import PageHeader from '../../../layouts/PageHeader';
import api from '../../../service/apiService';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [completedExaminations, setCompletedExaminations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedExamination, setSelectedExamination] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Payment form data
  const [paymentFormData, setPaymentFormData] = useState({
    pk_ma: '',
    tt_sotien: '',
    tt_phuongthuc: 'Tiền mặt',
    tt_khachdua: '',
    tt_tienthoi: 0,
    tt_ghichu: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalPaid: 0,
    totalPending: 0,
    totalRevenue: 0,
    pendingAmount: 0
  });

  // Fetch completed examinations with billing details
  const fetchCompletedExaminations = async (date = selectedDate) => {
    try {
      const response = await api.get(`/phieukham/completed?date=${date}`);
      console.log('Response from completed examinations:', response.data);

      if (response.data?.success && response.data?.data) {
        const examinations = response.data.data || [];

        // Fetch billing details for each examination
        const examinationsWithBilling = await Promise.all(
          examinations.map(async (exam) => {
            // Map lại pk_ma nếu không có
            const pk_ma = exam.pk_ma || exam.ph_ma || exam.pcd_ma || null;

            try {
              const billingResponse = await api.get(`/ketqua/detailed-results/phieukham/${exam.pk_ma}/${exam.pk_ngaykham}`);
              if (billingResponse.data?.success && billingResponse.data?.data) {
                const billingData = billingResponse.data.data;

                // Calculate total amount from services
                const serviceTotal = billingData.dich_vu?.reduce((sum, service) => sum + (service.don_gia || 0), 0) || 0;
                const phieuTotal = billingData.phieu_info?.pcd_tongtien || 0;

                return {
                  ...exam,
                  pk_ma, // Thêm dòng này
                  billing: billingData,
                  totalAmount: phieuTotal || serviceTotal,
                  serviceDetails: billingData.dich_vu || [],
                  phieuInfo: billingData.phieu_info || {}
                };
              }
              return { ...exam, billing: null, totalAmount: 0, serviceDetails: [], phieuInfo: {} };
            } catch (error) {
              console.warn(`Không thể lấy thông tin billing cho phiếu khám ${exam.pk_ma}`);
              return { ...exam, billing: null, totalAmount: 0, serviceDetails: [], phieuInfo: {} };
            }
          })
        );

        setCompletedExaminations(examinationsWithBilling);

        // Calculate pending amount
        const pendingAmount = examinationsWithBilling.reduce((sum, exam) => sum + (exam.totalAmount || 0), 0);

        // Update stats
        setStats(prev => ({
          ...prev,
          totalCompleted: examinationsWithBilling.length,
          totalPending: examinationsWithBilling.length,
          pendingAmount
        }));
      }
    } catch (error) {
      console.error('Lỗi khi tải phiếu khám đã hoàn thành:', error);
      toast.error('Không thể tải danh sách phiếu khám');
    }
  };

  // Fetch paid examinations
  const fetchPaidExaminations = async () => {
    try {
      const response = await api.get('/phieukham/paid'); // Thêm dòng này

      if (response.data?.success && response.data?.data) {
        const paidExaminations = (response.data.data || []).map(p => ({ ...p, isPaid: true }));
        setPayments(paidExaminations);

        const totalRevenue = paidExaminations.reduce((sum, payment) =>
          sum + (payment.tt_sotien || 0), 0
        );

        setStats(prev => ({
          ...prev,
          totalPaid: paidExaminations.length,
          totalRevenue
        }));
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách đã thanh toán:', error);
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCompletedExaminations(),
        fetchPaidExaminations()
      ]);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      toast.error('Không thể tải dữ liệu thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedDate]);

  // Filter payments and examinations
  useEffect(() => {
    let filtered = [];

    if (paymentFilter === 'completed') {
      filtered = payments;
    } else if (paymentFilter === 'pending') {
      filtered = completedExaminations;
    } else {
      // Combine both paid and unpaid examinations
      const paidWithStatus = payments.map(p => ({ ...p, isPaid: true }));
      const unpaidWithStatus = completedExaminations.map(e => ({ ...e, isPaid: false }));
      filtered = [...paidWithStatus, ...unpaidWithStatus];
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.pk_ma?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bn_ma?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ph_ma?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tt_matthuoc?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  }, [searchTerm, payments, completedExaminations, paymentFilter]);

  // Calculate change amount
  useEffect(() => {
    const paid = parseFloat(paymentFormData.tt_khachdua) || 0;
    const amount = parseFloat(paymentFormData.tt_sotien) || 0;
    const change = Math.max(0, paid - amount);

    setPaymentFormData(prev => ({
      ...prev,
      tt_tienthoi: change
    }));
  }, [paymentFormData.tt_khachdua, paymentFormData.tt_sotien]);

  // Handle payment modal
  const handlePayment = async (examination) => {
    try {
      // Get detailed examination info if not already available
      let examDetail = examination;

      if (!examination.billing) {
        const response = await api.get(`/phieukham/${examination.pk_ma}/chitiet`);
        if (response.data?.success && response.data?.data) {
          examDetail = response.data.data;
        }
      }

      setSelectedExamination(examDetail);
      setPaymentFormData({
        pk_ma: examination.pk_ma,
        tt_sotien: (examination.totalAmount || examDetail.tong_chi_phi || 0).toString(),
        tt_phuongthuc: 'Tiền mặt',
        tt_khachdua: '',
        tt_tienthoi: 0,
        tt_ghichu: ''
      });
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết phiếu khám:', error);
      toast.error('Không thể lấy thông tin chi tiết phiếu khám');
    }
  };

  // Process payment
  const processPayment = async (e) => {
    e.preventDefault();

    const amount = parseFloat(paymentFormData.tt_sotien);
    const paid = parseFloat(paymentFormData.tt_khachdua);

    if (paid < amount) {
      toast.error('Số tiền khách đưa không đủ');
      return;
    }

    try {
      // Gọi API cập nhật trạng thái phiếu khám thành đã thanh toán
      const response = await api.put(
        `/phieukham/${paymentFormData.pk_ma}/${selectedExamination.pk_ngaykham}/pay`,
        {
          tt_sotien: paymentFormData.tt_sotien,
          tt_khachdua: paymentFormData.tt_khachdua,
          tt_tienthoi: paymentFormData.tt_tienthoi,
          tt_ghichu: paymentFormData.tt_ghichu,
          // Nếu backend cần thêm trường nào thì bổ sung ở đây
        }
      );

      if (response.data?.success) {
        toast.success('Thanh toán thành công!');
        setIsPaymentModalOpen(false);
        resetPaymentForm();
        fetchAllData();
      } else {
        toast.error('Thanh toán thất bại!');
      }
    } catch (error) {
      console.error('Lỗi khi thanh toán:', error);
      toast.error('Lỗi khi xử lý thanh toán');
    }
  };

  const resetPaymentForm = () => {
    setSelectedExamination(null);
    setPaymentFormData({
      pk_ma: '',
      tt_sotien: '',
      tt_phuongthuc: 'Tiền mặt',
      tt_khachdua: '',
      tt_tienthoi: 0,
      tt_ghichu: ''
    });
  };

  const handleModalClose = () => {
    setIsPaymentModalOpen(false);
    resetPaymentForm();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'Chưa có';
    return timeString.substring(0, 5); // Get HH:MM from HH:MM:SS
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <PageHeader title="Quản Lý Thanh Toán" breadcrumbs={["Tiếp tân", "Thanh toán"]}>
          <div className="flex space-x-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={fetchAllData}
              className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Làm mới
            </button>
          </div>
        </PageHeader>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textSecondary text-sm">Đã khám xong</p>
                <h3 className="text-2xl font-bold text-blue-400 mt-1">{stats.totalCompleted}</h3>
              </div>
              <i className="fas fa-user-check text-blue-400 text-2xl"></i>
            </div>
          </div>

          <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textSecondary text-sm">Chờ thanh toán</p>
                <h3 className="text-2xl font-bold text-orange-400 mt-1">{stats.totalPending}</h3>
              </div>
              <i className="fas fa-clock text-orange-400 text-2xl"></i>
            </div>
          </div>

          <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textSecondary text-sm">Số tiền cần thu</p>
                <h3 className="text-sm font-bold text-red-400 mt-1">
                  {formatCurrency(stats.pendingAmount)}
                </h3>
              </div>
              <i className="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
            </div>
          </div>

          <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textSecondary text-sm">Đã thanh toán</p>
                <h3 className="text-2xl font-bold text-green-400 mt-1">{stats.totalPaid}</h3>
              </div>
              <i className="fas fa-check-circle text-green-400 text-2xl"></i>
            </div>
          </div>

          <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-textSecondary text-sm">Tổng doanh thu</p>
                <h3 className="text-sm font-bold text-primary-300 mt-1">
                  {formatCurrency(stats.totalRevenue)}
                </h3>
              </div>
              <i className="fas fa-money-bill-wave text-primary-300 text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-dark-card rounded-lg p-4 mb-6 border border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary"></i>
                <input
                  type="text"
                  placeholder="Nhập mã phiếu khám, mã bệnh nhân..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                Trạng thái thanh toán
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ thanh toán</option>
                <option value="completed">Đã thanh toán</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                Ngày khám
              </label>
              <div className="text-sm text-dark-text bg-secondary-800 p-2 rounded-md border border-dark-border">
                {formatDate(selectedDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-dark-card rounded-lg border border-dark-border">
          <div className="p-4 border-b border-dark-border">
            <h3 className="text-lg font-semibold text-dark-text">
              Danh sách phiếu khám ({filteredPayments.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="text-dark-textSecondary ml-2">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                      Mã PK
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                      Mã BN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                      Mã toa thuốc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                      Ngày khám
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                      Giờ khám
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-dark-textSecondary">
                        <i className="fas fa-credit-card text-4xl mb-4 opacity-50"></i>
                        <p>Không có dữ liệu phiếu khám</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((item, index) => (
                      <tr key={item.pk_ma || index} className="hover:bg-secondary-900 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-300">
                          PK{String(item.pk_ma).padStart(6, '0')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                          {item.bn_ma}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                          {item.tt_matthuoc || 'Chưa có'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                          {formatDate(item.pk_ngaykham || item.tt_ngaythanhtoan)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                          {formatTime(item.pk_giokhamthucte || item.tt_giovao)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          <span className={`${item.isPaid || item.tt_ma ? 'text-green-400' : 'text-orange-400'}`}>
                            {formatCurrency(item.totalAmount || item.tt_sotien || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.isPaid ? (
                            <span className="px-2 py-1 bg-green-900 bg-opacity-20 text-green-400 rounded-full text-xs">
                              Đã thanh toán
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-orange-900 bg-opacity-20 text-orange-400 rounded-full text-xs">
                              Chờ thanh toán
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                          {!item.isPaid && !item.tt_ma ? (
                            <button
                              onClick={() => handlePayment(item)}
                              className="bg-primary hover:bg-primary-600 text-white px-3 py-1 rounded-md text-xs flex items-center"
                            >
                              <i className="fas fa-credit-card mr-1"></i>
                              Thanh toán
                            </button>
                          ) : (
                            <span className="text-green-400 text-xs">
                              <i className="fas fa-check mr-1"></i>
                              Hoàn thành
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {isPaymentModalOpen && selectedExamination && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-dark-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-dark-text">
                  Thanh toán phiếu khám
                </h3>
                <button
                  onClick={handleModalClose}
                  className="text-dark-textSecondary hover:text-dark-text"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Service Details */}
                <div>
                  {/* Examination Info */}
                  <div className="bg-secondary-800 rounded-md p-4 mb-4">
                    <h4 className="text-sm font-medium text-dark-text mb-3">Thông tin phiếu khám</h4>
                    <div className="grid grid-cols-1 gap-2 text-xs text-dark-textSecondary">
                      <div className="flex justify-between">
                        <span>Mã PK:</span>
                        <span className="text-primary-300">PK{String(selectedExamination.pk_ma).padStart(6, '0')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mã BN:</span>
                        <span className="text-dark-text">{selectedExamination.bn_ma}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ngày khám:</span>
                        <span className="text-dark-text">{formatDate(selectedExamination.pk_ngaykham)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Giờ khám:</span>
                        <span className="text-dark-text">{formatTime(selectedExamination.pk_giokhamthucte)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mã toa thuốc:</span>
                        <span className="text-dark-text">{selectedExamination.tt_matthuoc || 'Chưa có'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trạng thái:</span>
                        <span className="text-green-400">{selectedExamination.pk_trangthai}</span>
                      </div>
                    </div>

                    {/* Phieu Chi Dinh Info */}
                    {selectedExamination.phieuInfo && (
                      <div className="mt-3 pt-3 border-t border-dark-border">
                        <h5 className="text-xs font-medium text-dark-text mb-2">Thông tin phiếu chi định:</h5>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-dark-textSecondary">Mã phiếu:</span>
                            <span className="text-primary-300">{selectedExamination.phieuInfo.pcd_ma}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-textSecondary">Ngày thực hiện:</span>
                            <span className="text-dark-text">{formatDate(selectedExamination.phieuInfo.pcd_ngay)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dark-textSecondary">Giờ thực hiện:</span>
                            <span className="text-dark-text">{formatTime(selectedExamination.phieuInfo.pcd_gio)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Details */}
                  {selectedExamination.serviceDetails && selectedExamination.serviceDetails.length > 0 && (
                    <div className="bg-secondary-800 rounded-md p-4 mb-4">
                      <h4 className="text-sm font-medium text-dark-text mb-3 flex items-center">
                        <i className="fas fa-flask mr-2"></i>
                        Chi tiết dịch vụ y tế ({selectedExamination.serviceDetails.length})
                      </h4>

                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedExamination.serviceDetails.map((service, index) => (
                          <div key={service.dvyt_ma || index} className="bg-secondary-900 rounded-lg p-3 border border-dark-border">
                            {/* Service Info Only */}
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-dark-text">{service.dvyt_ten}</h5>
                                <p className="text-xs text-dark-textSecondary mt-1">{service.dvyt_mota}</p>
                                <p className="text-xs text-primary-300 mt-1">Mã dịch vụ: {service.dvyt_ma}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-green-400 font-bold">{formatCurrency(service.don_gia)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total Cost Summary */}
                  <div className="bg-green-900 bg-opacity-20 border border-green-600 rounded-md p-4">
                    <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center">
                      <i className="fas fa-calculator mr-2"></i>
                      Tóm tắt chi phí
                    </h4>

                    {selectedExamination.serviceDetails && selectedExamination.serviceDetails.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {selectedExamination.serviceDetails.map((service, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-dark-textSecondary truncate flex-1 mr-2">{service.dvyt_ten}</span>
                            <span className="text-dark-text">{formatCurrency(service.don_gia)}</span>
                          </div>
                        ))}
                        <div className="border-t border-green-600 pt-2">
                          <div className="flex justify-between text-sm font-bold">
                            <span className="text-green-400">Tổng cộng:</span>
                            <span className="text-green-400">{formatCurrency(selectedExamination.totalAmount || 0)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Payment Form */}
                <div>
                  <form onSubmit={processPayment}>
                    <div className="bg-secondary-800 rounded-md p-4 mb-4">
                      <h4 className="text-sm font-medium text-dark-text mb-3 flex items-center">
                        <i className="fas fa-credit-card mr-2"></i>
                        Thông tin thanh toán
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                            Số tiền thanh toán *
                          </label>
                          <input
                            type="number"
                            value={paymentFormData.tt_sotien}
                            onChange={(e) => setPaymentFormData(prev => ({ ...prev, tt_sotien: e.target.value }))}
                            className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-900 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                            min="0"
                            step="1000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                            Số tiền khách đưa *
                          </label>
                          <input
                            type="number"
                            value={paymentFormData.tt_khachdua}
                            onChange={(e) => setPaymentFormData(prev => ({ ...prev, tt_khachdua: e.target.value }))}
                            className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-900 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                            min="0"
                            step="1000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                            Ghi chú
                          </label>
                          <textarea
                            value={paymentFormData.tt_ghichu}
                            onChange={(e) => setPaymentFormData(prev => ({ ...prev, tt_ghichu: e.target.value }))}
                            className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-900 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                            rows="3"
                            placeholder="Ghi chú thêm về thanh toán..."
                          />
                        </div>

                        {paymentFormData.tt_tienthoi > 0 && (
                          <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-md p-3">
                            <p className="text-blue-400 text-sm flex items-center">
                              <i className="fas fa-hand-holding-usd mr-2"></i>
                              Tiền thối lại: <span className="font-bold ml-1">{formatCurrency(paymentFormData.tt_tienthoi)}</span>
                            </p>
                          </div>
                        )}

                        {/* Quick Amount Buttons */}
                        <div>
                          <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                            Số tiền nhanh
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              selectedExamination.totalAmount,
                              Math.ceil(selectedExamination.totalAmount / 100000) * 100000,
                              Math.ceil(selectedExamination.totalAmount / 500000) * 500000
                            ].filter((amount, index, arr) => arr.indexOf(amount) === index).map((amount, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setPaymentFormData(prev => ({ ...prev, tt_khachdua: amount.toString() }))}
                                className="px-2 py-1 text-xs bg-primary hover:bg-primary-600 text-white rounded-md transition-colors"
                              >
                                {formatCurrency(amount)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleModalClose}
                        className="px-6 py-2 bg-secondary-800 text-dark-text rounded-md hover:bg-secondary-700 transition-colors"
                      >
                        <i className="fas fa-times mr-2"></i>
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
                      >
                        <i className="fas fa-credit-card mr-2"></i>
                        Thanh toán
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer theme="dark" />
    </div>
  );
};

export default PaymentManagement;