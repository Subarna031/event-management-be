import { Link } from "react-router-dom";
import PropTypes from "prop-types";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function EventCard({ event }) {
  const isFull = event.is_full || event.available_spots === 0;
  const fillPct = event.capacity
    ? Math.min(100, Math.round(((event.registration_count ?? 0) / event.capacity) * 100))
    : 0;

  return (
    <Link
      to={`/events/${event.id}`}
      className="card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block overflow-hidden group"
    >
      {/* Banner */}
      <div className="relative h-44 overflow-hidden">
        {event.banner_image ? (
          <img
            src={event.banner_image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <span className="text-primary-400 text-5xl font-bold opacity-30">
              {event.title.charAt(0)}
            </span>
          </div>
        )}

        {/* Category pill */}
        {event.category_name && (
          <span className="absolute top-2 left-2 text-xs bg-white/90 text-primary-700 px-2 py-0.5 rounded-full font-medium shadow-sm">
            {event.category_name}
          </span>
        )}

        {/* Status badge (non-published only) */}
        {event.status && event.status !== "published" && (
          <span className="absolute top-2 right-2 text-xs bg-gray-800/80 text-white px-2 py-0.5 rounded-full capitalize">
            {event.status}
          </span>
        )}

        {/* Going badge */}
        {event.is_registered && (
          <span className="absolute bottom-2 right-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium shadow">
            Going
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug mb-1">
          {event.title}
        </h3>

        <p className="text-xs text-primary-600 font-medium mb-0.5">{formatDate(event.date)}</p>

        <p className="text-xs text-gray-500 truncate mb-3">
          {event.city ? `${event.city} · ` : ""}{event.venue}
        </p>

        {/* Registration progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {event.registration_count ?? 0} / {event.capacity} registered
            </span>
            {isFull ? (
              <span className="text-red-500 font-medium">Full</span>
            ) : (
              <span className="text-green-600 font-medium">{event.available_spots} left</span>
            )}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                fillPct >= 90 ? "bg-red-400" : fillPct >= 60 ? "bg-yellow-400" : "bg-green-400"
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* Organizer */}
        {event.organizer_name && (
          <p className="text-xs text-gray-400 mt-2 truncate">by {event.organizer_name}</p>
        )}
      </div>
    </Link>
  );
}

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    banner_image: PropTypes.string,
    category_name: PropTypes.string,
    date: PropTypes.string.isRequired,
    venue: PropTypes.string.isRequired,
    city: PropTypes.string,
    capacity: PropTypes.number,
    registration_count: PropTypes.number,
    available_spots: PropTypes.number,
    is_full: PropTypes.bool,
    is_registered: PropTypes.bool,
    status: PropTypes.string,
    organizer_name: PropTypes.string,
  }).isRequired,
};
