import { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';
import DashboardProfileHeader from './DashboardProfileHeader';

export default function DashboardLayout({ children, title, subtitle, showProfileHeader = true, activePage = null, setActivePage }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div
        className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <div className="dashboard-wrapper role-layout">
        <DashboardSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activePage={activePage}
          setActivePage={setActivePage}
        />

        <main className="main-content">
          <DashboardTopBar
            setSidebarOpen={setSidebarOpen}
            title={title}
            subtitle={subtitle}
          />

          {showProfileHeader && <DashboardProfileHeader />}

          {children}
        </main>
      </div>
    </>
  );
}
