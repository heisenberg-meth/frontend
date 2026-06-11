import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { adminApi } from "../../services/admin.service";
import {
  LayoutDashboard, Users, Monitor, CreditCard, FileText, Flag, ShieldCheck, LogOut, Menu,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Users & Shops", icon: Users },
  { path: "/admin/devices", label: "Device Monitoring", icon: Monitor },
  { path: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
  { path: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
  { path: "/admin/admins", label: "Admin Users", icon: ShieldCheck },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = adminApi.getStoredAdmin();
    const token = adminApi.getStoredToken();
    if (!stored || !token) {
      navigate("/admin/login");
      return;
    }

    setAdmin(stored);
    setChecked(true);
  }, [navigate]);

  const handleLogout = async () => {
    await adminApi.logout();
    navigate("/admin/login");
  };

  if (!checked) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Verifying session...</p>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <ShieldCheck size={24} />
          <div>
            <strong>Viyan Admin</strong>
            <small>{admin.role}</small>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-admin-info">
            <span className="admin-name">{admin.name}</span>
            <span className="admin-email">{admin.email}</span>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-hamburger" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h2>{NAV_ITEMS.find((i) => i.path === location.pathname)?.label || "Admin"}</h2>
          <div className="admin-topbar-spacer" />
        </header>

        <div className="admin-content">
          <Outlet context={{ admin }} />
        </div>
      </div>
    </div>
  );
}
