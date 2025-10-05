'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PaymentSuccessScreen from '@/components/checkout/PaymentSuccessScreen';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { EnhancedTicket } from '@/types/ticket';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for client-side use
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PaymentTicket {
  ticket_id: number;
}

interface TicketData {
  id: number;
  event_id: number;
  user_id: string;
  ticket_type_id: number;
  quantity: string;
  total: number;
  qr_code_data: string;
  ticket_status: string;
  created_at: string;
  EVENTS: {
    id: number;
    title: string;
    event_date: string;
    location: string;
    image_url?: string;
  };
  TICKET_TYPES: {
    id: number;
    name: string;
    price: number;
  };
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<EnhancedTicket[]>([]);
  const [eventDetails, setEventDetails] = useState({
    title: 'Your Event',
    date: new Date().toISOString(),
    location: 'Location TBA'
  });

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('No session ID found');
      setIsLoading(false);
      return;
    }

    fetchPaymentAndTickets(sessionId);
  }, [searchParams]);

  const fetchPaymentAndTickets = async (sessionId: string) => {
    try {
      // 1. Find the payment record by transaction_id (which is the Stripe session_id)
      const { data: payment, error: paymentError } = await supabase
        .from('PAYMENTS')
        .select('*')
        .eq('transaction_id', sessionId)
        .single();

      if (paymentError || !payment) {
        console.error('Payment not found:', paymentError);
        setError('Payment record not found. Please contact support.');
        setIsLoading(false);
        return;
      }

      // Check if payment is successful
      if (payment.payment_status !== 'SUCCESSFUL' && payment.payment_status !== 'successful') {
        console.log('Payment status:', payment.payment_status);
        setError('Payment is still being processed. Please refresh in a moment.');
        setIsLoading(false);
        return;
      }

      // 2. Get ticket IDs from PAYMENT_TICKETS junction table
      const { data: paymentTickets, error: paymentTicketsError } = await supabase
        .from('PAYMENT_TICKETS')
        .select('ticket_id')
        .eq('payment_id', payment.id);

      if (paymentTicketsError || !paymentTickets?.length) {
        console.error('Tickets not found:', paymentTicketsError);
        setError('Tickets not found. Please contact support.');
        setIsLoading(false);
        return;
      }

      const ticketIds = paymentTickets.map((pt: PaymentTicket) => pt.ticket_id);

      // 3. Fetch full ticket details with event information
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('TICKETS')
        .select(`
          *,
          EVENTS!inner(
            id,
            title,
            event_date,
            location,
            image_url
          ),
          TICKET_TYPES!inner(
            id,
            name,
            price
          )
        `)
        .in('id', ticketIds);

      if (ticketsError || !ticketsData?.length) {
        console.error('Error fetching ticket details:', ticketsError);
        setError('Could not load ticket details. Please contact support.');
        setIsLoading(false);
        return;
      }

      // 4. Transform the data to match EnhancedTicket interface
      const enhancedTickets: EnhancedTicket[] = (ticketsData as TicketData[]).map((ticket: TicketData) => {
        // Map database ticket_status to the expected ticketStatus values
        const normalizedStatus = ticket.ticket_status.toLowerCase();
        const ticketStatus: "active" | "expired" = 
          (normalizedStatus === 'successful' || normalizedStatus === 'active' || normalizedStatus === 'pending') 
            ? 'active' 
            : 'expired';

        return {
          id: ticket.id.toString(),
          eventId: ticket.event_id.toString(),
          eventTitle: ticket.EVENTS.title,
          eventDate: ticket.EVENTS.event_date,
          eventLocation: ticket.EVENTS.location,
          ticketType: ticket.TICKET_TYPES.name,
          quantity: parseInt(ticket.quantity) || 1,
          totalPrice: ticket.total,
          purchaseDate: ticket.created_at,
          status: (normalizedStatus === 'successful' || normalizedStatus === 'active') ? 'confirmed' : 'pending',
          userId: ticket.user_id,
          qrCode: ticket.qr_code_data,
          orderId: payment.id.toString(),
          ticketStatus: ticketStatus
        };
      });

      // Set event details from the first ticket
      if (enhancedTickets.length > 0) {
        const firstTicket = enhancedTickets[0];
        setEventDetails({
          title: firstTicket.eventTitle,
          date: firstTicket.eventDate,
          location: firstTicket.eventLocation
        });
      }

      setTickets(enhancedTickets);
      setIsLoading(false);

    } catch (err) {
      console.error('Error in fetchPaymentAndTickets:', err);
      setError('An unexpected error occurred. Please contact support.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-12 text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifying Payment
          </h1>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-50 to-orange-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-12 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Issue
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <PaymentSuccessScreen
      isOpen={true}
      tickets={tickets}
      eventTitle={eventDetails.title}
      eventDate={eventDetails.date}
      eventLocation={eventDetails.location}
      onClose={() => router.push('/')}
    />
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}