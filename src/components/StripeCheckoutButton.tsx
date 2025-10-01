// components/StripeCheckoutButton.tsx
"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";

interface StripeCheckoutButtonProps {
  ticketId: number;
  userId: string;
  customerEmail: string;
  quantity?: number;
  onSuccess: () => void; // We'll just redirect, so no tickets needed
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  // Event details (for tracking/analytics if needed)
  eventTitle: string;
  eventDate: string | null;
  eventLocation: string | null;
  ticketTypeName: string | null;
  eventId?: number;
  eventImage?: string;
  eventCategory?: string;
}

const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  ticketId,
  userId,
  customerEmail,
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

  const handleStripeCheckout = async () => {
    if (loading || disabled) return;

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      if (!userId || !customerEmail || !ticketId) {
        throw new Error("Missing required information: userId, email, or ticketId");
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        throw new Error("Invalid email address format");
      }

      const tickets = [{ ticket_id: ticketId, quantity }];

      console.log("💳 Starting Stripe checkout with:", {
        userId,
        customerEmail,
        tickets,
        ticketId,
        quantity,
      });

      // Call your Supabase edge function via your API route
      const response = await fetch("/api/initiate-stripe-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          return_url: `${window.location.origin}/payment-success`,
          customer_email: customerEmail,
          user_id: userId,
          tickets,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Stripe checkout response:", result);

      if (result.error) {
        throw new Error(result.error);
      }

      // Check if we got the checkout URL
      if (!result.checkout_url) {
        throw new Error("No checkout URL received from server");
      }

      console.log("🔗 Redirecting to Stripe Checkout:", result.checkout_url);

      // Show brief success state before redirecting
      setSuccess(true);

      // Redirect to Stripe Checkout after a brief delay
      setTimeout(() => {
        window.location.href = result.checkout_url;
      }, 800);

    } catch (err) {
      console.error("💥 Stripe checkout error:", err);

      let errorMessage = "Failed to initiate payment. Please try again.";
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
    success: { scale: 1.02 },
    error: { scale: 1, x: [-2, 2, -2, 2, 0] },
    tap: { scale: 0.95 },
  };

  const getButtonContent = () => {
    if (success) {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Redirecting to Payment...
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
          Processing...
        </>
      );
    }
    return (
      <>
        <CreditCard className="w-4 h-4 mr-2" />
        Pay with Card
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
        onClick={handleStripeCheckout}
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
                customer_email: customerEmail,
                payment_method: "stripe",
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

export default StripeCheckoutButton;