import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEvent, useRegisterEvent } from "../hooks/useEvents";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";
import { feedbackApi } from "../api/feedback";
import FeedbackForm from "../components/FeedbackForm";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StarRating({ rating, size = "sm" }) {
  const stars = Array.from({ length: 5 });
  return (
    <span>
      {stars.map((_, i) => (
        <span
          key={i}
          className={`${size === "sm" ? "text-sm" : "text-base"} ${
            i < Math.round(rating) ? "text-yellow-400" : "text-gray-200"
          }`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function OrganizerCard({ organizer }) {
  if (!organizer) return null;
  return (
    <div className="card p-5 flex gap-4 items-start">
      {organizer.profile_image ? (
        <img
          src={organizer.profile_image}
          alt={organizer.username}
          className="w-14 h-14 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <span className="text-primary-600 text-xl font-bold">
            {organizer.username?.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Organizer</p>
        <p className="font-semibold text-gray-900">{organizer.username}</p>
        {organizer.bio && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{organizer.bio}</p>
        )}
        {organizer.total_events != null && (
          <p className="text-xs text-gray-400 mt-1">{organizer.total_events} event{organizer.total_events !== 1 ? "s" : ""} hosted</p>
        )}
      </div>
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams();
  const { isAuthenticated, isParticipant } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [showFeedback, setShowFeedback] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: event, isLoading, error } = useEvent(Number(id));
  const registerMutation = useRegisterEvent();

  const { data: feedbackData, refetch: refetchFeedback } = useQuery({
    queryKey: ["feedback", id],
    queryFn: () => feedbackApi.list(id).then((r) => r.data),
    enabled: !!id,
  });

  const { data: summary } = useQuery({
    queryKey: ["feedback-summary", id],
    queryFn: () => feedbackApi.summary(id).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading)
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-72 bg-gray-200 rounded-2xl" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    );

  if (error || !event)
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Event not found.</p>
        <Link to="/events" className="btn-secondary text-sm">Browse events</Link>
      </div>
    );

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/events/${id}` } });
      return;
    }
    try {
      await registerMutation.mutateAsync(event.id);
      notify("Registered! Check your email for your QR ticket.", "success");
    } catch (err) {
      const msg = err.response?.data?.error || "Registration failed.";
      notify(msg, "error");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: show url
    }
  };

  const feedbackList = feedbackData?.results || feedbackData || [];
  const fillPct = event.capacity
    ? Math.min(100, Math.round(((event.registration_count ?? 0) / event.capacity) * 100))
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      {/* Banner */}
      {event.banner_image ? (
        <img
          src={event.banner_image}
          alt={event.title}
          className="w-full h-72 object-cover rounded-2xl"
        />
      ) : (
        <div className="w-full h-72 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
          <span className="text-6xl font-bold text-primary-300">{event.title.charAt(0)}</span>
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          {/* Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {event.category_name && (
              <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                {event.category_name}
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                event.status === "published"
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {event.status}
            </span>
            {event.is_registered && (
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                You&apos;re going
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>

          {/* Rating summary */}
          {summary?.avg_rating > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <StarRating rating={summary.avg_rating} />
              <span>{Number(summary.avg_rating).toFixed(1)} · {summary.total_reviews} review{summary.total_reviews !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Registration card */}
        <div className="card p-5 min-w-[210px] space-y-3">
          <div>
            <div className="flex items-end justify-between mb-1">
              <span className="text-xs text-gray-400">Capacity</span>
              <span className="text-xs font-medium text-gray-600">{event.registration_count ?? 0} / {event.capacity}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  fillPct >= 90 ? "bg-red-400" : fillPct >= 60 ? "bg-yellow-400" : "bg-green-400"
                }`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {event.is_full ? (
                <span className="text-red-500 font-medium">Fully booked</span>
              ) : (
                <>{event.available_spots} spot{event.available_spots !== 1 ? "s" : ""} remaining</>
              )}
            </p>
          </div>

          {event.is_registered ? (
            <div className="text-center text-sm text-green-600 font-medium py-2 bg-green-50 rounded-lg">
              Registered ✓
            </div>
          ) : (
            <button
              onClick={handleRegister}
              disabled={event.is_full || registerMutation.isPending}
              className="btn-primary w-full"
            >
              {registerMutation.isPending ? "Registering..." : event.is_full ? "Sold Out" : "Register Now"}
            </button>
          )}

          <button
            onClick={handleShare}
            className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? "Link copied!" : "Share event"}
          </button>
        </div>
      </div>

      {/* Event details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Date &amp; Time</p>
          <p className="text-sm text-gray-800 font-medium">{formatDate(event.date)}</p>
          {event.end_date && (
            <p className="text-xs text-gray-400 mt-0.5">Until {formatDate(event.end_date)}</p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Location</p>
          <p className="text-sm text-gray-800 font-medium">{event.venue}</p>
          {event.city && <p className="text-xs text-gray-400 mt-0.5">{event.city}</p>}
        </div>
        {event.tags?.length > 0 && (
          <div className="card p-4 sm:col-span-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {event.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* About */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">About this event</h2>
        <p className="text-gray-600 whitespace-pre-line leading-relaxed">{event.description}</p>
      </div>

      {/* Organizer profile card */}
      <OrganizerCard organizer={event.organizer} />

      {/* Reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Reviews
            {summary?.total_reviews > 0 && (
              <span className="ml-2 text-sm text-gray-400 font-normal">({summary.total_reviews})</span>
            )}
          </h2>
          {isAuthenticated && isParticipant && event.is_registered && (
            <button
              onClick={() => setShowFeedback((v) => !v)}
              className="btn-secondary text-sm"
            >
              {showFeedback ? "Cancel" : "Write a review"}
            </button>
          )}
        </div>

        {/* Rating distribution */}
        {summary?.rating_distribution && Object.keys(summary.rating_distribution).length > 0 && (
          <div className="card p-4 mb-6 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.rating_distribution[star] ?? 0;
              const pct = summary.total_reviews > 0 ? (count / summary.total_reviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-4 text-right">{star}</span>
                  <span className="text-yellow-400 text-xs">★</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-4">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {showFeedback && (
          <div className="card p-6 mb-6">
            <FeedbackForm
              eventId={event.id}
              onSuccess={() => {
                setShowFeedback(false);
                refetchFeedback();
              }}
            />
          </div>
        )}

        <div className="space-y-4">
          {feedbackList.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No reviews yet — be the first!</p>
          ) : (
            feedbackList.map((fb) => (
              <div key={fb.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-sm text-gray-900">
                      {fb.user_detail?.username || "User"}
                    </span>
                    <div className="mt-0.5">
                      <StarRating rating={fb.rating} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(fb.created_at).toLocaleDateString()}
                  </span>
                </div>
                {fb.comment && <p className="text-sm text-gray-600">{fb.comment}</p>}
                {fb.images?.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {fb.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.image}
                        alt="review"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
