// app/events/[id]/page.tsx
'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';
import { User } from '@supabase/supabase-js';

type EventRow = Database['public']['Tables']['EVENTS']['Row'];
type TicketTypeRow = Database['public']['Tables']['TICKET_TYPES']['Row'];
type CommentRow = Database['public']['Tables']['EVENT_COMMENTS']['Row'];
type UserRow = Database['public']['Tables']['USERS']['Row'];

interface EventWithDetails extends EventRow {
  USERS: UserRow | null;
  ticketTypes: TicketTypeRow[];
  comments: (CommentRow & { USERS: UserRow | null })[];
}

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({ params }) => {
  const router = useRouter();
  const resolvedParams = use(params); // Unwrap the Promise
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketTypeRow | null>(null);

  const eventId = parseInt(resolvedParams.id);

  useEffect(() => {
    // Get current user
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

      console.log('🔍 Fetching event with ID:', eventId, 'Type:', typeof eventId);

      // First, let's try a simple query without joins
      const { data: simpleEventData, error: simpleError } = await supabase
        .from('EVENTS')
        .select('*')
        .eq('id', eventId);

      console.log('📊 Simple query result:', { simpleEventData, simpleError });

      if (simpleError) {
        console.error('Simple query error:', simpleError);
        setError(`Database error: ${simpleError.message}`);
        return;
      }

      if (!simpleEventData || simpleEventData.length === 0) {
        console.log('❌ No event found with ID:', eventId);
        setError('Event not found in database');
        return;
      }

      // Now try with the join - fix the relationship reference
      const { data: eventData, error: eventError } = await supabase
        .from('EVENTS')
        .select(`
          *,
          organizer:USERS!EVENTS_organizer_id_fkey (*)
        `)
        .eq('id', eventId)
        .neq('event_status', 'cancelled')
        .single();

      console.log('📊 Join query result:', { eventData, eventError });

      if (eventError) {
        console.error('Join query error:', eventError);
        // Fallback to simple data if join fails
        console.log('Using simple event data as fallback');
        const fallbackEvent = simpleEventData[0];
        
        // Fetch organizer separately
        const { data: organizerData } = await supabase
          .from('USERS')
          .select('*')
          .eq('user_id', fallbackEvent.organizer_id)
          .single();

        // Fetch ticket types
        const { data: ticketTypes } = await supabase
          .from('TICKET_TYPES')
          .select('*')
          .eq('event_id', eventId)
          .order('price', { ascending: true });

        // Fetch comments with user details
        const { data: comments } = await supabase
          .from('EVENT_COMMENTS')
          .select(`
            *,
            USERS!EVENT_COMMENTS_user_id_fkey (*)
          `)
          .eq('event_id', eventId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        setEvent({
          ...fallbackEvent,
          USERS: organizerData || null,
          ticketTypes: ticketTypes || [],
          comments: comments || []
        });
        return;
      }

      if (!eventData) {
        setError('Event not found or is cancelled');
        return;
      }

      // Fetch ticket types
      const { data: ticketTypes } = await supabase
        .from('TICKET_TYPES')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: true });

      // Fetch comments with user details
      const { data: comments } = await supabase
        .from('EVENT_COMMENTS')
        .select(`
          *,
          USERS!EVENT_COMMENTS_user_id_fkey (*)
        `)
        .eq('event_id', eventId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      setEvent({
        ...eventData,
        USERS: eventData.organizer || null,
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
      await fetchEventDetails(); // Refresh comments

    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user || !event) return;

    // Check if user is organizer or comment owner
    const comment = event.comments.find(c => c.id === commentId);
    const isOrganizer = event.organizer_id === user.id;
    const isCommentOwner = comment?.user_id === user.id;

    if (!isOrganizer && !isCommentOwner) return;

    try {
      const { error } = await supabase
        .from('EVENT_COMMENTS')
        .update({ is_deleted: true })
        .eq('id', commentId);

      if (error) throw error;

      await fetchEventDetails(); // Refresh comments

    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
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

  const handleBookTicket = () => {
    if (!selectedTicket) return;
    // Navigate to booking page
    router.push(`/booking?eventId=${event?.id}&ticketTypeId=${selectedTicket.id}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
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
          {/* Hero Image */}
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
            
            {/* Status Badge */}
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

            {/* Share Button */}
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
            {/* Event Header */}
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

            {/* Event Description */}
            {event.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
                </div>
              </div>
            )}

            {/* Organizer Info */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Organizer</h2>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{event.USERS?.name || 'Anonymous Organizer'}</p>
                  <p className="text-gray-600">{event.USERS?.email}</p>
                </div>
              </div>
            </div>

            {/* Tickets Section */}
            {event.ticketTypes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tickets</h2>
                <div className="space-y-3">
                  {event.ticketTypes.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{ticket.name}</h3>
                          {ticket.description && (
                            <p className="text-gray-600 text-sm mt-1">{ticket.description}</p>
                          )}
                          <p className="text-gray-500 text-sm mt-1">
                            {ticket.max_quatity} available
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ₵{ticket.price?.toLocaleString() || '0'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={handleBookTicket}
                  disabled={!selectedTicket}
                  className="w-full mt-4 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  {selectedTicket ? `Book ${selectedTicket.name}` : 'Select a ticket'}
                </button>
              </div>
            )}

            {/* Comments Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Comments ({event.comments.length})
              </h2>

              {/* Add Comment Form */}
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

              {/* Comments List */}
              <div className="space-y-4">
                {event.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {comment.USERS?.name || 'Anonymous'}
                            </span>
                            {comment.user_id === event.organizer_id && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                                Organizer
                              </span>
                            )}
                            <span className="text-gray-500 text-xs">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.message}</p>
                        </div>
                        
                        {user && (user.id === comment.user_id || user.id === event.organizer_id) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {event.comments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;