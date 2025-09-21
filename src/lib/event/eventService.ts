// lib/event/eventService.ts - Debug Version
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/database.types';

// Use your database types
type EventRow = Database['public']['Tables']['EVENTS']['Row'];

// Interface for the actual joined query response
interface EventQueryResult extends EventRow {
  ORGANIZER_KYC: {
    organization_name: string;
    bio: string;
  } | null;
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
  organizer_name: string;
  organization_name?: string;
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
  console.log('🔍 Transform input - Full row structure:', {
    id: row.id,
    organizer_id: row.organizer_id,
    title: row.title,
    ORGANIZER_KYC: row.ORGANIZER_KYC,
    // Show if ORGANIZER_KYC exists and what's in it
    hasOrganizerKYC: !!row.ORGANIZER_KYC,
    organizerKYCKeys: row.ORGANIZER_KYC ? Object.keys(row.ORGANIZER_KYC) : null
  });
  
  // Use organization name if available, otherwise fallback
  const organizerName = row.ORGANIZER_KYC?.organization_name || 'Event Organizer';
  
  console.log('🏢 Organization data extracted:', {
    rawOrgName: row.ORGANIZER_KYC?.organization_name,
    finalOrganizerName: organizerName,
    hasOrgData: !!row.ORGANIZER_KYC
  });

  const primaryImage = row.images && row.images.length > 0 ? row.images[0] : '/placeholder-event.jpg';

  const transformedEvent = {
    id: row.id.toString(),
    title: row.title,
    date: row.event_date || 'TBD',
    time: row.start_time || 'TBD',
    venue: row.location_name || 'TBD',
    location: row.address || row.location_name || 'Location TBD',
    image: primaryImage,
    organizer: organizerName,
    organizer_name: organizerName,
    organization_name: row.ORGANIZER_KYC?.organization_name,
    description: row.description || 'No description available',
    ticketOptions: [],
    tags: [],
    isSponsored: row.is_sponsored || false,
    price: 'Free',
    category: 'General',
    phone: undefined,
  };

  console.log('✅ Transformed event result:', {
    id: transformedEvent.id,
    title: transformedEvent.title,
    organization_name: transformedEvent.organization_name,
    organizer: transformedEvent.organizer
  });
  
  return transformedEvent;
};

export class EventService {
  /**
   * Debug method to test database connections
   */
  static async debugDatabaseStructure(): Promise<void> {
    try {
      console.log('🔍 === DATABASE DEBUG START ===');
      
      // Test 1: Check if we can fetch basic events
      console.log('📋 Test 1: Fetching basic events...');
      const { data: basicEvents, error: basicError } = await supabase
        .from('EVENTS')
        .select('id, title, organizer_id, event_status')
        .limit(3);
      
      console.log('Basic events result:', { basicEvents, basicError });
      
      if (!basicEvents || basicEvents.length === 0) {
        console.error('❌ No events found in EVENTS table!');
        return;
      }
      
      // Test 2: Check ORGANIZER_KYC table structure
      console.log('🏢 Test 2: Checking ORGANIZER_KYC table...');
      const { data: kycData, error: kycError } = await supabase
        .from('ORGANIZER_KYC')
        .select('*')
        .limit(5);
      
      console.log('KYC table result:', { kycData, kycError });
      
      if (!kycData || kycData.length === 0) {
        console.warn('⚠️ No data found in ORGANIZER_KYC table!');
      } else {
        console.log('📊 KYC table structure:', Object.keys(kycData[0]));
        console.log('📊 Sample KYC records:', kycData);
      }
      
      // Test 3: Check if any organizer_ids match
      console.log('🔗 Test 3: Checking organizer_id relationships...');
      const eventOrganizerIds = basicEvents.map(e => e.organizer_id);
      console.log('Event organizer_ids:', eventOrganizerIds);
      
      if (kycData && kycData.length > 0) {
        const kycUserIds = kycData.map((kyc) => kyc.user_id);
        console.log('KYC user_ids:', kycUserIds);
        
        const matches = eventOrganizerIds.filter(orgId => kycUserIds.includes(orgId));
        console.log('Matching IDs:', matches);
        
        if (matches.length === 0) {
          console.error('❌ No matching organizer_id/user_id pairs found!');
        } else {
          console.log('✅ Found matches:', matches);
        }
      }
      
      // Test 4: Try manual join for first event
      const firstEvent = basicEvents[0];
      console.log('🔗 Test 4: Manual join for first event:', firstEvent.id);
      
      const { data: manualKyc, error: manualError } = await supabase
        .from('ORGANIZER_KYC')
        .select('*')
        .eq('user_id', firstEvent.organizer_id)
        .single();
      
      console.log('Manual KYC lookup result:', { manualKyc, manualError });
      
      console.log('🔍 === DATABASE DEBUG END ===');
      
    } catch (error) {
      console.error('Debug error:', error);
    }
  }
  
