// This is the App Router version for Next.js 13+

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// The Supabase client will be created inside the POST function to ensure
// environment variables are available at runtime.

export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables at the start of the function.
    // This ensures they are present before creating the Supabase client.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase environment variables are not set.');
      return NextResponse.json({
        success: false,
        error: 'Supabase configuration error.'
      }, { status: 500 });
    }

    // Initialize Supabase client with service role key for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse the request body
    const body = await request.json();
    const { phone_number, payment_method, user_id, tickets } = body;

    // Input validation
    if (!phone_number || !payment_method || !user_id || !tickets || tickets.length === 0) {
      console.error('Missing required fields:', { phone_number: !!phone_number, payment_method, user_id, tickets: tickets?.length });
      return NextResponse.json({
        success: false,
        transaction_id: '',
        tickets: [],
        error: 'Missing required fields: phone_number, payment_method, user_id, or tickets'
      }, { status: 400 });
    }
    
    // ** FIX: Clean the phone number by removing the country code before sending it to the Edge Function **
    // This regular expression handles both '237' and '+237' prefixes.
    const cleanedPhoneNumber = phone_number.replace(/^\+?237/, '');

    console.log('API Route: Proxying payment request to Supabase Edge Function:', {
      phone_number: cleanedPhoneNumber,
      payment_method,
      user_id,
      tickets_count: tickets.length
    });

    // Call the Supabase edge function
    // Pass the cleaned phone number in the body
    const { data, error } = await supabase.functions.invoke('initiate-payment', {
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
        transaction_id: '',
        tickets: [],
        error: error.message || 'Edge function error'
      }, { status: 500 });
    }

    console.log('API Route: Edge function success:', data);

    // Ensure the response has the expected structure
    if (!data) {
      return NextResponse.json({
        success: false,
        transaction_id: '',
        tickets: [],
        error: 'No data returned from payment service'
      }, { status: 500 });
    }

    // Return the response from the edge function
    return NextResponse.json(data);

  } catch (error) {
    console.error('API Route Error:', error);
    
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      success: false,
      transaction_id: '',
      tickets: [],
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
// the old version with key that works


// import { NextRequest, NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js';


// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY! 
// );

// export async function POST(request: NextRequest) {
//   try {

//     const body = await request.json();
//     const { phone_number, payment_method, user_id, tickets } = body;

//     // Input validation
//     if (!phone_number || !payment_method || !user_id || !tickets || tickets.length === 0) {
//       console.error('Missing required fields:', { phone_number: !!phone_number, payment_method, user_id, tickets: tickets?.length });
//       return NextResponse.json({
//         success: false,
//         transaction_id: '',
//         tickets: [],
//         error: 'Missing required fields: phone_number, payment_method, user_id, or tickets'
//       }, { status: 400 });
//     }
    

//     const cleanedPhoneNumber = phone_number.replace(/^\+?237/, '');

//     console.log('API Route: Proxying payment request to Supabase Edge Function:', {
//       phone_number: cleanedPhoneNumber,
//       payment_method,
//       user_id,
//       tickets_count: tickets.length
//     });

    
//     const { data, error } = await supabase.functions.invoke('initiate-payment', {
//       body: {
//         phone_number: cleanedPhoneNumber,
//         payment_method,
//         user_id,
//         tickets
//       }
//     });

//     if (error) {
//       console.error('Supabase Edge Function Error:', error);
//       return NextResponse.json({
//         success: false,
//         transaction_id: '',
//         tickets: [],
//         error: error.message || 'Edge function error'
//       }, { status: 500 });
//     }

//     console.log('API Route: Edge function success:', data);


//     if (!data) {
//       return NextResponse.json({
//         success: false,
//         transaction_id: '',
//         tickets: [],
//         error: 'No data returned from payment service'
//       }, { status: 500 });
//     }


//     return NextResponse.json(data);

//   } catch (error) {
//     console.error('API Route Error:', error);
    
//     let errorMessage = 'Internal server error';
//     if (error instanceof Error) {
//       errorMessage = error.message;
//     }
    
//     return NextResponse.json({
//       success: false,
//       transaction_id: '',
//       tickets: [],
//       error: errorMessage
//     }, { status: 500 });
//   }
// }

// // Handle non-POST requests
// export async function GET() {
//   return NextResponse.json({
//     success: false,
//     error: 'Method not allowed. Use POST.'
//   }, { status: 405 });
// }

// export async function PUT() {
//   return NextResponse.json({
//     success: false,
//     error: 'Method not allowed. Use POST.'
//   }, { status: 405 });
// }

// export async function DELETE() {
//   return NextResponse.json({
//     success: false,
//     error: 'Method not allowed. Use POST.'
//   }, { status: 405 });
// }
