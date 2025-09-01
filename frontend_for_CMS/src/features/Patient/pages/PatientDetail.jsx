import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../service/apiService';
import DoctorSidebar from "../../../layouts/DoctorSidebar";
import Sidebar from "../../../layouts/Sidebar";
import PatientSidebar from '../../../layouts/PatientSidebar';
import { jwtDecode } from "jwt-decode";
import { useReactToPrint } from 'react-to-print';

// Import các components mới
import PatientInfo from '../components/PatientInfo';
import MedicalRecords from '../components/MedicalRecords';

const PatientDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('info');
  const [patientData, setPatientData] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const decoded = jwtDecode(token);
      setRole(decoded.role);
      console.log("Vai trò người dùng:", role);
    }
    const fetchPatientData = async () => {
      try {
        const response = await api.get(`/benhnhan/getbyid/${id}`);
        setPatientData(response.data.data);
      } catch (error) {
        console.error("Error fetching patient details:", error);
      }
    };

    fetchPatientData();
  }, [id]);

  const fetchMedicalRecords = async () => {
    try {
      const response = await api.get(`/phieukham/benhnhan/${id}`);
      setMedicalRecords(response.data.data);
    } catch (error) {
      console.error("Error fetching medical records:", error);
    }
  };

  const renderSidebar = () => {
    if (role === "bacsi") return <DoctorSidebar />;
    if (role === "tieptan") return <Sidebar />;
    if (role === "benhnhan") return <PatientSidebar />;
    return null;
  };

  useEffect(() => {
    if (activeTab === 'medical') {
      fetchMedicalRecords();
    }
  }, [activeTab, id]);

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return <PatientInfo patientData={patientData} />;
      case 'medical':
        return <MedicalRecords medicalRecords={medicalRecords} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      {renderSidebar()}
      <div className="flex-1 p-6 overflow-auto">
        <div className="container mx-auto">
          {/* Navigation Tabs with Dark Mode */}
          <nav className="flex bg-dark-card shadow-lg rounded-lg mb-6 border border-dark-border">
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors duration-200 rounded-l-lg ${activeTab === 'info'
                  ? 'text-primary-300 border-b-2 border-primary bg-primary-900 bg-opacity-20'
                  : 'text-dark-textSecondary hover:text-dark-text hover:bg-secondary-800'
                }`}
              onClick={() => setActiveTab('info')}
            >
              <i className="fas fa-user mr-2"></i>
              Thông tin bệnh nhân
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors duration-200 rounded-r-lg ${activeTab === 'medical'
                  ? 'text-primary-300 border-b-2 border-primary bg-primary-900 bg-opacity-20'
                  : 'text-dark-textSecondary hover:text-dark-text hover:bg-secondary-800'
                }`}
              onClick={() => setActiveTab('medical')}
            >
              <i className="fas fa-file-medical mr-2"></i>
              Lịch sử khám bệnh
            </button>
          </nav>

          {/* Content Container with Dark Mode */}
          <div className="bg-dark-card rounded-lg shadow-lg border border-dark-border">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;