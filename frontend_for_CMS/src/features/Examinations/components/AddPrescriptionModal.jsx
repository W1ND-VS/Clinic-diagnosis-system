import React from 'react';
import { DOSAGE_TIMES, MEAL_RELATIONS, TIME_OF_DAY } from '../../../constants/medication';

const AddPrescriptionModal = ({
    isOpen,
    onClose,
    onSave,
    selectedPrescription,
    setSelectedPrescription,
    medications
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-lg transform transition-all border border-dark-border">
                <div className="bg-primary-900 text-primary-300 px-6 py-4 rounded-t-lg flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                        {selectedPrescription.editIndex !== undefined ? 'Sửa thuốc' : 'Thêm thuốc'}
                    </h3>
                    <button onClick={onClose} className="text-primary-300 hover:text-primary-100">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-dark-text mb-1">
                            Tên thuốc <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full rounded-md bg-secondary-800 border-dark-border shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-dark-text"
                            value={selectedPrescription.ten_thuoc}
                            onChange={e => {
                                const medication = medications.find(m => m.thuoc_ten === e.target.value);
                                if (medication) {
                                    setSelectedPrescription({
                                        ...selectedPrescription,
                                        ten_thuoc: medication.thuoc_ten,
                                        dvt: medication.thuoc_dvt || 'Viên'
                                    });
                                }
                            }}
                        >
                            <option value="">-- Chọn thuốc --</option>
                            {medications.map(medication => (
                                <option key={medication.thuoc_ma} value={medication.thuoc_ten}>
                                    {medication.thuoc_ten} ({medication.thuoc_dvt || 'Viên'})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-text mb-1">Đơn vị tính</label>
                            <input
                                type="text"
                                className="w-full rounded-md bg-secondary-900 border-dark-border text-dark-textSecondary"
                                value={selectedPrescription.dvt}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-text mb-1">
                                Số lượng <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="w-full rounded-md bg-secondary-800 border-dark-border shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-dark-text"
                                value={selectedPrescription.so_luong}
                                onChange={e => setSelectedPrescription({
                                    ...selectedPrescription,
                                    so_luong: e.target.value ? parseInt(e.target.value) : ''
                                })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-text mb-1">
                            Cách dùng <span className="text-red-500">*</span>
                        </label>
                        <div className="bg-secondary-900 p-3 rounded-md border border-dark-border mb-3">
                            <div className="text-xs text-dark-textSecondary mb-2 font-medium">Tạo nhanh cách dùng</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-dark-textSecondary mb-1 block">Số lần uống</label>
                                    <select
                                        className="w-full rounded-md bg-secondary-800 border-dark-border text-sm text-dark-text focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                                        onChange={e => {
                                            const times = e.target.value;
                                            if (times) {
                                                const selectedTimes = TIME_OF_DAY.slice(0, parseInt(times));
                                                const timingStr = selectedTimes.map(t => t.label).join("-");
                                                setSelectedPrescription(prev => ({
                                                    ...prev,
                                                    cach_dung: `Uống ${prev.so_luong || 1} ${prev.dvt} × ${times} lần/ngày, ${timingStr}`
                                                }));
                                            }
                                        }}
                                    >
                                        <option value="">-- Chọn --</option>
                                        {DOSAGE_TIMES.map(time => (
                                            <option key={time.value} value={time.value}>{time.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-dark-textSecondary mb-1 block">Thời điểm</label>
                                    <select
                                        className="w-full rounded-md bg-secondary-800 border-dark-border text-sm text-dark-text focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                                        onChange={e => {
                                            const mealRelation = MEAL_RELATIONS.find(m => m.value === e.target.value)?.label;
                                            if (mealRelation) {
                                                setSelectedPrescription(prev => ({
                                                    ...prev,
                                                    cach_dung: prev.cach_dung + (prev.cach_dung ? `, ${mealRelation}` : mealRelation)
                                                }));
                                            }
                                        }}
                                    >
                                        <option value="">-- Chọn --</option>
                                        {MEAL_RELATIONS.map(relation => (
                                            <option key={relation.value} value={relation.value}>{relation.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <textarea
                            className="w-full rounded-md bg-secondary-800 border-dark-border shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-dark-text"
                            rows="2"
                            value={selectedPrescription.cach_dung}
                            onChange={e => setSelectedPrescription({ ...selectedPrescription, cach_dung: e.target.value })}
                            placeholder="Nhập cách dùng chi tiết..."
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-text mb-1">Lưu ý</label>
                        <textarea
                            className="w-full rounded-md bg-secondary-800 border-dark-border shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-dark-text"
                            rows="2"
                            value={selectedPrescription.luu_y}
                            onChange={e => setSelectedPrescription({ ...selectedPrescription, luu_y: e.target.value })}
                            placeholder="Các lưu ý khi dùng thuốc..."
                        ></textarea>
                    </div>
                </div>
                <div className="px-6 py-4 bg-secondary-900 rounded-b-lg flex justify-end space-x-3 border-t border-dark-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-dark-text bg-secondary-800 border border-dark-border rounded-md hover:bg-secondary-700"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onSave}
                        disabled={!selectedPrescription.ten_thuoc || !selectedPrescription.so_luong || !selectedPrescription.cach_dung}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md ${!selectedPrescription.ten_thuoc || !selectedPrescription.so_luong || !selectedPrescription.cach_dung
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-600'
                            }`}
                    >
                        {selectedPrescription.editIndex !== undefined ? 'Cập nhật' : 'Thêm thuốc'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPrescriptionModal;