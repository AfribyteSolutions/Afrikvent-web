// src/app/myevents/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Event } from "@/types/event";
import EventCard from "@/components/event/eventcard/EventCard";
import { useRecommendedEvents } from "@/hooks/useEvents";
import CommentsSection from "@/components/event/commentsection/Commentsection"; // ✅ import comments
import { useUser } from "@supabase/auth-helpers-react"; // ✅ to get logged-in user

interface FilterState {
  search: string;
  location: string;
  priceRange: string;
  dateRange: string;
}

export default function MyEvents() {
  const router = useRouter();
  const { events: allEvents, loading, error } = useRecommendedEvents();
  const user = useUser(); // ✅ get Supabase user
  const [activeTab, setActiveTab] = useState<"events" | "tickets">("events");
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    location: "",
    priceRange: "",
    dateRange: "",
  });

  // Mock tickets data - replace with actual user tickets
  const [userTickets] = useState([
    {
      id: "1",
      eventId: "event1",
      eventTitle: "Tech Conference 2024",
      eventDate: "2024-03-15",
      eventLocation: "Accra Convention Center",
      ticketType: "VIP",
      quantity: 2,
      totalPrice: 500,
      purchaseDate: "2024-02-10",
      status: "confirmed",
    },
    {
      id: "2",
      eventId: "event2",
      eventTitle: "Music Festival",
      eventDate: "2024-04-20",
      eventLocation: "Independence Square",
      ticketType: "General",
      quantity: 1,
      totalPrice: 150,
      purchaseDate: "2024-02-05",
      status: "confirmed",
    },
  ]);

  useEffect(() => {
    if (allEvents) {
      applyFilters(allEvents, filters);
    }
  }, [allEvents, filters]);

  const applyFilters = (events: Event[], currentFilters: FilterState) => {
    let filtered = [...events];

    // Search by name
    if (currentFilters.search) {
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(currentFilters.search.toLowerCase())
      );
    }

    // Filter by location
    if (currentFilters.location) {
      filtered = filtered.filter((event) =>
        event.location
          ?.toLowerCase()
          .includes(currentFilters.location.toLowerCase())
      );
    }

    // Filter by price range
    if (currentFilters.priceRange) {
      filtered = filtered.filter((event) => {
        const price = typeof event.price === "number" ? event.price : 0;
        switch (currentFilters.priceRange) {
          case "free":
            return price === 0;
          case "0-50":
            return price > 0 && price <= 50;
          case "50-200":
            return price > 50 && price <= 200;
          case "200+":
            return price > 200;
          default:
            return true;
        }
      });
    }

    // Filter by date range
    if (currentFilters.dateRange) {
      const now = new Date();
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date);
        switch (currentFilters.dateRange) {
          case "today":
            return eventDate.toDateString() === now.toDateString();
          case "week":
            const weekFromNow = new Date(
              now.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            return eventDate >= now && eventDate <= weekFromNow;
          case "month":
            const monthFromNow = new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              now.getDate()
            );
            return eventDate >= now && eventDate <= monthFromNow;
          case "future":
            return eventDate >= now;
          default:
            return true;
        }
      });
    }

    setFilteredEvents(filtered);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      location: "",
      priceRange: "",
      dateRange: "",
    });
  };

  const handleEventClick = (event: Event) => {
    router.push(`/events/${event.id}`);
  };

  const formatTicketDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4">
                  <div className="bg-gray-300 rounded h-32 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header with Tabs */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">My Events</h1>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("events")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "events"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "tickets"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Tickets ({userTickets.length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "events" ? (
          <>
            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              {/* ...filters UI unchanged... */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {filteredEvents.length} of {allEvents?.length || 0}{" "}
                  events
                </p>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear all filters
                </button>
              </div>
            </div>

            {/* Events Grid */}
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={handleEventClick}
                    className="h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No events found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters to see more events.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        ) : (
          /* My Tickets Section */
          <div className="space-y-6">
            {userTickets.length > 0 ? (
              userTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {ticket.eventTitle}
                      </h3>
                      {/* Ticket details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span>{" "}
                          {formatTicketDate(ticket.eventDate)}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span>{" "}
                          {ticket.eventLocation}
                        </div>
                        <div>
                          <span className="font-medium">Ticket Type:</span>{" "}
                          {ticket.ticketType}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Comments Section per event */}
                  <CommentsSection
                    eventId={ticket.eventId}
                    user={user}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No tickets yet
                </h3>
                <p className="text-gray-600 mb-6">
                  You have not purchased any tickets yet. Start exploring
                  events!
                </p>
                <button
                  onClick={() => setActiveTab("events")}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Events
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
