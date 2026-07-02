import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SubscriptionStatus } from "../constants/enums";

// Lazy load components for better performance
const ProtectedRoute = lazy(() => import("../guards/ProtectedRoute"));
const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));
const Auth = lazy(() => import("../components/Auth"));
const PageErrorBoundary = lazy(() => import("../components/PageErrorBoundary"));
const LoadingScreen = lazy(() => import("../components/LoadingScreen"));
const NotFound = lazy(() => import("../components/NotFound"));
const LegalPages = lazy(() => import("../components/LegalPages"));
const LandingPage = lazy(() => import("../pages/LandingPage"));
const PrivacyPolicyPage = lazy(() => import("../pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("../pages/TermsOfServicePage"));
const CookiePolicyPage = lazy(() => import("../pages/CookiePolicyPage"));

// Admin pages
const AdminLogin = lazy(() => import("../pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("../pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("../pages/admin/AdminUsers"));
const AdminDevices = lazy(() => import("../pages/admin/AdminDevices"));
const AdminSubscriptions = lazy(
  () => import("../pages/admin/AdminSubscriptions"),
);
const AdminAuditLogs = lazy(() => import("../pages/admin/AdminAuditLogs"));
const AdminOtpLogs = lazy(() => import("../pages/admin/AdminOtpLogs"));
const AdminFeatureFlags = lazy(
  () => import("../pages/admin/AdminFeatureFlags"),
);
const AdminAdmins = lazy(() => import("../pages/admin/AdminAdmins"));
const AdminSecurityCenter = lazy(
  () => import("../pages/admin/AdminSecurityCenter"),
);
const AdminPayments = lazy(() => import("../pages/admin/AdminPayments"));
const AdminRevenue = lazy(() => import("../pages/admin/AdminRevenue"));
const AdminBroadcast = lazy(() => import("../pages/admin/AdminBroadcast"));
const AdminExpiry = lazy(() => import("../pages/admin/AdminExpiry"));
const AdminSupportTickets = lazy(
  () => import("../pages/admin/AdminSupportTickets"),
);
const AdminSystemHealth = lazy(
  () => import("../pages/admin/AdminSystemHealth"),
);
const AdminShops = lazy(() => import("../pages/admin/AdminShops"));
const Dashboard = lazy(() => import("../components/Dashboard"));
const BulkImport = lazy(() => import("../components/BulkImport"));
const BulkDisposal = lazy(() => import("../components/BulkDisposal"));
const DisposalHistory = lazy(() => import("../components/DisposalHistory"));
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
const SupplierReturns = lazy(() => import("../components/SupplierReturns"));
const Patients = lazy(() => import("../components/Patients"));
const PrescriptionsCRUD = lazy(() => import("../components/PrescriptionsCRUD"));
const InventoryCRUD = lazy(() => import("../components/InventoryCRUD"));
const SubscriptionCRUD = lazy(() => import("../components/SubscriptionCRUD"));
const AccountingTax = lazy(() => import("../components/AccountingTax"));
const Notifications = lazy(() => import("../pages/Notifications"));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage"));
const SupportTickets = lazy(() => import("../components/SupportTickets"));
const InventoryAnalyticsFull = lazy(
  () => import("../components/inventory/InventoryAnalyticsFull"),
);

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
  storeProfile,
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

  return (
    <Suspense fallback={<LoadingScreen message="Loading clinical module..." />}>
      <Routes>
        {/* Landing Page — root public route */}
        <Route
          path="/"
          element={
            user ? <Navigate to="/dashboard" replace /> : <LandingPage />
          }
        />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />

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

        {/* Public Checkout Route (Desktop Payment Flow) */}
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Public Legal Routes */}
        <Route path="/legal" element={<LegalPages showBackButton={false} />} />

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
                  subscription={subscription}
                  setShowLogoutModal={setShowLogoutModal}
                  medicines={medicines}
                />
              )}
            </ProtectedRoute>
          }
        >
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
            path="/inventory/analytics"
            element={
              <PageErrorBoundary>
                <InventoryAnalyticsFull showToast={showToast} />
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
                <BillingPOS
                  showToast={showToast}
                  user={user}
                  storeProfile={storeProfile}
                />
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
                <PurchaseManagement
                  showToast={showToast}
                  storeProfile={storeProfile}
                />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/analytics"
            element={
              <PageErrorBoundary>
                <SalesManagement
                  showToast={showToast}
                  storeProfile={storeProfile}
                />
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
            path="/expiry/bulk-disposal"
            element={
              <PageErrorBoundary>
                <BulkDisposal showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/expiry/disposal-history"
            element={
              <PageErrorBoundary>
                <DisposalHistory showToast={showToast} />
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
            path="/supplier-returns"
            element={
              <PageErrorBoundary>
                <SupplierReturns showToast={showToast} />
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
                    storeProfile={storeProfile}
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
          <Route
            path="/notifications"
            element={
              <PageErrorBoundary>
                <Notifications showToast={showToast} />
              </PageErrorBoundary>
            }
          />
          <Route
            path="/support"
            element={
              <PageErrorBoundary>
                <SupportTickets user={user} showToast={showToast} />
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

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/devices" element={<AdminDevices />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/admin/otp-logs" element={<AdminOtpLogs />} />
          <Route path="/admin/shops" element={<AdminShops />} />
          <Route path="/admin/system-health" element={<AdminSystemHealth />} />
          <Route
            path="/admin/support-tickets"
            element={<AdminSupportTickets />}
          />
          <Route path="/admin/expiry" element={<AdminExpiry />} />
          <Route path="/admin/broadcast" element={<AdminBroadcast />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/security" element={<AdminSecurityCenter />} />
          <Route path="/admin/feature-flags" element={<AdminFeatureFlags />} />
          <Route path="/admin/admins" element={<AdminAdmins />} />
        </Route>

        {/* 404 Redirect */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
