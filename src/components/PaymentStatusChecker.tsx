'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentStatusChecker() {
  const router = useRouter();

  useEffect(() => {
    const checkPendingPayment = () => {
      const paymentData = sessionStorage.getItem('momo_payment_data');
      
      if (paymentData) {
        try {
          const data = JSON.parse(paymentData);
          
          // Check if payment is less than 30 minutes old
          if (Date.now() - data.timestamp < 30 * 60 * 1000) {
            sessionStorage.removeItem('momo_payment_data');
            router.push(`/payment-success?momo_ref=${encodeURIComponent(data.paymentRef)}&provider=momo`);
          } else {
            sessionStorage.removeItem('momo_payment_data');
          }
        } catch (err) {
          console.error('Error checking pending payment:', err);
        }
      }
    };

    checkPendingPayment();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPendingPayment();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  return null;
}