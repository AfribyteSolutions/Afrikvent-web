import { mwakwaData } from '@/lib/mwakwaBackend';
import { TransformedEvent } from '@/utils/eventdatatransformer';

type NativeEvent = Record<string, any>;
type NativeTicketType = Record<string, any>;

async function transformEventRow(row: NativeEvent): Promise<TransformedEvent> {
  const ticketTypes = (await mwakwaData.ticketTypes.filter({ event_id: row.id })) as NativeTicketType[];
  const minPrice = ticketTypes.length > 0 ? Math.min(...ticketTypes.map((ticket) => Number(ticket.price || 0))) : 0;
  const primaryImage = Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : '/placeholder-event.jpg';
  const currency = row.currency || 'XAF';
  const currencySymbol = row.currency_symbol || 'FCFA';
  const organizerName = row.organizer_name || 'Event Organizer';

  return {
    id: String(row.id),
    title: row.title,
    date: row.event_date || 'TBD',
    time: row.start_time || 'TBD',
    venue: row.location_name || 'TBD',
    location: row.address || row.location_name || 'Location TBD',
    image: primaryImage,
    organizer: organizerName,
    organizer_name: organizerName,
    description: row.description || 'No description available',
    ticketOptions: ticketTypes.map((ticket) => ({
      type: 'Regular' as const,
      price: String(ticket.price || 0),
      currency: ticket.currency || currency,
      currency_symbol: ticket.currency_symbol || currencySymbol,
      availability: ticket.is_active === false ? 'Unavailable' : 'Available',
    })),
    tags: [],
    isSponsored: Boolean(row.is_sponsored),
    price: minPrice > 0 ? String(minPrice) : 'Free',
    currency,
    currency_symbol: currencySymbol,
  };
}

async function publishedEvents(limit?: number): Promise<NativeEvent[]> {
  return (await mwakwaData.events.filter(
    { event_status: 'published' },
    'event_date',
    limit || 5000,
    0,
  )) as NativeEvent[];
}

export const EventService = {
  async getEvents(): Promise<TransformedEvent[]> {
    const data = await publishedEvents();
    return Promise.all(data.map(transformEventRow));
  },

  async getUpcomingEvents(limit?: number): Promise<TransformedEvent[]> {
    const today = new Date().toISOString().split('T')[0];
    const data = (await publishedEvents()).filter((event) => !event.event_date || event.event_date >= today);
    const sliced = limit ? data.slice(0, limit) : data;
    return Promise.all(sliced.map(transformEventRow));
  },

  async getRecommendedEvents(limit?: number): Promise<TransformedEvent[]> {
    return this.getUpcomingEvents(limit);
  },

  async getEventById(id: string): Promise<TransformedEvent | null> {
    try {
      const data = (await mwakwaData.events.get(id)) as NativeEvent;
      if (!data) return null;
      return transformEventRow(data);
    } catch {
      return null;
    }
  },

  async searchEvents(query: string): Promise<TransformedEvent[]> {
    const search = query.trim().toLowerCase();
    const data = (await publishedEvents()).filter((event) =>
      [event.title, event.description, event.location_name, event.address, event.organizer_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
    return Promise.all(data.map(transformEventRow));
  },

  async getSponsoredEvents(limit?: number): Promise<TransformedEvent[]> {
    const data = (await mwakwaData.events.filter(
      { event_status: 'published', is_sponsored: true },
      'event_date',
      limit || 5000,
      0,
    )) as NativeEvent[];
    return Promise.all(data.map(transformEventRow));
  },
};
