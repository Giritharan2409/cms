import { Navigate } from 'react-router-dom';
import { getUserSession } from '../auth/sessionController';

export default function SettingsPage() {
  const session = getUserSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/${session.role}/settings`} replace />;
}
