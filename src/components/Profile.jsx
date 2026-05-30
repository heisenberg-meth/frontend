import { useState } from "react";
import {
  User,
  Mail,
  Store,
  ShieldCheck,
  Camera,
  Save,
  Key,
  Phone,
  BadgeCheck,
  Smartphone,
  ChevronRight,
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
import { motion, AnimatePresence } from "framer-motion";
import {
  updateProfile,
  changePassword,
  uploadAvatar,
  getActiveSessions,
  terminateSession,
} from "../services/profile.service";
import api from "../api";
import "../styles/Profile.css";

const getBackendOrigin = () => {
  const baseURL =
    api.defaults.baseURL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "https://medassist-backend-hryu.onrender.com/api";
  return baseURL.replace(/\/api\/?$/, "");
};

function Spinner({ size = 14 }) {
  return (
    <Loader2 size={size} style={{ animation: "spin 0.8s linear infinite" }} />
  );
}

export default function Profile({
  user,
  profileData,
  setShowAuthModal,
  showToast,
}) {
  const [formData, setFormData] = useState({
    fullName: profileData.fullName || user?.fullName || "",
    shopName: user?.shopName || "",
    email: profileData.email || user?.email || "",
    phone: user?.phone || profileData.phone || "",
    employeeId: user?.employeeId || "VM-2024-089",
  });
  console.log("PROFILE DATA:", profileData);
  console.log("USER DATA:", user);
  console.log("PROFILE AVATAR:", profileData?.avatar);
  console.log("USER AVATAR:", user?.avatar);

  const [activeModals, setActiveModals] = useState({
    photo: false,
    password: false,
    twoFactor: false,
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
    setActiveModals((prev) => ({ ...prev, [modal]: !prev[modal] }));

  const handleSync = async () => {
    setSyncing(true);
    try {
      await updateProfile(user.id, {
        fullName: formData.fullName,
        shopName: formData.shopName,
        phone: formData.phone,
      });
      setLastSyncTime("Just now");
      if (setShowAuthModal) setShowAuthModal(formData);
      showToast("Profile synchronized successfully", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to sync profile", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showToast("All password fields are required", "error");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
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
      setPasswordSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadAvatar(file);

      showToast("Avatar updated", "success");
      toggleModal("photo");

      window.location.reload();
    } catch (err) {
      showToast(
        err.response?.data?.error || "Failed to upload avatar",
        "error",
      );
    }
  };

  const loadSessions = async () => {
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

  const handleTerminateSession = async (sessionId) => {
    try {
      await terminateSession(sessionId);
      showToast("Session terminated", "success");
      await loadSessions();
    } catch (err) {
      showToast(
        err.response?.data?.error || "Failed to terminate session",
        "error",
      );
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

      <div className="profile-grid">
        <div className="profile-sidebar">
          <div className="profile-card-glass main-card">
            <div className="avatar-container">
              <div className="profile-avatar-large">
                <img
                  src={
                    profileData.avatar || user?.avatar
                      ? `${getBackendOrigin()}${profileData.avatar || user?.avatar}`
                      : `https://ui-avatars.com/api/?name=${formData.fullName || user?.username || "User"}&background=4FDBC8&color=0A0F1C`
                  }
                  alt="Profile"
                />
                <div
                  className="avatar-overlay"
                  onClick={() => toggleModal("photo")}
                >
                  <Camera size={24} />
                  <span>Change Photo</span>
                </div>
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
                {user?.role === "owner"
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
                Your primary professional credentials and facility
                identification.
              </p>
            </div>
            <div className="form-grid-2">
              <div className="input-v2">
                <label>
                  <User size={12} /> Full Professional Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="e.g. Dr. John Smith"
                />
              </div>
              <div className="input-v2">
                <label>
                  <Store size={12} /> Pharmacy / Node Name
                </label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) =>
                    setFormData({ ...formData, shopName: e.target.value })
                  }
                  placeholder="e.g. Viyan Central Pharma"
                />
              </div>
              <div className="input-v2">
                <label>
                  <Mail size={12} /> Registered Email
                </label>
                <div className="input-with-action">
                  <input type="text" value={formData.email} disabled />
                  <div className="input-actions">
                    <CheckCircle2 size={14} className="text-success" />
                    <button
                      className="action-icon-btn"
                      onClick={() => copyToClipboard(formData.email)}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="input-v2">
                <label>
                  <Phone size={12} /> Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="input-v2">
                <label>
                  <BadgeCheck size={12} /> Employee ID
                </label>
                <input type="text" value={formData.employeeId} disabled />
              </div>
              <div className="input-v2">
                <label>
                  <ShieldCheck size={12} /> Professional Role
                </label>
                <input
                  type="text"
                  value={
                    user?.role === "owner"
                      ? "Head Pharmacist / Owner"
                      : "Clinical Staff"
                  }
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="settings-card-glass">
            <div className="card-header">
              <h3>
                <Key size={18} /> Security & Operational Access
              </h3>
              <p>
                Manage your authentication layers and active session security.
              </p>
            </div>
            <div className="security-grid">
              <div className="security-main">
                <div className="security-action-row">
                  <div className="action-info">
                    <h4>Multi-Factor Authentication</h4>
                    <p>
                      Add an extra layer of security to your clinical account.
                    </p>
                  </div>
                  <button
                    className="toggle-btn-v2"
                    onClick={() => toggleModal("twoFactor")}
                  >
                    CONFIGURE
                  </button>
                </div>
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
              <div className="security-stats-card">
                <div className="stat-item">
                  <span className="label">Last Login</span>
                  <span className="value">Today, 09:42 AM</span>
                </div>
                <div className="stat-item">
                  <span className="label">Active Device</span>
                  <span className="value">MacBook Pro (Chrome)</span>
                </div>
                <div className="stat-item">
                  <span className="label">Session Status</span>
                  <span className="value status-active">Active Now</span>
                </div>
                <button
                  className="view-sessions-btn"
                  onClick={() => {
                    toggleModal("sessions");
                    loadSessions();
                  }}
                >
                  VIEW ALL SESSIONS <ChevronRight size={14} />
                </button>
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

      <AnimatePresence>
        {activeModals.photo && (
          <Modal
            title="Manage Profile Photo"
            onClose={() => toggleModal("photo")}
          >
            <div className="photo-modal-content">
              <div className="photo-preview-large">
                <img
                  src={
                    profileData.avatar || user?.avatar
                      ? `${getBackendOrigin()}${profileData.avatar || user?.avatar}`
                      : `https://ui-avatars.com/api/?name=${formData.fullName}&background=4FDBC8&color=0A0F1C`
                  }
                  alt="Preview"
                />
              </div>
              <div className="photo-actions">
                <label className="modal-action-btn primary">
                  <Camera size={18} /> Upload New Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
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
                <label>Current Password</label>
                <div className="input-with-action">
                  <input
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
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="input-v2">
                <label>New Password</label>
                <input
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
                <label>Confirm New Password</label>
                <input
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

        {activeModals.twoFactor && (
          <Modal
            title="Multi-Factor Authentication"
            onClose={() => toggleModal("twoFactor")}
          >
            <div className="tfa-modal-content">
              <div className="tfa-options">
                <div className="tfa-option active">
                  <div className="tfa-icon">
                    <Mail size={20} />
                  </div>
                  <div className="tfa-info">
                    <h4>Email Authentication (OTP)</h4>
                    <p>
                      Receive unique codes via your registered clinical email.
                    </p>
                  </div>
                  <div className="tfa-status">ACTIVE</div>
                </div>
                <div className="tfa-option">
                  <div className="tfa-icon">
                    <Smartphone size={20} />
                  </div>
                  <div className="tfa-info">
                    <h4>Authenticator App</h4>
                    <p>
                      Use Google Authenticator or Authy for secure token access.
                    </p>
                  </div>
                  <button className="option-enable-btn">ENABLE</button>
                </div>
                <div className="tfa-option">
                  <div className="tfa-icon">
                    <Smartphone size={20} />
                  </div>
                  <div className="tfa-info">
                    <h4>SMS Verification</h4>
                    <p>
                      Security codes sent directly to your verified phone
                      number.
                    </p>
                  </div>
                  <button className="option-enable-btn">ENABLE</button>
                </div>
              </div>
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
                  sessions
                    .filter((s) => !s.isCurrent)
                    .forEach((s) => handleTerminateSession(s.id));
                }}
              >
                <LogOut size={16} /> TERMINATE ALL OTHER SESSIONS
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay-v2">
      <motion.div
        className="modal-content-glass"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        <div className="modal-header-v2">
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body-v2">{children}</div>
      </motion.div>
    </div>
  );
}
