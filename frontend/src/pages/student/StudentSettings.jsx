import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { roleSettingsApi } from '../../api/roleSettingsApi';
import { getUserSession } from '../../auth/sessionController';
import RoleSettingsShell from '../../components/role-settings/RoleSettingsShell';
import {
  Button,
  Card,
  FormInput,
  ProfileAvatar,
  SectionContainer,
} from '../../components/role-settings/SettingsPrimitives';

const EMPTY_PROFILE = {
  fullName: '',
  email: '',
  phone: '',
  department: '',
  address: '',
  role: 'Student',
  photo: null,
  photoName: '',
};

const EMPTY_PASSWORD = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const STATUS_LABELS = {
  pending_faculty_approval: 'Pending Faculty Approval',
  pending_admin_approval: 'Pending Admin Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

function getInitials(name, fallback = 'U') {
  const tokens = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return fallback;
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 1).toUpperCase();
  }

  return `${tokens[0][0]}${tokens[tokens.length - 1][0]}`.toUpperCase();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatRequestDate(value) {
  if (!value) {
    return 'Not available';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return parsed.toLocaleString();
}

function getStatusTone(status) {
  if (status === 'approved') {
    return 'approved';
  }

  if (status === 'rejected') {
    return 'rejected';
  }

  return 'pending';
}

function getRequestTypeLabel(type) {
  if (type === 'password') {
    return 'Password Change';
  }

  return 'Profile Update';
}

function formatMaskedChanges(requestItem) {
  const entries = Object.entries(requestItem?.maskedRequestedChanges || {});
  if (!entries.length) {
    return 'No fields listed';
  }

  return entries.map(([key, value]) => `${key}: ${value}`).join(' | ');
}

export default function StudentSettings() {
  const session = getUserSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.role !== 'student') {
    return <Navigate to={`/${session.role}/settings`} replace />;
  }

  const userId = session.userId;
  const photoInputRef = useRef(null);
  const mountedRef = useRef(true);
  const [formData, setFormData] = useState(EMPTY_PROFILE);
  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORD);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [requestHistory, setRequestHistory] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  async function loadRequestHistory() {
    try {
      const response = await roleSettingsApi.getCredentialRequests('my');
      if (!mountedRef.current) {
        return;
      }
      setRequestHistory(response?.data || []);
    } catch {
      if (mountedRef.current) {
        setRequestHistory([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoadingRequests(false);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    async function loadSettings() {
      try {
        const data = await roleSettingsApi.getStudentSettings(userId);
        if (!active) {
          return;
        }

        setFormData({
          ...EMPTY_PROFILE,
          ...data,
          email: data?.email || userId,
          role: 'Student',
        });
        setLoadError('');
      } catch (requestError) {
        if (active) {
          setLoadError(requestError?.message || 'Unknown error while loading student settings');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();
    loadRequestHistory();
    return () => {
      active = false;
      mountedRef.current = false;
    };
  }, [userId]);

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setFormData((current) => ({
        ...current,
        photo: dataUrl,
        photoName: file.name,
      }));
    } catch {
      window.alert('Unable to read selected file. Please choose another image.');
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const response = await roleSettingsApi.updateStudentSettings(userId, formData);
      await loadRequestHistory();
      window.alert(response?.message || 'Credential change request submitted.');
    } catch (saveError) {
      window.alert(saveError?.message || 'Unable to submit profile request right now.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleUpdatePassword() {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      window.alert('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await roleSettingsApi.changePassword({
        userId,
        role: 'student',
        currentPassword: passwordData.currentPassword,
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData(EMPTY_PASSWORD);
      await loadRequestHistory();
      window.alert(response?.message || 'Password change request submitted.');
    } catch (saveError) {
      window.alert(saveError?.message || 'Unable to submit password request right now.');
    } finally {
      setSavingPassword(false);
    }
  }

  if (loadError) {
    return <div className="settings-load-error">Unable to load settings. {loadError}</div>;
  }

  return (
    <RoleSettingsShell
      role="student"
      portalTitle="EduCore Student Portal"
      userName={formData.fullName || 'Student User'}
    >
      {loading ? (
        <div className="settings-load-state">Loading settings...</div>
      ) : (
        <>
          <SectionContainer title="Profile" subtitle="Update your account information.">
            <Card title="Profile Information">
              <div className="settings-grid-two">
                <FormInput
                  id="student-full-name"
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(value) => setFormData((current) => ({ ...current, fullName: value }))}
                />

                <FormInput
                  id="student-email"
                  label="Email"
                  value={formData.email}
                  onChange={(value) => setFormData((current) => ({ ...current, email: value }))}
                />

                <FormInput
                  id="student-phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={(value) => setFormData((current) => ({ ...current, phone: value }))}
                />

                <FormInput
                  id="student-department"
                  label="Department"
                  value={formData.department}
                  onChange={(value) => setFormData((current) => ({ ...current, department: value }))}
                />

                <FormInput
                  id="student-address"
                  label="Address"
                  as="textarea"
                  spanTwo
                  value={formData.address}
                  onChange={(value) => setFormData((current) => ({ ...current, address: value }))}
                />

                <FormInput
                  id="student-role"
                  label="Role"
                  value={formData.role}
                  readOnly
                />

                <div className="settings-field">
                  <label>Profile Photo</label>
                  <ProfileAvatar
                    photo={formData.photo}
                    alt="Student profile"
                    initials={getInitials(formData.fullName, 'S')}
                    inputRef={photoInputRef}
                    onFileChange={handlePhotoChange}
                    fileName={formData.photoName}
                  />
                </div>
              </div>

              <div className="settings-actions">
                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Update Profile'}
                </Button>
              </div>
            </Card>
          </SectionContainer>

          <SectionContainer title="Security" subtitle="Keep your student account secure.">
            <div className="settings-grid-two">
              <FormInput
                id="student-current-password"
                label="Current Password"
                type="password"
                spanTwo
                value={passwordData.currentPassword}
                onChange={(value) => setPasswordData((current) => ({ ...current, currentPassword: value }))}
              />

              <FormInput
                id="student-new-password"
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(value) => setPasswordData((current) => ({ ...current, newPassword: value }))}
              />

              <FormInput
                id="student-confirm-password"
                label="Confirm Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(value) => setPasswordData((current) => ({ ...current, confirmPassword: value }))}
              />
            </div>

            <div className="settings-actions">
              <Button onClick={handleUpdatePassword} disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </SectionContainer>

          <SectionContainer
            title="Credential Requests"
            subtitle="Track submitted profile and password updates through faculty and admin approvals."
          >
            <Card title="Request History">
              {loadingRequests ? (
                <div className="settings-request-empty">Loading request history...</div>
              ) : requestHistory.length ? (
                <div className="settings-request-list">
                  {requestHistory.map((requestItem) => {
                    const tone = getStatusTone(requestItem.status);
                    return (
                      <article className="settings-request-item" key={requestItem.requestId || requestItem.id}>
                        <div className="settings-request-head">
                          <strong className="settings-request-title">{getRequestTypeLabel(requestItem.requestType)}</strong>
                          <span className={`settings-request-status settings-request-status-${tone}`}>
                            {STATUS_LABELS[requestItem.status] || requestItem.statusLabel || 'Pending'}
                          </span>
                        </div>
                        <p className="settings-request-meta">Request ID: {requestItem.requestId || 'N/A'}</p>
                        <p className="settings-request-meta">Submitted: {formatRequestDate(requestItem.createdAt)}</p>
                        <p className="settings-request-meta">
                          Changed Fields: {(requestItem.changedFields || []).join(', ') || 'None'}
                        </p>
                        <p className="settings-request-meta">Requested Values: {formatMaskedChanges(requestItem)}</p>
                        {requestItem.rejectionReason ? (
                          <p className="settings-request-reason">Reason: {requestItem.rejectionReason}</p>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="settings-request-empty">No credential requests have been submitted yet.</div>
              )}
            </Card>
          </SectionContainer>
        </>
      )}
    </RoleSettingsShell>
  );
}
