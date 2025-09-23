// utils/eventDataTransformer.ts
import { Database } from '@/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Currency list and helper
 */
const currencies: {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}[] = [
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇸🇳' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', flag: '🇨🇲' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', flag: '🇺🇬' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', flag: '🇹🇿' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', flag: '🇪🇹' },
  { code: 'EGP', symbol: '£', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham', flag: '🇲🇦' },
  { code: 'BWP', symbol: 'P', name: 'Botswanan Pula', flag: '🇧🇼' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' }
];

function getCurrencySymbol(code?: string): string {
  if (!code) return 'CFA';
  const found = currencies.find(c => c.code === code);
  return found ? found.symbol : 'CFA';
}

/**
 * Types from DB
 */
type DatabaseEvent = Database['public']['Tables']['EVENTS']['Row'];
type DatabaseTicketType = Database['public']['Tables']['TICKET_TYPES']['Row'];
type DatabaseUser = Database['public']['Tables']['USERS']['Row'];
type DatabaseOrganizerKYC = Database['public']['Tables']['ORGANIZER_KYC']['Row'];

/**
 * Shape we expect when fetching with relations
 */
export interface EventWithRelations extends DatabaseEvent {
  organizer?: DatabaseUser | null;
  organizer_kyc?: DatabaseOrganizerKYC | null;
  ticket_types?: DatabaseTicketType[] | null;
}

/**
 * Output interface for UI
 */
export interface TransformedEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  image: string;
  organizer: string;
  organization_name?: string;
  organizer_name?: string;
  price: string;
  currency: string;
  currency_symbol: string;
  tags: string[];
  isSponsored?: boolean;
  ticketOptions?: TicketOption[];
}

interface TicketOption {
  type: string;
  price: string;
  currency: string;
  currency_symbol: string;
  availability: string;
}

/**
 * Transform a DB event (with relations) -> TransformedEvent
 */
export function transformDatabaseEventToDisplayEvent(
  dbEvent: EventWithRelations
): TransformedEvent {
  // Fallback defaults
  const FALLBACK_CODE = 'XOF';
  const FALLBACK_SYMBOL = getCurrencySymbol(FALLBACK_CODE);

  const tickets = Array.isArray(dbEvent.ticket_types) ? dbEvent.ticket_types : [];

  // Determine event-level currency: event.currency (if set) else fallback
  const eventCurrencyCode = (dbEvent.currency ?? undefined) || FALLBACK_CODE;
  const eventCurrencySymbol = (dbEvent.currency_symbol ?? undefined) || getCurrencySymbol(eventCurrencyCode);

  // Price calculation: find lowest paid ticket price across ticket types
  const paidTicketPrices = tickets
    .map(t => (typeof t.price === 'number' ? t.price : null))
    .filter((p): p is number => p !== null && p > 0);

  let priceText: string;
  let priceCurrencyCode = eventCurrencyCode;
  let priceCurrencySymbol = eventCurrencySymbol;

  if (paidTicketPrices.length === 0) {
    // No paid tickets found
    priceText = 'Free';
  } else {
    const lowest = Math.min(...paidTicketPrices);
    // prefer currency from the lowest-priced ticket if present
    const lowestTicket = tickets.find(t => t.price === lowest);
    if (lowestTicket && (lowestTicket.currency ?? null)) {
      priceCurrencyCode = lowestTicket.currency!;
      priceCurrencySymbol = lowestTicket.currency_symbol ?? getCurrencySymbol(priceCurrencyCode);
    }
    priceText = String(lowest);
  }

  // Ticket options mapping
  const ticketOptions: TicketOption[] = tickets.map((ticket) => {
    const code = ticket.currency ?? eventCurrencyCode ?? FALLBACK_CODE;
    const symbol = ticket.currency_symbol ?? getCurrencySymbol(code);
    const availability = typeof ticket.max_quatity === 'number' ? `${ticket.max_quatity} available` : 'Available';

    return {
      type: ticket.name ?? 'General',
      price: typeof ticket.price === 'number' ? String(ticket.price) : '0',
      currency: code,
      currency_symbol: symbol,
      availability,
    };
  });

  // Organizer info
  const organizerName = dbEvent.organizer_kyc?.organization_name ?? dbEvent.organizer?.name ?? 'Event Organizer';

  // Image
  const image = Array.isArray(dbEvent.images) && dbEvent.images.length > 0 ? dbEvent.images[0] : '/api/placeholder/400/600';

  return {
    id: String(dbEvent.id ?? ''),
    title: dbEvent.title ?? '',
    description: dbEvent.description ?? '',
    date: dbEvent.event_date ?? '',
    time: dbEvent.start_time ?? 'TBD',
    venue: dbEvent.address ?? 'TBD',
    location: dbEvent.location_name ?? 'TBD',
    image,
    organizer: organizerName,
    organization_name: dbEvent.organizer_kyc?.organization_name ?? undefined,
    organizer_name: dbEvent.organizer?.name ?? undefined,
    price: priceText,
    currency: priceCurrencyCode,
    currency_symbol: priceCurrencySymbol,
    tags: [],
    isSponsored: Boolean(dbEvent.is_sponsored ?? false),
    ticketOptions,
  };
}

/**
 * Fetch events (with relations) and transform them.
 */
export async function fetchAndTransformEvents(
  supabase: SupabaseClient<Database>
): Promise<TransformedEvent[]> {
  try {
    const res = await supabase
      .from('EVENTS')
      .select(`
        *,
        organizer:USERS!organizer_id(
          name,
          email
        ),
        organizer_kyc:ORGANIZER_KYC!organizer_id(
          organization_name
        ),
        ticket_types:TICKET_TYPES(
          id,
          name,
          description,
          price,
          max_quatity,
          currency,
          currency_symbol
        )
      `)
      .eq('event_status', 'published')
      .order('created_at', { ascending: false });

    // type-assert the returned rows to our relational shape
    const events = (res.data as EventWithRelations[] | null) ?? [];

    if (res.error) {
      console.error('Error fetching events:', res.error);
      throw res.error;
    }

    return events.map(evt => transformDatabaseEventToDisplayEvent(evt));
  } catch (err) {
    console.error('Error in fetchAndTransformEvents:', err);
    throw err;
  }
}
