import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface InvocationResponse {
  data: {
    success?: boolean;
    emailId?: string;
  } | null;
  error: Error | null;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({
        success: false,
        error: 'Server configuration error',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await request.json();
    const { session_id, payment_method } = body;

    if (!session_id) {
      console.error('No session_id provided');
      return NextResponse.json({
        success: false,
        error: 'Session ID required',
      }, { status: 400 });
    }

    console.log(`Verifying payment for session: ${session_id} (${payment_method || 'stripe'})`);

    if (payment_method === 'momo') {
      console.log('🔶 Handling MoMo verification...');

    
    }


    const { data: payment, error: paymentError } = await supabase
      .from('PAYMENTS')
      .select('*')
      .eq('transaction_id', session_id)
      .single();

    if (paymentError || !payment) {
      console.log('Payment not found:', paymentError?.message);
      return NextResponse.json({
        success: false,
        status: 'not_found',
        message: 'Payment record not found or still processing.',
      });
    }

    console.log('Payment found:', payment.id, payment.payment_status);

    const normalizedStatus = payment.payment_status?.toUpperCase().trim();
    const successfulStatuses = ['SUCCESSFUL', 'COMPLETED', 'ACTIVE', 'PAID'];

    if (normalizedStatus === 'PENDING') {
      return NextResponse.json({
        success: false,
        status: 'pending',
        payment_status: payment.payment_status,
        message: 'Payment still processing.',
      });
    }

    if (!successfulStatuses.includes(normalizedStatus)) {
      return NextResponse.json({
        success: false,
        status: 'failed',
        payment_status: payment.payment_status,
        message: 'Payment not successful.',
      });
    }

    console.log('✅ Payment verified successfully.');


    const { data: paymentTickets, error: ptError } = await supabase
      .from('PAYMENT_TICKETS')
      .select('ticket_id')
      .eq('payment_id', payment.id);

    if (ptError || !paymentTickets?.length) {
      return NextResponse.json({
        success: false,
        status: 'no_tickets',
        message: 'No tickets found for this payment.',
      });
    }

    const ticketIds = paymentTickets.map((pt) => pt.ticket_id);

    const { data: ticketsData, error: ticketsError } = await supabase
      .from('TICKETS')
      .select(`
        *,
        EVENTS!inner (
          id, title, event_date, location_name, address, images, description
        ),
        TICKET_TYPES!inner (
          id, name, price, description, format
        )
      `)
      .in('id', ticketIds);

    if (ticketsError || !ticketsData?.length) {
      return NextResponse.json({
        success: false,
        status: 'no_ticket_data',
        message: 'Could not fetch ticket details.',
      });
    }

    const validTickets = ticketsData.filter((ticket) => {
      const status = ticket.ticket_status?.toUpperCase().trim();
      return ['SUCCESSFUL', 'ACTIVE', 'CONFIRMED', 'VALID'].includes(status);
    });

    if (!validTickets.length) {
      return NextResponse.json({
        success: false,
        status: 'no_valid_tickets',
        message: 'No valid tickets found for this payment.',
      });
    }

    console.log('🎟 Tickets verified:', validTickets.length);

    // ===============================
    // 4️⃣ Send Ticket Email (reused)
    // ===============================
    let emailStatus = 'pending';
    let emailId = null;

    const { data: userData } = await supabase
      .from('USERS')
      .select('email, name')
      .eq('user_id', validTickets[0].user_id)
      .single();

    if (userData?.email) {
      const isVirtual = validTickets[0].TICKET_TYPES?.format === 'online';
      const emailPayload = {
        userEmail: userData.email,
        userName: userData.name,
        tickets: validTickets.map((t) => ({
          orderId: t.id.toString(),
          ticketType: t.TICKET_TYPES.name,
          qrCode: t.qr_code_data,
          accessCode: t.qr_code_data?.substring(0, 6).toUpperCase() || 'N/A',
          format: t.TICKET_TYPES?.format || 'in-person',
        })),
        eventTitle: validTickets[0].EVENTS.title,
        eventDate: validTickets[0].EVENTS.event_date,
        eventLocation: isVirtual
          ? 'Virtual Event'
          : validTickets[0].EVENTS.location_name || validTickets[0].EVENTS.address,
        isVirtual,
      };

      const functionResult = await supabase.functions.invoke('send-ticket-email', {
        body: emailPayload,
      });

      if (functionResult.data?.success) {
        emailStatus = 'sent';
        emailId = functionResult.data.emailId;
      } else {
        emailStatus = 'queued';
      }
    }

    return NextResponse.json({
      success: true,
      status: 'completed',
      source: payment_method || 'stripe',
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.payment_status,
      },
      tickets: validTickets,
      email: {
        status: emailStatus,
        emailId,
      },
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed. Use POST.',
  }, { status: 405 });
}
