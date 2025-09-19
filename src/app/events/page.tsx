"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import EventCard from "@/components/event/eventcard/EventCard";
import { TicketsSection } from "@/components/tickets/TicketSection";

// Import your generated DB types
import { Database } from "@/types/database.types";
import { Event, UserTicket, User, FilterState } from "@/types/index";

// Correct table row types using UPPERCASE table names from your schema
type EventRow = Database["public"]["Tables"]["EVENTS"]["Row"];
type TicketTypeRow = Database["public"]["Tables"]["TICKET_TYPES"]["Row"];
type PaymentTicketRow = Database["public"]["Tables"]["PAYMENT_TICKETS"]["Row"];
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

  // Fetch events - using correct table name
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        const { data: eventsData, error: eventsError } = await supabase
          .from("EVENTS") // Correct table name
          .select(
            `
            *,
            TICKET_TYPES(*)
          `
          )
          .eq("event_status", "active")
          .order("event_date", { ascending: true });

        if (eventsError) {
          console.error("Events error:", eventsError);
          throw eventsError;
        }

        // Define the nested structure type for better type safety
        interface EventWithTicketTypes extends EventRow {
          TICKET_TYPES: TicketTypeRow[];
        }

        const transformedEvents: Event[] = (eventsData || []).map(
          (event: EventWithTicketTypes) => {
            const ticketTypes = event.TICKET_TYPES || [];
            const minPrice = ticketTypes.length > 0
              ? Math.min(...ticketTypes.map((t) => t.price || 0))
              : 0;

            return {
              id: event.id,
              title: event.title,
              date: event.event_date,
              time: event.start_time,
              location: event.location_name || "",
              image: event.images || "/images/event-placeholder.jpg",
              price: minPrice,
              category: event.event_status,
              venue: event.address || "",
              organizer: event.sponsor_name || "Unknown Organizer",
              description: event.description || "",
              ticketOptions: ticketTypes.map(tt => ({
                id: tt.id,
                name: tt.name,
                description: tt.description,
                price: tt.price,
                max_quatity: tt.max_quatity,
                ticket_image_url: tt.ticket_image_url,
                event_id: tt.event_id,
                created_at: tt.created_at,
              })),
              // Additional fields
              address: event.address,
              end_time: event.end_time,
              event_status: event.event_status,
              images: event.images,
              is_featured: event.is_featured,
              is_sponsored: event.is_sponsored,
              latitude: event.latitude,
              longitude: event.longitude,
              organizer_id: event.organizer_id,
              sponsor_logo_url: event.sponsor_logo_url,
              sponsor_name: event.sponsor_name,
              created_at: event.created_at,
              updated_at: event.updated_at,
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
          .select(
            `
            *,
            TICKET_TYPES(
              *,
              EVENTS(*)
            )
          `
          )
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
              // Convert null to undefined to match UserTicket interface
              qr_code_data: ticket.qr_code_data || undefined,
              unit_price: ticket.unit_price || undefined,
              used_at: ticket.used_at || undefined,
              scanned_by: ticket.scanned_by || undefined,
              ticket_status: ticket.ticket_status || undefined,
            } as UserTicket; // Type assertion to ensure compatibility
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
    // Reset error when switching tabs
    setError(null);
  };

  // Handle ticket sub-tab changes
  const handleTicketSubTabChange = (subTab: 'active' | 'expired') => {
    console.log('Ticket sub-tab changed to:', subTab);
    // You can add additional logic here if needed
  };

  
  if (error && activeTab === "events") {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600 mt-2">Manage your events and tickets</p>
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