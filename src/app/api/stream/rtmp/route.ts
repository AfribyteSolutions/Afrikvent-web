// app/api/stream/rtmp/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { eventId, userId } = await req.json();

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Missing eventId or userId' },
        { status: 400 }
      );
    }

    // Verify user is event organizer
    const { data: event, error: eventError } = await supabase
      .from('EVENTS')
      .select('organizer_id, title')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Event fetch error:', eventError);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!event || event.organizer_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Generate unique stream name
    const streamName = `event_${eventId}_${Date.now()}`;
    
    // Agora RTMP configuration
    const serverUrl = process.env.AGORA_RTMP_SERVER_URL || 'rtmp://webrtc-ingress.agora.io/live';
    const streamKey = streamName;

    // Store stream info - USE 'live' STATUS
    const { data: stream, error: streamError } = await supabase
      .from('LIVE_STREAMS')
      .upsert({
        event_id: eventId,
        organizer_id: userId,
        channel_name: streamName,
        stream_type: 'rtmp',
        status: 'live', // MAKE SURE THIS IS 'live' NOT 'preparing'
        started_at: new Date().toISOString(),
        rtmp_stream_key: streamKey,
      })
      .select()
      .single();

    if (streamError) {
      console.error('Stream creation error:', streamError);
      return NextResponse.json(
        { error: 'Failed to create stream record: ' + streamError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      serverUrl: serverUrl,
      streamKey: streamKey,
      streamName: streamName,
      streamId: stream.id
    });

  } catch (error) {
    console.error('RTMP setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}