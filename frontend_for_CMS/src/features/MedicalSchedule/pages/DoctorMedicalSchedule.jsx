import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../../service/apiService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DoctorSidebar from '../../../layouts/DoctorSidebar';
import PageHeader from '../../../layouts/PageHeader';
import { useNavigate } from 'react-router-dom';
import ConfirmationDialogModal from '../../../components/ConfirmationDialogModal';
import { jwtDecode } from "jwt-decode";

const DoctorMedicalSchedule = () => {
    // States không thay đổi
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const recordsPerPage = 10;
    const navigate = useNavigate();
    const [doctorId, setDoctorId] = useState(null);
    // Thêm các states cần thiết (thêm vào phần đầu component)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    useEffect(() => {
        const fetchCurrentDoctor = async () => {
            try {
                const token = localStorage.getItem("access_token");
                if (token) {
                    const decoded = jwtDecode(token);
                    setDoctorId(decoded.sub || decoded.nv_ma);
                }
            } catch (error) {
                console.error("Lỗi khi lấy thông tin bác sĩ từ token:", error);
            }
        };

        fetchCurrentDoctor();
    }, []);
    // Fetch medical records based on filters - không đổi logic
    useEffect(() => {
        if (doctorId) {
            fetchMedicalRecords();
        }
    }, [doctorId,selectedDate, status, currentPage]);


    console.log("Doctor ID:", doctorId);
    const fetchMedicalRecords = async () => {
        try {
            setLoading(true);

            // Tính toán offset từ currentPage
            const offset = (currentPage - 1) * recordsPerPage;
            // Xây dựng endpoint API - không cần URL đầy đủ
            let endpoint = `/phieukham/paged?offset=${offset}&limit=${recordsPerPage}&bs_ma=${doctorId}`;

            // Thêm ngày
            const selectedDateFormatted = format(selectedDate, 'yyyy-MM-dd');
            endpoint += `&ngay=${selectedDateFormatted}`;

            // Thêm filter trạng thái nếu có
            if (status !== 'all') {
                const statusMapping = {
                    'waiting': 'Chờ khám',
                    'in_progress': 'Đang khám',
                    'completed': 'Đã khám',
                    'cancelled': 'Đã hủy'
                };
                endpoint += `&trangthai=${statusMapping[status]}`;
            }

            // Thêm filter tìm kiếm nếu có
            if (searchQuery) {
                endpoint += `&keyword=${encodeURIComponent(searchQuery)}`;
            }

            // Sử dụng API instance thay vì axios trực tiếp
            const response = await api.get(endpoint);

            if (response.data && response.data.data && response.data.data.data) {
                // Chuẩn hóa dữ liệu từ API
                const recordsData = await Promise.all(response.data.data.data.map(async record => {
                    const phieuHen = record.phieu_hen || {};
                    const bn_ma = phieuHen.bn_ma || '';

                    // Lấy thông tin bệnh nhân
                    let patient_name = null;
                    if (bn_ma) {
                        try {
                            // Sử dụng API instance
                            const patientResponse = await api.get(`/benhnhan/getbyid/${bn_ma}`);
                            patient_name = patientResponse.data.data.bn_hoten;
                        } catch (error) {
                            console.error("Lỗi khi lấy thông tin bệnh nhân:", error);
                        }
                    }

                    return {
                        pk_ma: record.pk_ma,
                        bn_ma: bn_ma,
                        patient_name: patient_name,
                        pk_ngay: record.pk_ngaykham,
                        pk_giobatdau: record.pk_giokhamdukien || phieuHen.ph_giohen,
                        pk_gioketthuc: record.pk_gioketthuc || phieuHen.ph_gioketthuc,
                        status: record.pk_trangthai === "Chờ khám" ? "waiting"
                            : record.pk_trangthai === "Đang khám" ? "in_progress"
                                : record.pk_trangthai === "Đã khám" || "Đã thanh toán" ? "completed"
                                    : record.pk_trangthai === "Đã hủy" ? "cancelled"
                                        : "waiting",
                        rawData: record
                    };
                }));

                setRecords(recordsData);
                console.log("Dữ liệu lịch khám:", recordsData);
                setTotalPages(Math.ceil(response.data.data.total / recordsPerPage));
            }

            setLoading(false);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu lịch khám:", error);
            toast.error("Không thể tải dữ liệu lịch khám. Vui lòng thử lại sau!");
            setLoading(false);
        }
    };

    // Các hàm xử lý không thay đổi
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchMedicalRecords();
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setCurrentPage(1);
    };

    const handleViewPatientDetail = (record) => {
        navigate(`/patient/${record.bn_ma}`);
    };

    const handleStartExamination = async (record) => {
        try {
            toast.success("Bắt đầu khám bệnh!");
            fetchMedicalRecords();
            navigate(`/examination/${record.pk_ma}`, {
                state: {
                    pk_ma: record.pk_ma,
                    pk_ngay: record.pk_ngay
                }
            });
        } catch (error) {
            console.error("Lỗi khi bắt đầu khám bệnh:", error);
            toast.error("Không thể bắt đầu khám bệnh. Vui lòng thử lại sau!");
        }
    };

    const handleCompleteExamination = async (record) => {
        try {
            await api.post(`/phieukham/complete/${record.pk_ma}`);
            toast.success("Hoàn thành khám bệnh!");
            fetchMedicalRecords();
        } catch (error) {
            console.error("Lỗi khi hoàn thành khám bệnh:", error);
            toast.error("Không thể hoàn thành khám bệnh. Vui lòng thử lại sau!");
        }
    };

    // Cập nhật các hàm helper để phù hợp với dark mode
    const getStatusClass = (status) => {
        switch (status) {
            case 'waiting':
                return 'bg-yellow-900 text-yellow-300';
            case 'in_progress':
                return 'bg-primary-900 text-primary-300';
            case 'completed':
                return 'bg-green-900 text-green-300';
            case 'cancelled':
                return 'bg-red-900 text-red-300';
            default:
                return 'bg-secondary-800 text-secondary-300';
        }
    };

    const getStatusText = (status) => {
        // Không thay đổi
        switch (status) {
            case 'waiting':
                return 'Chờ khám';
            case 'in_progress':
                return 'Đang khám';
            case 'completed':
                return 'Đã khám';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return 'Không xác định';
        }
    };

    // Hàm xử lý khi xác nhận gọi bệnh nhân
    const handleConfirmExamination = async () => {
        try {
            // Gọi API để cập nhật trạng thái "Đang khám"
            await api.post(`/phieukham/start/${selectedRecord.pk_ma}`);

            toast.success("Đã gọi bệnh nhân vào khám!");
            setIsConfirmModalOpen(false);

            navigate(`/examination/${selectedRecord.pk_ma}`, {
                state: {
                    pk_ma: selectedRecord.pk_ma,
                    pk_ngay: selectedRecord.pk_ngay
                }
            });

            // Refresh dữ liệu
            setTimeout(() => fetchMedicalRecords(), 500);
        } catch (error) {
            console.error("Lỗi khi bắt đầu khám bệnh:", error);
            toast.error("Không thể bắt đầu khám bệnh. Vui lòng thử lại sau!");
            setIsConfirmModalOpen(false);
        }
    };

    // Trong phần render, thay đổi nút "Bắt đầu khám"
    const renderStartExaminationButton = (record) => {
        if (record.status === 'waiting') {
            return (
                <button
                    onClick={() => openConfirmModal(record)}
                    className="text-green-400 hover:text-green-300"
                    title="Bắt đầu khám"
                >
                    <i className="fas fa-play-circle"></i>
                </button>
            );
        }
    };

    const openConfirmModal = (record) => {
        setSelectedRecord(record);
        setIsConfirmModalOpen(true);
    };

    return (
        <div className="flex h-screen bg-dark-bg">
            <DoctorSidebar />
            <div className="flex-1 p-6 overflow-auto flex flex-col">
                <PageHeader title="Quản Lý Lịch Khám Của Tôi" breadcrumbs={["Lịch Khám"]}>
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <DatePicker
                                selected={selectedDate}
                                onChange={handleDateChange}
                                dateFormat="dd/MM/yyyy"
                                className="appearance-none bg-dark-card border border-dark-border text-dark-text rounded-lg py-2 px-4 leading-tight focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer pr-8"
                                onKeyDown={e => e.preventDefault()}
                            />
                            <i className="fas fa-calendar-alt absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary pointer-events-none"></i>
                        </div>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="appearance-none bg-dark-card border border-dark-border text-dark-text rounded-lg py-2 px-4 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="waiting">Chờ khám</option>
                            <option value="in_progress">Đang khám</option>
                            <option value="completed">Đã khám</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>

                        <button
                            onClick={fetchMedicalRecords}
                            className="ml-2 p-2 border border-dark-border rounded-md hover:bg-secondary-800 text-dark-text"
                            title="Làm mới"
                        >
                            <i className="fas fa-sync-alt"></i>
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="flex items-center ml-auto">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm bệnh nhân..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border border-dark-border bg-secondary-800 px-3 py-2 pr-10 rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                                type="submit"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-dark-textSecondary hover:text-dark-text p-1"
                            >
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </form>
                </PageHeader>

                <div className="bg-dark-card shadow-md rounded-lg overflow-hidden mt-4 border border-dark-border">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-secondary-800 border-b border-dark-border">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                        Mã phiếu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                        Bệnh nhân
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                        Thời gian
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-dark-text">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-dark-textSecondary">
                                            Không có lịch khám cho ngày này
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => (
                                        <tr key={record.pk_ma} className="hover:bg-secondary-900">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">
                                                {record.pk_ma}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="font-medium text-dark-text">{record.patient_name || (record.bn_ma ? `Bệnh nhân #${record.bn_ma.substring(2)}` : 'N/A')}</div>
                                                <div className="text-xs text-dark-textSecondary">{record.bn_ma}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                                <div>
                                                    {(() => {
                                                        try {
                                                            const date = new Date(record.pk_ngay);
                                                            return !isNaN(date.getTime())
                                                                ? format(date, 'dd/MM/yyyy')
                                                                : 'Không có ngày';
                                                        } catch (e) {
                                                            return 'Không có ngày';
                                                        }
                                                    })()}
                                                </div>
                                                <div className="text-xs">{record.pk_giobatdau || '--'} - {record.pk_gioketthuc || '--'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(record.status)}`}>
                                                    {getStatusText(record.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewPatientDetail(record)}
                                                        className="text-primary-300 hover:text-primary-400"
                                                        title="Xem thông tin bệnh nhân"
                                                    >
                                                        <i className="fas fa-user-circle"></i>
                                                    </button>

                                                    {renderStartExaminationButton(record)}

                                                    {record.status === 'in_progress' && (
                                                        <>
                                                            <button
                                                                onClick={() => navigate(`/examination/${record.pk_ma}`)}
                                                                className="text-primary-300 hover:text-primary-400"
                                                                title="Tiếp tục khám"
                                                            >
                                                                <i className="fas fa-stethoscope"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => handleCompleteExamination(record)}
                                                                className="text-green-400 hover:text-green-300"
                                                                title="Hoàn thành khám"
                                                            >
                                                                <i className="fas fa-check-circle"></i>
                                                            </button>
                                                        </>
                                                    )}

                                                    {record.status === 'completed' && (
                                                        <button
                                                            onClick={() => window.open(`http://127.0.0.1:5000/api/phieukham/print/${record.pk_ma}`, '_blank')}
                                                            className="text-dark-textSecondary hover:text-dark-text"
                                                            title="In phiếu khám"
                                                        >
                                                            <i className="fas fa-print"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-4 py-3 bg-secondary-800 border-t border-dark-border sm:px-6 flex items-center justify-between">
                        <div className="text-sm text-dark-textSecondary">
                            Hiển thị <span className="text-dark-text">{records.length ? (currentPage - 1) * recordsPerPage + 1 : 0}</span> đến{" "}
                            <span className="text-dark-text">{Math.min(currentPage * recordsPerPage, records.length)}</span> của{" "}
                            <span className="text-dark-text">{records.length}</span> kết quả
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 border border-dark-border rounded-md ${currentPage === 1
                                    ? "bg-secondary-900 text-dark-textSecondary cursor-not-allowed"
                                    : "bg-secondary-800 text-dark-text hover:bg-secondary-700"
                                    }`}
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1 border border-dark-border rounded-md ${currentPage === i + 1
                                        ? "bg-primary text-white"
                                        : "bg-secondary-800 text-dark-text hover:bg-secondary-700"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 border border-dark-border rounded-md ${currentPage === totalPages
                                    ? "bg-secondary-900 text-dark-textSecondary cursor-not-allowed"
                                    : "bg-secondary-800 text-dark-text hover:bg-secondary-700"
                                    }`}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal xác nhận gọi bệnh nhân */}
                {isConfirmModalOpen && selectedRecord && (
                    <ConfirmationDialogModal
                        isOpen={isConfirmModalOpen}
                        onClose={() => setIsConfirmModalOpen(false)}
                        onConfirm={() => {
                            handleStartExamination(selectedRecord);
                            setIsConfirmModalOpen(false);
                        }}
                        title="Xác nhận gọi bệnh nhân"
                        message={
                            <div className="space-y-3">
                                <div className="bg-primary-900 bg-opacity-20 p-4 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="bg-primary text-white rounded-full p-3 mr-4">
                                            <i className="fas fa-user-plus text-xl"></i>
                                        </div>
                                        <div>
                                            <p className="text-sm text-dark-textSecondary">Bệnh nhân tiếp theo</p>
                                            <div className="text-lg font-bold text-dark-text flex items-center">
                                                {selectedRecord && (
                                                    <span className="bg-primary-900 text-primary-300 text-sm rounded-full px-2 py-0.5 mr-2">
                                                        STT: {selectedRecord?.pk_ma || '?'}
                                                    </span>
                                                )}
                                                {selectedRecord && (selectedRecord.patient_name || (selectedRecord.bn_ma ? `Bệnh nhân #${selectedRecord.bn_ma.substring(2)}` : 'Không có tên'))}
                                            </div>

                                        </div>
                                    </div>
                                </div>
                                <p className="text-dark-textSecondary">
                                    Xác nhận gọi bệnh nhân vào khám? Hành động này sẽ đánh dấu bệnh nhân đang được khám.
                                </p>
                            </div>
                        }
                        confirmButtonText="Gọi bệnh nhân"
                        cancelButtonText="Hủy"
                        icon="bell"
                        iconColor="text-primary"
                        confirmButtonColor="bg-primary hover:bg-primary-600"
                    />
                )}

                <ToastContainer position="bottom-right" theme="dark" />
            </div>
        </div>
    );
};

export default DoctorMedicalSchedule;