import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  getNotifications,
  markAllNotificationsRead,
} from "../services/notification.service";
import { globalSearch } from "../services/global-search.service.js";
import { TopbarSection1, TopbarSection2 } from "./Topbar/Topbar.jsx";

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
  const [filteredResults, setFilteredResults] = useState([]);
  const [isPending, setIsPending] = useState(false);
  const searchAbortRef = useRef(null);
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
    setSearchQuery(value);
    setSelectedIndex(-1);
    if (!value.trim()) {
      searchAbortRef.current?.abort();
      setFilteredResults([]);
      setIsPending(false);
    } else {
      setIsPending(true);
    }
  };

  const handleCloseSearch = useCallback(() => {
    searchAbortRef.current?.abort();
    setShowSearchOverlay(false);
    setSearchQuery("");
    setActiveCategory("All");
    setFilteredResults([]);
    setIsPending(false);
    setSelectedIndex(-1);
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
      if (!item) return;
      if (searchQuery.trim()) addRecentSearch(searchQuery.trim());
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

  const handleCategorySelect = useCallback(
    (cat) => {
      setActiveCategory(cat);

      if (!searchQuery.trim()) {
        if (cat !== "All") {
          const categoryPaths = {
            Medicines: "/inventory",
            Suppliers: "/suppliers",
            Invoices: "/billing",
            Prescriptions: "/prescriptions",
            Analytics: "/analytics",
            Settings: "/settings",
            Patients: "/patients",
          };

          const targetPath = categoryPaths[cat];
          if (targetPath) {
            handleCloseSearch();
            navigate(targetPath);
          }
        }
      } else {
        setIsPending(true);
      }
    },
    [searchQuery, handleCloseSearch, navigate],
  );

  // Debounced API-driven search with AbortController
  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      return;
    }

    const controller = new AbortController();
    searchAbortRef.current?.abort();
    searchAbortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        setIsPending(true);
        const response = await globalSearch({
          q: query,
          category: activeCategory,
          limit: 20,
          signal: controller.signal,
        });

        const results =
          response?.data?.data?.results || response?.data?.results || [];

        setFilteredResults(Array.isArray(results) ? results : []);
      } catch (error) {
        if (
          error?.name !== "CanceledError" &&
          error?.code !== "ERR_CANCELED" &&
          !axios.isCancel(error)
        ) {
          console.error("Global search failed:", error);
          setFilteredResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsPending(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, activeCategory]);
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
  const handleKeys = useCallback(
    (e) => {
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
    },
    [showSearchOverlay, filteredResults, selectedIndex, handleItemClick],
  );
  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [handleKeys]);
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
        setActiveCategory={handleCategorySelect}
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
