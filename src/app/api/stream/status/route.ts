// app/api/stream/status/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Get active stream for event
    const { data: stream, error } = await supabase
      .from('LIVE_STREAMS')
      .select('*')
      .eq('event_id', parseInt(eventId))
      .eq('status', 'live')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching stream status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stream status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      isLive: !!stream,
      stream: stream || null,
    });
  } catch (error) {
    console.error('Error in stream status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}