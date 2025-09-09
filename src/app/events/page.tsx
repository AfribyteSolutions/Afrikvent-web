"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Event } from "@/types/event";
import EventCard from "@/components/event/eventcard/EventCard";
import { useRecommendedEvents } from '@/hooks/useEvents';

interface FilterState {
  search: string;
  location: string;
  priceRange: string;
  dateRange: string;
}

export default function MyEvents() {
  const router = useRouter();
  const { events: allEvents, loading, error } = useRecommendedEvents();
  const [activeTab, setActiveTab] = useState<'events' | 'tickets'>('events');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    location: '',
    priceRange: '',
    dateRange: ''
  });

  // Mock tickets data - replace with actual user tickets
  const [userTickets] = useState([
    {
      id: '1',
      eventId: 'event1',
      eventTitle: 'Tech Conference 2024',
      eventDate: '2024-03-15',
      eventLocation: 'Accra Convention Center',
      ticketType: 'VIP',
      quantity: 2,
      totalPrice: 500,
      purchaseDate: '2024-02-10',
      status: 'confirmed'
    },
    {
      id: '2',
      eventId: 'event2',
      eventTitle: 'Music Festival',
      eventDate: '2024-04-20',
      eventLocation: 'Independence Square',
      ticketType: 'General',
      quantity: 1,
      totalPrice: 150,
      purchaseDate: '2024-02-05',
      status: 'confirmed'
    }
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
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(currentFilters.search.toLowerCase())
      );
    }

    // Filter by location
    if (currentFilters.location) {
      filtered = filtered.filter(event =>
        event.location?.toLowerCase().includes(currentFilters.location.toLowerCase())
      );
    }

    // Filter by price range
    if (currentFilters.priceRange) {
      filtered = filtered.filter(event => {
        const price = typeof event.price === 'number' ? event.price : 0;
        switch (currentFilters.priceRange) {
          case 'free':
            return price === 0;
          case '0-50':
            return price > 0 && price <= 50;
          case '50-200':
            return price > 50 && price <= 200;
          case '200+':
            return price > 200;
          default:
            return true;
        }
      });
    }

    // Filter by date range
    if (currentFilters.dateRange) {
      const now = new Date();
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        switch (currentFilters.dateRange) {
          case 'today':
            return eventDate.toDateString() === now.toDateString();
          case 'week':
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return eventDate >= now && eventDate <= weekFromNow;
          case 'month':
            const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            return eventDate >= now && eventDate <= monthFromNow;
          case 'future':
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
      search: '',
      location: '',
      priceRange: '',
      dateRange: ''
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
      year: "numeric"
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
                onClick={() => setActiveTab('events')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tickets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Tickets ({userTickets.length})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'events' ? (
          <>
            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Search by Name */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Events
                  </label>
                  <input
                    type="text"
                    id="search"
                    placeholder="Event name..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Location Filter */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    placeholder="City or venue..."
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Price Range Filter */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    id="price"
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Prices</option>
                    <option value="free">Free</option>
                    <option value="0-50">₵0 - ₵50</option>
                    <option value="50-200">₵50 - ₵200</option>
                    <option value="200+">₵200+</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    id="date"
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="future">Future Events</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {filteredEvents.length} of {allEvents?.length || 0} events
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
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters to see more events.</p>
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
                <div key={ticket.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{ticket.eventTitle}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span> {formatTicketDate(ticket.eventDate)}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {ticket.eventLocation}
                        </div>
                        <div>
                          <span className="font-medium">Ticket Type:</span> {ticket.ticketType}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mt-2">
                        <div>
                          <span className="font-medium">Quantity:</span> {ticket.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> ₵{ticket.totalPrice}
                        </div>
                        <div>
                          <span className="font-medium">Purchased:</span> {formatTicketDate(ticket.purchaseDate)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-end">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        ticket.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ticket.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                      <button 
                        onClick={() => router.push(`/events/${ticket.eventId}`)}
                        className="mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View Event Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No tickets yet</h3>
                <p className="text-gray-600 mb-6">You have not purchased any tickets yet. Start exploring events!</p>
                <button
                  onClick={() => setActiveTab('events')}
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