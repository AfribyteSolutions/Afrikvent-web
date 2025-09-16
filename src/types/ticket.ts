// src/types/ticket.ts
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
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
  