// src/app/myevents/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Event } from "@/types/event";
import EventCard from "@/components/event/eventcard/EventCard";
import { useRecommendedEvents } from "@/hooks/useEvents";
import { useUser } from "@supabase/auth-helpers-react";
import { TicketsSection } from "@/components/tickets/TicketSection";
import { UserTicket } from "@/types/ticket";

interface FilterState {
  search: string;
  location: string;
  priceRange: string;
  dateRange: string;
}

export default function MyEvents() {
  const router = useRouter();
  const { events: allEvents, loading, error } = useRecommendedEvents();
  const user = useUser();
  const [activeTab, setActiveTab] = useState<"events" | "tickets">("events");
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    location: "",
    priceRange: "",
    dateRange: "",
  });

  // Sample tickets with varied data for testing - replace with real Supabase data
  const [userTickets] = useState<UserTicket[]>([
    {
      id: "1",
      eventId: "event1",
      eventTitle: "Afrobeats Summer Festival 2024",
      eventDate: "2024-12-25T20:00:00.000Z",
      eventLocation: "National Theatre of Ghana, Accra",
      ticketType: "VIP Gold",
      quantity: 2,
      totalPrice: 150,
      purchaseDate: "2024-02-10T10:30:00.000Z",
      status: "confirmed",
      userId: user?.id,
    },
    {
      id: "2",
      eventId: "event2",
      eventTitle: "Ghana Tech Summit 2024",
      eventDate: "2024-11-15T09:00:00.000Z",
      eventLocation: "Accra International Conference Centre",
      ticketType: "Standard",
      quantity: 1,
      totalPrice: 75,
      purchaseDate: "2024-02-05T14:15:00.000Z",
      status: "confirmed",
      userId: user?.id,
    },
    {
      id: "3",
      eventId: "event3",
      eventTitle: "West African Food & Culture Expo",
      eventDate: "2024-10-30T16:00:00.000Z",
      eventLocation: "Labadi Beach Hotel, Accra",
      ticketType: "Premium",
      quantity: 3,
      totalPrice: 225,
      purchaseDate: "2024-01-20T09:45:00.000Z",
      status: "confirmed",
      userId: user?.id,
    },
    {
      id: "4",
      eventId: "event4",
      eventTitle: "Independence Day Concert 2024",
      eventDate: "2024-03-06T19:00:00.000Z",
      eventLocation: "Independence Square, Accra",
      ticketType: "General Admission",
      quantity: 4,
      totalPrice: 100,
      purchaseDate: "2024-02-01T11:20:00.000Z",
      status: "confirmed",
      userId: user?.id,
    },
    {
      id: "5",
      eventId: "event5",
      eventTitle: "African Fashion Week Ghana",
      eventDate: "2024-08-15T18:30:00.000Z",
      eventLocation: "Movenpick Ambassador Hotel, Accra",
      ticketType: "VIP Silver",
      quantity: 2,
      totalPrice: 200,
      purchaseDate: "2024-01-15T16:00:00.000Z",
      status: "confirmed",
      userId: user?.id,
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

  const handleTicketTabChange = (tab: 'active' | 'expired') => {
    // You can add analytics or other logic here
    console.log(`User switched to ${tab} tickets`);
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
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "events"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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
              {/* Search Filter */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Other Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  <option value="accra">Accra</option>
                  <option value="kumasi">Kumasi</option>
                  <option value="tamale">Tamale</option>
                </select>

                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange("priceRange", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Prices</option>
                  <option value="free">Free</option>
                  <option value="0-50">$0 - $50</option>
                  <option value="50-200">$50 - $200</option>
                  <option value="200+">$200+</option>
                </select>

                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="future">Future Events</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {filteredEvents.length} of {allEvents?.length || 0} events
                </p>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
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
          /* Tickets Section */
          <TicketsSection
            userTickets={userTickets}
            user={user}
            onTabChange={handleTicketTabChange}
            isLoading={false}
            error={null}
          />
        )}
      </div>
    </main>
  );
}