// components/checkout/PaymentSuccessScreen.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Ticket, Home, Mail, Calendar, MapPin } from 'lucide-react';
import { EnhancedTicket } from '@/types/ticket';
import { useRouter } from 'next/navigation';

interface PaymentSuccessScreenProps {
  isOpen: boolean;
  tickets: EnhancedTicket[];
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  onClose: () => void;
}

const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({
  isOpen,
  tickets,
  eventTitle,
  eventDate,
  eventLocation,
  onClose
}) => {
  const router = useRouter();

  const handleCheckMyTickets = () => {
    router.push('/my-tickets');
    onClose();
  };

  const handleBackToHome = () => {
    router.push('/');
    onClose();
  };

  const totalAmount = tickets.reduce((sum, ticket) => sum + ticket.totalPrice, 0);
  const totalQuantity = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Success Animation */}
        <div className="relative bg-gradient-to-br from-green-400 to-green-600 px-8 py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", bounce: 0.5 }}
            className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Payment Successful!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-green-100 text-lg"
          >
            Your tickets are ready
          </motion.p>

          {/* Confetti Animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                initial={{
                  x: Math.random() * 400,
                  y: Math.random() * 300,
                  scale: 0,
                  rotate: 0
                }}
                animate={{
                  y: [0, -100, 500],
                  scale: [0, 1, 0],
                  rotate: 360
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Ticket Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-50 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Ticket Details</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Event</span>
                <span className="font-medium text-gray-900 text-right">{eventTitle}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date & Time</span>
                <div className="flex items-center gap-1 text-gray-900">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{new Date(eventDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Location</span>
                <div className="flex items-center gap-1 text-gray-900">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium text-right">{eventLocation}</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tickets</span>
                <span className="font-medium text-gray-900">{totalQuantity} ticket{totalQuantity > 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID</span>
                <span className="font-medium text-gray-900 font-mono text-xs">
                  {tickets[0]?.orderId || 'N/A'}
                </span>
              </div>
              
              <hr className="my-3" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total Paid</span>
                <span className="text-green-600">₵{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Email Notification */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl mb-6"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Email Confirmation Sent</p>
              <p className="text-xs text-blue-700">Check your inbox for ticket details</p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <button
              onClick={handleCheckMyTickets}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Check My Tickets
            </button>
            
            <button
              onClick={handleBackToHome}
              className="w-full border-2 border-gray-200 text-gray-700 py-4 px-6 rounded-xl font-bold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <div className="flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Back to Home
              </div>
            </button>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200"
          >
            <p className="text-sm text-yellow-800 text-center">
              <span className="font-semibold">Important:</span> Please arrive 30 minutes early and bring a valid ID
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessScreen;