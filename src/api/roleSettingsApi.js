import { getUserSession } from '../auth/sessionController';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getActorHeaders() {
  const session = getUserSession();
  if (!session?.userId || !session?.role) {
    return {};
  }

  return {
    'X-Actor-UserId': session.userId,
    'X-Actor-Role': session.role,
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getActorHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.detail || payload?.message || 'Request failed';
    throw new Error(message);
  }

  return payload;
}

export const roleSettingsApi = {
  getStudentSettings(userId) {
    return request(`/api/student/settings/${encodeURIComponent(userId)}`);
  },

  updateStudentSettings(userId, data) {
    return request(`/api/student/settings/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getAdminProfile(userId) {
    return request(`/api/admin/profile/${encodeURIComponent(userId)}`);
  },

  updateAdminProfile(userId, data) {
    return request(`/api/admin/profile/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changeAdminPassword(data) {
    return request('/api/admin/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getAdminSystem() {
    return request('/api/admin/system');
  },

  updateAdminSystem(data) {
    return request('/api/admin/system', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getAdminAcademic() {
    return request('/api/admin/academic');
  },

  updateAdminAcademic(data) {
    return request('/api/admin/academic', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getFacultySettings(userId) {
    return request(`/api/settings/faculty/${encodeURIComponent(userId)}`);
  },

  updateFacultyProfile(userId, data) {
    return request(`/api/settings/faculty/profile/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateFacultyToggles(userId, data) {
    return request(`/api/settings/faculty/toggles/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getFinanceSettings(userId) {
    return request(`/api/settings/finance/${encodeURIComponent(userId)}`);
  },

  updateFinanceProfile(userId, data) {
    return request(`/api/settings/finance/profile/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateFinanceToggles(userId, data) {
    return request(`/api/settings/finance/toggles/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword(data) {
    return request('/api/settings/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCredentialRequests(scope = 'my', status = '') {
    const query = new URLSearchParams({ scope });
    if (status) {
      query.set('status', status);
    }
    return request(`/api/settings/credential-requests?${query.toString()}`);
  },

  approveCredentialRequest(requestId, comment = '') {
    return request(`/api/settings/credential-requests/${encodeURIComponent(requestId)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  rejectCredentialRequest(requestId, reason = '') {
    return request(`/api/settings/credential-requests/${encodeURIComponent(requestId)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
