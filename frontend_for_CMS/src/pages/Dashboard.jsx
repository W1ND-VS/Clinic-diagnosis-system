// src/pages/Dashboard.jsx
import React from "react";
import DoctorSidebar from "../layouts/DoctorSidebar";
import Sidebar from "../layouts/Sidebar";
import AdminSidebar from "../layouts/AdminSidebar";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import Laboratory from "../features/Laboratory/pages/Laboratory"; 
import LaboratorySidebar from "../layouts/LaboratorySidebar";
import PatientSidebar from "../layouts/PatientSidebar";

const Dashboard = () => {
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const decoded = jwtDecode(token);
      setRole(decoded.role);
    }
  }, []);

  const renderSidebar = () => {
    if (role === "admin") return <AdminSidebar />;
    if (role === "bacsi") return <DoctorSidebar />;
    if (role === "tieptan") return <Sidebar />;
    if (role === "bacsi_ck13") return <LaboratorySidebar />;
    if (role === "benhnhan") return <PatientSidebar />;
    return null;
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      {renderSidebar()}
      <div className="flex-1 p-6 overflow-auto"></div>
    </div>
  );
};

export default Dashboard;
