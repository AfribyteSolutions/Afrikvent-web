'use client';
import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { supabase } from '@/lib/supabaseClient';
import RTMPSetup from './RTMPSetup'; // Make sure to import the RTMP component

interface OrganizerStreamProps {
  eventId: number;
  userId: string;
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

interface StreamConfig {
  serverUrl: string;
  streamKey: string;
  streamName: string;
  streamId: number;
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
  const [showComments, setShowComments] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [showStreamOptions, setShowStreamOptions] = useState(true); // New state for stream options
  const [showRTMPSetup, setShowRTMPSetup] = useState(false); // New state for RTMP setup
  const [streamType, setStreamType] = useState<'webrtc' | 'rtmp' | null>(null); // Track stream type

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const streamIdRef = useRef<number | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamType === 'webrtc') {
      loadCameraDevices();
    }
    subscribeToComments();
    
    return () => {
      cleanup();
    };
  }, [streamType]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCameraDevices = async () => {
    try {
      const devices = await AgoraRTC.getCameras();
      setDevices(devices);
      if (devices.length > 0) {
        setSelectedCamera(devices[0].deviceId);
      }
    } catch (err) {
      console.error('Error loading camera devices:', err);
    }
  };

  const subscribeToComments = () => {
    // Load initial comments
    loadComments();

    // Subscribe to new comments
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
          console.log('New comment:', payload);
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
        .limit(50);

      if (error) throw error;
      
      // Transform the data to match our Comment type
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

  const switchCamera = async (deviceId: string) => {
    if (!videoTrackRef.current || !isStreaming) return;

    try {
      await videoTrackRef.current.setDevice(deviceId);
      setSelectedCamera(deviceId);
      setShowDeviceMenu(false);
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera');
    }
  };

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

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      await client.setClientRole('host');

      let numericUid: number;
      if (typeof stream.uid === 'string') {
        numericUid = parseInt(stream.uid);
      } else {
        numericUid = stream.uid;
      }

      if (numericUid > 10000 || numericUid < 0) {
        numericUid = numericUid % 10000;
      }

      await client.join(
        stream.appId,
        stream.channel,
        stream.token,
        numericUid
      );

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack({
        cameraId: selectedCamera || undefined,
        encoderConfig: {
          width: 1280,
          height: 720,
          frameRate: 30,
          bitrateMin: 1000,
          bitrateMax: 3000,
        },
      });

      audioTrackRef.current = audioTrack;
      videoTrackRef.current = videoTrack;

      if (videoContainerRef.current) {
        videoTrack.play(videoContainerRef.current);
      }

      await client.publish([audioTrack, videoTrack]);

      client.on('user-joined', (user) => {
        setViewerCount(prev => prev + 1);
      });

      client.on('user-left', (user) => {
        setViewerCount(prev => Math.max(0, prev - 1));
      });

      setIsStreaming(true);
      setShowStreamOptions(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Error starting stream:', err);
      setError(err instanceof Error ? err.message : 'Failed to start stream');
      setIsLoading(false);
      await cleanup();
    }
  };

  const startRTMPStream = async () => {
    setStreamType('rtmp');
    setIsLoading(true); // Add loading state
    setError(null);
  
    try {
      const response = await fetch('/api/stream/rtmp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userId }),
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to setup RTMP stream');
      }
  
      const data = await response.json();
      streamIdRef.current = data.streamId;
      setIsStreaming(true);
      setShowStreamOptions(false);
      setShowRTMPSetup(true); // Show RTMP setup modal
    } catch (err) {
      console.error('Error setting up RTMP:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup RTMP stream');
      setStreamType(null);
      setShowStreamOptions(true);
    } finally {
      setIsLoading(false);
    }
  };
  const endStream = async () => {
    if (!streamIdRef.current) return;

    setIsLoading(true);

    try {
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
      setStreamType(null);
      setShowStreamOptions(true);
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

  const handleRTMPClose = () => {
    setShowRTMPSetup(false);
    setShowStreamOptions(true);
    setStreamType(null);
  };

  // Show stream options modal
  if (showStreamOptions && !isStreaming) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Start Streaming</h2>
          <p className="text-gray-400 mb-6">Choose how you want to stream your event</p>
          
          <div className="space-y-4 mb-6">
            {/* WebRTC Option */}
            <button
              onClick={() => {
                setStreamType('webrtc');
                setShowStreamOptions(false);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Stream from Browser
            </button>

            {/* RTMP Option */}
            <button
              onClick={startRTMPStream}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Advance Software
            </button>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-white">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Show RTMP setup modal
  if (showRTMPSetup) {
    return (
      <RTMPSetup
        eventId={eventId}
        userId={userId}
        onClose={handleRTMPClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header - Responsive */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {isStreaming && (
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-bold text-xs md:text-sm">LIVE</span>
              {streamType === 'rtmp' && (
                <span className="bg-green-600 px-2 py-0.5 rounded text-xs font-medium">RTMP</span>
              )}
            </div>
          )}
          <h2 className="font-bold text-sm md:text-lg truncate">{eventTitle}</h2>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {isStreaming && (
            <>
              <div className="flex items-center gap-1.5 md:gap-2 bg-white/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                <span className="font-semibold text-xs md:text-base">{viewerCount}</span>
              </div>
              <button
                onClick={() => setShowComments(!showComments)}
                className="md:hidden p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Video Container */}
        <div className="flex-1 relative bg-gray-900">
          <div
            ref={videoContainerRef}
            className="absolute inset-0 flex items-center justify-center"
          >
            {!isStreaming && streamType === 'webrtc' && (
              <div className="text-center text-white px-4">
                <svg className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-3 md:mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg md:text-xl font-semibold mb-2">Ready to go live?</p>
                <p className="text-sm md:text-base text-gray-400">Click -Go Live- to start streaming</p>
              </div>
            )}
            {streamType === 'rtmp' && (
              <div className="text-center text-white px-4">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg md:text-xl font-semibold mb-2">RTMP Stream Active</p>
                <p className="text-sm md:text-base text-gray-400 mb-4">
                  Stream is ready for OBS/Streamlabs input
                </p>
                <div className="bg-gray-800 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-green-400 text-sm font-medium mb-2">✓ Stream is waiting for RTMP input</p>
                  <p className="text-gray-400 text-xs">
                    Use the RTMP settings in your streaming software to start broadcasting
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg z-10 max-w-[90%]">
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
        {isStreaming && (
          <div className={`${showComments ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 bg-gray-900 border-t md:border-t-0 md:border-l border-gray-700`}>
            <div className="p-3 md:p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm md:text-base">Live Chat</h3>
              <span className="text-xs md:text-sm text-gray-400">{comments.length} messages</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
              {comments.map((comment) => (
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
              ))}
              <div ref={commentsEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Controls - Responsive */}
      <div className="bg-gray-800 p-3 md:p-6 border-t border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-0">
          <div className="flex gap-2 md:gap-3">
            {isStreaming && streamType === 'webrtc' && (
              <>
                <button
                  onClick={toggleMute}
                  className={`p-2.5 md:p-4 rounded-full transition-colors ${
                    isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMuted ? (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </>
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    )}
                  </svg>
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-2.5 md:p-4 rounded-full transition-colors ${
                    isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                  <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isVideoOff ? (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                      </>
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    )}
                  </svg>
                </button>

                {/* Camera Switcher */}
                {devices.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowDeviceMenu(!showDeviceMenu)}
                      className="p-2.5 md:p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                      title="Switch camera"
                    >
                      <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    
                    {showDeviceMenu && (
                      <div className="absolute bottom-full mb-2 left-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-[200px] z-50">
                        {devices.map((device) => (
                          <button
                            key={device.deviceId}
                            onClick={() => switchCamera(device.deviceId)}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors text-sm ${
                              selectedCamera === device.deviceId ? 'text-blue-400' : 'text-white'
                            }`}
                          >
                            {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2 md:gap-3">
            {!isStreaming && streamType === 'webrtc' ? (
              <>
                <button
                  onClick={() => setShowStreamOptions(true)}
                  disabled={isLoading}
                  className="px-3 py-2 md:px-6 md:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold text-sm md:text-base transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={startStream}
                  disabled={isLoading}
                  className="px-4 py-2 md:px-8 md:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm md:text-base transition-colors disabled:opacity-50 flex items-center gap-1.5 md:gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Starting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                      Go Live
                    </>
                  )}
                </button>
              </>
            ) : isStreaming ? (
              <button
                onClick={endStream}
                disabled={isLoading}
                className="px-4 py-2 md:px-8 md:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm md:text-base transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Ending...' : 'End Stream'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerStream;