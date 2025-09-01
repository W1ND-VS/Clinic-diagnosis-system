import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DoctorSidebar from "../../../layouts/DoctorSidebar";
import api from "../../../service/apiService";
import ConfirmationDialogModal from "../../../components/ConfirmationDialogModal";
import AddPrescriptionModal from '../components/AddPrescriptionModal';
import ViewResultsModal from '../components/ViewResultsModal'; // Import ViewResultsModal
import DiagnosisSuggestionModal from '../components/DiagnosisSuggestionModal'; // Import DiagnosisSuggestionModal
import { DOSAGE_TIMES, MEAL_RELATIONS, TIME_OF_DAY } from '../../../constants/medication';

// Constants

const Examination = () => {
  // Router hooks
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { pk_ngay } = location.state || {};
  // ...existing code...
  // ...existing code...

  const [editingSymptoms, setEditingSymptoms] = useState(false);
  const [symptomInputs, setSymptomInputs] = useState([]); // Khởi tạo rỗng
  const [symptomList, setSymptomList] = useState([]); // Danh sách triệu chứng từ API
  // ...existing code...
  // ...existing code...
  // States remain unchanged
  const [phieuKham, setPhieuKham] = useState(location.state?.phieuKham || null);
  const [patient, setPatient] = useState({
    bn_hoten: '',
    bn_gioitinh: '',
    bn_ngaysinh: '',
    bn_sdt: ''
  });


  // Medical info
  const [symptoms, setSymptoms] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [currentDiagnosis, setCurrentDiagnosis] = useState('');
  const [taiKhamDate, setTaiKhamDate] = useState('');

  // Service & prescription data
  const [services, setServices] = useState([]);
  const [medications, setMedications] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // UI states
  const [isAddingService, setIsAddingService] = useState(false);
  const [isAddingPrescription, setIsAddingPrescription] = useState(false);
  const [isSavingServices, setIsSavingServices] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [openSections, setOpenSections] = useState({
    patientInfo: false,
    symptoms: false,
    diagnosis: false,
  });
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);

  // Temporary form data
  const [selectedService, setSelectedService] = useState({
    dvyt_ma: '',
    dvyt_ten: '',
    ghi_chu: '',
    don_gia: 0,
    ngay_ap_dung: ''
  });
  const [selectedPrescription, setSelectedPrescription] = useState({
    ten_thuoc: '',
    dvt: 'Viên',
    so_luong: 0,
    cach_dung: '',
    luu_y: '',
  });

  // Thêm state để lưu thông tin phiếu hẹn
  const [phieuHen, setPhieuHen] = useState(null);
// ...existing code...
  const [quickDiagnosisSuggestions, setQuickDiagnosisSuggestions] = useState([]);
// ...existing code...
  // Thêm state mới để quản lý trạng thái của modal xác nhận
  const [isPrintConfirmOpen, setIsPrintConfirmOpen] = useState(false);

  // Thêm states để quản lý phiếu chỉ định
  const [hasExistingServiceOrder, setHasExistingServiceOrder] = useState(false);
  const [existingServices, setExistingServices] = useState([]);
  const [loadingExistingServices, setLoadingExistingServices] = useState(true);

  // Thêm state kiểm soát modal CompleteService
  const [isCompleteServiceModalOpen, setIsCompleteServiceModalOpen] = useState(false);
  const [selectedPcdMa, setSelectedPcdMa] = useState(null);

  // ...existing code...
