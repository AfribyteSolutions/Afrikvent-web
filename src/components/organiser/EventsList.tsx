// src/components/organiser/EventsList.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import CreateEventModal from './CreateEventModal';

interface Event {
  id: number;
  title: string;
  event_date: string | null;
  location_name: string | null;
  images: string[] | null;
  event_status: string;
  ticketsSold: number;
  totalTickets: number;
  revenue: number;
  description: string | null;
}

interface EventsListProps {
  limit?: number;
  showCreateButton?: boolean;
  user: User | null;
}

const EventsList: React.FC<EventsListProps> = ({ 
  limit, 
  showCreateButton = true,
  user
}) => {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch events with ticket statistics
      const { data: eventsData, error: eventsError } = await supabase
        .from('EVENTS')
        .select(`
          id,
          title,
          event_date,
          location_name,
          images,
          event_status,
          description
        `)
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
      }

      // For each event, get ticket statistics
      const eventsWithStats = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Get total tickets available
          const { data: ticketTypes } = await supabase
            .from('TICKET_TYPES')
            .select('max_quatity')
            .eq('event_id', event.id);

          const totalTickets = ticketTypes?.reduce((sum, type) => 
            sum + (type.max_quatity || 0), 0
          ) || 0;

          // Get tickets sold and revenue
          const { data: soldTickets } = await supabase
            .from('TICKETS')
            .select('quantity, total, ticket_status')
            .eq('event_id', event.id)
            .in('ticket_status', ['paid', 'used']);

          const ticketsSold = soldTickets?.reduce((sum, ticket) => 
            sum + parseInt(ticket.quantity || '0'), 0
          ) || 0;

          const revenue = soldTickets?.reduce((sum, ticket) => 
            sum + (ticket.total || 0), 0
          ) || 0;

          return {
            ...event,
            ticketsSold,
            totalTickets,
            revenue
          };
        })
      );

      setEvents(eventsWithStats);

    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = limit 
    ? events.slice(0, limit)
    : events.filter(event => 
        filterStatus === 'all' || event.event_status === filterStatus
      );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'active':
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleEventClick = (eventId: number) => {
    router.push(`/organiser/events/${eventId}`);
  };

  const handleCreateEvent = () => {
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
  };

  const handleEventCreated = () => {
    setIsCreateModalOpen(false);
    // Refresh events list
    fetchEvents();
  };

  const handleDeleteEvent = async (eventId: number, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('EVENTS')
        .delete()
        .eq('id', eventId)
        .eq('organizer_id', user?.id); // Extra security check

      if (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
        return;
      }

      // Refresh events list
      fetchEvents();
      alert('Event deleted successfully.');

    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="h-8 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {limit ? 'Recent Events' : 'My Events'}
            </h2>
            {showCreateButton && (
              <button 
                onClick={handleCreateEvent}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Event
              </button>
            )}
          </div>

          {!limit && (
            <div className="flex gap-2">
              {['all', 'draft', 'active', 'ended'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    filterStatus === status
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'active' ? 'live' : status}
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
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                    {event.images && event.images.length > 0 ? (
                      <Image
                        src={event.images[0]}
                        alt={event.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.event_status)}`}>
                        {getStatusText(event.event_status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span>📅 {formatDate(event.event_date)}</span>
                      <span>📍 {event.location_name || 'Location TBD'}</span>
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
                            style={{ width: `${event.totalTickets > 0 ? (event.ticketsSold / event.totalTickets) * 100 : 0}%` }}
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
                        handleDeleteEvent(event.id, event.title);
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
                onClick={handleCreateEvent}
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

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSuccess={handleEventCreated}
        user={user}
      />
    </>
  );
};

export default EventsList;