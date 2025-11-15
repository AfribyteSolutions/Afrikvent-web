'use client';
import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';

interface OrganizerStreamProps {
  eventId: number;
  userId: string;
  eventTitle: string;
  onClose: () => void;
}

const OrganizerStream: React.FC<OrganizerStreamProps> = ({
  eventId,
  userId,
  eventTitle,
  onClose,
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const streamIdRef = useRef<number | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    try {
      if (audioTrackRef.current) {
        audioTrackRef.current.close();
        audioTrackRef.current = null;
      }
      if (videoTrackRef.current) {
        videoTrackRef.current.close();
        videoTrackRef.current = null;
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  const startStream = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call API to start stream
      const response = await fetch('/api/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start stream');
      }

      const { stream } = await response.json();
      streamIdRef.current = stream.id;

      // Create Agora client
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      // Set client role to host
      await client.setClientRole('host');

      // Join channel
      await client.join(
        stream.appId,
        stream.channel,
        stream.token,
        parseInt(stream.uid)
      );

      // Create and publish tracks
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();

      audioTrackRef.current = audioTrack;
      videoTrackRef.current = videoTrack;

      // Play video locally
      if (videoContainerRef.current) {
        videoTrack.play(videoContainerRef.current);
      }

      // Publish tracks
      await client.publish([audioTrack, videoTrack]);

      // Listen for user events
      client.on('user-published', async (user, mediaType) => {
        // In live streaming mode, host doesn't need to handle other users
      });

      client.on('user-left', () => {
        // Update viewer count if needed
      });

      setIsStreaming(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Error starting stream:', err);
      setError(err instanceof Error ? err.message : 'Failed to start stream');
      setIsLoading(false);
      await cleanup();
    }
  };

  const endStream = async () => {
    if (!streamIdRef.current) return;

    setIsLoading(true);

    try {
      // Call API to end stream
      const response = await fetch('/api/stream/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId: streamIdRef.current, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to end stream');
      }

      await cleanup();
      setIsStreaming(false);
      onClose();
    } catch (err) {
      console.error('Error ending stream:', err);
      setError('Failed to end stream');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = async () => {
    if (audioTrackRef.current) {
      await audioTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (videoTrackRef.current) {
      await videoTrackRef.current.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isStreaming && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-bold text-sm">LIVE</span>
            </div>
          )}
          <h2 className="font-bold text-lg truncate max-w-md">{eventTitle}</h2>
        </div>
        <div className="flex items-center gap-4">
          {isStreaming && (
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              <span className="font-semibold">{viewerCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-gray-900">
        <div
          ref={videoContainerRef}
          className="absolute inset-0 flex items-center justify-center"
        >
          {!isStreaming && (
            <div className="text-center text-white">
              <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-xl font-semibold mb-2">Ready to go live?</p>
              <p className="text-gray-400">Click -Go Live- to start streaming</p>
            </div>
          )}
        </div>

        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex gap-3">
            {isStreaming && (
              <>
                <button
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-colors ${
                    isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-colors ${
                    isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                  {isVideoOff ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>

          <div className="flex gap-3">
            {!isStreaming ? (
              <>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={startStream}
                  disabled={isLoading}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                      Go Live
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={endStream}
                disabled={isLoading}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Ending...' : 'End Stream'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerStream;