// src/data/mockTickets.ts
import { UserTicket } from '@/types/ticket';

export const mockUserTickets: UserTicket[] = [
  // Active Upcoming Events
  {
    id: "ticket_001",
    eventId: "event_afrobeats_2024",
    eventTitle: "Afrobeats Summer Festival 2024",
    eventDate: "2024-12-25T20:00:00.000Z", // Christmas Day Evening
    eventLocation: "National Theatre of Ghana, Liberation Rd, Accra",
    ticketType: "VIP Gold",
    quantity: 2,
    totalPrice: 180,
    purchaseDate: "2024-09-10T14:30:00.000Z",
    status: "confirmed",
    userId: "user_123",
  },
  {
    id: "ticket_002",
    eventId: "event_tech_summit_2024",
    eventTitle: "Ghana Tech Summit 2024 - Innovation & AI",
    eventDate: "2024-11-28T09:00:00.000Z", // After Thanksgiving
    eventLocation: "Accra International Conference Centre, Ridge",
    ticketType: "Premium Access",
    quantity: 1,
    totalPrice: 95,
    purchaseDate: "2024-09-05T10:15:00.000Z",
    status: "confirmed",
    userId: "user_123",
  },
  {
    id: "ticket_003",
    eventId: "event_food_expo_2024",
    eventTitle: "West African Food & Culture Expo",
    eventDate: "2024-12-14T16:00:00.000Z", // Mid December
    eventLocation: "Labadi Beach Hotel, La Dade Kotopon",
    ticketType: "Premium Experience",
    quantity: 3,
    totalPrice: 270,
    purchaseDate: "2024-08-20T11:45:00.000Z",
    status: "confirmed",
    userId: "user_123",
  },
  {
    id: "ticket_004",
    eventId: "event_fashion_week_2024",
    eventTitle: "African Fashion Week Ghana 2024",
    eventDate: "2024-11-15T18:30:00.000Z", // Mid November
    eventLocation: "Movenpick Ambassador Hotel, Independence Ave",
    ticketType: "VIP Silver",
    quantity: 2,
    totalPrice: 320,
    purchaseDate: "2024-08-15T16:00:00.000Z",
    status: "confirmed",
    userId: "user_123",
  },
  {
    id: "ticket_005",
    eventId: "event_startup_pitch_2024",
    eventTitle: "Ghana Startup Pitch Competition",
    eventDate: "2024-10-25T14:00:00.000Z", // Late October
    eventLocation: "University of Ghana Business School, Legon",
    ticketType: "General Admission",
    quantity: 1,
    totalPrice: 35,
    purchaseDate: "2024-09-01T09:30:00.000Z",
    status: "confirmed",
    userId: "user_123",
  },

  // Expired Past Events
  {
    id: "ticket_006",
    eventId: "event_independence_concert_2024",
    eventTitle: "Independence Day Concert 2024",
    eventDate: "2024-03-06T19:00:00.000Z", // March 6th (Ghana Independence Day)
    eventLocation: "Independence Square, Osu",
    ticketType: "General Admission",
    quantity: 4,
    totalPrice: 160,
    purchaseDate: "2024-02-01T12:20:00.000Z",
    status: "confirmed",
    userId: "user_123",
  },
  {
    id: "ticket_007",
    eventId: "event_jazz_night_2024",
    eventTitle: "Accra Jazz & Blues Night",
    eventDate: "2024-07-20T20:30:00.000Z", // July
    eventLocation: "Alliance Française, East Legon",
    ticketType: "Premium Seating",
    quantity: 2,
    totalPrice: 120,
    purchaseDate: "2024-06-15T15:10:00.000Z",
    status: "confirmed",
    userId: "user_123",
  }
];