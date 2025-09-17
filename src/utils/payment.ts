// src/utils/payment.ts
import { createClient } from '@supabase/supabase-js';
import { getRandomTemplateId } from '@/config/ticketTemplates';
import { PaymentResult } from '@/types/ticket';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface PaymentTicketInput {
  ticket_id: number;
  quantity: number;
}

export async function buyTicket(
  userId: string, 
  phone: string, 
  tickets: PaymentTicketInput[]
): Promise<PaymentResult> {
  try {
    // Input validation
    if (!userId || !phone || !tickets || tickets.length === 0) {
      return {
        success: false,
        transaction_id: '',
        tickets: []
      };
    }

    // Validate phone number format (Ghana format)
    const phoneRegex = /^(\+233|0)[2-9]\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return {
        success: false,
        transaction_id: '',
        tickets: []
      };
    }

    // ✅ Step 1: Assign a random template to each ticket
    const ticketsWithTemplate = tickets.map(ticket => ({
      ...ticket,
      template: getRandomTemplateId(),
    }));

    // ✅ Step 2: Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('initiate-pay', {
      body: {
        phone_number: phone,
        payment_method: "mobile_money",
        user_id: userId,
        tickets: ticketsWithTemplate,
      },
    });

    if (error) {
      console.error('Supabase function error:', error);
      return {
        success: false,
        transaction_id: '',
        tickets: []
      };
    }

    if (!data) {
      return {
        success: false,
        transaction_id: '',
        tickets: []
      };
    }

    // ✅ Step 3: Return payment result matching your PaymentResult interface
    return {
      success: true,
      transaction_id: data.transaction_id || data.payment_id || `TXN-${Date.now()}`,
      qr_string: data.qr_string,
      orderId: data.order_id || data.payment_id,
      tickets: ticketsWithTemplate.map(ticket => ({
        ticket_id: ticket.ticket_id,
        quantity: ticket.quantity,
        template: ticket.template,
        ticketType: data.ticket_type || 'General Admission',
        price: data.price || 0
      })),
      eventData: {
        id: data.event_id || tickets[0].ticket_id.toString(),
        title: data.event_title || 'Event',
        date: data.event_date || new Date().toISOString(),
        location: data.event_location || 'Location TBD'
      }
    };

  } catch (error) {
    console.error('Payment error:', error);
    
    return {
      success: false,
      transaction_id: '',
      tickets: []
    };
  }
}

// Helper function to generate QR code data
export function generateQRCodeData(paymentId: string, ticketId: number, userId: string): string {
  const timestamp = Date.now();
  return `TICKET:${paymentId}:${ticketId}:${userId}:${timestamp}`;
}

// Helper function to validate payment status
export async function checkPaymentStatus(paymentId: string): Promise<{
  status: 'pending' | 'successful' | 'failed';
  message?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('check-payment-status', {
      body: { payment_id: paymentId }
    });

    if (error) throw error;

    return {
      status: data?.status || 'failed',
      message: data?.message
    };
  } catch (error) {
    console.error('Status check error:', error);
    return {
      status: 'failed',
      message: 'Could not check payment status'
    };
  }
}