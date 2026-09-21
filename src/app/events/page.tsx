"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mwakwaAuth, mwakwaData } from "@/lib/mwakwaBackend";
import EventCard from "@/components/event/eventcard/EventCard";
import { TicketsSection } from "@/components/tickets/TicketSection";
import EventFilters, { FilterState } from "@/components/event/EventFilters";

// ✅ Correct import: Use the TransformedEvent type from its original source
import { TransformedEvent } from "@/utils/eventdatatransformer";

// Import your generated DB types for database operations
import { Database } from "@/types/database.types";

// Import the proper types from the ticket module
import { User as TicketUser, UserTicket } from "@/types/ticket";

// Database table row types using UPPERCASE table names
type EventRow = Database["public"]["Tables"]["EVENTS"]["Row"];
type TicketTypeRow = Database["public"]["Tables"]["TICKET_TYPES"]["Row"];
type TicketRow = Database["public"]["Tables"]["TICKETS"]["Row"];

export default function MyEvents() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<TicketUser | null>(null);
  const [activeTab, setActiveTab] = useState<"events" | "tickets">("events");
  const [allEvents, setAllEvents] = useState<TransformedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TransformedEvent[]>([]);
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
  const [deduplicatedTicketCount, setDeduplicatedTicketCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    location: "",
    priceRange: "",
    dateRange: "",
  });

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const user = await mwakwaAuth.me();
      if (user) setCurrentUser({ id: user.id, name: user.display_name || user.full_name || user.email || 'User', email: user.email || '', phone: user.phone || undefined, avatar: user.avatar_url || undefined });
    };
    getCurrentUser();
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        const today = new Date().toISOString().split('T')[0];
        const eventsData = (await mwakwaData.events.filter({ event_status: 'published' }, 'event_date')).filter(row => !row.event_date || row.event_date >= today);
        const transformedEvents: TransformedEvent[] = await Promise.all(eventsData.map(async (row) => {
          const ticketTypes = await mwakwaData.ticketTypes.filter({ event_id: row.id, is_active: true });
          const profiles = await mwakwaData.organizerProfiles.filter({ user_id: row.organizer_id }, undefined, 1, 0);
          const organizationName = profiles[0]?.organization_name || null;
          const organizerName = organizationName || row.organizer_name || 'Event Organizer';
          const minPrice = ticketTypes.length ? Math.min(...ticketTypes.map(ticket => Number(ticket.price || 0))) : 0;
          return {
            id: String(row.id), title: row.title, date: row.event_date || 'TBD', time: row.start_time || 'TBD',
            venue: row.location_name || 'TBD', location: row.address || row.location_name || 'Location TBD',
            image: row.images?.[0] || '/placeholder-event.jpg', organizer: organizerName, organizer_name: organizerName,
            organization_name: organizationName || undefined, description: row.description || 'No description available',
            ticketOptions: ticketTypes.map(ticket => ({ type: 'Regular' as const, price: String(ticket.price || 0), currency: row.currency || 'XAF', currency_symbol: row.currency_symbol || 'CFA', availability: 'Available' })),
            tags: [], isSponsored: row.is_sponsored || false, price: minPrice > 0 ? String(minPrice) : 'Free',
            currency: row.currency || 'XAF', currency_symbol: row.currency_symbol || 'CFA'
          };
        }));

        setAllEvents(transformedEvents);
        setFilteredEvents(transformedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Apply filters
  useEffect(() => {
    const applyFilters = () => {
      let tempEvents = [...allEvents];

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        tempEvents = tempEvents.filter(
          (event) =>
            event.title.toLowerCase().includes(searchTerm) ||
            event.organizer.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.location) {
        tempEvents = tempEvents.filter(
          (event) => event.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      if (filters.priceRange) {
        tempEvents = tempEvents.filter((event) => {
          const isFree = event.price.toLowerCase().includes('free');
          return filters.priceRange === 'free' ? isFree : !isFree;
        });
      }

      if (filters.dateRange) {
          const today = new Date();
          tempEvents = tempEvents.filter((event) => {
            const eventDate = new Date(event.date);
            const diffInDays = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (filters.dateRange === 'today') {
              return diffInDays === 0;
            }
            if (filters.dateRange === 'this-week') {
              return diffInDays >= 0 && diffInDays <= 7;
            }
            if (filters.dateRange === 'this-month') {
              return diffInDays >= 0 && diffInDays <= 30;
            }
            return true;
          });
      }

      setFilteredEvents(tempEvents);
    };

    applyFilters();
  }, [filters, allEvents]);

  // Fetch user tickets ONLY when tickets tab is active
  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!currentUser || activeTab !== "tickets") {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('=== FETCHING TICKETS ===');
        const ticketsData = await mwakwaData.tickets.filter({ user_id: currentUser.id }, '-created_date');
        const transformedTickets: UserTicket[] = await Promise.all(ticketsData.map(async (ticket) => {
          const ticketType = ticket.ticket_type_id ? await mwakwaData.ticketTypes.get(String(ticket.ticket_type_id)).catch(() => null) : null;
          const event = await mwakwaData.events.get(String(ticket.event_id)).catch(() => null);
          const ticketFormat = ticketType?.format === 'online' ? 'online' as const : 'in-person' as const;
          return {
            id: String(ticket.id), eventId: String(event?.id || ticket.event_id || '0'), eventTitle: event?.title || 'Unknown Event',
            eventDate: event?.event_date || '', eventTime: event?.start_time || '', eventLocation: event?.location_name || '',
            ticketType: ticketType?.name || 'General', ticketFormat, quantity: Number(ticket.quantity || 1), totalPrice: Number(ticket.total || 0),
            purchaseDate: ticket.created_date, status: (ticket.ticket_status as UserTicket['status']) || 'confirmed', userId: ticket.user_id || '', qrCodeData: ticket.qr_code_data || undefined
          };
        }));

        console.log(`Sending ${transformedTickets.length} tickets to TicketSection (will deduplicate there)`);
        setUserTickets(transformedTickets);
        
      } catch (err) {
        console.error("Error fetching user tickets:", err);
        setError("Failed to load tickets");
        setUserTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTickets();
  }, [currentUser, activeTab]);

  const handleEventClick = (event: TransformedEvent) => {
    router.push(`/events/${event.id}`);
  };

  const handleTabChange = (tab: "events" | "tickets") => {
    setActiveTab(tab);
    setError(null);
  };

  const handleTicketSubTabChange = (subTab: 'active' | 'expired') => {
    console.log('Ticket sub-tab changed to:', subTab);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };
  
  if (error && activeTab === "events") {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  
  return (
    <main className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Events</h1>
          <p className="text-gray-600 mt-2">View all events and Check your tickets</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => handleTabChange("events")}
              className={`py-2 px-4 font-medium text-sm relative ${
                activeTab === "events"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Events 
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {allEvents.length}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("tickets")}
              className={`py-2 px-4 font-medium text-sm relative ${
                activeTab === "tickets"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              My Tickets
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {deduplicatedTicketCount}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "events" ? (
          <div className="relative z-10">
            <div className="relative z-50">
              <EventFilters onFilterChange={handleFilterChange} />
            </div>

            {/* Events Section */}
            {filteredEvents.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-sm mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    No events available</h3>
                  <p className="text-gray-600 mb-6">
                    There are currently no events that match your filter criteria.
                  </p>
                  <button 
                    onClick={() => router.push('/events')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse All Events
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => handleEventClick(event)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Tickets Section */}
            <TicketsSection
              userTickets={userTickets}
              user={currentUser || undefined}
              onTabChange={handleTicketSubTabChange}
              onTicketCountChange={setDeduplicatedTicketCount}
              isLoading={loading}
              error={error}
              userId={currentUser?.id}
            />
          </div>
        )}
      </div>
    </main>
  );
}
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;