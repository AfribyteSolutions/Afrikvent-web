// types/event.ts

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
  ticketOptions?: TicketOption[]; // Make this optional
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
  organizer_id: string | null;
  latitude: number | null;
  longitude: number | null;
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
  created_at: string;
}