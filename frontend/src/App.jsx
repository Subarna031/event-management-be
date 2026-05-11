import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import OrganizerRoute from "./components/OrganizerRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EventList from "./pages/EventList";
import EventDetail from "./pages/EventDetail";
import EventCreate from "./pages/EventCreate";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotificationToast from "./components/NotificationToast";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <NotificationToast />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events" element={<EventList />} />
          <Route path="/events/:id" element={<EventDetail />} />

          {/* Authenticated */}
          <Route element={<PrivateRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Organizer only */}
          <Route element={<OrganizerRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events/create" element={<EventCreate />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
