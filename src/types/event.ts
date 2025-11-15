// types/event.ts
import { Database } from './database.types';

// UI/Frontend Event types
export interface TicketOption {
  type: string;
  price: string;
  currency: string;
  availability: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  image: string;
  organizer: string;
  price: string;
  tags: string[];
  isSponsored?: boolean;
  ticketOptions?: TicketOption[];
}

// Database types from Supabase
export interface DatabaseEvent {
  id: number;
  title: string;
  description: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  address: string | null;
  images: string[] | null;
  event_status: string;
  is_sponsored: boolean | null;
  sponsor_name: string | null;
  sponsor_logo_url?: string | null;
  organizer_id: string | null;
  latitude: number | null;
  longitude: number | null;
  currency?: string | null;
  currency_symbol?: string | null;
  is_featured?: boolean | null;
  created_at: string;
  updated_at: string | null;
}

export interface DatabaseTicketType {
  id: number;
  event_id: number | null;
  name: string | null;
  description: string | null;
  price: number | null;
  max_quatity: number | null;
  ticket_image_url: string | null;
  format?: string | null; // 'online' | 'physical'
  currency?: string | null;
  currency_symbol?: string | null;
  created_at: string;
}

// Type aliases from database.types
export type EventRow = Database['public']['Tables']['EVENTS']['Row'];
export type TicketTypeRow = Database['public']['Tables']['TICKET_TYPES']['Row'];
export type CommentRow = Database['public']['Tables']['EVENT_COMMENTS']['Row'];
export type UserRow = Database['public']['Tables']['USERS']['Row'];
export type TicketRow = Database['public']['Tables']['TICKETS']['Row'];

// Extended event with related data
export interface EventWithDetails extends DatabaseEvent {
  USERS: UserRow | null;
  organization_name?: string;
  ticketTypes: TicketTypeRow[];
  comments: (CommentRow & { USERS: UserRow | null })[];
}

// Organizer Profile types
export interface SocialLinks {
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
}

export interface OrganizerProfile {
  id?: number;
  user_id: string;
  organization_name: string;
  bio: string;
  social_links: SocialLinks;
  passport_photo_url: string;
  id_front_photo_url: string;
  id_back_photo_url: string;
  selfie_with_id_url: string;
  kyc_status: string;
  rejection_reason?: string;  // ✅ Use optional instead of null
  created_at: string;
  updated_at?: string;  // ✅ Use optional instead of null
}

// Live Streaming types
export interface LiveStream {
  id: number;
  event_id: number;
  channel_name: string;
  status: 'scheduled' | 'live' | 'ended';
  started_at: string | null;
  ended_at: string | null;
  organizer_id: string;
  viewer_count: number;
  created_at: string;
  updated_at: string;
}

export interface StreamTokenResponse {
  token: string;
  channel: string;
  uid: string;
  appId: string;
  expiresAt: number;
}

export interface StartStreamResponse {
  success: boolean;
  stream: {
    id: number;
    channel: string;
    token: string;
    uid: string;
    appId: string;
  };
}

// Ticket with code for online events
export interface TicketWithCode extends TicketRow {
  ticket_code?: string;
  TICKET_TYPES?: TicketTypeRow;
  EVENTS?: EventRow;
}