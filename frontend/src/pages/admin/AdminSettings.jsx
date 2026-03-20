import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { roleSettingsApi } from '../../api/roleSettingsApi';
import { getUserSession } from '../../auth/sessionController';
import RoleSettingsShell from '../../components/role-settings/RoleSettingsShell';
import {
  Button,
  FormInput,
  ProfileAvatar,
  SectionContainer,
} from '../../components/role-settings/SettingsPrimitives';

const EMPTY_PROFILE = {
  fullName: '',
  adminId: '',
  email: '',
  phone: '',
  photo: null,
  photoName: '',
};

const EMPTY_PASSWORD = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const EMPTY_SYSTEM = {
  collegeName: '',
  collegeLogo: null,
  collegeLogoName: '',
  address: '',
  contactEmail: '',
  phoneNumber: '',
};

const EMPTY_ACADEMIC = {
  departments: '',
  courses: '',
  semesters: '',
};

const STATUS_LABELS = {
  pending_faculty_approval: 'Pending Faculty Approval',
  pending_admin_approval: 'Pending Admin Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

function getInitials(name, fallback = 'A') {
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

export default function AdminSettings() {
  const session = getUserSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.role !== 'admin') {
    return <Navigate to={`/${session.role}/settings`} replace />;
  }

  const userId = session.userId;

  const profilePhotoInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const mountedRef = useRef(true);

  const [profileData, setProfileData] = useState(EMPTY_PROFILE);
  const [initialProfileData, setInitialProfileData] = useState(EMPTY_PROFILE);
  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORD);
  const [systemData, setSystemData] = useState(EMPTY_SYSTEM);
  const [initialSystemData, setInitialSystemData] = useState(EMPTY_SYSTEM);
  const [academicData, setAcademicData] = useState(EMPTY_ACADEMIC);
  const [initialAcademicData, setInitialAcademicData] = useState(EMPTY_ACADEMIC);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);
  const [savingAcademic, setSavingAcademic] = useState(false);
  const [queueRequests, setQueueRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState('');

  async function loadCredentialRequests() {
    try {
      const [queueResponse, allResponse] = await Promise.all([
        roleSettingsApi.getCredentialRequests('admin_queue'),
        roleSettingsApi.getCredentialRequests('all'),
      ]);

      if (!mountedRef.current) {
        return;
      }

      setQueueRequests(queueResponse?.data || []);
      setAllRequests(allResponse?.data || []);
    } catch {
      if (mountedRef.current) {
        setQueueRequests([]);
        setAllRequests([]);
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
        const [profile, system, academic] = await Promise.all([
          roleSettingsApi.getAdminProfile(userId),
          roleSettingsApi.getAdminSystem(),
          roleSettingsApi.getAdminAcademic(),
        ]);

        if (!active) {
          return;
        }

        const mergedProfile = {
          ...EMPTY_PROFILE,
          ...profile,
          adminId: profile?.adminId || userId,
        };
        const mergedSystem = {
          ...EMPTY_SYSTEM,
          ...system,
          collegeLogoName: system?.collegeLogoName || system?.collegeLogo || '',
        };
        const mergedAcademic = {
          ...EMPTY_ACADEMIC,
          ...academic,
        };

        setProfileData(mergedProfile);
        setInitialProfileData(mergedProfile);
        setSystemData(mergedSystem);
        setInitialSystemData(mergedSystem);
        setAcademicData(mergedAcademic);
        setInitialAcademicData(mergedAcademic);
        setLoadError('');
      } catch (requestError) {
        if (active) {
          setLoadError(requestError?.message || 'Unknown error while loading admin settings');
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

  async function handleProfilePhotoChange(event) {
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

  async function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setSystemData((current) => ({
        ...current,
        collegeLogo: dataUrl,
        collegeLogoName: file.name,
      }));
    } catch {
      window.alert('Unable to read selected file. Please choose another image.');
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const updated = await roleSettingsApi.updateAdminProfile(userId, profileData);
      const merged = {
        ...profileData,
        ...updated,
        adminId: updated?.adminId || userId,
      };

      setProfileData(merged);
      setInitialProfileData(merged);
      window.alert('Admin profile updated successfully.');
    } catch (saveError) {
      window.alert(saveError?.message || 'Unable to update admin profile right now.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveSystem() {
    setSavingSystem(true);
    try {
      const updated = await roleSettingsApi.updateAdminSystem(systemData);
      const merged = {
        ...systemData,
        ...updated,
      };

      setSystemData(merged);
      setInitialSystemData(merged);
      window.alert('System information saved successfully.');
    } catch (saveError) {
      window.alert(saveError?.message || 'Unable to save system information right now.');
    } finally {
      setSavingSystem(false);
    }
  }

  async function handleSaveAcademic() {
    setSavingAcademic(true);
    try {
      const updated = await roleSettingsApi.updateAdminAcademic(academicData);
      const merged = {
        ...academicData,
        ...updated,
      };

      setAcademicData(merged);
      setInitialAcademicData(merged);
      window.alert('Academic settings saved successfully.');
    } catch (saveError) {
      window.alert(saveError?.message || 'Unable to save academic settings right now.');
    } finally {
      setSavingAcademic(false);
    }
  }

  async function handleChangePassword() {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      window.alert('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await roleSettingsApi.changeAdminPassword({
        userId,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData(EMPTY_PASSWORD);
      window.alert('Password updated successfully.');
    } catch (saveError) {
      window.alert(saveError?.message || 'Unable to update password right now.');
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
      window.alert(response?.message || 'Request approved and applied.');
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

  if (loadError) {
    return <div className="settings-load-error">Unable to load settings. {loadError}</div>;
  }

  return (
    <RoleSettingsShell
      role="admin"
      portalTitle="EduCore Admin Portal"
      userName={profileData.fullName || 'Admin User'}
      modePill="ADMIN MODE"
    >
      {loading ? (
        <div className="settings-load-state">Loading settings...</div>
      ) : (
        <>
          <div className="settings-page-head">
            <div>
              <p className="settings-breadcrumb-text">Admin Access / Settings / Overview</p>
              <h1 className="settings-page-title">System Settings</h1>
            </div>
          </div>

          <SectionContainer
            title="Admin Profile"
            subtitle="Manage the admin personal account details and password."
          >
            <div className="settings-grid-two">
              <div className="settings-field settings-col-span-2">
                <label>Profile Photo</label>
                <ProfileAvatar
                  photo={profileData.photo}
                  alt="Admin profile"
                  initials={getInitials(profileData.fullName, 'A')}
                  inputRef={profilePhotoInputRef}
                  onFileChange={handleProfilePhotoChange}
                  fileName={profileData.photoName}
                />
              </div>

              <FormInput
                id="admin-full-name"
                label="Full Name"
                value={profileData.fullName}
                onChange={(value) => setProfileData((current) => ({ ...current, fullName: value }))}
              />

              <FormInput
                id="admin-admin-id"
                label="Admin ID"
                value={profileData.adminId}
                onChange={(value) => setProfileData((current) => ({ ...current, adminId: value }))}
              />

              <FormInput
                id="admin-email"
                label="Email"
                value={profileData.email}
                onChange={(value) => setProfileData((current) => ({ ...current, email: value }))}
              />

              <FormInput
                id="admin-phone"
                label="Phone Number"
                value={profileData.phone}
                onChange={(value) => setProfileData((current) => ({ ...current, phone: value }))}
              />
            </div>

            <div className="settings-actions">
              <Button
                variant="muted"
                onClick={() => setProfileData(initialProfileData)}
                disabled={savingProfile}
              >
                Reset
              </Button>
              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </SectionContainer>

          <SectionContainer title="Security" subtitle="Update password credentials for admin access.">
            <div className="settings-grid-two">
              <FormInput
                id="admin-current-password"
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(value) => setPasswordData((current) => ({ ...current, currentPassword: value }))}
              />

              <FormInput
                id="admin-new-password"
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(value) => setPasswordData((current) => ({ ...current, newPassword: value }))}
              />

              <FormInput
                id="admin-confirm-password"
                label="Confirm Password"
                type="password"
                spanTwo
                value={passwordData.confirmPassword}
                onChange={(value) => setPasswordData((current) => ({ ...current, confirmPassword: value }))}
              />
            </div>

            <div className="settings-actions">
              <Button onClick={handleChangePassword} disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Change Password'}
              </Button>
            </div>
          </SectionContainer>

          <SectionContainer
            title="Approval Dashboard"
            subtitle="Review and action credential requests that are pending admin approval."
          >
            {loadingRequests ? (
              <div className="settings-request-empty">Loading admin approval queue...</div>
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
                          {STATUS_LABELS[requestItem.status] || requestItem.statusLabel || 'Pending Admin Approval'}
                        </span>
                      </div>
                      <p className="settings-request-meta">Request ID: {requestId}</p>
                      <p className="settings-request-meta">Requester: {requestItem.requesterUserId || 'Unknown'}</p>
                      <p className="settings-request-meta">Role: {requestItem.requesterRole || 'Unknown'}</p>
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
              <div className="settings-request-empty">No requests are waiting for admin approval.</div>
            )}
          </SectionContainer>

          <SectionContainer
            title="Credential Request History"
            subtitle="View status, timeline, and masked change details for all credential requests."
          >
            {loadingRequests ? (
              <div className="settings-request-empty">Loading request history...</div>
            ) : allRequests.length ? (
              <div className="settings-request-list">
                {allRequests.map((requestItem) => {
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
                      <p className="settings-request-meta">Requester: {requestItem.requesterUserId || 'Unknown'}</p>
                      <p className="settings-request-meta">Role: {requestItem.requesterRole || 'Unknown'}</p>
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
              <div className="settings-request-empty">No credential requests found.</div>
            )}
          </SectionContainer>

          <SectionContainer
            title="System Information"
            subtitle="Manage core college details used in reports, dashboards, and documents."
          >
            <div className="settings-grid-two">
              <FormInput
                id="system-college-name"
                label="College Name"
                spanTwo
                value={systemData.collegeName}
                onChange={(value) => setSystemData((current) => ({ ...current, collegeName: value }))}
              />

              <div className="settings-field settings-col-span-2">
                <label>College Logo</label>
                <ProfileAvatar
                  photo={systemData.collegeLogo}
                  alt="College logo"
                  initials="C"
                  inputRef={logoInputRef}
                  onFileChange={handleLogoChange}
                  fileName={systemData.collegeLogoName}
                  buttonLabel="Change Logo"
                />
              </div>

              <FormInput
                id="system-address"
                label="Address"
                as="textarea"
                spanTwo
                value={systemData.address}
                onChange={(value) => setSystemData((current) => ({ ...current, address: value }))}
              />

              <FormInput
                id="system-contact-email"
                label="Contact Email"
                value={systemData.contactEmail}
                onChange={(value) => setSystemData((current) => ({ ...current, contactEmail: value }))}
              />

              <FormInput
                id="system-phone-number"
                label="Phone Number"
                value={systemData.phoneNumber}
                onChange={(value) => setSystemData((current) => ({ ...current, phoneNumber: value }))}
              />
            </div>

            <div className="settings-actions">
              <Button
                variant="muted"
                onClick={() => setSystemData(initialSystemData)}
                disabled={savingSystem}
              >
                Reset
              </Button>
              <Button onClick={handleSaveSystem} disabled={savingSystem}>
                {savingSystem ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </SectionContainer>

          <SectionContainer
            title="Academic Settings"
            subtitle="Define the academic structure for departments, courses/programs, and semesters."
          >
            <div className="settings-grid-two">
              <FormInput
                id="academic-departments"
                label="Departments"
                as="textarea"
                spanTwo
                value={academicData.departments}
                onChange={(value) => setAcademicData((current) => ({ ...current, departments: value }))}
              />

              <FormInput
                id="academic-courses"
                label="Courses / Programs"
                as="textarea"
                spanTwo
                value={academicData.courses}
                onChange={(value) => setAcademicData((current) => ({ ...current, courses: value }))}
              />

              <FormInput
                id="academic-semesters"
                label="Semesters"
                value={academicData.semesters}
                onChange={(value) => setAcademicData((current) => ({ ...current, semesters: value }))}
              />
            </div>

            <div className="settings-actions">
              <Button
                variant="muted"
                onClick={() => setAcademicData(initialAcademicData)}
                disabled={savingAcademic}
              >
                Reset
              </Button>
              <Button onClick={handleSaveAcademic} disabled={savingAcademic}>
                {savingAcademic ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </SectionContainer>
        </>
      )}
    </RoleSettingsShell>
  );
}
