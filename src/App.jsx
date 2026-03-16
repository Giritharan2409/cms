import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getUserSession } from './auth/sessionController';
import { initializeSemesterFees } from './services/dataService';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import TimetablePage from './pages/TimetablePage';
import AttendancePage from './pages/AttendancePage';
import ExamsPage from './pages/ExamsPage';
import PlacementPage from './pages/PlacementPage';
import FacilityPage from './pages/FacilityPage';
import SettingsPage from './pages/SettingsPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdmissionPage from './pages/AdmissionPage';
import AdmissionDashboardPage from './pages/AdmissionDashboardPage';
import AdmissionStatusTrackingPage from './pages/AdmissionStatusTrackingPage';
import StaffAdmissionPage from './pages/StaffAdmissionPage';
import EnrollmentPage from './pages/EnrollmentPage';
import SemesterFeesPage from './pages/SemesterFeesPage';
import FeesPage from './pages/FeesPage';
import PayrollPage from './pages/PayrollPage';
import InvoicesPage from './pages/InvoicesPage';

export default function App() {
  const session = getUserSession();

  useEffect(() => {
    initializeSemesterFees();
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          session ? <Navigate to={`/dashboard?role=${encodeURIComponent(session.role)}`} replace /> : <LoginPage />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/timetable" element={<ProtectedRoute><TimetablePage /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      <Route path="/exams" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
      <Route path="/placement" element={<ProtectedRoute allowedRoles={['admin', 'faculty']}><PlacementPage /></ProtectedRoute>} />
      <Route path="/facility" element={<ProtectedRoute allowedRoles={['admin']}><FacilityPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
      <Route path="/admission" element={<ProtectedRoute><AdmissionPage /></ProtectedRoute>} />
      <Route path="/admission-dashboard" element={<ProtectedRoute><AdmissionDashboardPage /></ProtectedRoute>} />
      <Route path="/admission-status" element={<ProtectedRoute><AdmissionStatusTrackingPage /></ProtectedRoute>} />
      <Route path="/staff-admission" element={<ProtectedRoute><StaffAdmissionPage /></ProtectedRoute>} />
      <Route path="/enrollment" element={<ProtectedRoute><EnrollmentPage /></ProtectedRoute>} />
      <Route path="/semester-fees" element={<ProtectedRoute><SemesterFeesPage /></ProtectedRoute>} />
      <Route path="/fees" element={<ProtectedRoute><FeesPage /></ProtectedRoute>} />
      <Route path="/payroll" element={<ProtectedRoute><PayrollPage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
