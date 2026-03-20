import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { destroyUserSession, getUserSession } from '../../auth/sessionController';
import { cmsRoles, roleMenuGroups } from '../../data/roleConfig';
import { getStudentById } from '../../data/studentData';
import NotificationBell from '../NotificationBell';
import NotificationDropdown from '../NotificationDropdown';

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

const NAV_ICON_MAP = {
  Dashboard: 'dashboard',
  'My Courses': 'menu_book',
  Department: 'domain',
  Students: 'group',
  Faculty: 'person',
  Exams: 'quiz',
  Timetable: 'calendar_today',
  Attendance: 'fact_check',
  Placement: 'work',
  Facility: 'apartment',
  Fees: 'payments',
  Invoices: 'receipt',
  Admission: 'how_to_reg',
  Payroll: 'account_balance_wallet',
  Analytics: 'analytics',
  Notifications: 'notifications',
  Settings: 'settings',
};

const PORTAL_TITLE_MAP = {
  student: 'EduCore Student Portal',
  admin: 'EduCore Admin Portal',
  faculty: 'EduCore Faculty Portal',
  finance: 'EduCore Finance Portal',
};

const DEFAULT_STUDENT_USER_ID = 'STU-2024-1547';

function getInitials(value, fallback = 'U') {
  if (!value) {
    return fallback;
  }

  const tokens = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return fallback;
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0]}${tokens[tokens.length - 1][0]}`.toUpperCase();
}

function resolvePath(role, itemName) {
  const roleQuery = `?role=${encodeURIComponent(role)}`;

  switch (itemName) {
    case 'Dashboard':
      return `/dashboard${roleQuery}`;
    case 'My Courses':
      return '/courses';
    case 'Department':
      return '/department';
    case 'Students':
      return `/students${roleQuery}`;
    case 'Faculty':
      return '/faculty';
    case 'Exams':
      return '/exams';
    case 'Timetable':
      return '/timetable';
    case 'Attendance':
      return '/attendance';
    case 'Placement':
      return '/placement';
    case 'Facility':
      return '/facility';
    case 'Fees':
      return '/fees';
    case 'Invoices':
      return '/invoices';
    case 'Admission':
      return '/admission';
    case 'Payroll':
      return '/payroll';
    case 'Analytics':
      return '/analytics';
    case 'Notifications':
      return '/notifications';
    case 'Settings':
      return `/${role}/settings`;
    default:
      return `/dashboard${roleQuery}`;
  }
}

function isItemActive(pathname, role, itemName) {
  if (itemName === 'Settings') {
    return pathname === `/${role}/settings` || pathname === '/settings';
  }

  const targetPath = resolvePath(role, itemName).split('?')[0];
  return pathname === targetPath;
}

export default function RoleSettingsShell({
  role,
  userName,
  portalTitle,
  modePill,
  children,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const roleLabel = cmsRoles[role]?.label || 'User';
  const displayName = userName || cmsRoles[role]?.name || `${roleLabel} User`;
  const groups = useMemo(() => roleMenuGroups[role] || roleMenuGroups.student, [role]);
  const titleText = portalTitle || PORTAL_TITLE_MAP[role] || 'EduCore Portal';
  const session = getUserSession();

  function handleLogout() {
    destroyUserSession();
    navigate('/', { replace: true });
  }

  function openProfileDetails() {
    const roleQuery = `?role=${encodeURIComponent(role)}`;
    if (role === 'student') {
      const studentId = session?.userId;
      const knownStudent = studentId ? getStudentById(studentId) : null;
      const targetStudentId = knownStudent ? studentId : DEFAULT_STUDENT_USER_ID;
      navigate(`/students/${encodeURIComponent(targetStudentId)}${roleQuery}`);
      return;
    }
    navigate(`/students${roleQuery}`);
  }

  return (
    <>
      {!isSidebarVisible && (
        <button
          type="button"
          className="sidebar-desktop-toggle"
          onClick={() => setIsSidebarVisible(true)}
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <MenuIcon />
        </button>
      )}

      <div
        className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <div className="dashboard-wrapper role-settings-shell">
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}${isSidebarVisible ? '' : ' hidden-desktop'}`}>
          <div className="sidebar-logo">
            <div className="logo-mark">
              <GraduationIcon />
            </div>
            <div className="logo-text-wrap">
              <div className="logo-title">EduCore</div>
              <div className="logo-sub">{roleLabel.toUpperCase()} PORTAL</div>
            </div>
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarVisible(false)}
              aria-label="Hide sidebar"
              title="Hide sidebar"
            >
              <MenuIcon />
            </button>
          </div>

          <nav className="sidebar-nav">
            {groups.map((group) => (
              <div key={group.title}>
                <div className="nav-section-label">{group.title}</div>
                <ul className="portal-nav-list">
                  {group.items.map((itemName) => (
                    <li key={itemName}>
                      <button
                        type="button"
                        className={`portal-sidebar-link${isItemActive(location.pathname, role, itemName) ? ' active' : ''}`}
                        onClick={() => {
                          setSidebarOpen(false);
                          navigate(resolvePath(role, itemName));
                        }}
                      >
                        <span className="material-symbols-outlined">{NAV_ICON_MAP[itemName] || 'apps'}</span>
                        <span>{itemName}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button
              type="button"
              className="portal-logout-btn"
              onClick={handleLogout}
            >
              <LogoutIcon />
              Logout
            </button>
          </div>
        </aside>

        <main className={`main-content${isSidebarVisible ? '' : ' sidebar-hidden'}`}>
          <div className="topbar role-settings-topbar">
            <div className="topbar-left">
              <button
                className="mobile-menu-btn"
                onClick={() => {
                  setIsSidebarVisible(true);
                  setSidebarOpen(true);
                }}
                aria-label="Toggle menu"
              >
                <MenuIcon />
              </button>
              <h2>{titleText}</h2>
            </div>

            <div className="topbar-right">
              <div style={{ position: 'relative' }}>
                <NotificationBell role={role} onBellClick={() => setIsNotificationOpen(!isNotificationOpen)} />
                <NotificationDropdown role={role} isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
              </div>
              <button
                type="button"
                className="portal-icon-btn"
                onClick={() => navigate(`/${role}/settings`)}
                aria-label="Open settings"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
              <button
                type="button"
                className="portal-user-chip"
                onClick={() => openProfileDetails()}
                aria-label="Open profile details"
              >
                <div className="portal-user-meta">
                  <span>{displayName}</span>
                  <small>{roleLabel.toUpperCase()}</small>
                </div>
                <div className="portal-user-initials">{getInitials(displayName, roleLabel.slice(0, 2).toUpperCase())}</div>
              </button>
            </div>
          </div>

          <div className="role-settings-content">
            {modePill ? <div className="settings-mode-pill-wrap"><span className="settings-role-pill">{modePill}</span></div> : null}
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
