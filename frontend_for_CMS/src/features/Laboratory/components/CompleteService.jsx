import React, { useState, useEffect } from 'react';
import api from '../../../service/apiService';
import { toast } from 'react-toastify';

const CompleteService = ({
  services,
  onSave,
  onCancel,
  pcd_ma,
  results: serverResults,
  isViewOnly
}) => {
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completionDateTime, setCompletionDateTime] = useState(new Date().toISOString().split('.')[0]);

  useEffect(() => {
    if (services && services.length > 0) {
      // Chuyển đổi dữ liệu từ response API thành format component cần
      const mappedResults = services.map(service => ({
        service_id: service.dvyt_ma,
        service_name: service.dvyt_ten,
        don_gia: service.don_gia,
        file: null,
        trang_thai: 'pending',
        indicators: service.chi_so.map(cs => ({
          name: cs.cs_ten,
          value: cs.kq_ketqua || '', // Giá trị đã nhập hoặc rỗng
          unit: cs.cs_donvi || '',
          reference: cs.cs_mucbthuong || '',
          interpretation: '',
          indicator_id: cs.cs_ma
        }))
      }));

      setResults(mappedResults);

      // Nếu có kết quả (đã hoàn thành), set thời gian completion
      if (serverResults && serverResults.phieu_info.pcd_ngay && serverResults.phieu_info.pcd_gio) {
        const dateTime = `${serverResults.phieu_info.pcd_ngay}T${serverResults.phieu_info.pcd_gio}`;
        setCompletionDateTime(dateTime);
      }
    }
  }, [services, serverResults, isViewOnly]);

  const handleChange = (e, index) => {
    if (isViewOnly) return;

    const { name, value } = e.target;
    setResults(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [name]: value
      };
      return updated;
    });
  };

  const handleFileChange = (e, index) => {
    if (isViewOnly) return;

    const file = e.target.files[0];
    if (file) {
      setResults(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          file
        };
        return updated;
      });
    }
  };

  // Cập nhật giá trị chỉ số
  const updateIndicator = (serviceIndex, indicatorIndex, field, value) => {
    if (isViewOnly) return;

    setResults(prevResults => {
      const updatedResults = JSON.parse(JSON.stringify(prevResults));
      updatedResults[serviceIndex].indicators[indicatorIndex][field] = value;
      return updatedResults;
    });
  };

  // Xóa chỉ số
  const removeIndicator = (serviceIndex, indicatorIndex) => {
    if (isViewOnly) return;

    setResults(prev => {
      const updated = [...prev];
      updated[serviceIndex].indicators = updated[serviceIndex].indicators.filter((_, i) => i !== indicatorIndex);
      return updated;
    });
  };

  // Validation
  const validateData = () => {
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.indicators.length === 0) {
        setActiveServiceIndex(i);
        setError(`Vui lòng thêm ít nhất một chỉ số cho dịch vụ ${result.service_name}`);
        return false;
      }

      // Kiểm tra xem các chỉ số có giá trị không
      const hasEmptyValues = result.indicators.some(indicator => !indicator.value);
      if (hasEmptyValues) {
        setActiveServiceIndex(i);
        setError(`Vui lòng nhập đầy đủ giá trị cho các chỉ số của dịch vụ ${result.service_name}`);
        return false;
      }
    }
    return true;
  };

  // Xử lý thay đổi ngày giờ
  const handleDateTimeChange = (e) => {
    if (isViewOnly) return;
    setCompletionDateTime(e.target.value);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isViewOnly) {
      onCancel();
      return;
    }

    if (!validateData()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Tách ngày giờ từ completionDateTime
      const dateObj = new Date(completionDateTime);
      const pcd_ngay = dateObj.toISOString().split('T')[0];
      const pcd_gio = dateObj.toTimeString().split(' ')[0];

      // Thu thập tất cả các chỉ số từ tất cả các dịch vụ
      const allItems = [];
      const uploadPromises = [];

      // Lặp qua từng kết quả để thu thập chỉ số
      results.forEach(result => {
        if (result.indicators && result.indicators.length > 0) {
          // Thu thập các chỉ số từ dịch vụ này
          const serviceItems = result.indicators.map(indicator => ({
            dvyt_ma: result.service_id,
            cs_ma: indicator.indicator_id,
            kq_ketqua: indicator.value
          }));

          allItems.push(...serviceItems);
        }

        // Nếu có file, tạo promise tải lên file riêng
        if (result.file) {
          const fileFormData = new FormData();
          fileFormData.append('file', result.file);

          const filePromise = api.post(
            `/ketqua/service/${pcd_ma}/${result.service_id}/upload-file`,
            fileFormData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              }
            }
          );

          uploadPromises.push(filePromise);
        }
      });

      // Tạo đối tượng kết quả tổng hợp
      const combinedResults = {
        pcd_ngay,
        pcd_gio,
        items: allItems
      };

      console.log('Submitting batch update:', JSON.stringify(combinedResults, null, 2));

      // Gửi request JSON cho dữ liệu chỉ số
      const indicatorsResponse = await api.put(
        `/ketqua/batch-update/${pcd_ma}`,
        combinedResults,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      // Đợi tất cả các file upload hoàn tất (nếu có)
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      if (indicatorsResponse.data && indicatorsResponse.data.success) {
        toast.success('Kết quả đã được lưu thành công!');
        onSave(results);
        console.log('Kết quả đã được lưu thành công:', indicatorsResponse.data);
      } else {
        throw new Error(indicatorsResponse.data?.message || 'Không thể lưu kết quả');
      }
    } catch (err) {
      console.error('Error saving service results:', err);
      const errorMessage = 'Có lỗi xảy ra khi lưu kết quả: ' + (err.response?.data?.message || err.message || 'Lỗi không xác định');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra nếu không có dịch vụ
  if (!services || services.length === 0 || results.length === 0) {
    return (
      <div className="p-6 bg-dark-card rounded-lg shadow-md border border-dark-border">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-yellow-400 text-4xl mb-4"></i>
          <p className="text-dark-textSecondary">Không có dịch vụ nào để nhập kết quả</p>
        </div>
      </div>
    );
  }

  // Lấy dịch vụ và kết quả hiện tại
  const currentResult = results[activeServiceIndex];
  const currentService = services[activeServiceIndex];

  return (
    <div className="bg-dark-card rounded-lg shadow-md p-6 text-dark-text">
      {/* Header với danh sách dịch vụ */}
      <div className="border-b border-dark-border pb-4 mb-4">
        <h2 className="text-xl font-semibold text-dark-text mb-4">
          {isViewOnly ? 'Xem kết quả xét nghiệm' : 'Nhập kết quả xét nghiệm'}
        </h2>

        {/* Ngày giờ thực hiện */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-dark-text mb-1">
            Ngày giờ thực hiện xét nghiệm
          </label>
          <input
            type="datetime-local"
            value={completionDateTime}
            onChange={handleDateTimeChange}
            disabled={isViewOnly}
            className={`w-full md:w-1/3 p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary ${isViewOnly ? 'bg-secondary-900' : ''
              }`}
          />
        </div>

        {/* Tab dịch vụ */}
        <div className="flex overflow-x-auto pb-2 space-x-2">
          {services.map((service, index) => {
            const resultCount = results[index]?.indicators?.filter(ind => ind.value)?.length || 0;
            const totalCount = results[index]?.indicators?.length || 0;

            return (
              <button
                key={service.dvyt_ma}
                onClick={() => setActiveServiceIndex(index)}
                className={`py-2 px-4 rounded-md whitespace-nowrap text-sm flex-shrink-0 transition-colors ${index === activeServiceIndex
                    ? 'bg-primary text-white'
                    : 'bg-secondary-800 text-dark-textSecondary hover:bg-secondary-700 hover:text-dark-text border border-dark-border'
                  }`}
              >
                <div className="flex flex-col items-center">
                  <span>{service.dvyt_ten}</span>
                  <span className="text-xs mt-1 opacity-80">
                    ({resultCount}/{totalCount} chỉ số)
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900 text-red-300 rounded-md border border-red-800">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <div className="col-span-1 flex justify-between items-center bg-primary-900 p-3 rounded-md mb-2">
            <h3 className="font-medium text-primary-300">
              {currentService.dvyt_ten}
            </h3>
            <div className="text-sm px-3 py-1 rounded-full bg-primary-800 text-primary-200">
              {currentService.don_gia?.toLocaleString('vi-VN')}đ
            </div>
          </div>

          {/* Bảng chỉ số xét nghiệm */}
          <div className="col-span-1">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-dark-text">
                Các chỉ số xét nghiệm ({currentResult.indicators.length})
              </label>
            </div>

            {currentResult.indicators.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-dark-border rounded-md bg-secondary-900 text-dark-textSecondary text-sm">
                <i className="fas fa-exclamation-triangle text-yellow-400 text-2xl mb-2"></i>
                <p>Dịch vụ này không có chỉ số nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-dark-border rounded-md">
                <table className="min-w-full divide-y divide-dark-border">
                  <thead className="bg-secondary-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Chỉ số</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Kết quả</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Đơn vị</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Giá trị bình thường</th>
                      {!isViewOnly && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Thao tác</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-dark-card divide-y divide-dark-border">
                    {currentResult.indicators.map((indicator, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-dark-card' : 'bg-secondary-900'}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-dark-text">
                            {indicator.name}
                          </div>
                          <div className="text-xs text-dark-textSecondary">
                            Mã: {indicator.indicator_id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={indicator.value}
                            onChange={(e) => updateIndicator(activeServiceIndex, idx, 'value', e.target.value)}
                            disabled={isViewOnly}
                            className={`w-full p-1.5 border border-dark-border rounded text-sm bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary ${isViewOnly ? 'bg-secondary-900' : ''
                              }`}
                            placeholder="Nhập giá trị"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-dark-text">{indicator.unit}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-dark-textSecondary">{indicator.reference}</span>
                        </td>
                        {!isViewOnly && (
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeIndicator(activeServiceIndex, idx)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Xóa chỉ số"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upload file */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-dark-text mb-1">
              Tải lên hình ảnh/file kết quả (nếu có)
            </label>
            <input
              type="file"
              name="file"
              onChange={(e) => handleFileChange(e, activeServiceIndex)}
              disabled={isViewOnly}
              className={`w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary ${isViewOnly ? 'bg-secondary-900' : ''
                }`}
              accept="image/*,.pdf"
            />
            {currentResult.file && (
              <div className="mt-2 p-2 bg-secondary-900 border border-dark-border rounded text-sm text-dark-textSecondary">
                <i className="fas fa-file mr-2"></i>
                File đã chọn: {currentResult.file.name}
              </div>
            )}
          </div>
        </div>

        {/* Navigation và buttons */}
        <div className="mt-6 flex justify-between items-center">
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => setActiveServiceIndex(prev => Math.max(0, prev - 1))}
              disabled={activeServiceIndex === 0}
              className={`px-3 py-1.5 border rounded-md transition-colors ${activeServiceIndex === 0
                  ? 'text-dark-textSecondary border-dark-border cursor-not-allowed bg-secondary-900'
                  : 'text-dark-text border-dark-border hover:bg-secondary-800 bg-secondary-900'
                }`}
            >
              <i className="fas fa-chevron-left mr-1"></i> Trước
            </button>
            <button
              type="button"
              onClick={() => setActiveServiceIndex(prev => Math.min(services.length - 1, prev + 1))}
              disabled={activeServiceIndex === services.length - 1}
              className={`px-3 py-1.5 border rounded-md transition-colors ${activeServiceIndex === services.length - 1
                  ? 'text-dark-textSecondary border-dark-border cursor-not-allowed bg-secondary-900'
                  : 'text-dark-text border-dark-border hover:bg-secondary-800 bg-secondary-900'
                }`}
            >
              Tiếp <i className="fas fa-chevron-right ml-1"></i>
            </button>
          </div>
          <div className="space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-dark-border rounded-md text-dark-text hover:bg-secondary-800 bg-secondary-900 focus:outline-none focus:ring-2 focus:ring-secondary-700 transition-colors"
            >
              {isViewOnly ? 'Đóng' : 'Hủy'}
            </button>

            {!isViewOnly && (
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Lưu tất cả kết quả
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompleteService;