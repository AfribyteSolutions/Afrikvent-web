// utils/payment.ts - Fixed version
import { PaymentResult } from '@/types/ticket';

interface TicketRequest {
  ticket_id: number;
  quantity: number;
}

export async function buyTicket(
  userId: string,
  phoneNumber: string,
  tickets: TicketRequest[]
): Promise<PaymentResult> {
  try {
    // Log the request for debugging
    console.log('Calling payment API with:', {
      phone_number: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mask for privacy
      payment_method: 'mobile money',
      user_id: userId,
      tickets
    });

    const response = await fetch('/api/initiate-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        payment_method: 'mobile money',
        user_id: userId,
        tickets: tickets
      }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.error('Payment API error response:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        // If we can't parse JSON, it might be an HTML error page (404, 500, etc.)
        const responseText = await response.text();
        console.error('Non-JSON error response:', responseText.substring(0, 200));
        
        if (response.status === 404) {
          errorMessage = 'Payment API endpoint not found. Please check your API route configuration.';
        } else if (response.status === 500) {
          errorMessage = 'Internal server error. Please try again later.';
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Payment API returned:', data);

    // **FIX: Return the data directly instead of trying to destructure it**
    // The API already returns the correct structure with payment and tickets
    return data as PaymentResult;

  } catch (error) {
    console.error('Payment request failed:', error);
    
    // Re-throw the error with better context
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred during payment processing');
    }
  }
}