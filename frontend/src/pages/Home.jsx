import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import { useRecommendations } from "../hooks/useRecommendations";
import EventCard from "../components/EventCard";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { data: upcomingData, isLoading } = useEvents({ ordering: "date", page_size: 6 });
  const { data: recData } = useRecommendations(6);

  const upcomingEvents = upcomingData?.results || [];
  const recommendations = recData?.results || [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Discover Events Near You
          </h1>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
            Find local events, connect with your community, and never miss what matters to you.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/events" className="btn-primary bg-white text-primary-700 hover:bg-primary-50">
              Browse Events
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn-secondary border-white text-white hover:bg-white/10">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
        {/* Personalized recommendations */}
        {isAuthenticated && recommendations.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Recommended for {user?.username}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming events */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
            <Link to="/events" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card h-64 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No upcoming events yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
