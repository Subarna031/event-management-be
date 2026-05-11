import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoute() {
  const { isAuthenticated, sessionChecked } = useAuth();
  const location = useLocation();

  // Wait until the mount-time session validation finishes before deciding.
  // Without this, a hard reload would flash a redirect to /login while the
  // stored token is still being verified.
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
