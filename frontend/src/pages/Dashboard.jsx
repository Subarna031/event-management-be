import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { analyticsApi } from "../api/analytics";
import { useEvents } from "../hooks/useEvents";
import { useAuth } from "../hooks/useAuth";
import QRScanner from "../components/QRScanner";
import EventCard from "../components/EventCard";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeEventId, setActiveEventId] = useState(null);

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ["organizer-dashboard"],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data),
  });

  const { data: eventStats, isLoading: statsLoading } = useQuery({
    queryKey: ["event-stats", activeEventId],
    queryFn: () => analyticsApi.eventStats(activeEventId).then((r) => r.data),
    enabled: !!activeEventId,
  });

  const { data: myEventsData } = useEvents({ organizer: user?.id, page_size: 50 });
  const myEvents = myEventsData?.results || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <h1 className="text-2xl font-bold text-gray-900">Organizer Dashboard</h1>

      {/* Summary cards */}
      {dashLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: dashData?.total_events },
            { label: "Registrations", value: dashData?.total_registrations },
            { label: "Attended", value: dashData?.total_attended },
            {
              label: "Avg Rating",
              value: dashData?.avg_rating ? `${dashData.avg_rating} ★` : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="card p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-3xl font-bold text-primary-600">{value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {/* QR Check-in */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Check-in Scanner</h2>
        <div className="max-w-sm">
          <QRScanner />
        </div>
      </section>

      {/* Event selector + per-event analytics */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Analytics</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {myEvents.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setActiveEventId(ev.id)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                activeEventId === ev.id
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-gray-300 text-gray-700 hover:border-primary-400"
              }`}
            >
              {ev.title}
            </button>
          ))}
        </div>

        {activeEventId && (
          <>
            {statsLoading ? (
              <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
            ) : eventStats ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registrations over time */}
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Registrations over time
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={eventStats.registrations_over_time}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Attendance stats */}
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Attendance overview
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={[
                        { name: "Capacity", value: eventStats.capacity },
                        { name: "Registered", value: eventStats.total_registered },
                        { name: "Attended", value: eventStats.total_attended },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 text-sm text-gray-600">
                    Attendance rate:{" "}
                    <span className="font-semibold text-primary-600">
                      {eventStats.attendance_rate}%
                    </span>
                    {eventStats.avg_rating && (
                      <span className="ml-4">
                        Avg rating:{" "}
                        <span className="font-semibold text-yellow-500">
                          {eventStats.avg_rating} ★
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* My events */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Events</h2>
        {myEvents.length === 0 ? (
          <p className="text-gray-400 text-sm">You haven&apos;t created any events yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
