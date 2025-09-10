// src/components/events/CommentsSection.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Comment } from "@/types/comments";
import type { User } from "@supabase/supabase-js";

interface Props {
  eventId: string;
  user: User | null;
}

// Raw comment from Supabase (no nested replies yet)
interface CommentRow {
  id: string;
  event_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
}

export default function CommentsSection({ eventId, user }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // Fetch comments
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("id, event_id, user_id, parent_id, content, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const rows = data as CommentRow[];

      // Build nested replies
      const map: Record<string, Comment> = {};
      rows.forEach((c) => {
        map[c.id] = { ...c, replies: [] }; // now safe
      });

      const roots: Comment[] = [];
      rows.forEach((c) => {
        if (c.parent_id) {
          map[c.parent_id]?.replies?.push(map[c.id]);
        } else {
          roots.push(map[c.id]);
        }
      });

      setComments(roots);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  // Add comment
  const handleAddComment = async (parentId: string | null = null) => {
    if (!newComment.trim() || !user) return;

    const { error } = await supabase.from("comments").insert([
      {
        event_id: eventId,
        user_id: user.id,
        parent_id: parentId,
        content: newComment,
      },
    ]);

    if (!error) {
      setNewComment("");
      fetchComments();
    }
  };

  const renderComments = (comments: Comment[], depth = 0) => (
    <div className={`space-y-4 ${depth > 0 ? "ml-6" : ""}`}>
      {comments.map((c) => (
        <div key={c.id} className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-gray-800">{c.content}</p>
          <p className="text-xs text-gray-500">
            {new Date(c.created_at).toLocaleString()}
          </p>
          {user && (
            <button
              onClick={() => handleAddComment(c.id)}
              className="text-sm text-blue-600 mt-2"
            >
              Reply
            </button>
          )}
          {c.replies && c.replies.length > 0 && renderComments(c.replies, depth + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mt-12">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Comments</h3>

      {user ? (
        <div className="mb-6">
          <textarea
            className="w-full border rounded-lg p-3 mb-2 text-sm"
            rows={3}
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            onClick={() => handleAddComment(null)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Post Comment
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-6">
          Sign in to leave a comment.
        </p>
      )}

      {renderComments(comments)}
    </div>
  );
}
