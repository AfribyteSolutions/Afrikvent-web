import { useState, useEffect } from 'react';
import { Event } from '@/types/event';
import { EventService } from '@/lib/event/eventService';

/**
 * Custom hook to fetch recommended events.
 * @param limit The maximum number of events to fetch.
 */
export const useRecommendedEvents = (limit?: number) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await EventService.getRecommendedEvents(limit);
        setEvents(data);
      } catch (err) {
        setError('Failed to fetch recommended events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [limit]);

  return { events, loading, error };
};



/**
 * Custom hook to fetch upcoming events.
 * @param limit The maximum number of events to fetch.
 */
export const useUpcomingEvents = (limit?: number) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await EventService.getUpcomingEvents(limit);
        setEvents(data);
      } catch (err) {
        setError('Failed to fetch upcoming events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [limit]);

  return { events, loading, error };
};


/**
 * Custom hook to fetch a single event by its ID.
 * @param id The ID of the event to fetch.
 */
export const useEventById = (id: string) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await EventService.getEventById(id);
        setEvent(data);
      } catch (err) {
        setError('Failed to fetch event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  return { event, loading, error };
};


/**
 * Custom hook to search for events based on a query.
 * @param query The search query string.
 */
export const useSearchEvents = (query: string) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setEvents([]);
      return;
    }

    const searchEvents = async () => {
      try {
        setLoading(true);
        const data = await EventService.searchEvents(query);
        setEvents(data);
      } catch (err) {
        setError('Failed to search events');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to prevent excessive API calls
    const timeoutId = setTimeout(searchEvents, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return { events, loading, error };
};


/**
 * Custom hook to fetch sponsored events.
 * @param limit The maximum number of events to fetch.
 */
export const useSponsoredEvents = (limit?: number) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSponsoredEvents = async () => {
      try {
        setLoading(true);
        const data = await EventService.getSponsoredEvents(limit);
        setEvents(data);
      } catch (err) {
        setError('Failed to fetch sponsored events');
      } finally {
        setLoading(false);
      }
    };

    fetchSponsoredEvents();
  }, [limit]);

  return { events, loading, error };
};