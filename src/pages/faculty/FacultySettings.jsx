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
  role: 'Faculty',
  photo: null,
  photoName: '',
};

const EMPTY_TOGGLES = {
  courseNotifications: true,
  assignmentReminder: true,
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

export default function FacultySettings() {
  const session = getUserSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.role !== 'faculty') {
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
  const [error, setError] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingToggles, setSavingToggles] = useState(false);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [queueRequests, setQueueRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState('');

  async function loadCredentialRequests() {
    try {
      const [historyResponse, queueResponse] = await Promise.all([
        roleSettingsApi.getCredentialRequests('my'),
        roleSettingsApi.getCredentialRequests('faculty_queue'),
      ]);

      if (!mountedRef.current) {
        return;
      }

      setHistoryRequests(historyResponse?.data || []);
      setQueueRequests(queueResponse?.data || []);
    } catch {
      if (mountedRef.current) {
        setHistoryRequests([]);
        setQueueRequests([]);
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
        const data = await roleSettingsApi.getFacultySettings(userId);
        if (!active) {
          return;
        }

        const profile = data?.profile || {};
        const toggles = data?.toggles || {};

        setProfileData({
          ...EMPTY_PROFILE,
          ...profile,
          role: 'Faculty',
        });
        setToggleData({
          ...EMPTY_TOGGLES,
          ...toggles,
        });
        setInitialToggles({
          ...EMPTY_TOGGLES,
          ...toggles,
        });
        setError(false);
      } catch {
        if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();
    loadCredentialRequests();
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
      const response = await roleSettingsApi.updateFacultyProfile(userId, profileData);
      await loadCredentialRequests();
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
      const updated = await roleSettingsApi.updateFacultyToggles(userId, toggleData);
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
        role: 'faculty',
        currentPassword: passwordData.currentPassword,
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData(EMPTY_PASSWORD);
      await loadCredentialRequests();
      window.alert(response?.message || 'Password change request submitted.');
    } catch (saveError) {
      window.alert(saveError?.message || 'Unable to submit password request right now.');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleApproveRequest(requestId) {
    setProcessingRequestId(requestId);
    try {
      const comment = window.prompt('Approval comment (optional):', '') || '';
      const response = await roleSettingsApi.approveCredentialRequest(requestId, comment);
      await loadCredentialRequests();
      window.alert(response?.message || 'Request approved and forwarded to admin.');
    } catch (requestError) {
      window.alert(requestError?.message || 'Unable to approve request right now.');
    } finally {
      setProcessingRequestId('');
    }
  }

  async function handleRejectRequest(requestId) {
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      window.alert('Rejection reason is required.');
      return;
    }

    setProcessingRequestId(requestId);
    try {
      const response = await roleSettingsApi.rejectCredentialRequest(requestId, reason.trim());
      await loadCredentialRequests();
      window.alert(response?.message || 'Request rejected.');
    } catch (requestError) {
      window.alert(requestError?.message || 'Unable to reject request right now.');
    } finally {
      setProcessingRequestId('');
    }
  }

  if (error) {
    return <div className="settings-load-error">Unable to load settings. Please try again.</div>;
  }

  return (
    <RoleSettingsShell
      role="faculty"
      portalTitle="EduCore Faculty Portal"
      userName={profileData.fullName || 'Faculty User'}
    >
      {loading ? (
        <div className="settings-load-state">Loading settings...</div>
      ) : (
        <>
          <SectionContainer title="Profile" subtitle="Update your account information.">
            <Card title="Profile Information">
              <div className="settings-grid-two">
                <FormInput
                  id="faculty-full-name"
                  label="Full Name"
                  value={profileData.fullName}
                  onChange={(value) => setProfileData((current) => ({ ...current, fullName: value }))}
                />

                <FormInput
                  id="faculty-email"
                  label="Email"
                  value={profileData.email}
                  onChange={(value) => setProfileData((current) => ({ ...current, email: value }))}
                />

                <FormInput
                  id="faculty-phone"
                  label="Phone"
                  value={profileData.phone}
                  onChange={(value) => setProfileData((current) => ({ ...current, phone: value }))}
                />

                <FormInput
                  id="faculty-department"
                  label="Department"
                  value={profileData.department}
                  onChange={(value) => setProfileData((current) => ({ ...current, department: value }))}
                />

                <FormInput
                  id="faculty-address"
                  label="Address"
                  as="textarea"
                  spanTwo
                  value={profileData.address}
                  onChange={(value) => setProfileData((current) => ({ ...current, address: value }))}
                />

                <FormInput
                  id="faculty-role"
                  label="Role"
                  value={profileData.role}
                  readOnly
                />

                <div className="settings-field">
                  <label>Profile Photo</label>
                  <ProfileAvatar
                    photo={profileData.photo}
                    alt="Faculty profile"
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

          <SectionContainer title="Security" subtitle="Keep your faculty account secure.">
            <div className="settings-grid-two">
              <FormInput
                id="faculty-current-password"
                label="Current Password"
                type="password"
                spanTwo
                value={passwordData.currentPassword}
                onChange={(value) => setPasswordData((current) => ({ ...current, currentPassword: value }))}
              />

              <FormInput
                id="faculty-new-password"
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(value) => setPasswordData((current) => ({ ...current, newPassword: value }))}
              />

              <FormInput
                id="faculty-confirm-password"
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
            title="Approval Dashboard"
            subtitle="Review student credential requests that require faculty approval."
          >
            {loadingRequests ? (
              <div className="settings-request-empty">Loading approval queue...</div>
            ) : queueRequests.length ? (
              <div className="settings-request-list">
                {queueRequests.map((requestItem) => {
                  const requestId = requestItem.requestId || requestItem.id;
                  const isProcessing = processingRequestId === requestId;

                  return (
                    <article className="settings-request-item" key={requestId}>
                      <div className="settings-request-head">
                        <strong className="settings-request-title">{getRequestTypeLabel(requestItem.requestType)}</strong>
                        <span className="settings-request-status settings-request-status-pending">
                          {STATUS_LABELS[requestItem.status] || requestItem.statusLabel || 'Pending Faculty Approval'}
                        </span>
                      </div>
                      <p className="settings-request-meta">Request ID: {requestId}</p>
                      <p className="settings-request-meta">Requester: {requestItem.requesterUserId || 'Unknown'}</p>
                      <p className="settings-request-meta">Submitted: {formatRequestDate(requestItem.createdAt)}</p>
                      <p className="settings-request-meta">
                        Changed Fields: {(requestItem.changedFields || []).join(', ') || 'None'}
                      </p>
                      <p className="settings-request-meta">Requested Values: {formatMaskedChanges(requestItem)}</p>
                      <div className="settings-actions settings-actions-left">
                        <Button onClick={() => handleApproveRequest(requestId)} disabled={isProcessing}>
                          {isProcessing ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button
                          variant="muted"
                          onClick={() => handleRejectRequest(requestId)}
                          disabled={isProcessing}
                        >
                          Reject
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="settings-request-empty">No requests are waiting for faculty approval.</div>
            )}
          </SectionContainer>

          <SectionContainer
            title="Credential Requests"
            subtitle="Track your own profile and password requests across approval stages."
          >
            {loadingRequests ? (
              <div className="settings-request-empty">Loading request history...</div>
            ) : historyRequests.length ? (
              <div className="settings-request-list">
                {historyRequests.map((requestItem) => {
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
          </SectionContainer>

          <SectionContainer
            title="Notification Preferences"
            subtitle="Control class and assignment alerts for your faculty module."
          >
            <div className="settings-toggle-list">
              <ToggleSwitch
                label="Course Notifications"
                description="Receive updates for new classes, timetable changes, and course announcements."
                checked={toggleData.courseNotifications}
                onChange={(checked) => setToggleData((current) => ({ ...current, courseNotifications: checked }))}
              />

              <ToggleSwitch
                label="Assignment Reminder"
                description="Get reminder prompts for assignment deadlines and pending grading actions."
                checked={toggleData.assignmentReminder}
                onChange={(checked) => setToggleData((current) => ({ ...current, assignmentReminder: checked }))}
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
