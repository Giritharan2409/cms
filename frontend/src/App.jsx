import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
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
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationPage from './pages/NotificationPage';
import PayrollPage from './pages/PayrollPage';


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
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
      <Route path="/placement" element={<ProtectedRoute><PlacementPage /></ProtectedRoute>} />
      <Route
        path="/facility"
        element={
          <ProtectedRoute>
            <RoleGuard roles={['admin', 'faculty']}>
              <FacilityPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route path="/payroll" element={<ProtectedRoute><PayrollPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}
