// Enhanced verify-momo-payment route with ticket availability updates
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { momo_ref } = body;

    if (!momo_ref) {
      console.error('No momo_ref provided');
      return NextResponse.json({
        success: false,
        error: 'Mobile money reference required',
      }, { status: 400 });
    }

    console.log(`🔶 Verifying MoMo payment: ${momo_ref}`);

    // Try to find payment by transaction_id
    let payment = null;

    // Strategy 1: Direct transaction_id match
    const { data: payment1 } = await supabase
      .from('PAYMENTS')
      .select('*')
      .eq('transaction_id', momo_ref)
      .maybeSingle();

    if (payment1) {
      payment = payment1;
    } else {
      // Strategy 2: Look for recent payment by user_id
      const userId = momo_ref.split('_')[0];
      
      if (userId) {
        const { data: payment2 } = await supabase
          .from('PAYMENTS')
          .select('*')
          .eq('user_id', userId)
          .or('payment_method.ilike.%mobile%,mobile_money_provider.not.is.null')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (payment2) {
          payment = payment2;
        }
      }
    }

    if (!payment) {
      console.log('Payment not found for momo_ref:', momo_ref);
      return NextResponse.json({
        success: false,
        status: 'not_found',
        message: 'Payment record not found. It may still be processing.',
      });
    }

    console.log('Payment found:', payment.id, payment.payment_status);

    // Check payment status
    const normalizedStatus = payment.payment_status?.toUpperCase().trim();
    const successfulStatuses = ['SUCCESSFUL', 'COMPLETED', 'ACTIVE', 'PAID', 'SUCCESS'];

    if (normalizedStatus === 'PENDING') {
      return NextResponse.json({
        success: false,
        status: 'pending',
        payment_status: payment.payment_status,
        message: 'Payment is still being processed.',
      });
    }

    if (!successfulStatuses.includes(normalizedStatus)) {
      return NextResponse.json({
        success: false,
        status: 'failed',
        payment_status: payment.payment_status,
        message: 'Payment was not successful.',
      });
    }

    console.log('✅ MoMo payment verified successfully.');

    // Get tickets associated with this payment
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

    // Fetch ticket details with event and ticket type info
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('TICKETS')
      .select(`
        *,
        EVENTS!inner (
          id, title, event_date, location_name, address, images, description
        ),
        TICKET_TYPES!inner (
          id, name, price, description, format, event_id
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

    // Filter for valid tickets
    const validTickets = ticketsData.filter((ticket) => {
      const status = ticket.ticket_status?.toUpperCase().trim();
      return ['SUCCESSFUL', 'ACTIVE', 'CONFIRMED', 'VALID', 'PENDING'].includes(status);
    });

    if (!validTickets.length) {
      return NextResponse.json({
        success: false,
        status: 'no_valid_tickets',
        message: 'No valid tickets found for this payment.',
      });
    }

    console.log('🎟 Tickets verified:', validTickets.length);

    // Update ticket status to active if successful
    if (normalizedStatus === 'SUCCESSFUL' || normalizedStatus === 'COMPLETED') {
      const { error: updateError } = await supabase
        .from('TICKETS')
        .update({ ticket_status: 'active' })
        .in('id', ticketIds);

      if (updateError) {
        console.error('Error updating ticket status:', updateError);
      }

      // 🔥 NEW: Update ticket availability in TICKET_TYPES
      for (const ticket of validTickets) {
        const ticketTypeId = ticket.TICKET_TYPES.id;
        const quantity = parseInt(ticket.quantity || '1');

        // Fetch current ticket type data
        const { data: currentTicketType } = await supabase
          .from('TICKET_TYPES')
          .select('quantity_available, quantity_sold, capacity')
          .eq('id', ticketTypeId)
          .single();

        if (currentTicketType) {
          const newAvailable = Math.max(0, (currentTicketType.quantity_available || 0) - quantity);
          const newSold = (currentTicketType.quantity_sold || 0) + quantity;

          // Update with new values
          const { error: ticketTypeError } = await supabase
            .from('TICKET_TYPES')
            .update({
              quantity_available: newAvailable,
              quantity_sold: newSold,
            })
            .eq('id', ticketTypeId);

          if (ticketTypeError) {
            console.error('Error updating ticket type:', ticketTypeError);
          } else {
            console.log(`📉 Updated ticket type ${ticketTypeId}: ${newAvailable} available, ${newSold} sold`);
          }
        }
      }
    }

    // Send ticket email
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

    // Return success with tickets
    return NextResponse.json({
      success: true,
      status: 'completed',
      source: 'momo',
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.payment_status,
        transaction_id: payment.transaction_id,
      },
      tickets: validTickets,
      email: {
        status: emailStatus,
        emailId,
      },
    });

  } catch (error) {
    console.error('Verify MoMo payment error:', error);
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