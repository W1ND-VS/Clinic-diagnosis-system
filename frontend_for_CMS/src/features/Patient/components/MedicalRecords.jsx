import React, { useState } from 'react';
import MedicalRecordDetail from './MedicalRecordDetail';

const MedicalRecords = ({ medicalRecords, patientData }) => {
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [selectedRecordDate, setSelectedRecordDate] = useState(null);

  const handleRecordClick = (recordId, recordDate) => {
    setSelectedRecordId(recordId);
    setSelectedRecordDate(recordDate);
  };

  const handleCloseDetail = () => {
    setSelectedRecordId(null);
    setSelectedRecordDate(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <i className="fas fa-file-medical text-primary-300 text-2xl mr-3"></i>
        <h2 className="text-2xl font-bold text-dark-text">Lịch sử khám bệnh</h2>
      </div>

      {medicalRecords && medicalRecords.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-border">
            <thead className="bg-secondary-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  <i className="fas fa-hashtag mr-1"></i>STT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  <i className="fas fa-file-alt mr-1"></i>Mã phiếu khám
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  <i className="fas fa-calendar mr-1"></i>Ngày khám
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  <i className="fas fa-symptoms mr-1"></i>Triệu chứng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  <i className="fas fa-diagnoses mr-1"></i>Chẩn đoán
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  <i className="fas fa-user-md mr-1"></i>Bác sĩ
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                  <i className="fas fa-eye mr-1"></i>Xem chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {medicalRecords.map((record, index) => (
                <tr key={index} className="hover:bg-secondary-900 transition-colors duration-200">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-dark-text font-medium">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className="font-mono bg-primary-900 bg-opacity-20 text-primary-300 px-2 py-1 rounded">
                      {record.pk_ma}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-dark-text">
                    <i className="fas fa-calendar-day text-primary-300 mr-2"></i>
                    {new Date(record.pk_ngaykham).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-4 text-sm text-dark-textSecondary max-w-xs truncate">
                    {record.pk_trieuchung || (
                      <span className="italic text-dark-textSecondary">Không có ghi nhận</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-dark-textSecondary max-w-xs truncate">
                    {record.pk_chandoan || (
                      <span className="italic text-dark-textSecondary">Chưa có chẩn đoán</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-dark-text">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-900 flex items-center justify-center mr-2">
                        <i className="fas fa-user-md text-primary-300 text-xs"></i>
                      </div>
                      {record.bac_si.nv_hoten || 'Chưa cập nhật'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                    <button
                      onClick={() => handleRecordClick(record.pk_ma,record.pk_ngaykham)}
                      className="bg-primary hover:bg-primary-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 flex items-center mx-auto"
                    >
                      <i className="fas fa-eye mr-1"></i>
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-dark-textSecondary">
            <i className="fas fa-file-medical text-6xl opacity-50"></i>
          </div>
          <h3 className="mt-4 text-lg font-medium text-dark-text">Chưa có phiếu khám nào</h3>
          <p className="mt-2 text-dark-textSecondary">Bệnh nhân này chưa có lịch sử khám bệnh.</p>
        </div>
      )}

      {/* Modal chi tiết phiếu khám */}
      {selectedRecordId && (
        <MedicalRecordDetail
          recordId={selectedRecordId}
          recordDate={selectedRecordDate}
          patientData={patientData}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default MedicalRecords;