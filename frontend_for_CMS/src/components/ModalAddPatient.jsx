import React from "react";

const ModalAddPatient = ({ isOpen, onClose, onSubmit }) => {
  const [patientInfo, setPatientInfo] = React.useState({
    bn_hoten: "",
    bn_ngaysinh: "",
    bn_gioitinh: true,
    bn_sdt: "",
    bn_cccd: "" // Thêm trường CCCD
  });

  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatientInfo((prev) => ({
      ...prev,
      [name]: name === "bn_gioitinh" ? value === "true" : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!patientInfo.bn_hoten.trim()) {
      newErrors.bn_hoten = "Họ tên là bắt buộc";
    }

    if (!patientInfo.bn_ngaysinh) {
      newErrors.bn_ngaysinh = "Ngày sinh là bắt buộc";
    } else {
      const birthDate = new Date(patientInfo.bn_ngaysinh);
      const today = new Date();
      if (birthDate > today) {
        newErrors.bn_ngaysinh = "Ngày sinh không thể là tương lai";
      }
    }

    if (!patientInfo.bn_sdt.trim()) {
      newErrors.bn_sdt = "Số điện thoại là bắt buộc";
    } else if (!/^[0-9]{10,11}$/.test(patientInfo.bn_sdt.replace(/\s+/g, ''))) {
      newErrors.bn_sdt = "Số điện thoại không hợp lệ";
    }

    // Validate CCCD
    if (!patientInfo.bn_cccd.trim()) {
      newErrors.bn_cccd = "CCCD là bắt buộc";
    } else if (!/^[0-9]{12}$/.test(patientInfo.bn_cccd)) {
      newErrors.bn_cccd = "CCCD phải đủ 12 số";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(patientInfo);

      // Reset form
      setPatientInfo({
        bn_hoten: "",
        bn_ngaysinh: "",
        bn_gioitinh: true,
        bn_sdt: "",
        bn_cccd: "" // Thêm trường CCCD
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error submitting patient:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPatientInfo({
      bn_hoten: "",
      bn_ngaysinh: "",
      bn_gioitinh: true,
      bn_sdt: "",
      bn_cccd: "" // Thêm trường CCCD
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 p-4 z-50 backdrop-blur-sm">
      <div className="bg-dark-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto border border-dark-border">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-dark-border bg-gradient-to-r from-primary-900 to-primary-800 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 bg-opacity-20 rounded-lg">
              <i className="fas fa-user-plus text-primary-300 text-xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-white">Thêm bệnh nhân mới</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Họ tên */}
              <div>
                <label htmlFor="bn_hoten" className="block text-sm font-medium text-dark-text mb-2">
                  <i className="fas fa-user mr-2 text-primary-400"></i>
                  Họ và tên <span className="text-red-400">*</span>
                </label>
                <input
                  id="bn_hoten"
                  name="bn_hoten"
                  type="text"
                  className={`w-full px-4 py-3 border rounded-lg bg-secondary-900 text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ${errors.bn_hoten ? 'border-red-500 focus:ring-red-500' : 'border-dark-border focus:border-primary'
                    }`}
                  placeholder="Nhập họ và tên đầy đủ"
                  value={patientInfo.bn_hoten}
                  onChange={handleChange}
                />
                {errors.bn_hoten && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {errors.bn_hoten}
                  </p>
                )}
              </div>

              {/* Grid 2 cột cho ngày sinh và giới tính */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ngày sinh */}
                <div>
                  <label htmlFor="bn_ngaysinh" className="block text-sm font-medium text-dark-text mb-2">
                    <i className="fas fa-calendar-alt mr-2 text-primary-400"></i>
                    Ngày sinh <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="bn_ngaysinh"
                    name="bn_ngaysinh"
                    type="date"
                    className={`w-full px-4 py-3 border rounded-lg bg-secondary-900 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ${errors.bn_ngaysinh ? 'border-red-500 focus:ring-red-500' : 'border-dark-border focus:border-primary'
                      }`}
                    value={patientInfo.bn_ngaysinh}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.bn_ngaysinh && (
                    <p className="mt-1 text-sm text-red-400 flex items-center">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {errors.bn_ngaysinh}
                    </p>
                  )}
                </div>

                {/* Giới tính */}
                <div>
                  <label htmlFor="bn_gioitinh" className="block text-sm font-medium text-dark-text mb-2">
                    <i className="fas fa-venus-mars mr-2 text-primary-400"></i>
                    Giới tính <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="bn_gioitinh"
                    name="bn_gioitinh"
                    className="w-full px-4 py-3 border border-dark-border rounded-lg bg-secondary-900 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    value={patientInfo.bn_gioitinh}
                    onChange={handleChange}
                  >
                    <option value="true">Nam</option>
                    <option value="false">Nữ</option>
                  </select>
                </div>
              </div>

              {/* Số điện thoại */}
              <div>
                <label htmlFor="bn_sdt" className="block text-sm font-medium text-dark-text mb-2">
                  <i className="fas fa-phone mr-2 text-primary-400"></i>
                  Số điện thoại <span className="text-red-400">*</span>
                </label>
                <input
                  id="bn_sdt"
                  name="bn_sdt"
                  type="tel"
                  className={`w-full px-4 py-3 border rounded-lg bg-secondary-900 text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ${errors.bn_sdt ? 'border-red-500 focus:ring-red-500' : 'border-dark-border focus:border-primary'
                    }`}
                  placeholder="Nhập số điện thoại (10-11 số)"
                  value={patientInfo.bn_sdt}
                  onChange={handleChange}
                />
                {errors.bn_sdt && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {errors.bn_sdt}
                  </p>
                )}
              </div>

              {/* CCCD */}
              <div>
                <label htmlFor="bn_cccd" className="block text-sm font-medium text-dark-text mb-2">
                  <i className="fas fa-id-card mr-2 text-primary-400"></i>
                  CCCD <span className="text-red-400">*</span>
                </label>
                <input
                  id="bn_cccd"
                  name="bn_cccd"
                  type="text"
                  className={`w-full px-4 py-3 border rounded-lg bg-secondary-900 text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ${errors.bn_cccd ? 'border-red-500 focus:ring-red-500' : 'border-dark-border focus:border-primary'
                    }`}
                  placeholder="Nhập số CCCD (12 số)"
                  value={patientInfo.bn_cccd}
                  onChange={handleChange}
                  maxLength={12}
                />
                {errors.bn_cccd && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {errors.bn_cccd}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-dark-border">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-3 bg-secondary-800 text-dark-text rounded-lg hover:bg-secondary-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <i className="fas fa-times"></i>
                <span>Hủy bỏ</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Đang thêm...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i>
                    <span>Thêm bệnh nhân</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalAddPatient;