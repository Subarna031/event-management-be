import PropTypes from "prop-types";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketCard({ ticket }) {
  const event = ticket.event_detail;
  return (
    <div className={`card flex gap-4 p-4 ${ticket.is_used ? "opacity-60" : ""}`}>
      {ticket.qr_code_url && (
        <img
          src={ticket.qr_code_url}
          alt="QR Code"
          className="w-24 h-24 object-contain shrink-0 rounded-lg border border-gray-100"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 truncate">{event?.title}</h3>
          {ticket.is_used ? (
            <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              Used
            </span>
          ) : (
            <span className="shrink-0 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              Valid
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-0.5">{event && formatDate(event.date)}</p>
        <p className="text-xs text-gray-500 truncate">{event?.venue}</p>
        <p className="text-xs text-gray-400 mt-2 font-mono truncate">
          #{String(ticket.id).slice(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  );
}

TicketCard.propTypes = {
  ticket: PropTypes.shape({
    id: PropTypes.string.isRequired,
    qr_code_url: PropTypes.string,
    is_used: PropTypes.bool.isRequired,
    event_detail: PropTypes.object,
  }).isRequired,
};
