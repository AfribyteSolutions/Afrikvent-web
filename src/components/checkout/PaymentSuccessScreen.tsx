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
    router.push('/events');
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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
      >
        {/* Confetti Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${
                i % 3 === 0 ? 'bg-yellow-400' : 
                i % 3 === 1 ? 'bg-pink-400' : 
                'bg-blue-400'
              }`}
              initial={{
                x: Math.random() * 400,
                y: -50,
                scale: 0,
                rotate: 0
              }}
              animate={{
                y: [0, 100, 600],
                x: [
                  Math.random() * 400,
                  Math.random() * 400 + (Math.random() - 0.5) * 100,
                  Math.random() * 400 + (Math.random() - 0.5) * 200
                ],
                scale: [0, 1, 0.5, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 3,
                delay: Math.random() * 2,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: Math.random() * 5
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="px-8 py-16 text-center relative">
          {/* Ticket Illustration */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring", bounce: 0.4 }}
            className="relative mb-8"
          >
            {/* Ticket Shape */}
            <div className="relative mx-auto w-32 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg transform perspective-1000 rotate-y-12">
              {/* Ticket perforations */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-white opacity-60"></div>
              <div className="absolute left-6 top-2 w-2 h-2 bg-white rounded-full opacity-80"></div>
              <div className="absolute left-6 bottom-2 w-2 h-2 bg-white rounded-full opacity-80"></div>
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-80"></div>
              
              {/* Ticket text */}
              <div className="p-3 text-white text-xs font-semibold">
                <div className="text-left">EVENT</div>
                <div className="text-right mt-1">TICKET</div>
              </div>
            </div>

            {/* Logo overlay */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="absolute -top-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="text-white text-xs font-bold">A</span>
            </motion.div>
          </motion.div>

          {/* Success Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-4"
          >
            <h1 className="text-2xl font-bold text-blue-600 mb-2">
              Ticket Payment Successful
            </h1>
            <p className="text-gray-500 text-sm">
              We are almost there ...
            </p>
          </motion.div>

          {/* Hidden Details Section (expandable if needed) */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
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
                
                <hr className="my-3" />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Paid</span>
                  <span className="text-green-600">₵{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="px-8 pb-8 space-y-4"
        >
          <button
            onClick={handleCheckMyTickets}
            className="w-full bg-white text-blue-600 py-4 px-6 rounded-xl font-semibold text-lg border-2 border-blue-200 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Check my Ticket
          </button>
          
          <button
            onClick={handleBackToHome}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessScreen;