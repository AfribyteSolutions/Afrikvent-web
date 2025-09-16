// src/utils/ticketUtils.ts
import { UserTicket, EnhancedTicket } from '@/types/ticket';

/**
 * Convert UserTicket to EnhancedTicket with additional properties
 */
export const enhanceTicket = (ticket: UserTicket): EnhancedTicket => {
  const eventDate = new Date(ticket.eventDate);
  const now = new Date();
  
  // Generate order ID based on ticket and event data
  const orderId = generateOrderId(ticket);
  
  // Generate QR code data
  const qrCode = generateQRData(ticket, orderId);
  
  // Determine ticket status
  const ticketStatus: 'active' | 'expired' = eventDate < now ? 'expired' : 'active';
  
  return {
    ...ticket,
    qrCode,
    orderId,
    ticketStatus,
    validUntil: eventDate.toISOString(),
    seatNumber: generateSeatNumber(),
    gate: generateGate(),
  };
};

/**
 * Generate unique order ID
 */
export const generateOrderId = (ticket: UserTicket): string => {
  const prefix = 'AFV';
  const ticketId = ticket.id.padStart(6, '0');
  const eventCode = ticket.eventId.slice(-2).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  
  return `${prefix}${ticketId}${eventCode}${timestamp}`;
};

/**
 * Generate QR code data with ticket verification info
 */
export const generateQRData = (ticket: UserTicket, orderId: string): string => {
  const qrData = {
    ticketId: ticket.id,
    eventId: ticket.eventId,
    orderId,
    userId: ticket.userId || 'guest',
    validationCode: generateValidationCode(ticket),
    timestamp: new Date().toISOString(),
  };
  
  return JSON.stringify(qrData);
};

/**
 * Generate validation code for ticket verification
 */
export const generateValidationCode = (ticket: UserTicket): string => {
  const hash = btoa(`${ticket.id}-${ticket.eventId}-${ticket.purchaseDate}`)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase();
  
  return hash;
};

/**
 * Generate random seat number
 */
export const generateSeatNumber = (): string => {
  const sections = ['A', 'B', 'C', 'D', 'VIP'];
  const section = sections[Math.floor(Math.random() * sections.length)];
  const row = Math.floor(Math.random() * 20) + 1;
  const seat = Math.floor(Math.random() * 25) + 1;
  
  return `${section}${row}-${seat}`;
};

/**
 * Generate random gate
 */
export const generateGate = (): string => {
  const gates = ['Gate 1', 'Gate 2', 'Gate 3', 'VIP Entrance', 'Main Entrance'];
  return gates[Math.floor(Math.random() * gates.length)];
};

/**
 * Format date for ticket display
 */
export const formatTicketDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format time for ticket display
 */
export const formatTicketTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Calculate days until event
 */
export const getDaysUntilEvent = (eventDate: string): number => {
  const event = new Date(eventDate);
  const now = new Date();
  const diffTime = event.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Filter tickets based on criteria
 */
export const filterTickets = (
  tickets: EnhancedTicket[],
  filters: { status?: string; search?: string; dateRange?: string }
): EnhancedTicket[] => {
  return tickets.filter(ticket => {
    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status !== ticket.ticketStatus) {
        return false;
      }
    }
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesTitle = ticket.eventTitle.toLowerCase().includes(searchTerm);
      const matchesLocation = ticket.eventLocation.toLowerCase().includes(searchTerm);
      const matchesOrderId = ticket.orderId.toLowerCase().includes(searchTerm);
      
      if (!matchesTitle && !matchesLocation && !matchesOrderId) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const eventDate = new Date(ticket.eventDate);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'upcoming':
          if (eventDate <= now) return false;
          break;
        case 'past':
          if (eventDate > now) return false;
          break;
        case 'thisWeek':
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (eventDate < now || eventDate > weekFromNow) return false;
          break;
        case 'thisMonth':
          const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          if (eventDate < now || eventDate > monthFromNow) return false;
          break;
      }
    }
    
    return true;
  });
};

/**
 * Validate QR code data
 */
export const validateQRCode = (qrData: string): boolean => {
  try {
    const data = JSON.parse(qrData);
    return !!(data.ticketId && data.eventId && data.orderId && data.validationCode);
  } catch {
    return false;
  }
};

/**
 * Get ticket status color
 */
export const getStatusColor = (status: 'active' | 'expired'): string => {
  return status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
};

/**
 * Get priority level based on days until event
 */
export const getTicketPriority = (eventDate: string): 'high' | 'medium' | 'low' => {
  const daysUntil = getDaysUntilEvent(eventDate);
  
  if (daysUntil < 0) return 'low'; // Past event
  if (daysUntil <= 7) return 'high'; // This week
  if (daysUntil <= 30) return 'medium'; // This month
  
  return 'low'; // Future
};