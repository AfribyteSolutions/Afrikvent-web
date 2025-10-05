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

    // ============= EMAIL SENDING WITH DETAILED LOGGING =============
    let emailStatus = 'pending';
    let emailId = null;
    const emailLogs: string[] = [];

    // Get user data
    console.log('[EMAIL] Step 1: Fetching user data...');
    emailLogs.push('Fetching user data');
    
    const { data: userData, error: userError } = await supabase
      .from('USERS')
      .select('email, name')
      .eq('user_id', validTickets[0].user_id)
      .single();

    if (userError || !userData?.email) {
      console.error('[EMAIL] ERROR: Failed to get user data:', userError);
      emailLogs.push(`ERROR: ${userError?.message || 'No email found'}`);
      emailStatus = 'failed';
    } else {
      console.log('[EMAIL] User email:', userData.email);
      emailLogs.push(`User: ${userData.email}`);

      const isVirtual = validTickets[0].TICKET_TYPES?.format === 'online';
      
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

      console.log('[EMAIL] Step 2: Payload prepared for event:', emailPayload.eventTitle);
      emailLogs.push(`Event: ${emailPayload.eventTitle}`);

      // Try sending email immediately
      console.log('[EMAIL] Step 3: Attempting to send email via Supabase function...');
      emailLogs.push('Calling send-ticket-email function');

      try {
        const functionResult = await supabase.functions.invoke('send-ticket-email', {
          body: emailPayload
        });

        console.log('[EMAIL] Function result:', JSON.stringify(functionResult, null, 2));

        if (functionResult.error) {
          console.error('[EMAIL] Function returned error:', functionResult.error);
          emailLogs.push(`Function error: ${functionResult.error.message}`);
          throw functionResult.error;
        }

        if (functionResult.data?.success) {
          console.log('[EMAIL] ✓ SUCCESS! Email sent with ID:', functionResult.data.emailId);
          emailStatus = 'sent';
          emailId = functionResult.data.emailId;
          emailLogs.push(`SUCCESS: Email sent (${emailId})`);

          // Record in queue as sent
          try {
            await supabase.from('EMAIL_QUEUE').insert({
              user_id: validTickets[0].user_id,
              email_type: 'ticket_confirmation',
              payload: emailPayload,
              status: 'sent',
              recipient_email: userData.email,
              created_at: new Date().toISOString(),
              sent_at: new Date().toISOString(),
              external_id: emailId,
              retry_count: 0
            });
            emailLogs.push('Recorded in EMAIL_QUEUE');
          } catch (queueErr) {
            console.log('[EMAIL] Note: Could not record in queue (table may not exist)');
            emailLogs.push('Queue table not available');
          }
        } else {
          throw new Error('Function returned no success flag');
        }

      } catch (sendError) {
        console.error('[EMAIL] Failed to send:', sendError);
        emailLogs.push(`Send failed: ${sendError instanceof Error ? sendError.message : 'Unknown'}`);
        emailStatus = 'failed';

        // Try to queue for retry
        console.log('[EMAIL] Step 4: Attempting to queue for retry...');
        try {
          await supabase.from('EMAIL_QUEUE').insert({
            user_id: validTickets[0].user_id,
            email_type: 'ticket_confirmation',
            payload: emailPayload,
            status: 'pending',
            recipient_email: userData.email,
            created_at: new Date().toISOString(),
            retry_count: 0,
            max_retries: 5,
            next_retry_at: new Date().toISOString(),
            error_message: sendError instanceof Error ? sendError.message : 'Failed to send'
          });
          emailLogs.push('Queued for retry');
          emailStatus = 'queued';
        } catch (queueError) {
          console.error('[EMAIL] ERROR: Could not queue email:', queueError);
          emailLogs.push(`Queue failed: ${queueError instanceof Error ? queueError.message : 'Unknown'}`);
        }
      }
    }

    console.log('[EMAIL] Final status:', emailStatus);
    console.log('[EMAIL] Complete log:', emailLogs.join(' → '));

    // 5. Return success with all data + email debug info
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
      tickets: validTickets,
      email: {
        status: emailStatus,
        emailId: emailId,
        message: emailStatus === 'sent' 
          ? 'Confirmation email has been sent to your inbox'
          : emailStatus === 'queued'
          ? 'Email queued for delivery'
          : 'Email delivery in progress - check your inbox shortly',
        logs: emailLogs
      }
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