import { useState } from 'react';
import { getUserSession } from '../auth/sessionController';
import { cmsRoles } from '../data/roleConfig';
import NotificationBell from './NotificationBell';
import NotificationDropdown from './NotificationDropdown';

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{width: '24px', height: '24px'}}>
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  );
}

export default function DashboardTopBar({ setSidebarOpen, title, subtitle }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const session = getUserSession();
  const role = session?.role || 'student';
  const data = cmsRoles[role];

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Toggle menu">
          <MenuIcon />
        </button>
        <div className="topbar-left">
          <h2>{title || `${data.label} Dashboard`}</h2>
          <p>{subtitle || data.subtitle}</p>
        </div>
      </div>
      <div className="topbar-right">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
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
        <span className="badge badge-info">{data.label}</span>
      </div>
    </div>
  );
}
