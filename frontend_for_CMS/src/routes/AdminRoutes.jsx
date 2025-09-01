import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import AdminSidebar from "../layouts/AdminSidebar";
import WorkingScheduleAdmin from "../features/WorkingSchedule/pages/WorkingScheduleAdmin";
// Import các trang quản trị
import ManageDoctors from "../features/Admin/Employee/pages/doctor/DoctorManagement";
import AdminReports from "../features/Admin/Reports/pages/AdminReports";

// Import các trang báo cáo
import RevenueReportPage from "../features/Admin/Reports/pages/RevenueReportPage";
import PatientReportPage from "../features/Admin/Reports/pages/PatientReportPage";
import DiseaseReportPage from "../features/Admin/Reports/pages/DiseaseReportPage";
import SpecialtyReportPage from "../features/Admin/Reports/pages/SpecialtyReportPage";
import DoctorReportPage from "../features/Admin/Reports/pages/DoctorReportPage";
import ServiceReportPage from "../features/Admin/Reports/pages/ServiceReportPage";

// Doctor management routes
import DoctorManagement from '../features/Admin/Employee/pages/doctor/DoctorManagement';
import AddDoctor from '../features/Admin/Employee/pages/doctor/AddDoctor';
import EditDoctor from '../features/Admin/Employee/pages/doctor/EditDoctor';

// import trang quản lý thuốc
import MedicineManagement from '../features/Admin/HealthcareServices/pages/MedicineManagement';
import ServiceManagement from "../features/Admin/HealthcareServices/pages/ServiceManagement";
// Receptionist management routes
//import ReceptionistManagement from '../features/Admin/Employee/pages/receptionist/ReceptionistManagement';
//import AddReceptionist from '../features/Admin/Employee/pages/receptionist/AddReceptionist';
//import EditReceptionist from '../features/Admin/Employee/pages/receptionist/EditReceptionist';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/workingscheduleadmin" element={<WorkingScheduleAdmin />} />
      {/*<Route path="/receptionists" element={<ReceptionistManagement />} />*/}
      <Route path="/doctors" element={<ManageDoctors />} />

      {/* Các route báo cáo */}
      <Route path="/reports" element={<AdminReports />} />
      <Route path="/reports/revenue" element={<RevenueReportPage />} />
      <Route path="/reports/patients" element={<PatientReportPage />} />
      <Route path="/reports/diseases" element={<DiseaseReportPage />} />
      <Route path="/reports/specialties" element={<SpecialtyReportPage />} />
      <Route path="/reports/doctors" element={<DoctorReportPage />} />
      <Route path="/reports/services" element={<ServiceReportPage />} />

      {/* Doctor management routes */}
      <Route path="employee/doctor" element={<DoctorManagement />} />
      <Route path="employee/doctor/add" element={<AddDoctor />} />
      <Route path="employee/doctor/edit/:id" element={<EditDoctor />} />

      {/* Medicine management route */}
      <Route path="/medicines" element={<MedicineManagement />} />
      <Route path="/services" element={<ServiceManagement />} />

      {/* Receptionist management routes */}
      {/*<Route path="employee/receptionist" element={<ReceptionistManagement />} />
      <Route path="employee/receptionist/add" element={<AddReceptionist />} />
      <Route path="employee/receptionist/edit/:id" element={<EditReceptionist />} />*/}
    </Routes>
  );
};

export default AdminRoutes;