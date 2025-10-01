// app/payment-success/page.tsx
'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PaymentSuccessScreen from '@/components/checkout/PaymentSuccessScreen';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { EnhancedTicket } from '@/types/ticket';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<EnhancedTicket[]>([]);
  const [eventDetails, setEventDetails] = useState({
    title: 'Your Event',
    date: new Date().toISOString(),
    location: 'Location TBA'
  });

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      // No session ID, redirect to home
      router.push('/');
      return;
    }

    // Simulate fetching ticket details
    // In production, you'd fetch the actual tickets from your database using the session_id
    const fetchTicketDetails = async () => {
      try {
        // TODO: Replace with actual API call to fetch tickets
        // const response = await fetch(`/api/get-tickets?session_id=${sessionId}`);
        // const data = await response.json();
        
        // For now, create dummy ticket data
        const dummyTickets: EnhancedTicket[] = [{
          id: sessionId,
          eventId: '1',
          eventTitle: 'Event Title',
          eventDate: new Date().toISOString(),
          eventLocation: 'Event Location',
          ticketType: 'General Admission',
          quantity: 1,
          totalPrice: 0,
          purchaseDate: new Date().toISOString(),
          status: 'confirmed',
          userId: '',
          qrCode: sessionId,
          orderId: sessionId,
          ticketStatus: 'active'
        }];

        setTickets(dummyTickets);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching ticket details:', error);
        setIsLoading(false);
      }
    };

    fetchTicketDetails();
  }, [searchParams, router]);

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