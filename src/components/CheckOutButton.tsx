// CheckoutButton component that works with your existing types:

"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { buyTicket } from "@/utils/payment";
import { PaidTicket, PaymentResult, EnhancedTicket } from "@/types/ticket";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";

interface CheckoutButtonProps {
  ticketId: number;
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

  const handleCheckout = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    setSuccess(false);

    try {
      // Prepare tickets array for payment
      const tickets = [{ 
        ticket_id: ticketId, 
        quantity: quantity 
      }];

      // Call your payment function
      const result: PaymentResult = await buyTicket(userId, phone, tickets);

      if (result.success && result.tickets && result.tickets.length > 0) {
        // Show success state briefly
        setSuccess(true);
        
        // Transform PaymentResult to EnhancedTicket format (what your TicketCard expects)
        const enhancedTickets: EnhancedTicket[] = result.tickets.map((ticket, index) => ({
          // Required properties for EnhancedTicket
          id: `${result.transaction_id}-${ticket.ticket_id}-${index}`,
          eventId: result.eventData?.id || ticketId.toString(),
          eventTitle: result.eventData?.title || "Event",
          eventDate: result.eventData?.date || new Date().toISOString(),
          eventLocation: result.eventData?.location || "Location TBD",
          ticketType: ticket.ticketType || "General Admission",
          quantity: ticket.quantity,
          totalPrice: ticket.price || 0,
          purchaseDate: new Date().toISOString(),
          status: "confirmed" as const,
          userId: userId,
          
          // Enhanced properties
          qrCode: result.qr_string || `${result.transaction_id}-${ticket.ticket_id}-${userId}`,
          orderId: result.orderId || result.transaction_id,
          ticketStatus: "active" as const,
          eventImage: undefined,
          eventCategory: undefined,
          seatNumber: undefined,
          gate: undefined,
          validUntil: undefined,
        }));

        // Wait a moment to show success state
        setTimeout(() => {
          onSuccess(enhancedTickets);
          setSuccess(false);
        }, 1500);

      } else {
        throw new Error("Payment failed or no tickets returned");
      }

    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "Payment failed. Please try again.";
      
      if (onError) {
        onError(errorMessage);
      } else {
        // Fallback error display
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    loading: { scale: 0.98 },
    success: { scale: 1.02 },
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
    if (loading) return "bg-blue-500";
    return "bg-blue-600 hover:bg-blue-700 active:bg-blue-800";
  };

  return (
    <motion.button
      onClick={handleCheckout}
      disabled={loading || disabled || success}
      className={`
        px-6 py-3 rounded-lg font-semibold text-white
        transition-all duration-200 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center
        shadow-lg hover:shadow-xl
        ${getButtonColor()}
        ${className}
      `}
      variants={buttonVariants}
      animate={success ? "success" : loading ? "loading" : "idle"}
      whileTap={!loading && !disabled && !success ? "tap" : undefined}
      initial="idle"
    >
      {getButtonContent()}
    </motion.button>
  );
};

export default CheckoutButton;