  /**
   * Debug version of getRecommendedEvents with extensive logging
   */
  static async getRecommendedEventsDebug(limit: number = 3): Promise<Event[]> {
    try {
      console.log('🚀 Starting debug fetch of recommended events...');
      
      // First run the debug
      await this.debugDatabaseStructure();
      
      console.log('🔍 Attempting join query...');
      
      // Try the join query with detailed logging
      const { data: events, error: eventsError } = await supabase
        .from('EVENTS')
        .select(`
          *,
          ORGANIZER_KYC(organization_name, bio)
        `)
        .eq('event_status', 'published')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(limit);

      console.log('Join query result:', { 
        events, 
        eventsError,
        eventsCount: events?.length || 0
      });

      if (eventsError) {
        console.error('❌ Join query failed:', eventsError);
        console.log('🔄 Falling back to separate queries...');
        
        return this.getRecommendedEventsWithSeparateQueriesDebug(limit);
      }

      if (!events || events.length === 0) {
        console.warn('⚠️ No events returned from join query');
        return [];
      }

      console.log('📊 Processing events with join data...');
      events.forEach((event, index) => {
        console.log(`Event ${index + 1}:`, {
          id: event.id,
          title: event.title,
          organizer_id: event.organizer_id,
          hasOrganizerKYC: !!event.ORGANIZER_KYC,
          organizerKYCData: event.ORGANIZER_KYC
        });
      });

      return events.map(row => transformEventRow(row as EventQueryResult));
      
    } catch (error) {
      console.error('❌ EventService.getRecommendedEventsDebug error:', error);
      throw error;
    }
  }

