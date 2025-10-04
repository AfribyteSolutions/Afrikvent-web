// app/api/initiate-payment-url/route.ts
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
    const { phone_number, payment_method, user_id, tickets } = body;

    // Input validation
    if (!phone_number || !payment_method || !user_id || !tickets || tickets.length === 0) {
      console.error('Missing required fields:', {
        phone_number: !!phone_number,
        payment_method,
        user_id,
        tickets: tickets?.length
      });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: phone_number, payment_method, user_id, or tickets'
      }, { status: 400 });
    }

    // Clean the phone number by removing country code
    const cleanedPhoneNumber = phone_number.replace(/^\+?237/, '');

    console.log('API Route: Calling initiate-payment-url Edge Function:', {
      phone_number: cleanedPhoneNumber,
      payment_method,
      user_id,
      tickets_count: tickets.length
    });

    // Call the initiate-payment-url edge function
    const { data, error } = await supabase.functions.invoke('initiate-payment-url', {
      body: {
        phone_number: cleanedPhoneNumber,
        payment_method,
        user_id,
        tickets
      }
    });

    if (error) {
      console.error('Supabase Edge Function Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Edge function error'
      }, { status: 500 });
    }

    console.log('API Route: Edge function success:', data);

    // Parse data if it's a string
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
        console.log('Parsed string data:', parsedData);
      } catch (parseError) {
        console.error('Failed to parse data:', parseError);
        return NextResponse.json({
          success: false,
          error: 'Invalid response format from edge function'
        }, { status: 500 });
      }
    }

    // Validate response has checkout_url
    if (!parsedData || !parsedData.checkout_url) {
      console.error('No checkout_url in response:', parsedData);
      return NextResponse.json({
        success: false,
        error: 'No checkout URL returned from payment service'
      }, { status: 500 });
    }

    // CRITICAL: Return the parsed data with explicit properties
    const response = {
      success: true,
      checkout_url: parsedData.checkout_url,
      transaction_id: parsedData.payment?.transaction_id || null,
      amount: parsedData.amount || null,
      message: parsedData.message || 'Payment initiated successfully'
    };

    console.log('API Route: Returning response to frontend:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('API Route Error:', error);
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
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