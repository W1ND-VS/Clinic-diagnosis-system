import React, { useState, useEffect } from 'react';
import api from '../../../service/apiService';
import { toast } from 'react-toastify';

const ViewResultsModal = ({
  isOpen,
  onClose,
  pcd_ma,
  patientInfo
}) => {
  const [services, setServices] = useState([]);
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completionDateTime, setCompletionDateTime] = useState('');

  useEffect(() => {
    if (isOpen && pcd_ma) {
      fetchResultsData();
    }
  }, [isOpen, pcd_ma]);

  const fetchResultsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/ketqua/detailed-results/${pcd_ma}`);
      
      if (response.data && response.data.success) {
        const responseData = response.data.data;
        
        // Set completion datetime
        if (responseData.phieu_info.pcd_ngay && responseData.phieu_info.pcd_gio) {
          const dateTime = `${responseData.phieu_info.pcd_ngay}T${responseData.phieu_info.pcd_gio}`;
          setCompletionDateTime(dateTime);
        }
        
        // Map services with results
        const mappedServices = responseData.dich_vu.map(service => ({
          service_id: service.dvyt_ma,
          service_name: service.dvyt_ten,
          don_gia: service.don_gia,
          description: service.dvyt_mota,
          indicators: service.chi_so.map(cs => ({
            name: cs.cs_ten,
            value: cs.kq_ketqua || '',
            unit: cs.cs_donvi || '',
            reference: cs.cs_mucbthuong || '',
            indicator_id: cs.cs_ma,
            status: getIndicatorStatus(cs.kq_ketqua, cs.cs_mucbthuong)
          }))
        }));
        
        setServices(mappedServices);
      } else {
        setError('Không thể tải kết quả xét nghiệm');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Có lỗi xảy ra khi tải kết quả: ' + (error.response?.data?.message || error.message));
      toast.error('Không thể tải kết quả xét nghiệm');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine indicator status
  const getIndicatorStatus = (value, reference) => {
    if (!value || !reference) return 'normal';
    
    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return 'normal';
      
      // Parse reference range (e.g., "12.0 - 15.5", "< 40", "> 90")
      if (reference.includes('-')) {
        const [min, max] = reference.split('-').map(v => parseFloat(v.trim()));
        if (!isNaN(min) && !isNaN(max)) {
          if (numValue < min) return 'low';
          if (numValue > max) return 'high';
          return 'normal';
        }
      } else if (reference.startsWith('<')) {
        const max = parseFloat(reference.replace('<', '').trim());
        if (!isNaN(max) && numValue >= max) return 'high';
      } else if (reference.startsWith('>')) {
        const min = parseFloat(reference.replace('>', '').trim());
        if (!isNaN(min) && numValue <= min) return 'low';
      }
      
      return 'normal';
    } catch {
      return 'normal';
    }
  };

  // Get status color for indicator
  const getIndicatorStatusColor = (status) => {
    switch (status) {
      case 'low': return 'text-blue-400 bg-blue-900';
      case 'high': return 'text-red-400 bg-red-900';
      case 'normal': return 'text-green-400 bg-green-900';
      default: return 'text-dark-textSecondary bg-secondary-800';
    }
  };

  const getIndicatorStatusText = (status) => {
    switch (status) {
      case 'low': return 'Thấp';
      case 'high': return 'Cao';
      case 'normal': return 'Bình thường';
      default: return 'Chưa đánh giá';
    }
  };

  if (!isOpen) return null;

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-4xl">
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-dark-textSecondary">Đang tải kết quả xét nghiệm...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-4xl">
          <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
            <h3 className="text-lg font-medium">Kết quả xét nghiệm</h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="p-8 text-center">
            <i className="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-dark-text mb-2">Có lỗi xảy ra</h3>
            <p className="text-dark-textSecondary mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-secondary-700 text-dark-text rounded-md hover:bg-secondary-600 border border-dark-border"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No services state
  if (services.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-4xl">
          <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
            <h3 className="text-lg font-medium">Kết quả xét nghiệm</h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="p-8 text-center">
            <i className="fas fa-flask text-dark-textSecondary text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-dark-text mb-2">Chưa có kết quả</h3>
            <p className="text-dark-textSecondary mb-4">Không tìm thấy kết quả xét nghiệm nào</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-secondary-700 text-dark-text rounded-md hover:bg-secondary-600 border border-dark-border"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentService = services[activeServiceIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Kết quả xét nghiệm - Mã phiếu: {pcd_ma}</h3>
            {patientInfo && (
              <p className="text-sm text-blue-100 mt-1">
                Bệnh nhân: {patientInfo.bn_hoten} • {patientInfo.bn_gioitinh} • {patientInfo.bn_ngaysinh}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex h-full max-h-[calc(90vh-120px)]">
          {/* Sidebar danh sách dịch vụ */}
          <div className="w-1/3 bg-secondary-900 border-r border-dark-border overflow-y-auto">
            <div className="p-4 border-b border-dark-border">
              <h4 className="font-medium text-dark-text">
                Danh sách dịch vụ ({services.length})
              </h4>
              {completionDateTime && (
                <p className="text-sm text-dark-textSecondary mt-1">
                  Thời gian: {new Date(completionDateTime).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
            <div className="p-2">
              {services.map((service, index) => {
                const completedCount = service.indicators.filter(ind => ind.value).length;
                const totalCount = service.indicators.length;
                const hasAbnormal = service.indicators.some(ind => ind.status === 'high' || ind.status === 'low');
                
                return (
                  <button
                    key={service.service_id}
                    onClick={() => setActiveServiceIndex(index)}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                      activeServiceIndex === index
                        ? 'bg-primary-900 border-primary-600 border'
                        : 'bg-dark-card hover:bg-secondary-800 border border-dark-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm text-dark-text">{service.service_name}</h5>
                        <p className="text-xs text-dark-textSecondary">Mã: {service.service_id}</p>
                        <p className="text-xs text-dark-textSecondary">
                          Chỉ số: {completedCount}/{totalCount}
                        </p>
                      </div>
                      <div className="flex flex-col items-center ml-2">
                        {hasAbnormal && (
                          <i className="fas fa-exclamation-triangle text-yellow-400 text-sm mb-1"></i>
                        )}
                        <i className="fas fa-check-circle text-green-400 text-sm"></i>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="w-full bg-secondary-700 rounded-full h-1">
                        <div 
                          className="bg-primary h-1 rounded-full transition-all" 
                          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Header của service hiện tại */}
            <div className="bg-dark-card border-b border-dark-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-dark-text">
                    {currentService.service_name}
                  </h3>
                  <p className="text-sm text-dark-textSecondary">Mã dịch vụ: {currentService.service_id}</p>
                  {currentService.description && (
                    <p className="text-sm text-dark-textSecondary mt-1">{currentService.description}</p>
                  )}
                  <p className="text-sm text-primary-300 mt-1 font-medium">
                    Đơn giá: {currentService.don_gia?.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="text-sm text-dark-textSecondary">
                  {activeServiceIndex + 1} / {services.length}
                </div>
              </div>
            </div>

            {/* Results content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Các chỉ số xét nghiệm */}
              {currentService.indicators && currentService.indicators.length > 0 ? (
                <div>
                  <h4 className="text-lg font-medium text-dark-text mb-4 flex items-center">
                    <i className="fas fa-chart-line text-primary-300 mr-2"></i>
                    Kết quả các chỉ số ({currentService.indicators.length})
                  </h4>
                  
                  <div className="space-y-4">
                    {currentService.indicators.map((indicator, idx) => (
                      <div key={idx} className="bg-secondary-900 p-4 rounded-lg border border-dark-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Thông tin chỉ số */}
                          <div>
                            <h5 className="font-medium text-dark-text mb-2 flex items-center">
                              <i className="fas fa-vial text-primary-300 mr-2"></i>
                              {indicator.name}
                            </h5>
                            <div className="text-sm text-dark-textSecondary space-y-1">
                              <p><span className="font-medium">Mã chỉ số:</span> {indicator.indicator_id}</p>
                              <p><span className="font-medium">Đơn vị:</span> {indicator.unit}</p>
                              <p><span className="font-medium">Giá trị bình thường:</span> {indicator.reference}</p>
                            </div>
                          </div>
                          
                          {/* Kết quả */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-dark-text mb-2">
                                Kết quả xét nghiệm
                              </label>
                              <div className="flex items-center space-x-3">
                                <div className="flex-1 p-3 bg-dark-card border border-dark-border rounded-md">
                                  <span className="text-lg font-semibold text-dark-text">
                                    {indicator.value || 'Chưa có kết quả'}
                                  </span>
                                  {indicator.unit && indicator.value && (
                                    <span className="text-dark-textSecondary ml-1">{indicator.unit}</span>
                                  )}
                                </div>
                                {indicator.value && (
                                  <span className={`px-3 py-2 rounded-full text-sm font-medium ${getIndicatorStatusColor(indicator.status)}`}>
                                    <i className={`fas ${
                                      indicator.status === 'high' ? 'fa-arrow-up' :
                                      indicator.status === 'low' ? 'fa-arrow-down' : 'fa-check'
                                    } mr-1`}></i>
                                    {getIndicatorStatusText(indicator.status)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-flask text-dark-textSecondary text-4xl mb-4"></i>
                  <h3 className="text-lg font-medium text-dark-text mb-2">Không có chỉ số</h3>
                  <p className="text-dark-textSecondary">Dịch vụ này không có chỉ số xét nghiệm nào.</p>
                </div>
              )}
            </div>

            {/* Footer navigation */}
            <div className="bg-secondary-900 border-t border-dark-border px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="space-x-2">
                  <button
                    onClick={() => setActiveServiceIndex(prev => Math.max(0, prev - 1))}
                    disabled={activeServiceIndex === 0}
                    className={`px-3 py-2 border rounded-md transition-colors ${
                      activeServiceIndex === 0
                        ? 'text-dark-textSecondary border-dark-border cursor-not-allowed bg-secondary-800'
                        : 'text-dark-text border-dark-border hover:bg-secondary-700 bg-secondary-800'
                    }`}
                  >
                    <i className="fas fa-chevron-left mr-1"></i> Trước
                  </button>
                  <button
                    onClick={() => setActiveServiceIndex(prev => Math.min(services.length - 1, prev + 1))}
                    disabled={activeServiceIndex === services.length - 1}
                    className={`px-3 py-2 border rounded-md transition-colors ${
                      activeServiceIndex === services.length - 1
                        ? 'text-dark-textSecondary border-dark-border cursor-not-allowed bg-secondary-800'
                        : 'text-dark-text border-dark-border hover:bg-secondary-700 bg-secondary-800'
                    }`}
                  >
                    Tiếp <i className="fas fa-chevron-right ml-1"></i>
                  </button>
                </div>
                
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
                >
                  <i className="fas fa-times mr-2"></i>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewResultsModal;