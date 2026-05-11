import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useEvents, useCategories } from "../hooks/useEvents";
import EventCard from "../components/EventCard";

const SORT_OPTIONS = [
  { label: "Soonest first", value: "date" },
  { label: "Latest date", value: "-date" },
  { label: "Newest added", value: "-created_at" },
  { label: "Most popular", value: "-registration_count" },
];

function FilterSidebar({ filters, onChange, categories, onReset }) {
  const hasActive =
    filters.search || filters.category || filters.city ||
    filters.date_from || filters.date_to;

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        {hasActive && (
          <button
            onClick={onReset}
            className="text-xs text-primary-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Search
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search events…"
            value={filters.search}
            onChange={(e) => onChange("search", e.target.value)}
            className="input-field pl-8 text-sm"
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          City
        </label>
        <input
          type="text"
          placeholder="e.g. Kathmandu"
          value={filters.city}
          onChange={(e) => onChange("city", e.target.value)}
          className="input-field text-sm"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Category
        </label>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="category"
              value=""
              checked={filters.category === ""}
              onChange={() => onChange("category", "")}
              className="text-primary-600"
            />
            <span className="text-sm text-gray-700 group-hover:text-primary-600">All categories</span>
          </label>
          {categories?.map((cat) => (
            <label key={cat.id} className="flex items-center justify-between gap-2 cursor-pointer group">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="category"
                  value={cat.slug}
                  checked={filters.category === cat.slug}
                  onChange={() => onChange("category", cat.slug)}
                  className="text-primary-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-primary-600">{cat.name}</span>
              </div>
              {cat.event_count > 0 && (
                <span className="text-xs text-gray-400">{cat.event_count}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Date range
        </label>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => onChange("date_from", e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => onChange("date_to", e.target.value)}
              className="input-field text-sm"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-2 bg-gray-100 rounded w-full mt-4" />
      </div>
    </div>
  );
}

export default function EventList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = {
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    city: searchParams.get("city") || "",
    date_from: searchParams.get("date_from") || "",
    date_to: searchParams.get("date_to") || "",
    ordering: searchParams.get("ordering") || "date",
  };

  const updateFilter = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      });
      setPage(1);
    },
    [setSearchParams]
  );

  const resetFilters = () => {
    setSearchParams({});
    setPage(1);
  };

  const { data, isLoading, isFetching } = useEvents({
    search: filters.search,
    category: filters.category,
    city: filters.city,
    date_from: filters.date_from,
    date_to: filters.date_to,
    ordering: filters.ordering,
    page,
  });

  const { data: categories } = useCategories();

  const events = data?.results || [];
  const total = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          {!isLoading && (
            <p className="text-sm text-gray-400 mt-0.5">{total} event{total !== 1 ? "s" : ""} found</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="lg:hidden btn-secondary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
          </button>

          {/* Sort */}
          <select
            value={filters.ordering}
            onChange={(e) => updateFilter("ordering", e.target.value)}
            className="input-field text-sm w-auto"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar — desktop always visible, mobile toggled */}
        <div className={`${mobileFiltersOpen ? "block" : "hidden"} lg:block`}>
          <FilterSidebar
            filters={filters}
            onChange={updateFilter}
            categories={categories}
            onReset={resetFilters}
          />
        </div>

        {/* Main grid */}
        <div className="flex-1 min-w-0">
          {isLoading || isFetching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-base font-medium">No events match your filters</p>
              <button onClick={resetFilters} className="mt-3 text-sm text-primary-600 hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                ← Prev
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  // Show pages near current
                  let p;
                  if (totalPages <= 7) p = i + 1;
                  else if (page <= 4) p = i + 1;
                  else if (page >= totalPages - 3) p = totalPages - 6 + i;
                  else p = page - 3 + i;

                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                        p === page
                          ? "bg-primary-600 text-white font-semibold"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
