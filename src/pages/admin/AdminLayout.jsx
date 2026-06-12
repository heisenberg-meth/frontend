import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { adminApi } from "../../services/admin.service";
import {
  LayoutDashboard,
  Users,
  Monitor,
  CreditCard,
  FileText,
  Flag,
  ShieldCheck,
  Shield,
  DollarSign,
  BarChart3,
  Send,
  Clock,
  Ticket,
  Activity,
  Store,
  LogOut,
  Menu,
} from "lucide-react";

const NAV_ITEMS = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ROOT_ADMIN", "ADMIN", "SUPPORT", "SALES", "FINANCE"],
  },
  {
    path: "/admin/shops",
    label: "Shops",
    icon: Store,
    roles: ["ROOT_ADMIN", "ADMIN", "SUPPORT"],
  },
  {
    path: "/admin/users",
    label: "Users",
    icon: Users,
    roles: ["ROOT_ADMIN", "ADMIN", "SUPPORT"],
  },
  {
    path: "/admin/devices",
    label: "Device Monitoring",
    icon: Monitor,
    roles: ["ROOT_ADMIN", "ADMIN"],
  },
  {
    path: "/admin/subscriptions",
    label: "Subscriptions",
    icon: CreditCard,
    roles: ["ROOT_ADMIN", "ADMIN", "SUPPORT"],
  },
  {
    path: "/admin/revenue",
    label: "Revenue",
    icon: BarChart3,
    roles: ["ROOT_ADMIN", "ADMIN", "FINANCE"],
  },
  {
    path: "/admin/payments",
    label: "Payments",
    icon: DollarSign,
    roles: ["ROOT_ADMIN", "ADMIN", "FINANCE"],
  },
  {
    path: "/admin/expiry",
    label: "Expiry Alerts",
    icon: Clock,
    roles: ["ROOT_ADMIN", "ADMIN", "SUPPORT"],
  },
  {
    path: "/admin/system-health",
    label: "System Health",
    icon: Activity,
    roles: ["ROOT_ADMIN", "ADMIN"],
  },
  {
    path: "/admin/support-tickets",
    label: "Support Tickets",
    icon: Ticket,
    roles: ["ROOT_ADMIN", "ADMIN", "SUPPORT"],
  },
  {
    path: "/admin/broadcast",
    label: "Broadcast",
    icon: Send,
    roles: ["ROOT_ADMIN", "ADMIN"],
  },
  {
    path: "/admin/security",
    label: "Security Center",
    icon: Shield,
    roles: ["ROOT_ADMIN", "ADMIN"],
  },
  {
    path: "/admin/audit-logs",
    label: "Audit Logs",
    icon: FileText,
    roles: ["ROOT_ADMIN", "ADMIN", "SUPPORT", "SALES", "FINANCE"],
  },
  {
    path: "/admin/feature-flags",
    label: "Feature Flags",
    icon: Flag,
    roles: ["ROOT_ADMIN", "ADMIN"],
  },
  {
    path: "/admin/admins",
    label: "Admin Users",
    icon: ShieldCheck,
    roles: ["ROOT_ADMIN"],
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin] = useState(() => adminApi.getStoredAdmin());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthenticated = !!admin && !!adminApi.getStoredToken();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await adminApi.logout();
    navigate("/admin/login");
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Verifying session...</p>
      </div>
    );
  }

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
          {NAV_ITEMS.filter((item) => item.roles.includes(admin?.role)).map(
            (item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`admin-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            },
          )}
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

      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-hamburger"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h2>
            {NAV_ITEMS.find((i) => i.path === location.pathname)?.label ||
              "Admin"}
          </h2>
          <div className="admin-topbar-spacer" />
        </header>

        <div className="admin-content">
          <Outlet context={{ admin }} />
        </div>
      </div>
    </div>
  );
}
