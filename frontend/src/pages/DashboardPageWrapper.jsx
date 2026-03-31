import { getUserSession } from '../auth/sessionController';
import DashboardPage from './DashboardPage';
import FacultyDashboardPage from './FacultyDashboardPage';

export default function DashboardPageWrapper() {
  const session = getUserSession();
  const role = session?.role || 'student';

  if (role === 'faculty') {
    return <FacultyDashboardPage />;
  }

  return <DashboardPage />;
}
