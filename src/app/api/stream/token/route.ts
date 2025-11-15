// app/api/stream/token/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateRtcToken } from '@/lib/agora/tokenGenerator';
import { RTC_ROLE } from '@/lib/agora/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { eventId, ticketCode, role } = await req.json();

    if (!eventId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the live stream
    const { data: stream, error: streamError } = await supabase
      .from('LIVE_STREAMS')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'live')
      .single();

    if (streamError || !stream) {
      return NextResponse.json(
        { error: 'No active stream found for this event' },
        { status: 404 }
      );
    }

    // If role is subscriber, verify ticket code
    if (role === 'subscriber') {
      if (!ticketCode) {
        return NextResponse.json(
          { error: 'Ticket code required for viewing' },
          { status: 400 }
        );
      }

      // Verify ticket code
      const { data: ticket, error: ticketError } = await supabase
        .from('TICKETS')
        .select(`
          *,
          TICKET_TYPES (
            format,
            event_id
          )
        `)
        .eq('ticket_code', ticketCode.toUpperCase())
        .eq('ticket_status', 'valid')
        .single();

      if (ticketError || !ticket) {
        return NextResponse.json(
          { error: 'Invalid ticket code' },
          { status: 403 }
        );
      }

      // Verify ticket is for this event and is online
      if (
        ticket.TICKET_TYPES?.event_id !== eventId ||
        ticket.TICKET_TYPES?.format !== 'online'
      ) {
        return NextResponse.json(
          { error: 'This ticket is not valid for this online event' },
          { status: 403 }
        );
      }
    }

    // Generate unique UID for this session
    const uid = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

    // Generate Agora token
    const rtcRole = role === 'publisher' ? RTC_ROLE.PUBLISHER : RTC_ROLE.SUBSCRIBER;
    const token = generateRtcToken(stream.channel_name, uid, rtcRole, 3600);

    return NextResponse.json({
      token,
      channel: stream.channel_name,
      uid,
      appId: process.env.NEXT_PUBLIC_AGORA_APP_ID,
      expiresAt: Date.now() + 3600 * 1000,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}