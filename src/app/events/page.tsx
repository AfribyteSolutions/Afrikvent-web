"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import EventCard from "@/components/event/eventcard/EventCard";
import { TicketsSection } from "@/components/tickets/TicketSection";

// Use the consistent Event type from your hooks
import { Event } from "@/hooks/useEvents";

// Import your generated DB types for database operations
import { Database } from "@/types/database.types";

// Types for other data
interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
}

interface UserTicket {
  id: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketType: string;
  quantity: number;
  totalPrice: number;
  purchaseDate: string;
  status: "confirmed" | "pending" | "cancelled" | "used";
  userId: string;
  qr_code_data?: string;
  unit_price?: number;
  used_at?: string;
  scanned_by?: string;
  ticket_status?: string;
}

interface FilterState {
  search: string;
  location: string;
  priceRange: string;
  dateRange: string;
}

// Database table row types using UPPERCASE table names
type EventRow = Database["public"]["Tables"]["EVENTS"]["Row"];
type TicketTypeRow = Database["public"]["Tables"]["TICKET_TYPES"]["Row"];
type TicketRow = Database["public"]["Tables"]["TICKETS"]["Row"];

export default function MyEvents() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"events" | "tickets">("events");
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
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
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user:", error);
        return;
      }
      if (data?.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email ?? undefined,
          phone: (data.user.user_metadata?.phone as string) ?? undefined,
          name: (data.user.user_metadata?.name as string) ?? undefined,
        });
      }
    };
    getCurrentUser();
  }, []);

  // Fetch events - Transform to match the consistent Event type
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        const { data: eventsData, error: eventsError } = await supabase
          .from("EVENTS")
          .select(`
            *,
            TICKET_TYPES(*),
            USERS!EVENTS_organizer_id_fkey(name, email)
          `)
          .eq("event_status", "published")
          .gte("event_date", new Date().toISOString().split('T')[0])
          .order("event_date", { ascending: true });

        if (eventsError) {
          console.error("Events error:", eventsError);
          throw eventsError;
        }

        // Define the nested structure type for better type safety
        interface EventWithRelations extends EventRow {
          TICKET_TYPES: TicketTypeRow[];
          USERS: { name: string; email: string }[];
        }

        // Transform to match the consistent Event interface from hooks
        const transformedEvents: Event[] = (eventsData || []).map(
          (row: EventWithRelations) => {
            // Get organizer name from joined USERS data
            const organizerName = row.USERS && row.USERS.length > 0 
              ? row.USERS[0].name 
              : 'Event Organizer';

            // Get minimum ticket price from joined TICKET_TYPES data
            const minPrice = row.TICKET_TYPES && row.TICKET_TYPES.length > 0
              ? Math.min(...row.TICKET_TYPES.map(ticket => ticket.price || 0))
              : 0;

            // Get primary image
            const primaryImage = row.images && row.images.length > 0 ? row.images[0] : '/placeholder-event.jpg';

            // Transform ticket types to match your TicketOption interface
            const ticketOptions = row.TICKET_TYPES?.map(ticket => ({
              type: 'Regular' as const,
              price: ticket.price || 0,
              currency: 'GHS',
              availability: 'Available'
            })) || [];

            return {
              id: row.id.toString(), // Convert to string to match Event interface
              title: row.title,
              date: row.event_date || 'TBD',
              time: row.start_time || 'TBD',
              venue: row.location_name || 'TBD',
              location: row.address || row.location_name || 'Location TBD',
              image: primaryImage,
              organizer: organizerName || 'Event Organizer',
              description: row.description || 'No description available',
              ticketOptions: ticketOptions,
              tags: [], // You might want to add tags to your database
              isSponsored: row.is_sponsored || false,
              price: minPrice > 0 ? `GHS ${minPrice}` : 'Free',
              category: 'General', // You might want to add category field to your database
              phone: undefined, // You might want to get this from organizer data
            };
          }
        );

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

  // Fetch user tickets when switching to tickets tab
  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!currentUser || activeTab !== "tickets") return;

      try {
        setLoading(true);
        setError(null);

        // Fetch tickets for the user
        const { data: ticketsData, error: ticketsError } = await supabase
          .from("TICKETS")
          .select(`
            *,
            TICKET_TYPES(
              *,
              EVENTS(*)
            )
          `)
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (ticketsError) {
          console.error("Tickets error:", ticketsError);
          throw ticketsError;
        }

        // Define the nested structure type for better type safety
        interface TicketWithRelations extends TicketRow {
          TICKET_TYPES: TicketTypeRow & { 
            EVENTS: EventRow 
          };
        }

        const transformedTickets: UserTicket[] = (ticketsData || []).map(
          (ticket: TicketWithRelations) => {
            const ticketType = ticket.TICKET_TYPES;
            const event = ticketType?.EVENTS;

            return {
              id: ticket.id,
              eventId: event?.id || 0,
              eventTitle: event?.title || "Unknown Event",
              eventDate: event?.event_date || "",
              eventLocation: event?.location_name || "",
              ticketType: ticketType?.name || "General",
              quantity: parseInt(ticket.quantity || "1"),
              totalPrice: ticket.total || 0,
              purchaseDate: ticket.created_at,
              status: (ticket.ticket_status as UserTicket["status"]) || "confirmed",
              userId: ticket.user_id || "",
              qr_code_data: ticket.qr_code_data || undefined,
              unit_price: ticket.unit_price || undefined,
              used_at: ticket.used_at || undefined,
              scanned_by: ticket.scanned_by || undefined,
              ticket_status: ticket.ticket_status || undefined,
            };
          }
        );

        setUserTickets(transformedTickets);
      } catch (err) {
        console.error("Error fetching user tickets:", err);
        setError("Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchUserTickets();
  }, [currentUser, activeTab]);

  const handleEventClick = (event: Event) => {
    router.push(`/events/${event.id}`);
  };

  // Tab switching function
  const handleTabChange = (tab: "events" | "tickets") => {
    setActiveTab(tab);
    setError(null);
  };

  // Handle ticket sub-tab changes
  const handleTicketSubTabChange = (subTab: 'active' | 'expired') => {
    console.log('Ticket sub-tab changed to:', subTab);
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
          <p className="text-gray-600 mt-2">view all events and Check your tickets</p>
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
                {userTickets.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "events" ? (
          <div>
            {/* Events Section */}
            {filteredEvents.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-sm mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    No events available
                  </h3>
                  <p className="text-gray-600 mb-6">
                    There are currently no events to display. Check back later!
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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