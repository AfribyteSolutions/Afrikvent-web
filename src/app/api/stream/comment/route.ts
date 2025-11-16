// app/api/stream/comment/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { eventId, userId, message } = await req.json();

    if (!eventId || !userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Insert comment
    const { data, error } = await supabase
      .from('STREAM_COMMENTS')
      .insert({
        event_id: eventId,
        user_id: userId,
        message: message.trim()
      })
      .select(`
        id,
        user_id,
        message,
        created_at,
        USERS (
          name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Error inserting comment:', error);
      return NextResponse.json(
        { error: 'Failed to post comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, comment: data });
  } catch (error) {
    console.error('Error in comment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}