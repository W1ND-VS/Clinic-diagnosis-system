import React, { useState, useEffect, useRef } from 'react';
import api from '../../../service/apiService';
import AIPredictionForm from './AIPredictionForm';
import predictionModels from '../../../data/predictionModels';

const DiagnosisSuggestionModal = ({
  isOpen,
  onClose,
  onSelectDiagnosis,
  currentDiagnoses = [],
  patientInfo,
  vitalSigns
}) => {
  // States chính
  const [activeTab, setActiveTab] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [diagnoses, setDiagnoses] = useState([]);
  const [commonDiagnoses, setCommonDiagnoses] = useState([]);
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null);

  // States cho dự đoán
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [selectedModelType, setSelectedModelType] = useState(null);
  const [selectedModelName, setSelectedModelName] = useState(null);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Thông tin sinh hiệu:', vitalSigns);
      fetchCategories();
      fetchCommonDiagnoses();
      fetchRecentDiagnoses();

      // Focus search input
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Search effect
  useEffect(() => {
    if (activeTab === 'search' && searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchDiagnoses(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (activeTab === 'search' && searchTerm.length < 2) {
      setDiagnoses([]);
    }
  }, [searchTerm, activeTab]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/benh/categories');
      if (response.data && response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Search diagnoses
  const searchDiagnoses = async (term) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('search', term);
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const response = await api.get(`/benh/search?${params}`);
      if (response.data && response.data.success) {
        setDiagnoses(response.data.data || []);
      }
    } catch (error) {
      console.error('Error searching diagnoses:', error);
      setDiagnoses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch common diagnoses
  const fetchCommonDiagnoses = async () => {
    try {
      const response = await api.get('/benh/common');
      if (response.data && response.data.success) {
        setCommonDiagnoses(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching common diagnoses:', error);
    }
  };

  // Fetch recent diagnoses
  const fetchRecentDiagnoses = async () => {
    try {
      const response = await api.get('/benh/recent');
      if (response.data && response.data.success) {
        setRecentDiagnoses(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching recent diagnoses:', error);
    }
  };

  // Check if diagnosis is already selected
  const isDiagnosisAlreadySelected = (code) => {
    return currentDiagnoses.some(d => d.b_ma === code);
  };

  // Start prediction
  const handleStartPrediction = (modelId, modelName) => {
    setSelectedModelType(modelId);
    setSelectedModelName(modelName);
    setShowPredictionForm(true);
  };

  // Handle prediction result
  const handlePredictionResult = (result) => {
    console.log('Prediction result:', result);
    
    if (result && result.suggested_update) {
      const diagnosis = {
        b_ma: predictionModels.find(m => m.id === selectedModelType)?.code || '',
        b_ten: result.prediction_label || selectedModelName,
        prediction_result: {
          probability: result.probability,
          probability_percentage: result.probability_percentage,
          risk_level: result.risk_level
        },
        suggested_update: result.suggested_update
      };
      
      // Add diagnosis if probability is high
      if (result.probability > 0.6) {
        onSelectDiagnosis(diagnosis);
      }
    }
  };

  // Diagnosis Card Component
  const DiagnosisCard = ({ diagnosis, onSelect, isSelected, showFrequency = false, showTimestamp = false }) => {
    return (
      <div
        className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${isSelected
            ? 'border-primary bg-primary bg-opacity-10'
            : 'border-dark-border bg-secondary-800 hover:bg-secondary-700'
          }`}
        onClick={() => onSelect(diagnosis)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-dark-text">{diagnosis.b_ten}</h4>
            <p className="text-sm text-dark-textSecondary mt-1">Mã: {diagnosis.b_ma}</p>
          </div>

          <div className="flex space-x-2">
            {isSelected && (
              <div className="text-primary-300">
                <i className="fas fa-check-circle"></i>
              </div>
            )}
          </div>
        </div>

        {diagnosis.b_mota && (
          <p className="text-sm text-dark-textSecondary mt-2 line-clamp-2">
            {diagnosis.b_mota}
          </p>
        )}

        {showFrequency && diagnosis.frequency && (
          <div className="mt-2 text-xs text-dark-textSecondary">
            Sử dụng: {diagnosis.frequency} lần
          </div>
        )}

        {showTimestamp && diagnosis.last_used && (
          <div className="mt-2 text-xs text-dark-textSecondary">
            Lần cuối: {new Date(diagnosis.last_used).toLocaleDateString('vi-VN')}
          </div>
        )}
      </div>
    );
  };

  // Render prediction form modal
  const renderPredictionForm = () => {
    if (!showPredictionForm || !selectedModelType) return null;

    const examinationInfo = {
      pk_ma: patientInfo?.pk_ma || patientInfo?.pkMa || patientInfo?.ma || patientInfo?.id || 1,
      pk_ngaykham: patientInfo?.pk_ngaykham || patientInfo?.ngaykham || new Date().toISOString().split('T')[0]
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
        <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto border border-dark-border">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-900 to-primary-800 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 bg-opacity-20 rounded-lg">
                <i className="fas fa-calculator text-primary-300 text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Dự đoán: {selectedModelName}</h3>
                <p className="text-sm text-primary-200 opacity-90">
                  Mô hình: {selectedModelType}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPredictionForm(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all duration-200"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Form */}
          <AIPredictionForm
            modelType={selectedModelType}
            patientInfo={patientInfo}
            vitalSigns={vitalSigns}
            examinationInfo={examinationInfo}
            onClose={() => setShowPredictionForm(false)}
            onPredictionResult={handlePredictionResult}
          />
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal - Chỉ hiển thị mô hình dự đoán */}
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-dark-border">

          {/* Header */}
          <div className="bg-gradient-to-r from-primary-900 to-primary-800 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 bg-opacity-20 rounded-lg">
                <i className="fas fa-calculator text-primary-300 text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold">Mô hình dự đoán chẩn đoán</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all duration-200"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Content - Chỉ hiển thị mô hình dự đoán */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-lg font-medium text-dark-text mb-4 flex items-center">
              <i className="fas fa-calculator text-blue-400 mr-2"></i>
              Chọn mô hình dự đoán
            </h3>

            <div className="mb-6 p-4 bg-secondary-800 rounded-lg border border-dark-border">
              <div className="flex items-start">
                <div className="mr-3 text-yellow-400 pt-1">
                  <i className="fas fa-lightbulb"></i>
                </div>
                <div>
                  <p className="text-sm text-dark-textSecondary">
                    Chọn một mô hình dự đoán để đánh giá nguy cơ mắc bệnh cho bệnh nhân.
                    Kết quả chỉ mang tính chất tham khảo và hỗ trợ cho việc ra quyết định lâm sàng.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictionModels.map(model => (
                <div
                  key={model.id}
                  className="border border-dark-border bg-secondary-800 rounded-lg overflow-hidden hover:border-primary-700 transition-all duration-200 cursor-pointer"
                  onClick={() => handleStartPrediction(model.id, model.name)}
                >
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-primary-900 flex items-center justify-center mr-3">
                        <i className={`fas fa-${model.icon} text-primary-300 text-xl`}></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-dark-text">{model.name}</h4>
                        <div className="flex items-center text-xs text-dark-textSecondary">
                          <span className="bg-secondary-700 px-2 py-0.5 rounded">{model.code}</span>
                          {model.accuracy && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="flex items-center">
                                <i className="fas fa-chart-pie mr-1"></i>
                                Độ chính xác: {Math.round(model.accuracy * 100)}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-dark-textSecondary mb-3">{model.description}</p>

                    {model.parameters && model.parameters.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <h5 className="text-xs text-dark-textSecondary font-medium mb-2 w-full">Thông số đầu vào:</h5>
                        {model.parameters.slice(0, 4).map(param => (
                          <span
                            key={param}
                            className="text-xs bg-secondary-700 text-dark-textSecondary px-2 py-1 rounded"
                          >
                            {param.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {model.parameters.length > 4 && (
                          <span className="text-xs text-dark-textSecondary">
                            +{model.parameters.length - 4} khác
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-primary-900 px-4 py-2 border-t border-dark-border">
                    <button className="w-full text-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors duration-200">
                      <i className="fas fa-calculator mr-1.5"></i>
                      Chọn mô hình này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-secondary-900 px-6 py-4 border-t border-dark-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-dark-textSecondary">
                <i className="fas fa-info-circle mr-1"></i>
                Chọn mô hình để bắt đầu dự đoán chẩn đoán
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Form Modal */}
      {renderPredictionForm()}
    </>
  );
};

export default DiagnosisSuggestionModal;