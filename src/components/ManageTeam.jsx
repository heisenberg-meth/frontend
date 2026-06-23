import { useState, useCallback, useRef, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  UserPlus,
  ShieldAlert,
  Download,
  Filter,
  MoreVertical,
  ShieldCheck,
  Activity,
  Trash2,
  Camera,
  Upload,
  X,
  ShieldUser,
  Key,
  Clipboard,
  Fingerprint,
  Lock,
  Zap,
  Mail,
  User,
  Shield,
  Clock,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  uploadTeamAvatar,
} from "../services/profile.service";
import { getAvatarUrl } from "../utils/image.js";

const generateTempPassword = () => {
  const randomPart = Math.floor(1000 + (Date.now() % 9000));
  return `MedAssist!${randomPart}`;
};

export default function ManageTeam({ user, showToast }) {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("All Staff");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "Pharmacist",
    shift: "Day (7A-3P)",
  });

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await getTeamMembers();
      const data = res.data.data || res.data;
      setTeam(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to fetch clinical personnel", "error");
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    getTeamMembers()
      .then((res) => {
        if (active) {
          const data = res.data.data || res.data;
          setTeam(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (active) showToast("Failed to fetch clinical personnel", "error");
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const handleOnboard = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email)
      return showToast("Please fill all mandatory fields", "error");

    setLoading(true);
    try {
      const tempPassword = generateTempPassword();
      const payload = {
        email: form.email,
        password: tempPassword,
        name: form.fullName,
        role: form.role.toLowerCase(),
        shiftGroup: form.shift,
      };

      await inviteTeamMember(payload);
      setNewCredentials({ ...payload, loginUrl: window.location.origin });
      setShowSuccessModal(true);
      setForm({
        fullName: "",
        email: "",
        role: "Pharmacist",
        shift: "Day (7A-3P)",
      });
      fetchTeam();
    } catch (err) {
      showToast(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error generating invitation",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clinical clipboard", "success");
  };

  const openAvatarEdit = (memberId) => {
    setSelectedMemberId(memberId);
    setShowAvatarModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadTeamAvatar(selectedMemberId, file);
      showToast("Clinical profile image synchronized", "success");
      setShowAvatarModal(false);
      fetchTeam();
    } catch {
      showToast("Failed to upload assets", "error");
    } finally {
      setUploading(false);
    }
  };

  const removeMemberFn = async (id) => {
    if (id === user.id)
      return showToast("Cannot revoke primary owner access", "error");
    if (
      !window.confirm(
        "⚠ DE-AUTHORIZATION: This will revoke all system permissions. Proceed?",
      )
    )
      return;

    try {
      await removeTeamMember(id);
      showToast("Personnel de-authorized", "success");
      fetchTeam();
    } catch {
      showToast("Critical: Error removing staff", "error");
    }
  };

  const shiftGroups = ["Day (7A-3P)", "Evening (3P-11P)", "Night (11P-7A)"];
  const roles = ["Pharmacist", "Technician", "Inventory Mgr", "Administrator"];

  return (
    <div className="team-container-v2">
      <div className="team-header-v2">
        <div className="header-content">
          <div className="clinical-badge-row">
            <span className="badge-primary">SYSTEM NODE</span>
            <span className="badge-secondary">ADMINISTRATIVE CONTROL</span>
          </div>
          <h1>Clinical Personnel &amp; RBAC</h1>
          <p>
            Orchestrate pharmacy staff, manage biometric access, and audit
            real-time system interactions.
          </p>
        </div>
        <div className="header-stats">
          <div className="header-stat-box">
            <label>TOTAL STAFF</label>
            <div className="val-row">
              <span className="val">{team.length}</span>
              <Users size={20} style={{ color: "var(--info)" }} />
            </div>
          </div>
          <div className="header-stat-box">
            <label>ACTIVE SESSIONS</label>
            <div className="val-row">
              <span className="val">{Math.ceil(team.length * 0.4)}</span>
              <ShieldCheck size={20} style={{ color: "var(--primary)" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="team-grid">
        <div className="team-left-stack">
          <div className="team-card onboard">
            <div className="card-header">
              <div className="header-title">
                <UserPlus size={18} />
                <span>Personnel Onboarding</span>
              </div>
              <Zap size={14} style={{ color: "var(--warning)" }} />
            </div>
            <form className="card-body" onSubmit={handleOnboard}>
              <div className="input-v2">
                <label>
                  <User size={12} /> FULL NAME
                </label>
                <input
                  required
                  placeholder="e.g. Dr. Sarah Chen"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                />
              </div>
              <div className="input-v2">
                <label>
                  <Mail size={12} /> PROFESSIONAL EMAIL
                </label>
                <input
                  required
                  type="email"
                  placeholder="s.chen@viyanmed.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="input-v2">
                  <label>
                    <Shield size={12} /> ASSIGNED ROLE
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    {roles.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="input-v2">
                  <label>
                    <Clock size={12} /> SHIFT SLOT
                  </label>
                  <select
                    value={form.shift}
                    onChange={(e) =>
                      setForm({ ...form, shift: e.target.value })
                    }
                  >
                    {shiftGroups.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="onboard-btn" type="submit" disabled={loading}>
                {loading ? (
                  <RefreshCw size={16} className="spin" />
                ) : (
                  <ExternalLink size={16} />
                )}
                {loading ? "INITIALIZING NODE..." : "GENERATE INVITATION"}
              </button>
            </form>
          </div>

          <div className="team-card security-mfa">
            <div className="security-bg" />
            <div className="security-content">
              <div className="security-tag">
                <Lock size={12} /> MFA ACTIVE
              </div>
              <h3>Biometric Verification</h3>
              <p>
                Facial recognition required for Schedule II dispensations and
                inventory overrides.
              </p>
              <div className="fingerprint-scan">
                <Fingerprint size={32} />
                <div className="scan-line" />
              </div>
            </div>
          </div>
        </div>

        <div className="team-card registry">
          <div className="card-header">
            <div className="header-title">
              <Users size={18} />
              <span>Clinical Registry</span>
            </div>
            <div className="registry-tabs">
              {["All Staff", "Audit Logs", "Active"].map((t) => (
                <button
                  key={t}
                  className={`tab-btn ${activeTab === t ? "active" : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="registry-scroll">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>MEMBER PROFILE</th>
                  <th>RX RIGHTS</th>
                  <th>INV ACCESS</th>
                  <th>SETTLEMENT</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {team.map((m) => (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <td>
                        <div className="member-profile">
                          <div
                            className="avatar-wrap"
                            onClick={() => openAvatarEdit(m.id)}
                            style={{ position: "relative", overflow: "hidden" }}
                          >
                            <img
                              src={getAvatarUrl(m.avatar, m.fullName || m.username)}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <div
                              className="avatar-hover"
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(0,0,0,0.6)",
                                display: "flex",
                                alignItems: "center",
                                justifyCenter: "center",
                                opacity: 0,
                                transition: "opacity 0.2s",
                                color: "white",
                              }}
                            >
                              <Camera size={12} />
                            </div>
                          </div>
                          <div className="member-details">
                            <span className="name">
                              {m.fullName || m.username}
                            </span>
                            <span className="role">
                              {m.role === "OWNER"
                                ? "System Administrator"
                                : "Clinical Pharmacist"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="perm-cell">
                        {m.role === "OWNER" ? (
                          <CheckCircle2 size={16} className="perm-ok" />
                        ) : (
                          <XCircle size={16} className="perm-no" />
                        )}
                      </td>
                      <td className="perm-cell">
                        <CheckCircle2 size={16} className="perm-ok" />
                      </td>
                      <td className="perm-cell">
                        {m.role === "OWNER" ? (
                          <CheckCircle2 size={16} className="perm-ok" />
                        ) : (
                          <XCircle size={16} className="perm-no" />
                        )}
                      </td>
                      <td>
                        <span className="status-pill active">
                          <div
                            className="dot"
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "var(--success)",
                              marginRight: 8,
                            }}
                          />
                          ONLINE
                        </span>
                      </td>
                      <td>
                        <div className="action-row">
                          <button className="icon-btn">
                            <MoreVertical size={14} />
                          </button>
                          {user.role === "OWNER" && m.id !== user.id && (
                            <button
                              className="icon-btn delete"
                              onClick={() => removeMemberFn(m.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div className="registry-footer">
            <span>Synchronized with Global Staff Node</span>
            <div className="footer-links">
              <button>
                <Download size={14} /> Export Logs
              </button>
              <button>
                <Filter size={14} /> Refine View
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="team-footer-row">
        <div className="team-card logs">
          <div className="card-header">
            <div className="header-title">
              <Activity size={16} /> <span>System Access Logs</span>
            </div>
            <span className="log-count">REAL-TIME</span>
          </div>
          <div className="log-area">
            <div className="log-entry">
              <span className="time">10:42 AM</span>
              <span className="user">Dr. Sarah Chen</span>
              <span className="action">
                authorized Schedule II dispensation
              </span>
            </div>
            <div className="log-entry">
              <span className="time">09:15 AM</span>
              <span className="user">System</span>
              <span className="action">
                biometric node synchronized successfully
              </span>
            </div>
          </div>
        </div>

        <div className="team-card compliance">
          <div className="card-header">
            <div className="header-title">
              <ShieldAlert size={16} /> <span>Compliance Health</span>
            </div>
          </div>
          <div className="comp-body">
            <div className="comp-stat">
              <div className="val">98.4%</div>
              <label>TRAINING COMPLETION</label>
            </div>
            <div className="comp-bar-wrap">
              <div className="bar-fill" style={{ width: "98.4%" }} />
            </div>
            <button
              className="report-btn"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
              }}
            >
              AUDIT FULL SYSTEM <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAvatarModal && (
          <div className="modal-overlay">
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 440 }}
            >
              <div className="modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <ShieldUser size={20} style={{ color: "var(--primary)" }} />
                  <h3>Personnel Asset Update</h3>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowAvatarModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body-p">
                <div
                  className="upload-zone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <RefreshCw size={32} className="spin" />
                  ) : (
                    <>
                      <Upload size={32} />
                      <p>DRAG ASSET HERE OR CLICK TO BROWSE</p>
                      <span>Supports JPG, PNG, WEBP (Max 2MB)</span>
                    </>
                  )}
                  <input
                    required
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showSuccessModal && (
          <div className="modal-overlay">
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ maxWidth: 480 }}
            >
              <div className="modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Key size={20} style={{ color: "var(--primary)" }} />
                  <h3>Credential Generated</h3>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowSuccessModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="cred-body">
                <div className="cred-alert">
                  <ShieldAlert size={16} />
                  <span>ONE-TIME DISPLAY: Secure these keys immediately.</span>
                </div>

                <div className="cred-list">
                  <div className="cred-item">
                    <label>LOGIN GATEWAY</label>
                    <div className="val-box">
                      <span>{newCredentials?.loginUrl}</span>
                      <button
                        onClick={() =>
                          copyToClipboard(newCredentials?.loginUrl)
                        }
                      >
                        <Clipboard size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="cred-item">
                    <label>USERNAME</label>
                    <div className="val-box">
                      <span>{newCredentials?.email}</span>
                      <button
                        onClick={() => copyToClipboard(newCredentials?.email)}
                      >
                        <Clipboard size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="cred-item">
                    <label>ACCESS KEY</label>
                    <div
                      className="val-box secret"
                      style={{
                        background: "rgba(79, 219, 200, 0.05)",
                        borderColor: "var(--primary-glow)",
                      }}
                    >
                      <span
                        style={{ color: "var(--primary)", fontWeight: 800 }}
                      >
                        {newCredentials?.password}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(newCredentials?.password)
                        }
                      >
                        <Clipboard size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  className="confirm-btn"
                  onClick={() => setShowSuccessModal(false)}
                  style={{ width: "100%", marginTop: 24 }}
                >
                  I HAVE SECURED THE KEYS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
