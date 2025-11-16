// app/api/stream/start/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateChannelName, generateRtcToken } from '@/lib/agora/tokenGenerator';
import { RTC_ROLE } from '@/lib/agora/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  console.log('=== START STREAM API CALLED ===');
  
  try {
    const body = await req.json();
    console.log('Request body:', body);
    
    const { eventId, userId } = body;

    if (!eventId || !userId) {
      console.log('Missing fields:', { eventId, userId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Checking event for organizer...');
    // Verify user is the event organizer
    const { data: event, error: eventError } = await supabase
      .from('EVENTS')
      .select('organizer_id, title')
      .eq('id', eventId)
      .single();

    console.log('Event data:', event, 'Error:', eventError);

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.organizer_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You are not the event organizer' },
        { status: 403 }
      );
    }

    console.log('Checking for existing stream...');
    // Check if there's already an active stream
    const { data: existingStream, error: existingError } = await supabase
      .from('LIVE_STREAMS')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'live')
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error when no record exists

    console.log('Existing stream:', existingStream, 'Error:', existingError);

    // If there's an existing live stream, reuse it
    if (existingStream) {
      console.log('Reusing existing stream...');
      
      // Generate proper UID (0-10000) for Agora
      const uid = Math.floor(Math.random() * 10000);
      const token = generateRtcToken(existingStream.channel_name, uid.toString(), RTC_ROLE.PUBLISHER, 7200);
      
      return NextResponse.json({
        success: true,
        stream: {
          id: existingStream.id,
          channel: existingStream.channel_name,
          token,
          uid: uid.toString(),
          appId: process.env.NEXT_PUBLIC_AGORA_APP_ID,
        },
        message: 'Stream already live - reusing existing stream'
      });
    }

    // Generate channel name for new stream
    const channelName = generateChannelName(eventId);
    console.log('Generated channel:', channelName);

    console.log('Creating stream record...');
    // Create live stream record
    const { data: stream, error: streamError } = await supabase
      .from('LIVE_STREAMS')
      .insert({
        event_id: eventId,
        channel_name: channelName,
        status: 'live',
        organizer_id: userId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    console.log('Stream created:', stream, 'Error:', streamError);

    if (streamError || !stream) {
      console.error('Error creating stream:', streamError);
      return NextResponse.json(
        { error: 'Failed to create stream: ' + (streamError?.message || 'Unknown error') },
        { status: 500 }
      );
    }

    // Generate organizer token (publisher role) with proper UID
    const uid = Math.floor(Math.random() * 10000);
    console.log('Generating token for uid:', uid);
    
    const token = generateRtcToken(channelName, uid.toString(), RTC_ROLE.PUBLISHER, 7200);
    console.log('Token generated successfully');

    const response = {
      success: true,
      stream: {
        id: stream.id,
        channel: channelName,
        token,
        uid: uid.toString(),
        appId: process.env.NEXT_PUBLIC_AGORA_APP_ID,
      },
      message: 'New stream created successfully'
    };
    
    console.log('=== RETURNING SUCCESS ===');
    return NextResponse.json(response);
  } catch (error) {
    console.error('=== ERROR IN START STREAM ===', error);
    return NextResponse.json(
      { error: 'Failed to start stream: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}