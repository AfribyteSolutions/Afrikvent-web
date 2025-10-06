// initiate-payment-url - Fixed for both MoMo and Mobile Money
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { liveUser, liveKey, liveURL } from "./models.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

console.log("INITIATE PAYMENT CALLED!");

// ✅ Helper to generate unique ticket QR codes
function generateUniqueCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// ✅ Fixed initiatePay function
async function initiatePay({ user, amount }) {
  if (!user) throw new Error("User is Null");

  const url = `${liveURL}/initiate-pay`;
  console.log(`Initiating pay: amount=${amount}, user=${user.user_id}`);

  const headers = {
    apiuser: liveUser,
    apikey: liveKey,
    "Content-Type": "application/json",
  };

  try {
    // 1️⃣ Create payment
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount,
        email: user.email,
        userId: user.user_id,
        externalId: user.user_id,
        message: "Making a payment transaction",
        redirectUrl: "https://afrikvent.com/payment-success",
      }),
    });

    if (!response.ok) {
      console.log(
        `Payment initiation failed: ${response.status} - ${response.statusText}`
      );
      throw new Error("An Error occurred");
    }

    // 2️⃣ Get response from Fapshi
    const responseData = await response.json();
    console.log("Fapshi initiate-pay response:", responseData);

    // 3️⃣ Add redirect with transId if available
    if (responseData.transId) {
      responseData.redirectUrl = `https://afrikvent.com/payment-success?transId=${responseData.transId}`;
    }

    return responseData;
  } catch (e) {
    console.log("ERROR OCCURRED", e);
    throw new Error(e);
  }
}

// ✅ Helper to check if payment method is mobile money
function isMobileMoneyPayment(paymentMethod: string): boolean {
  const normalized = paymentMethod.toLowerCase().trim();
  return (
    normalized.includes("momo") ||
    normalized.includes("mobile money") ||
    normalized.includes("mobile_money")
  );
}

// ✅ Main handler
Deno.serve(async (req) => {
  try {
    const { phone_number, payment_method, user_id, tickets } = await req.json();

    console.log("📥 Payment request received:", {
      payment_method,
      user_id,
      phone_number: phone_number ? "***" + phone_number.slice(-4) : null,
      tickets_count: tickets?.length,
    });

    if (!user_id || !tickets?.length) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body: user_id and tickets are required",
        }),
        { status: 400 }
      );
    }

    // Validate payment method specific requirements
    const isMobileMoney = isMobileMoneyPayment(payment_method || "");
    
    if (isMobileMoney && !phone_number) {
      return new Response(
        JSON.stringify({
          error: "Phone number is required for mobile money payments",
        }),
        { status: 400 }
      );
    }

    // Fetch user details
    console.log("FETCHING USER DETAILS");
    const { data: user, error: userError } = await supabase
      .from("USERS")
      .select("user_id, name, email")
      .eq("user_id", user_id)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      return new Response(
        JSON.stringify({
          error: "User not found",
        }),
        { status: 404 }
      );
    }

    // Fetch ticket type prices
    console.log("FETCHING TICKET TYPES", tickets);
    const ticketIds = tickets.map((t) => t.ticket_id);
    const { data: ticketTypes, error: ticketTypeError } = await supabase
      .from("TICKET_TYPES")
      .select("id, event_id, price")
      .in("id", ticketIds);

    if (ticketTypeError || !ticketTypes?.length) {
      console.error("Ticket types fetch error:", ticketTypeError);
      return new Response(
        JSON.stringify({
          error: "Invalid ticket types",
        }),
        { status: 400 }
      );
    }

    let totalAmount = 0;
    const ticketInserts = [];

    for (const t of tickets) {
      const ticketType = ticketTypes.find((tt) => tt.id === t.ticket_id);
      if (!ticketType) continue;

      const unitPrice = ticketType.price ?? 0;
      const qty = t.quantity ?? 1;
      const subtotal = unitPrice * qty;
      totalAmount += subtotal;

      ticketInserts.push({
        user_id,
        event_id: ticketType.event_id,
        ticket_type_id: ticketType.id,
        quantity: `${qty}`,
        unit_price: unitPrice,
        total: subtotal,
        qr_code_data: generateUniqueCode(),
        ticket_status: "pending",
      });
    }

    if (totalAmount <= 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid total amount",
        }),
        { status: 400 }
      );
    }

    console.log("TOTAL AMOUNT:", totalAmount);

    // ✅ FIXED: Call Fapshi for mobile money payments
    let paymentResponse = null;
    
    if (isMobileMoney) {
      console.log("🏦 Initiating mobile money payment via Fapshi");
      try {
        paymentResponse = await initiatePay({
          user,
          amount: totalAmount,
        });
        console.log("✅ Fapshi response received:", paymentResponse);
      } catch (error) {
        console.error("❌ Fapshi payment initiation failed:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to initiate mobile money payment. Please try again.",
          }),
          { status: 500 }
        );
      }
    } else {
      console.log("💳 Non-mobile money payment - skipping Fapshi");
    }

    // Insert payment record
    console.log("RECORDING PAYMENT");
    const { data: paymentRecord, error: paymentInsertError } = await supabase
      .from("PAYMENTS")
      .insert({
        user_id,
        amount: totalAmount,
        payment_method,
        mobile_number: phone_number || null,
        payment_status: "pending",
        provider_response: paymentResponse,
        transaction_id: paymentResponse?.transId || null,
        mobile_money_provider: isMobileMoney ? payment_method : null,
        currency: "XAF",
      })
      .select()
      .single();

    console.log("💾 Payment insert result:", {
      paymentRecord,
      paymentInsertError,
    });

    if (paymentInsertError || !paymentRecord) {
      console.error("Payment insert error:", paymentInsertError);
      return new Response(
        JSON.stringify({
          error: "Failed to record payment",
        }),
        { status: 500 }
      );
    }

    // Insert tickets
    console.log("INSERTING TICKETS");
    const { data: insertedTickets, error: ticketInsertError } = await supabase
      .from("TICKETS")
      .insert(ticketInserts)
      .select();

    if (ticketInsertError || !insertedTickets?.length) {
      console.error("Ticket insert error:", ticketInsertError);
      return new Response(
        JSON.stringify({
          error: "Failed to insert tickets",
        }),
        { status: 500 }
      );
    }

    // Link tickets to payment
    const paymentTicketLinks = insertedTickets.map((t) => ({
      payment_id: paymentRecord.id,
      ticket_id: t.id,
    }));

    console.log("LINKING TICKETS TO PAYMENT");
    const { error: paymentTicketError } = await supabase
      .from("PAYMENT_TICKETS")
      .insert(paymentTicketLinks);

    if (paymentTicketError) {
      console.error("ERROR LINKING TICKETS TO PAYMENT:", paymentTicketError);
      return new Response(
        JSON.stringify({
          error: "Failed to link payment to tickets",
        }),
        { status: 500 }
      );
    }

    // ✅ Return appropriate response based on payment method
    const responseData = {
      message: "Payment initiated successfully",
      amount: totalAmount,
      payment: paymentRecord,
      tickets: insertedTickets,
      checkout_url: paymentResponse?.link || null,
    };

    console.log("✅ Payment initiated successfully:", {
      payment_id: paymentRecord.id,
      amount: totalAmount,
      tickets_count: insertedTickets.length,
      has_checkout_url: !!responseData.checkout_url,
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error in initiate-payment:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: err.message,
      }),
      { status: 500 }
    );
  }
});