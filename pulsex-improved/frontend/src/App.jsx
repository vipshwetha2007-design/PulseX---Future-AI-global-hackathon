import { Navigate, Route, Routes } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import RegisterPatient from "./pages/RegisterPatient";
import RegisterDoctor from "./pages/RegisterDoctor";
import RegisterAmbulance from "./pages/RegisterAmbulance";
import RegisterAdmin from "./pages/RegisterAdmin";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./components/ProtectedRoute";
import Shell from "./components/Shell";

// Ambulance portal
import AmbulanceDashboard from "./pages/ambulance/AmbulanceDashboard";
import { ToastProvider } from "./components/ambulance/ToastProvider";

// Patient portal
import PatientDashboard from "./pages/patient/PatientDashboard";
import Profile from "./pages/patient/Profile";
import MedicalRecords from "./pages/patient/MedicalRecords";
import Prescriptions from "./pages/patient/Prescriptions";
import LabReports from "./pages/patient/LabReports";
import Allergies from "./pages/patient/Allergies";
import Surgeries from "./pages/patient/Surgeries";
import EmergencyContacts from "./pages/patient/EmergencyContacts";
import ConsentSettings from "./pages/patient/ConsentSettings";
import QrCodePage from "./pages/patient/QrCodePage";
import NfcCardPage from "./pages/patient/NfcCardPage";
import Notifications from "./pages/patient/Notifications";
import AccessHistory from "./pages/patient/AccessHistory";

// Doctor portal
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AssignedPatients from "./pages/doctor/AssignedPatients";
import EmergencyRequests from "./pages/doctor/EmergencyRequests";
import EmergencyAccess from "./pages/doctor/EmergencyAccess";
import PatientTimeline from "./pages/doctor/PatientTimeline";
import DiagnosisForm from "./pages/doctor/DiagnosisForm";
import PrescriptionForm from "./pages/doctor/PrescriptionForm";
import TreatmentPlanForm from "./pages/doctor/TreatmentPlanForm";
import MedicationSafety from "./pages/doctor/MedicationSafety";
import PatientSearch from "./pages/doctor/PatientSearch";

// Admin portal
import AdminOverview from "./pages/admin/AdminOverview";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import UserManagement from "./pages/admin/UserManagement";
import HospitalVerification from "./pages/admin/HospitalVerification";
import AuditLogs from "./pages/admin/AuditLogs";
import FraudAlerts from "./pages/admin/FraudAlerts";
import AiConfiguration from "./pages/admin/AiConfiguration";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login/:role" element={<Login />} />
      <Route path="/register/patient" element={<RegisterPatient />} />
      <Route path="/register/doctor" element={<RegisterDoctor />} />
      <Route path="/register/paramedic" element={<RegisterAmbulance />} />
      <Route path="/register/admin" element={<RegisterAdmin />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Patient */}
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute roles={["patient"]}>
            <Shell>
              <Routes>
                <Route index element={<PatientDashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="records" element={<MedicalRecords />} />
                <Route path="prescriptions" element={<Prescriptions />} />
                <Route path="lab-reports" element={<LabReports />} />
                <Route path="allergies" element={<Allergies />} />
                <Route path="surgeries" element={<Surgeries />} />
                <Route path="contacts" element={<EmergencyContacts />} />
                <Route path="consent" element={<ConsentSettings />} />
                <Route path="qr" element={<QrCodePage />} />
                <Route path="nfc" element={<NfcCardPage />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="history" element={<AccessHistory />} />
                <Route path="*" element={<Navigate to="/patient" replace />} />
              </Routes>
            </Shell>
          </ProtectedRoute>
        }
      />

      {/* Doctor */}
      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute roles={["doctor"]}>
            <Shell>
              <Routes>
                <Route index element={<DoctorDashboard />} />
                <Route path="patients" element={<AssignedPatients />} />
                <Route path="search" element={<PatientSearch />} />
                <Route path="requests" element={<EmergencyRequests />} />
                <Route path="medication-safety" element={<MedicationSafety />} />
                <Route path="patients/:patientId/access" element={<EmergencyAccess />} />
                <Route path="patients/:patientId/timeline" element={<PatientTimeline />} />
                <Route path="patients/:patientId/diagnosis" element={<DiagnosisForm />} />
                <Route path="patients/:patientId/prescription" element={<PrescriptionForm />} />
                <Route path="patients/:patientId/treatment-plan" element={<TreatmentPlanForm />} />
                <Route path="*" element={<Navigate to="/doctor" replace />} />
              </Routes>
            </Shell>
          </ProtectedRoute>
        }
      />

      {/* Ambulance / paramedic */}
      <Route
        path="/ambulance/*"
        element={
          <ProtectedRoute roles={["paramedic"]}>
            <Shell>
              <ToastProvider>
                <Routes>
                  <Route index element={<AmbulanceDashboard />} />
                  <Route path="*" element={<Navigate to="/ambulance" replace />} />
                </Routes>
              </ToastProvider>
            </Shell>
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Shell>
              <Routes>
                <Route index element={<AdminOverview />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="hospitals" element={<HospitalVerification />} />
                <Route path="audit" element={<AuditLogs />} />
                <Route path="fraud" element={<FraudAlerts />} />
                <Route path="ai-config" element={<AiConfiguration />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </Shell>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
