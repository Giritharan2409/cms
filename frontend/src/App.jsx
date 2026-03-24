import { Navigate, Route, Routes } from 'react-router-dom';
import { getUserSession } from './auth/sessionController';
import { AdmissionProvider } from './context/AdmissionContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import TimetablePage from './pages/TimetablePage';
import AttendancePage from './pages/AttendancePage';
import ExamsPage from './pages/ExamsPage';
import PlacementPage from './pages/PlacementPage';
import FacilityPage from './pages/FacilityPage';
import SettingsPage from './pages/SettingsPage';
import StudentSettings from './pages/student/StudentSettings';
import FacultySettings from './pages/faculty/FacultySettings';
import FinanceSettings from './pages/finance/FinanceSettings';
import AdminSettings from './pages/admin/AdminSettings';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PayrollPage from './pages/PayrollPage';
import AdmissionPage from './pages/AdmissionPage';
import AdminFeesPage from './pages/AdminFeesPage';
import AdminInvoicePage from './pages/AdminInvoicePage';
import FeesPage from './pages/FeesPage';
import InvoicePage from './pages/InvoicePage';
import ComingSoonPage from './pages/ComingSoonPage';

export default function App() {
  const session = getUserSession();

  return (
    <AdmissionProvider>
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
        <Route path="/placement" element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}><PlacementPage /></ProtectedRoute>} />
        <Route path="/facility" element={<ProtectedRoute allowedRoles={['admin']}><FacilityPage /></ProtectedRoute>} />
        <Route path="/payroll" element={<ProtectedRoute><PayrollPage /></ProtectedRoute>} />
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
          path="/student/settings"
          element={
            <ProtectedRoute>
              <StudentSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/settings"
          element={
            <ProtectedRoute>
              <FacultySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/settings"
          element={
            <ProtectedRoute>
              <FinanceSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminSettings />
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
        <Route path="/faculty" element={<ProtectedRoute><ComingSoonPage /></ProtectedRoute>} />
        <Route path="/department" element={<ProtectedRoute><ComingSoonPage /></ProtectedRoute>} />
        <Route path="/my-courses" element={<ProtectedRoute><ComingSoonPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ComingSoonPage /></ProtectedRoute>} />
        <Route path="/admission" element={<ProtectedRoute><AdmissionPage /></ProtectedRoute>} />
        <Route path="/fees" element={<ProtectedRoute><FeesPage /></ProtectedRoute>} />
        <Route path="/admin-fees" element={<ProtectedRoute><AdminFeesPage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
        <Route path="/admin-invoices" element={<ProtectedRoute><AdminInvoicePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdmissionProvider>
  );
}
