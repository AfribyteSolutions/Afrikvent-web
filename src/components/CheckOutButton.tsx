"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  CreditCard,
  AlertCircle,
} from "lucide-react";

interface CheckoutButtonProps {
  ticketId: number;
  userId: string;
  phone: string;
  quantity?: number;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  eventTitle: string;
  eventDate: string | null;
  eventLocation: string | null;
  ticketTypeName: string | null;
  eventId?: number;
  eventImage?: string;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  ticketId,
  userId,
  phone,
  quantity = 1,
  onError,
  disabled = false,
  className = "",
  eventTitle,
  eventDate,
  eventLocation,
  ticketTypeName,
  eventId,
  eventImage,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (loading || disabled) return;

    setLoading(true);
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

      // Call the new initiate-payment-url endpoint
      const response = await fetch("/api/initiate-payment-url", {
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

      const result = await response.json();
      console.log("Payment URL result:", result);
      console.log("Result type:", typeof result);
      console.log("Result keys:", Object.keys(result));
      console.log("checkout_url value:", result.checkout_url);
      console.log("Has checkout_url?", 'checkout_url' in result);

      // Check for errors first
      if (result.error) {
        throw new Error(result.error);
      }

      // Check if we have a checkout URL
      const checkoutUrl = result.checkout_url || result.data?.checkout_url;
      if (!checkoutUrl) {
        console.error("No checkout_url in result:", result);
        console.error("Full result stringified:", JSON.stringify(result, null, 2));
        throw new Error("No checkout URL received from payment service");
      }

      console.log("Redirecting to checkout URL:", checkoutUrl);

      // Redirect user to Fapshi payment page
      window.location.href = checkoutUrl;

    } catch (err) {
      console.error("Checkout error:", err);

      let errorMessage = "Payment failed. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      if (onError) onError(errorMessage);
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
    error: { scale: 1, x: [-2, 2, -2, 2, 0] },
    tap: { scale: 0.95 },
  };

  const getButtonContent = () => {
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
          Redirecting to Payment...
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
    if (error) return "bg-red-600 hover:bg-red-700";
    if (loading) return "bg-blue-500";
    return "bg-blue-600 hover:bg-blue-700 active:bg-blue-800";
  };

  const getAnimationState = () => {
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