  /**
   * Debug version with separate queries
   */
  private static async getRecommendedEventsWithSeparateQueriesDebug(limit: number = 3): Promise<Event[]> {
    try {
      console.log('🔄 Using separate queries debug approach...');
      
      // Get events first
      const { data: events, error } = await supabase
        .from('EVENTS')
        .select('*')
        .eq('event_status', 'published')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching basic events:', error);
        throw new Error('Failed to fetch events');
      }

      if (!events || events.length === 0) {
        console.warn('⚠️ No events found');
        return [];
      }

      console.log(`📋 Found ${events.length} events, fetching organization data...`);

      // For each event, fetch organization data with detailed logging
      const eventsWithOrganizers = await Promise.all(
        events.map(async (event, index) => {
          console.log(`🔍 Processing event ${index + 1}/${events.length}:`, {
            id: event.id,
            title: event.title,
            organizer_id: event.organizer_id
          });
          
          // Fetch organizer KYC data with detailed logging
          const { data: kycData, error: kycError } = await supabase
            .from('ORGANIZER_KYC')
            .select('organization_name, bio, user_id')
            .eq('user_id', event.organizer_id)
            .single();

          console.log(`📊 KYC lookup for event ${event.id}:`, {
            organizer_id: event.organizer_id,
            kycData,
            kycError: kycError ? {
              message: kycError.message,
              code: kycError.code,
              details: kycError.details
            } : null
          });

          if (kycError && kycError.code !== 'PGRST116') {
            console.error(`❌ Unexpected KYC error for event ${event.id}:`, kycError);
          }

          // Create the combined result
          const combinedEvent = {
            ...event,
            ORGANIZER_KYC: kycData
          };

          console.log(`✅ Combined event ${event.id}:`, {
            id: event.id,
            hasKYC: !!kycData,
            organizationName: kycData?.organization_name || 'None'
          });

          return transformEventRow(combinedEvent as EventQueryResult);
        })
      );

      console.log('🎉 All events processed successfully');
      return eventsWithOrganizers;
      
    } catch (error) {
      console.error('❌ EventService.getRecommendedEventsWithSeparateQueriesDebug error:', error);
      throw error;
    }
  }

  /**
   * Regular method - use this after debugging is complete
   */
  static async getRecommendedEvents(limit: number = 10): Promise<Event[]> {
    // For now, use the debug version
    return this.getRecommendedEventsDebug(limit);
  }

  /**
   * Get upcoming events (within next 30 days)
   */
  static async getUpcomingEvents(limit: number = 12): Promise<Event[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);

      const { data: events, error } = await supabase
        .from('EVENTS')
        .select('*')
        .eq('event_status', 'published')
        .gte('event_date', today.toISOString().split('T')[0])
        .lte('event_date', futureDate.toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching upcoming events:', error);
        throw new Error('Failed to fetch upcoming events');
      }

      if (!events || events.length === 0) {
        return [];
      }

      // Fetch organization data for each event
      const eventsWithOrganizers = await Promise.all(
        events.map(async (event) => {
          const { data: kycData } = await supabase
            .from('ORGANIZER_KYC')
            .select('organization_name, bio')
            .eq('user_id', event.organizer_id)
            .single();

          return transformEventRow({
            ...event,
            ORGANIZER_KYC: kycData
          } as EventQueryResult);
        })
      );

      return eventsWithOrganizers;
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
      const { data: events, error } = await supabase
        .from('EVENTS')
        .select('*')
        .eq('event_status', 'published')
        .eq('is_sponsored', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching sponsored events:', error);
        throw new Error('Failed to fetch sponsored events');
      }

      if (!events || events.length === 0) {
        return [];
      }

      const eventsWithOrganizers = await Promise.all(
        events.map(async (event) => {
          const { data: kycData } = await supabase
            .from('ORGANIZER_KYC')
            .select('organization_name, bio')
            .eq('user_id', event.organizer_id)
            .single();

          return transformEventRow({
            ...event,
            ORGANIZER_KYC: kycData
          } as EventQueryResult);
        })
      );

      return eventsWithOrganizers;
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
      const { data: event, error } = await supabase
        .from('EVENTS')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching event by ID:', error);
        throw new Error('Failed to fetch event');
      }

      if (!event) return null;

      const { data: kycData } = await supabase
        .from('ORGANIZER_KYC')
        .select('organization_name, bio')
        .eq('user_id', event.organizer_id)
        .single();

      return transformEventRow({
        ...event,
        ORGANIZER_KYC: kycData
      } as EventQueryResult);
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

      const { data: events, error } = await supabase
        .from('EVENTS')
        .select('*')
        .eq('event_status', 'published')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,location_name.ilike.%${query}%`)
        .order('event_date', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error searching events:', error);
        throw new Error('Failed to search events');
      }

      if (!events || events.length === 0) {
        return [];
      }

      const eventsWithOrganizers = await Promise.all(
        events.map(async (event) => {
          const { data: kycData } = await supabase
            .from('ORGANIZER_KYC')
            .select('organization_name, bio')
            .eq('user_id', event.organizer_id)
            .single();

          return transformEventRow({
            ...event,
            ORGANIZER_KYC: kycData
          } as EventQueryResult);
        })
      );

      return eventsWithOrganizers;
    } catch (error) {
      console.error('EventService.searchEvents error:', error);
      throw error;
    }
  }
}

// Export the debug method for easy access
export const debugEventService = EventService.debugDatabaseStructure;