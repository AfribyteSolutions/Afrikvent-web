// src/app/events/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { MOCK_EVENTS } from '@/data/event/events';
import { Comment } from '@/types/comments';

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

// Helper to fetch event by ID
const getEventById = (id: string) => {
  return MOCK_EVENTS.find((e) => e.id.toString() === id);
};

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const event = getEventById(id);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch comments for this event
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
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('You must be logged in to comment.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([{ content: newComment, event_id: id, user_id: user.id }])
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

      setComments([mapped, ...comments]); // prepend new comment
      setNewComment('');
    }

    setLoading(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 w-full">
        <Image src={event.image} alt={event.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
              {event.title}
            </h1>
            <p className="text-xl text-gray-200">{event.category}</p>
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
                      {formatDate(event.date)} at {event.time}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-700">
                      {event.venue}, {event.location}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-700">
                      Organized by {event.organizer}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 💬 Comments Section */}
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
                  disabled={loading}
                  className="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Posting...' : 'Post Comment'}
                </button>
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Get Tickets
              </h3>
              <div className="text-3xl font-bold text-blue-500 mb-4">
                {event.price}
              </div>
              <div className="space-y-3">
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                  Buy Tickets
                </button>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Or dial:</p>
                  <p className="font-mono text-lg font-semibold text-gray-900">
                    {event.phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Share Event
              </h3>
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors">
                  Facebook
                </button>
                <button className="flex-1 bg-blue-400 hover:bg-blue-500 text-white py-2 px-3 rounded text-sm transition-colors">
                  Twitter
                </button>
                <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm transition-colors">
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
