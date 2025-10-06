"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  CreditCard,
  AlertCircle,
  Smartphone,
} from "lucide-react";

interface CheckoutButtonProps {
  ticketId: number;
  userId: string;
  userEmail: string;
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
  paymentMethod?: 'mobile_money' | 'stripe';
  ticketPrice: number; 
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  ticketId,
  userId,
  userEmail,
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
  paymentMethod = 'stripe',
  ticketPrice, 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'mobile_money' | 'stripe'>(paymentMethod);

  const handleMobileMoneyCheckout = async () => {
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

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error("Supabase configuration missing. Please contact support.");
      }

      const functionUrl = `${supabaseUrl}/functions/v1/initiate-payment-url`;
      
      console.log("Starting mobile money checkout with:", {
        userId,
        phone: cleanPhone,
        ticketId,
        quantity
      });

      // ✅ EXACT format from boss's working example
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        phone_number: cleanPhone,
        payment_method: "mobile money",
        user_id: userId,
        tickets: [
          {
            ticket_id: ticketId,
            quantity: quantity
          }
        ]
      });

      const requestOptions: RequestInit = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      console.log("Calling Edge Function at:", functionUrl);
      console.log("Request body:", raw);

      const response = await fetch(functionUrl, requestOptions);

      console.log("Response status:", response.status);

      const resultText = await response.text();
      console.log("Raw response:", resultText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(resultText);
        } catch {
          errorData = { error: response.statusText };
        }
        console.error("API error response:", errorData);
        throw new Error(errorData.error || `Payment service error: ${response.statusText}`);
      }

      const result = JSON.parse(resultText);
      console.log("Mobile money payment result:", result);

      if (result.error) {
        throw new Error(result.error);
      }

      const checkoutUrl = result.checkout_url || result.data?.checkout_url;
      if (!checkoutUrl) {
        console.error("Full result:", result);
        throw new Error("No checkout URL received. Please try again.");
      }

      console.log("Redirecting to mobile money checkout:", checkoutUrl);
      window.location.href = checkoutUrl;

    } catch (err) {
      throw err;
    }
  };

  const handleStripeCheckout = async () => {
    try {
      if (!userId || !userEmail || !ticketId) {
        throw new Error("Missing required information: userId, email, or ticketId");
      }
      
      if (!ticketPrice || ticketPrice <= 0) {
        throw new Error("Ticket price is missing or invalid.");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        throw new Error("Please provide a valid email address");
      }

      const tickets = [{ 
        ticket_id: ticketId, 
        quantity,
        event_title: eventTitle,
        name: ticketTypeName,
        price: ticketPrice
      }];

      console.log("Starting Stripe checkout with:", {
        userId,
        email: userEmail,
        tickets,
      });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error("Supabase configuration missing. Please contact support.");
      }

      const functionUrl = `${supabaseUrl}/functions/v1/initiate-payment-url`;

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          email: userEmail,
          payment_method: "stripe",
          tickets,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Stripe payment result:", result);

      if (result.error) {
        throw new Error(result.error);
      }

      const checkoutUrl = result.checkout_url;
      if (!checkoutUrl) {
        console.error("No checkout URL in result:", result);
        throw new Error("No checkout URL received from Stripe");
      }

      console.log("Redirecting to Stripe checkout:", checkoutUrl);
      
      if (result.session_id) {
        sessionStorage.setItem('stripe_session_id', result.session_id);
      }

      window.location.href = checkoutUrl;

    } catch (err) {
      throw err;
    }
  };

  const handleCheckout = async () => {
    if (loading || disabled) return;

    setLoading(true);
    setError(null);

    try {
      if (selectedMethod === 'mobile_money') {
        await handleMobileMoneyCheckout();
      } else {
        await handleStripeCheckout();
      }
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
          Redirecting to {selectedMethod === 'mobile_money' ? 'Mobile Money' : 'Stripe'}...
        </>
      );
    }
    return (
      <>
        {selectedMethod === 'mobile_money' ? (
          <Smartphone className="w-4 h-4 mr-2" />
        ) : (
          <CreditCard className="w-4 h-4 mr-2" />
        )}
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
    <div className="space-y-3">
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setSelectedMethod('stripe')}
          disabled={loading}
          className={`
            flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all
            ${selectedMethod === 'stripe' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          Card Payment
        </button>
        <button
          type="button"
          onClick={() => setSelectedMethod('mobile_money')}
          disabled={loading}
          className={`
            flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all
            ${selectedMethod === 'mobile_money' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <Smartphone className="w-4 h-4 inline mr-2" />
          Mobile Money
        </button>
      </div>

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
          className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200"
        >
          {error}
        </motion.div>
      )}

      {!loading && (
        <div className="text-xs text-gray-500 text-center">
          {selectedMethod === 'stripe' ? (
            <span>Secure payment with Stripe</span>
          ) : (
            <span>Pay with MTN, Orange, or other mobile money</span>
          )}
        </div>
      )}

      {process.env.NODE_ENV === "development" && (
        <details className="text-xs text-gray-500 mt-2">
          <summary className="cursor-pointer hover:text-gray-700">
            Debug Info
          </summary>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(
              {
                payment_method: selectedMethod,
                user_id: userId,
                phone_number: phone.replace(/\d(?=\d{4})/g, "*"),
                tickets: [{ ticket_id: ticketId, quantity }],
                event_details: {
                  eventTitle,
                  eventDate,
                  eventLocation,
                  ticketTypeName,
                },
                env_check: {
                  has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
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