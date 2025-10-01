'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';
import { User } from '@supabase/supabase-js';
import { EnhancedTicket } from '@/types/ticket';
import PaymentModal from '@/components/checkout/PaymentModal';
import PaymentSuccessScreen from '@/components/checkout/PaymentSuccessScreen';
import { getCurrencyInfo } from '@/utils/currency';

type EventRow = Database['public']['Tables']['EVENTS']['Row'];
type TicketTypeRow = Database['public']['Tables']['TICKET_TYPES']['Row'];
type CommentRow = Database['public']['Tables']['EVENT_COMMENTS']['Row'];
type UserRow = Database['public']['Tables']['USERS']['Row'];

interface EventWithDetails extends EventRow {
  USERS: UserRow | null;
  organization_name?: string;
  ticketTypes: TicketTypeRow[];
  comments: (CommentRow & { USERS: UserRow | null })[];
}

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

const formatCurrency = (amount: number | null | undefined, currencyCode: string | null | undefined): string => {
  const safeAmount = amount || 0;
  const currencyInfo = getCurrencyInfo(currencyCode || undefined);
  const symbol = currencyInfo.symbol;

  try {
    return `${symbol}${safeAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  } catch (e) {
    return `${symbol}${safeAmount.toLocaleString()}`;
  }
};

const getTicketColorScheme = (index: number) => {
  const schemes = [
    {
      border: 'border-blue-500',
      bg: 'bg-blue-50',
      bgCard: 'bg-blue-50/30',
      checkIcon: 'bg-blue-500',
      badge: 'bg-blue-200 text-blue-800',
      gradient: 'from-blue-600 to-blue-800'
    },
    {
      border: 'border-purple-500',
      bg: 'bg-purple-50',
      bgCard: 'bg-purple-50/30',
      checkIcon: 'bg-purple-500',
      badge: 'bg-purple-200 text-purple-800',
      gradient: 'from-purple-600 to-purple-800'
    },
    {
      border: 'border-green-500',
      bg: 'bg-green-50',
      bgCard: 'bg-green-50/30',
      checkIcon: 'bg-green-500',
      badge: 'bg-green-200 text-green-800',
      gradient: 'from-green-600 to-green-800'
    },
    {
      border: 'border-orange-500',
      bg: 'bg-orange-50',
      bgCard: 'bg-orange-50/30',
      checkIcon: 'bg-orange-500',
      badge: 'bg-orange-200 text-orange-800',
      gradient: 'from-orange-600 to-orange-800'
    },
    {
      border: 'border-pink-500',
      bg: 'bg-pink-50',
      bgCard: 'bg-pink-50/30',
      checkIcon: 'bg-pink-500',
      badge: 'bg-pink-200 text-pink-800',
      gradient: 'from-pink-600 to-pink-800'
    }
  ];
  return schemes[index % schemes.length];
};

const EventDetailPage: React.FC<EventDetailPageProps> = ({ params }) => {
  const router = useRouter();
  const resolvedParams = use(params);
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketTypeRow | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [purchasedTickets, setPurchasedTickets] = useState<EnhancedTicket[]>([]);

  const eventId = parseInt(resolvedParams.id);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getCurrentUser();
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: simpleEventData, error: simpleError } = await supabase
        .from('EVENTS')
        .select('*')
        .eq('id', eventId);

      if (simpleError) {
        setError(`Database error: ${simpleError.message}`);
        return;
      }

      if (!simpleEventData || simpleEventData.length === 0) {
        setError('Event not found in database');
        return;
      }

      const eventData = simpleEventData[0];

      const { data: organizerData } = await supabase
        .from('USERS')
        .select('*')
        .eq('user_id', eventData.organizer_id)
        .single();

      let organizationName = null;
      try {
        const { data: kycData } = await supabase
          .from('ORGANIZER_KYC')
          .select('organization_name')
          .eq('user_id', eventData.organizer_id)
          .single();
        
        organizationName = kycData?.organization_name || null;
      } catch (error) {
        console.log('No organization data found');
      }

      const { data: ticketTypes } = await supabase
        .from('TICKET_TYPES')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: true });

        const { data: comments } = await supabase
        .from('EVENT_COMMENTS')
        .select(`
          *,
          USERS (*)
        `)
        .eq('event_id', eventId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      setEvent({
        ...eventData,
        USERS: organizerData || null,
        organization_name: organizationName || undefined,
        ticketTypes: ticketTypes || [],
        comments: comments || []
      });

    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !event) return;

    try {
      setSubmittingComment(true);
      const { error } = await supabase
        .from('EVENT_COMMENTS')
        .insert({
          event_id: event.id,
          user_id: user.id,
          message: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await fetchEventDetails();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user || !event) return;
  
    const comment = event.comments.find(c => c.id === commentId);
    const isOrganizer = event.organizer_id === user.id;
    const isCommentOwner = comment?.user_id === user.id;
  
    if (!isOrganizer && !isCommentOwner) {
      alert('You do not have permission to delete this comment');
      return;
    }
  
    if (!confirm('Are you sure you want to delete this comment?')) return;
  
    try {
      const { error } = await supabase
        .from('EVENT_COMMENTS')
        .update({ is_deleted: true })
        .eq('id', commentId);
  
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
  
      await fetchEventDetails();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Time TBA';
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description || '',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handlePaymentSuccess = (tickets: EnhancedTicket[]) => {
    setPurchasedTickets(tickets);
    setShowPaymentModal(false);
    setShowSuccessScreen(true);
    setSelectedTicket(null);
    setTicketQuantity(1);
  };

  const handleCloseSuccessScreen = () => {
    setShowSuccessScreen(false);
    setPurchasedTickets([]);
  };

  const getOrganizerDisplayName = () => {
    if (event?.organization_name) {
      return event.organization_name;
    }
    return event?.USERS?.name || 'Anonymous Organizer';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Just a Sec</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  const eventCurrency = event.currency;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="relative h-80 bg-gray-200">
            {event.images && event.images[0] ? (
              <Image
                src={event.images[0]}
                alt={event.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.event_status === 'active' ? 'bg-green-100 text-green-800' :
                event.event_status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {event.event_status === 'active' ? 'Live' :
                  event.event_status.charAt(0).toUpperCase() + event.event_status.slice(1)}
              </span>
            </div>

            <button
              onClick={handleShare}
              className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
              <div className="flex flex-wrap gap-6 text-gray-600">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(event.event_date)}
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location_name || 'Location TBA'}
                </div>
              </div>
              {event.address && (
                <p className="text-gray-500 mt-2 ml-7">{event.address}</p>
              )}
            </div>

            {event.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Organizer</h2>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{getOrganizerDisplayName()}</p>
                  {event.organization_name && event.USERS?.name && (
                    <p className="text-sm text-gray-500">Contact: {event.USERS.name}</p>
                  )}
                  <p className="text-gray-600">{event.USERS?.email}</p>
                </div>
              </div>
            </div>

            {event.ticketTypes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Tickets</h2>
                <div className="space-y-4">
                  {event.ticketTypes.map((ticket, index) => {
                    const colorScheme = getTicketColorScheme(index);
                    const isSelected = selectedTicket?.id === ticket.id;

                    return (
                      <div
                        key={ticket.id}
                        className={`relative border-2 rounded-2xl p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? `${colorScheme.border} bg-white shadow-xl transform scale-[1.01]`
                            : `${colorScheme.bgCard} border-gray-300 shadow-sm hover:shadow-md`
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        {isSelected && (
                          <div className={`absolute -top-2 -right-2 w-6 h-6 ${colorScheme.checkIcon} rounded-full flex items-center justify-center`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}

                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                              <h3 className={`font-bold ${isSelected ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} text-gray-900`}>
                                {ticket.name}
                              </h3>
                              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium ${
                                isSelected ? colorScheme.badge : 'bg-gray-100 text-gray-700'
                              }`}>
                                {ticket.max_quatity} available
                              </span>
                            </div>

                            {ticket.description && (
                              <p className="text-gray-700 text-xs sm:text-sm mb-3 leading-relaxed">
                                {ticket.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-2 sm:gap-4">
                                <span className={`font-bold ${
                                  isSelected
                                    ? 'text-lg sm:text-2xl bg-gradient-to-r ' + colorScheme.gradient + ' bg-clip-text text-transparent'
                                    : 'text-lg sm:text-2xl text-gray-900'
                                }`}>
                                  {formatCurrency(ticket.price, eventCurrency)}
                                </span>
                                <span className="text-[11px] sm:text-sm text-gray-600">per ticket</span>
                              </div>

                              {isSelected && (
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <span className="text-[11px] sm:text-sm font-medium text-gray-700">Qty:</span>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTicketQuantity(Math.max(1, ticketQuantity - 1));
                                      }}
                                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center text-gray-700 font-bold transition-colors text-sm sm:text-base"
                                    >
                                      −
                                    </button>
                                    <span className="w-8 sm:w-10 text-center font-bold text-gray-900 text-sm sm:text-lg">
                                      {ticketQuantity}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTicketQuantity(Math.min(ticket.max_quatity || 10, ticketQuantity + 1));
                                      }}
                                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center text-gray-700 font-bold transition-colors text-sm sm:text-base"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Comments ({event.comments.length})
              </h2>

              {user ? (
                <div className="mb-6">
                  <div className="flex space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || submittingComment}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:bg-gray-300 hover:bg-blue-700"
                        >
                          {submittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600">Please sign in to leave a comment</p>
                </div>
              )}

<div className="space-y-4">
  {event.comments.map((comment) => (
    <div key={comment.id} className="flex space-x-2 sm:space-x-3">
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
        {comment.USERS?.image_url ? (
          <Image
            src={comment.USERS.image_url}
            alt={comment.USERS.name || 'User'}
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-white font-semibold text-xs sm:text-sm">
            {(comment.USERS?.name || comment.USERS?.email || 'A')
              .charAt(0)
              .toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-2 sm:p-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
              <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
                {comment.USERS?.name || 'Anonymous'}
              </span>
              {comment.user_id === event.organizer_id && (
                <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap">
                  Organizer
                </span>
              )}
              <span className="text-gray-500 text-[10px] sm:text-xs whitespace-nowrap">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 text-sm sm:text-base break-words">{comment.message}</p>
          </div>
          {user && (user.id === comment.user_id || user.id === event.organizer_id) && (
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="text-red-500 hover:text-red-700 flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
              <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">{selectedTicket.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {ticketQuantity} ticket{ticketQuantity > 1 ? 's' : ''} × {formatCurrency(selectedTicket.price, eventCurrency)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setTicketQuantity(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 sm:hidden"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm text-gray-600">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatCurrency((selectedTicket.price || 0) * ticketQuantity, eventCurrency)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedTicket(null);
                      setTicketQuantity(1);
                    }}
                    className="hidden sm:block text-gray-600 hover:text-gray-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base transition-all duration-200 border border-gray-300 hover:border-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTicket && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          selectedTicket={selectedTicket}
          quantity={ticketQuantity}
          user={user}
          eventTitle={event.title}
          eventDate={event.event_date}
          eventLocation={event.location_name}
          eventId={event.id}
          eventImage={event.images?.[0]}
          onPaymentSuccess={handlePaymentSuccess}
          eventCurrency={eventCurrency}
        />
      )}

      <PaymentSuccessScreen
        isOpen={showSuccessScreen}
        tickets={purchasedTickets}
        eventTitle={event.title}
        eventDate={event.event_date || ''}
        eventLocation={event.location_name || 'TBA'}
        onClose={handleCloseSuccessScreen}
      />
    </div>
  );
};

export default EventDetailPage;