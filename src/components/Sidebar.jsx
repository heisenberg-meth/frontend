import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UploadCloud,
  LogOut,
  HelpCircle,
  CreditCard,
  Package,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  CalendarClock,
  QrCode,
  ShieldCheck,
  Trash2,
  PackageX,
  History,
} from "lucide-react";

export default function Sidebar({ user, onSignOut }) {
  return (
    <aside className="sidebar-container">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img
            src="/viyan_logo.webp"
            alt="Viyan Medassist"
            className="sidebar-brand-image"
          />
        </div>
      </div>

      <nav className="sidebar-navigation">
        <div className="nav-group">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/stock"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Package size={18} />
            <span>Stock</span>
          </NavLink>
          <NavLink
            to="/billing"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <CreditCard size={18} />
            <span>Billing / POS</span>
          </NavLink>
          <NavLink
            to="/purchases"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <ShoppingCart size={18} />
            <span>Purchases</span>
          </NavLink>
          <NavLink
            to="/suppliers"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <QrCode size={18} />
            <span>Supplier</span>
          </NavLink>
          <NavLink
            to="/import"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <UploadCloud size={18} />
            <span>Import</span>
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <TrendingUp size={18} />
            <span>Sales</span>
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <BarChart3 size={18} />
            <span>Reports</span>
          </NavLink>
          <NavLink
            to="/expiry"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <CalendarClock size={18} />
            <span>Expiry & Batch</span>
          </NavLink>
          <NavLink
            to="/expiry/bulk-disposal"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Trash2 size={18} />
            <span>Bulk Disposal</span>
          </NavLink>
          <NavLink
            to="/expiry/disposal-history"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <History size={18} />
            <span>Disposal History</span>
          </NavLink>
          <NavLink
            to="/barcode"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <QrCode size={18} />
            <span>Barcode & QR</span>
          </NavLink>
          <NavLink
            to="/supplier-returns"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <PackageX size={18} />
            <span>Supplier Returns</span>
          </NavLink>

          {user?.role === "OWNER" && (
            <>
              {/* <NavLink
                to="/team"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <Users size={18} />
                <span>Team Management</span>
              </NavLink> */}
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <ShieldCheck size={18} />
                <span>System Settings</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>

      <div className="sidebar-actions">
        <div className="sidebar-footer-links">
          <a
            href="https://www.viyaninfo.com/contact"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="footer-link">
              <HelpCircle size={14} />
              <span>Help Center</span>
            </button>
          </a>
          <button className="footer-link logout" onClick={onSignOut}>
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
