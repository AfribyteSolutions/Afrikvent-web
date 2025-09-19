// src/app/events/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import CheckoutButton from '@/components/CheckOutButton';
import { EnhancedTicket } from '@/types/ticket';
import { Comment } from '@/types/comments';

// Database types matching your schema
interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location_name: string;
  latitude: number;
  longitude: number;
  address: string;
  is_sponsored: boolean;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  event_status: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  images: string | null;
  organizer?: {
    username: string;
  };
}

interface TicketType {
  id: string;
  event_id: string;
  name: string;
  price: number;
  max_quantity: number;
  description: string | null;
  ticket_image_url: string | null;
  created_at: string;
}

// Raw shape returned from Supabase query (before mapping)
interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  event_id: string;
  parent_id: string | null;
  profiles: { username: string }[] | null;
}

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    phone?: string;
  } | null>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Fetch event and ticket types
  useEffect(() => {
    if (!id) return;

    const fetchEventData = async () => {
      try {
        // Fetch event details with organizer info
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            organizer:profiles!events_user_id_fkey(username)
          `)
          .eq('id', id)
          .single();

        if (eventError) {
          console.error('Error fetching event:', eventError);
          return;
        }

        setEvent(eventData);

        // Fetch ticket types for this event
        const { data: ticketData, error: ticketError } = await supabase
          .from('ticket_types')
          .select('*')
          .eq('event_id', id)
          .order('price', { ascending: true });

        if (ticketError) {
          console.error('Error fetching tickets:', ticketError);
        } else {
          setTicketTypes(ticketData || []);
        }

      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  // Fetch comments
  useEffect(() => {
    if (!id) return;
    
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(
          'id, content, created_at, user_id, event_id, parent_id, profiles(username)'
        )
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error.message);
      } else if (data) {
        const rows = data as CommentRow[];

        // flatten profiles array → single object
        const mapped: Comment[] = rows.map((c) => ({
          ...c,
          profiles: c.profiles
            ? { username: c.profiles[0]?.username ?? 'Anonymous' }
            : null,
        }));

        setComments(mapped);
      }
    };

    fetchComments();
  }, [id]);

  // Post new comment
  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUser) {
      alert('You must be logged in to comment.');
      return;
    }

    setCommentLoading(true);

    const { data, error } = await supabase
      .from('comments')
      .insert([{ content: newComment, event_id: id, user_id: currentUser.id }])
      .select(
        'id, content, created_at, user_id, event_id, parent_id, profiles(username)'
      )
      .single();

    if (error) {
      console.error('Error posting comment:', error.message);
    } else if (data) {
      const row = data as CommentRow;

      const mapped: Comment = {
        ...row,
        profiles: row.profiles
          ? { username: row.profiles[0]?.username ?? 'Anonymous' }
          : null,
      };

      setComments([mapped, ...comments]);
      setNewComment('');
    }

    setCommentLoading(false);
  };

  // Handle successful ticket purchase
  const handleTicketPurchaseSuccess = (tickets: EnhancedTicket[]) => {
    alert(`Successfully purchased ${tickets.length} ticket(s)!`);
    // You could redirect to a success page or show the tickets
    // router.push('/my-tickets');
  };

  // Handle ticket purchase error
  const handleTicketPurchaseError = (error: string) => {
    alert(`Purchase failed: ${error}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return `FCFA ${amount.toLocaleString()}`;
  };



  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Event Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The event you are looking for does not exist or has been moved.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 w-full">
        <Image 
          src={event.images || '/images/event-placeholder.jpg'} 
          alt={event.title} 
          fill 
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/event-placeholder.jpg';
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
              {event.title}
            </h1>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
                {event.event_status}
              </span>
              {event.is_featured && (
                <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium">
                  Featured
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About This Event
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {event.description}
              </p>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Event Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-gray-700">
                      {formatDate(event.event_date)} from {formatTime(event.start_time)} to {formatTime(event.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-700">
                      {event.location_name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-700">
                      {event.address}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-700">
                      Organized by {event.organizer?.username || 'Unknown'}
                    </span>
                  </div>
                  {event.is_sponsored && event.sponsor_name && (
                    <div className="flex items-center">
                      <span className="text-gray-700">
                        Sponsored by {event.sponsor_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8 bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>

              {/* Comment Input */}
              <div className="mb-6">
                <textarea
                  placeholder="Write your comment..."
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
                <button
                  onClick={handlePostComment}
                  disabled={commentLoading || !currentUser}
                  className="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {commentLoading ? 'Posting...' : 'Post Comment'}
                </button>
                {!currentUser && (
                  <p className="text-sm text-gray-500 mt-2">
                    Please log in to post comments.
                  </p>
                )}
              </div>

              {/* Comment List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-gray-500">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-4">
                      <p className="text-gray-800 font-medium">
                        {comment.profiles?.username || 'Anonymous'}
                      </p>
                      <p className="text-gray-600">{comment.content}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Types */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tickets Available
              </h3>
              
              {ticketTypes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No tickets available</p>
                  <p className="text-sm text-gray-400">
                    Contact the organizer for more information
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ticketTypes.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{ticket.name}</h4>
                          {ticket.description && (
                            <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">
                            {formatCurrency(ticket.price)}
                          </div>
                          <p className="text-xs text-gray-500">
                            {ticket.max_quantity} available
                          </p>
                        </div>
                      </div>
                      
                      {currentUser ? (
                        <CheckoutButton
                          ticketId={parseInt(ticket.id)}
                          userId={currentUser.id}
                          phone={currentUser.phone || ''}
                          quantity={1}
                          onSuccess={handleTicketPurchaseSuccess}
                          onError={handleTicketPurchaseError}
                          className="w-full"
                          disabled={ticket.max_quantity === 0}
                        />
                      ) : (
                        <div className="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg text-center">
                          Please log in to purchase tickets
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Share Event */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Share Event
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const url = window.location.href;
                    const text = `Check out this event: ${event.title}`;
                    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                    window.open(facebookUrl, '_blank');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  Facebook
                </button>
                <button 
                  onClick={() => {
                    const url = window.location.href;
                    const text = `Check out this event: ${event.title}`;
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                    window.open(twitterUrl, '_blank');
                  }}
                  className="flex-1 bg-blue-400 hover:bg-blue-500 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  Twitter
                </button>
                <button 
                  onClick={() => {
                    const url = window.location.href;
                    const text = `Check out this event: ${event.title} - ${url}`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Event Map (if coordinates available) */}
            {event.latitude && event.longitude && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Location
                </h3>
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Map placeholder</p>
                  {/* You can integrate Google Maps or another map service here */}
                </div>
                <p className="text-sm text-gray-600 mt-2">{event.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}