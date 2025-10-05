// app/api/verify-payment/route.ts
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
        error: 'Server configuration error'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { session_id } = await request.json();

    if (!session_id) {
      console.error('No session_id provided');
      return NextResponse.json({
        success: false,
        error: 'Session ID required'
      }, { status: 400 });
    }

    console.log('Verifying payment for session:', session_id);

    // 1. Find payment by transaction_id
    const { data: payment, error: paymentError } = await supabase
      .from('PAYMENTS')
      .select('*')
      .eq('transaction_id', session_id)
      .single();

    if (paymentError || !payment) {
      console.log('Payment not found yet:', paymentError?.message);
      return NextResponse.json({
        success: false,
        status: 'not_found',
        message: 'Payment record not found yet. It may still be processing.'
      });
    }

    console.log('Payment found:', {
      id: payment.id,
      status: payment.payment_status,
      amount: payment.amount,
    });

    // 2. Check payment status
    const normalizedStatus = payment.payment_status?.toUpperCase().trim();
    
    console.log('Normalized payment status:', normalizedStatus);
    
    if (normalizedStatus === 'PENDING') {
      console.log('Payment is still pending');
      return NextResponse.json({
        success: false,
        status: 'pending',
        payment_status: payment.payment_status,
        message: 'Payment is being processed'
      });
    }

    const successfulStatuses = ['SUCCESSFUL', 'COMPLETED', 'ACTIVE', 'PAID'];
    if (!successfulStatuses.includes(normalizedStatus)) {
      console.log('Payment has non-successful status:', payment.payment_status);
      return NextResponse.json({
        success: false,
        status: 'failed',
        payment_status: payment.payment_status,
        message: 'Payment was not successful'
      });
    }

    console.log('Payment status is valid');

    // 3. Get associated tickets
    const { data: paymentTickets, error: ptError } = await supabase
      .from('PAYMENT_TICKETS')
      .select('ticket_id')
      .eq('payment_id', payment.id);

    if (ptError) {
      console.error('Error fetching payment_tickets:', ptError);
      return NextResponse.json({
        success: false,
        status: 'tickets_error',
        message: 'Error fetching ticket associations'
      });
    }

    if (!paymentTickets || paymentTickets.length === 0) {
      console.log('No tickets found in PAYMENT_TICKETS for payment_id:', payment.id);
      return NextResponse.json({
        success: false,
        status: 'no_tickets',
        message: 'No tickets found for this payment'
      });
    }

    const ticketIds = paymentTickets.map(pt => pt.ticket_id);
    console.log('Found ticket IDs:', ticketIds);

    // 4. Fetch full ticket details with format field
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('TICKETS')
      .select(`
        *,
        EVENTS!inner (
          id,
          title,
          event_date,
          location_name,
          address,
          images,
          description
        ),
        TICKET_TYPES!inner (
          id,
          name,
          price,
          description,
          format
        )
      `)
      .in('id', ticketIds);

    if (ticketsError) {
      console.error('Error fetching ticket details:', ticketsError);
      return NextResponse.json({
        success: false,
        status: 'tickets_error',
        message: 'Error fetching ticket details',
        error: ticketsError.message
      });
    }

    console.log('Raw tickets fetched:', ticketsData?.length || 0);

    if (!ticketsData || ticketsData.length === 0) {
      console.error('No ticket data returned for IDs:', ticketIds);
      return NextResponse.json({
        success: false,
        status: 'no_tickets',
        message: 'Ticket data not found'
      });
    }

    // Filter valid tickets
    const validTickets = ticketsData.filter(ticket => {
      const ticketStatus = ticket.ticket_status?.toUpperCase().trim();
      return ['SUCCESSFUL', 'ACTIVE', 'CONFIRMED', 'VALID', 'PENDING'].includes(ticketStatus);
    });

    console.log('Valid tickets after filtering:', validTickets.length);

    if (validTickets.length === 0) {
      console.log('No valid tickets found. Statuses:', ticketsData.map(t => t.ticket_status));
      return NextResponse.json({
        success: false,
        status: 'no_valid_tickets',
        message: 'No valid tickets found for this payment'
      });
    }

    console.log('Successfully verified payment with', validTickets.length, 'tickets');

    // Send ticket email with improved error handling
    try {
      console.log('Starting email send process...');
      
      const { data: userData, error: userError } = await supabase
        .from('USERS')
        .select('email, name')
        .eq('id', validTickets[0].user_id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      if (!userData?.email) {
        console.error('No email found for user:', validTickets[0].user_id);
        throw new Error('User email not found');
      }

      console.log('User data fetched:', { email: userData.email, name: userData.name });

      const isVirtual = validTickets[0].TICKET_TYPES?.format === 'online';
      console.log('Event type:', isVirtual ? 'Virtual' : 'In-Person');

      const emailPayload = {
        userEmail: userData.email,
        userName: userData.name,
        tickets: validTickets.map(t => ({
          orderId: t.id.toString(),
          ticketType: t.TICKET_TYPES.name,
          qrCode: t.qr_code_data,
          accessCode: t.qr_code_data?.substring(0, 6).toUpperCase() || 'N/A',
          format: t.TICKET_TYPES?.format || 'in-person'
        })),
        eventTitle: validTickets[0].EVENTS.title,
        eventDate: validTickets[0].EVENTS.event_date,
        eventLocation: isVirtual 
          ? 'Virtual Event' 
          : (validTickets[0].EVENTS.location_name || validTickets[0].EVENTS.address),
        isVirtual: isVirtual
      };

      console.log('About to invoke edge function with:', {
        userEmail: emailPayload.userEmail,
        ticketCount: emailPayload.tickets.length,
        isVirtual: emailPayload.isVirtual
      });

      // Create dedicated client for function invocation
      const functionClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const { data: emailResult, error: emailError } = await functionClient.functions.invoke(
        'send-ticket-email',
        { body: emailPayload }
      );

      if (emailError) {
        console.error('Edge function invocation error:', {
          message: emailError.message,
          context: emailError.context,
          name: emailError.name
        });
        throw emailError;
      }

      console.log('Edge function response:', emailResult);
      console.log('Email sent successfully to:', userData.email);

    } catch (emailError) {
      console.error('Email send failed:', emailError);
      console.error('Error details:', {
        message: emailError instanceof Error ? emailError.message : 'Unknown error',
        stack: emailError instanceof Error ? emailError.stack : undefined
      });
      console.error('WARNING: Payment verified but email NOT sent');
    }

    // 5. Return success with all data
    const response = {
      success: true,
      status: 'completed',
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.payment_status,
        created_at: payment.created_at
      },
      tickets: validTickets
    };
    
    console.log('Returning successful response with', validTickets.length, 'tickets');
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed. Use POST.'
  }, { status: 405 });
}