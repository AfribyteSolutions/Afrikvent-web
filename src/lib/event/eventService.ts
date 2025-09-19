// lib/event/eventService.ts
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/database.types';

// Use your database types
type EventRow = Database['public']['Tables']['EVENTS']['Row'];
type UserRow = Database['public']['Tables']['USERS']['Row'];
type TicketTypeRow = Database['public']['Tables']['TICKET_TYPES']['Row'];

// Interface for the actual joined query response
interface EventQueryResult extends EventRow {
  USERS: UserRow[];
  TICKET_TYPES: TicketTypeRow[];
}

// Event interface that matches what your components expect
export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  image: string;
  organizer: string;
  description: string;
  ticketOptions: Array<{
    type: 'Regular';
    price: number;
    currency: string;
    availability: string;
  }>;
  tags: string[];
  isSponsored: boolean;
  price: string;
  category: string;
  phone?: string;
}

// Transform database event to your Event interface
const transformEventRow = (row: EventQueryResult): Event => {
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
    id: row.id.toString(),
    title: row.title,
    date: row.event_date || 'TBD',
    time: row.start_time || 'TBD',
    venue: row.location_name || 'TBD',
    location: row.address || row.location_name || 'Location TBD',
    image: primaryImage,
    organizer: organizerName || 'Event Organizer',
    description: row.description || 'No description available',
    ticketOptions: ticketOptions,
    tags: [],
    isSponsored: row.is_sponsored || false,
    price: minPrice > 0 ? `GHS ${minPrice}` : 'Free',
    category: 'General',
    phone: undefined,
  };
};

export class EventService {
  /**
   * Get recommended events (featured or recently created)
   */
  static async getRecommendedEvents(limit: number = 10): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('EVENTS')
        .select(`
          *,
          USERS!inner(name, email),
          TICKET_TYPES(price, name)
        `)
        .eq('event_status', 'published')
        .gte('event_date', new Date().toISOString().split('T')[0]) // Only future events
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recommended events:', error);
        throw new Error('Failed to fetch recommended events');
      }

      return data ? data.map(row => transformEventRow(row as EventQueryResult)) : [];
    } catch (error) {
      console.error('EventService.getRecommendedEvents error:', error);
      throw error;
    }
  }

  /**
   * Get upcoming events (within next 30 days)
   */
  static async getUpcomingEvents(limit: number = 12): Promise<Event[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);

      const { data, error } = await supabase
        .from('EVENTS')
        .select(`
          *,
          USERS!inner(name, email),
          TICKET_TYPES(price, name)
        `)
        .eq('event_status', 'published')
        .gte('event_date', today.toISOString().split('T')[0])
        .lte('event_date', futureDate.toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching upcoming events:', error);
        throw new Error('Failed to fetch upcoming events');
      }

      return data ? data.map(row => transformEventRow(row as EventQueryResult)) : [];
    } catch (error) {
      console.error('EventService.getUpcomingEvents error:', error);
      throw error;
    }
  }

  /**
   * Get sponsored events
   */
  static async getSponsoredEvents(limit: number = 8): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('EVENTS')
        .select(`
          *,
          USERS!inner(name, email),
          TICKET_TYPES(price, name)
        `)
        .eq('event_status', 'published')
        .eq('is_sponsored', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching sponsored events:', error);
        throw new Error('Failed to fetch sponsored events');
      }

      return data ? data.map(row => transformEventRow(row as EventQueryResult)) : [];
    } catch (error) {
      console.error('EventService.getSponsoredEvents error:', error);
      throw error;
    }
  }

  /**
   * Get a single event by ID
   */
  static async getEventById(id: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('EVENTS')
        .select(`
          *,
          USERS!inner(name, email),
          TICKET_TYPES(id, name, description, price, max_quantity)
        `)
        .eq('id', parseInt(id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching event by ID:', error);
        throw new Error('Failed to fetch event');
      }

      return data ? transformEventRow(data as EventQueryResult) : null;
    } catch (error) {
      console.error('EventService.getEventById error:', error);
      throw error;
    }
  }

  /**
   * Search events by title or description
   */
  static async searchEvents(query: string): Promise<Event[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const { data, error } = await supabase
        .from('EVENTS')
        .select(`
          *,
          USERS!inner(name, email),
          TICKET_TYPES(price, name)
        `)
        .eq('event_status', 'published')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,location_name.ilike.%${query}%`)
        .order('event_date', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error searching events:', error);
        throw new Error('Failed to search events');
      }

      return data ? data.map(row => transformEventRow(row as EventQueryResult)) : [];
    } catch (error) {
      console.error('EventService.searchEvents error:', error);
      throw error;
    }
  }

  /**
   * Get all events with optional filtering
   */
  static async getAllEvents(options?: {
    search?: string;
    location?: string;
    dateRange?: { start: string; end: string };
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Event[]> {
    try {
      let query = supabase
        .from('EVENTS')
        .select(`
          *,
          USERS!inner(name, email),
          TICKET_TYPES(price, name)
        `)
        .eq('event_status', 'published')
        .gte('event_date', new Date().toISOString().split('T')[0]);

      // Apply search filter
      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      // Apply location filter
      if (options?.location) {
        query = query.ilike('location_name', `%${options.location}%`);
      }

      // Apply date range filter
      if (options?.dateRange) {
        query = query
          .gte('event_date', options.dateRange.start)
          .lte('event_date', options.dateRange.end);
      }

      // Apply pagination
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options?.limit || 20)) - 1);
      } else if (options?.limit) {
        query = query.limit(options.limit);
      }

      query = query.order('event_date', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all events:', error);
        throw new Error('Failed to fetch events');
      }

      return data ? data.map(row => transformEventRow(row as EventQueryResult)) : [];
    } catch (error) {
      console.error('EventService.getAllEvents error:', error);
      throw error;
    }
  }

  /**
   * Get events by organizer ID
   */
  static async getEventsByOrganizer(organizerId: string, limit?: number): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('EVENTS')
        .select(`
          *,
          USERS!inner(name, email),
          TICKET_TYPES(price, name)
        `)
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: false })
        .limit(limit || 50);

      if (error) {
        console.error('Error fetching events by organizer:', error);
        throw new Error('Failed to fetch organizer events');
      }

      return data ? data.map(row => transformEventRow(row as EventQueryResult)) : [];
    } catch (error) {
      console.error('EventService.getEventsByOrganizer error:', error);
      throw error;
    }
  }
}