'use client';
import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';

interface ViewerStreamProps {
  eventId: number;
  eventTitle: string;
  onClose: () => void;
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

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkStreamStatus();
    return () => {
      cleanup();
    };
  }, []);

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
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="font-bold text-sm">LIVE</span>
          </div>
          <h2 className="font-bold text-lg truncate max-w-md">{eventTitle}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-gray-900">
        <div
          ref={videoContainerRef}
          className="absolute inset-0"
        />

        {/* Ticket Input Overlay */}
        {showTicketInput && !isConnected && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Enter Your Ticket Code</h3>
                <p className="text-gray-400">Enter the 6-digit code from your online ticket</p>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  value={ticketCode}
                  onChange={handleTicketCodeChange}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full text-center text-3xl font-bold tracking-widest bg-gray-900 text-white border-2 border-gray-700 rounded-lg px-4 py-4 focus:outline-none focus:border-blue-500 transition-colors"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        {isConnected && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg">Connecting to stream...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && isConnected && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg max-w-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewerStream;