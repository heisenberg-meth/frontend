import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSubscription } from "../hooks/useSubscription";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, restored } = useAuth();
  const { isLocked } = useSubscription();
  const location = useLocation();

  if (loading || !restored) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <p>Verifying secure session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const allowedWhenLocked = [
    "/subscription",
    "/plans",
    "/payment",
    "/profile",
    "/support",
    "/login",
    "/logout",
    "/admin",
  ];
  const isAllowedWhenLocked = allowedWhenLocked.some((p) =>
    location.pathname.startsWith(p),
  );

  if (isLocked && !isAllowedWhenLocked) {
    return <Navigate to="/subscription" replace />;
  }

  return children;
}
