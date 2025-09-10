import { Event } from '@/types/event';
import { MOCK_EVENTS } from '@/data/event/events';

export class EventService {
  // Get all events
  static async getAllEvents(): Promise<Event[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return MOCK_EVENTS;
  }

  // Get recommended events (first 6)
  static async getRecommendedEvents(limit: number = 6): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return MOCK_EVENTS.slice(0, limit);
  }

  // Get upcoming events (sorted by date)
  static async getUpcomingEvents(limit?: number): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const sortedEvents = [...MOCK_EVENTS].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return limit ? sortedEvents.slice(0, limit) : sortedEvents;
  }

  // Get nearby events (mock - in real app would use location)
  static async getNearbyEvents(location: string = 'Buea', limit?: number): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const nearbyEvents = MOCK_EVENTS.filter(event => 
      event.location.toLowerCase().includes(location.toLowerCase())
    );
    return limit ? nearbyEvents.slice(0, limit) : nearbyEvents;
  }

  // Get event by ID
  static async getEventById(id: string): Promise<Event | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return MOCK_EVENTS.find(event => event.id === id) || null;
  }

  // Search events
  static async searchEvents(query: string): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const lowerQuery = query.toLowerCase();
    return MOCK_EVENTS.filter(event =>
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description.toLowerCase().includes(lowerQuery) ||
      event.venue.toLowerCase().includes(lowerQuery) ||
      event.organizer.toLowerCase().includes(lowerQuery) ||
      event.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Filter events by category/tag
  static async getEventsByCategory(category: string): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return MOCK_EVENTS.filter(event =>
      event.tags?.some(tag => tag.toLowerCase() === category.toLowerCase())
    );
  }

  // Get sponsored events
  // 💡 Added the 'limit' parameter to the function signature
  static async getSponsoredEvents(limit?: number): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const sponsoredEvents = MOCK_EVENTS.filter(event => event.isSponsored);
    // 💡 Apply the limit if it exists
    return limit ? sponsoredEvents.slice(0, limit) : sponsoredEvents;
  }

  // Get events by date range
  static async getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return MOCK_EVENTS.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= start && eventDate <= end;
    });
  }
}
