'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PaymentSuccessScreen from '@/components/checkout/PaymentSuccessScreen';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { EnhancedTicket } from '@/types/ticket';

interface TicketData {
  id: number;
  event_id: number;
  user_id: string;
  ticket_type_id: number;
  quantity: string;
  total: number;
  unit_price: number;
  qr_code_data: string;
  ticket_status: string;
  created_at: string;
  EVENTS: {
    id: number;
    title: string;
    event_date: string;
    location_name?: string;
    address?: string;
    images?: string[];
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
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    console.log('Payment Success Page - Session ID:', sessionId);
    
    if (!sessionId) {
      console.error('No session_id in URL');
      setError('No session ID found');
      setIsLoading(false);
      return;
    }

    let retries = 0;
    const maxRetries = 25;
    let timeoutId: NodeJS.Timeout;

    const checkPayment = async () => {
      try {
        setAttempt(retries + 1);
        
        console.log(`Attempt ${retries + 1}: Verifying payment for session:`, sessionId);
        
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });

        console.log('Response status:', res.status);
        console.log('Response Content-Type:', res.headers.get('content-type'));

        if (!res.ok) {
          console.error('API response not OK:', res.status, res.statusText);
          throw new Error(`API returned ${res.status}`);
        }

        // Get the raw text first to debug
        const rawText = await res.text();
        console.log('Raw response (first 200 chars):', rawText.substring(0, 200));

        // Parse the JSON
        let data;
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          console.error('Full raw response:', rawText);
          throw new Error('Invalid JSON response from server');
        }
        
        console.log('API Response:', {
          success: data?.success,
          status: data?.status,
          hasTickets: !!data?.tickets,
          ticketsIsArray: Array.isArray(data?.tickets),
          ticketsLength: data?.tickets?.length,
          ticketsType: typeof data?.tickets,
          firstTicket: data?.tickets?.[0]
        });

        // Check if we have a successful response with tickets
        if (data.success === true && data.tickets && Array.isArray(data.tickets) && data.tickets.length > 0) {
          console.log('SUCCESS! Transforming tickets:', data.tickets.length);
          
          // Transform tickets
          const transformed: EnhancedTicket[] = data.tickets.map((t: TicketData) => {
            console.log('Transforming ticket:', t.id, t.EVENTS?.title);
            return {
              id: t.id.toString(),
              eventId: t.event_id.toString(),
              eventTitle: t.EVENTS?.title || 'Event',
              eventDate: t.EVENTS?.event_date || new Date().toISOString(),
              eventLocation: t.EVENTS?.location_name || t.EVENTS?.address || 'Location',
              ticketType: t.TICKET_TYPES?.name || 'Ticket',
              quantity: parseInt(t.quantity) || 1,
              totalPrice: t.total || 0,
              purchaseDate: t.created_at,
              status: 'confirmed',
              userId: t.user_id,
              qrCode: t.qr_code_data,
              orderId: data.payment?.id?.toString() || 'N/A',
              ticketStatus: 'active'
            };
          });
          
          console.log('Transformed tickets:', transformed);
          setTickets(transformed);
          setIsLoading(false);
          return;
        }

        // Check for specific error statuses
        if (data.status === 'not_found') {
          console.log('Payment not found yet, will retry...');
        } else if (data.status === 'pending') {
          console.log('Payment is pending, will retry...');
        } else if (data.status === 'no_tickets') {
          console.log('No tickets found yet, will retry...');
        } else if (data.status === 'failed') {
          console.error('Payment failed:', data.payment_status);
          setError('Payment was not successful. Please contact support.');
          setIsLoading(false);
          return;
        } else {
          console.log('Unexpected status:', data.status);
        }

        // Retry if not at max attempts
        if (retries < maxRetries) {
          retries++;
          console.log(`Will retry in 2 seconds... (${retries}/${maxRetries})`);
          timeoutId = setTimeout(checkPayment, 2000);
        } else {
          console.error('Max retries reached');
          setError('Payment is processing. Please check "My Tickets" in a moment.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error in checkPayment:', err);
        
        if (retries < maxRetries) {
          retries++;
          console.log(`Error occurred, will retry... (${retries}/${maxRetries})`);
          timeoutId = setTimeout(checkPayment, 2000);
        } else {
          console.error('Max retries reached after error');
          setError('Unable to verify payment. Please check "My Tickets" or contact support.');
          setIsLoading(false);
        }
      }
    };

    checkPayment();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-12 text-center"
        >
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Verifying Payment
          </h1>
          <p className="text-gray-600">Please wait while we confirm your purchase...</p>
          {attempt > 3 && (
            <p className="text-sm text-gray-500 mt-4">
              This is taking longer than usual. Attempt {attempt} of 25.
            </p>
          )}
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
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Payment Processing
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/my-tickets')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View My Tickets
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (tickets.length === 0) {
    console.error('Reached end of flow with no tickets and no error');
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-50 to-orange-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-12 text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Payment Issue
          </h1>
          <p className="text-gray-600 mb-6">
            Tickets not found. Please contact support.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/my-tickets')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View My Tickets
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <PaymentSuccessScreen
      isOpen={true}
      tickets={tickets}
      eventTitle={tickets[0]?.eventTitle || 'Event'}
      eventDate={tickets[0]?.eventDate || new Date().toISOString()}
      eventLocation={tickets[0]?.eventLocation || 'Location'}
      onClose={() => router.push('/')}
    />
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 z-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}