useEffect(() => {
  if (symptoms.length > 0) {
    api.post('/chandoan/predict', { symptoms })
      .then(res => {
        if (res.data && res.data.success && res.data.data?.results) {
          setQuickDiagnosisSuggestions(res.data.data.results.map(r => r.disease_info));
        } else {
          setQuickDiagnosisSuggestions([]);
        }
      })
      .catch(() => setQuickDiagnosisSuggestions([]));
  } else {
    setQuickDiagnosisSuggestions([]);
  }
}, [symptoms]);
// ...existing code...
  // Thêm state để lưu trạng thái và kết quả từ server
  const [hasServiceResults, setHasServiceResults] = useState(false);
  const [serviceResults, setServiceResults] = useState(null);
  const [isViewResultsModalOpen, setIsViewResultsModalOpen] = useState(false);
  const [isPrintPrescriptionOpen, setIsPrintPrescriptionOpen] = useState(false);

  // Thêm state mới để lưu danh sách bệnh và gợi ý
  const [diseases, setDiseases] = useState([]);
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Thêm state và hàm kiểm tra
  const [newDiagnoses, setNewDiagnoses] = useState([]);
  const [pendingPrescriptionData, setPendingPrescriptionData] = useState(null);
  const [isConfirmNewDiagnoseOpen, setIsConfirmNewDiagnoseOpen] = useState(false);

  // Add this new state to store saved prescription details
  const [savedPrescriptions, setSavedPrescriptions] = useState([]);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  // Thêm vào phần states
  const [vitalSigns, setVitalSigns] = useState({
    pk_nhietdo: '',
    pk_huyetap_tamthu: '',
    pk_huyetap_tamtruong: '',
    pk_nhiptim: '',
    pk_nhiptho: '',
    pk_cannang: '',
    pk_chieucao: '',
    chi_so_bmi: '', // BMI tính toán frontend
    ghi_chu: ''
  });

  // Thêm hàm tính BMI tự động
  const calculateBMI = (weight, height) => {
    if (weight && height) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return '';
  };

  // Thêm handler cho vital signs
  const handleVitalSignsChange = (field, value) => {
    const updatedVitalSigns = { ...vitalSigns, [field]: value };

    // Tự động tính BMI khi có cân nặng và chiều cao
    if (field === 'pk_cannang' || field === 'pk_chieucao') {
      const bmi = calculateBMI(
        field === 'pk_cannang' ? value : updatedVitalSigns.pk_cannang,
        field === 'pk_chieucao' ? value : updatedVitalSigns.pk_chieucao
      );
      updatedVitalSigns.chi_so_bmi = bmi;
    }

    setVitalSigns(updatedVitalSigns);
  };

  // Thêm hàm lưu sinh hiệu
  const handleSaveVitalSigns = async () => {
    try {
      setIsSaving(true);

      // Chuẩn bị dữ liệu gửi lên backend với đúng tên thuộc tính
      const vitalSignsData = {
        pk_ma: phieuKham.pk_ma,
        pk_ngaykham: phieuKham.pk_ngaykham,
        pk_nhietdo: vitalSigns.pk_nhietdo || null,
        pk_huyetap_tamthu: vitalSigns.pk_huyetap_tamthu || null,
        pk_huyetap_tamtruong: vitalSigns.pk_huyetap_tamtruong || null,
        pk_nhiptim: vitalSigns.pk_nhiptim || null,
        pk_nhiptho: vitalSigns.pk_nhiptho || null,
        pk_chieucao: vitalSigns.pk_chieucao || null,
        pk_cannang: vitalSigns.pk_cannang || null,
        // Không gửi BMI lên backend vì có thể tính toán ở backend
        // ghi_chu: vitalSigns.ghi_chu || null
      };

      console.log("Saving vital signs with correct field names:", vitalSignsData);

      const response = await api.post('/sinhhieu/create', vitalSignsData);

      if (response.data.success) {
        alert('Lưu sinh hiệu thành công!');
      } else {
        throw new Error(response.data.message || 'Lỗi khi lưu sinh hiệu');
      }
    } catch (error) {
      console.error('Error saving vital signs:', error);
      alert('Có lỗi xảy ra khi lưu sinh hiệu: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  useEffect(() => {
    api.get('/trieuchung/getall')
      .then(res => {
        if (res.data && res.data.data) setSymptomList(res.data.data);
      })
      .catch(err => {
        console.error('Lỗi lấy danh sách triệu chứng:', err);
      });
  }, []);
  useEffect(() => {
    if (editingSymptoms) {
      if (symptomInputs.length === 0) setSymptomInputs(['']);
    } else {
      // Lấy danh sách mã triệu chứng từ symptomInputs
      const selectedSymptoms = symptomInputs
        .map(s => symptomList.find(item => item.tc_ten === s))
        .filter(Boolean)
        .map(item => item.tc_ma);

      setSymptoms(symptomInputs.filter(s => s.trim() !== ""));

      // Nếu có phiếu khám và có triệu chứng hợp lệ thì gọi API cập nhật
      if (phieuKham?.pk_ma && phieuKham?.pk_ngaykham && selectedSymptoms.length > 0) {
        api.put('/phieuhen/update-symptoms-from-phieukham', {
          pk_ma: phieuKham.pk_ma,
          pk_ngaykham: phieuKham.pk_ngaykham,
          trieu_chung_list: selectedSymptoms
        })
          .then(res => {
            // Có thể hiển thị thông báo thành công ở đây nếu muốn
            // alert('Cập nhật triệu chứng thành công!');
          })
          .catch(err => {
            alert('Cập nhật triệu chứng thất bại!');
            console.error(err);
          });
      }
    }
    // eslint-disable-next-line
  }, [editingSymptoms]);

  // Fetch initial examination data
  useEffect(() => {
    if (id && !phieuKham) {
      const fetchData = async () => {
        try {
          const response = await api.get(`/phieukham/${id}/${pk_ngay}`);
          console.log("API Response:", response.data);

          if (response.data.data) {
            setPhieuKham(response.data.data);
          } else {
            throw new Error("Không tìm thấy dữ liệu phiếu khám");
          }
        } catch (error) {
          console.error("Error fetching examination details:", error);
          alert("Không thể tải thông tin phiếu khám. Vui lòng thử lại.");
          navigate('/doctormedicalrecords');
        }
      };
      fetchData();
    }
  }, [id, phieuKham, pk_ngay, navigate]);

  // Lấy phiếu hẹn từ phiếu khám
  useEffect(() => {
    if (phieuKham?.ph_ma) {
      api.get(`/phieuhen/${phieuKham.ph_ma}`)
        .then((response) => {
          if (response.data.data) {
            console.log("Phiếu hẹn:", response.data.data);
            setPhieuHen(response.data.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching appointment information:", error);
        });
    }
  }, [phieuKham?.ph_ma]);

  // Lấy thông tin bệnh nhân từ phiếu hẹn
  useEffect(() => {
    if (phieuHen?.bn_ma) {
      // Lấy thông tin bệnh nhân
      api.get(`/benhnhan/getbyid/${phieuHen.bn_ma}`)
        .then((response) => {
          if (response.data.data) {
            const patientData = response.data.data;
            console.log("Thông tin bệnh nhân từ phiếu hẹn:", patientData);
            setPatient({
              bn_hoten: patientData.bn_hoten,
              bn_gioitinh: patientData.bn_gioitinh,
              bn_ngaysinh: patientData.bn_ngaysinh,
              bn_sdt: patientData.bn_sdt
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching patient information:", error);
        });
      // Lấy thông tin triệu chứng từ phiếu hẹn
      api.get(`/trieuchung/phieu-hen/${phieuKham.ph_ma}`)
        .then((response) => {
          if (response.data && response.data.data) {
            console.log("Triệu chứng từ API:", response.data.data);

            // Tạo mảng các triệu chứng từ dữ liệu API
            const symptomList = response.data.data.map(symptom => symptom.tc_ten || symptom.tc_mota);
            setSymptoms(symptomList);

            // Tự động mở phần triệu chứng khi có dữ liệu
            if (symptomList.length > 0) {
              setOpenSections(prev => ({ ...prev, symptoms: true }));
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching symptoms information:", error);
        });
    }
  }, [phieuHen?.bn_ma]);

  // Fetch services and medications
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [servicesRes, medicationsRes] = await Promise.all([
          api.get('/dichvu/getall'),
          api.get('/thuoc/getall')
        ]);

        setServices(servicesRes.data.data);
        setMedications(medicationsRes.data.data);
        console.log("Dịch vụ:", servicesRes.data.data);
        console.log("Thuốc:", medicationsRes.data.data);
      } catch (error) {
        console.error("Error fetching resources:", error);
      }
    };

    fetchResources();
  }, []);

  // UI Handlers
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDiagnosisChange = (e) => {
    const value = e.target.value;
    setCurrentDiagnosis(value);

    // Nếu giá trị rỗng, ẩn gợi ý
    if (!value.trim()) {
      setDiagnosisSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Lọc các gợi ý phù hợp
    const filteredSuggestions = diseases.filter(disease =>
      disease.b_ten.toLowerCase().includes(value.toLowerCase()) &&
      !diagnoses.some(d => d.toLowerCase() === disease.b_ten.toLowerCase())
    );

    setDiagnosisSuggestions(filteredSuggestions);
    setShowSuggestions(filteredSuggestions.length > 0);
  };

  // Service Handlers
  const handleAddService = () => {
    setSelectedService({
      dvyt_ma: '',
      dvyt_ten: '',
      ghi_chu: '',
      don_gia: 0,
      ngay_ap_dung: ''
    });
    setIsAddingService(true);
  };
  const handlePrintPrescriptionClick = () => {
    if (prescriptions.length === 0) {
      alert("Chưa có thuốc nào để in!");
      return;
    }
    setIsPrintPrescriptionOpen(true);
  };

  const handleViewResults = () => {
    if (!selectedPcdMa) {
      // Nếu chưa có selectedPcdMa, lấy từ API
      api.get(`/phieukham/${phieuKham.pk_ma}/${phieuKham.pk_ngaykham}/pcd_ma`)
        .then((response) => {
          if (response.data.data && response.data.data.pcd_ma) {
            setSelectedPcdMa(response.data.data.pcd_ma);
            setIsViewResultsModalOpen(true);
          } else {
            toast.error('Không tìm thấy mã phiếu chỉ định');
          }
        })
        .catch((error) => {
          console.error("Error getting pcd_ma:", error);
          toast.error('Có lỗi khi lấy thông tin phiếu chỉ định');
        });
    } else {
      setIsViewResultsModalOpen(true);
    }
  };

  const handleServiceChange = (e) => {
    const service = services.find(s => s.dvyt_ma === e.target.value);
    if (service) {
      setSelectedService({
        dvyt_ma: service.dvyt_ma,
        dvyt_ten: service.dvyt_ten,
        ghi_chu: '',
        don_gia: service.dongia.gia, // Sửa từ service.don_gia thành service.dongia.gia
        ngay_ap_dung: service.ngay_ap_dung || new Date().toISOString().split('T')[0]
      });
    } else {
      setSelectedService({
        dvyt_ma: '',
        dvyt_ten: '',
        ghi_chu: '',
        don_gia: 0,
        ngay_ap_dung: ''
      });
    }
  };

  const handleSaveService = () => {
    if (selectedService.editIndex !== undefined) {
      setSelectedServices(prev => prev.map((service, index) =>
        index === selectedService.editIndex ? selectedService : service
      ));
    } else {
      setSelectedServices(prev => [...prev, selectedService]);
    }

    setIsAddingService(false);
  };

  const handleEditService = (service, index) => {
    setSelectedService({
      ...service,
      editIndex: index
    });
    setIsAddingService(true);
  };

  const handleDeleteService = (index) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      setSelectedServices(prev => prev.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const response = await api.get('/benh');
        if (response.data && response.data.success) {
          setDiseases(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching diseases:", error);
      }
    };

    fetchDiseases();
  }, []);
  const handleSelectSuggestion = (suggestion) => {
    if (!diagnoses.some(d => d.toLowerCase() === suggestion.b_ten.toLowerCase())) {
      setDiagnoses([...diagnoses, suggestion.b_ten]);
    }
    setCurrentDiagnosis('');
    setShowSuggestions(false);
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && currentDiagnosis.trim()) {
      e.preventDefault();
      handleAddDiagnosis();
    }
  };
  const handleAddDiagnosis = () => {
    if (currentDiagnosis.trim() && !diagnoses.includes(currentDiagnosis.trim())) {
      setDiagnoses([...diagnoses, currentDiagnosis.trim()]);
      setCurrentDiagnosis('');
      setDiagnosisSuggestions([]);
    }
  };
  const handleRemoveDiagnosis = (indexToRemove) => {
    setDiagnoses(diagnoses.filter((_, index) => index !== indexToRemove));
  };


  // Prescription Handlers
  const handleAddPrescription = () => {
    setSelectedPrescription({
      ten_thuoc: '',
      dvt: 'Viên',
      so_luong: 0,
      cach_dung: '',
      luu_y: '',
    });
    setIsAddingPrescription(true);
  };

  const handleSavePrescription = () => {
    if (selectedPrescription.editIndex !== undefined) {
      setPrescriptions(prev => prev.map((prescription, index) =>
        index === selectedPrescription.editIndex ? selectedPrescription : prescription
      ));
    } else {
      setPrescriptions(prev => [...prev, selectedPrescription]);
    }

    setIsAddingPrescription(false);
  };

  const handleEditPrescription = (prescription, index) => {
    setSelectedPrescription({
      ...prescription,
      editIndex: index
    });
    setIsAddingPrescription(true);
  };

  const handleDeletePrescription = (index) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thuốc này?')) {
      setPrescriptions(prev => prev.filter((_, i) => i !== index));
    }
  };


  // Complete examination flow
  const handleComplete = async () => {
    try {
      setIsCompleting(true);

      // Kiểm tra xem phiếu có chỉ định dịch vụ không và đã có kết quả chưa
      const hasServiceOrders = hasServiceResults || (selectedPcdMa && existingServices.length > 0);
      console.log("Has service orders:", hasServiceOrders);
      console.log("Has service results:", hasServiceResults);
      console.log("Existing services:", existingServices);

      // Kiểm tra xem đã có toa thuốc chưa
      const hasPrescription = isSavingPrescription && savedPrescriptions.length > 0;

      // Danh sách thông báo lỗi 
      const errorMessages = [];

      // Nếu có dịch vụ nhưng chưa hoàn thành
      if (!hasServiceOrders && existingServices.length > 0) {
        errorMessages.push("Một số dịch vụ y tế chưa được hoàn thành. Vui lòng đợi kết quả từ tất cả các dịch vụ.");
      }

      // Nếu chưa kê toa thuốc và không có dịch vụ
      if (!hasPrescription && !hasServiceOrders) {
        errorMessages.push("Vui lòng kê toa thuốc hoặc chỉ định dịch vụ y tế trước khi hoàn thành.");
      }

      // Nếu có lỗi, hiển thị và dừng quy trình
      if (errorMessages.length > 0) {
        alert(`Không thể hoàn thành khám bệnh:\n${errorMessages.join('\n')}`);
        return;
      }

      // Chuẩn bị dữ liệu sinh hiệu để gửi cùng với request hoàn thành
      const vitalSignsPayload = {};

      // Chỉ gửi các field sinh hiệu có giá trị
      if (vitalSigns.pk_nhietdo && vitalSigns.pk_nhietdo.trim()) {
        vitalSignsPayload.pk_nhietdo = parseFloat(vitalSigns.pk_nhietdo);
      }
      if (vitalSigns.pk_huyetap_tamthu && vitalSigns.pk_huyetap_tamthu.trim()) {
        vitalSignsPayload.pk_huyetap_tamthu = parseInt(vitalSigns.pk_huyetap_tamthu);
      }
      if (vitalSigns.pk_huyetap_tamtruong && vitalSigns.pk_huyetap_tamtruong.trim()) {
        vitalSignsPayload.pk_huyetap_tamtruong = parseInt(vitalSigns.pk_huyetap_tamtruong);
      }
      if (vitalSigns.pk_nhiptim && vitalSigns.pk_nhiptim.trim()) {
        vitalSignsPayload.pk_nhiptim = parseInt(vitalSigns.pk_nhiptim);
      }
      if (vitalSigns.pk_nhiptho && vitalSigns.pk_nhiptho.trim()) {
        vitalSignsPayload.pk_nhiptho = parseInt(vitalSigns.pk_nhiptho);
      }
      if (vitalSigns.pk_chieucao && vitalSigns.pk_chieucao.trim()) {
        vitalSignsPayload.pk_chieucao = parseFloat(vitalSigns.pk_chieucao);
      }
      if (vitalSigns.pk_cannang && vitalSigns.pk_cannang.trim()) {
        vitalSignsPayload.pk_cannang = parseFloat(vitalSigns.pk_cannang);
      }

      console.log("Completing examination with vital signs:", vitalSignsPayload);

      // Gọi API để hoàn thành khám bệnh kèm theo thông tin sinh hiệu
      const response = await api.put(
        `/phieukham/${phieuKham.pk_ma}/${phieuKham.pk_ngaykham}/complete`,
        vitalSignsPayload
      );

      if (response.data && response.data.success) {
        // Hiển thị thông báo chi tiết về việc hoàn thành
        let successMessage = 'Đã hoàn thành khám bệnh!';

        if (response.data.data.vital_signs_updated) {
          const updatedFields = response.data.data.updated_fields || [];
          if (updatedFields.length > 0) {
            successMessage += `\nĐã cập nhật ${updatedFields.length} thông số sinh hiệu.`;
          }
        }

        alert(successMessage);
        navigate('/doctormedicalrecords');
      } else {
        throw new Error(response.data?.message || 'Có lỗi xảy ra khi hoàn thành khám bệnh');
      }
    } catch (error) {
      console.error('Lỗi khi hoàn thành khám:', error);

      // Xử lý các loại lỗi khác nhau
      let errorMessage = 'Có lỗi xảy ra khi hoàn thành khám: ';

      if (error.response?.status === 400) {
        errorMessage += error.response.data?.message || 'Dữ liệu không hợp lệ';
      } else if (error.response?.status === 404) {
        errorMessage += 'Không tìm thấy phiếu khám';
      } else {
        errorMessage += error.message || 'Lỗi không xác định';
      }

      alert(errorMessage);
    } finally {
      setIsCompleting(false);
    }
  };

  // Thay thế hàm confirmPrintServices hiện tại bằng hàm mới này
  const handlePrintServiceClick = () => {
    if (selectedServices.length === 0) {
      alert("Chưa có dịch vụ nào để in!");
      return;
    }
    setIsPrintConfirmOpen(true);
  };

  // Thêm hàm xử lý khi người dùng xác nhận in
  const confirmPrintServices = async () => {
    try {
      // Tạo dữ liệu để gửi đến server
      const serviceData = {
        pk_ma: phieuKham.pk_ma,
        pk_ngaykham: phieuKham.pk_ngaykham,
        dichvu_list: selectedServices.map(service => service.dvyt_ma)
      };

      // Hiển thị loading state
      setIsPrintConfirmOpen(false);
      setIsSavingServices(true);

      console.log("Sending service order data:", serviceData);

      // Gửi request đến server để tạo phiếu chỉ định trước khi in
      const response = await api.post(
        '/ketqua/create-with-prescription',
        serviceData
      );

      // Kiểm tra kết quả từ server
      if (response.data && response.data.success) {
        console.log("Service order created successfully:", response.data);

        // Lưu mã phiếu chỉ định nếu server trả về
        if (response.data.data && response.data.data.pcd_ma) {
          setSelectedPcdMa(response.data.data.pcd_ma);
        }

        // Cập nhật trạng thái UI
        setHasExistingServiceOrder(true);

        // Refresh danh sách dịch vụ
        if (response.data.data && response.data.data.pcd_ma) {
          fetchExistingServiceDetails(response.data.data.pcd_ma);
        }

        // Tạo nội dung để in - giữ nguyên code in hiện có
        const clinicName = "Phòng khám Đa khoa CTU";
        const clinicAddress = "Khu II, Đường 3/2, Ninh Kiều, Cần Thơ";

        const printContent = document.createElement('div');
        printContent.innerHTML = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0;">${clinicName}</h2>
              <p style="margin: 5px 0;">${clinicAddress}</p>
              <h3 style="margin: 10px 0 0 0;">PHIẾU CHỈ ĐỊNH DỊCH VỤ</h3>
              <p style="margin: 5px 0;">Mã phiếu khám: ${phieuKham.pk_ma}</p>
              <p style="margin: 5px 0;">Ngày khám: ${phieuKham.pk_ngaykham}</p>
              ${response.data.data?.pcd_ma ? `<p style="margin: 5px 0;">Mã phiếu chỉ định: ${response.data.data.pcd_ma}</p>` : ''}
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0;">THÔNG TIN BỆNH NHÂN</h3>
              <p style="margin: 5px 0;"><b>Họ và tên:</b> ${patient.bn_hoten}</p>
              <p style="margin: 5px 0;"><b>Giới tính:</b> ${patient.bn_gioitinh}</p>
              <p style="margin: 5px 0;"><b>Ngày sinh:</b> ${patient.bn_ngaysinh}</p>
            </div>
            
            <div>
              <h3 style="margin: 0 0 10px 0;">DỊCH VỤ CHỈ ĐỊNH</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">STT</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tên dịch vụ</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Ghi chú</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Đơn giá</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedServices.map((service, index) => `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${service.dvyt_ten}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${service.ghi_chu || "-"}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${service.don_gia?.toLocaleString('vi-VN')}₫</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">Tổng chi phí:</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">
                      ${selectedServices.reduce((total, service) => total + (service.don_gia || 0), 0).toLocaleString('vi-VN')}₫
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div style="margin-top: 30px; text-align: right;">
              <p style="margin: 5px 0;">Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>
              <p style="margin: 5px 0; font-weight: bold;">BÁC SĨ CHỈ ĐỊNH</p>
              <p style="margin: 40px 0 0 0; font-style: italic;">(Ký và ghi rõ họ tên)</p>
            </div>
          </div>
        `;

        // Tạo cửa sổ in mới
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>Phiếu chỉ định dịch vụ</title>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        // In sau khi nội dung đã được tải
        setTimeout(() => {
          printWindow.print();
        }, 500);

        // Sau khi in xong, làm mới danh sách dịch vụ đã chọn
        setSelectedServices([]);

      } else {
        throw new Error(response.data?.message || "Không thể tạo phiếu chỉ định");
      }
    } catch (error) {
      console.error("Lỗi khi tạo phiếu chỉ định:", error);
      alert("Có lỗi xảy ra khi tạo phiếu chỉ định: " + (error.message || "Lỗi không xác định"));
    } finally {
      setIsSavingServices(false);
    }
  };

  // Function để lấy chi tiết của phiếu chỉ định
  const fetchExistingServiceDetails = async (pcd_ma) => {
    try {
      const response = await api.get(`/ketqua/services/${pcd_ma}`);
      if (response.data.success && response.data.data) {
        const servicesData = response.data.data;
        console.log("Chi tiết dịch vụ đã chỉ định:", servicesData);
        setExistingServices(servicesData || []);

        // Sau khi lấy dịch vụ, kiểm tra xem có kết quả không
        await checkServiceResults(pcd_ma);
      }
    } catch (error) {
      console.error("Error fetching service order details:", error);
    } finally {
      setLoadingExistingServices(false);
    }
  };

  // Hàm kiểm tra xem phiếu khám đã có toa thuốc chưa và lấy dữ liệu về
  const checkSavingPrescription = async () => {
    try {
      setIsSaving(true); // Hiển thị trạng thái loading

      // Gọi API để kiểm tra toa thuốc
      const response = await api.get(`/toathuoc/phieukham/${phieuKham.pk_ma}/${phieuKham.pk_ngaykham}`);

      console.log("Kết quả kiểm tra toa thuốc:", response.data);

      if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
        // Phiếu khám đã có toa thuốc
        setIsSavingPrescription(true);

        // Lưu chi tiết toa thuốc để hiển thị
        setSavedPrescriptions(response.data.data);

        // Lấy mã toa thuốc từ phần tử đầu tiên trong mảng data
        const prescriptionId = response.data.data[0].tt_matthuoc;
        console.log(`Phiếu khám đã được kê toa thuốc (Mã: ${prescriptionId})`);

        // Gọi API bổ sung để lấy thêm chi tiết về toa thuốc (chẩn đoán và ngày tái khám)
        try {
          // Gọi API lấy chi tiết toa thuốc (giả định API path)
          const detailsResponse = await api.get(`/toathuoc/details/${prescriptionId}`);

          if (detailsResponse.data && detailsResponse.data.success) {
            const detailsData = detailsResponse.data.data;

            // Cập nhật các chẩn đoán từ dữ liệu trả về nếu có
            if (detailsData.benh && Array.isArray(detailsData.benh)) {
              setDiagnoses(detailsData.benh);
            }

            // Cập nhật ngày tái khám nếu có
            if (detailsData.tt_taikham) {
              // Chuyển đổi định dạng ngày về YYYY-MM-DD
              const date = new Date(detailsData.tt_taikham);
              const formattedDate = date.toISOString().split('T')[0];
              setTaiKhamDate(formattedDate);
            }
          }
        } catch (detailsError) {
          console.error("Không thể lấy thêm chi tiết toa thuốc:", detailsError);
          // Không làm gì nếu không lấy được chi tiết, vẫn giữ trạng thái đã có toa thuốc
        }

        return true;
      } else {
        // Phiếu khám chưa có toa thuốc
        setIsSavingPrescription(false);
        setSavedPrescriptions([]);
        return false;
      }
    } catch (error) {
      console.error("Error checking existing prescription:", error);
      setIsSavingPrescription(false);
      setSavedPrescriptions([]);
      return false;
    } finally {
      setIsSaving(false); // Tắt trạng thái loading
    }
  };

  // Thêm useEffect để gọi hàm checkSavingPrescription khi phiếu khám được tải
  useEffect(() => {
    if (phieuKham?.pk_ma && phieuKham?.pk_ngaykham) {
      checkSavingPrescription();
    }
  }, [phieuKham, prescriptions]);

  // Hàm kiểm tra và lấy kết quả dịch vụ
  const checkServiceResults = async (pcd_ma) => {
    try {
      const response = await api.get(`/ketqua/detailed-results/${pcd_ma}`);

      if (response.data && response.data.success) {
        // Cấu trúc dữ liệu mới có phieu_info và dich_vu
        const responseData = response.data.data;
        console.log("Kết quả dịch vụ:", responseData);
        // Kiểm tra xem có kết quả không bằng cách xem dich_vu có tồn tại và có chỉ số không
        const hasResults = responseData.phieu_info.pcd_ngay && responseData.phieu_info.pcd_gio;

        setHasServiceResults(hasResults);

        if (hasResults) {
          // Lưu lại cả đối tượng dữ liệu kết quả để sử dụng trong modal
          setServiceResults(responseData);
        }

        console.log("Kết quả dịch vụ:", responseData);
        return hasResults;
      }
      return false;
    } catch (error) {
      console.error("Lỗi khi kiểm tra kết quả dịch vụ:", error);
      return false;
    }
  };
  // Hàm kiểm tra chẩn đoán mới
  const checkForNewDiagnoses = () => {
    const newOnes = diagnoses.filter(diagnose =>
      !diseases.some(d => d.b_ten.toLowerCase() === diagnose.toLowerCase())
    );

    if (newOnes.length > 0) {
      setNewDiagnoses(newOnes);
      setIsConfirmNewDiagnoseOpen(true);
      return true;
    }
    return false;
  };

  // Thay đổi hàm confirmPrintPrescription
  const confirmPrintPrescription = async () => {
    setIsPrintPrescriptionOpen(false);

    // Kiểm tra xem có chẩn đoán mới không
    if (diagnoses.length > 0 && checkForNewDiagnoses()) {
      // Lưu tạm dữ liệu để xử lý sau khi xác nhận
      const today = new Date().toISOString().split('T')[0];
      setPendingPrescriptionData({
        pk_ma: phieuKham.pk_ma,
        pk_ngaykham: phieuKham.pk_ngaykham,
        tt_ngayke: today,
        tt_taikham: taiKhamDate,
        medicines: prescriptions.map(prescription => {
          const medication = medications.find(m => m.thuoc_ten === prescription.ten_thuoc);
          return {
            thuoc_ma: medication?.thuoc_ma,
            thuoc_ten: prescription.ten_thuoc,
            thuoc_dvt: prescription.dvt,
            cttt_soluong: prescription.so_luong,
            cttt_lieuluong: prescription.cach_dung,
            cttt_luu_y: prescription.luu_y || ''
          };
        })
      });
      return; // Dừng lại chờ xác nhận
    }

    // Nếu không có chẩn đoán mới, tiếp tục xử lý bình thường
    const today = new Date().toISOString().split('T')[0];
    const prescriptionData = {
      pk_ma: phieuKham.pk_ma,
      pk_ngaykham: phieuKham.pk_ngaykham,
      tt_ngayke: today,
      tt_taikham: taiKhamDate,
      medicines: prescriptions.map(prescription => {
        const medication = medications.find(m => m.thuoc_ten === prescription.ten_thuoc);
        return {
          thuoc_ma: medication?.thuoc_ma,
          thuoc_ten: prescription.ten_thuoc,
          thuoc_dvt: prescription.dvt,
          cttt_soluong: prescription.so_luong,
          cttt_lieuluong: prescription.cach_dung,
          cttt_luu_y: prescription.luu_y || ''
        };
      }),
      diagnoses: diagnoses.map(diagnose => {
        const matchingDiagnoses = diseases.find(d => d.b_ten.toLowerCase() === diagnose.toLowerCase());
        return {
          b_ma: matchingDiagnoses?.b_ma,
          b_ten: diagnose
        };
      })
    };
    console.log("Prescription data to send:", prescriptionData);
    // Xử lý in toa thuốc
    await processPrintPrescription(prescriptionData);
  };

  // Tách logic in toa thuốc thành một hàm riêng để tái sử dụng
  const processPrintPrescription = async (prescriptionData) => {
    setIsSaving(true);
    try {
      // Gửi dữ liệu toa thuốc đến server để lưu
      const response = await api.post(
        '/toathuoc/create',
        prescriptionData
      );

      if (response.data.message === "Tạo toa thuốc thành công") {
        // Thông tin phòng khám (có thể lấy từ biến hoặc hardcode)
        const clinicName = "Phòng khám Đa khoa CTU";
        const clinicAddress = "Khu II, Đường 3/2, Ninh Kiều, Cần Thơ";

        // Tạo nội dung in toa thuốc
        const printContent = document.createElement('div');
        printContent.innerHTML = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0;">${clinicName}</h2>
              <p style="margin: 5px 0;">${clinicAddress}</p>
              <h3 style="margin: 10px 0 0 0;">TOA THUỐC</h3>
              <p style="margin: 5px 0;">Mã phiếu khám: ${phieuKham.pk_ma}</p>
              <p style="margin: 5px 0;">Ngày khám: ${phieuKham.pk_ngaykham}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0;">THÔNG TIN BỆNH NHÂN</h3>
              <p style="margin: 5px 0;"><b>Họ và tên:</b> ${patient.bn_hoten}</p>
              <p style="margin: 5px 0;"><b>Giới tính:</b> ${patient.bn_gioitinh}</p>
              <p style="margin: 5px 0;"><b>Ngày sinh:</b> ${patient.bn_ngaysinh}</p>
              <p style="margin: 5px 0;"><b>Điện thoại:</b> ${patient.bn_sdt || "Không có"}</p>
            </div>

            ${prescriptionData.diagnoses && prescriptionData.diagnoses.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0;">CHẨN ĐOÁN</h3>
              <ul style="margin: 5px 0; padding-left: 20px;">
                ${prescriptionData.diagnoses.map(diag => `<li>${diag.b_ten}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            <div style="margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0;">THUỐC KÊ TOA</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">STT</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tên thuốc</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">ĐVT</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">SL</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Cách dùng</th>
                  </tr>
                </thead>
                <tbody>
                  ${prescriptions.map((prescription, index) => `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">${prescription.ten_thuoc}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${prescription.dvt}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${prescription.so_luong}</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">
                        <div>${prescription.cach_dung}</div>
                        ${prescription.luu_y ? `<div style="color: #e53e3e; font-size: 0.875rem; margin-top: 5px;">${prescription.luu_y}</div>` : ''}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="px-3 py-2 text-right font-medium text-dark-text">Tổng chi phí:</td>
                    <td className="px-3 py-2 text-right font-medium text-primary-300">
                      ${selectedServices.reduce((total, service) => total + (service.don_gia || 0), 0)
            .toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            ${prescriptionData.tt_taikham ? `
            <div style="margin-bottom: 20px;">
              <p style="margin: 5px 0;"><b>Lịch hẹn tái khám:</b> ${prescriptionData.tt_taikham}</p>
            </div>
            ` : ''}

            <div style="margin-top: 30px; text-align: right;">
              <p style="margin: 5px 0;">Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>
              <p style="margin: 5px 0; font-weight: bold;">BÁC SĨ KÊ TOA</p>
              <p style="margin: 40px 0 0 0; font-style: italic;">(Ký và ghi rõ họ tên)</p>
            </div>
          </div>
        `;

        // Tạo cửa sổ in mới
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
        <html>
          <head>
            <title>Toa thuốc</title>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);

        printWindow.document.close();
        printWindow.focus();

        // In sau khi nội dung đã được tải
        setTimeout(() => {
          printWindow.print();
        }, 500);

        // Reset sau khi in xong
        alert('Lưu và in toa thuốc thành công!');
        setPrescriptions([]);
        setTaiKhamDate('');
      } else {
        throw new Error(response.data.message || 'Lỗi khi lưu toa thuốc');
      }
    } catch (error) {
      console.error('Lỗi khi lưu và in toa thuốc:', error);
      alert('Có lỗi xảy ra khi lưu và in toa thuốc: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Cập nhật hàm xử lý xác nhận để tiếp tục quy trình
  const handleConfirmNewDiagnose = async () => {
    setIsConfirmNewDiagnoseOpen(false);

    // Nếu có dữ liệu đang chờ, tiếp tục xử lý
    if (pendingPrescriptionData) {
      // Thêm thông tin chẩn đoán vào dữ liệu đang chờ
      const dataToSend = {
        ...pendingPrescriptionData,
        diagnoses: diagnoses.map(diagnose => {
          const matchingDiagnoses = diseases.find(d => d.b_ten.toLowerCase() === diagnose.toLowerCase());
          return {
            b_ma: matchingDiagnoses?.b_ma,
            b_ten: diagnose
          };
        })
      };
      console.log("Data to send for prescription:", dataToSend);
      // Tiếp tục xử lý in toa thuốc với dữ liệu đã chuẩn bị
      await processPrintPrescription(dataToSend);

      // Reset pendingPrescriptionData
      setPendingPrescriptionData(null);
    }
  };
  // Kiểm tra phiếu chỉ định đã tồn tại cho phiếu khám này chưa
  useEffect(() => {
    if (phieuKham?.pk_ma) {
      setLoadingExistingServices(true);

      // API kiểm tra phiếu khám có phiếu chỉ định dịch vụ hay không
      api.get(`/phieukham/${phieuKham.pk_ma}/${phieuKham.pk_ngaykham}/pcd_ma`)
        .then((response) => {
          if (response.data.data && response.data.data.pcd_ma) {
            setHasExistingServiceOrder(true);
            fetchExistingServiceDetails(response.data.data.pcd_ma);
          } else {
            setHasExistingServiceOrder(false);
            setLoadingExistingServices(false);
          }
        })
        .catch((error) => {
          console.error("Error checking service order:", error);
          setLoadingExistingServices(false);
        });
    }
  }, [phieuKham]);

  // Loading state
  if (!phieuKham) {
    return (
      <div className="flex h-screen bg-dark-bg">
        <DoctorSidebar />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-dark-textSecondary">Đang tải thông tin phiếu khám...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-bg">
      <DoctorSidebar />
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-dark-text">Phiếu khám bệnh</h2>
              <div className="flex items-center text-sm text-dark-textSecondary mt-1">
                <span>Mã phiếu: {phieuKham?.pk_ma}</span>
                <span className="mx-2">•</span>
                <span>Ngày khám: {phieuKham?.pk_ngaykham}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-2 text-sm border border-dark-border rounded-md hover:bg-secondary-800 text-dark-text flex items-center"
              >
                <i className="fas fa-arrow-left mr-2"></i> Quay lại
              </button>
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${isCompleting ? 'bg-secondary-800' : 'bg-green-600 hover:bg-green-700'
                  } flex items-center`}
              >
                {isCompleting ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i> Đang xử lý</>
                ) : (
                  <><i className="fas fa-check-circle mr-2"></i> Hoàn thành</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Card */}
            <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border overflow-hidden">
              <div className="bg-primary px-4 py-3">
                <h3 className="text-white font-medium flex items-center">
                  <i className="fas fa-user-circle mr-2"></i>
                  Thông tin bệnh nhân
                </h3>
              </div>
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary-900 flex items-center justify-center text-primary-300">
                    <i className="fas fa-user-injured text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-lg text-dark-text">{patient.bn_hoten || "Chưa có thông tin"}</h4>
                    <p className="text-sm text-dark-textSecondary">
                      {patient.bn_gioitinh} • {patient.bn_ngaysinh}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-1/3 font-medium text-dark-textSecondary">Mã BN:</span>
                    <span className="text-dark-text">{phieuHen?.bn_ma}</span>
                  </div>
                  <div className="flex">
                    <span className="w-1/3 font-medium text-dark-textSecondary">Số điện thoại:</span>
                    <span className="text-dark-text">{patient.bn_sdt || "Không có"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vital Signs Card */}
            <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border">
              <div className="px-4 py-3 border-b border-dark-border flex justify-between items-center">
                <h3 className="font-medium flex items-center text-dark-text">
                  <i className="fas fa-heartbeat text-red-500 mr-2"></i>
                  Sinh hiệu
                </h3>
                <button
                  className="text-primary-300 hover:text-primary-400 text-sm"
                  onClick={() => toggleSection("vitalSigns")}
                >
                  {openSections.vitalSigns ? "Thu gọn" : "Mở rộng"}
                </button>
              </div>
              <div className={`transition-all duration-300 ${openSections.vitalSigns ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                <div className="p-4 space-y-4">
                  {/* Row 1: Nhiệt độ và Huyết áp */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">
                        <i className="fas fa-thermometer-half text-orange-400 mr-2"></i>
                        Nhiệt độ (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="35"
                        max="45"
                        className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="36.5"
                        value={vitalSigns.pk_nhietdo}
                        onChange={(e) => handleVitalSignsChange('pk_nhietdo', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">
                        <i className="fas fa-heart text-red-400 mr-2"></i>
                        Huyết áp (mmHg)
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          min="50"
                          max="250"
                          className="w-1/2 px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="120"
                          value={vitalSigns.pk_huyetap_tamthu}
                          onChange={(e) => handleVitalSignsChange('pk_huyetap_tamthu', e.target.value)}
                        />
                        <span className="text-dark-text flex items-center">/</span>
                        <input
                          type="number"
                          min="30"
                          max="150"
                          className="w-1/2 px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="80"
                          value={vitalSigns.pk_huyetap_tamtruong}
                          onChange={(e) => handleVitalSignsChange('pk_huyetap_tamtruong', e.target.value)}
                        />
                      </div>
                      {vitalSigns.pk_huyetap_tamthu && vitalSigns.pk_huyetap_tamtruong && (
                        <p className="text-xs text-dark-textSecondary mt-1">
                          {vitalSigns.pk_huyetap_tamthu}/{vitalSigns.pk_huyetap_tamtruong} mmHg
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Nhịp tim và Nhịp thở */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">
                        <i className="fas fa-heartbeat text-pink-400 mr-2"></i>
                        Nhịp tim (lần/phút)
                      </label>
                      <input
                        type="number"
                        min="40"
                        max="200"
                        className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="72"
                        value={vitalSigns.pk_nhiptim}
                        onChange={(e) => handleVitalSignsChange('pk_nhiptim', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">
                        <i className="fas fa-lungs text-blue-400 mr-2"></i>
                        Nhịp thở (lần/phút)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="40"
                        className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="18"
                        value={vitalSigns.pk_nhiptho}
                        onChange={(e) => handleVitalSignsChange('pk_nhiptho', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row 3: Cân nặng, Chiều cao và BMI */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">
                        <i className="fas fa-weight text-purple-400 mr-2"></i>
                        Cân nặng (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="10"
                        max="300"
                        className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="65.5"
                        value={vitalSigns.pk_cannang}
                        onChange={(e) => handleVitalSignsChange('pk_cannang', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">
                        <i className="fas fa-ruler-vertical text-green-400 mr-2"></i>
                        Chiều cao (cm)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="250"
                        className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="170"
                        value={vitalSigns.pk_chieucao}
                        onChange={(e) => handleVitalSignsChange('pk_chieucao', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">
                        <i className="fas fa-calculator text-yellow-400 mr-2"></i>
                        BMI
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-700 text-dark-text cursor-not-allowed"
                          placeholder="Tự động tính"
                          value={vitalSigns.chi_so_bmi}
                          readOnly
                        />
                        {vitalSigns.chi_so_bmi && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className={`text-xs px-2 py-1 rounded ${vitalSigns.chi_so_bmi < 18.5 ? 'bg-blue-900 text-blue-300' :
                              vitalSigns.chi_so_bmi < 25 ? 'bg-green-900 text-green-300' :
                                vitalSigns.chi_so_bmi < 30 ? 'bg-yellow-900 text-yellow-300' :
                                  'bg-red-900 text-red-300'
                              }`}>
                              {vitalSigns.chi_so_bmi < 18.5 ? 'Thiếu cân' :
                                vitalSigns.chi_so_bmi < 25 ? 'Bình thường' :
                                  vitalSigns.chi_so_bmi < 30 ? 'Thừa cân' : 'Béo phì'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ghi chú sinh hiệu */}
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      <i className="fas fa-sticky-note text-gray-400 mr-2"></i>
                      Ghi chú
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                      placeholder="Ghi chú về sinh hiệu hoặc tình trạng sức khỏe..."
                      value={vitalSigns.ghi_chu}
                      onChange={(e) => handleVitalSignsChange('ghi_chu', e.target.value)}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-between items-center pt-3 border-t border-dark-border">
                    <div className="text-xs text-dark-textSecondary">
                      <i className="fas fa-info-circle mr-1"></i>
                      Các chỉ số sinh hiệu sẽ được lưu vào phiếu khám
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setVitalSigns({
                            pk_nhietdo: '',
                            pk_huyetap_tamthu: '',
                            pk_huyetap_tamtruong: '',
                            pk_nhiptim: '',
                            pk_nhiptho: '',
                            pk_cannang: '',
                            pk_chieucao: '',
                            chi_so_bmi: '',
                            ghi_chu: ''
                          });
                        }}
                        className="px-3 py-1 text-sm border border-dark-border rounded-md hover:bg-secondary-800 text-dark-text"
                      >
                        <i className="fas fa-redo mr-1"></i>
                        Đặt lại
                      </button>
                      <button
                        onClick={handleSaveVitalSigns}
                        disabled={isSaving || !Object.values(vitalSigns).some(v => v)}
                        className={`px-4 py-1 text-sm rounded-md text-white ${isSaving || !Object.values(vitalSigns).some(v => v)
                          ? 'bg-secondary-800 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary-600'
                          }`}
                      >
                        {isSaving ? (
                          <><i className="fas fa-spinner fa-spin mr-1"></i> Đang lưu...</>
                        ) : (
                          <><i className="fas fa-save mr-1"></i> Lưu sinh hiệu</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick reference */}
                  <div className="bg-secondary-900 rounded-lg p-3 mt-4">
                    <h4 className="text-sm font-medium text-dark-text mb-2">
                      <i className="fas fa-info-circle text-blue-400 mr-2"></i>
                      Tham khảo chỉ số bình thường
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs text-dark-textSecondary">
                      <div>
                        <p><span className="font-medium">Nhiệt độ:</span> 36.1 - 37.2°C</p>
                        <p><span className="font-medium">Huyết áp:</span> 90/60 - 120/80 mmHg</p>
                        <p><span className="font-medium">Nhịp tim:</span> 60 - 100 lần/phút</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Nhịp thở:</span> 12 - 20 lần/phút</p>
                        <p><span className="font-medium">BMI bình thường:</span> 18.5 - 24.9</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Symptoms Card */}
            <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border">
              <div className="px-4 py-3 border-b border-dark-border flex justify-between items-center">
                <h3 className="font-medium flex items-center text-dark-text">
                  <i className="fas fa-clipboard-list text-orange-500 mr-2"></i>
                  Triệu chứng
                </h3>
                <button
                  className="text-primary-300 hover:text-primary-400 text-sm"
                  onClick={() => {
                    if (!editingSymptoms) {
                      // Khi bắt đầu chỉnh sửa, khởi tạo symptomInputs từ symptoms hiện tại
                      setSymptomInputs(symptoms.length > 0 ? [...symptoms] : ['']);
                    }
                    setEditingSymptoms(!editingSymptoms);
                    setOpenSections(prev => ({ ...prev, symptoms: true }));
                  }}
                >
                  {editingSymptoms ? "Lưu" : "Chỉnh sửa"}
                </button>
              </div>
              <div className={`transition-all duration-300 ${openSections.symptoms ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                <div className="p-4">
                  {editingSymptoms ? (
                    <div className="space-y-2">
                      {symptomInputs.map((symptom, idx) => (
                        <div key={idx} className="relative flex items-center gap-2">
                          <div className="w-full">
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text w-full"
                              value={symptom}
                              placeholder="Nhập triệu chứng..."
                              onChange={e => {
                                const newInputs = [...symptomInputs];
                                newInputs[idx] = e.target.value;
                                setSymptomInputs(newInputs);
                              }}
                              onFocus={() => setOpenSections(prev => ({ ...prev, [`symptomSuggest${idx}`]: true }))}
                              onBlur={() => setTimeout(() => setOpenSections(prev => ({ ...prev, [`symptomSuggest${idx}`]: false })), 200)}
                              autoComplete="off"
                            />
                            {/* Gợi ý triệu chứng */}
                            {openSections[`symptomSuggest${idx}`] && symptomList.length > 0 && (
                              <div className="absolute z-10 mt-1 w-full bg-secondary-900 border border-dark-border rounded-md shadow-lg max-h-40 overflow-auto">
                                {symptomList
                                  .filter(item =>
                                    item.tc_ten.toLowerCase().includes((symptom || '').toLowerCase()) &&
                                    !symptomInputs.some((s, i) => s === item.tc_ten && i !== idx)
                                  )
                                  .slice(0, 10)
                                  .map(item => (
                                    <div
                                      key={item.tc_ma}
                                      className="px-3 py-2 cursor-pointer hover:bg-primary-900 hover:text-primary-300 text-dark-text transition-colors duration-150 border-b border-dark-border last:border-b-0"
                                      onMouseDown={() => {
                                        const newInputs = [...symptomInputs];
                                        newInputs[idx] = item.tc_ten;
                                        setSymptomInputs(newInputs);
                                        setOpenSections(prev => ({ ...prev, [`symptomSuggest${idx}`]: false }));
                                      }}
                                    >
                                      {item.tc_ten}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => setSymptomInputs(symptomInputs.filter((_, i) => i !== idx))}
                            title="Xóa triệu chứng"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="mt-2 text-primary-300 hover:text-primary-400 flex items-center text-sm"
                        onClick={() => setSymptomInputs([...symptomInputs, ""])}
                      >
                        <i className="fas fa-plus mr-1"></i> Thêm triệu chứng
                      </button>
                    </div>
                  ) : (
                    symptoms.length === 0 ? (
                      <p className="text-dark-textSecondary italic">Không có triệu chứng được ghi nhận</p>
                    ) : (
                      <div className="space-y-2">
                        {symptoms.map((symptom, index) => (
                          <div key={index} className="flex items-center">
                            <i className="fas fa-circle text-xs text-primary-300 mr-2"></i>
                            <span className="text-dark-text">{symptom}</span>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Diagnosis Card */}
            <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border">
              <div className="px-4 py-3 border-b border-dark-border">
                <h3 className="font-medium flex items-center text-dark-text">
                  <i className="fas fa-stethoscope text-purple-500 mr-2"></i>
                  Chẩn đoán
                </h3>
                {/* Add this button in your diagnosis card section */}
                <button
                  type="button"
                  onClick={() => setIsDiagnosisModalOpen(true)}
                  className="mt-3 px-3 py-2 text-sm bg-secondary-800 hover:bg-secondary-700 text-dark-text rounded-md flex items-center"
                >
                  <i className="fas fa-search-plus mr-1.5"></i>
                  Gợi ý chẩn đoán
                </button>
              </div>
              <div className="p-4">
                {/* Danh sách các chẩn đoán đã nhập */}
                {diagnoses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {diagnoses.map((diagnosis, index) => (
                      <div key={index} className="bg-secondary-900 text-dark-text px-3 py-1 rounded-md flex items-center border border-dark-border">
                        <span>{diagnosis}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDiagnosis(index)}
                          className="ml-2 text-dark-textSecondary hover:text-red-400"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input để nhập chẩn đoán mới - UI đẹp hơn */}
                <div className="relative">
                  <div className="flex items-center bg-secondary-900 rounded-lg p-1.5 border border-dark-border hover:border-primary-400 transition-all duration-300 shadow-sm">
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-textSecondary">
                        <i className="fas fa-search text-sm"></i>
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border-0 bg-secondary-800 text-dark-text rounded-md focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-300"
                        placeholder="Nhập chẩn đoán..."
                        value={currentDiagnosis}
                        onChange={handleDiagnosisChange}
                        onKeyPress={handleKeyPress}
                        onFocus={() => diagnosisSuggestions.length > 0 && setShowSuggestions(true)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDiagnosis}
                      disabled={!currentDiagnosis.trim()}
                      className={`ml-2 px-4 py-2.5 rounded-md transition-all duration-300 flex items-center ${!currentDiagnosis.trim() ? 'bg-secondary-800 cursor-not-allowed' : 'bg-primary hover:bg-primary-600'}`}
                    >
                      <i className="fas fa-plus-circle mr-1.5"></i>
                      <span className="font-medium">Thêm</span>
                    </button>

                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions && (
                    <div className="absolute z-10 mt-2 w-full bg-secondary-900 border border-dark-border rounded-md shadow-lg max-h-60 overflow-auto animate-fadeIn">
                      {diagnosisSuggestions.length === 0 ? (
                        <div className="px-3 py-2 text-dark-textSecondary italic">Không có gợi ý phù hợp</div>
                      ) : (
                        diagnosisSuggestions.map((suggestion, idx) => (
                          <div
                            key={suggestion.b_ma || idx}
                            className="px-3 py-2 cursor-pointer hover:bg-primary-900 hover:text-primary-300 text-dark-text transition-colors duration-150 border-b border-dark-border last:border-b-0"
                            onMouseDown={() => handleSelectSuggestion(suggestion)}
                          >
                            {suggestion.b_ten}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>



                {/* Quick suggestions - Đã nâng cấp */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="w-full mb-1">
                    <span className="text-xs text-dark-textSecondary">Gợi ý nhanh:</span>
                  </div>
                  {quickDiagnosisSuggestions.length > 0 ? (
                    quickDiagnosisSuggestions.map((disease) => (
                      <button
                        key={disease.b_ma}
                        type="button"
                        onClick={() => handleSelectSuggestion(disease)}
                        disabled={diagnoses.some(d => d.toLowerCase() === disease.b_ten.toLowerCase())}
                        className={`text-xs px-3 py-1.5 border transition-all duration-200 rounded-full ${diagnoses.some(d => d.toLowerCase() === disease.b_ten.toLowerCase())
                          ? 'bg-secondary-700 text-dark-textSecondary cursor-not-allowed border-dark-border opacity-50'
                          : 'bg-secondary-800 hover:bg-primary-900 hover:border-primary-700 hover:text-primary-300 text-dark-text border-secondary-700'
                          }`}
                      >
                        {disease.b_ten}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-dark-textSecondary italic">Không có gợi ý</span>
                  )}
                </div>
              </div>
            </div>

            {/* Follow-up Date Card */}
            <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border">
              <div className="px-4 py-3 border-b border-dark-border">
                <h3 className="font-medium flex items-center text-dark-text">
                  <i className="fas fa-calendar-alt text-green-500 mr-2"></i>
                  Lịch tá khám
                </h3>
              </div>
              <div className="p-4">
                <div className="flex items-end gap-4">
                  <div className="flex-grow">
                    <input
                      type="date"
                      className="w-full p-2 border border-dark-border rounded-md bg-secondary-800 text-dark-text focus:ring-2 focus:ring-primary focus:border-primary"
                      value={taiKhamDate}
                      onChange={(e) => setTaiKhamDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <button
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    onClick={() => setTaiKhamDate('')}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Medical Services Card */}
            <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border">
              <div className="px-4 py-3 border-b border-dark-border flex justify-between items-center">
                <h3 className="font-medium flex items-center text-dark-text">
                  <i className="fas fa-procedures text-primary-300 mr-2"></i>
                  Dịch vụ y tế
                </h3>
                {!hasExistingServiceOrder && (
                  <button
                    onClick={handleAddService}
                    className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-600 flex items-center text-sm"
                  >
                    <i className="fas fa-plus mr-1"></i> Thêm dịch vụ
                  </button>
                )}
              </div>
              <div className="p-4">
                {loadingExistingServices ? (
                  // Loading state
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mb-2"></div>
                    <p className="text-dark-textSecondary">Đang tải thông tin dịch vụ...</p>
                  </div>
                ) : hasExistingServiceOrder ? (
                  // Existing services view (read-only)
                  <>
                    <div className="bg-primary-900 border border-primary-700 rounded-md p-3 mb-4">
                      <div className="flex items-center">
                        <i className="fas fa-info-circle text-primary-300 mr-2"></i>
                        <span className="text-primary-300 font-medium">Phiếu chỉ định dịch vụ đã tồn tại</span>
                      </div>
                    </div>
                    {existingServices.length === 0 ? (
                      <div className="text-center py-4 text-dark-textSecondary">
                        Không có dữ liệu dịch vụ
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-dark-border">
                          <thead className="bg-secondary-800">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">STT</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Tên dịch vụ</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Ghi chú</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Đơn giá</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-dark-border">
                            {existingServices.map((service, index) => (
                              <tr key={index} className="hover:bg-secondary-900">
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-dark-text">{index + 1}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-dark-text">{service.dvyt_ten}</td>
                                <td className="px-3 py-2 text-sm text-dark-textSecondary">{service.ghi_chu || "-"}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-dark-textSecondary">
                                  {service.don_gia?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || 'N/A'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs ${service.trang_thai === 'completed'
                                    ? 'bg-green-900 text-green-300'
                                    : service.trang_thai === 'in_progress'
                                      ? 'bg-primary-900 text-primary-300'
                                      : 'bg-yellow-900 text-yellow-300'
                                    }`}>
                                    {service.trang_thai === 'completed'
                                      ? 'Đã hoàn thành'
                                      : service.trang_thai === 'in_progress'
                                        ? 'Đang thực hiện'
                                        : 'Chờ thực hiện'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="3" className="px-3 py-2 text-right font-medium text-dark-text">Tổng chi phí:</td>
                              <td className="px-3 py-2 text-right font-medium text-primary-300">
                                {existingServices.reduce((total, service) => total + (service.don_gia || 0), 0)
                                  .toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  // New services view (editable)
                  <>
                    {selectedServices.length === 0 ? (
                      <div className="text-center py-6 text-dark-textSecondary">
                        <i className="fas fa-info-circle text-xl mb-2"></i>
                        <p>Chưa có dịch vụ nào được chọn</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-dark-border">
                          <thead className="bg-secondary-800">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">STT</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Tên dịch vụ</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Ghi chú</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Đơn giá</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-dark-border">
                            {selectedServices.map((service, index) => (
                              <tr key={index} className="hover:bg-secondary-900">
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-dark-text">{index + 1}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-dark-text">{service.dvyt_ten}</td>
                                <td className="px-3 py-2 text-sm text-dark-textSecondary">{service.ghi_chu || "-"}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-dark-textSecondary">
                                  {service.don_gia?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || 'N/A'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                                  <button onClick={() => handleEditService(service, index)} className="text-primary-300 hover:text-primary-400 mx-1">
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button onClick={() => handleDeleteService(index)} className="text-red-400 hover:text-red-300 mx-1">
                                    <i className="fas fa-trash-alt"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="3" className="px-3 py-2 text-right font-medium text-dark-text">Tổng chi phí:</td>
                              <td className="px-3 py-2 text-right font-medium text-primary-300">
                                {selectedServices.reduce((total, service) => total + (service.don_gia || 0), 0)
                                  .toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </>
                )}
                <div className="mt-4 flex justify-end">
                  {hasExistingServiceOrder ? (
                    // Chỉ hiển thị nút xem kết quả hoặc đang chờ thực hiện
                    hasServiceResults ? (
                      <button
                        onClick={handleViewResults}
                        className="px-4 py-2 rounded text-white flex items-center bg-green-600 hover:bg-green-700"
                      >
                        <i className="fas fa-eye mr-2"></i> Xem kết quả
                      </button>
                    ) : (
                      <button
                        disabled={true}
                        className="px-4 py-2 rounded textwhite flex items-center bg-secondary-800 cursor-not-allowed"
                      >
                        <i className="fas fa-clock mr-2"></i> Đang chờ thực hiện
                      </button>
                    )
                  ) : (
                    // Nút in phiếu chỉ định mới
                    <button
                      onClick={hasServiceResults ? undefined : handlePrintServiceClick}
                      disabled={selectedServices.length === 0 || hasServiceResults}
                      className={`px-4 py-2 rounded text-white flex items-center ${selectedServices.length === 0 || hasServiceResults
                        ? 'bg-secondary-800 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-600'
                        }`}
                    >
                      {hasServiceResults ? (
                        <><i className="fas fa-spinner fa-spin mr-2"></i> Đang thực hiện...</>
                      ) : (
                        <><i className="fas fa-print mr-2"></i> In chỉ định dịch vụ</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Prescriptions Card */}
            <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border">
              <div className="px-4 py-3 border-b border-dark-border flex justify-between items-center">
                <h3 className="font-medium flex items-center text-dark-text">
                  <i className="fas fa-pills text-green-500 mr-2"></i>
                  Kê toa thuốc
                </h3>
                {!isSavingPrescription && (
                  <button
                    onClick={handleAddPrescription}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
                  >
                    <i className="fas fa-plus mr-1"></i> Thêm thuốc
                  </button>
                )}
              </div>
              <div className="p-4">
                {/* Hiển thị khi đã có toa thuốc */}
                {isSavingPrescription ? (
                  <div className="bg-green-900 border border-green-700 rounded-md p-3">
                    <div className="flex items-center">
                      <i className="fas fa-check-circle text-green-400 mr-2"></i>
                      <span className="text-green-400 font-medium">Đã kê toa thuốc cho bệnh nhân này</span>
                    </div>
                    <div className="mt-2 text-sm text-green-300">
                      {diagnoses.length > 0 && (
                        <div className="mt-1">
                          <p><span className="font-medium">Chẩn đoán:</span> {diagnoses.join(', ')}</p>
                        </div>
                      )}
                      {taiKhamDate && (
                        <p className="mt-1">
                          <span className="font-medium">Tái khám:</span> {new Date(taiKhamDate).toLocaleDateString('vi-VN')}
                        </p>
                      )}

                      {/* Add this section to display prescription details */}
                      {savedPrescriptions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-700">
                          <p className="font-medium mb-2">Chi tiết toa thuốc:</p>
                          <table className="w-full text-sm">
                            <thead className="text-xs opacity-75">
                              <tr>
                                <th className="text-left pb-1">Tên thuốc</th>
                                <th className="text-center pb-1">SL</th>
                                <th className="text-left pb-1">Cách dùng</th>
                              </tr>
                            </thead>
                            <tbody>
                              {savedPrescriptions.map((med, idx) => (
                                <tr key={idx} className="border-t border-green-700">
                                  <td className="py-1">
                                    {med.thuoc_info?.thuoc_ten || `Thuốc #${med.thuoc_ma}`}
                                  </td>
                                  <td className="py-1 text-center">{med.cttt_soluong}</td>
                                  <td className="py-1">{med.cttt_lieuluong}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // UI hiện tại để kê toa thuốc
                  <>
                    {prescriptions.length === 0 ? (
                      <div className="text-center py-6 text-dark-textSecondary">
                        <i className="fas fa-pills text-xl mb-2 opacity-50"></i>
                        <p>Chưa có thuốc nào được kê</p>
                        <p className="text-xs mt-1">Nhấn "Thêm thuốc" để bắt đầu kê toa</p>
                      </div>
                    ) : (
                      // Bảng hiển thị thuốc đã kê
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-dark-border">
                          <thead className="bg-secondary-800">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">STT</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Tên thuốc</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-dark-textSecondary uppercase tracking-wider">ĐVT</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-dark-textSecondary uppercase tracking-wider">SL</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Cách dùng</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-dark-border">
                            {prescriptions.map((prescription, index) => (
                              <tr key={index} className="hover:bg-secondary-900">
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-dark-text">{index + 1}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-dark-text">{prescription.ten_thuoc}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-dark-textSecondary">{prescription.dvt}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-dark-textSecondary">{prescription.so_luong}</td>
                                <td className="px-3 py-2 text-sm">
                                  <div className="text-dark-textSecondary">{prescription.cach_dung}</div>
                                  {prescription.luu_y && (
                                    <div className="text-xs text-red-400 mt-1">{prescription.luu_y}</div>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                                  <button onClick={() => handleEditPrescription(prescription, index)} className="text-primary-300 hover:text-primary-400 mx-1">
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button onClick={() => handleDeletePrescription(index)} className="text-red-400 hover:text-red-300 mx-1">
                                    <i className="fas fa-trash-alt"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handlePrintPrescriptionClick}
                        disabled={isSaving || prescriptions.length === 0}
                        className={`px-4 py-2 rounded text-white flex items-center ${isSaving || prescriptions.length === 0
                          ? 'bg-secondary-800 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                          }`}
                      >
                        {isSaving ?
                          <><i className="fas fa-spinner fa-spin mr-2"></i> Đang xử lý...</> :
                          <><i className="fas fa-print mr-2"></i> Lưu & In toa thuốc</>
                        }
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {isAddingService && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-md transform transition-all">
            <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {selectedService.editIndex !== undefined ? 'Sửa dịch vụ' : 'Thêm dịch vụ y tế'}
              </h3>
              <button onClick={() => setIsAddingService(false)} className="text-white hover:text-gray-200">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">
                  Chọn dịch vụ <span className="text-red-400">*</span>
                </label>
                <select
                  className="w-full rounded-md border-dark-border bg-secondary-800 text-dark-text shadow-sm focus:border-primary focus:ring-primary"
                  onChange={handleServiceChange}
                  value={selectedService.dvyt_ma}
                >
                  <option value="">-- Chọn dịch vụ --</option>
                  {services.map(service => (
                    <option key={service.dvyt_ma} value={service.dvyt_ma}>
                      {service.dvyt_ten} - {service.dongia.gia.toLocaleString('vi-VN')}đ
                    </option>
                  ))}
                </select>
                {selectedService.dvyt_ma && (
                  <p className="mt-1 text-sm">
                    <span className="font-medium text-primary-300">
                      {selectedService.don_gia.toLocaleString('vi-VN')}đ
                    </span>
                  </p>
                )}
              </div>
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-dark-text mb-1">Ghi chú</label>
                <textarea
                  className="w-full rounded-md border-dark-border bg-secondary-800 text-dark-text shadow-sm focus:border-primary focus:ring-primary"
                  rows="3"
                  value={selectedService.ghi_chu}
                  onChange={e => setSelectedService({ ...selectedService, ghi_chu: e.target.value })}
                  placeholder="Nhập ghi chú cho dịch vụ..."
                ></textarea>
              </div>
            </div>
            <div className="px-6 py-4 bg-secondary-800 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setIsAddingService(false)}
                className="px-4 py-2 text-sm font-medium text-dark-text bg-secondary-700 border border-dark-border rounded-md hover:bg-secondary-600"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveService}
                disabled={!selectedService.dvyt_ma}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${!selectedService.dvyt_ma ? 'bg-secondary-800' : 'bg-primary hover:bg-primary-600'}`}
              >
                {selectedService.editIndex !== undefined ? 'Cập nhật' : 'Thêm dịch vụ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Prescription Modal - This component needs to be updated separately to dark mode */}
      {isAddingPrescription && (
        <AddPrescriptionModal
          isOpen={isAddingPrescription}
          onClose={() => setIsAddingPrescription(false)}
          onSave={handleSavePrescription}
          selectedPrescription={selectedPrescription}
          setSelectedPrescription={setSelectedPrescription}
          medications={medications}
        />
      )}
      {/* modal xác nhận lưu và in toa thuốc */}
      <ConfirmationDialogModal
        isOpen={isPrintPrescriptionOpen}
        onClose={() => setIsPrintPrescriptionOpen(false)}
        onConfirm={confirmPrintPrescription}
        title="Xác nhận lưu và in toa thuốc"
        message={
          <div>
            <p className="text-dark-text">Hệ thống sẽ lưu toa thuốc và in bản cứng cho bệnh nhân:</p>
            <div className="mt-2 p-3 bg-primary-900 bg-opacity-20 rounded-md border border-primary-700">
              <p className="font-medium text-dark-text">{patient.bn_hoten}</p>
              <p className="text-sm text-dark-textSecondary">Mã BN: {phieuHen?.bn_ma}</p>
              <p className="text-sm text-dark-textSecondary">Số loại thuốc: {prescriptions.length}</p>
              {taiKhamDate && (
                <p className="text-sm text-dark-textSecondary">
                  <i className="fas fa-calendar-check mr-1"></i> Tái khám: {taiKhamDate}
                </p>
              )}
              <div className="mt-2 max-h-32 overflow-y-auto">
                {prescriptions.map((prescription, index) => (
                  <div key={index} className="text-xs text-dark-textSecondary flex justify-between border-t border-primary-700 pt-1 mt-1">
                    <span>{prescription.ten_thuoc} ({prescription.so_luong} {prescription.dvt})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
        confirmButtonText="Lưu và in toa thuốc"
        cancelButtonText="Hủy"
        icon="pills"
        iconColor="text-green-400"
        confirmButtonColor="bg-green-600 hover:bg-green-700"

      />

      {/* Confirmation Dialog Modal - modal xác nhận lưu và in chỉ định dịch vụ - This component should be updated to dark mode elsewhere */}
      <ConfirmationDialogModal
        isOpen={isPrintConfirmOpen}
        onClose={() => setIsPrintConfirmOpen(false)}
        onConfirm={confirmPrintServices}
        title="Xác nhận tạo và in phiếu chỉ định dịch vụ"
        message={
          <div>
            <p className="text-dark-text">Hệ thống sẽ tạo phiếu chỉ định dịch vụ mới và in phiếu này cho bệnh nhân:</p>
            <div className="mt-2 p-3 bg-primary-900 bg-opacity-20 rounded-md">
              <p className="font-medium text-dark-text">{patient.bn_hoten}</p>
              <p className="text-sm text-dark-textSecondary">Mã BN: {phieuHen?.bn_ma}</p>
              <p className="text-sm text-dark-textSecondary">Số dịch vụ: {selectedServices.length}</p>
              <div className="mt-2 text-xs text-dark-textSecondary">
                <span className="font-medium">Dịch vụ:</span> {selectedServices.map(s => s.dvyt_ten).join(', ')}
              </div>
              <p className="text-sm font-medium text-primary-300 text-right mt-1">
                Tổng chi phí: {selectedServices.reduce((total, service) => total + (service.don_gia || 0), 0)
                  .toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        }


        confirmButtonText="Tạo và in phiếu"
        cancelButtonText="Hủy"
        icon="print"
        iconColor="text-primary-300"
        confirmButtonColor="bg-primary hover:bg-primary-600"
      />

      {/* View Results Modal */}
      <ViewResultsModal
        isOpen={isViewResultsModalOpen}
        onClose={() => setIsViewResultsModalOpen(false)}
        pcd_ma={selectedPcdMa}
        patientInfo={patient}
      />

      {/* Modal xác nhận bệnh chưa có trong CSDL */}
      <ConfirmationDialogModal
        isOpen={isConfirmNewDiagnoseOpen}
        onClose={() => setIsConfirmNewDiagnoseOpen(false)}
        onConfirm={handleConfirmNewDiagnose}
        title="Phát hiện chẩn đoán mới"
        message={
          <div>
            <p className="text-dark-text mb-2">Hệ thống phát hiện một số chẩn đoán không có trong cơ sở dữ liệu:</p>
            <div className="mt-3 p-3 bg-secondary-900 rounded-md border border-dark-border">
              <ul className="list-disc list-inside space-y-1">
                {newDiagnoses.map((diagnose, index) => (
                  <li key={index} className="text-dark-text">
                    <span className="font-medium">{diagnose}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-dark-textSecondary mt-3">
              Bạn có muốn thêm các chẩn đoán này vào cơ sở dữ liệu không? Các chẩn đoán sẽ được gửi để quản trị viên xem xét.
            </p>
          </div>
        }
        confirmButtonText="Thêm vào CSDL"
        cancelButtonText="Bỏ qua"
        icon="plus-circle"
        iconColor="text-blue-400"
        confirmButtonColor="bg-blue-600 hover:bg-blue-700"
      />

      {/* Diagnosis Suggestion Modal - New modal for suggesting diagnoses */}
      <DiagnosisSuggestionModal
        isOpen={isDiagnosisModalOpen}
        onClose={() => setIsDiagnosisModalOpen(false)}
        onSelectDiagnosis={(diagnosis) => {
          // Add the selected diagnosis to your diagnoses state
          if (diagnosis && !diagnoses.includes(diagnosis.b_ten)) {
            setDiagnoses([...diagnoses, diagnosis.b_ten]);
          }
        }}
        currentDiagnoses={diagnoses.map(d => {
          const matchingDiagnosis = diseases.find(disease => disease.b_ten === d);
          return matchingDiagnosis ? { b_ma: matchingDiagnosis.b_ma, b_ten: d } : { b_ten: d };
        })}
        patientInfo={patient} // Thêm thông tin bệnh nhân
        vitalSigns={vitalSigns} // Thêm thông tin sinh hiệu
      />
    </div>
  );
};

export default Examination;
