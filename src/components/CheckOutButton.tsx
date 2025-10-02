"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  PaymentResult,
  EnhancedTicket,
  DatabaseTicket,
} from "@/types/ticket";
import {
  Loader2,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface CheckoutButtonProps {
  ticketId: number;
  userId: string;
  phone: string;
  quantity?: number;
  onSuccess: (enhancedTickets: EnhancedTicket[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  eventTitle: string;
  eventDate: string | null;
  eventLocation: string | null;
  ticketTypeName: string | null;
  eventId?: number;
  eventImage?: string;
  eventCategory?: string;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  ticketId,
  userId,
  phone,
  quantity = 1,
  onSuccess,
  onError,
  disabled = false,
  className = "",
  eventTitle,
  eventDate,
  eventLocation,
  ticketTypeName,
  eventId,
  eventImage,
  eventCategory,
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
      if (!userId || !phone || !ticketId) {
        throw new Error("Missing required information: userId, phone, or ticketId");
      }

      const phoneRegex = /^(\+?[1-9]\d{2})[1-9]\d{7,9}$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ""))) {
        throw new Error(
          "Invalid phone number format. Please enter a valid international mobile number with country code."
        );
      }

      const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+/, "");
      const tickets = [{ ticket_id: ticketId, quantity }];

      console.log("Starting checkout with:", {
        userId,
        phone: cleanPhone,
        tickets,
        ticketId,
        quantity,
      });

      const response = await fetch("/api/initiate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          phone_number: cleanPhone,
          payment_method: "mobile money",
          tickets,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      let rawResult: unknown = await response.json();
      console.log("Raw payment result:", rawResult);

      if (typeof rawResult === "string") {
        console.log("Result is string, parsing again...");
        try {
          rawResult = JSON.parse(rawResult);
          console.log("Successfully parsed string result:", rawResult);
        } catch (parseError) {
          console.error("Failed to parse string result:", parseError);
          throw new Error("Invalid JSON response format");
        }
      }

      const result = rawResult as PaymentResult;

      if (result.error) {
        throw new Error(result.error);
      }

      let ticketsArray: DatabaseTicket[] = [];
      
      console.log("Extracting tickets from result:", result);
      
      const resultWithTickets = result as PaymentResult & { tickets?: DatabaseTicket[] };
      
      if (resultWithTickets.tickets && Array.isArray(resultWithTickets.tickets)) {
        ticketsArray = resultWithTickets.tickets;
        console.log("Tickets extracted from result.tickets:", ticketsArray);
      } else {
        const rawWithTickets = rawResult as Record<string, unknown>;
        console.log("Fallback - rawResult.tickets:", rawWithTickets.tickets);
        
        if (rawWithTickets.tickets && Array.isArray(rawWithTickets.tickets)) {
          ticketsArray = rawWithTickets.tickets as DatabaseTicket[];
          console.log("Tickets extracted from rawResult.tickets:", ticketsArray);
        }
      }

      console.log("Tickets array extracted:", ticketsArray);

      if (ticketsArray.length === 0) {
        console.error("Payment failed - No tickets returned. Full result:", rawResult);
        
        let errorMsg = "Payment failed - no tickets were created";
        if (result.message) {
          const msg = result.message.toLowerCase();
          if (
            msg.includes("fail") ||
            msg.includes("error") ||
            msg.includes("decline")
          ) {
            errorMsg = result.message;
          }
        }
        throw new Error(errorMsg);
      }

      console.log("Payment successful, processing tickets:", ticketsArray);

      setSuccess(true);

      const enhancedTickets: EnhancedTicket[] = ticketsArray.map(
        (ticket: DatabaseTicket, index: number) => {
          console.log("Processing ticket:", ticket);

          const ticketId = ticket.id || `temp_${Date.now()}_${index}`;
          const transactionId = result.payment?.transaction_id || `TXN_${Date.now()}`;

          const ticketEventId = eventId?.toString() || 
                               ticket.event_id?.toString() || 
                               ticket.ticket_type_id?.toString() || 
                               ticketId.toString();

          return {
            id: `${transactionId}-${ticketId}-${index}`,
            eventId: ticketEventId,
            eventTitle: eventTitle || "Event",
            eventDate: eventDate || new Date().toISOString(),
            eventLocation: eventLocation || "Location TBA",
            ticketType: ticketTypeName || "General Admission",
            quantity: parseInt(ticket.quantity?.toString() || "1"),
            totalPrice: Number(ticket.total || ticket.unit_price || 0),
            purchaseDate: new Date().toISOString(),
            status: "confirmed" as const,
            userId,
            qrCode: ticket.qr_code_data || `QR_${ticketId}`,
            orderId: transactionId,
            ticketStatus: "active" as const,
            eventImage,
            eventCategory,
          };
        }
      );

      console.log("Enhanced tickets created:", enhancedTickets);

      // Send email with tickets
      try {
        const isVirtual = eventLocation?.toLowerCase().includes('online') || 
                         eventLocation?.toLowerCase().includes('virtual') || 
                         eventLocation?.toLowerCase().includes('zoom');

        const ticketsWithAccessCodes = enhancedTickets.map(ticket => ({
          id: ticket.id,
          orderId: ticket.orderId,
          ticketType: ticket.ticketType,
          qrCode: ticket.qrCode,
          accessCode: ticket.qrCode.slice(-6)
        }));

        const { data: { user } } = await supabase.auth.getUser();
        
        console.log("Sending ticket email...");
        
        const emailResponse = await supabase.functions.invoke('send-ticket-email', {
          body: {
            userEmail: user?.email,
            userName: user?.user_metadata?.name || user?.email?.split('@')[0],
            tickets: ticketsWithAccessCodes,
            eventTitle: eventTitle,
            eventDate: eventDate || new Date().toISOString(),
            eventLocation: eventLocation || 'TBA',
            isVirtual
          }
        });

        if (emailResponse.error) {
          console.error("Email send error:", emailResponse.error);
        } else {
          console.log("Ticket email sent successfully");
        }
      } catch (emailError) {
        console.error("Email send error:", emailError);
        // Continue even if email fails - don't break the user flow
      }

      setTimeout(() => {
        onSuccess(enhancedTickets);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Checkout error:", err);

      let errorMessage = "Payment failed. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const buttonVariants = {
    idle: { scale: 1 },
    loading: { scale: 0.98 },
    success: { scale: 1.02 },
    error: { scale: 1, x: [-2, 2, -2, 2, 0] },
    tap: { scale: 0.95 },
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
        Buy {quantity > 1 ? `${quantity} Tickets` : "Ticket"}
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

      {process.env.NODE_ENV === "development" && (
        <details className="text-xs text-gray-500 mt-2">
          <summary className="cursor-pointer hover:text-gray-700">
            Debug Info
          </summary>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(
              {
                phone_number: phone.replace(/\d(?=\d{4})/g, "*"),
                payment_method: "mobile money",
                user_id: userId,
                tickets: [{ ticket_id: ticketId, quantity }],
                event_details: {
                  eventTitle,
                  eventDate,
                  eventLocation,
                  ticketTypeName,
                },
                timestamp: new Date().toISOString(),
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
};

export default CheckoutButton;