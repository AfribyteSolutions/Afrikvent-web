import { createClient } from "@supabase/supabase-js";

const liveUser = process.env.FAPSHI_API_USER || "";
const liveKey = process.env.FAPSHI_API_KEY || "";
const liveURL = process.env.FAPSHI_API_URL || "https://api.fapshi.com";

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(supabaseUrl, supabaseKey);
}

function generateUniqueCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 6 }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
}

interface User {
  user_id: string;
  name: string;
  email: string;
}

interface FapshiResponse {
  transId?: string;
  link?: string;
  redirectUrl?: string;
  [key: string]: unknown;
}

interface TicketRequest {
  ticket_id: string;
  quantity?: number;
}

interface TicketType {
  id: string;
  event_id: string;
  price: number;
}

interface TicketInsert {
  user_id: string;
  event_id: string;
  ticket_type_id: string;
  quantity: string;
  unit_price: number;
  total: number;
  qr_code_data: string;
  ticket_status: string;
}

async function initiatePay({
  user,
  amount,
}: {
  user: User;
  amount: number;
}): Promise<FapshiResponse> {
  const url = `${liveURL}/initiate-pay`;
  const headers = {
    apiuser: liveUser,
    apikey: liveKey,
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    amount,
    email: user.email,
    userId: user.user_id,
    externalId: user.user_id,
    message: "Making a payment transaction",
    redirectUrl: "https://afrikvent.com/payment-success",
  });

  const response = await fetch(url, { method: "POST", headers, body });

  if (!response.ok) throw new Error(`Fapshi API error: ${response.statusText}`);

  const data = (await response.json()) as FapshiResponse;
  if (data.transId) {
    data.redirectUrl = `https://afrikvent.com/payment-success?transId=${data.transId}`;
  }

  return data;
}

function isMobileMoneyPayment(paymentMethod: string): boolean {
  const normalized = paymentMethod?.toLowerCase() || "";
  return (
    normalized.includes("momo") ||
    normalized.includes("mobile money") ||
    normalized.includes("mobile_money")
  );
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      phone_number?: string;
      payment_method?: string;
      user_id?: string;
      tickets?: TicketRequest[];
    };

    const { phone_number, payment_method, user_id, tickets } = body;

    if (!user_id || !tickets?.length) {
      return new Response(
        JSON.stringify({ error: "user_id and tickets are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from("USERS")
      .select("user_id, name, email")
      .eq("user_id", user_id)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ticketIds = tickets.map((t) => t.ticket_id);
    const { data: ticketTypes, error: ticketError } = await supabase
      .from("TICKET_TYPES")
      .select("id, event_id, price")
      .in("id", ticketIds);

    if (ticketError || !ticketTypes?.length) {
      return new Response(JSON.stringify({ error: "Invalid ticket types" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let totalAmount = 0;
    const ticketInserts: TicketInsert[] = tickets
      .map((t): TicketInsert | null => {
        const ticketType = (ticketTypes as TicketType[]).find((tt) => tt.id === t.ticket_id);
        if (!ticketType) return null;

        const qty = t.quantity ?? 1;
        const total = (ticketType.price ?? 0) * qty;
        totalAmount += total;

        return {
          user_id,
          event_id: ticketType.event_id,
          ticket_type_id: ticketType.id,
          quantity: `${qty}`,
          unit_price: ticketType.price,
          total,
          qr_code_data: generateUniqueCode(),
          ticket_status: "pending",
        };
      })
      .filter((t): t is TicketInsert => t !== null);

    if (totalAmount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid total amount" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let paymentResponse: FapshiResponse | null = null;

    if (isMobileMoneyPayment(payment_method || "")) {
      if (!phone_number) {
        return new Response(
          JSON.stringify({ error: "Phone number required for mobile money" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      paymentResponse = await initiatePay({ user, amount: totalAmount });
    }

    const { data: paymentRecord, error: paymentError } = await supabase
      .from("PAYMENTS")
      .insert({
        user_id,
        amount: totalAmount,
        payment_method,
        mobile_number: phone_number || null,
        payment_status: "pending",
        provider_response: paymentResponse,
        transaction_id: paymentResponse?.transId || null,
        mobile_money_provider: isMobileMoneyPayment(payment_method || "")
          ? payment_method
          : null,
        currency: "XAF",
      })
      .select()
      .single();

    if (paymentError || !paymentRecord) {
      throw new Error("Failed to record payment");
    }

    const { data: insertedTickets, error: ticketInsertError } = await supabase
      .from("TICKETS")
      .insert(ticketInserts)
      .select();

    if (ticketInsertError || !insertedTickets?.length) {
      throw new Error("Failed to insert tickets");
    }

    const links = insertedTickets.map((t) => ({
      payment_id: paymentRecord.id,
      ticket_id: t.id,
    }));

    const { error: linkError } = await supabase.from("PAYMENT_TICKETS").insert(links);
    if (linkError) throw new Error("Failed to link tickets to payment");

    return new Response(
      JSON.stringify({
        message: "Payment initiated successfully",
        amount: totalAmount,
        payment: paymentRecord,
        tickets: insertedTickets,
        checkout_url: paymentResponse?.link || null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ initiate-payment-url error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
