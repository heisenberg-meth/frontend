import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search,
  Bell,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Clock,
  X,
  ArrowRight,
  Package,
  FileText,
  Truck,
  TrendingUp,
  Activity,
  Command,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getBackendOrigin } from "../api.js";
import {
  getNotifications,
  markAllNotificationsRead,
} from "../services/notification.service";

const SEARCH_PATIENTS = [];
const SEARCH_SUPPLIERS = [];
const SEARCH_INVOICES = [];
const SEARCH_PRESCRIPTIONS = [];
const SEARCH_ANALYTICS = [
  {
    id: "AN-01",
    name: "Daily Revenue Summary",
    desc: "View sales patterns and daily performance logs",
    path: "/analytics",
  },
  {
    id: "AN-02",
    name: "Low Stock Alert Intelligence",
    desc: "Check reorder thresholds and predictive restocks",
    path: "/lowstock",
  },
  {
    id: "AN-03",
    name: "Expiry Batch Intelligence",
    desc: "View batches nearing shelf-life threshold",
    path: "/expiry",
  },
  {
    id: "AN-04",
    name: "Reports Hub & CSV Export",
    desc: "Export billing and inventory reconciliation logs",
    path: "/reports",
  },
];

const SEARCH_SETTINGS = [
  {
    id: "ST-01",
    name: "System Settings",
    desc: "Configure low stock threshold and alerts",
    path: "/settings",
  },
  {
    id: "ST-02",
    name: "Profile Management",
    desc: "Configure your clinical credentials and password",
    path: "/profile",
  },
  {
    id: "ST-03",
    name: "Team Management",
    desc: "Add new staff members and configure access permissions",
    path: "/team",
  },
  {
    id: "ST-04",
    name: "Database Reset / Clear Inventory",
    desc: "Erase all inventory rows and start fresh",
    path: "/settings",
    action: "clear_db",
  },
];

function getCategoryIcon(cat) {
  switch (cat) {
    case "Medicines":
      return <Package size={12} />;
    case "Patients":
      return <User size={12} />;
    case "Suppliers":
      return <Truck size={12} />;
    case "Invoices":
      return <FileText size={12} />;
    case "Prescriptions":
      return <FileText size={12} />;
    case "Analytics":
      return <Activity size={12} />;
    case "Settings":
      return <Settings size={12} />;
    default:
      return null;
  }
}

function getItemIcon(type) {
  switch (type) {
    case "Medicines":
      return <Package size={16} />;
    case "Patients":
      return <User size={16} />;
    case "Suppliers":
      return <Truck size={16} />;
    case "Invoices":
      return <CreditCard size={16} />;
    case "Prescriptions":
      return <FileText size={16} />;
    case "Analytics":
      return <Activity size={16} />;
    case "Settings":
      return <Settings size={16} />;
    default:
      return <Search size={16} />;
  }
}

