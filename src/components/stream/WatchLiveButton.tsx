// components/stream/WatchLiveButton.tsx
'use client';
import React, { useState, useEffect } from 'react';
import ViewerStream from './ViewerStream';
import { supabase } from '@/lib/supabaseClient';

interface WatchLiveButtonProps {
  eventId: number;
  eventTitle: string;
  className?: string;
}

const WatchLiveButton: React.FC<WatchLiveButtonProps> = ({
  eventId,
  eventTitle,
  className = '',
}) => {
  const [showViewerStream, setShowViewerStream] = useState(false);
  const [showNotLiveMessage, setShowNotLiveMessage] = useState(false);
  const [isStreamLive, setIsStreamLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check stream status on mount and poll every 10 seconds
  useEffect(() => {
    checkStreamStatus();

    // Poll for status changes every 10 seconds
    const interval = setInterval(() => {
      checkStreamStatus();
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
    };
  }, [eventId]);

  const checkStreamStatus = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('LIVE_STREAMS')
        .select('status')
        .eq('event_id', eventId)
        .single();

      if (error) {
        console.error('Error checking stream status:', error);
        setIsStreamLive(false);
        return;
      }

      if (data) {
        setIsStreamLive(data.status === 'live');
      } else {
        setIsStreamLive(false);
      }
    } catch (error) {
      console.error('Error checking stream status:', error);
      setIsStreamLive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (isStreamLive) {
      setShowViewerStream(true);
    } else {
      setShowNotLiveMessage(true);
      setTimeout(() => setShowNotLiveMessage(false), 3000);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        {/* Info Message */}
        <div className="text-center">
          {isStreamLive ? (
            <p className="text-sm font-medium text-green-600 flex items-center gap-2 justify-center">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Stream is LIVE! Tap the button below to watch
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              {isLoading ? (
                'Checking stream status...'
              ) : (
                'Stream not started yet. Please wait for it to go live.'
              )}
            </p>
          )}
        </div>

        {/* Watch Live Button */}
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`${
            isStreamLive 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          } text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 relative overflow-hidden ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          } ${className}`}
        >
          {isStreamLive && !isLoading && (
            <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full animate-ping"></div>
          )}
          
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
          )}
          
          <span>{isLoading ? 'Checking...' : 'Watch Live'}</span>
        </button>
      </div>

      {/* Not Live Message */}
      {showNotLiveMessage && (
        <div className="fixed top-20 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-[fadeInDown_0.3s_ease-out]">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
          </svg>
          <span className="text-sm font-medium">Stream is not live yet. Please wait.</span>
        </div>
      )}

      {/* Stream Modal */}
      {showViewerStream && (
        <ViewerStream
          eventId={eventId}
          eventTitle={eventTitle}
          onClose={() => setShowViewerStream(false)}
        />
      )}
    </>
  );
};

export default WatchLiveButton;