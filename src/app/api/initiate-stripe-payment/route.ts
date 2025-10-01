// app/api/initiate-stripe-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment variables check:', {
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      supabaseServiceRoleKey: supabaseServiceRoleKey ? 'SET' : 'MISSING'
    });

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase environment variables are not set.');
      return NextResponse.json({
        success: false,
        error: 'Supabase configuration error.'
      }, { status: 500 });
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse the request body
    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));

    const { return_url, customer_email, user_id, tickets } = body;

    // Input validation
    if (!customer_email || !user_id || !tickets || tickets.length === 0) {
      console.error('Missing required fields:', {
        customer_email: !!customer_email,
        user_id,
        tickets: tickets?.length
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: customer_email, user_id, or tickets'
      }, { status: 400 });
    }

    console.log('API Route: Proxying Stripe payment request to Supabase Edge Function:', {
      customer_email,
      user_id,
      tickets_count: tickets.length,
      return_url
    });

    const edgeFunctionPayload = {
      return_url: return_url || `${process.env.NEXT_PUBLIC_APP_URL || 'https://afrikvent.com'}/payment-success`,
      customer_email,
      user_id,
      tickets
    };

    console.log('About to call edge function with:', JSON.stringify(edgeFunctionPayload, null, 2));

    // Call the Supabase edge function (fixed function name)
    const { data, error } = await supabase.functions.invoke('initiate-strip-payment', {
      body: edgeFunctionPayload
    });

    if (error) {
      console.error('Supabase Edge Function Error - Full Details:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error context:', error.context);
      return NextResponse.json({
        success: false,
        error: error.message || 'Edge function error',
        details: error
      }, { status: 500 });
    }

    console.log('API Route: Stripe Edge function success:', JSON.stringify(data, null, 2));

    // Ensure the response has the expected structure
    if (!data) {
      console.error('No data returned from edge function');
      return NextResponse.json({
        success: false,
        error: 'No data returned from Stripe payment service'
      }, { status: 500 });
    }

    // Return the response from the edge function
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Route Error - Caught Exception:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Handle non-POST requests
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST.'
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST.'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST.'
  }, { status: 405 });
}