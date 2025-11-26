// components/stream/RTMPSetup.tsx
'use client';
import React, { useState } from 'react';

interface RTMPSetupProps {
  eventId: number;
  userId: string;
  onClose: () => void;
}

interface StreamConfig {
  serverUrl: string;
  streamKey: string;
  streamName: string;
  streamId: number;
}

export default function RTMPSetup({ eventId, userId, onClose }: RTMPSetupProps) {
  const [streamConfig, setStreamConfig] = useState<StreamConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const getStreamConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stream/rtmp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userId })
      });
      
      if (!res.ok) {
        throw new Error('Failed to get stream configuration');
      }
      
      const data = await res.json();
      setStreamConfig(data);
    } catch (error) {
      console.error('Error getting stream config:', error);
      alert('Failed to setup RTMP stream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!streamConfig) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Stream with OBS/Streamlabs/etc</h2>
          <p className="text-gray-400 mb-6">Use professional streaming software for your event</p>
          <button
            onClick={getStreamConfig}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold text-lg mb-3 disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Get Stream Settings'}
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-white mb-2">RTMP Stream Settings</h2>
        <p className="text-gray-400 mb-8">Use these settings in your streaming software</p>
        
        {/* Server URL */}
        <div className="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-400">SERVER URL</span>
          </div>
          <div className="bg-black rounded-lg p-4 mb-4 break-all">
            <code className="text-purple-400 text-sm">{streamConfig.serverUrl}</code>
          </div>
          <button
            onClick={() => copyToClipboard(streamConfig.serverUrl, 'server')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
          >
            {copiedField === 'server' ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Server URL
              </>
            )}
          </button>
        </div>

        {/* Stream Key */}
        <div className="bg-gray-800 border-2 border-blue-500 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-400">STREAM KEY</span>
          </div>
          <div className="bg-black rounded-lg p-4 mb-4 break-all">
            <code className="text-blue-400 text-sm">{streamConfig.streamKey}</code>
          </div>
          <button
            onClick={() => copyToClipboard(streamConfig.streamKey, 'key')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
          >
            {copiedField === 'key' ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Stream Key
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="space-y-6 mb-8">
          {/* OBS Instructions */}
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ANY</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Streaming Software</h2>
            </div>
            <ol className="space-y-3 text-gray-300 text-sm">
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">1.</span>
                <span>Go to <strong className="text-white">Settings → Stream</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">2.</span>
                <span>Service: <strong className="text-white">Custom</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">3.</span>
                <span>Server: <strong className="text-white">{streamConfig.serverUrl}</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">4.</span>
                <span>Stream Key: <strong className="text-white">{streamConfig.streamKey}</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">5.</span>
                <span>Click <strong className="text-white">OK</strong> then <strong className="text-white">Start Streaming</strong></span>
              </li>
            </ol>
          </div>

          {/* Streamlabs Instructions */}
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">SL</span>
              </div>
              <h3 className="text-white font-bold text-lg">Streamlabs</h3>
            </div>
            <ol className="space-y-3 text-gray-300 text-sm">
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">1.</span>
                <span>Go to <strong className="text-white">Settings → Stream</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">2.</span>
                <span>Stream Type: <strong className="text-white">Custom Streaming Server</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">3.</span>
                <span>URL: <strong className="text-white">{streamConfig.serverUrl}</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">4.</span>
                <span>Stream Key: <strong className="text-white">{streamConfig.streamKey}</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-purple-500 font-bold">5.</span>
                <span>Click <strong className="text-white">Done</strong> then <strong className="text-white">Go Live</strong></span>
              </li>
            </ol>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-xl font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}