'use client';
import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';
import { supabase } from '@/lib/supabaseClient';

interface ViewerStreamProps {
  eventId: number;
  eventTitle: string;
  onClose: () => void;
}

interface Comment {
  id: number;
  user_id: string;
  message: string;
  created_at: string;
  USERS: {
    name: string | null;
    email: string;
  } | null;
}

const ViewerStream: React.FC<ViewerStreamProps> = ({
  eventId,
  eventTitle,
  onClose,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketCode, setTicketCode] = useState('');
  const [showTicketInput, setShowTicketInput] = useState(true);
  const [streamStatus, setStreamStatus] = useState<'checking' | 'live' | 'ended'>('checking');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkStreamStatus();
    getCurrentUser();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      subscribeToComments();
    }
  }, [isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkStreamStatus = async () => {
    try {
      const response = await fetch(`/api/stream/status?eventId=${eventId}`);
      const data = await response.json();
      
      if (data.isLive) {
        setStreamStatus('live');
      } else {
        setStreamStatus('ended');
        setError('This stream has ended');
      }
    } catch (err) {
      setStreamStatus('ended');
    }
  };

  const subscribeToComments = () => {
    loadComments();

    const channel = supabase
      .channel(`stream_comments_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'STREAM_COMMENTS',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('New comment received:', payload);
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('STREAM_COMMENTS')
        .select(`
          id,
          user_id,
          message,
          created_at,
          USERS!inner (
            name,
            email
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const transformedComments = (data || []).map((comment: {
        id: number;
        user_id: string;
        message: string;
        created_at: string;
        USERS: { name: string | null; email: string } | { name: string | null; email: string }[];
      }) => ({
        id: comment.id,
        user_id: comment.user_id,
        message: comment.message,
        created_at: comment.created_at,
        USERS: Array.isArray(comment.USERS) ? comment.USERS[0] : comment.USERS
      }));

      setComments(transformedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !user) return;

    setSendingComment(true);

    try {
      const response = await fetch('/api/stream/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          userId: user.id,
          message: newComment.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send comment');
      }

      setNewComment('');
    } catch (err) {
      console.error('Error sending comment:', err);
      setError('Failed to send message');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSendingComment(false);
    }
  };

  const cleanup = async () => {
    try {
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  const joinStream = async () => {
    if (!ticketCode || ticketCode.length !== 6) {
      setError('Please enter a valid 6-digit ticket code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get token from API
      const response = await fetch('/api/stream/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ticketCode: ticketCode.toUpperCase(),
          role: 'subscriber',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join stream');
      }

      const { token, channel, uid, appId } = await response.json();

      // Create Agora client
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      // Set client role to audience
      await client.setClientRole('audience');

      // Join channel
      await client.join(appId, channel, token, parseInt(uid));

      // Subscribe to remote users
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        if (mediaType === 'video' && videoContainerRef.current) {
          user.videoTrack?.play(videoContainerRef.current);
        }

        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          user.videoTrack?.stop();
        }
      });

      setIsConnected(true);
      setShowTicketInput(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Error joining stream:', err);
      setError(err instanceof Error ? err.message : 'Failed to join stream');
      setIsLoading(false);
      await cleanup();
    }
  };

  const handleTicketCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setTicketCode(value);
  };

  if (streamStatus === 'ended') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">Stream Ended</h2>
          <p className="text-gray-400 mb-6">This live stream has ended</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header - Responsive */}
      <div className="bg-gray-900 text-white p-3 md:p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="font-bold text-xs md:text-sm">LIVE</span>
          </div>
          <h2 className="font-bold text-sm md:text-lg truncate">{eventTitle}</h2>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {isConnected && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="md:hidden p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Video Container */}
        <div className="flex-1 relative bg-gray-900">
          <div
            ref={videoContainerRef}
            className="absolute inset-0"
          />

          {/* Ticket Input Overlay */}
          {showTicketInput && !isConnected && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-gray-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Enter Your Ticket Code</h3>
                  <p className="text-sm md:text-base text-gray-400">Enter the 6-digit code from your online ticket</p>
                </div>

                <div className="mb-6">
                  <input
                    type="text"
                    value={ticketCode}
                    onChange={handleTicketCodeChange}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full text-center text-2xl md:text-3xl font-bold tracking-widest bg-gray-900 text-white border-2 border-gray-700 rounded-lg px-4 py-3 md:py-4 focus:outline-none focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <button
                  onClick={joinStream}
                  disabled={isLoading || ticketCode.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-4 rounded-lg font-bold text-base md:text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Connecting...
                    </>
                  ) : (
                    'Watch Stream'
                  )}
                </button>

                <p className="text-gray-500 text-xs text-center mt-4">
                  Your ticket code can be found in your ticket confirmation email
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isConnected && !showTicketInput && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-base md:text-lg">Connecting to stream...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && isConnected && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg max-w-[90%] z-10">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm md:text-base">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Comments Sidebar - Responsive */}
        {isConnected && (
          <div className={`${showComments ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 bg-gray-900 border-t md:border-t-0 md:border-l border-gray-800`}>
            <div className="p-3 md:p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm md:text-base">Live Chat</h3>
              <span className="text-xs md:text-sm text-gray-400">{comments.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
              {comments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Be the first to say something!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 md:gap-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs md:text-sm">
                        {(comment.USERS?.name || comment.USERS?.email || 'A')
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-white font-medium text-xs md:text-sm truncate">
                          {comment.USERS?.name || 'Anonymous'}
                        </span>
                        <span className="text-gray-500 text-[10px] md:text-xs flex-shrink-0">
                          {new Date(comment.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs md:text-sm break-words">{comment.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Input */}
            {user ? (
              <form onSubmit={handleSendComment} className="p-3 md:p-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Say something..."
                    maxLength={500}
                    className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sendingComment}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || sendingComment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingComment ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 md:p-4 border-t border-gray-800 text-center">
                <p className="text-gray-400 text-sm">Sign in to chat</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewerStream;