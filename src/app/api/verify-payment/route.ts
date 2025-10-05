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

    // ============= GUARANTEED EMAIL DELIVERY =============
    let emailSent = false;
    let emailError = null;

    try {
      console.log('Fetching user data for email...');
      
      const { data: userData, error: userError } = await supabase
        .from('USERS')
        .select('email, name')
        .eq('id', validTickets[0].user_id)
        .single();

      if (userError || !userData?.email) {
        throw new Error(`User email not found: ${userError?.message || 'No email'}`);
      }

      console.log('User data fetched:', { email: userData.email, name: userData.name });

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

      // Check if email already sent for this payment
      const { data: existingQueue } = await supabase
        .from('EMAIL_QUEUE')
        .select('id, status, external_id')
        .eq('user_id', validTickets[0].user_id)
        .eq('email_type', 'ticket_confirmation')
        .eq('status', 'sent')
        .contains('payload', { eventTitle: emailPayload.eventTitle })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingQueue) {
        console.log('✓ Email already sent previously:', existingQueue.external_id);
        emailSent = true;
      } else {
        console.log('Sending email now...');
        
        // Multiple retry attempts with increasing timeouts
        const maxAttempts = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            console.log(`Email send attempt ${attempt}/${maxAttempts}...`);
            
            const timeout = 15000 + (attempt * 10000); // 15s, 25s, 35s
            
            const emailResult = await Promise.race([
              supabase.functions.invoke('send-ticket-email', { body: emailPayload }),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), timeout)
              )
            ]) as InvocationResponse;

            if (emailResult.error) {
              throw emailResult.error;
            }

            console.log('✓ Email sent successfully:', emailResult.data?.emailId);
            emailSent = true;

            // Record successful send in queue
            await supabase
              .from('EMAIL_QUEUE')
              .insert({
                user_id: validTickets[0].user_id,
                email_type: 'ticket_confirmation',
                payload: emailPayload,
                status: 'sent',
                recipient_email: userData.email,
                created_at: new Date().toISOString(),
                sent_at: new Date().toISOString(),
                external_id: emailResult.data?.emailId,
                retry_count: attempt - 1
              });

            break; // Success, exit retry loop

          } catch (attemptError) {
            lastError = attemptError;
            console.log(`Attempt ${attempt} failed:`, attemptError instanceof Error ? attemptError.message : 'Unknown');
            
            if (attempt < maxAttempts) {
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
          }
        }

        if (!emailSent) {
          // All attempts failed - queue for later
          console.error('All email attempts failed, queueing for retry');
          
          await supabase
            .from('EMAIL_QUEUE')
            .insert({
              user_id: validTickets[0].user_id,
              email_type: 'ticket_confirmation',
              payload: emailPayload,
              status: 'pending',
              recipient_email: userData.email,
              created_at: new Date().toISOString(),
              retry_count: 0,
              max_retries: 5,
              next_retry_at: new Date(Date.now() + 60000).toISOString(), // Retry in 1 minute
              error_message: lastError instanceof Error ? lastError.message : 'Failed to send'
            });

          emailError = 'Email queued for delivery';
        }
      }

    } catch (error) {
      console.error('Email processing error:', error);
      emailError = error instanceof Error ? error.message : 'Unknown error';
      
      // Even if email fails, payment is successful
      console.log('⚠️ Payment successful but email delivery pending');
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
      tickets: validTickets,
      email: {
        sent: emailSent,
        message: emailSent 
          ? 'Confirmation email has been sent to your inbox'
          : 'Your tickets are confirmed. Email will be delivered shortly.',
        error: emailError
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