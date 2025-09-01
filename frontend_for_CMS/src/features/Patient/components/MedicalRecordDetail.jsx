import React, { useState, useEffect } from 'react';
import api from '../../../service/apiService';

const MedicalRecordDetail = ({ recordId, recordDate, patientData, onClose }) => {
    const [recordDetail, setRecordDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [prescriptions, setPrescriptions] = useState([]);
    const [services, setServices] = useState(null);
    const [diagnoses, setDiagnoses] = useState([]);
    const [symptoms, setSymptoms] = useState([]);

    useEffect(() => {
        if (recordId) {
            fetchRecordDetail();
            fetchPrescriptions();
            fetchServices();
            fetchSymptoms();
            fetchDiagnoses();
        }
    }, [recordId]);



    // Fetch diagnoses khi có prescriptions
    useEffect(() => {
        if (prescriptions.length > 0 && diagnoses.length === 0) {
            fetchDiagnoses();
        }
    }, [prescriptions]);

    const fetchRecordDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/phieukham/${recordId}/${recordDate}`);
            if (response.data && response.data.success) {
                setRecordDetail(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching record detail:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrescriptions = async () => {
        try {
            const response = await api.get(`/toathuoc/phieukham/${recordId}/${recordDate}`);
            if (response.data && response.data.success) {
                setPrescriptions(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching prescriptions:", error);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await api.get(`/ketqua/detailed-results/phieukham/${recordId}/${recordDate}`);
            if (response.data && response.data.success) {
                setServices(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching services:", error);
        }
    };

    const fetchDiagnoses = async () => {
        try {
            const response = await api.get(`/chandoan/toa-thuoc/${prescriptions[0]?.tt_matthuoc}`);
            if (response.data && response.data.success) {
                console.log("Diagnoses data:", response.data.data);
                setDiagnoses(response.data.data.diseases || []);
            }
        } catch (error) {
            console.error("Error fetching diagnoses:", error);
        }
    };

    const fetchSymptoms = async () => {
        try {
            const response = await api.get(`/phieukham/trieu-chung/${recordId}/${recordDate}`);
            if (response.data && response.data.success) {
                setSymptoms(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching symptoms:", error);
        }
    };

    const renderGeneralInfo = () => (
        <div className="space-y-6">
            {/* Thông tin phiếu khám */}
            <div className="bg-secondary-900 rounded-lg p-6 border border-dark-border">
                <h3 className="text-lg font-semibold text-primary-300 mb-4 flex items-center">
                    <i className="fas fa-file-medical mr-2"></i>
                    Thông tin phiếu khám
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-dark-textSecondary mb-2">
                            <span className="font-medium">Mã phiếu khám:</span>
                            <span className="ml-2 font-mono bg-primary-900 bg-opacity-20 text-primary-300 px-2 py-1 rounded">
                                {recordDetail?.pk_ma}
                            </span>
                        </p>
                        <p className="text-dark-textSecondary mb-2">
                            <span className="font-medium">Ngày khám:</span>
                            <span className="ml-2 text-dark-text">
                                {recordDetail?.pk_ngaykham ? new Date(recordDetail.pk_ngaykham).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                            </span>
                        </p>
                        <p className="text-dark-textSecondary mb-2">
                            <span className="font-medium">Mã nhân viên:</span>
                            <span className="ml-2 font-mono bg-blue-900 bg-opacity-20 text-blue-300 px-2 py-1 rounded">
                                {recordDetail?.nv_ma || 'Chưa có'}
                            </span>
                        </p>
                    </div>
                    
                    <div>
                        <p className="text-dark-textSecondary mb-2">
                            <span className="font-medium">Trạng thái:</span>
                            <span 
                                className="ml-2 px-2 py-1 rounded-full text-xs font-medium"
                                style={{ 
                                    backgroundColor: `${recordDetail?.status_info?.color || '#6c757d'}20`,
                                    color: recordDetail?.status_info?.color || '#6c757d'
                                }}
                            >
                                <i className={`fas ${
                                    recordDetail?.status_info?.is_completed ? 'fa-check-circle' :
                                    recordDetail?.status_info?.is_cancelled ? 'fa-times-circle' :
                                    recordDetail?.status_info?.is_active ? 'fa-clock' : 'fa-question-circle'
                                } mr-1`}></i>
                                {recordDetail?.pk_trangthai || 'Không xác định'}
                            </span>
                        </p>
                        
                        <p className="text-dark-textSecondary mb-2">
                            <span className="font-medium">Mã phiếu hẹn:</span>
                            <span className="ml-2 font-mono bg-orange-900 bg-opacity-20 text-orange-300 px-2 py-1 rounded">
                                {recordDetail?.ph_ma || 'Không có'}
                            </span>
                        </p>
                        
                        {recordDetail?.pcd_ma && (
                            <p className="text-dark-textSecondary mb-2">
                                <span className="font-medium">Mã phiếu chỉ định:</span>
                                <span className="ml-2 font-mono bg-purple-900 bg-opacity-20 text-purple-300 px-2 py-1 rounded">
                                    {recordDetail.pcd_ma}
                                </span>
                            </p>
                        )}
                        
                        {recordDetail?.tt_matthuoc && (
                            <p className="text-dark-textSecondary mb-2">
                                <span className="font-medium">Mã toa thuốc:</span>
                                <span className="ml-2 font-mono bg-green-900 bg-opacity-20 text-green-300 px-2 py-1 rounded">
                                    {recordDetail.tt_matthuoc}
                                </span>
                            </p>
                        )}
                    </div>
                    
                    <div>
                        <p className="text-dark-textSecondary mb-2">
                            <span className="font-medium">Giờ khám dự kiến:</span>
                            <span className="ml-2 text-dark-text">
                                {recordDetail?.pk_giokhamdukien || 'Chưa cập nhật'}
                            </span>
                        </p>
                        <p className="text-dark-textSecondary mb-2">
                            <span className="font-medium">Giờ khám thực tế:</span>
                            <span className="ml-2 text-dark-text">
                                {recordDetail?.pk_giokhamthucte || 'Chưa cập nhật'}
                            </span>
                        </p>
                        <p className="text-dark-textSecondary mb-2">
                            <span className="font-medium">Giờ kết thúc:</span>
                            <span className="ml-2 text-dark-text">
                                {recordDetail?.pk_gioketthuc || 'Chưa cập nhật'}
                            </span>
                        </p>
                    </div>
                </div>
                
                {/* Thông tin trạng thái chi tiết */}
                {recordDetail?.status_info && (
                    <div className="mt-4 pt-4 border-t border-dark-border">
                        <div className="bg-secondary-800 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-dark-text mb-2">Thông tin trạng thái:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="flex items-center">
                                    <i className={`fas ${recordDetail.status_info.is_active ? 'fa-check text-green-400' : 'fa-times text-red-400'} mr-2`}></i>
                                    <span className="text-dark-textSecondary">Đang hoạt động</span>
                                </div>
                                <div className="flex items-center">
                                    <i className={`fas ${recordDetail.status_info.is_completed ? 'fa-check text-green-400' : 'fa-times text-red-400'} mr-2`}></i>
                                    <span className="text-dark-textSecondary">Đã hoàn thành</span>
                                </div>
                                <div className="flex items-center">
                                    <i className={`fas ${recordDetail.status_info.is_cancelled ? 'fa-check text-red-400' : 'fa-times text-green-400'} mr-2`}></i>
                                    <span className="text-dark-textSecondary">Đã hủy</span>
                                </div>
                                <div className="flex items-center">
                                    <i className={`fas ${recordDetail.status_info.can_be_billed ? 'fa-check text-green-400' : 'fa-times text-red-400'} mr-2`}></i>
                                    <span className="text-dark-textSecondary">Có thể thanh toán</span>
                                </div>
                            </div>
                            <div className="mt-2">
                                <span className="text-dark-textSecondary text-xs">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    {recordDetail.status_info.description}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Chỉ số sinh hiệu */}
            <div className="bg-secondary-900 rounded-lg p-6 border border-dark-border">
                <h3 className="text-lg font-semibold text-primary-300 mb-4 flex items-center">
                    <i className="fas fa-heartbeat mr-2"></i>
                    Chỉ số sinh hiệu
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Cân nặng */}
                    <div className="bg-secondary-800 p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-weight text-blue-400"></i>
                            <span className="text-xs text-dark-textSecondary">Cân nặng</span>
                        </div>
                        <div className="text-xl font-bold text-dark-text">
                            {recordDetail?.pk_cannang ? `${recordDetail.pk_cannang} kg` : 'Chưa đo'}
                        </div>
                    </div>

                    {/* Chiều cao */}
                    <div className="bg-secondary-800 p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-ruler-vertical text-green-400"></i>
                            <span className="text-xs text-dark-textSecondary">Chiều cao</span>
                        </div>
                        <div className="text-xl font-bold text-dark-text">
                            {recordDetail?.pk_chieucao ? `${recordDetail.pk_chieucao} cm` : 'Chưa đo'}
                        </div>
                    </div>

                    {/* BMI (tính toán) */}
                    {recordDetail?.pk_cannang && recordDetail?.pk_chieucao && (
                        <div className="bg-secondary-800 p-4 rounded-lg border border-dark-border">
                            <div className="flex items-center justify-between mb-2">
                                <i className="fas fa-calculator text-purple-400"></i>
                                <span className="text-xs text-dark-textSecondary">BMI</span>
                            </div>
                            <div className="text-xl font-bold text-dark-text">
                                {((recordDetail.pk_cannang / ((recordDetail.pk_chieucao / 100) ** 2)).toFixed(1))}
                            </div>
                            <div className="text-xs text-dark-textSecondary mt-1">
                                {(() => {
                                    const bmi = recordDetail.pk_cannang / ((recordDetail.pk_chieucao / 100) ** 2);
                                    if (bmi < 18.5) return 'Thiếu cân';
                                    if (bmi < 25) return 'Bình thường';
                                    if (bmi < 30) return 'Thừa cân';
                                    return 'Béo phì';
                            })()}
                            </div>
                        </div>
                    )}

                    {/* Nhiệt độ */}
                    <div className="bg-secondary-800 p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-thermometer-half text-red-400"></i>
                            <span className="text-xs text-dark-textSecondary">Nhiệt độ</span>
                        </div>
                        <div className="text-xl font-bold text-dark-text">
                            {recordDetail?.pk_nhietdo ? `${recordDetail.pk_nhietdo}°C` : 'Chưa đo'}
                        </div>
                        {recordDetail?.pk_nhietdo && (
                            <div className={`text-xs mt-1 ${
                                recordDetail.pk_nhietdo >= 37.5 ? 'text-red-400' :
                                recordDetail.pk_nhietdo <= 36 ? 'text-blue-400' : 'text-green-400'
                            }`}>
                                {recordDetail.pk_nhietdo >= 37.5 ? 'Sốt' :
                                 recordDetail.pk_nhietdo <= 36 ? 'Hạ thân nhiệt' : 'Bình thường'}
                            </div>
                        )}
                    </div>

                    {/* Nhịp tim */}
                    <div className="bg-secondary-800 p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-heart text-red-400"></i>
                            <span className="text-xs text-dark-textSecondary">Nhịp tim</span>
                        </div>
                        <div className="text-xl font-bold text-dark-text">
                            {recordDetail?.pk_nhiptim ? `${recordDetail.pk_nhiptim} bpm` : 'Chưa đo'}
                        </div>
                        {recordDetail?.pk_nhiptim && (
                            <div className={`text-xs mt-1 ${
                                recordDetail.pk_nhiptim > 100 || recordDetail.pk_nhiptim < 60 ? 'text-red-400' : 'text-green-400'
                            }`}>
                                {recordDetail.pk_nhiptim > 100 ? 'Nhanh' :
                                 recordDetail.pk_nhiptim < 60 ? 'Chậm' : 'Bình thường'}
                            </div>
                        )}
                    </div>

                    {/* Nhịp thở */}
                    <div className="bg-secondary-800 p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-lungs text-cyan-400"></i>
                            <span className="text-xs text-dark-textSecondary">Nhịp thở</span>
                        </div>
                        <div className="text-xl font-bold text-dark-text">
                            {recordDetail?.pk_nhiptho ? `${recordDetail.pk_nhiptho}/phút` : 'Chưa đo'}
                        </div>
                        {recordDetail?.pk_nhiptho && (
                            <div className={`text-xs mt-1 ${
                                recordDetail.pk_nhiptho > 20 || recordDetail.pk_nhiptho < 12 ? 'text-red-400' : 'text-green-400'
                            }`}>
                                {recordDetail.pk_nhiptho > 20 ? 'Nhanh' :
                                 recordDetail.pk_nhiptho < 12 ? 'Chậm' : 'Bình thường'}
                            </div>
                        )}
                    </div>

                    {/* Huyết áp tâm thu */}
                    <div className="bg-secondary-800 p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-tint text-red-500"></i>
                            <span className="text-xs text-dark-textSecondary">HA Tâm thu</span>
                        </div>
                        <div className="text-xl font-bold text-dark-text">
                            {recordDetail?.pk_huyetap_tamthu ? `${recordDetail.pk_huyetap_tamthu} mmHg` : 'Chưa đo'}
                        </div>
                        {recordDetail?.pk_huyetap_tamthu && (
                            <div className={`text-xs mt-1 ${
                                recordDetail.pk_huyetap_tamthu >= 140 ? 'text-red-400' :
                                recordDetail.pk_huyetap_tamthu >= 120 ? 'text-orange-400' : 'text-green-400'
                            }`}>
                                {recordDetail.pk_huyetap_tamthu >= 140 ? 'Cao' :
                                 recordDetail.pk_huyetap_tamthu >= 120 ? 'Hơi cao' : 'Bình thường'}
                            </div>
                        )}
                    </div>

                    {/* Huyết áp tâm trương */}
                    <div className="bg-secondary-800 p-4 rounded-lg border border-dark-border">
                        <div className="flex items-center justify-between mb-2">
                            <i className="fas fa-tint text-blue-500"></i>
                            <span className="text-xs text-dark-textSecondary">HA Tâm trương</span>
                        </div>
                        <div className="text-xl font-bold text-dark-text">
                            {recordDetail?.pk_huyetap_tamtruong ? `${recordDetail.pk_huyetap_tamtruong} mmHg` : 'Chưa đo'}
                        </div>
                        {recordDetail?.pk_huyetap_tamtruong && (
                            <div className={`text-xs mt-1 ${
                                recordDetail.pk_huyetap_tamtruong >= 90 ? 'text-red-400' :
                                recordDetail.pk_huyetap_tamtruong >= 80 ? 'text-orange-400' : 'text-green-400'
                            }`}>
                                {recordDetail.pk_huyetap_tamtruong >= 90 ? 'Cao' :
                                 recordDetail.pk_huyetap_tamtruong >= 80 ? 'Hơi cao' : 'Bình thường'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Triệu chứng - giữ nguyên */}
            <div className="bg-secondary-900 rounded-lg p-6 border border-dark-border">
                <h3 className="text-lg font-semibold text-primary-300 mb-4 flex items-center">
                    <i className="fas fa-thermometer-half mr-2"></i>
                    Triệu chứng
                </h3>
                <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
                    {symptoms && symptoms.length > 0 ? (
                        <div className="space-y-2">
                            {symptoms.map((symptom, index) => (
                                <div key={index} className="flex items-start">
                                    <i className="fas fa-circle text-primary-300 text-xs mt-2 mr-3"></i>
                                    <div>
                                        <p className="text-dark-text font-medium">{symptom.tc_ten}</p>
                                        {symptom.tc_mota && (
                                            <p className="text-dark-textSecondary text-sm mt-1">{symptom.tc_mota}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-dark-text leading-relaxed">
                            {recordDetail?.pk_trieuchung || 'Không có triệu chứng được ghi nhận'}
                        </p>
                    )}
                </div>
            </div>

            {/* Chẩn đoán - giữ nguyên */}
            <div className="bg-secondary-900 rounded-lg p-6 border border-dark-border">
                <h3 className="text-lg font-semibold text-primary-300 mb-4 flex items-center">
                    <i className="fas fa-stethoscope mr-2"></i>
                    Chẩn đoán
                </h3>
                <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
                    {diagnoses && diagnoses.length > 0 ? (
                        <div className="space-y-3">
                            {diagnoses.map((diagnosis, index) => (
                                <div key={index} className="flex items-start p-3 bg-secondary-800 rounded-lg border border-dark-border">
                                    <div className="bg-primary-900 bg-opacity-20 text-primary-300 px-2 py-1 rounded text-xs font-mono mr-3 mt-0.5">
                                        {diagnosis.b_ma}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-dark-text font-semibold">{diagnosis.b_ten}</h4>
                                        {diagnosis.b_mota && (
                                            <p className="text-dark-textSecondary text-sm mt-1">{diagnosis.b_mota}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-dark-text leading-relaxed">
                            {recordDetail?.pk_chandoan || 'Chưa có chẩn đoán'}
                        </p>
                    )}
                </div>
            </div>

            {/* Ghi chú - giữ nguyên */}
            {recordDetail?.pk_ghichu && (
                <div className="bg-secondary-900 rounded-lg p-6 border border-dark-border">
                    <h3 className="text-lg font-semibold text-primary-300 mb-4 flex items-center">
                        <i className="fas fa-sticky-note mr-2"></i>
                        Ghi chú
                    </h3>
                    <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
                        <p className="text-dark-text leading-relaxed">
                            {recordDetail.pk_ghichu}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderPrescriptions = () => {
        // Nhóm thuốc theo mã toa thuốc
        const groupedPrescriptions = prescriptions.reduce((acc, medicine) => {
            const prescriptionCode = medicine.tt_matthuoc;
            if (!acc[prescriptionCode]) {
                acc[prescriptionCode] = [];
            }
            acc[prescriptionCode].push(medicine);
            return acc;
        }, {});

        return (
            <div className="space-y-6">
                {Object.keys(groupedPrescriptions).length > 0 ? (
                    Object.entries(groupedPrescriptions).map(([prescriptionCode, medicines], index) => (
                        <div key={prescriptionCode} className="bg-secondary-900 rounded-lg p-6 border border-dark-border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-primary-300 flex items-center">
                                    <i className="fas fa-prescription-bottle-alt mr-2"></i>
                                    Toa thuốc #{index + 1}
                                </h3>
                                <span className="text-sm text-dark-textSecondary">
                                    Mã: {prescriptionCode}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <p className="text-dark-textSecondary">
                                    <span className="font-medium">Ngày khám:</span>
                                    <span className="ml-2 text-dark-text">
                                        {new Date(recordDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </p>
                                <p className="text-dark-textSecondary">
                                    <span className="font-medium">Số loại thuốc:</span>
                                    <span className="ml-2 text-primary-300 font-semibold">
                                        {medicines.length} loại
                                    </span>
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-dark-border">
                                    <thead className="bg-secondary-800">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase">STT</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase">Tên thuốc</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase">Mã thuốc</th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-dark-textSecondary uppercase">SL</th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-dark-textSecondary uppercase">ĐVT</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase">Cách dùng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-border">
                                        {medicines.map((medicine, idx) => (
                                            <tr key={idx} className="hover:bg-secondary-900">
                                                <td className="px-3 py-2 text-sm text-dark-text">{idx + 1}</td>
                                                <td className="px-3 py-2 text-sm text-dark-text font-medium">
                                                    {medicine.thuoc_info.thuoc_ten}
                                                </td>
                                                <td className="px-3 py-2 text-sm">
                                                    <span className="font-mono bg-primary-900 bg-opacity-20 text-primary-300 px-2 py-1 rounded text-xs">
                                                        {medicine.thuoc_info.thuoc_ma}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-sm text-center">
                                                    <span className="bg-primary-900 bg-opacity-20 text-primary-300 px-2 py-1 rounded font-semibold">
                                                        {medicine.cttt_soluong}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-sm text-center text-dark-textSecondary">
                                                    {medicine.thuoc_info.thuoc_dvt}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-dark-textSecondary">
                                                    <div className="max-w-xs">
                                                        {medicine.cttt_lieuluong}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tổng kết toa thuốc */}
                            <div className="mt-4 pt-4 border-t border-dark-border">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-dark-textSecondary">
                                        <i className="fas fa-pills mr-2"></i>
                                        Tổng số thuốc: <span className="font-medium text-primary-300">{medicines.length} loại</span>
                                    </span>
                                    <span className="text-dark-textSecondary">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        Uống đúng liều lượng và thời gian
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <i className="fas fa-pills text-6xl text-dark-textSecondary opacity-50 mb-4"></i>
                        <h3 className="text-lg font-medium text-dark-text mb-2">Chưa có toa thuốc</h3>
                        <p className="text-dark-textSecondary">Phiếu khám này chưa có toa thuốc nào được kê.</p>
                    </div>
                )}
            </div>
        );
    };

    const renderServices = () => (
        <div className="space-y-6">
            {services && services.dich_vu && services.dich_vu.length > 0 ? (
                <>
                    {/* Thông tin phiếu chỉ định */}
                    <div className="bg-secondary-900 rounded-lg p-6 border border-dark-border">
                        <h3 className="text-lg font-semibold text-primary-300 mb-4 flex items-center">
                            <i className="fas fa-file-medical mr-2"></i>
                            Thông tin phiếu chỉ định
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <p className="text-dark-textSecondary">
                                <span className="font-medium">Mã phiếu:</span>
                                <span className="ml-2 font-mono bg-primary-900 bg-opacity-20 text-primary-300 px-2 py-1 rounded">
                                    {services.phieu_info.pcd_ma}
                                </span>
                            </p>
                            <p className="text-dark-textSecondary">
                                <span className="font-medium">Ngày chỉ định:</span>
                                <span className="ml-2 text-dark-text">
                                    {new Date(services.phieu_info.pcd_ngay).toLocaleDateString('vi-VN')}
                                </span>
                            </p>
                            <p className="text-dark-textSecondary">
                                <span className="font-medium">Giờ chỉ định:</span>
                                <span className="ml-2 text-dark-text">
                                    {services.phieu_info.pcd_gio}
                                </span>
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-dark-border">
                            <p className="text-dark-textSecondary">
                                <span className="font-medium">Tổng tiền:</span>
                                <span className="ml-2 text-primary-300 font-bold text-lg">
                                    {services.phieu_info.pcd_tongtien?.toLocaleString('vi-VN')} VNĐ
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Danh sách dịch vụ */}
                    {services.dich_vu.map((service, index) => (
                        <div key={index} className="bg-secondary-900 rounded-lg p-6 border border-dark-border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-primary-300 flex items-center">
                                    <i className="fas fa-vial mr-2"></i>
                                    {service.dvyt_ten}
                                </h3>
                                <span className="text-sm text-dark-textSecondary">
                                    Mã: {service.dvyt_ma}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <p className="text-dark-textSecondary">
                                    <span className="font-medium">Mô tả:</span>
                                    <span className="ml-2 text-dark-text">
                                        {service.dvyt_mota}
                                    </span>
                                </p>
                                <p className="text-dark-textSecondary">
                                    <span className="font-medium">Đơn giá:</span>
                                    <span className="ml-2 text-primary-300 font-semibold">
                                        {service.don_gia?.toLocaleString('vi-VN')} VNĐ
                                    </span>
                                </p>
                            </div>

                            {/* Bảng kết quả chi tiết */}
                            {service.chi_so && service.chi_so.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-dark-border">
                                        <thead className="bg-secondary-800">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase">STT</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase">Chỉ số xét nghiệm</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-dark-textSecondary uppercase">Kết quả</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-dark-textSecondary uppercase">Đơn vị</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-dark-textSecondary uppercase">Mức bình thường</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-dark-textSecondary uppercase">Tình trạng</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-border">
                                            {service.chi_so.map((chiSo, idx) => {
                                                const isNormal = chiSo.kq_ketqua === "1";
                                                return (
                                                    <tr key={idx} className="hover:bg-secondary-900">
                                                        <td className="px-3 py-2 text-sm text-dark-text">{idx + 1}</td>
                                                        <td className="px-3 py-2 text-sm text-dark-text font-medium">
                                                            <div>
                                                                <span className="block">{chiSo.cs_ten}</span>
                                                                <span className="text-xs text-dark-textSecondary">({chiSo.cs_ma})</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-sm text-center">
                                                            <span className={`px-2 py-1 rounded font-medium ${isNormal
                                                                ? 'bg-green-900 bg-opacity-20 text-green-300'
                                                                : 'bg-red-900 bg-opacity-20 text-red-300'
                                                                }`}>
                                                                {chiSo.kq_ketqua}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-sm text-center text-dark-textSecondary">
                                                            {chiSo.cs_donvi}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm text-center text-dark-textSecondary">
                                                            {chiSo.cs_mucbthuong}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {isNormal ? (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                                                                    <i className="fas fa-check-circle mr-1"></i>
                                                                    Bình thường
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300">
                                                                    <i className="fas fa-exclamation-circle mr-1"></i>
                                                                    Bất thường
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </>
            ) : (
                <div className="text-center py-12">
                    <div className="bg-secondary-900 rounded-lg p-6 border border-dark-border mb-6">
                        <div className="flex items-center justify-center mb-4">
                            <i className="fas fa-info-circle text-yellow-400 text-xl mr-2"></i>
                            <h3 className="text-lg font-medium text-dark-text">Thông tin phiếu khám</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <p className="text-dark-textSecondary">
                                <span className="font-medium">Mã phiếu khám:</span>
                                <span className="ml-2 font-mono bg-primary-900 bg-opacity-20 text-primary-300 px-2 py-1 rounded">
                                    {services?.phieu_info?.pk_ma}
                                </span>
                            </p>
                            <p className="text-dark-textSecondary">
                                <span className="font-medium">Ngày khám:</span>
                                <span className="ml-2 text-dark-text">
                                    {services?.phieu_info?.pk_ngaykham && new Date(services.phieu_info.pk_ngaykham).toLocaleDateString('vi-VN')}
                                </span>
                            </p>
                            <p className="text-dark-textSecondary md:col-span-2">
                                <span className="font-medium">Trạng thái:</span>
                                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-yellow-900 text-yellow-300">
                                    <i className="fas fa-clock mr-1"></i>
                                    {services?.phieu_info?.status || 'Chưa có phiếu chỉ định dịch vụ'}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="text-center">
                        <i className="fas fa-vials text-6xl text-dark-textSecondary opacity-50 mb-4"></i>
                        <h3 className="text-lg font-medium text-dark-text mb-2">Chưa có dịch vụ y tế</h3>
                        <p className="text-dark-textSecondary mb-1">
                            {services?.message || 'Phiếu khám này chưa có dịch vụ nào được chỉ định.'}
                        </p>
                        <p className="text-dark-textSecondary text-sm">
                            Bác sĩ có thể chỉ định thêm dịch vụ y tế nếu cần thiết.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-dark-card rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        <span className="ml-4 text-dark-text">Đang tải chi tiết phiếu khám...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-primary px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Chi tiết phiếu khám</h2>
                        <p className="text-primary-100 text-sm">
                            Bệnh nhân: {patientData?.bn_hoten} - {patientData?.bn_ma}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-primary-200 transition-colors"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-dark-border">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'general'
                                ? 'border-primary text-primary-300'
                                : 'border-transparent text-dark-textSecondary hover:text-dark-text'
                                }`}
                        >
                            <i className="fas fa-info-circle mr-2"></i>
                            Thông tin chung
                        </button>
                        <button
                            onClick={() => setActiveTab('prescriptions')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'prescriptions'
                                ? 'border-primary text-primary-300'
                                : 'border-transparent text-dark-textSecondary hover:text-dark-text'
                                }`}
                        >
                            <i className="fas fa-pills mr-2"></i>
                            Toa thuốc
                        </button>
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'services'
                                ? 'border-primary text-primary-300'
                                : 'border-transparent text-dark-textSecondary hover:text-dark-text'
                                }`}
                        >
                            <i className="fas fa-vials mr-2"></i>
                            Kết quả xét nghiệm
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {activeTab === 'general' && renderGeneralInfo()}
                    {activeTab === 'prescriptions' && renderPrescriptions()}
                    {activeTab === 'services' && renderServices()}
                </div>
            </div>
        </div>
    );
};

export default MedicalRecordDetail;