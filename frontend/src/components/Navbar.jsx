import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";

export default function Navbar() {
  const { isAuthenticated, isOrganizer, user, logout } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    notify("Logged out successfully.", "success");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-primary-600 font-semibold"
      : "text-gray-600 hover:text-primary-600 transition-colors";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-600">EventHub</span>
          </Link>

          <div className="flex items-center gap-6">
            <NavLink to="/events" className={linkClass}>
              Events
            </NavLink>

            {isAuthenticated && isOrganizer && (
              <>
                <NavLink to="/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink
                  to="/events/create"
                  className="btn-primary text-sm px-3 py-1.5"
                >
                  + Create Event
                </NavLink>
              </>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <NavLink to="/profile" className={linkClass}>
                  {user?.username || "Profile"}
                </NavLink>
                <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
