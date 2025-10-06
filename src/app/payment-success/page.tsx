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
    const momoRef = searchParams.get('momo_ref'); // new
    const provider = searchParams.get('provider'); // new e.g. "momo" or "stripe"

    console.log('✅ Payment Success Page - Params:', { sessionId, momoRef, provider });

    if (!sessionId && !momoRef) {
      setError('Missing payment reference.');
      setIsLoading(false);
      return;
    }

    const isMomo = provider === 'momo' || (!!momoRef && !sessionId);
    const verifyUrl = isMomo ? '/api/verify-momo' : '/api/verify-payment';

    let retries = 0;
    const maxRetries = 25;
    let timeoutId: NodeJS.Timeout;

    const checkPayment = async () => {
      try {
        setAttempt(retries + 1);
        const body = isMomo
          ? { momo_ref: momoRef }
          : { session_id: sessionId };

        console.log(`🔎 Attempt ${retries + 1}: Verifying via ${verifyUrl}`, body);

        const res = await fetch(verifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const rawText = await res.text();
        let data;
        try {
          data = JSON.parse(rawText);
        } catch (err) {
          console.error('JSON parse error:', rawText);
          throw new Error('Invalid JSON from verification API.');
        }

        console.log('API verification response:', data);

        if (data.success === true && Array.isArray(data.tickets) && data.tickets.length > 0) {
          const transformed: EnhancedTicket[] = data.tickets.map((t: TicketData) => ({
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
            orderId: data.payment?.id?.toString() || momoRef || sessionId || 'N/A',
            ticketStatus: 'active',
          }));

          setTickets(transformed);
          setIsLoading(false);
          return;
        }

        if (['not_found', 'pending', 'no_tickets'].includes(data.status)) {
          console.log('⏳ Payment still processing, retrying...');
        } else if (data.status === 'failed') {
          setError('Payment failed. Please contact support.');
          setIsLoading(false);
          return;
        }

        if (retries < maxRetries) {
          retries++;
          timeoutId = setTimeout(checkPayment, 2000);
        } else {
          setError('Payment is still processing. Check "My Tickets" later.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Verification error:', err);
        if (retries < maxRetries) {
          retries++;
          timeoutId = setTimeout(checkPayment, 2000);
        } else {
          setError('Unable to verify payment. Check "My Tickets" or contact support.');
          setIsLoading(false);
        }
      }
    };

    checkPayment();
    return () => timeoutId && clearTimeout(timeoutId);
  }, [searchParams]);

  // Loading UI
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
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Verifying Payment</h1>
          <p className="text-gray-600">Please wait while we confirm your purchase...</p>
          {attempt > 3 && (
            <p className="text-sm text-gray-500 mt-4">Attempt {attempt} of 25</p>
          )}
        </motion.div>
      </div>
    );
  }

  // Error UI
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
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Issue</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/events')}
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
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment Issue</h1>
          <p className="text-gray-600 mb-6">Tickets not found. Please contact support.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/events')}
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

  // Success UI
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
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 z-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
