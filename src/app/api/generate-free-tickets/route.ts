// app/api/generate-free-tickets/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    });
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { user_id, event_id, ticket_type_id, quantity, discount_code } = body;

    if (!user_id || !event_id || !ticket_type_id || !quantity || !discount_code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Validate discount code
    const { data: discount, error: discountError } = await supabase
      .from('DISCOUNT_CODES')
      .select('*')
      .eq('code', discount_code.toUpperCase())
      .eq('event_id', event_id)
      .eq('is_active', true)
      .single();

    if (discountError || !discount) {
      return NextResponse.json(
        { error: "Invalid discount code" },
        { status: 400 }
      );
    }

    // Check if discount is for 100% free tickets (free type or 100% percentage)
    const isFreeTicket = discount.discount_type === 'free';
    const is100PercentOff = discount.discount_type === 'percentage' && discount.discount_value === 100;

    if (!isFreeTicket && !is100PercentOff) {
      return NextResponse.json(
        { error: "This discount code requires payment. Please use the payment options below." },
        { status: 400 }
      );
    }

    // Check usage limit
    if (discount.max_uses && discount.current_uses >= discount.max_uses) {
      return NextResponse.json(
        { error: "Discount code has reached its usage limit" },
        { status: 400 }
      );
    }

    // Generate tickets
    const ticketsToGenerate = [];
    for (let i = 0; i < quantity; i++) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const qrCode = `${event_id}-${user_id}-FREE-${timestamp}-${randomStr}`;

      ticketsToGenerate.push({
        user_id,
        event_id,
        ticket_type_id,
        qr_code_data: qrCode,
        quantity: '1',
        unit_price: 0,
        total: 0,
        ticket_status: 'valid',
        created_at: new Date().toISOString(),
      });
    }

    // Insert tickets using service role (bypasses RLS)
    const { data: insertedTickets, error: insertError } = await supabase
      .from('TICKETS')
      .insert(ticketsToGenerate)
      .select();

    if (insertError) {
      console.error('Error inserting tickets:', insertError);
      return NextResponse.json(
        { error: `Failed to generate tickets: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Increment discount code usage
    const { error: incrementError } = await supabase
      .from('DISCOUNT_CODES')
      .update({ current_uses: discount.current_uses + 1 })
      .eq('id', discount.id);

    if (incrementError) {
      console.error('Error incrementing discount usage:', incrementError);
      // Don't fail the request - tickets are already created
    }

    // Update ticket type quantity
    const { data: ticketType } = await supabase
      .from('TICKET_TYPES')
      .select('max_quatity')
      .eq('id', ticket_type_id)
      .single();

    if (ticketType) {
      const newQuantity = Math.max(0, (ticketType.max_quatity || 0) - quantity);
      await supabase
        .from('TICKET_TYPES')
        .update({ max_quatity: newQuantity })
        .eq('id', ticket_type_id);
    }

    return NextResponse.json({
      success: true,
      tickets: insertedTickets,
    });

  } catch (error) {
    console.error('Error in generate-free-tickets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}