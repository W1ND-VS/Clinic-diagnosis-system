import React from 'react';

const PatientInfo = ({ patientData }) => {
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <i className="fas fa-user-circle text-primary-300 text-2xl mr-3"></i>
        <h2 className="text-2xl font-bold text-dark-text">Thông tin chi tiết bệnh nhân</h2>
      </div>

      {patientData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="bg-secondary-900 rounded-lg p-4 border border-dark-border">
              <h3 className="text-lg font-semibold text-primary-300 mb-4 flex items-center">
                <i className="fas fa-id-card mr-2"></i>
                Thông tin cá nhân
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="font-medium text-dark-textSecondary w-32">Mã bệnh nhân:</span>
                  <span className="text-dark-text font-mono bg-primary-900 bg-opacity-20 px-2 py-1 rounded">
                    {patientData.bn_ma}
                  </span>
                </div>
                {/* Thêm CCCD */}
                <div className="flex items-center">
                  <span className="font-medium text-dark-textSecondary w-32">CCCD:</span>
                  <span className="text-dark-text font-mono">{patientData.bn_cccd || <span className="text-dark-textSecondary italic">Chưa cập nhật</span>}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-dark-textSecondary w-32">Họ tên:</span>
                  <span className="text-dark-text font-semibold">{patientData.bn_hoten}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-dark-textSecondary w-32">Ngày sinh:</span>
                  <span className="text-dark-text">{patientData.bn_ngaysinh}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-dark-textSecondary w-32">Giới tính:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${patientData.bn_gioitinh === 'Nam'
                      ? 'bg-blue-900 text-blue-300'
                      : 'bg-pink-900 text-pink-300'
                    }`}>
                    <i className={`fas ${patientData.bn_gioitinh === 'Nam' ? 'fa-mars' : 'fa-venus'} mr-1`}></i>
                    {patientData.bn_gioitinh}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="bg-secondary-900 rounded-lg p-4 border border-dark-border">
              <h3 className="text-lg font-semibold text-primary-300 mb-4 flex items-center">
                <i className="fas fa-address-book mr-2"></i>
                Thông tin liên hệ
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="font-medium text-dark-textSecondary w-32">Số điện thoại:</span>
                  <span className="text-dark-text">
                    {patientData.bn_sdt ? (
                      <a href={`tel:${patientData.bn_sdt}`} className="text-primary-300 hover:text-primary-400 transition-colors">
                        <i className="fas fa-phone mr-1"></i>
                        {patientData.bn_sdt}
                      </a>
                    ) : (
                      <span className="text-dark-textSecondary italic">Chưa cập nhật</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-dark-textSecondary w-32">Email:</span>
                  <span className="text-dark-text">
                    {patientData.bn_email ? (
                      <a href={`mailto:${patientData.bn_email}`} className="text-primary-300 hover:text-primary-400 transition-colors">
                        <i className="fas fa-envelope mr-1"></i>
                        {patientData.bn_email}
                      </a>
                    ) : (
                      <span className="text-dark-textSecondary italic">Chưa cập nhật</span>
                    )}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium text-dark-textSecondary w-32 mt-1">Địa chỉ:</span>
                  <span className="text-dark-text flex-1">
                    {patientData.bn_diachi || (
                      <span className="text-dark-textSecondary italic">Chưa cập nhật</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-dark-textSecondary">Đang tải thông tin bệnh nhân...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientInfo;