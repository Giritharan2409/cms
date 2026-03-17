import { getUserSession } from '../auth/sessionController';
import { cmsRoles } from '../data/roleConfig';

export default function DashboardProfileHeader() {
  const session = getUserSession();
  const role = session?.role || 'student';
  const data = cmsRoles[role];
  const userId = session?.userId || 'N/A';

  return (
    <div className="profile-header">
      <div className="profile-left">
        <div className="profile-avatar-wrap">
          <div className="avatar-initials">{data.label.slice(0, 2).toUpperCase()}</div>
          <span className="avatar-status" />
        </div>
        <div className="profile-info">
          <div className="student-name">{data.name}</div>
          <div className="profile-meta">
            <span className="meta-item">ID: {userId}</span>
            <span className="meta-item">Team: {data.team}</span>
            <span className="meta-item">Focus: {data.focus}</span>
          </div>
        </div>
      </div>
      <div className="profile-right">
        <button type="button" className="btn-primary-sm">
          {data.primaryAction}
        </button>
        <button type="button" className="btn-secondary-sm">
          {data.secondaryAction}
        </button>
      </div>
    </div>
  );
}
