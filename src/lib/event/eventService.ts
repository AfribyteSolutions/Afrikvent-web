// src/lib/event/eventService.ts
import { supabase } from "@/lib/supabaseClient";
import { TransformedEvent } from "@/utils/eventdatatransformer";
import { Database } from "@/types/database.types";

// Define the nested structure type for better type safety
type EventRow = Database["public"]["Tables"]["EVENTS"]["Row"];
type TicketTypeRow = Database["public"]["Tables"]["TICKET_TYPES"]["Row"];
interface EventWithRelations extends EventRow {
  TICKET_TYPES: TicketTypeRow[];
  USERS: { name: string; email: string }[];
}

/**
 * Reusable function to transform a single event row from the database
 * into the TransformedEvent format for the frontend.
 */
const transformEventRow = async (row: EventWithRelations): Promise<TransformedEvent> => {
  const userName = row.USERS?.length > 0 ? row.USERS[0].name : 'Event Organizer';
  let organizationName = null;
  try {
    const { data: kycData } = await supabase
      .from('ORGANIZER_KYC')
      .select('organization_name')
      .eq('user_id', row.organizer_id)
      .single();
    organizationName = kycData?.organization_name || null;
  } catch (error) {
    // Silently handle if no KYC data exists
  }
  const organizerName = organizationName || userName;
  const minPrice = row.TICKET_TYPES?.length > 0 ? Math.min(...row.TICKET_TYPES.map(ticket => ticket.price || 0)) : 0;
  // Corrected and explicit check for TypeScript
const primaryImage = (row.images && Array.isArray(row.images) && row.images.length > 0)
? row.images[0]
: '/placeholder-event.jpg';
  const ticketOptions = row.TICKET_TYPES?.map(ticket => ({
    type: 'Regular' as const,
    price: String(ticket.price || 0),
    currency: 'GHS',
    currency_symbol: '₵',
    availability: 'Available'
  })) || [];

  return {
    id: row.id.toString(),
    title: row.title,
    date: row.event_date || 'TBD',
    time: row.start_time || 'TBD',
    venue: row.location_name || 'TBD',
    location: row.address || row.location_name || 'Location TBD',
    image: primaryImage,
    organizer: organizerName,
    organizer_name: organizerName,
    organization_name: organizationName || undefined,
    description: row.description || 'No description available',
    ticketOptions: ticketOptions,
    tags: [],
    isSponsored: row.is_sponsored || false,
    price: minPrice > 0 ? String(minPrice) : 'Free',
    currency: 'GHS',
    currency_symbol: '₵',
  };
};

/**
 * Centralized API service for fetching event data from Supabase.
 */
export const EventService = {
  /**
   * Fetches a list of all published events.
   */
  async getEvents(): Promise<TransformedEvent[]> {
    const { data, error } = await supabase
      .from("EVENTS")
      .select(`
        *,
        TICKET_TYPES(*),
        USERS!EVENTS_organizer_id_fkey(name, email)
      `)
      .eq("event_status", "published")
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(error.message);
    }
    const transformedEvents = await Promise.all(
      (data as EventWithRelations[]).map(transformEventRow)
    );
    return transformedEvents;
  },

  /**
   * Fetches upcoming events from Supabase, ordered by date.
   */
  async getUpcomingEvents(limit?: number): Promise<TransformedEvent[]> {
    const query = supabase
      .from("EVENTS")
      .select(`
        *,
        TICKET_TYPES(*),
        USERS!EVENTS_organizer_id_fkey(name, email)
      `)
      .eq("event_status", "published")
      .gte("event_date", new Date().toISOString().split('T')[0])
      .order("event_date", { ascending: true });

    if (limit) {
      query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(error.message);
    }
    const transformedEvents = await Promise.all(
      (data as EventWithRelations[]).map(transformEventRow)
    );
    return transformedEvents;
  },

  /**
   * Fetches recommended events (can be all upcoming events for now).
   */
  async getRecommendedEvents(limit?: number): Promise<TransformedEvent[]> {
    return this.getUpcomingEvents(limit);
  },

  /**
   * Fetches a single event by its ID.
   */
  async getEventById(id: string): Promise<TransformedEvent | null> {
    const { data, error } = await supabase
      .from("EVENTS")
      .select(`
        *,
        TICKET_TYPES(*),
        USERS!EVENTS_organizer_id_fkey(name, email)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(error.message);
    }
    if (!data) return null;
    return transformEventRow(data as EventWithRelations);
  },

  /**
   * Searches for events based on a query string.
   */
  async searchEvents(query: string): Promise<TransformedEvent[]> {
    const { data, error } = await supabase
      .from("EVENTS")
      .select(`
        *,
        TICKET_TYPES(*),
        USERS!EVENTS_organizer_id_fkey(name, email)
      `)
      .eq("event_status", "published")
      .ilike("title", `%${query}%`)
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(error.message);
    }
    const transformedEvents = await Promise.all(
      (data as EventWithRelations[]).map(transformEventRow)
    );
    return transformedEvents;
  },

  /**
   * Fetches sponsored events.
   */
  async getSponsoredEvents(limit?: number): Promise<TransformedEvent[]> {
    const query = supabase
      .from("EVENTS")
      .select(`
        *,
        TICKET_TYPES(*),
        USERS!EVENTS_organizer_id_fkey(name, email)
      `)
      .eq("event_status", "published")
      .eq("is_sponsored", true)
      .order("event_date", { ascending: true });

    if (limit) {
      query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(error.message);
    }
    const transformedEvents = await Promise.all(
      (data as EventWithRelations[]).map(transformEventRow)
    );
    return transformedEvents;
  },
};