// types/event.ts
export interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: string;
    location: string;
    image: string;
    organizer: string;
    description: string;
    ticketOptions: TicketOption[];
    tags?: string[];
    isSponsored?: boolean;
    price?: string;
    category?: string;
    phone?: string;

  }
  
  export interface TicketOption {
    type: 'Regular' | 'VIP' | 'Ultra VIP';
    price: number;
    currency: string;
    availability: string;
  }