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
  ToggleSwitch,
} from '../../components/role-settings/SettingsPrimitives';

const EMPTY_PROFILE = {
  fullName: '',
  email: '',
  phone: '',
  department: '',
  address: '',
  role: 'Finance',
  photo: null,
  photoName: '',
};

const EMPTY_TOGGLES = {
  paymentNotifications: true,
  refundAlerts: true,
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

function getInitials(name, fallback = 'F') {
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

export default function FinanceSettings() {
  const session = getUserSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.role !== 'finance') {
    return <Navigate to={`/${session.role}/settings`} replace />;
  }

  const userId = session.userId;
  const photoInputRef = useRef(null);
  const mountedRef = useRef(true);
  const [profileData, setProfileData] = useState(EMPTY_PROFILE);
  const [toggleData, setToggleData] = useState(EMPTY_TOGGLES);
  const [initialToggles, setInitialToggles] = useState(EMPTY_TOGGLES);
  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORD);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingToggles, setSavingToggles] = useState(false);
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
        const data = await roleSettingsApi.getFinanceSettings(userId);
        if (!active) {
          return;
        }

        const profile = data?.profile || {};
        const toggles = data?.toggles || {};

        setProfileData({
          ...EMPTY_PROFILE,
          ...profile,
          role: 'Finance',
        });
        setToggleData({
          ...EMPTY_TOGGLES,
          ...toggles,
        });
        setInitialToggles({
          ...EMPTY_TOGGLES,
          ...toggles,
        });
        setLoadError('');
      } catch (requestError) {
        if (active) {
          setLoadError(requestError?.message || 'Unknown error while loading finance settings');
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
      setProfileData((current) => ({
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
      const response = await roleSettingsApi.updateFinanceProfile(userId, profileData);
      await loadRequestHistory();
      window.alert(response?.message || 'Credential change request submitted.');
    } catch (saveError) {
      window.alert(saveError?.message || 'Unable to submit profile request right now.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveToggles() {
    setSavingToggles(true);
    try {
      const updated = await roleSettingsApi.updateFinanceToggles(userId, toggleData);
      const mergedToggles = {
        ...EMPTY_TOGGLES,
        ...(updated?.toggles || updated || toggleData),
      };

      setToggleData(mergedToggles);
      setInitialToggles(mergedToggles);
      window.alert('Notification preferences saved.');
    } catch (saveError) {
      window.alert(saveError?.message || 'Unable to save notification preferences right now.');
    } finally {
      setSavingToggles(false);
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
        role: 'finance',
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
      role="finance"
      portalTitle="EduCore Finance Portal"
      userName={profileData.fullName || 'Finance User'}
      modePill="FINANCE MODE"
    >
      {loading ? (
        <div className="settings-load-state">Loading settings...</div>
      ) : (
        <>
          <SectionContainer title="Profile" subtitle="Update your account information.">
            <Card title="Profile Information">
              <div className="settings-grid-two">
                <FormInput
                  id="finance-full-name"
                  label="Full Name"
                  value={profileData.fullName}
                  onChange={(value) => setProfileData((current) => ({ ...current, fullName: value }))}
                />

                <FormInput
                  id="finance-email"
                  label="Email"
                  value={profileData.email}
                  onChange={(value) => setProfileData((current) => ({ ...current, email: value }))}
                />

                <FormInput
                  id="finance-phone"
                  label="Phone"
                  value={profileData.phone}
                  onChange={(value) => setProfileData((current) => ({ ...current, phone: value }))}
                />

                <FormInput
                  id="finance-department"
                  label="Department"
                  value={profileData.department}
                  onChange={(value) => setProfileData((current) => ({ ...current, department: value }))}
                />

                <FormInput
                  id="finance-address"
                  label="Address"
                  as="textarea"
                  spanTwo
                  value={profileData.address}
                  onChange={(value) => setProfileData((current) => ({ ...current, address: value }))}
                />

                <FormInput
                  id="finance-role"
                  label="Role"
                  value={profileData.role}
                  readOnly
                />

                <div className="settings-field">
                  <label>Profile Photo</label>
                  <ProfileAvatar
                    photo={profileData.photo}
                    alt="Finance profile"
                    initials={getInitials(profileData.fullName, 'F')}
                    inputRef={photoInputRef}
                    onFileChange={handlePhotoChange}
                    fileName={profileData.photoName}
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

          <SectionContainer title="Security" subtitle="Keep your finance account secure.">
            <div className="settings-grid-two">
              <FormInput
                id="finance-current-password"
                label="Current Password"
                type="password"
                spanTwo
                value={passwordData.currentPassword}
                onChange={(value) => setPasswordData((current) => ({ ...current, currentPassword: value }))}
              />

              <FormInput
                id="finance-new-password"
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(value) => setPasswordData((current) => ({ ...current, newPassword: value }))}
              />

              <FormInput
                id="finance-confirm-password"
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
            subtitle="Track submitted profile and password updates through admin approvals."
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

          <SectionContainer
            title="Notification Preferences"
            subtitle="Control real-time alert preferences for the finance module."
          >
            <div className="settings-toggle-list">
              <ToggleSwitch
                label="Payment Notifications"
                description="Receive alerts when payment transactions are recorded or updated."
                checked={toggleData.paymentNotifications}
                onChange={(checked) => setToggleData((current) => ({ ...current, paymentNotifications: checked }))}
              />

              <ToggleSwitch
                label="Refund Alerts"
                description="Get notified when refund requests are created or processed."
                checked={toggleData.refundAlerts}
                onChange={(checked) => setToggleData((current) => ({ ...current, refundAlerts: checked }))}
              />
            </div>

            <div className="settings-actions">
              <Button
                variant="muted"
                onClick={() => setToggleData(initialToggles)}
                disabled={savingToggles}
              >
                Reset
              </Button>
              <Button onClick={handleSaveToggles} disabled={savingToggles}>
                {savingToggles ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </SectionContainer>
        </>
      )}
    </RoleSettingsShell>
  );
}
