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
  PackageX,
  FileText,
  Truck,
  TrendingUp,
  Activity,
  AlertTriangle,
  Command,
  CreditCard,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { getAvatarUrl } from "../../utils/image.js";

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
function getNotifDropdownIcon(type) {
  switch (type?.toLowerCase()) {
    case "billing":
    case "sale":
      return <CreditCard size={16} className="text-blue-500" />;
    case "inventory":
    case "stock":
      return <Package size={16} className="text-emerald-500" />;
    case "expiry":
    case "expiry alerts":
      return <PackageX size={16} className="text-amber-500" />;
    case "system":
      return <Activity size={16} className="text-purple-500" />;
    case "alert":
    case "warning":
      return <AlertTriangle size={16} className="text-rose-500" />;
    default:
      return <Bell size={16} className="text-primary" />;
  }
}
export function TopbarSection1({
  setShowSearchOverlay,
  subscription,
  toggleTheme,
  theme,
  alertCount,
  setShowNotifications,
  showNotifications,
  unreadCount,
  handleMarkAllRead,
  notifications,
  navigate,
  setShowProfileMenu,
  showProfileMenu,
  user,
  onSignOut,
}) {
  return (
    <header className="top-app-bar">
      <div className="search-container">
        <div
          role="button"
          tabIndex={0}
          className="search-box"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
          onClick={() => setShowSearchOverlay(true)}
        >
          <Search size={18} className="search-icon" />
          <>
            <label htmlFor="field_1zkw4x" className="sr-only">
              Search analytics, stock, or clinical logs...
            </label>
            <input
              required
              type="text"
              placeholder="Search analytics, stock, or clinical logs..."
              readOnly
              id="field_1zkw4x"
            />
          </>
        </div>
      </div>

      <div className="top-bar-actions">
        <div className="action-icons">
          <AnimatePresence>
            {subscription && subscription.status === "EXPIRED" && (
              <m.div
                className="trial-badge expired"
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: 20,
                }}
                title="Subscription Expired"
                style={{
                  background: "#ef4444",
                  color: "#fff",
                }}
              >
                <Clock size={14} />
                <span>Subscription Expired | Upgrade Required</span>
              </m.div>
            )}
            {subscription &&
              (subscription.status === "ACTIVE" ||
                subscription.status === "TRIAL") && (
                <m.div
                  className="trial-badge"
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: 20,
                  }}
                  title={
                    subscription.status === "ACTIVE"
                      ? "Active Subscription"
                      : "Trial Period"
                  }
                >
                  <Clock size={14} />
                  <span>
                    {subscription.status === "ACTIVE"
                      ? `${subscription.planName} | `
                      : "Free Trial | "}
                    {subscription.daysRemaining}{" "}
                    {subscription.daysRemaining === 1 ? "Day" : "Days"} Left
                  </span>
                </m.div>
              )}
          </AnimatePresence>

          <button
            className="topbar-icon-btn"
            onClick={() => toggleTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div
            className="notification-wrap"
            style={{
              position: "relative",
            }}
          >
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
                <m.div
                  initial={{
                    opacity: 0,
                    y: 10,
                    scale: 0.95,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    scale: 0.95,
                  }}
                  className="notification-dropdown-panel"
                >
                  <div className="notif-header">
                    <div className="notif-header-left">
                      <h3>Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="notif-badge">{unreadCount} new</span>
                      )}
                    </div>
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
                      notifications.slice(0, 5).map((item) => (
                        <div
                          role="button"
                          tabIndex={0}
                          key={item.id}
                          className={`notif-item ${!item.isRead ? "unread" : ""}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.currentTarget.click();
                            }
                          }}
                          onClick={() => {
                            navigate("/notifications");
                            setShowNotifications(false);
                          }}
                        >
                          {!item.isRead && <div className="notif-unread-dot" />}
                          <div className="notif-item-icon">
                            {getNotifDropdownIcon(item.type)}
                          </div>
                          <div className="notif-item-content">
                            <h4 className="notif-item-title">
                              {item.title || item.type || "Notification"}
                            </h4>
                            <p className="notif-item-desc">{item.message}</p>
                            <span className="notif-item-time">Just now</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notif-dropdown-empty">
                        <div className="notif-empty-icon">
                          <Bell size={24} />
                        </div>
                        <h4>You're all caught up</h4>
                        <p>No new alerts or updates.</p>
                      </div>
                    )}
                  </div>
                  <button
                    className="notif-footer-btn"
                    onClick={() => {
                      navigate("/notifications");
                      setShowNotifications(false);
                    }}
                  >
                    View all notifications →
                  </button>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="divider-vertical"></div>

        <div
          className="profile-section-wrap"
          style={{
            position: "relative",
          }}
        >
          <div
            role="button"
            tabIndex={0}
            className={`user-profile clickable ${showProfileMenu ? "active" : ""}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.currentTarget.click();
              }
            }}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="user-info">
              <p className="user-display-name">
                {user?.fullName || user?.username || "Admin"}
              </p>
              <p className="user-display-role">
                {user?.role === "OWNER"
                  ? "Chief Pharmacist"
                  : "Staff Pharmacist"}
              </p>
            </div>
            <div className="user-avatar-box">
              <img
                src={getAvatarUrl(
                  user?.avatar,
                  user?.fullName || user?.username,
                )}
                onError={(e) => {
                  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.username || "NA")}&background=4FDBC8&color=0A0F1C`;
                  if (e.target.src !== fallback) {
                    e.target.src = fallback;
                  }
                }}
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
              <m.div
                initial={{
                  opacity: 0,
                  y: 10,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  scale: 0.95,
                }}
                className="profile-dropdown-menu"
              >
                <div className="dropdown-header">
                  <p className="dropdown-user">{user?.username}</p>
                  <p className="dropdown-email">
                    {user?.role === "OWNER"
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
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
export function TopbarSection2({
  showSearchOverlay,
  handleCloseSearch,
  searchQuery,
  handleSearchChange,
  activeCategory,
  setActiveCategory,
  isPending,
  filteredResults,
  selectedIndex,
  handleItemClick,
  setSelectedIndex,
  recentSearches,
  removeRecentSearch,
  handleQuickAction,
}) {
  return (
    <AnimatePresence>
      {showSearchOverlay && (
        <m.div
          role="button"
          tabIndex={0}
          className="global-search-overlay"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
          onClick={handleCloseSearch}
        >
          <m.div
            className="search-overlay-content"
            initial={{
              scale: 0.95,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            exit={{
              scale: 0.95,
              opacity: 0,
            }}
            transition={{
              duration: 0.18,
              ease: "easeOut",
            }}
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {/* Search Header */}
            <div className="search-input-wrap">
              <Search size={20} className="search-overlay-icon" />
              <>
                <label htmlFor="field_s74f2c" className="sr-only">
                  Search medicines, patients, suppliers, invoices, or
                  settings...
                </label>
                <input
                  required
                  autoFocus
                  type="text"
                  placeholder="Search medicines, patients, suppliers, invoices, or settings..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  id="field_s74f2c"
                />
              </>
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
              {isPending /* Skeleton Loader State */ ? (
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
                filteredResults.length >
                0 /* Search Results Flat with Highlights */ ? (
                  <div className="search-results-list">
                    {filteredResults.map((item, idx) => (
                      <div
                        role="button"
                        tabIndex={0}
                        key={item.id}
                        className={`search-result-item ${selectedIndex === idx ? "selected" : ""}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.currentTarget.click();
                          }
                        }}
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
                  </div> /* No Results State */
                ) : (
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
                        {recentSearches.map((item) => {
                          const label =
                            typeof item === "string"
                              ? item
                              : item?.text || item?.name || item?.query || "";
                          const key =
                            typeof item === "string"
                              ? `recent-search-${item}`
                              : item?.id || `recent-search-${label}`;
                          return (
                            <div
                              role="button"
                              tabIndex={0}
                              key={key}
                              className="recent-search-item"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.currentTarget.click();
                                }
                              }}
                              onClick={() => handleSearchChange(label)}
                            >
                              <Clock size={14} />
                              <span className="recent-text">{label}</span>
                              <button
                                className="remove-recent-btn"
                                onClick={(e) => removeRecentSearch(item, e)}
                                title="Remove"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })}
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
                          role="button"
                          tabIndex={0}
                          key={action.title}
                          className="quick-action-card"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.currentTarget.click();
                            }
                          }}
                          onClick={() => handleQuickAction(action.path)}
                        >
                          <div className="action-icon-wrap">{action.icon}</div>
                          <div className="action-details">
                            <span className="action-title">{action.title}</span>
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
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
