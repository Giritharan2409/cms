import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserSession } from '../auth/sessionController';
import { cmsRoles, roleMenuGroups } from '../data/roleConfig';
import Layout from '../components/Layout';

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = getUserSession();
  const sessionRole = session?.role || null;
  const sessionUserId = session?.userId || null;
  const role = sessionRole || 'student';
  const data = cmsRoles[role];
  const menuGroups = roleMenuGroups[role] || roleMenuGroups.student;
  const roleQuery = `?role=${encodeURIComponent(role)}`;

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
      {/* Quick Overview */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {data.stats.map((entry, index) => {
                    const colors = [
                      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
                      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
                      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
                      { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' }
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
                  {menuGroups.map((group, index) => {
                    const colors = ['color-green', 'color-green', 'color-purple', 'color-orange'];
                    const color = colors[index % 4];
                    return (
                      <div key={group.title} className={`role-access-card ${color}`}>
                        <h4>{group.title}</h4>
                        <div className="role-chip-wrap">
                          {group.items.map((item) => (
                            <span key={item} className="badge badge-gray">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
    </Layout>
  );
}
