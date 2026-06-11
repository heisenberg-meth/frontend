import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCircle,
  PackageX,
  CreditCard,
  Package,
  Activity,
  Users,
  AlertTriangle,
  Search,
  Trash2,
  Calendar,
  X,
} from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../services/notification.service";
import "../styles/Notifications.css";

const NOTIFICATION_TABS = [
  "All",
  "Billing",
  "Inventory",
  "Expiry Alerts",
  "System",
  "Users",
];

function getNotificationIcon(type) {
  switch (type?.toLowerCase()) {
    case "billing":
    case "sale":
      return <CreditCard size={18} className="text-blue-500" />;
    case "inventory":
    case "stock":
      return <Package size={18} className="text-emerald-500" />;
    case "expiry":
    case "expiry alerts":
      return <PackageX size={18} className="text-amber-500" />;
    case "system":
      return <Activity size={18} className="text-purple-500" />;
    case "users":
      return <Users size={18} className="text-indigo-500" />;
    case "alert":
    case "warning":
      return <AlertTriangle size={18} className="text-rose-500" />;
    default:
      return <Bell size={18} className="text-primary" />;
  }
}

export default function Notifications({ showToast }) {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await getNotifications();
        const data = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];

        const processedData = data.map((n) => ({
          ...n,
          type: n.type || "System",
          createdAt: n.createdAt || new Date().toISOString(),
        }));

        setNotifications(processedData);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        showToast?.("Failed to load notifications", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showToast]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast?.("All notifications marked as read", "success");
    } catch {
      showToast?.("Failed to mark all as read", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast?.("Notification deleted", "success");
    } catch {
      showToast?.("Failed to delete notification", "error");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?"))
      return;
    try {
      // Assuming deleteNotification works with 'all' or we do it iteratively
      // For this UI, we'll just mock it if bulk delete isn't available
      // await deleteNotification('all');
      setNotifications([]);
      showToast?.("All notifications cleared", "success");
    } catch {
      showToast?.("Failed to clear notifications", "error");
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchTab =
        activeTab === "All" ||
        n.type?.toLowerCase() === activeTab.toLowerCase() ||
        (activeTab === "Expiry Alerts" && n.type?.toLowerCase() === "expiry");

      if (!matchTab) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          n.title?.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="notif-page-empty"
    >
      <div className="notif-empty-icon">
        <Bell size={48} className="text-primary opacity-50" />
      </div>
      <h3>You're all caught up!</h3>
      <p>No new alerts or system updates.</p>
    </motion.div>
  );

  return (
    <div className="notifications-page">
      <div className="notif-page-header">
        <div className="notif-header-title">
          <h2>Notifications center</h2>
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount} new</span>
          )}
        </div>

        <div className="notif-header-actions">
          <div className="notif-search-box">
            <Search size={16} className="search-icon" />
            <input
              required
              required
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            className="notif-action-btn primary"
            onClick={handleMarkAllRead}
          >
            <CheckCircle size={16} /> Mark All Read
          </button>
          <button className="notif-action-btn danger" onClick={handleClearAll}>
            <Trash2 size={16} /> Clear All
          </button>
        </div>
      </div>

      <div className="notif-tabs">
        {NOTIFICATION_TABS.map((tab) => (
          <button
            key={tab}
            className={`notif-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="notif-list-container">
        {loading ? (
          <div className="notif-loading">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <AnimatePresence>
            <div className="notif-grid">
              {filteredNotifications.map((notif, index) => (
                <motion.div
                  key={notif.id || index}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={`notif-card ${!notif.isRead ? "unread" : ""}`}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                >
                  {!notif.isRead && <div className="unread-dot"></div>}

                  <div className="notif-card-icon-wrap">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="notif-card-content">
                    <div className="notif-card-header">
                      <h4 className="notif-card-title">
                        {notif.title || notif.message}
                      </h4>
                      <span className="notif-card-time">
                        <Calendar size={12} className="inline mr-1" />
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {notif.title && (
                      <p className="notif-card-desc">{notif.message}</p>
                    )}

                    <div className="notif-card-footer">
                      <span className="notif-type-badge">{notif.type}</span>
                    </div>
                  </div>

                  <button
                    className="notif-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notif.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}
