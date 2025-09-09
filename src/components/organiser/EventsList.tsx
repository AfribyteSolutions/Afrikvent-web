// src/components/organiser/EventsList.tsx
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  image: string;
  status: 'draft' | 'published' | 'ended' | 'cancelled';
  ticketsSold: number;
  totalTickets: number;
  revenue: number;
  price: number;
}

interface EventsListProps {
  limit?: number;
  showCreateButton?: boolean;
}

const EventsList: React.FC<EventsListProps> = ({ 
  limit, 
  showCreateButton = true 
}) => {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock events data - replace with actual API call
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Tech Conference 2024',
      date: '2024-03-15',
      location: 'Accra Convention Center',
      image: '/images/event1.jpg',
      status: 'published',
      ticketsSold: 150,
      totalTickets: 500,
      revenue: 15000,
      price: 100
    },
    {
      id: '2',
      title: 'Music Festival Summer',
      date: '2024-04-20',
      location: 'Independence Square',
      image: '/images/event2.jpg',
      status: 'published',
      ticketsSold: 800,
      totalTickets: 1000,
      revenue: 40000,
      price: 50
    },
    {
      id: '3',
      title: 'Business Workshop',
      date: '2024-02-10',
      location: 'Online',
      image: '/images/event3.jpg',
      status: 'ended',
      ticketsSold: 75,
      totalTickets: 100,
      revenue: 3750,
      price: 50
    },
    {
      id: '4',
      title: 'Art Exhibition',
      date: '2024-05-01',
      location: 'National Museum',
      image: '/images/event4.jpg',
      status: 'draft',
      ticketsSold: 0,
      totalTickets: 200,
      revenue: 0,
      price: 25
    }
  ];

  const filteredEvents = limit 
    ? mockEvents.slice(0, limit)
    : mockEvents.filter(event => 
        filterStatus === 'all' || event.status === filterStatus
      );

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Event['status']) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'published':
        return 'Live';
      case 'ended':
        return 'Ended';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleEventClick = (eventId: string) => {
    router.push(`/organiser/events/${eventId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {limit ? 'Recent Events' : 'My Events'}
          </h2>
          {showCreateButton && (
            <button 
              onClick={() => router.push('/organiser/events/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Create Event
            </button>
          )}
        </div>

        {!limit && (
          <div className="flex gap-2">
            {['all', 'draft', 'published', 'ended'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  filterStatus === status
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div 
              key={event.id} 
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleEventClick(event.id)}
            >
              <div className="flex items-start gap-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {getStatusText(event.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>📅 {formatDate(event.date)}</span>
                    <span>📍 {event.location}</span>
                    <span>💰 ₵{event.price}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tickets Sold</span>
                      <p className="font-medium">{event.ticketsSold}/{event.totalTickets}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Revenue</span>
                      <p className="font-medium">₵{event.revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Progress</span>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(event.ticketsSold / event.totalTickets) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/organiser/events/${event.id}/edit`);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Event"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle delete - show confirmation dialog
                      console.log('Delete event:', event.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Event"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first event.</p>
            <button 
              onClick={() => router.push('/organiser/events/create')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Event
            </button>
          </div>
        )}
      </div>

      {limit && filteredEvents.length > 0 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button 
            onClick={() => router.push('/organiser?tab=events')}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            View All Events
          </button>
        </div>
      )}
    </div>
  );
};

export default EventsList;