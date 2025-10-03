// src/types/ticket.ts - Complete fixed version

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
}

export interface UserTicket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketType: string;
  quantity: number;
  totalPrice: number;
  purchaseDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  userId?: string;
  qrCodeData?: string; // ADDED: QR code data from database
  eventTime?: string;
}

export interface EnhancedTicket extends UserTicket {
  qrCode: string;
  orderId: string;
  ticketStatus: 'active' | 'expired';
  eventImage?: string;
  eventCategory?: string;
  seatNumber?: string;
  gate?: string;
  validUntil?: string;
  validationCode?: string; // Add this line
}

export interface TicketTemplate {
  id: string;
  name: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  showLogo: boolean;
  logoPosition: 'top-left' | 'top-right' | 'center';
  qrPosition: 'right' | 'bottom' | 'center';
}

export interface TicketFilters {
  status: 'all' | 'active' | 'expired';
  eventType: string;
  dateRange: 'all' | 'upcoming' | 'past' | 'thisWeek' | 'thisMonth';
  search: string;
}

export interface TicketActions {
  onDownload: (ticket: EnhancedTicket) => Promise<void>;
  onShare: (ticket: EnhancedTicket) => Promise<void>;
  onCopy: (ticket: EnhancedTicket) => void;
  onView: (ticket: EnhancedTicket) => void;
}

export interface TicketProps {
  ticket: EnhancedTicket;
  template?: TicketTemplate;
  actions: TicketActions;
  user?: User;
  className?: string;
}

export interface TicketsSectionProps {
  userTickets: UserTicket[];
  user?: User;
  onTabChange?: (tab: 'active' | 'expired') => void;
  templates?: TicketTemplate[];
  isLoading?: boolean;
  error?: string | null;
}

// Interface for the detailed payment object from the server
export interface DatabasePayment {
  id: number;
  user_id: string | null;
  amount: number | null;
  currency: string | null;
  payment_method: string | null;
  payment_status: string | null;
  mobile_number: string | null;
  mobile_money_provider: string | null;
  transaction_id: string | null;
  reference_number: string | null;
  provider_response: MobileMoneyProviderResponse | null;
  created_at: string;
  completed_at: string | null;
  failed_at: string | null;
}

// Interface for the detailed ticket object from the server
export interface DatabaseTicket {
  id: number;
  event_id: number | null;
  user_id: string | null;
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
  no_times_scanned?: number | null;
}

// Payment result interface - updated to match your actual data structure
export interface PaymentResult {
  message?: string;
  amount?: number;
  payment?: DatabasePayment;
  tickets?: DatabaseTicket[];
  error?: string;
}

// For your buyTicket function input
export interface TicketPurchaseRequest {
  ticket_id: number;
  quantity: number;
}

export interface DatabaseTicketType {
  id: number;
  event_id: number | null;
  name: string | null;
  description: string | null;
  price: number | null;
  max_quatity: number | null; // Note: this matches your DB schema typo
  ticket_image_url: string | null;
  created_at: string;
}

// Provider response interface for mobile money transactions
export interface MobileMoneyProviderResponse {
  status?: string;
  message?: string;
  transaction_id?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  timestamp?: string;
  error_code?: string;
  [key: string]: unknown;
}

// Helper function to convert database ticket to EnhancedTicket
export function convertDatabaseTicketToEnhanced(
  dbTicket: DatabaseTicket,
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
  ticketTypeName: string
): EnhancedTicket {
  return {
    id: dbTicket.id.toString(),
    eventId: dbTicket.event_id?.toString() || '',
    eventTitle,
    eventDate,
    eventLocation,
    ticketType: ticketTypeName,
    quantity: parseInt(dbTicket.quantity || '1'),
    totalPrice: dbTicket.total || 0,
    purchaseDate: dbTicket.created_at,
    status: dbTicket.ticket_status === 'active' ? 'confirmed' : 
            dbTicket.ticket_status === 'cancelled' ? 'cancelled' : 'pending',
    userId: dbTicket.user_id || '',
    qrCode: dbTicket.qr_code_data || `QR_${dbTicket.id}`,
    orderId: `ORDER_${dbTicket.id}`,
    ticketStatus: (dbTicket.ticket_status as 'active' | 'expired') || 'active',
    qrCodeData: dbTicket.qr_code_data || undefined,
  };
}