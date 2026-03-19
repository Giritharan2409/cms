import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserSession } from '../auth/sessionController';
import { cmsRoles, roleMenuGroups } from '../data/roleConfig';
import { getStudentById } from '../data/studentData';
import NotificationBell from '../components/NotificationBell';
import NotificationDropdown from '../components/NotificationDropdown';
<<<<<<< Updated upstream
import Layout from '../components/Layout';
=======
import TimetablePage from './TimetablePage';
import AttendancePage from './AttendancePage';
import ExamsPage from './ExamsPage';
import PlacementPage from './PlacementPage';
import FacilityPage from './FacilityPage';
import PayrollPage from './PayrollPage';
import AnalyticsPage from './AnalyticsPage';

function GraduationIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 2.26L19.02 9 12 12.74 4.98 9 12 5.26zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  );
}
>>>>>>> Stashed changes

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

<<<<<<< Updated upstream
=======
  const pageMap = {
    '/timetable': TimetablePage,
    '/attendance': AttendancePage,
    '/exams': ExamsPage,
    '/placement': PlacementPage,
    '/facility': FacilityPage,
    '/payroll': PayrollPage,
    '/analytics': AnalyticsPage,
  };
  const pageTitles = {
    '/timetable': 'Timetable',
    '/attendance': 'Attendance',
    '/exams': 'Exams',
    '/placement': 'Placement',
    '/facility': 'Facility',
    '/payroll': 'Payroll',
    '/analytics': 'Analytics',
  };
  const pageSubtitles = {
    '/timetable': 'View and manage weekly class schedules across subjects and sections.',
    '/attendance': 'Track and record student attendance for all mapped subjects.',
    '/exams': 'Manage exam schedules, seat plans, and result submissions.',
    '/placement': 'Monitor campus recruitment drives and student placement status.',
    '/facility': 'Oversee campus infrastructure, labs, and facility bookings.',
    '/payroll': 'Manage staff payroll, generate salary slips, and run payroll batches.',
    '/analytics': 'View comprehensive analytics, reports, and insights for data-driven decisions.',
  };
  const ActivePage = activePage ? pageMap[activePage] : null;

>>>>>>> Stashed changes
  const session = getUserSession();
  const sessionRole = session?.role || null;
  const sessionUserId = session?.userId || null;
  const role = sessionRole || 'student';
  const data = cmsRoles[role];
  const menuGroups = roleMenuGroups[role] || roleMenuGroups.student;
  const userId = sessionUserId || 'N/A';
  const roleQuery = `?role=${encodeURIComponent(role)}`;
  const knownStudent = sessionUserId ? getStudentById(sessionUserId) : null;
  const fallbackStudentId = 'STU-2024-1547';

  function handleOpenProfileDetails() {
    if (role === 'student') {
      const studentId = knownStudent ? sessionUserId : fallbackStudentId;
      navigate(`/students/${encodeURIComponent(studentId)}${roleQuery}`);
      return;
    }

    navigate(`/students${roleQuery}`);
  }

<<<<<<< Updated upstream
=======
  const academicRoutes = {
    Exams: '/exams',
    Timetable: '/timetable',
    Attendance: '/attendance',
    Placement: '/placement',
    Facility: '/facility',
    Payroll: '/payroll',
    Analytics: '/analytics',
  };

>>>>>>> Stashed changes
  useEffect(() => {
    if (!sessionRole || !sessionUserId) {
      navigate('/', { replace: true });
      return undefined;
    }

    document.title = 'MIT Connect - Dashboard';

    const expectedSearch = `?role=${encodeURIComponent(sessionRole)}`;
    if (location.search !== expectedSearch) {
      navigate(`/dashboard${expectedSearch}`, { replace: true });
    }

    function enforceSessionOnPageRestore() {
      if (!getUserSession()) {
        navigate('/', { replace: true });
      }
    }

    window.addEventListener('pageshow', enforceSessionOnPageRestore);
    return () => window.removeEventListener('pageshow', enforceSessionOnPageRestore);
  }, [data.label, location.search, navigate, sessionRole, sessionUserId]);

  return (
    <Layout title="Dashboard">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div className="topbar-right">
          <div style={{ position: 'relative' }}>
            <NotificationBell
              role={role}
              onBellClick={() => setIsNotificationOpen(!isNotificationOpen)}
            />
            <NotificationDropdown
              role={role}
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />
          </div>
          <button
            type="button"
            onClick={handleOpenProfileDetails}
            className="profile-avatar-wrap bg-transparent border-0 cursor-pointer"
            aria-label="Open profile details"
            title="Open profile"
          >
            <div className="avatar-initials" style={{ width: 40, height: 40, fontSize: 14 }}>
              {data.label.slice(0, 2).toUpperCase()}
            </div>
            <span className="avatar-status" />
          </button>
        </div>
      </div>

              {/* Profile Header */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleOpenProfileDetails}
                      className="bg-transparent border-0 cursor-pointer"
                      aria-label="Open profile details"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                        {data.label.slice(0, 2).toUpperCase()}
                      </div>
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{data.name}</h2>
                      <p className="text-sm text-gray-600">ID: {userId}</p>
                      <p className="text-sm text-gray-600">Team: {data.team}</p>
                      <p className="text-sm text-gray-600">Focus: {data.focus}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
                      {data.primaryAction}
                    </button>
                    <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
                      {data.secondaryAction}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Overview */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {data.stats.map((entry, index) => {
                    const colors = [
                      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
                      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
                      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
                      { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600' }
                    ];
                    const color = colors[index % 4];
                    return (
                      <div key={entry.label} className={`${color.bg} border ${color.border} rounded-lg p-6`}>
                        <p className={`text-3xl font-bold ${color.text} mb-1`}>{entry.value}</p>
                        <p className="text-sm font-medium text-gray-700">{entry.label}</p>
                        <p className={`text-xs ${color.text} mt-1`}>{entry.sub}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="content-card">
                <div className="section-header" style={{ marginBottom: 14 }}>
                  <span className="section-title">Section Access</span>
                </div>
                <div className="role-access-grid">
                  {menuGroups.map((group) => (
                    <div key={group.title} className="role-access-card">
                      <h4>{group.title}</h4>
                      <div className="role-chip-wrap">
                        {group.items.map((item) => (
                          <span key={item} className="badge badge-gray">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
    </Layout>
  );
}
