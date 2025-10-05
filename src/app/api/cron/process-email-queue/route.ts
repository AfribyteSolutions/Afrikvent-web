// app/api/cron/process-email-queue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This should be called by a cron job (e.g., Vercel Cron)
// Runs every 2 minutes to process queued emails

interface EmailQueueItem {
  id: number;
  user_id: string;
  email_type: string;
  recipient_email: string;
  payload: {
    userEmail: string;
    userName: string;
    tickets: Array<{
      orderId: string;
      ticketType: string;
      qrCode: string;
      accessCode: string;
      format: string;
    }>;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    isVirtual: boolean;
  };
  status: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  scheduled_for: string;
}

interface InvocationResponse {
  data: {
    success?: boolean;
    emailId?: string;
  } | null;
  error: Error | null;
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    console.log('Starting email queue processing...');

    // Fetch pending emails that are ready to be sent
    // Limit to 10 per batch to avoid overwhelming the system
    const { data: queuedEmails, error: fetchError } = await supabase
      .from('EMAIL_QUEUE')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .lt('retry_count', 3) // Don't process emails that have exceeded max retries
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching queued emails:', fetchError);
      return NextResponse.json({
        success: false,
        error: fetchError.message
      }, { status: 500 });
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      console.log('No emails in queue to process');
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No emails to process'
      });
    }

    console.log(`Found ${queuedEmails.length} emails to process`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ id: number; error: string }>
    };

    // Process each email
    for (const email of queuedEmails as EmailQueueItem[]) {
      console.log(`Processing email ID ${email.id} for ${email.recipient_email}`);

      // Mark as processing
      await supabase
        .from('EMAIL_QUEUE')
        .update({ 
          status: 'processing',
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', email.id);

      try {
        // Create client for function invocation
        const functionClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        // Invoke email function with timeout
        const invokeWithTimeout = async (timeout: number = 60000): Promise<InvocationResponse> => {
          const timeoutPromise = new Promise<InvocationResponse>((_, reject) => {
            setTimeout(() => reject(new Error('Email function timeout')), timeout);
          });

          const invokePromise = functionClient.functions.invoke(
            'send-ticket-email',
            { body: email.payload }
          ) as Promise<InvocationResponse>;

          return Promise.race([invokePromise, timeoutPromise]);
        };

        const emailResult = await invokeWithTimeout(60000);

        if (emailResult.error) {
          throw emailResult.error;
        }

        console.log(`Email ID ${email.id} sent successfully:`, emailResult.data?.emailId);

        // Mark as sent
        await supabase
          .from('EMAIL_QUEUE')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            external_id: emailResult.data?.emailId || null,
            error_message: null
          })
          .eq('id', email.id);

        results.succeeded++;

      } catch (error) {
        console.error(`Error sending email ID ${email.id}:`, error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const newRetryCount = email.retry_count + 1;

        // Update retry count and status
        if (newRetryCount >= email.max_retries) {
          // Max retries exceeded - mark as failed
          console.error(`Email ID ${email.id} exceeded max retries`);
          
          await supabase
            .from('EMAIL_QUEUE')
            .update({
              status: 'failed',
              retry_count: newRetryCount,
              error_message: errorMessage,
              last_attempt_at: new Date().toISOString()
            })
            .eq('id', email.id);

          results.failed++;
        } else {
          // Schedule retry with exponential backoff
          const backoffMinutes = Math.pow(2, newRetryCount); // 2, 4, 8 minutes
          const scheduledFor = new Date(Date.now() + backoffMinutes * 60 * 1000);

          console.log(`Scheduling retry ${newRetryCount} for email ID ${email.id} at ${scheduledFor.toISOString()}`);

          await supabase
            .from('EMAIL_QUEUE')
            .update({
              status: 'pending',
              retry_count: newRetryCount,
              error_message: errorMessage,
              scheduled_for: scheduledFor.toISOString(),
              last_attempt_at: new Date().toISOString()
            })
            .eq('id', email.id);
        }

        results.errors.push({
          id: email.id,
          error: errorMessage
        });
      }

      results.processed++;
    }

    console.log('Email queue processing completed:', results);

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Email queue processor error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed. Use POST.'
  }, { status: 405 });
}