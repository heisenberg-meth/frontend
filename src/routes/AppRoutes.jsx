import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "../guards/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import Auth from "../components/Auth";
import PageErrorBoundary from "../components/PageErrorBoundary";
import LoadingScreen from "../components/LoadingScreen";
import { SubscriptionStatus } from "../constants/enums";

// Lazy load components for better performance
const Dashboard = lazy(() => import("../components/Dashboard"));
const BulkImport = lazy(() => import("../components/BulkImport"));
const ManageTeam = lazy(() => import("../components/ManageTeam"));
const SystemSettings = lazy(() => import("../components/SystemSettings"));
const SalesManagement = lazy(() => import("../components/SalesManagement"));
const ReportsHub = lazy(() => import("../components/ReportsHub"));
const AuditLogs = lazy(() => import("../components/AuditLogs"));
const PurchaseManagement = lazy(
  () => import("../components/PurchaseManagement"),
);
const PlanSelection = lazy(() => import("../components/PlanSelection"));
const PaymentGateway = lazy(() => import("../components/PaymentGateway"));
const BillingPOS = lazy(() => import("../components/BillingPOS"));
const LowStockAlerts = lazy(() => import("../components/LowStockAlerts"));
const ExpiryBatchIntelligence = lazy(
  () => import("../components/ExpiryBatchIntelligence"),
);
const BarcodeEcosystem = lazy(() => import("../components/BarcodeEcosystem"));
const Profile = lazy(() => import("../components/Profile"));
const Suppliers = lazy(() => import("../components/Suppliers"));
const Patients = lazy(() => import("../components/Patients"));
const PrescriptionsCRUD = lazy(() => import("../components/PrescriptionsCRUD"));
const InventoryCRUD = lazy(() => import("../components/InventoryCRUD"));
const SubscriptionCRUD = lazy(() => import("../components/SubscriptionCRUD"));
const AccountingTax = lazy(() => import("../components/AccountingTax"));

export default function AppRoutes({
  user,
  subscription,
  theme,
  medicines,
  expiryDays,
  lowStock,
  currency,
  lastSync,
  fetchData,
  showToast,
  toggleTheme,
  handleClearAll,
  handleSaveSettings,
  setLowStock,
  setExpiryDays,
  setTheme,
  handleActivateSubscription,
  handleAuthSuccess,
  handleSelectTrial,
  handleSelectPro,
  handlePaymentComplete,
  handleAvatarUpload,
  profileData,
  setShowAuthModal,
  setPendingUpdates,
  setShowLogoutModal,
  PaywallComponent,
}) {
  const location = useLocation();
  const subStatus = subscription?.status;
  const isExpired = subStatus === SubscriptionStatus.EXPIRED;
  const isPrivileged = user?.role === "OWNER" || user?.role === "ADMIN";
  const needsPlanSelection =
    !subStatus || subStatus === SubscriptionStatus.PENDING;
  const trialDaysLeft = subscription ? subscription.daysRemaining : null;

  return (
    <Suspense fallback={<LoadingScreen message="Loading clinical module..." />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Auth onAuth={handleAuthSuccess} />
            )
          }
        />

        {/* Guarded Routes */}
        <Route
          element={
            <ProtectedRoute>
              {isExpired && isPrivileged ? (
                <PaywallComponent />
              ) : needsPlanSelection &&
                isPrivileged &&
                location.pathname !== "/plans" &&
                location.pathname !== "/payment" ? (
                <Navigate to="/plans" replace />
              ) : (
                <DashboardLayout
                  user={user}
                  toggleTheme={toggleTheme}
                  theme={theme}
                  trialDaysLeft={trialDaysLeft}
                  setShowLogoutModal={setShowLogoutModal}
                  medicines={medicines}
                />
              )}
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <PageErrorBoundary>
                <Dashboard
                  medicines={medicines}
                  expiryDays={expiryDays}
                  lowStock={lowStock}
                  fetchData={fetchData}
                  showToast={showToast}
                  currency={currency}
                  lastSync={lastSync}
                  user={user}
                />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/stock"
            element={
              <PageErrorBoundary>
                <InventoryCRUD showToast={showToast} title="Stock Management" />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/import"
            element={
              <PageErrorBoundary>
                <BulkImport fetchData={fetchData} showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/billing"
            element={
              <PageErrorBoundary>
                <BillingPOS showToast={showToast} user={user} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/lowstock"
            element={
              <PageErrorBoundary>
                <LowStockAlerts showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/purchases"
            element={
              <PageErrorBoundary>
                <PurchaseManagement showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/analytics"
            element={
              <PageErrorBoundary>
                <SalesManagement showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/reports"
            element={
              <PageErrorBoundary>
                <ReportsHub showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/expiry"
            element={
              <PageErrorBoundary>
                <ExpiryBatchIntelligence showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/barcode"
            element={
              <PageErrorBoundary>
                <BarcodeEcosystem showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/suppliers"
            element={
              <PageErrorBoundary>
                <Suppliers showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/patients"
            element={
              <PageErrorBoundary>
                <Patients showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/prescriptions"
            element={
              <PageErrorBoundary>
                <PrescriptionsCRUD showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/accounting"
            element={
              <PageErrorBoundary>
                <AccountingTax showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                <PageErrorBoundary>
                  <ManageTeam user={user} showToast={showToast} />
                </PageErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                <PageErrorBoundary>
                  <SystemSettings
                    user={user}
                    lowStock={lowStock}
                    setLowStock={setLowStock}
                    expiryDays={expiryDays}
                    setExpiryDays={setExpiryDays}
                    theme={theme}
                    setTheme={setTheme}
                    onClearAll={handleClearAll}
                    onSave={handleSaveSettings}
                    showToast={showToast}
                    onActivate={handleActivateSubscription}
                  />
                </PageErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
                <PageErrorBoundary>
                  <AuditLogs />
                </PageErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PageErrorBoundary>
                <Profile
                  user={user}
                  profileData={profileData}
                  handleAvatarUpload={handleAvatarUpload}
                  setShowAuthModal={(updates) => {
                    setPendingUpdates(updates);
                    setShowAuthModal(true);
                  }}
                  showToast={showToast}
                />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/subscription"
            element={
              <PageErrorBoundary>
                <SubscriptionCRUD
                  showToast={showToast}
                  user={user}
                  onActivate={handleActivateSubscription}
                />
              </PageErrorBoundary>
            }
          />
        </Route>

        {/* Special Utility Routes */}
        <Route
          path="/plans"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
              <PageErrorBoundary>
                <PlanSelection
                  onSelectTrial={handleSelectTrial}
                  onSelectPro={handleSelectPro}
                />
              </PageErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
              <PageErrorBoundary>
                <PaymentGateway
                  user={user}
                  amount={1}
                  onPaymentComplete={handlePaymentComplete}
                />
              </PageErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
