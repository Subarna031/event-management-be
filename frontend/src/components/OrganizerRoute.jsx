import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function OrganizerRoute() {
  const { isAuthenticated, isOrganizer, sessionChecked } = useAuth();
  const location = useLocation();

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

  if (!isOrganizer) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
