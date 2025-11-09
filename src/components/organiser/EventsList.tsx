// src/components/organiser/EventsList.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import CreateEventModal from './CreateEventModal';
import EditEventModal from './EditEventModal';
import DiscountCodeManager from './DiscountCodeManager';

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
  currency: string;
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [isDiscountManagerOpen, setIsDiscountManagerOpen] = useState(false);
  const [selectedEventForDiscount, setSelectedEventForDiscount] = useState<{ id: number; title: string } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId !== null) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case 'GHS':
        return '₵';
      case 'CFA':
      case 'XOF':
      case 'XAF':
        return 'CFA';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      default:
        return currency;
    }
  };

  const filteredEvents = limit 
    ? events.slice(0, limit)
    : events.filter(event => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'active') {
          return event.event_status === 'active' || event.event_status === 'published';
        }
        return event.event_status === filterStatus;
      });

  const formatCurrency = (amount: number, currency: string = 'GHS'): string => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString()}`;
  };

  const fetchEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: eventsData, error: eventsError } = await supabase
        .from('EVENTS')
        .select(`
          id,
          title,
          event_date,
          location_name,
          images,
          event_status,
          description,
          currency
        `) 
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
      }

      const eventsWithStats = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { data: ticketTypes } = await supabase
            .from('TICKET_TYPES')
            .select('max_quatity')
            .eq('event_id', event.id);

          const totalTickets = ticketTypes?.reduce((sum, type) => 
            sum + (type.max_quatity || 0), 0
          ) || 0;

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
            revenue,
            currency: event.currency || 'GHS'
          };
        })
      );

      setEvents(eventsWithStats as Event[]);

    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

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
    router.push(`/events/${eventId}`);
  };

  const handleCreateEvent = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditEvent = (eventId: number) => {
    setEditingEventId(eventId);
    setIsEditModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleManageDiscounts = (eventId: number, eventTitle: string) => {
    setSelectedEventForDiscount({ id: eventId, title: eventTitle });
    setIsDiscountManagerOpen(true);
    setOpenDropdownId(null);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingEventId(null);
  };

  const handleDiscountManagerClose = () => {
    setIsDiscountManagerOpen(false);
    setSelectedEventForDiscount(null);
  };

  const handleEventCreated = () => {
    setIsCreateModalOpen(false);
    fetchEvents();
  };

  const handleEventUpdated = () => {
    setIsEditModalOpen(false);
    setEditingEventId(null);
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
        .eq('organizer_id', user?.id);

      if (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
        return;
      }

      fetchEvents();
      alert('Event deleted successfully.');

    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
    setOpenDropdownId(null);
  };

  const toggleDropdown = (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenDropdownId(openDropdownId === eventId ? null : eventId);
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
        </div>

        <div className="divide-y divide-gray-200">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div 
                key={event.id} 
                className="p-4 sm:p-6 hover:bg-gray-50 transition-colors relative"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div 
                    className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 cursor-pointer"
                    onClick={() => handleEventClick(event.id)}
                  >
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
                      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleEventClick(event.id)}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">{event.title}</h3>
                      <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(event.event_status)}`}>
                        {getStatusText(event.event_status)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">📅 {formatDate(event.event_date)}</span>
                      <span className="flex items-center gap-1">📍 {event.location_name || 'Location TBD'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-500 block">Tickets Sold</span>
                        <p className="font-medium">{event.ticketsSold}/{event.totalTickets}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Revenue</span>
                        <p className="font-medium">{formatCurrency(event.revenue, event.currency)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative dropdown-container flex-shrink-0">
                    <button 
                      onClick={(e) => toggleDropdown(event.id, e)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                      title="More actions"
                      type="button"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="2"/>
                        <circle cx="12" cy="12" r="2"/>
                        <circle cx="12" cy="19" r="2"/>
                      </svg>
                    </button>

                    {openDropdownId === event.id && (
                      <div 
                        className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event.id);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 touch-manipulation active:bg-gray-100"
                        >
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="font-medium">Edit Event</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManageDiscounts(event.id, event.title);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 touch-manipulation active:bg-gray-100"
                        >
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="font-medium">Manage Discounts</span>
                        </button>
                        <div className="my-1 border-t border-gray-200"></div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id, event.title);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 touch-manipulation active:bg-red-100"
                        >
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="font-medium">Delete Event</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
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

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSuccess={handleEventCreated}
        user={user}
      />

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleEventUpdated}
        user={user}
        eventId={editingEventId}
      />

      {isDiscountManagerOpen && selectedEventForDiscount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl h-[90vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-2xl">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 flex-1">
                  Discount Codes - {selectedEventForDiscount.title}
                </h2>
                <button
                  onClick={handleDiscountManagerClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 touch-manipulation"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <DiscountCodeManager
                eventId={selectedEventForDiscount.id}
                eventTitle={selectedEventForDiscount.title}
                user={user}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventsList;