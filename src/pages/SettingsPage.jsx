import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getUserSession } from '../auth/sessionController';
import RoleGuard from '../components/RoleGuard';
import SettingsLayout from '../components/settings/SettingsLayout';
import UserSettingsPage from '../components/user-settings/SettingsPage';
import Layout from '../components/Layout';
import { cmsRoles } from '../data/roleConfig';
import '../settings.css';
import '../user-settings.css';

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getUserSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  const role = session.role;

  useEffect(() => {
    const roleLabel = cmsRoles[role]?.label || 'System';
    const titlePrefix = role === 'student' || role === 'faculty' ? 'User Settings' : 'System Settings';
    document.title = `MIT Connect - ${roleLabel} ${titlePrefix}`;

    const expectedSearch = `?role=${encodeURIComponent(role)}`;
    if (location.search !== expectedSearch) {
      navigate(`/settings${expectedSearch}`, { replace: true });
    }
  }, [location.search, navigate, role]);

  if (role === 'student' || role === 'faculty') {
    return (
      <Layout title="">
        <RoleGuard roles={['student', 'faculty']}>
          <UserSettingsPage role={role} userId={session.userId} />
        </RoleGuard>
      </Layout>
    );
  }

  if (role === 'admin' || role === 'finance') {
    return (
      <Layout title="">
        <RoleGuard roles={['admin', 'finance']}>
          <SettingsLayout role={role} userId={session.userId} />
        </RoleGuard>
      </Layout>
    );
  }

  return <Navigate to="/" replace />;
}
