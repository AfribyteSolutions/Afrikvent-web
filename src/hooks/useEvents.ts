import { useState, useEffect } from "react";
import { EventService, Event } from "@/lib/event/eventService"; // Import Event type from EventService

/**
 * Custom hook to fetch recommended events.
 */
export const useRecommendedEvents = (limit?: number) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await EventService.getRecommendedEvents(limit);
        setEvents(data);
      } catch (err) {
        console.error('Error fetching recommended events:', err);
        setError("Failed to fetch recommended events");
        setEvents([]); // Clear events on error
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
 */
export const useUpcomingEvents = (limit?: number) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await EventService.getUpcomingEvents(limit);
        setEvents(data);
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
        setError("Failed to fetch upcoming events");
        setEvents([]);
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
 */
export const useEventById = (id: string) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await EventService.getEventById(id);
        setEvent(data);
      } catch (err) {
        console.error('Error fetching event by ID:', err);
        setError("Failed to fetch event");
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  return { event, loading, error };
};

/**
 * Custom hook to search for events.
 */
export const useSearchEvents = (query: string) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }

    const searchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await EventService.searchEvents(query);
        setEvents(data);
      } catch (err) {
        console.error('Error searching events:', err);
        setError("Failed to search events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchEvents, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return { events, loading, error };
};

/**
 * Custom hook to fetch sponsored events.
 */
export const useSponsoredEvents = (limit?: number) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSponsoredEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await EventService.getSponsoredEvents(limit);
        setEvents(data);
      } catch (err) {
        console.error('Error fetching sponsored events:', err);
        setError("Failed to fetch sponsored events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsoredEvents();
  }, [limit]);

  return { events, loading, error };
};

// Re-export the Event type for components that need it
export type { Event } from "@/lib/event/eventService";