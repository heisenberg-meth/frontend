import { useState, useRef } from "react";
import {
  User,
  Mail,
  Store,
  ShieldCheck,
  Camera,
  Save,
  Phone,
  BadgeCheck,
  Smartphone,
  LogOut,
  Copy,
  Eye,
  EyeOff,
  CloudLightning,
  CheckCircle2,
  Trash2,
  RefreshCcw,
  Zap,
  Loader2,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import api from "../api";
import {
  changePassword,
  getActiveSessions,
  terminateSession,
} from "../services/profile.service";
import { getAvatarUrl } from "../utils/image.js";
function Spinner({ size = 14 }) {
  return (
    <Loader2
      size={size}
      style={{
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}
function ProfileSection1({
  formData,
  user,
  toggleModal,
  setFormData,
  copyToClipboard,
  syncing,
  lastSyncTime,
  handleSync,
}) {
  return (
    <div className="profile-grid">
      <div className="profile-sidebar">
        <div className="profile-card-glass main-card">
          <div className="avatar-container">
            <div className="profile-avatar-large">
              <img
                src={getAvatarUrl(
                  user?.user?.profile?.avatar || user?.avatar,
                  formData.fullName || user?.username,
                )}
                onError={(e) => {
                  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || user?.username || "NA")}&background=4FDBC8&color=0A0F1C`;
                  if (e.target.src !== fallback) {
                    e.target.src = fallback;
                  }
                }}
                alt="Profile"
              />
              <button
                type="button"
                className="avatar-overlay"
                onClick={() => toggleModal("photo")}
              >
                <Camera size={24} />
                <span>Change Photo</span>
              </button>
            </div>
            <div className="verification-stack">
              <div className="verify-badge verified">
                <BadgeCheck size={14} />
                <span>Verified Pharmacist</span>
              </div>
              <div className="verify-badge secure">
                <ShieldCheck size={14} />
                <span>Secure Account</span>
              </div>
            </div>
          </div>
          <div className="profile-meta">
            <h2>{formData.fullName || "Clinical Professional"}</h2>
            <span className="role-tag">
              {user?.role === "OWNER"
                ? "System Administrator"
                : "Clinical Staff"}
            </span>
          </div>
          <div className="sync-info">
            <RefreshCcw size={12} className={syncing ? "spinning" : ""} />
            <span>Last synchronized: {lastSyncTime}</span>
          </div>
        </div>
      </div>

      <div className="settings-stack">
        <div className="settings-card-glass">
          <div className="card-header">
            <h3>
              <User size={18} /> General Information
            </h3>
            <p>
              Your primary professional credentials and facility identification.
            </p>
          </div>
          <div className="form-grid-2">
            <div className="input-v2">
              <label htmlFor="field_o99mva">
                <User size={12} /> Full Professional Name
              </label>
              <input
                id="field_o99mva"
                required
                type="text"
                value={formData.fullName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fullName: e.target.value,
                  })
                }
                placeholder="e.g. Dr. John Smith"
              />
            </div>
            <div className="input-v2">
              <label htmlFor="field_upj2jg">
                <Store size={12} /> Pharmacy / Node Name
              </label>
              <input
                id="field_upj2jg"
                required
                type="text"
                value={formData.shopName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shopName: e.target.value,
                  })
                }
                placeholder="e.g. Viyan Central Pharma"
              />
            </div>
            <div className="input-v2">
              <label htmlFor="field_zy4rwy">
                <Mail size={12} /> Registered Email
              </label>
              <div className="input-with-action">
                <input
                  id="field_zy4rwy"
                  required
                  type="text"
                  value={formData.email || ""}
                  disabled
                />
                <div className="input-actions">
                  <CheckCircle2 size={14} className="text-success" />
                  <button
                    aria-label="Action"
                    className="action-icon-btn"
                    onClick={() => copyToClipboard(formData.email)}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="input-v2">
              <label htmlFor="field_zagjgf">
                <Phone size={12} /> Phone Number
              </label>
              <input
                id="field_zagjgf"
                required
                type="text"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value,
                  })
                }
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="input-v2">
              <label htmlFor="field_howjed">
                <BadgeCheck size={12} /> Employee ID
              </label>
              <input
                id="field_howjed"
                required
                type="text"
                value={formData.employeeId}
                disabled
              />
            </div>
            <div className="input-v2">
              <label htmlFor="field_vc1y7f">
                <ShieldCheck size={12} /> Professional Role
              </label>
              <input
                id="field_vc1y7f"
                required
                type="text"
                value={
                  user?.role === "OWNER"
                    ? "Head Pharmacist / Owner"
                    : "Clinical Staff"
                }
                disabled
              />
            </div>
          </div>
        </div>

        <div className="settings-card-glass">
          <div className="security-grid">
            <div className="security-main">
              <div className="security-action-row">
                <div className="action-info">
                  <h4>Access Key Management</h4>
                  <p>
                    Update your professional password frequently for maximum
                    security.
                  </p>
                </div>
                <button
                  className="action-btn-outline"
                  onClick={() => toggleModal("password")}
                >
                  CHANGE PASSWORD
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          className={`save-profile-btn ${syncing ? "syncing" : ""}`}
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <CloudLightning size={18} className="sync-icon-anim" />{" "}
              SYNCHRONIZING WITH CLOUD...
            </>
          ) : (
            <>
              <Save size={18} /> SYNCHRONIZE CLINICAL PROFILE
            </>
          )}
        </button>
      </div>
    </div>
  );
}
function ProfileSection2({
  toggleModal,
  isUploadingRef,
  handleAvatarUpload,
  showToast,
  setPasswordData,
  passwordData,
  setShowPassword,
  showPassword,
  setPasswordStrength,
  handleTerminateSession,
  sessions,
  activeModals,
  user,
  formData,
  passwordStrength,
  handlePasswordChange,
  passwordSaving,
  sessionsLoading,
}) {
  return (
    <AnimatePresence>
      {activeModals.photo && (
        <Modal
          title="Manage Profile Photo"
          onClose={() => toggleModal("photo")}
        >
          <div className="photo-modal-content">
            <div className="photo-preview-large">
              <img
                src={getAvatarUrl(
                  user?.profile?.avatar || user?.avatar,
                  formData.fullName,
                )}
                alt="Preview"
              />
            </div>
            <div className="photo-actions">
              <label className="modal-action-btn primary">
                <Camera size={18} /> Upload New Photo
                <input
                  required
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={async (e) => {
                    if (isUploadingRef.current) return;
                    const file = e.target.files[0];
                    if (!file) return;
                    isUploadingRef.current = true;
                    try {
                      await handleAvatarUpload(file);
                      showToast("Avatar updated successfully", "success");
                      toggleModal("photo");
                    } catch (err) {
                      showToast("Failed to upload avatar", err);
                    } finally {
                      isUploadingRef.current = false;
                    }
                  }}
                />
              </label>
              <button className="modal-action-btn danger">
                <Trash2 size={18} /> Remove Current Photo
              </button>
            </div>
            <p className="modal-hint">
              Recommended: Square JPG or PNG, min 400x400px.
            </p>
          </div>
        </Modal>
      )}

      {activeModals.password && (
        <Modal
          title="Update Access Key"
          onClose={() => toggleModal("password")}
        >
          <div className="password-modal-content">
            <div className="input-v2">
              <label htmlFor="field_1w48xx">Current Password</label>
              <div className="input-with-action">
                <input
                  id="field_1w48xx"
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
                <button
                  className="action-icon-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="input-v2">
              <label htmlFor="field_yoq0fe">New Password</label>
              <input
                id="field_yoq0fe"
                required
                type="password"
                placeholder="Enter new password"
                value={passwordData.newPassword}
                onChange={(e) => {
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  });
                  setPasswordStrength(e.target.value.length * 10);
                }}
              />
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${Math.min(passwordStrength, 100)}%`,
                      background:
                        passwordStrength > 80
                          ? "var(--success)"
                          : passwordStrength > 40
                            ? "var(--warning)"
                            : "var(--danger)",
                    }}
                  />
                </div>
                <span>
                  Strength:{" "}
                  {passwordStrength > 80
                    ? "Robust"
                    : passwordStrength > 40
                      ? "Moderate"
                      : "Weak"}
                </span>
              </div>
            </div>
            <div className="input-v2">
              <label htmlFor="field_0in1ep">Confirm New Password</label>
              <input
                id="field_0in1ep"
                required
                type="password"
                placeholder="Repeat new password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>
            <button
              className="modal-submit-btn"
              onClick={handlePasswordChange}
              disabled={passwordSaving}
            >
              {passwordSaving ? (
                <>
                  <Spinner size={16} /> Updating...
                </>
              ) : (
                "UPDATE SECURITY CREDENTIALS"
              )}
            </button>
          </div>
        </Modal>
      )}

      {activeModals.sessions && (
        <Modal
          title="Active Device Sessions"
          onClose={() => toggleModal("sessions")}
        >
          <div className="sessions-modal-content">
            <div className="sessions-list">
              {sessionsLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--text-dim)",
                  }}
                >
                  <Spinner size={20} /> Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--text-dim)",
                  }}
                >
                  No active sessions found
                </div>
              ) : (
                sessions.map((s) => (
                  <div key={s.id} className="session-item">
                    <div className="device-icon">
                      <Smartphone size={20} />
                    </div>
                    <div className="session-info">
                      <h4>
                        {s.device || s.userAgent || "Unknown Device"}{" "}
                        {s.isCurrent && (
                          <span className="current-badge">THIS DEVICE</span>
                        )}
                      </h4>
                      <p>
                        {s.location || "Unknown"} • {s.ip || "—"}
                      </p>
                    </div>
                    {s.isCurrent ? (
                      <div className="session-status">Online</div>
                    ) : (
                      <button
                        className="revoke-btn"
                        onClick={() => handleTerminateSession(s.id)}
                      >
                        REVOKE
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <button
              className="logout-all-btn"
              onClick={() => {
                for (const s of sessions) {
                  if (!s.isCurrent) handleTerminateSession(s.id);
                }
              }}
            >
              <LogOut size={16} /> TERMINATE ALL OTHER SESSIONS
            </button>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
}
export default function Profile({
  user,
  profile,
  refreshProfile,
  handleAvatarUpload,
  showToast,
}) {
  const [formData, setFormData] = useState(() => profile || {});
  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (profile) {
      setFormData(profile);
    }
  }
  const [activeModals, setActiveModals] = useState({
    photo: false,
    password: false,
    sessions: false,
  });
  const [syncing, setSyncing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState("Just now");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const toggleModal = (modal) =>
    setActiveModals((prev) => ({
      ...prev,
      [modal]: !prev[modal],
    }));
  const syncingRef = useRef(false);
  const handleSync = async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await api.put("/auth/me", {
        fullName: formData.fullName,
        shopName: formData.shopName,
        phone: formData.phone,
      });
      setLastSyncTime("Just now");
      refreshProfile();
      showToast("Profile synchronized successfully", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to sync profile", "error");
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  };
  const passwordSavingRef = useRef(false);
  const handlePasswordChange = async () => {
    if (passwordSavingRef.current) return;
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showToast("All password fields are required", "error");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordPattern.test(passwordData.newPassword)) {
      showToast(
        "Password must be at least 8 characters and contain 1 uppercase, 1 lowercase, 1 number, and 1 special character",
        "error",
      );
      return;
    }
    passwordSavingRef.current = true;
    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showToast("Password updated successfully", "success");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toggleModal("password");
    } catch (err) {
      showToast(
        err.response?.data?.error || "Failed to change password",
        "error",
      );
    } finally {
      passwordSavingRef.current = false;
      setPasswordSaving(false);
    }
  };
  const loadSessions = async () => {
    if (sessionsLoading) return;
    setSessionsLoading(true);
    try {
      const res = await getActiveSessions();
      const data = res.data.data || res.data;
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };
  const isTerminatingRef = useRef(false);
  const isUploadingRef = useRef(false);
  const handleTerminateSession = async (sessionId) => {
    if (isTerminatingRef.current) return;
    isTerminatingRef.current = true;
    try {
      await terminateSession(sessionId);
      showToast("Session terminated", "success");
      await loadSessions();
    } catch (err) {
      showToast(
        err.response?.data?.error || "Failed to terminate session",
        "error",
      );
    } finally {
      isTerminatingRef.current = false;
    }
  };
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Email copied to clipboard", "success");
  };
  return (
    <div className="profile-container-v2">
      <div className="profile-header-v2">
        <div className="header-badge">
          <Zap size={12} /> ENTERPRISE NODE
        </div>
        <h1>Clinical Profile</h1>
        <p className="header-subtitle">
          Manage your professional identity and security credentials within the
          Viyan ecosystem.
        </p>
      </div>

      <ProfileSection1
        formData={formData}
        user={user}
        toggleModal={toggleModal}
        setFormData={setFormData}
        copyToClipboard={copyToClipboard}
        syncing={syncing}
        lastSyncTime={lastSyncTime}
        handleSync={handleSync}
      />

      <ProfileSection2
        toggleModal={toggleModal}
        isUploadingRef={isUploadingRef}
        handleAvatarUpload={handleAvatarUpload}
        showToast={showToast}
        setPasswordData={setPasswordData}
        passwordData={passwordData}
        setShowPassword={setShowPassword}
        showPassword={showPassword}
        setPasswordStrength={setPasswordStrength}
        handleTerminateSession={handleTerminateSession}
        sessions={sessions}
        activeModals={activeModals}
        user={user}
        formData={formData}
        passwordStrength={passwordStrength}
        handlePasswordChange={handlePasswordChange}
        passwordSaving={passwordSaving}
        sessionsLoading={sessionsLoading}
      />
    </div>
  );
}
function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay-v2">
      <m.div
        className="modal-content-glass"
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}
      >
        <div className="modal-header-v2">
          <h3>{title}</h3>
          <button
            className="modal-close-btn"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-body-v2">{children}</div>
      </m.div>
    </div>
  );
}
