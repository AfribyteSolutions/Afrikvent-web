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
import AuthModal from '@/components/auth/AuthModal';
import { getCurrencyInfo } from '@/utils/currency';
import ViewerStream from '@/components/stream/ViewerStream';

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

// ========== SOLD OUT BADGE HELPER FUNCTIONS ==========
const isEventSoldOut = (ticketTypes: TicketTypeRow[]): boolean => {
  if (!ticketTypes || ticketTypes.length === 0) {
    return false;
  }
  return ticketTypes.every(ticket => (ticket.max_quatity || 0) <= 0);
};

const getAvailabilityBadge = (ticketTypes: TicketTypeRow[]) => {
  if (!ticketTypes || ticketTypes.length === 0) {
    return null;
  }
  
  const totalAvailable = ticketTypes.reduce((total, ticket) => {
    return total + Math.max(0, ticket.max_quatity || 0);
  }, 0);
  
  if (totalAvailable === 0) {
    return {
      type: 'sold-out' as const,
      text: 'SOLD OUT',
      className: 'bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-1.5 rounded-full shadow-lg transform rotate-12'
    };
  }
  
  if (totalAvailable <= 10) {
    return {
      type: 'low' as const,
      text: `⚡ ${totalAvailable} LEFT`,
      className: 'bg-orange-500 text-white px-3 py-1 rounded-full animate-pulse'
    };
  }
  
  return null;
};
// ========== END HELPER FUNCTIONS ==========

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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [authModalType, setAuthModalType] = useState<"signin" | "signup">("signin");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // NEW: Stream-related state
  const [showViewerStream, setShowViewerStream] = useState(false);
  const [streamIsLive, setStreamIsLive] = useState(false);

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

  // NEW: Check stream status
  useEffect(() => {
    const checkStreamStatus = async () => {
      try {
        const response = await fetch(`/api/stream/status?eventId=${eventId}`);
        const data = await response.json();
        setStreamIsLive(data.isLive);
      } catch (err) {
        console.error('Error checking stream:', err);
      }
    };
    
    if (eventId) {
      checkStreamStatus();
      const interval = setInterval(checkStreamStatus, 30000); // Check every 30s
      
      return () => clearInterval(interval);
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

  const handleAuthSuccess = (userEmail: string) => {
    console.log("User authenticated:", userEmail);
    setShowLoginPrompt(false);
    setShowAuthModal(false);
    window.location.reload();
  };

  const handleTicketClick = (ticket: TicketTypeRow) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setSelectedTicket(ticket);
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
    if (!comment) {
      alert('Comment not found');
      return;
    }

    const isOrganizer = event.organizer_id === user.id;
    const isCommentOwner = comment.user_id === user.id;

    if (!isOrganizer && !isCommentOwner) {
      alert('You do not have permission to delete this comment');
      return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('EVENT_COMMENTS')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      setEvent(prevEvent => {
        if (!prevEvent) return null;
        return {
          ...prevEvent,
          comments: prevEvent.comments.filter(c => c.id !== commentId)
        };
      });

    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
      await fetchEventDetails();
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
    
    const timeMatch = timeString.match(/(\d{2}):(\d{2})/);
    if (!timeMatch) return 'Time TBA';
    
    const [, hours, minutes] = timeMatch;
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
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

  const handleImageClick = (index: number = 0) => {
    setCurrentImageIndex(index);
    setShowImageLightbox(true);
  };

  const handleNextImage = () => {
    const images = event?.images;
    if (!images || !Array.isArray(images)) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    const images = event?.images;
    if (!images || !Array.isArray(images)) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
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
  const eventImages = Array.isArray(event.images) ? event.images : [];
  const hasImages = eventImages.length > 0;
  
  const eventSoldOut = isEventSoldOut(event.ticketTypes);
  const eventAvailabilityBadge = getAvailabilityBadge(event.ticketTypes);
  
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
          <div 
            className="relative h-80 bg-gray-200 group cursor-pointer overflow-hidden"
            onClick={() => hasImages && handleImageClick(0)}
          >
            {hasImages ? (
              <>
                <Image
                  src={eventImages[0]}
                  alt={event.title}
                  fill
                  className={`object-cover transition-transform duration-300 group-hover:scale-105 ${eventSoldOut ? 'grayscale' : ''}`}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110">
                    <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 shadow-2xl">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:block absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                    <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Click to view full image
                    </p>
                  </div>
                </div>

                <div className="sm:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                    <p className="text-xs font-medium text-white flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Tap to view
                    </p>
                  </div>
                </div>

                {eventSoldOut && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                    <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg">
                      <p className="text-red-600 font-bold text-lg">Event Sold Out</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {eventAvailabilityBadge && eventAvailabilityBadge.type === 'sold-out' && (
              <div className="absolute -top-2 -right-2 z-30">
                <span className={eventAvailabilityBadge.className}>
                  <span className="font-bold text-xs tracking-wide">
                    {eventAvailabilityBadge.text}
                  </span>
                </span>
              </div>
            )}
            
            {eventAvailabilityBadge && eventAvailabilityBadge.type === 'low' && (
              <div className="absolute top-16 right-4 z-30">
                <span className={eventAvailabilityBadge.className}>
                  <span className="font-bold text-xs tracking-wide">
                    {eventAvailabilityBadge.text}
                  </span>
                </span>
              </div>
            )}
            
            <div className="absolute top-4 right-4 z-20">
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
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all z-20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>

            {hasImages && eventImages.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {eventImages.length} photos
                </div>
              </div>
            )}
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

            {/* NEW: Live Stream Banner */}
            {streamIsLive && (
              <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="text-red-600 font-bold text-sm uppercase tracking-wide">Live Now</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">This event is streaming live!</h3>
                      <p className="text-sm text-gray-600">Watch now with your online ticket</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewerStream(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                    Watch Live
                  </button>
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
                    const isOnline = ticket.format === 'online';
                    const isSoldOut = (ticket.max_quatity || 0) <= 0;

                    return (
                      <div
                        key={ticket.id}
                        className={`relative border-2 rounded-2xl p-4 sm:p-6 transition-all duration-300 ${
                          isSoldOut 
                            ? 'border-gray-300 bg-gray-50 opacity-75 cursor-not-allowed' 
                            : isSelected
                              ? `${colorScheme.border} bg-white shadow-xl transform scale-[1.01] cursor-pointer`
                              : `${colorScheme.bgCard} border-gray-300 shadow-sm hover:shadow-md cursor-pointer`
                        }`}
                        onClick={() => !isSoldOut && handleTicketClick(ticket)}
                      >
                        {isSoldOut && (
                          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-1.5 rounded-full shadow-lg transform rotate-12 z-10">
                            <span className="font-bold text-xs sm:text-sm tracking-wide">SOLD OUT</span>
                          </div>
                        )}

                        {isSelected && !isSoldOut && (
                          <div className={`absolute -top-2 -right-2 w-6 h-6 ${colorScheme.checkIcon} rounded-full flex items-center justify-center z-10`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}

                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                              <h3 className={`font-bold ${isSelected ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} ${isSoldOut ? 'text-gray-500' : 'text-gray-900'}`}>
                                {ticket.name}
                              </h3>
                              
                              <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                                isOnline 
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md' 
                                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                              }`}>
                                {isOnline ? (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                    Online
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    In-Person
                                  </>
                                )}
                              </span>

                              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium ${
                                isSoldOut
                                  ? 'bg-red-100 text-red-700'
                                  : isSelected ? colorScheme.badge : 'bg-gray-100 text-gray-700'
                              }`}>
                                {isSoldOut ? 'Sold Out' : `${ticket.max_quatity} available`}
                              </span>
                            </div>

                            {ticket.description && (
                              <p className={`text-xs sm:text-sm mb-3 leading-relaxed ${isSoldOut ? 'text-gray-500' : 'text-gray-700'}`}>
                                {ticket.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-2 sm:gap-4">
                                <span className={`font-bold ${
                                  isSoldOut
                                    ? 'text-lg sm:text-2xl text-gray-400 line-through'
                                    : isSelected
                                      ? 'text-lg sm:text-2xl bg-gradient-to-r ' + colorScheme.gradient + ' bg-clip-text text-transparent'
                                      : 'text-lg sm:text-2xl text-gray-900'
                                }`}>
                                  {formatCurrency(ticket.price, eventCurrency)}
                                </span>
                                <span className={`text-[11px] sm:text-sm ${isSoldOut ? 'text-gray-400' : 'text-gray-600'}`}>per ticket</span>
                              </div>

                              {isSelected && user && !isSoldOut && (
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

      {/* Image Lightbox */}
      {showImageLightbox && hasImages && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowImageLightbox(false)}
        >
          <button
            onClick={() => setShowImageLightbox(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
            {currentImageIndex + 1} / {eventImages.length}
          </div>

          {eventImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-4 rounded-full transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {eventImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-4 rounded-full transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div 
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={eventImages[currentImageIndex]}
              alt={`${event.title} - Image ${currentImageIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>

          {eventImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
              {eventImages.map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                    index === currentImageIndex 
                      ? 'ring-4 ring-white scale-110' 
                      : 'ring-2 ring-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
              title="Share"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Selected Ticket Bottom Bar */}
      {selectedTicket && user && (
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

      {/* Payment Modal */}
      {selectedTicket && user && (
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
          eventImage={eventImages[0]}
          onPaymentSuccess={handlePaymentSuccess}
          eventCurrency={eventCurrency}
        />
      )}

      {/* Payment Success Screen */}
      <PaymentSuccessScreen
        isOpen={showSuccessScreen}
        tickets={purchasedTickets}
        eventTitle={event.title}
        eventDate={event.event_date || ''}
        eventLocation={event.location_name || 'TBA'}
        onClose={handleCloseSuccessScreen}
      />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h3>
              <p className="text-gray-600 mb-6">
                Please sign in to your account to purchase tickets for this event.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowLoginPrompt(false);
                    setAuthModalType("signin");
                    setShowAuthModal(true);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Do not have an account?{' '}
                <button
                  onClick={() => {
                    setShowLoginPrompt(false);
                    setAuthModalType("signup");
                    setShowAuthModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        type={authModalType}
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* NEW: Viewer Stream Modal */}
      {showViewerStream && (
        <ViewerStream
          eventId={event.id}
          eventTitle={event.title}
          onClose={() => setShowViewerStream(false)}
        />
      )}
    </div>
  );
};

export default EventDetailPage;