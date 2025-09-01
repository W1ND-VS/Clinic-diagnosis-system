import React, { useState, useEffect } from 'react';
import api from '../../../service/apiService';

const AIPredictionForm = ({ modelType, patientInfo, vitalSigns, examinationInfo, onClose, onPredictionResult }) => {
  const [formSchema, setFormSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Fetch model input requirements
  useEffect(() => {

    console.log('Model Type:', modelType);
    console.log('Patient Info:', patientInfo);
    console.log('Vital Signs:', vitalSigns);
    console.log('Examination Info:', examinationInfo);

    const fetchModelRequirements = async () => {
      try {
        setIsLoading(true);
        // Sửa endpoint: sử dụng dấu gạch ngang thay vì dấu gạch dưới
        const response = await api.get(`/phieukham/${modelType.replace(/_/g, '-')}-input-requirements`);

        if (response.data && response.data.success) {
          setFormSchema(response.data.data);

          // Pre-populate form data with patient info and vital signs
          const initialFormData = prepopulateFormData(response.data.data, patientInfo, vitalSigns);
          setFormData(initialFormData);
          calculateDerivedFields(initialFormData, response.data.data.fields);
        } else {
          throw new Error(response.data?.message || 'Không thể tải thông tin mô hình');
        }
      } catch (err) {
        console.error('Error fetching model requirements:', err);
        setError(err.message || 'Không thể tải thông tin mô hình');
      } finally {
        setIsLoading(false);
      }
    };

    if (modelType) {
      fetchModelRequirements();
    }
  }, [modelType, patientInfo, vitalSigns, examinationInfo]);

  // Pre-populate form data from patient info and vital signs
  const prepopulateFormData = (schema, patientInfo, vitalSigns) => {
    const data = {};

    if (!schema || !schema.fields) return data;

    schema.fields.forEach(field => {
      // Fill in from patient data
      if (field.id === 'age' && patientInfo.bn_ngaysinh) {
        // Calculate age from birth date
        const birthDate = new Date(patientInfo.bn_ngaysinh);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        data[field.id] = age;
      }

      // Giới tính - mapping cho heart disease model
      if (field.id === 'sex' && patientInfo.bn_gioitinh !== undefined) {
        // Convert gender to number: 0=Female, 1=Male (theo API response)
        if (typeof patientInfo.bn_gioitinh === 'boolean') {
          data[field.id] = patientInfo.bn_gioitinh ? 1 : 0; // true=Male=1, false=Female=0
        } else if (typeof patientInfo.bn_gioitinh === 'string') {
          data[field.id] = patientInfo.bn_gioitinh.toLowerCase() === 'male' ||
            patientInfo.bn_gioitinh.toLowerCase() === 'nam' ? 1 : 0;
        }
      }

      // Fill in from vital signs
      if (field.id === 'resting_blood_pressure' && vitalSigns.pk_huyetaptamthu) {
        data[field.id] = parseFloat(vitalSigns.pk_huyetaptamthu);
      }

      if (field.id === 'max_heart_rate_achieved' && vitalSigns.pk_nhiptim) {
        data[field.id] = parseFloat(vitalSigns.pk_nhiptim);
      }

      if (field.id === 'cholesterol' && vitalSigns.pk_cholesterol) {
        data[field.id] = parseFloat(vitalSigns.pk_cholesterol);
      }

      // Use default values for other fields
      if (data[field.id] === undefined && field.default !== undefined) {
        data[field.id] = field.default;
      }
    });

    return data;
  };

  // Calculate derived fields like BMI
  const calculateDerivedFields = (data, fields) => {
    const updatedData = { ...data };

    fields.forEach(field => {
      if (field.auto_calculated && field.depends_on && field.formula) {
        const dependencies = field.depends_on;
        const allDependenciesAvailable = dependencies.every(dep =>
          updatedData[dep] !== undefined && updatedData[dep] !== null && updatedData[dep] !== '');

        if (allDependenciesAvailable) {
          try {
            // Evaluate formula - simple case for BMI
            if (field.id === 'bmi' && updatedData.height && updatedData.weight) {
              const heightInMeters = updatedData.height / 100;
              updatedData.bmi = parseFloat((updatedData.weight / (heightInMeters * heightInMeters)).toFixed(1));
            }
          } catch (err) {
            console.error(`Error calculating ${field.id}:`, err);
          }
        }
      }
    });

    setFormData(updatedData);
  };

  const handleFieldChange = (fieldId, value) => {
    const updatedData = { ...formData, [fieldId]: value };
    setFormData(updatedData);

    // Auto-calculate dependent fields if enabled
    if (formSchema?.ui_config?.enable_auto_calculation) {
      calculateDerivedFields(updatedData, formSchema.fields);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      // Validate required fields - sử dụng required_fields từ API response
      const requiredFields = formSchema.required_fields || [];
      const missingFields = requiredFields.filter(fieldId =>
        formData[fieldId] === undefined || formData[fieldId] === null || formData[fieldId] === '');

      if (missingFields.length > 0) {
        const missingFieldNames = missingFields.map(fieldId => {
          const field = formSchema.fields.find(f => f.id === fieldId);
          return field ? field.name : fieldId;
        });
        throw new Error(`Vui lòng nhập đầy đủ thông tin bắt buộc: ${missingFieldNames.join(', ')}`);
      }

      // Xác định endpoint dựa trên examinationInfo hoặc patientInfo
      let endpoint;
      let pkMa, pkNgayKham;

      // Ưu tiên dùng examinationInfo
      if (examinationInfo && examinationInfo.pk_ma && examinationInfo.pk_ngaykham) {
        pkMa = examinationInfo.pk_ma;
        pkNgayKham = examinationInfo.pk_ngaykham;
      }
      // Nếu không có, thử patientInfo
      else if (patientInfo && (patientInfo.pk_ma || patientInfo.pkMa) && (patientInfo.pk_ngaykham || patientInfo.ngaykham)) {
        pkMa = patientInfo.pk_ma || patientInfo.pkMa;
        pkNgayKham = patientInfo.pk_ngaykham || patientInfo.ngaykham;
      }

      if (pkMa && pkNgayKham) {
        // Format date as YYYY-MM-DD
        const formattedDate = typeof pkNgayKham === 'string' ? pkNgayKham.split('T')[0] : new Date(pkNgayKham).toISOString().split('T')[0];
        // Sửa endpoint theo API mới
        const formattedModelType = modelType.replace(/_/g, '-');
        endpoint = `/phieukham/predict-${formattedModelType}-disease`;
      } else {
        // Fallback to generic prediction endpoint
        const formattedModelType = modelType.replace(/_/g, '-');
        endpoint = `/phieukham/predict-${formattedModelType}-disease`;
        console.warn('Missing examination info. Using generic endpoint:', endpoint);
      }

      console.log('Using endpoint:', endpoint);
      console.log('Form data:', formData);

      // Submit prediction request
      const response = await api.post(endpoint, formData);

      if (response.data && response.data.success) {
        const result = {
          // Mapping theo response structure thực tế
          probability: response.data.data.probability,
          probability_percentage: response.data.data.probability_percentage,
          risk_level: response.data.data.risk_level,
          prediction_label: response.data.data.prediction_label,
          model_confidence: response.data.data.model_confidence,
          diagnosis: response.data.data.diagnosis,
          confidence: response.data.data.confidence,
          recommendations: response.data.data.recommendations,

          // Thông tin bổ sung
          input_data: response.data.data.input_data,
          model_info: response.data.data.model_info,
          timestamp: response.data.data.timestamp,
          data_source: response.data.data.data_source,

          // Suggested update cho việc thêm vào phiếu khám
          suggested_update: {
            pk_chandoan: response.data.data.diagnosis,
            probability: response.data.data.probability_percentage,
            risk_level: response.data.data.risk_level,
            recommendations: response.data.data.recommendations
          },

          // Include full response for complete data
          full_response: response.data.data
        };

        setResult(result);
        if (onPredictionResult) {
          onPredictionResult(result);
        }
      } else {
        throw new Error(response.data?.message || 'Lỗi khi thực hiện dự đoán');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.message || 'Lỗi khi thực hiện dự đoán');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render field
  const renderField = (field) => {
    const isRecommended = formSchema.recommended_fields?.includes(field.id);
    const isRequired = formSchema.required_fields?.includes(field.id);

    switch (field.type) {
      case 'number':
        return (
          <div key={field.id} className="mb-4">
            <div className="flex justify-between items-start mb-1">
              <label className="block text-sm font-medium text-dark-text">
                {field.name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
                {isRecommended && (
                  <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                    Khuyến nghị
                  </span>
                )}
              </label>
            </div>

            <div className="relative">
              <input
                type="number"
                id={field.id}
                name={field.id}
                min={field.min}
                max={field.max}
                step={field.step || 1}
                value={formData[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={field.normal_range || field.description}
                className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                required={isRequired}
              />

              {field.unit && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-dark-textSecondary text-sm">{field.unit}</span>
                </div>
              )}
            </div>

            {field.description && (
              <p className="text-xs text-dark-textSecondary mt-1">{field.description}</p>
            )}

            {field.clinical_note && (
              <p className="text-xs text-blue-300 mt-1 italic">{field.clinical_note}</p>
            )}

            {field.normal_range && (
              <p className="text-xs text-green-400 mt-1">Bình thường: {field.normal_range}</p>
            )}

            {field.high_risk && (
              <p className="text-xs text-red-400 mt-1">Nguy cơ cao: {field.high_risk}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="mb-4">
            <div className="flex justify-between items-start mb-1">
              <label className="block text-sm font-medium text-dark-text">
                {field.name}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
                {isRecommended && (
                  <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                    Khuyến nghị
                  </span>
                )}
              </label>
            </div>

            <select
              id={field.id}
              name={field.id}
              value={formData[field.id] !== undefined ? formData[field.id] : (field.default !== undefined ? field.default : '')}
              onChange={(e) => {
                let value = e.target.value;
                // Nếu tất cả option value là số, thì ép kiểu, ngược lại giữ nguyên string
                const allNumber = field.options.every(opt => typeof opt.value === 'number');
                if (value === '') value = undefined;
                else if (allNumber) value = Number(value);
                handleFieldChange(field.id, value);
              }}
              className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {!isRequired && !field.default && (
                <option value="">-- Chọn --</option>
              )}
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {field.description && (
              <p className="text-xs text-dark-textSecondary mt-1">{field.description}</p>
            )}

            {field.clinical_note && (
              <p className="text-xs text-blue-300 mt-1 italic">{field.clinical_note}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="mb-4">
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-dark-text">
                {field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>

            <div className="space-y-2 mt-2">
              {field.options.map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={formData[field.id] == option.value}
                    onChange={() => handleFieldChange(field.id, option.value)}
                    className="h-4 w-4 text-primary border-dark-border focus:ring-primary bg-secondary-900"
                  />
                  <span className="ml-2 text-sm text-dark-text">{option.label}</span>
                </label>
              ))}
            </div>

            {field.description && (
              <p className="text-xs text-dark-textSecondary mt-1">{field.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-dark-textSecondary">Đang tải mô hình dự đoán...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900 bg-opacity-20 text-red-400 p-4 rounded-lg mb-4">
          <div className="flex items-start">
            <i className="fas fa-exclamation-circle mt-0.5 mr-2"></i>
            <div>
              <p className="font-medium">Lỗi khi tải mô hình</p>
              <p className="mt-1 text-sm">{error}</p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-md text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-medium text-dark-text">
              {formSchema.metadata?.model_name || `Dự đoán ${modelType}`}
            </h2>
            <p className="text-dark-textSecondary mt-1">
              {formSchema.metadata?.description || 'Nhập các thông số để nhận kết quả dự đoán'}
            </p>
            {formSchema.metadata && (
              <div className="mt-2 flex items-center space-x-4 text-xs text-dark-textSecondary">
                <span className="flex items-center">
                  <i className="fas fa-chart-pie mr-1"></i>
                  Độ chính xác: {formSchema.metadata.accuracy}
                </span>
                <span className="flex items-center">
                  <i className="fas fa-database mr-1"></i>
                  {formSchema.metadata.total_features} đặc trưng
                </span>
                <span className="flex items-center">
                  <i className="fas fa-code-branch mr-1"></i>
                  v{formSchema.metadata.version}
                </span>
              </div>
            )}
          </div>

          {/* Hiển thị kết quả nếu có - cập nhật theo response mới */}
          {result && (
            <div className="bg-secondary-900 rounded-lg p-5 mb-6 border border-dark-border">
              {/* Header với timestamp */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-dark-text flex items-center">
                  <i className="fas fa-chart-pie text-primary-400 mr-2"></i>
                  Kết quả dự đoán
                </h3>
                {result.timestamp && (
                  <div className="text-xs text-dark-textSecondary">
                    <i className="fas fa-clock mr-1"></i>
                    {new Date(result.timestamp).toLocaleString('vi-VN')}
                  </div>
                )}
              </div>

              {/* Main results grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="bg-secondary-800 p-4 rounded-lg">
                  <div className="text-dark-textSecondary text-sm mb-1">Chẩn đoán:</div>
                  <div className="text-xl font-bold text-dark-text">
                    {result.diagnosis}
                  </div>
                  <div className="mt-1 text-dark-textSecondary text-sm">
                    {result.prediction_label}
                  </div>
                </div>

                <div className="bg-secondary-800 p-4 rounded-lg">
                  <div className="text-dark-textSecondary text-sm mb-1">Xác suất:</div>
                  <div className="flex items-end">
                    <span className="text-xl font-bold" style={{
                      color: result.risk_level === 'Very High Risk' ? '#ef4444' :
                        result.risk_level === 'High Risk' ? '#f97316' :
                          result.risk_level === 'Medium Risk' ? '#eab308' :
                            result.risk_level === 'Low Risk' ? '#22c55e' : '#10b981'
                    }}>
                      {result.probability_percentage}%
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-dark-textSecondary">
                    Độ tin cậy mô hình: {result.confidence ? Math.round(result.confidence * 100) : 'N/A'}%
                  </div>
                </div>

                <div className="bg-secondary-800 p-4 rounded-lg">
                  <div className="text-dark-textSecondary text-sm mb-1">Mức độ nguy cơ:</div>
                  <div className="text-lg font-bold" style={{
                    color: result.risk_level === 'Very High Risk' ? '#ef4444' :
                      result.risk_level === 'High Risk' ? '#f97316' :
                        result.risk_level === 'Medium Risk' ? '#eab308' :
                          result.risk_level === 'Low Risk' ? '#22c55e' : '#10b981'
                  }}>
                    {result.risk_level === 'Very High Risk' ? 'Rất cao' :
                      result.risk_level === 'High Risk' ? 'Cao' :
                        result.risk_level === 'Medium Risk' ? 'Trung bình' :
                          result.risk_level === 'Low Risk' ? 'Thấp' : result.risk_level}
                  </div>
                  <div className="mt-1 text-dark-textSecondary text-sm">
                    Độ tin cậy: {result.model_confidence}
                  </div>
                </div>
              </div>

              {/* ĐÃ LOẠI BỎ PHẦN RECOMMENDATIONS */}
            </div>
          )}

          {/* Form fields */}
          {formSchema?.fields && (
            <div className="space-y-4">
              {formSchema.fields.map(field => renderField(field))}
            </div>
          )}

          {/* Hiển thị lỗi form */}
          {error && (
            <div className="bg-red-900 bg-opacity-20 text-red-400 p-3 rounded-lg mb-4 mt-4">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Các nút trong form */}
          <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-dark-border text-dark-text rounded-md hover:bg-secondary-800 transition-colors duration-200"
              disabled={isSubmitting}
            >
              {result ? 'Đóng' : 'Hủy'}
            </button>

            {!result && (
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors duration-200 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Đang dự đoán...
                  </>
                ) : (
                  <>
                    <i className="fas fa-calculator mr-2"></i>
                    Dự đoán
                  </>
                )}
              </button>
            )}

            {result && (
              <button
                type="button"
                onClick={() => {
                  // Reset form để thực hiện dự đoán khác
                  setResult(null);
                  setError(null);
                }}
                className="px-4 py-2 bg-secondary-700 text-dark-text rounded-md hover:bg-secondary-600 transition-colors duration-200"
              >
                <i className="fas fa-redo mr-2"></i>
                Dự đoán lại
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default AIPredictionForm;