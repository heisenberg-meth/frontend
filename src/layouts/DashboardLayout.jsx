import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardLayout({
  user,
  toggleTheme,
  theme,
  trialDaysLeft,
  setShowLogoutModal,
}) {
  return (
    <div className="app-shell" data-theme={theme}>
      <Sidebar user={user} onSignOut={() => setShowLogoutModal(true)} />

      <div className="main-area">
        <Topbar
          user={user}
          toggleTheme={toggleTheme}
          theme={theme}
          trialDays={
            user?.subscriptionStatus === "TRIAL" ? trialDaysLeft : null
          }
          onSignOut={() => setShowLogoutModal(true)}
        />

        <main className="main-content-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
