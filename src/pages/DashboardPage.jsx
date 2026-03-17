import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserSession } from '../auth/sessionController';
import { cmsRoles, roleMenuGroups } from '../data/roleConfig';
import TimetablePage from './TimetablePage';
import AttendancePage from './AttendancePage';
import ExamsPage from './ExamsPage';
import PlacementPage from './PlacementPage';
import FacilityPage from './FacilityPage';
import DashboardLayout from '../components/DashboardLayout';

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState(null);

  const pageMap = {
    '/timetable': TimetablePage,
    '/attendance': AttendancePage,
    '/exams': ExamsPage,
    '/placement': PlacementPage,
    '/facility': FacilityPage,
  };
  const pageTitles = {
    '/timetable': 'Timetable',
    '/attendance': 'Attendance',
    '/exams': 'Exams',
    '/placement': 'Placement',
    '/facility': 'Facility',
  };
  const pageSubtitles = {
    '/timetable': 'View and manage weekly class schedules across subjects and sections.',
    '/attendance': 'Track and record student attendance for all mapped subjects.',
    '/exams': 'Manage exam schedules, seat plans, and result submissions.',
    '/placement': 'Monitor campus recruitment drives and student placement status.',
    '/facility': 'Oversee campus infrastructure, labs, and facility bookings.',
  };
  const ActivePage = activePage ? pageMap[activePage] : null;

  const session = getUserSession();
  const sessionRole = session?.role || null;
  const sessionUserId = session?.userId || null;
  const role = sessionRole || 'student';
  const data = cmsRoles[role];
  const menuGroups = roleMenuGroups[role] || roleMenuGroups.student;

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
    <DashboardLayout
      title={activePage ? pageTitles[activePage] : undefined}
      subtitle={activePage ? pageSubtitles[activePage] : undefined}
      showProfileHeader={!activePage}
      activePage={activePage}
      setActivePage={setActivePage}
    >
      {ActivePage && <ActivePage noLayout />}
      {!ActivePage && (<>
          <div className="section-header">
            <span className="section-title">Quick Overview</span>
          </div>

          <div className="stats-grid">
            {data.stats.map((entry, index) => {
              const tone = ['blue', 'green', 'purple', 'orange'][index % 4];
              return (
                <div key={entry.label} className={`stat-card stat-card-${tone}`}>
                  <div className="stat-body">
                    <div className="stat-value">{entry.value}</div>
                    <div className="stat-label">{entry.label}</div>
                    <div className="stat-sub">{entry.sub}</div>
                  </div>
                </div>
              );
            })}
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

          <div className="bottom-grid">
            <div className="content-card">
              <div className="section-header" style={{ marginBottom: 14 }}>
                <span className="section-title">Today Tasks</span>
              </div>
              <div className="notice-list">
                {data.tasks.map((task) => (
                  <div key={task.title} className="notice-item">
                    <div className="notice-dot dot-blue" />
                    <div className="notice-text">
                      <div className="notice-title">{task.title}</div>
                      <div className="notice-desc">{task.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="content-card">
              <div className="section-header" style={{ marginBottom: 14 }}>
                <span className="section-title">Alerts</span>
              </div>
              <div className="notice-list">
                {data.alerts.map((alert, index) => (
                  <div key={alert.title} className="notice-item">
                    <div className={`notice-dot ${index % 2 === 0 ? 'dot-orange' : 'dot-red'}`} />
                    <div className="notice-text">
                      <div className="notice-title">{alert.title}</div>
                      <div className="notice-desc">{alert.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </>)}
    </DashboardLayout>
  );
}
