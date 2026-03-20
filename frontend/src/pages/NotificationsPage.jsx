import { useSearchParams } from 'react-router-dom';
import { getUserSession } from '../auth/sessionController';
import NotificationCenter from '../components/NotificationCenter';
import Layout from '../components/Layout';

export default function NotificationsPage() {
  const [searchParams] = useSearchParams();
  const session = getUserSession();
  const role = searchParams.get('role') || session?.role || 'student';

  return (
    <Layout title="Notifications">
      <div style={{ marginBottom: 16, color: '#64748b', fontSize: 13 }}>
        MIT Connect - <strong style={{ color: '#1e293b', textTransform: 'capitalize' }}>{role}</strong> Notifications
      </div>
      <div>
        <NotificationCenter role={role} />
      </div>
    </Layout>
  );
}
