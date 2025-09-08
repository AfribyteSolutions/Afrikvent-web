"use client";
import React, { useState } from "react";
import EventList from "./EventList";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (filter) params.append("filter", filter);

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setEvents(data);
        setIsExpanded(true);
      } else {
        console.error("Error fetching events:", data.error);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter === filter ? "" : newFilter);
    if (query || newFilter !== filter) {
      fetchEvents();
    }
  };

  return (
    <div
      className={`w-full max-w-4xl mx-auto transition-all duration-500 ${
        isExpanded ? "max-h-full" : ""
      }`}
    >
      {/* Main Search Container */}
      <div className="backdrop-blur-2xl bg-white/90 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input Section */}
        <div className="p-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              {/* Search Icon */}
              <div className="absolute left-4 text-blue-600">
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Input Field */}
              <input
                type="text"
                placeholder="Discover amazing events..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-32 text-lg text-gray-800 bg-white/80 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
              />

              {/* Search Button */}
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 h-10 px-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-blue-900 hover:scale-105 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Searching</span>
                  </div>
                ) : (
                  <span>Search</span>
                )}
              </button>
            </div>
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <span className="text-sm font-medium text-gray-600">
              Quick filters:
            </span>

            {[
              { key: "nearby", label: "Nearby", icon: "M17.657 16.657..." },
              { key: "latest", label: "Latest", icon: "M13 10V3L4 14..." },
              { key: "trending", label: "Trending", icon: "M13 7h8..." },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => handleFilterChange(btn.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-all ${
                  filter === btn.key
                    ? "bg-blue-600 text-white scale-105"
                    : "bg-white/60 border-gray-200 text-gray-700 hover:bg-white/80 hover:shadow-md"
                }`}
              >
                {/* Tiny SVG per button */}
                {btn.label === "Nearby" && (
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
                {btn.label === "Latest" && (
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                )}
                {btn.label === "Trending" && (
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                )}
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {(events.length > 0 || loading) && (
          <div className="border-t border-gray-100 bg-white/60 backdrop-blur-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {loading ? "Searching..." : `Found ${events.length} events`}
              </h3>
              {events.length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 font-medium text-sm hover:text-blue-800"
                >
                  {isExpanded ? "Show Less" : "Show All"}
                </button>
              )}
            </div>

            <EventList events={events} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