export default function Topbar({
  user,
  theme,
  toggleTheme,
  alertCount,
  onSignOut,
  trialDays,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("viyan-recent-searches");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  console.log("TOPBAR USER:", user);
  console.log("TOPBAR AVATAR:", user?.avatar);
  console.log(
    "TOPBAR AVATAR URL:",
    user?.avatar ? `${getBackendOrigin()}${user.avatar}` : "NO AVATAR",
  );

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const res = await getNotifications();
        console.log("NOTIFICATION RESPONSE", res);
        setNotifications(
          Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
              ? res.data
              : [],
        );
        console.log("NOTIFICATION DATA", res?.data);
      } catch (err) {
        console.error("Notification fetch failed", err);
      } finally {
        setNotificationsLoading(false);
      }
    };
    loadNotifications();
  }, []);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setSelectedIndex(-1);

    if (value.trim()) {
      setIsLoading(true);
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 250);
    } else {
      setIsLoading(false);
    }
  };

  const handleCloseSearch = useCallback(() => {
    setShowSearchOverlay(false);
    setSearchQuery("");
    setActiveCategory("All");
    setSelectedIndex(-1);
    setIsLoading(false);
  }, []);
  const addRecentSearch = useCallback(
    (query) => {
      if (!query.trim()) return;
      const clean = query.trim();
      const updated = [
        clean,
        ...recentSearches.filter((s) => s !== clean),
      ].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("viyan-recent-searches", JSON.stringify(updated));
    },
    [recentSearches],
  );

  const removeRecentSearch = (item, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== item);
    setRecentSearches(updated);
    localStorage.setItem("viyan-recent-searches", JSON.stringify(updated));
  };

  const handleItemClick = useCallback(
    (item) => {
      if (searchQuery) addRecentSearch(searchQuery);
      if (item.original?.action === "clear_db") {
        navigate("/settings");
      } else if (item.path) {
        navigate(item.path);
      }
      handleCloseSearch();
    },
    [searchQuery, addRecentSearch, handleCloseSearch, navigate],
  );

  const handleQuickAction = useCallback(
    (path) => {
      navigate(path);
      handleCloseSearch();
    },
    [handleCloseSearch, navigate],
  );

  const allSearchableItems = useMemo(() => {
    const patientsList = SEARCH_PATIENTS.map((p) => ({
      type: "Patients",
      id: `pat-${p.id}`,
      title: p.name,
      subtitle: `Age: ${p.age}y • Gender: ${p.gender}`,
      meta: `conditions: ${p.conditions}`,
      path: "/patients",
      original: p,
    }));
    const suppliersList = SEARCH_SUPPLIERS.map((s) => ({
      type: "Suppliers",
      id: `sup-${s.id}`,
      title: s.name,
      subtitle: `Contact: ${s.contact}`,
      meta: `${s.categories} • ${s.reliability} Reliable`,
      path: "/suppliers",
      original: s,
    }));
    const invoicesList = SEARCH_INVOICES.map((inv) => ({
      type: "Invoices",
      id: `inv-${inv.id}`,
      title: inv.id,
      subtitle: `Patient: ${inv.patient}`,
      meta: `₹${Number(inv.amount || 0).toFixed(2)} • ${inv.status}`,
      path: "/billing",
      original: inv,
    }));
    const rxList = SEARCH_PRESCRIPTIONS.map((rx) => ({
      type: "Prescriptions",
      id: `rx-${rx.id}`,
      title: rx.id,
      subtitle: `Patient: ${rx.patient} • Doctor: ${rx.doctor}`,
      meta: `Meds: ${rx.meds.join(", ")}`,
      path: "/prescriptions",
      original: rx,
    }));
    const analyticsList = SEARCH_ANALYTICS.map((an) => ({
      type: "Analytics",
      id: `an-${an.id}`,
      title: an.name,
      subtitle: an.desc,
      meta: "Analytics Workspace",
      path: an.path,
      original: an,
    }));
    const settingsList = SEARCH_SETTINGS.map((st) => ({
      type: "Settings",
      id: `st-${st.id}`,
      title: st.name,
      subtitle: st.desc,
      meta: "System Configuration",
      path: st.path,
      original: st,
    }));
    return [
      ...patientsList,
      ...suppliersList,
      ...invoicesList,
      ...rxList,
      ...analyticsList,
      ...settingsList,
    ];
  }, []);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allSearchableItems.filter((item) => {
      if (activeCategory !== "All" && item.type !== activeCategory)
        return false;
      return (
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.meta.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, activeCategory, allSearchableItems]);

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.isRead).length
    : 0;

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  useEffect(() => {
    if (!showNotifications) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
      }
    };
    const handleClickOutside = (e) => {
      const panel = document.querySelector(".notification-dropdown-panel");
      const btn = e.target.closest(".notif-wrap");
      if (panel && !panel.contains(e.target) && !btn) {
        setShowNotifications(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCloseSearch();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setShowSearchOverlay(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseSearch]);

  useEffect(() => {
    const handleKeys = (e) => {
      if (!showSearchOverlay) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredResults.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredResults.length - 1,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
          handleItemClick(filteredResults[selectedIndex]);
        }
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [showSearchOverlay, selectedIndex, handleItemClick, filteredResults]);

  return (
    <>
      <header className="top-app-bar">
        <div className="search-container">
          <div
            className="search-box"
            onClick={() => setShowSearchOverlay(true)}
          >
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search analytics, stock, or clinical logs..."
              readOnly
            />
          </div>
        </div>

        <div className="top-bar-actions">
          <div className="action-icons">
            <button
              className="topbar-icon-btn"
              onClick={() => toggleTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <AnimatePresence>
              {trialDays !== null && (
                <motion.div
                  className="trial-badge"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  title="Trial Period"
                >
                  <Clock size={14} />
                  <span>
                    {trialDays} {trialDays === 1 ? "Day" : "Days"} Left
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="notification-wrap" style={{ position: "relative" }}>
              <button
                className={`topbar-icon-btn notif-wrap ${showNotifications ? "active" : ""}`}
                title="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {alertCount > 0 && (
                  <span className="notif-indicator">{alertCount}</span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="notification-dropdown-panel"
                  >
                    <div className="notif-header">
                      <h3>
                        Notifications
                        {unreadCount > 0 ? ` (${unreadCount})` : ""}
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          className="mark-read-btn"
                          onClick={handleMarkAllRead}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifications.length > 0 ? (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className="notif-item"
                            onClick={() => {
                              if (item.path) navigate(item.path);
                              setShowNotifications(false);
                            }}
                          >
                            <div
                              className="notif-dot"
                              style={{
                                backgroundColor: item.color || "var(--primary)",
                              }}
                            />
                            <span className="notif-text">{item.message}</span>
                          </div>
                        ))
                      ) : (
                        <div className="notif-empty">No notifications yet</div>
                      )}
                    </div>
                    <button
                      className="notif-footer-btn"
                      onClick={() => navigate("/logs")}
                    >
                      View all notifications →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="divider-vertical"></div>

          <div
            className="profile-section-wrap"
            style={{ position: "relative" }}
          >
            <div
              className={`user-profile clickable ${showProfileMenu ? "active" : ""}`}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="user-info">
                <p className="user-display-name">
                  {user?.fullName || user?.username || "Admin"}
                </p>
                <p className="user-display-role">
                  {user?.role === "owner"
                    ? "Chief Pharmacist"
                    : "Staff Pharmacist"}
                </p>
              </div>
              <div className="user-avatar-box">
                <img
                  src={
                    user?.avatar
                      ? `${getBackendOrigin()}${user.avatar}`
                      : "https://lh3.googleusercontent.com/aida-public/AB6AXuDOWTd17Gl-b_EvhxP0GeXFk1px5aRS9edSLFf-k5bbLogrEN2yGjKCGGLxCoZNPABWuQ6WkF5_aS6aSYNBoksUikeQzv7CaPt4_LyjhOTV8QnYSkUf-POs5i2xBGCHsBSLSBLwrCi8svtoSHH9zg9k64OlZASXi20fnl6MRsJ5ouZdweM-j8uvCNWquJ5pfVVeiRmoVg5NOqU53_GMI0A9UImQllhc0yVHipNCPCfreNuoiiW59KhFveohAc3xrtL5rB3XFpdGS-NM"
                  }
                  className="avatar-img"
                  alt="Profile"
                />
                <div className="avatar-chevron">
                  <ChevronDown size={12} />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="profile-dropdown-menu"
                >
                  <div className="dropdown-header">
                    <p className="dropdown-user">{user?.username}</p>
                    <p className="dropdown-email">
                      {user?.role === "owner"
                        ? "Administrator"
                        : "Pharmacy Staff"}
                    </p>
                  </div>
                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/profile");
                      setShowProfileMenu(false);
                    }}
                  >
                    <User size={16} />
                    <span>Profile Settings</span>
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/settings");
                      setShowProfileMenu(false);
                    }}
                  >
                    <Settings size={16} />
                    <span>System Settings</span>
                  </button>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item logout"
                    onClick={() => {
                      onSignOut();
                      setShowProfileMenu(false);
                    }}
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showSearchOverlay && (
          <motion.div
            className="global-search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseSearch}
          >
            <motion.div
              className="search-overlay-content"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Header */}
              <div className="search-input-wrap">
                <Search size={20} className="search-overlay-icon" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search medicines, patients, suppliers, invoices, or settings..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                <div className="search-input-actions">
                  {searchQuery && (
                    <button
                      className="clear-query-btn"
                      onClick={() => handleSearchChange("")}
                      title="Clear query"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <kbd className="esc-badge">ESC</kbd>
                </div>
              </div>

              {/* Categories Navigation */}
              <div className="search-categories">
                {[
                  "All",
                  "Medicines",
                  "Patients",
                  "Suppliers",
                  "Invoices",
                  "Prescriptions",
                  "Analytics",
                  "Settings",
                ].map((cat) => (
                  <button
                    key={cat}
                    className={`search-cat-pill ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                  </button>
                ))}
              </div>

              {/* Main Content Area */}
              <div className="search-results-area">
                {isLoading ? (
                  /* Skeleton Loader State */
                  <div className="skeleton-loader-container">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="skeleton-row">
                        <div className="skeleton-icon" />
                        <div className="skeleton-text-group">
                          <div className="skeleton-title" />
                          <div className="skeleton-subtitle" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  filteredResults.length > 0 ? (
                    /* Search Results Flat with Highlights */
                    <div className="search-results-list">
                      {filteredResults.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`search-result-item ${selectedIndex === idx ? "selected" : ""}`}
                          onClick={() => handleItemClick(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <div className="item-icon-box">
                            {getItemIcon(item.type)}
                          </div>
                          <div className="result-info">
                            <span className="result-title">{item.title}</span>
                            <span className="result-sub">{item.subtitle}</span>
                            <span className="result-meta-tag">{item.meta}</span>
                          </div>
                          <div className="item-action-indicator">
                            <span className="badge-category">{item.type}</span>
                            <ArrowRight size={14} className="result-arrow" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* No Results State */
                    <div className="search-empty">
                      <div className="empty-icon-wrap">
                        <Search size={32} />
                      </div>
                      <h3>No results found for "{searchQuery}"</h3>
                      <p>
                        Check spelling or filter by a specific category above.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="search-landing-grid">
                    <div className="landing-column">
                      <h4>Recent Searches</h4>
                      {recentSearches.length > 0 ? (
                        <div className="recent-searches-list">
                          {recentSearches.map((item) => (
                            <div
                              key={item}
                              className="recent-search-item"
                              onClick={() => handleSearchChange(item)}
                            >
                              <Clock size={14} />
                              <span className="recent-text">{item}</span>
                              <button
                                className="remove-recent-btn"
                                onClick={(e) => removeRecentSearch(item, e)}
                                title="Remove"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-recent">
                          <p>No recent searches</p>
                        </div>
                      )}
                    </div>
                    <div className="landing-column">
                      <h4>Quick Actions</h4>
                      <div className="quick-actions-grid">
                        {[
                          {
                            title: "New Billing",
                            path: "/billing",
                            desc: "Create new patient bill",
                            icon: <CreditCard size={16} />,
                          },
                          {
                            title: "Stock Entry",
                            path: "/stock",
                            desc: "Add or adjust stock SKUs",
                            icon: <Package size={16} />,
                          },
                          {
                            title: "Low Stock Alert",
                            path: "/lowstock",
                            desc: "View clinical low items",
                            icon: <TrendingUp size={16} />,
                          },
                          {
                            title: "Sales Analytics",
                            path: "/analytics",
                            desc: "Monitor store telemetry",
                            icon: <Activity size={16} />,
                          },
                        ].map((action) => (
                          <div
                            key={action.title}
                            className="quick-action-card"
                            onClick={() => handleQuickAction(action.path)}
                          >
                            <div className="action-icon-wrap">
                              {action.icon}
                            </div>
                            <div className="action-details">
                              <span className="action-title">
                                {action.title}
                              </span>
                              <span className="action-desc">{action.desc}</span>
                            </div>
                            <ArrowRight size={14} className="action-arrow" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Footer */}
              <div className="search-footer-hint">
                <div className="keyboard-shortcuts-guide">
                  <span>
                    <kbd>↑↓</kbd> Navigate
                  </span>
                  <span>
                    <kbd>Enter</kbd> Select
                  </span>
                  <span>
                    <kbd>ESC</kbd> Close
                  </span>
                </div>
                <div className="search-powered-by">
                  <Command size={10} />
                  <span>Command Palette</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
