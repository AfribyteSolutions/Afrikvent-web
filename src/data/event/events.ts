// data/events.ts
import { Event } from '@/types/event';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Kamer Youths Night',
    date: '2025-05-12',
    time: '10:00 PM CAT',
    venue: 'Alliance Franco',
    location: 'Buea',
    image: '/images/events/1.jpg',
    organizer: 'Obi Diego, Buea Council',
    description: 'Kamer Youths Night will surely be one to remember as youths all over the nation will gather to have fun, showcase talents and praise God. This event promises an unforgettable evening of music, dance, and community spirit.',
    ticketOptions: [
      { type: 'Regular', price: 2500, currency: 'XAF', availability: '100 available' },
      { type: 'VIP', price: 5000, currency: 'XAF', availability: '50 available' },
      { type: 'Ultra VIP', price: 10000, currency: 'XAF', availability: '20 available' }
    ],
    tags: ['Youth', 'Music', 'Entertainment', 'Community'],
    isSponsored: false
  },
  {
    id: '2',
    title: 'NexDim Empire',
    date: '2025-05-15',
    time: '8:00 PM CAT',
    venue: 'Chariot Hotel',
    location: 'Buea',
    image: '/images/events/2.jpg',
    organizer: 'NexDim Events',
    description: 'An exclusive night of entertainment and networking featuring top artists and industry professionals. Connect with like-minded individuals while enjoying world-class performances.',
    ticketOptions: [
      { type: 'Regular', price: 3000, currency: 'XAF', availability: '200 available' },
      { type: 'VIP', price: 6000, currency: 'XAF', availability: '75 available' }
    ],
    tags: ['Entertainment', 'Networking', 'Music'],
    isSponsored: true
  },
  {
    id: '3',
    title: 'CIMFEST 2025',
    date: '2025-06-20',
    time: '6:00 PM CAT',
    venue: 'Molyko Stadium',
    location: 'Buea',
    image: '/images/events/3.jpg',
    organizer: 'CIMFEST Organizers',
    description: 'The biggest music festival in Cameroon featuring local and international artists. Experience three days of non-stop entertainment, food, and cultural celebration.',
    ticketOptions: [
      { type: 'Regular', price: 5000, currency: 'XAF', availability: '500 available' },
      { type: 'VIP', price: 15000, currency: 'XAF', availability: '100 available' },
      { type: 'Ultra VIP', price: 25000, currency: 'XAF', availability: '50 available' }
    ],
    tags: ['Music', 'Festival', 'Entertainment', 'Culture'],
    isSponsored: false
  },
  {
    id: '4',
    title: 'Prince Orock Birthday Bash',
    date: '2025-05-25',
    time: '9:00 PM CAT',
    venue: 'Chariot Hotel',
    location: 'Buea',
    image: '/images/events/4.jpg',
    organizer: 'Prince Orock Team',
    description: 'Join us for an unforgettable birthday celebration with live performances, special guests, and amazing prizes. A night you won\'t want to miss!',
    ticketOptions: [
      { type: 'Regular', price: 2000, currency: 'XAF', availability: '300 available' },
      { type: 'VIP', price: 8000, currency: 'XAF', availability: '80 available' }
    ],
    tags: ['Birthday', 'Music', 'Party', 'Celebration'],
    isSponsored: false
  },
  {
    id: '5',
    title: 'Tech Summit Cameroon',
    date: '2025-07-10',
    time: '9:00 AM CAT',
    venue: 'University of Buea',
    location: 'Buea',
    image: '/images/events/5.jpg',
    organizer: 'Tech Community Cameroon',
    description: 'Annual technology conference bringing together developers, entrepreneurs, and tech enthusiasts. Learn about the latest trends in AI, blockchain, and software development.',
    ticketOptions: [
      { type: 'Regular', price: 15000, currency: 'XAF', availability: '200 available' },
      { type: 'VIP', price: 25000, currency: 'XAF', availability: '50 available' }
    ],
    tags: ['Technology', 'Conference', 'Networking', 'Education'],
    isSponsored: true
  },
  {
    id: '6',
    title: 'Buea Food Festival',
    date: '2025-08-05',
    time: '11:00 AM CAT',
    venue: 'Mountain Hotel',
    location: 'Buea',
    image: '/images/events/6.jpg',
    organizer: 'Buea Restaurant Association',
    description: 'Celebrate the rich culinary heritage of Cameroon with local and international cuisine. Cooking competitions, food tastings, and cultural performances.',
    ticketOptions: [
      { type: 'Regular', price: 1500, currency: 'XAF', availability: '400 available' },
      { type: 'VIP', price: 3500, currency: 'XAF', availability: '100 available' }
    ],
    tags: ['Food', 'Culture', 'Festival', 'Family'],
    isSponsored: false
  },
  {
    id: '7',
    title: 'Business Network Meetup',
    date: '2025-05-30',
    time: '6:30 PM CAT',
    venue: 'Parliamentarian Flats',
    location: 'Buea',
    image: '/images/events/7.jpg',
    organizer: 'Entrepreneurs Hub Buea',
    description: 'Monthly networking event for business owners, freelancers, and entrepreneurs. Share ideas, make connections, and grow your business network.',
    ticketOptions: [
      { type: 'Regular', price: 2000, currency: 'XAF', availability: '150 available' }
    ],
    tags: ['Business', 'Networking', 'Entrepreneurs', 'Professional'],
    isSponsored: false
  },
  {
    id: '8',
    title: 'Cameroon Fashion Week',
    date: '2025-09-15',
    time: '7:00 PM CAT',
    venue: 'Chariot Hotel',
    location: 'Buea',
    image: '/images/events/8.jpg',
    organizer: 'Fashion Designers Association',
    description: 'Showcase of the latest fashion trends from top Cameroonian designers. Runway shows, fashion exhibitions, and style competitions.',
    ticketOptions: [
      { type: 'Regular', price: 8000, currency: 'XAF', availability: '250 available' },
      { type: 'VIP', price: 20000, currency: 'XAF', availability: '60 available' },
      { type: 'Ultra VIP', price: 35000, currency: 'XAF', availability: '30 available' }
    ],
    tags: ['Fashion', 'Design', 'Culture', 'Entertainment'],
    isSponsored: true
  }
];
