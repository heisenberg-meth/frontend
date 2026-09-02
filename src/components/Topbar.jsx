import { useNavigate } from "react-router-dom";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useEffectEvent,
  useTransition,
} from "react";
import { safeNumber } from "../utils/number.js";
import {
  getNotifications,
  markAllNotificationsRead,
} from "../services/notification.service";
import { TopbarSection1, TopbarSection2 } from "./Topbar/Topbar.jsx";
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

export default function Topbar({
  user,
  theme,
  toggleTheme,
  alertCount,
  onSignOut,
  subscription,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [recentSearches, setRecentSearches] = useState(() => {
    localStorage.removeItem("viyan-recent-searches");
    const saved = localStorage.getItem("viyan-recent-searches:v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState([]);
  const [, setNotificationsLoading] = useState(false);
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const res = await getNotifications();
        setNotifications(
          Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
              ? res.data
              : [],
        );
      } catch {
        // notification errors are non-critical
      } finally {
        setNotificationsLoading(false);
      }
    };
    loadNotifications();
    const handleUpdate = () => loadNotifications();
    window.addEventListener("notificationsUpdated", handleUpdate);
    return () =>
      window.removeEventListener("notificationsUpdated", handleUpdate);
  }, [setNotificationsLoading]);
  const handleSearchChange = (value) => {
    startTransition(() => {
      setSearchQuery(value);
      setSelectedIndex(-1);
    });
  };
  const handleCloseSearch = useCallback(() => {
    setShowSearchOverlay(false);
    startTransition(() => {
      setSearchQuery("");
      setActiveCategory("All");
      setSelectedIndex(-1);
    });
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
      localStorage.setItem("viyan-recent-searches:v1", JSON.stringify(updated));
    },
    [recentSearches],
  );
  const removeRecentSearch = (item, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== item);
    setRecentSearches(updated);
    localStorage.setItem("viyan-recent-searches:v1", JSON.stringify(updated));
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
      meta: `₹${safeNumber(inv.amount || 0).toFixed(2)} • ${inv.status}`,
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
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
        })),
      );
    } catch {
      // non-critical
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
  const handleKeys = useEffectEvent((e) => {
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
  });
  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, []);
  return (
    <>
      <TopbarSection1
        setShowSearchOverlay={setShowSearchOverlay}
        subscription={subscription}
        toggleTheme={toggleTheme}
        theme={theme}
        alertCount={alertCount}
        setShowNotifications={setShowNotifications}
        showNotifications={showNotifications}
        unreadCount={unreadCount}
        handleMarkAllRead={handleMarkAllRead}
        notifications={notifications}
        navigate={navigate}
        setShowProfileMenu={setShowProfileMenu}
        showProfileMenu={showProfileMenu}
        user={user}
        onSignOut={onSignOut}
      />

      <TopbarSection2
        showSearchOverlay={showSearchOverlay}
        handleCloseSearch={handleCloseSearch}
        searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        isPending={isPending}
        filteredResults={filteredResults}
        selectedIndex={selectedIndex}
        handleItemClick={handleItemClick}
        setSelectedIndex={setSelectedIndex}
        recentSearches={recentSearches}
        removeRecentSearch={removeRecentSearch}
        handleQuickAction={handleQuickAction}
      />
    </>
  );
}
