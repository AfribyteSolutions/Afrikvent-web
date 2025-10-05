// app/api/initiate-stripe-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase environment variables are not set.');
      return NextResponse.json({
        success: false,
        error: 'Supabase configuration error.'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const body = await request.json();

    const { customer_email, user_id, tickets } = body;

    if (!customer_email || !user_id || !tickets || tickets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: customer_email, user_id, or tickets'
      }, { status: 400 });
    }

    console.log('Initiating Stripe payment:', {
      customer_email,
      user_id,
      tickets_count: tickets.length
    });

    // Use the environment variable or fallback to production URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://afrikvent.com';
    
    console.log('Using base URL:', baseUrl);

    const edgeFunctionPayload = {
      return_url: baseUrl, // Edge function will append /payment-success
      customer_email,
      user_id,
      tickets
    };

    console.log('Calling edge function with payload:', {
      return_url: baseUrl,
      customer_email,
      user_id,
      tickets_count: tickets.length
    });

    // Call the edge function (name without 'e': initiate-strip-payment)
    const { data, error } = await supabase.functions.invoke('initiate-strip-payment', {
      body: edgeFunctionPayload
    });

    if (error) {
      console.error('Edge function error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to create payment session'
      }, { status: 500 });
    }

    if (!data) {
      console.error('No data returned from edge function');
      return NextResponse.json({
        success: false,
        error: 'No response from payment service'
      }, { status: 500 });
    }

    console.log('Stripe session created successfully:', {
      session_id: data.session_id,
      payment_id: data.payment_id,
      amount: data.amount
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST.'
  }, { status: 405 });
}