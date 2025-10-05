// app/api/verify-payment/route.ts
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

    // Queue email for background processing (Production approach)
    try {
      console.log('Fetching user data for email queue...');
      
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

      console.log('Queueing email for background processing...');

      // Insert into EMAIL_QUEUE for background processing
      const { error: queueError } = await supabase
        .from('EMAIL_QUEUE')
        .insert({
          user_id: validTickets[0].user_id,
          email_type: 'ticket_confirmation',
          payload: emailPayload,
          status: 'pending',
          recipient_email: userData.email,
          created_at: new Date().toISOString(),
          retry_count: 0
        });

      if (queueError) {
        console.error('Error queueing email:', queueError);
        throw queueError;
      }

      console.log('Email queued successfully for background processing');

      // Optional: Try immediate send with timeout as fallback
      // If it fails, the background worker will retry
      try {
        console.log('Attempting immediate email send...');
        
        const functionClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          global: {
            headers: {
              'x-request-timeout': '30000' // 30 seconds for immediate attempt
            }
          }
        });

        const invokeWithTimeout = async (timeout: number = 30000): Promise<InvocationResponse> => {
          const timeoutPromise = new Promise<InvocationResponse>((_, reject) => {
            setTimeout(() => reject(new Error('Email function timeout')), timeout);
          });

          const invokePromise = functionClient.functions.invoke(
            'send-ticket-email',
            { body: emailPayload }
          ) as Promise<InvocationResponse>;

          return Promise.race([invokePromise, timeoutPromise]);
        };

        const emailResult = await invokeWithTimeout(30000);

        if (emailResult.error) {
          console.error('Immediate email send failed, will be retried by background worker:', emailResult.error.message);
        } else {
          console.log('Email sent immediately:', emailResult.data?.emailId);
          
          // Mark as sent in queue
          await supabase
            .from('EMAIL_QUEUE')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              external_id: emailResult.data?.emailId
            })
            .eq('user_id', validTickets[0].user_id)
            .eq('email_type', 'ticket_confirmation')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1);
        }

      } catch (immediateEmailError) {
        console.error('Immediate email send failed:', immediateEmailError);
        console.log('Email will be processed by background worker');
        // Not throwing - email is queued for background processing
      }

    } catch (emailError) {
      console.error('Email processing error:', emailError);
      console.error('Error details:', {
        message: emailError instanceof Error ? emailError.message : 'Unknown error',
        stack: emailError instanceof Error ? emailError.stack : undefined,
        type: emailError instanceof Error ? emailError.constructor.name : typeof emailError
      });
      
      console.error('WARNING: Payment verified but email NOT queued');
      // Continue - payment is still successful
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