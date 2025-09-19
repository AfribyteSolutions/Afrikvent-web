// types/index.ts

export interface User {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    image_url?: string;
    role?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    last_login_at?: string;
  }
  
  export interface Event {
    id: number;
    title: string;
    date: string | null;
    time: string | null;
    location: string | null;
    image: string | string[] | null;
    price: number;
    category: string;
    venue: string;
    organizer: string;
    description: string;
    ticketOptions?: TicketType[];
    // Additional fields from database
    address?: string | null;
    end_time?: string | null;
    event_status: string;
    images?: string[] | null;
    is_featured?: boolean | null;
    is_sponsored?: boolean | null;
    latitude?: number | null;
    longitude?: number | null;
    organizer_id?: string | null;
    sponsor_logo_url?: string | null;
    sponsor_name?: string | null;
    created_at?: string;
    updated_at?: string | null;
  }
  
  export interface TicketType {
    id: number;
    name: string | null;
    description: string | null;
    price: number | null;
    max_quatity?: number | null;
    ticket_image_url?: string | null;
    event_id?: number | null;
    created_at?: string;
  }
  
  export interface UserTicket {
    id: number;
    eventId: string | number;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    ticketType: string;
    quantity: number;
    totalPrice: number;
    purchaseDate: string;
    status: 'confirmed' | 'pending' | 'cancelled' | 'used';
    userId: string;
    // Additional fields
    qr_code_data?: string | null;
    unit_price?: number | null;
    used_at?: string | null;
    scanned_by?: string | null;
    ticket_status?: string | null;
  }
  
  // Provider response interface for payment providers
  export interface ProviderResponse {
    status?: string;
    message?: string;
    transaction_id?: string;
    reference?: string;
    code?: string;
    data?: Record<string, unknown>;
    error?: string;
    [key: string]: unknown; // Allow additional properties
  }
  
  export interface Payment {
    id: number;
    user_id: string | null;
    amount: number | null;
    currency: string | null;
    payment_method: string | null;
    payment_status: string | null;
    reference_number: string | null;
    transaction_id: string | null;
    mobile_money_provider: string | null;
    mobile_number: string | null;
    provider_response?: ProviderResponse | null;
    created_at: string;
    completed_at?: string | null;
    failed_at?: string | null;
  }
  
  export interface Ticket {
    id: number;
    user_id: string | null;
    event_id: number | null;
    ticket_type_id: number | null;
    quantity: string | null;
    unit_price: number | null;
    total: number | null;
    ticket_status: string | null;
    qr_code_data: string | null;
    created_at: string;
    updated_at: string | null;
    used_at: string | null;
    scanned_by: string | null;
  }
  
  // Filter interface
  export interface FilterState {
    search: string;
    location: string;
    priceRange: string;
    dateRange: string;
  }