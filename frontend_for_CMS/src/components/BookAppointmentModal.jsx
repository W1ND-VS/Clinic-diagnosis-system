import React, { useEffect, useState } from "react";
import Modal from "./ModalAddPatient";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BookAppointmentModal = ({ isOpen, onClose, onSubmit, selectedTimeSlot }) => {
    const [medicalForm, setMedicalForm] = useState({
        ph_ngayhen: "",
        ph_giohen: "",
        ph_gioketthuc: "",
        bn_ma: "",
        nv_ma: "",
        trieu_chung: [""],
    });

    // Thêm state lưu thời lượng cuộc hẹn (mặc định 30 phút)
    const [duration, setDuration] = useState(30);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allPatients, setAllPatients] = useState([]);
    const [doctorList, setDoctorList] = useState([]);
    const [symptomList, setSymptomList] = useState([]);
    const [patientSearch, setPatientSearch] = useState("");
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [filteredSymptoms, setFilteredSymptoms] = useState([]);
    // Thêm state
    const [notFoundPatient, setNotFoundPatient] = useState(false);

    // Fetch data khi modal mở
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            try {
                const token = localStorage.getItem("access_token");
                // Fetch patients data
                const patientsRes = await axios.get("http://127.0.0.1:5000/api/benhnhan/getall");
                setAllPatients(patientsRes.data.data || []);
                console.log("All patients:", patientsRes.data.data);
                // Fetch doctors data
                const doctorsRes = await axios.get("http://127.0.0.1:5000/api/bacsi/getall");

                // Fetch symptoms data
                const symptomsRes = await axios.get("http://127.0.0.1:5000/api/trieuchung/getall");
                // Kiểm tra xem dữ liệu có tồn tại không
                if (!patientsRes.data) {
                    throw new Error("Dữ liệu không hợp lệ");
                }

                setDoctorList(doctorsRes.data.data || []);
                setSymptomList(symptomsRes.data.data || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && selectedTimeSlot.start && selectedTimeSlot.end) {
            const startDate = new Date(selectedTimeSlot.start);
            const endDate = new Date(selectedTimeSlot.end);

            const dateStr = startDate.toISOString().slice(0, 10);
            const startTimeStr = startDate.toTimeString().slice(0, 5);
            const endTimeStr = endDate.toTimeString().slice(0, 5);

            setMedicalForm(prev => ({
                ...prev,
                ph_ngayhen: dateStr,
                ph_giohen: startTimeStr,
                ph_gioketthuc: endTimeStr,
            }));
        }
    }, [isOpen, selectedTimeSlot]);

    // Tự động chọn bác sĩ từ cột nếu có
    useEffect(() => {
        if (isOpen && selectedTimeSlot) {
            // Cập nhật giờ bắt đầu và kết thúc như trước đây
            if (selectedTimeSlot.start && selectedTimeSlot.end) {
                const startDate = new Date(selectedTimeSlot.start);
                const endDate = new Date(selectedTimeSlot.end);

                const dateStr = startDate.toISOString().slice(0, 10);
                const startTimeStr = startDate.toTimeString().slice(0, 5);

                // Tính thời lượng từ selectedTimeSlot (trong phút)
                const durationMinutes = Math.round((endDate - startDate) / (60 * 1000));
                setDuration(durationMinutes);

                setMedicalForm(prev => ({
                    ...prev,
                    ph_ngayhen: dateStr,
                    ph_giohen: startTimeStr,
                    ph_gioketthuc: endDate.toTimeString().slice(0, 5),
                }));
            }

            // Tự động chọn bác sĩ nếu có thông tin bác sĩ từ cột được chọn
            if (selectedTimeSlot.doctorId) {
                setMedicalForm(prev => ({
                    ...prev,
                    nv_ma: selectedTimeSlot.doctorId
                }));

                console.log(`Đã tự động chọn bác sĩ: ${selectedTimeSlot.doctorName} (ID: ${selectedTimeSlot.doctorId})`);
            }
        }
    }, [isOpen, selectedTimeSlot]);

    // Hàm mới: Cập nhật giờ kết thúc dựa trên giờ bắt đầu và thời lượng
    const updateEndTime = (startTime, durationMinutes) => {
        if (!startTime) return;

        try {
            const [hours, minutes] = startTime.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes, 0);

            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
            const endTimeStr = endDate.getHours().toString().padStart(2, '0') + ':' +
                endDate.getMinutes().toString().padStart(2, '0');

            setMedicalForm(prev => ({
                ...prev,
                ph_gioketthuc: endTimeStr
            }));
        } catch (error) {
            console.error("Lỗi khi cập nhật giờ kết thúc:", error);
        }
    };

    // Xử lý thay đổi thời lượng cuộc hẹn
    const handleDurationChange = (e) => {
        const newDuration = parseInt(e.target.value);
        setDuration(newDuration);

        // Cập nhật giờ kết thúc mỗi khi thời lượng thay đổi
        updateEndTime(medicalForm.ph_giohen, newDuration); // Sửa từ 'pk_giokhamdukien' thành 'ph_giohen'
    };

    // Cập nhật handleChange để tự động cập nhật giờ kết thúc khi giờ bắt đầu thay đổi
    const handleChange = (e) => {
        const { name, value } = e.target;
        setMedicalForm(prev => ({ ...prev, [name]: value }));

        // Nếu thay đổi giờ bắt đầu, cập nhật giờ kết thúc
        if (name === 'ph_giohen') {  // Sửa từ 'pk_giokhamdukien' thành 'ph_giohen'
            updateEndTime(value, duration);
        }
    };

    const handleAddPatient = async (newPatient) => {
        console.log("New patient data:", newPatient);
        try {
            const response = await axios.post(
                "http://127.0.0.1:5000/api/benhnhan/create",
                newPatient
            );
            // Log the new patient data for debugging

            setAllPatients([...allPatients, response.data.data]);
            setPatientSearch(response.data.data.bn_hoten);
            setMedicalForm(prev => ({
                ...prev,
                bn_ma: response.data.data.bn_ma,
            }));
            setIsModalOpen(false);
            alert("Thêm bệnh nhân thành công!");
        } catch (error) {
            console.error("Lỗi thêm bệnh nhân:", error);
            alert("Thêm bệnh nhân thất bại!");
        }
    };

    // Cập nhật hàm handlePatientSearch để tìm theo SĐT
    const handlePatientSearch = (e) => {
        const value = e.target.value;
        setPatientSearch(value);

        if (!value.trim()) {
            setFilteredPatients([]);
            setNotFoundPatient(false);
            return;
        }
        const filtered = allPatients.filter(p =>
            p.bn_hoten.toLowerCase().includes(value.toLowerCase()) ||
            p.bn_ma.toString().includes(value) ||
            (p.bn_sdt && p.bn_sdt.includes(value))
        );
        setFilteredPatients(filtered.slice(0, 10));
        setNotFoundPatient(filtered.length === 0);
    };

    const handleSelectPatient = (patient) => {
        setMedicalForm(prev => ({ ...prev, bn_ma: patient.bn_ma }));
        setPatientSearch(patient.bn_hoten);
        setFilteredPatients([]);
    };

    const handleSymptomChange = (index, value) => {
        const newSymptoms = [...medicalForm.trieu_chung];
        newSymptoms[index] = value;
        setMedicalForm(prev => ({ ...prev, trieu_chung: newSymptoms })); // Fix: use "trieu_chung" instead of "symptoms"

        if (value.trim()) {
            const filtered = symptomList.filter(s =>
                s.tc_ten.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredSymptoms(filtered);
        } else {
            setFilteredSymptoms([]);
        }
    };

    const handleSelectSymptom = (index, selectedSymptom) => {
        setMedicalForm(prev => {
            const newSymptoms = [...prev.trieu_chung];
            newSymptoms[index] = selectedSymptom; // Lưu mã triệu chứng
            return { ...prev, trieu_chung: newSymptoms };
        });
        setFilteredSymptoms([]); // Ẩn dropdown sau khi chọn
    };


    const handleAddSymptom = () => {
        setMedicalForm(prev => ({
            ...prev,
            trieu_chung: [...(prev.trieu_chung || []), ""] // Đảm bảo luôn là mảng
        }));
    };

    const handleRemoveSymptom = (index) => {
        const newSymptoms = medicalForm.trieu_chung.filter((_, i) => i !== index); // Fix: use "trieu_chung" instead of "symptoms"
        setMedicalForm(prev => ({ ...prev, trieu_chung: newSymptoms }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required fields
        if (!medicalForm.bn_ma || !medicalForm.nv_ma || !medicalForm.ph_ngayhen || !medicalForm.ph_giohen) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc");
            return;
        }
        console.log("Thông tin phiếu khám:", medicalForm.trieu_chung);

        onSubmit(medicalForm);

        onClose();
    };

    // Trong BookAppointmentModal.jsx
    useEffect(() => {
        if (selectedTimeSlot && selectedTimeSlot.doctorId) {
            // Trích xuất ngày từ thời gian bắt đầu
            const startDate = new Date(selectedTimeSlot.start);
            const dateString = startDate.toISOString().split('T')[0];

            setMedicalForm({
                ...medicalForm,
                ph_ngayhen: dateString,
                ph_giohen: selectedTimeSlot.startTime || startDate.toTimeString().slice(0, 5),
                ph_gioketthuc: selectedTimeSlot.endTime || new Date(selectedTimeSlot.end).toTimeString().slice(0, 5),
                nv_ma: selectedTimeSlot.doctorId
            });
        }
    }, [selectedTimeSlot]);

    // Lấy thông tin user từ localStorage
    const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
    const isPatient = userData.role === "benhnhan";

    // Khi mở modal, nếu là bệnh nhân thì tự động điền mã và tên
    useEffect(() => {
        if (isOpen && isPatient) {
            setMedicalForm(prev => ({
                ...prev,
                bn_ma: userData.bn_ma || "",
            }));
            setPatientSearch(userData.bn_hoten || "");
        }
    }, [isOpen, isPatient, userData.bn_ma, userData.bn_hoten]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4 z-50">
            <div className="bg-dark-card p-8 rounded-lg shadow-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-dark-border">
                <h2 className="text-3xl font-medium mb-8 text-center text-dark-text">Đăng ký lịch hẹn mới</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-xl font-medium text-dark-text border-b border-dark-border pb-2">
                                Thông tin bệnh nhân
                            </h3>
                            {/* Nếu là bệnh nhân thì chỉ hiển thị tên, không cho chỉnh sửa */}
                            {isPatient ? (
                                <div>
                                    <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                        Tên bệnh nhân *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-4 border border-dark-border rounded-lg bg-secondary-800 text-dark-text text-lg"
                                        value={userData.bn_hoten || ""}
                                        readOnly
                                        disabled
                                    />
                                </div>
                            ) : (
                                // Tiếp tân vẫn tìm kiếm/chọn bệnh nhân như cũ
                                <div className="relative">
                                    <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                        Tìm kiếm bệnh nhân *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-4 pr-12 border border-dark-border rounded-lg bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                                        value={patientSearch}
                                        onChange={handlePatientSearch}
                                        placeholder="Nhập tên, mã BN hoặc SĐT bệnh nhân..."
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(true)}
                                        className="absolute right-3 top-[38px] bg-primary-900 text-primary-300 p-2 rounded-full hover:bg-primary-800 transition-colors"
                                        title="Thêm bệnh nhân mới"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {filteredPatients.length > 0 && (
                                        <ul className="absolute z-10 w-full mt-1 bg-secondary-800 border border-dark-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {filteredPatients.map(patient => (
                                                <li
                                                    key={patient.bn_ma}
                                                    className="p-4 hover:bg-secondary-700 cursor-pointer border-b border-dark-border last:border-0 transition-colors"
                                                    onClick={() => handleSelectPatient(patient)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="font-medium text-dark-text text-lg">{patient.bn_hoten}</span>
                                                            <div className="text-sm text-dark-textSecondary">Mã BN: {patient.bn_ma}</div>
                                                        </div>
                                                        {patient.bn_sdt && (
                                                            <span className="text-dark-textSecondary bg-secondary-900 px-2 py-1 rounded">
                                                                {patient.bn_sdt}
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {/* Nếu không tìm thấy bệnh nhân */}
                                    {notFoundPatient && (
                                        <div className="mt-2 text-yellow-400 text-sm flex items-center gap-2">
                                            <span>Không tìm thấy bệnh nhân. </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(true)}
                                                className="underline text-primary-300 hover:text-primary-400"
                                            >
                                                Thêm bệnh nhân mới
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Chọn bác sĩ */}
                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                    Bác sĩ phụ trách *
                                </label>
                                <select
                                    name="nv_ma"
                                    className="w-full p-4 border border-dark-border rounded-lg bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                                    value={medicalForm.nv_ma}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Chọn bác sĩ --</option>
                                    {doctorList.map((doc) => (
                                        <option key={doc.nv_ma} value={doc.nv_ma}>
                                            {doc.nv_hoten}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Triệu chứng */}
                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                    Mô tả triệu chứng
                                </label>
                                <div className="space-y-3">
                                    {medicalForm.trieu_chung.map((symptom, index) => {
                                        const symptomObj = symptomList.find(item => item.tc_ma === symptom) || {};
                                        const displayValue = symptomObj.tc_ten || symptom;

                                        return (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        className="w-full p-4 border border-dark-border rounded-lg bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                                                        placeholder={`Triệu chứng ${index + 1}`}
                                                        value={displayValue}
                                                        onChange={(e) => handleSymptomChange(index, e.target.value)}
                                                        onFocus={() => {
                                                            if (symptom) {
                                                                const filtered = symptomList.filter(s =>
                                                                    s.tc_ten.toLowerCase().includes(symptomObj.tc_ten?.toLowerCase() || "")
                                                                );
                                                                setFilteredSymptoms(filtered);
                                                            }
                                                        }}
                                                    />
                                                    {filteredSymptoms.length > 0 && index === medicalForm.trieu_chung.length - 1 && (
                                                        <ul className="absolute z-10 w-full mt-1 bg-secondary-800 border border-dark-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                            {filteredSymptoms.map((item, idx) => (
                                                                <li
                                                                    key={idx}
                                                                    className="p-3 hover:bg-secondary-700 cursor-pointer border-b border-dark-border last:border-0 transition-colors"
                                                                    onClick={() => handleSelectSymptom(index, item.tc_ma)}
                                                                >
                                                                    <span className="text-dark-text text-lg">{item.tc_ten}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                {medicalForm.trieu_chung.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSymptom(index)}
                                                        className="text-red-400 hover:text-red-300 p-3 rounded-lg hover:bg-red-900 hover:bg-opacity-20 transition-all"
                                                        title="Xóa triệu chứng"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={handleAddSymptom}
                                        className="text-primary-300 hover:text-primary-400 flex items-center text-lg font-medium py-2 px-4 rounded-lg hover:bg-primary-900 hover:bg-opacity-20 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Thêm triệu chứng
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Cột phải - Thông tin lịch hẹn */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-medium text-dark-text border-b border-dark-border pb-2">
                                Thông tin lịch hẹn
                            </h3>

                            {/* Ngày khám */}
                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                    Ngày khám *
                                </label>
                                <input
                                    type="date"
                                    name="ph_ngayhen"
                                    className="w-full p-4 border border-dark-border rounded-lg bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                                    value={medicalForm.ph_ngayhen}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Giờ bắt đầu */}
                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                    Giờ bắt đầu *
                                </label>
                                <input
                                    type="time"
                                    name="ph_giohen"
                                    className="w-full p-4 border border-dark-border rounded-lg bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                                    value={medicalForm.ph_giohen}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Thời lượng */}
                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                    Thời lượng khám *
                                </label>
                                <select
                                    className="w-full p-4 border border-dark-border rounded-lg bg-secondary-800 text-dark-text focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                                    value={duration}
                                    onChange={handleDurationChange}
                                    required
                                >
                                    <option value={15}>15 phút</option>
                                    <option value={30}>30 phút</option>
                                    <option value={45}>45 phút</option>
                                    <option value={60}>60 phút</option>
                                    <option value={90}>90 phút</option>
                                    <option value={120}>120 phút</option>
                                </select>
                            </div>

                            {/* Giờ kết thúc (hiển thị thông tin) */}
                            <div>
                                <label className="block text-sm font-medium text-dark-textSecondary mb-2">
                                    Giờ kết thúc (dự kiến)
                                </label>
                                <input
                                    type="time"
                                    className="w-full p-4 border border-dark-border bg-secondary-900 rounded-lg text-dark-textSecondary text-lg cursor-not-allowed"
                                    value={medicalForm.ph_gioketthuc}
                                    disabled
                                />
                                <p className="text-sm text-dark-textSecondary mt-1">
                                    Được tính tự động dựa trên giờ bắt đầu và thời lượng
                                </p>
                            </div>

                            {/* Thông tin tóm tắt */}
                            <div className="bg-secondary-900 p-4 rounded-lg border border-dark-border">
                                <h4 className="text-lg font-medium text-dark-text mb-3">Tóm tắt lịch hẹn</h4>
                                <div className="space-y-2 text-dark-textSecondary">
                                    <div className="flex justify-between">
                                        <span>Bệnh nhân:</span>
                                        <span className="text-dark-text font-medium">
                                            {patientSearch || 'Chưa chọn'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Bác sĩ:</span>
                                        <span className="text-dark-text font-medium">
                                            {doctorList.find(doc => doc.nv_ma === medicalForm.nv_ma)?.nv_hoten || 'Chưa chọn'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Thời gian:</span>
                                        <span className="text-dark-text font-medium">
                                            {medicalForm.ph_ngayhen && medicalForm.ph_giohen
                                                ? `${medicalForm.ph_ngayhen} lúc ${medicalForm.ph_giohen}`
                                                : 'Chưa chọn'
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Thời lượng:</span>
                                        <span className="text-dark-text font-medium">{duration} phút</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex gap-4 pt-6 border-t border-dark-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 text-dark-textSecondary hover:text-dark-text border border-dark-border rounded-lg hover:bg-secondary-800 transition-all text-lg font-medium"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-primary hover:bg-primary-600 text-white py-4 px-6 rounded-lg transition-colors duration-200 text-lg font-medium shadow-lg"
                        >
                            Đăng ký lịch hẹn
                        </button>
                    </div>
                </form>
                {/* Modal thêm bệnh nhân mới */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleAddPatient}
                />
            </div>
        </div>
    );
};

export default BookAppointmentModal;