// app/api/stream/end/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { streamId, userId } = await req.json();

    if (!streamId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the stream
    const { data: stream, error: streamError } = await supabase
      .from('LIVE_STREAMS')
      .select('*')
      .eq('id', streamId)
      .single();

    if (streamError || !stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Verify user is the organizer
    if (stream.organizer_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You are not the stream organizer' },
        { status: 403 }
      );
    }

    // Update stream status
    const { error: updateError } = await supabase
      .from('LIVE_STREAMS')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', streamId);

    if (updateError) {
      console.error('Error ending stream:', updateError);
      return NextResponse.json(
        { error: 'Failed to end stream' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Stream ended successfully',
    });
  } catch (error) {
    console.error('Error ending stream:', error);
    return NextResponse.json(
      { error: 'Failed to end stream' },
      { status: 500 }
    );
  }
}