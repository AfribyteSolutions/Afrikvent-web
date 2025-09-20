// CheckoutButton component aligned with your database schema

"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { buyTicket } from "@/utils/payment";
import { PaymentResult, EnhancedTicket } from "@/types/ticket";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";

interface CheckoutButtonProps {
  ticketId: number; // This should be ticket_type_id from TICKET_TYPES table
  userId: string;
  phone: string;
  quantity?: number;
  onSuccess: (enhancedTickets: EnhancedTicket[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ 
  ticketId, 
  userId, 
  phone, 
  quantity = 1,
  onSuccess, 
  onError,
  disabled = false,
  className = ""
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      // Validate inputs before making payment
      if (!userId || !phone || !ticketId) {
        throw new Error("Missing required information: userId, phone, or ticketId");
      }

      // Validate phone number format for international MTN Mobile Money
      // Support for multiple countries: Ghana (+233), Cameroon (+237), Nigeria (+234), etc.
      // Format: country code + mobile number (8-10 digits)
      const phoneRegex = /^(\+?[1-9]\d{2})[1-9]\d{7,9}$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        throw new Error("Invalid phone number format. Please enter a valid international mobile number with country code.");
      }

      // Prepare tickets array for payment - this should match what your buyTicket function expects
      const tickets = [{ 
        ticket_id: ticketId, // This references TICKET_TYPES.id
        quantity: quantity 
      }];

      console.log('🚀 Starting checkout with:', {
        userId,
        phone,
        tickets,
        ticketId,
        quantity
      });

      // Call your payment function
      const result: PaymentResult = await buyTicket(userId, phone, tickets);

      console.log('💰 Payment result:', result);

      // Check if the result has the expected structure
      if (!result) {
        throw new Error("No response received from payment service");
      }

      // More detailed error checking
      if (!result.success) {
        console.error('❌ Payment failed - Full result:', result);
        
        // Try to extract more specific error information
        let errorMsg = "Payment was declined or failed";
        
        // Check for common failure reasons
        if (result.transaction_id === '') {
          errorMsg = "Payment service unavailable. Please try again later.";
        } else if (result.tickets && result.tickets.length === 0) {
          errorMsg = "Payment processed but no tickets were issued. Please contact support.";
        }
        
        // If there's additional error info in the result, use it
        if ('error' in result && result.error) {
          errorMsg = String(result.error);
        } else if ('message' in result && result.message) {
          errorMsg = String(result.message);
        }
        
        throw new Error(errorMsg);
      }

      if (!result.tickets || !Array.isArray(result.tickets) || result.tickets.length === 0) {
        console.error('❌ No tickets in result:', result);
        throw new Error("Payment successful but no tickets were generated. Please contact support.");
      }

      console.log('✅ Payment successful, processing tickets:', result.tickets);

      // Show success state briefly
      setSuccess(true);
      
      // Transform PaymentResult to EnhancedTicket format
      const enhancedTickets: EnhancedTicket[] = result.tickets.map((ticket, index) => {
        console.log('🎫 Processing ticket:', ticket);
        
        return {
          // Required properties for EnhancedTicket based on your UserTicket interface
          id: `${result.transaction_id || Date.now()}-${ticket.ticket_id}-${index}`,
          eventId: result.eventData?.id?.toString() || ticketId.toString(),
          eventTitle: result.eventData?.title || "Event",
          eventDate: result.eventData?.date || new Date().toISOString(),
          eventLocation: result.eventData?.location || "Location TBD",
          ticketType: ticket.ticketType || "General Admission",
          quantity: ticket.quantity || quantity,
          totalPrice: ticket.price || 0,
          purchaseDate: new Date().toISOString(),
          status: "confirmed" as const,
          userId: userId,
          
          // Enhanced properties
          qrCode: result.qr_string || `${result.transaction_id || Date.now()}-${ticket.ticket_id}-${userId}`,
          orderId: result.orderId || result.transaction_id || `ORDER_${Date.now()}`,
          ticketStatus: "active" as const,
          // Only include properties that exist in your PaymentResult type
          eventImage: result.eventData?.image,
          eventCategory: result.eventData?.category,
        };
      });

      console.log('🎟️ Enhanced tickets created:', enhancedTickets);

      // Wait a moment to show success state
      setTimeout(() => {
        onSuccess(enhancedTickets);
        setSuccess(false);
      }, 1500);

    } catch (error) {
      console.error("💥 Checkout error:", error);
      
      let errorMessage = "Payment failed. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }

      // Handle specific error types from your payment system
      if (errorMessage.includes('insufficient')) {
        errorMessage = "Insufficient funds. Please check your mobile money balance.";
      } else if (errorMessage.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (errorMessage.includes('timeout')) {
        errorMessage = "Payment timeout. Please try again.";
      }

      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear error after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const buttonVariants = {
    idle: { scale: 1 },
    loading: { scale: 0.98 },
    success: { scale: 1.02 },
    error: { scale: 1, x: [-2, 2, -2, 2, 0] },
    tap: { scale: 0.95 }
  };

  const getButtonContent = () => {
    if (success) {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Payment Successful!
        </>
      );
    }
    
    if (error) {
      return (
        <>
          <AlertCircle className="w-4 h-4 mr-2" />
          Try Again
        </>
      );
    }
    
    if (loading) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing Payment...
        </>
      );
    }
    
    return (
      <>
        <CreditCard className="w-4 h-4 mr-2" />
        Buy {quantity > 1 ? `${quantity} Tickets` : 'Ticket'}
      </>
    );
  };

  const getButtonColor = () => {
    if (success) return "bg-green-600 hover:bg-green-700";
    if (error) return "bg-red-600 hover:bg-red-700";
    if (loading) return "bg-blue-500";
    return "bg-blue-600 hover:bg-blue-700 active:bg-blue-800";
  };

  const getAnimationState = () => {
    if (success) return "success";
    if (error) return "error";
    if (loading) return "loading";
    return "idle";
  };

  return (
    <div className="space-y-2">
      <motion.button
        onClick={handleCheckout}
        disabled={loading || disabled}
        className={`
          px-6 py-3 rounded-lg font-semibold text-white w-full
          transition-all duration-200 ease-in-out
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center
          shadow-lg hover:shadow-xl
          ${getButtonColor()}
          ${className}
        `}
        variants={buttonVariants}
        animate={getAnimationState()}
        whileTap={!loading && !disabled ? "tap" : undefined}
        initial="idle"
      >
        {getButtonContent()}
      </motion.button>
      
      {/* Error message display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md border border-red-200"
        >
          {error}
        </motion.div>
      )}
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-500 mt-2">
          <summary className="cursor-pointer hover:text-gray-700">Debug Info</summary>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify({ 
              ticketId, 
              userId, 
              phone: phone.replace(/\d(?=\d{4})/g, '*'), // Mask phone for privacy
              quantity,
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default CheckoutButton;