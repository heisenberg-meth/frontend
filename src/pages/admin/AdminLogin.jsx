import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../services/admin.service";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminApi.login(email, password);
      if (res.success) {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-root">
      <div className="admin-login-bg" />
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-header">
          <ShieldCheck size={36} />
          <h1>Admin Panel</h1>
          <p>Viyan MedAssist Control Center</p>
        </div>

        {error && <div className="admin-login-error">{error}</div>}

        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@viyaninfo.com"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <div className="password-wrap">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw(!showPw)}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button className="admin-login-btn" type="submit" disabled={loading}>
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
