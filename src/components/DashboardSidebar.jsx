import { useNavigate, useLocation } from 'react-router-dom';
import { destroyUserSession, getUserSession } from '../auth/sessionController';
import { cmsRoles, roleMenuGroups } from '../data/roleConfig';

function GraduationIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 2.26L19.02 9 12 12.74 4.98 9 12 5.26zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
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

export default function DashboardSidebar({ sidebarOpen, setSidebarOpen, activePage = null, setActivePage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getUserSession();
  const role = session?.role || 'student';
  const data = cmsRoles[role];
  const menuGroups = roleMenuGroups[role] || roleMenuGroups.student;

  const academicRoutes = {
    Exams: '/exams',
    Timetable: '/timetable',
    Attendance: '/attendance',
    Placement: '/placement',
    Facility: '/facility',
    Payroll: '/payroll',
  };

  const routeMap = {
    Dashboard: '/dashboard',
    Students: '/students',
    Faculty: '/faculty',
    Department: '/departments',
    Exams: '/exams',
    Timetable: '/timetable',
    Attendance: '/attendance',
    Placement: '/placement',
    Facility: '/facility',
    Fees: '/fees',
    Reports: '/reports',
    Admission: '/admission',
    Payroll: '/payroll',
    Invoices: '/invoices',
    Analytics: '/analytics',
    Notifications: '/notifications',
    Settings: '/settings',
    'My Courses': '/my-courses',
  };

  function handleLogout() {
    destroyUserSession();
    navigate('/', { replace: true });
  }

  return (
    <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} id="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <GraduationIcon />
        </div>
        <div className="logo-text-wrap">
          <div className="logo-title">MIT Connect</div>
          <div className="logo-sub">MIT Connect - {data.label} Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuGroups.map((group, groupIndex) => (
          <div key={group.title}>
            <div className="nav-section-label">{group.title}</div>
            <ul>
              {group.items.map((item, itemIndex) => {
                const itemRoute = routeMap[item];
                const isActive = (activePage !== null && academicRoutes[item] === activePage) ||
                                 (activePage === null && itemRoute && location.pathname.startsWith(itemRoute));

                return (
                  <li key={item}>
                    <a
                      href="#"
                      className={isActive ? 'active' : ''}
                      onClick={(event) => {
                        event.preventDefault();
                        setSidebarOpen(false);
                        const targetRoute = routeMap[item];
                        
                        if (item.toLowerCase() === 'settings' || item.toLowerCase() === 'notifications' || item.toLowerCase() === 'students' || item.toLowerCase() === 'dashboard') {
                             navigate(`${targetRoute}?role=${encodeURIComponent(role)}`);
                             if (setActivePage) setActivePage(null);
                        } else if (academicRoutes[item]) {
                             if (setActivePage) {
                               setActivePage(academicRoutes[item]);
                             } else {
                               // If used in a page that doesn't use sub-pages (like StudentsPage), navigate to dashboard with that page active?
                               // Or just navigate to the route.
                               navigate(`${academicRoutes[item]}?role=${encodeURIComponent(role)}`);
                             }
                        } else {
                             if (setActivePage) setActivePage(null);
                             if (targetRoute) navigate(`${targetRoute}?role=${encodeURIComponent(role)}`);
                        }
                      }}
                    >
                      {item}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            handleLogout();
          }}
        >
          <LogoutIcon />
          Logout
        </a>
      </div>
    </aside>
  );
}
