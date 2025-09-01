// features/Admin/Employee/components/doctor/DoctorForm.jsx
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../../../../service/apiService';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DoctorForm = ({ onSuccess, initialData = null, isEditing = false }) => {
  const [specialties, setSpecialties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch specialties on component mount
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await api.get('/chuyenkhoa/getall');
        if (response.data && response.data.data) {
          setSpecialties(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching specialties:', error);
        toast.error('Không thể tải danh sách chuyên khoa');
      }
    };

    fetchSpecialties();
  }, []);

  // Parse date for initial data if present
  useEffect(() => {
    if (initialData && initialData.nv_ngaysinh) {
      formik.setFieldValue('nv_ngaysinh', new Date(initialData.nv_ngaysinh));
    }

    // Nếu đang chỉnh sửa và có dữ liệu cũ về giới tính
    if (isEditing && initialData && initialData.nv_gioitinh !== undefined) {
      formik.setFieldValue('nv_gioitinh', initialData.nv_gioitinh);
    }
  }, [initialData]);

  // Formik setup with validation
  const formik = useFormik({
    initialValues: {
      nv_hoten: initialData?.nv_hoten || '',
      nv_password: '',
      nv_ngaysinh: null,
      nv_gioitinh: initialData?.nv_gioitinh ?? true, // Mặc định là nam (true)
      ck_ma: initialData?.ck_ma || '',
      bs_csdaotao: initialData?.bs_csdaotao || '',
      bs_bcapchuyenmon: initialData?.bs_bcapchuyenmon || ''
    },
    validationSchema: Yup.object({
      nv_hoten: Yup.string()
        .required('Vui lòng nhập họ tên bác sĩ')
        .min(5, 'Họ tên phải có ít nhất 5 ký tự'),
      nv_password: !isEditing ? Yup.string()
        .required('Vui lòng nhập mật khẩu')
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự') :
        Yup.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
      nv_ngaysinh: Yup.date()
        .nullable()
        .max(new Date(), 'Ngày sinh không thể là ngày trong tương lai'),
      ck_ma: Yup.string()
        .required('Vui lòng chọn chuyên khoa'),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        // Format date to YYYY-MM-DD
        const formattedValues = {
          ...values,
          nv_ngaysinh: values.nv_ngaysinh ?
            values.nv_ngaysinh.toISOString().split('T')[0] : null
        };

        // Remove password if empty in edit mode
        if (isEditing && !formattedValues.nv_password) {
          delete formattedValues.nv_password;
        }

        const endpoint = isEditing ?
          `/bacsi/${initialData.nv_ma}` :
          '/bacsi/create';

        const response = await api[isEditing ? 'put' : 'post'](endpoint, formattedValues);

        if (response.data && response.data.success) {
          toast.success(`${isEditing ? 'Cập nhật' : 'Thêm'} bác sĩ thành công!`);
          if (onSuccess) onSuccess();
        } else {
          toast.error(`${isEditing ? 'Cập nhật' : 'Thêm'} bác sĩ thất bại: ${response.data?.message || 'Lỗi không xác định'}`);
        }
      } catch (error) {
        console.error(`Error ${isEditing ? 'updating' : 'creating'} doctor:`, error);
        toast.error(`Có lỗi xảy ra: ${error.response?.data?.message || error.message}`);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="bg-dark-card rounded-lg p-6 border border-dark-border">
      <h2 className="text-xl font-medium text-dark-text mb-6 flex items-center">
        <i className="fas fa-user-md mr-3 text-primary"></i>
        {isEditing ? 'Chỉnh sửa thông tin bác sĩ' : 'Thêm bác sĩ mới'}
      </h2>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Họ tên */}
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-1">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nv_hoten"
              name="nv_hoten"
              placeholder="Nhập họ tên đầy đủ"
              className={`w-full p-2 border ${formik.touched.nv_hoten && formik.errors.nv_hoten
                  ? 'border-red-500'
                  : 'border-dark-border'
                } rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary`}
              value={formik.values.nv_hoten}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.nv_hoten && formik.errors.nv_hoten ? (
              <div className="text-red-500 text-xs mt-1">{formik.errors.nv_hoten}</div>
            ) : null}
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-1">
              Mật khẩu {!isEditing && <span className="text-red-500">*</span>}
              {isEditing && <span className="text-xs text-dark-textSecondary ml-2">(Để trống nếu không đổi)</span>}
            </label>
            <input
              type="password"
              id="nv_password"
              name="nv_password"
              placeholder={isEditing ? "Nhập mật khẩu mới nếu muốn thay đổi" : "Nhập mật khẩu"}
              className={`w-full p-2 border ${formik.touched.nv_password && formik.errors.nv_password
                  ? 'border-red-500'
                  : 'border-dark-border'
                } rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary`}
              value={formik.values.nv_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.nv_password && formik.errors.nv_password ? (
              <div className="text-red-500 text-xs mt-1">{formik.errors.nv_password}</div>
            ) : null}
          </div>

          {/* Chuyên khoa */}
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-1">
              Chuyên khoa <span className="text-red-500">*</span>
            </label>
            <select
              id="ck_ma"
              name="ck_ma"
              className={`w-full p-2 border ${formik.touched.ck_ma && formik.errors.ck_ma
                  ? 'border-red-500'
                  : 'border-dark-border'
                } rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary`}
              value={formik.values.ck_ma}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option value="">-- Chọn chuyên khoa --</option>
              {specialties.map(specialty => (
                <option key={specialty.ck_ma} value={specialty.ck_ma}>
                  {specialty.ck_ten}
                </option>
              ))}
            </select>
            {formik.touched.ck_ma && formik.errors.ck_ma ? (
              <div className="text-red-500 text-xs mt-1">{formik.errors.ck_ma}</div>
            ) : null}
          </div>

          {/* Ngày sinh */}
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-1">
              Ngày sinh
            </label>
            <div className="relative">
              <DatePicker
                id="nv_ngaysinh"
                selected={formik.values.nv_ngaysinh}
                onChange={(date) => formik.setFieldValue('nv_ngaysinh', date)}
                dateFormat="dd/MM/yyyy"
                className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary"
                placeholderText="DD/MM/YYYY"
                maxDate={new Date()}
                showYearDropdown
                yearDropdownItemNumber={100}
                scrollableYearDropdown
              />
              <i className="fas fa-calendar-alt absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary pointer-events-none"></i>
            </div>
            {formik.touched.nv_ngaysinh && formik.errors.nv_ngaysinh ? (
              <div className="text-red-500 text-xs mt-1">{formik.errors.nv_ngaysinh}</div>
            ) : null}
          </div>

          {/* Giới tính - Thay đổi từ radio string sang radio boolean */}
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-1">
              Giới tính
            </label>
            <div className="flex items-center space-x-6 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="nv_gioitinh"
                  value="true"
                  checked={formik.values.nv_gioitinh === true}
                  onChange={() => formik.setFieldValue('nv_gioitinh', true)}
                  className="mr-2 text-primary"
                />
                <span className="text-dark-text">Nam</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="nv_gioitinh"
                  value="false"
                  checked={formik.values.nv_gioitinh === false}
                  onChange={() => formik.setFieldValue('nv_gioitinh', false)}
                  className="mr-2 text-primary"
                />
                <span className="text-dark-text">Nữ</span>
              </label>
            </div>
          </div>

          {/* Cơ sở đào tạo */}
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-1">
              Cơ sở đào tạo
            </label>
            <input
              type="text"
              id="bs_csdaotao"
              name="bs_csdaotao"
              placeholder="Đại học Y Dược..."
              className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary"
              value={formik.values.bs_csdaotao}
              onChange={formik.handleChange}
            />
          </div>

          {/* Bậc cấp chuyên môn */}
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-1">
              Bậc cấp chuyên môn
            </label>
            <input
              type="text"
              id="bs_bcapchuyenmon"
              name="bs_bcapchuyenmon"
              placeholder="Tiến sĩ, Thạc sĩ, Bác sĩ..."
              className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary"
              value={formik.values.bs_bcapchuyenmon}
              onChange={formik.handleChange}
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`${isLoading ? 'bg-primary-700 cursor-not-allowed' : 'bg-primary hover:bg-primary-600'
              } text-white px-6 py-2 rounded-md font-medium flex items-center`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                <i className={`fas fa-${isEditing ? 'save' : 'user-plus'} mr-2`}></i>
                {isEditing ? 'Cập nhật bác sĩ' : 'Thêm bác sĩ'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorForm;