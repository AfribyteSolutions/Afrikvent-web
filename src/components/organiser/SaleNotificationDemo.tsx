import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, DollarSign, User, X } from 'lucide-react';

interface SaleNotification {
  id: string;
  eventName: string;
  buyerName?: string;
  amount: number;
  currency: string;
  ticketCount: number;
  timestamp: Date;
}

interface SaleNotificationToastProps {
  notification: SaleNotification;
  onClose: (id: string) => void;
}

const SaleNotificationToast: React.FC<SaleNotificationToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case 'GHS': return '₵';
      case 'CFA': return 'CFA';
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return currency;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className="bg-white rounded-lg shadow-2xl border-2 border-green-200 p-4 mb-3 w-80 relative overflow-hidden"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-50"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <CheckCircle className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">New Sale! 🎉</h4>
              <p className="text-xs text-gray-500">Just now</p>
            </div>
          </div>
          <button
            onClick={() => onClose(notification.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs">🎫</span>
            </div>
            <span className="text-gray-700 font-medium truncate flex-1">
              {notification.eventName}
            </span>
          </div>

          {notification.buyerName && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-purple-600" />
              </div>
              <span className="text-gray-600 text-xs truncate">
                {notification.buyerName}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-3 h-3 text-green-600" />
              </div>
              <span className="font-bold text-green-600">
                {getCurrencySymbol(notification.currency)}{notification.amount.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {notification.ticketCount} ticket{notification.ticketCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-green-500"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: "linear" }}
      />
    </motion.div>
  );
};

// Demo component showing how to use it
const SaleNotificationDemo: React.FC = () => {
  const [notifications, setNotifications] = useState<SaleNotification[]>([]);

  const addNotification = () => {
    const newNotification: SaleNotification = {
      id: Math.random().toString(36).substr(2, 9),
      eventName: 'Tech Conference 2024',
      buyerName: 'John Doe',
      amount: 150,
      currency: 'GHS',
      ticketCount: 2,
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Simulate notifications for demo
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        addNotification();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Demo Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Real-time Sale Notifications
          </h1>
          <p className="text-gray-600 mb-4">
            Get instant notifications when tickets are purchased
          </p>
          <button
            onClick={addNotification}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Simulate Sale
          </button>
        </div>

        {/* Example Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">₵12,450</p>
            <p className="text-sm text-green-600 mt-1">+15% from last week</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Tickets Sold</h3>
              <span className="text-2xl">🎫</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">248</p>
            <p className="text-sm text-green-600 mt-1">+23 today</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Active Events</h3>
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">12</p>
            <p className="text-sm text-blue-600 mt-1">3 ending soon</p>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Ticket purchased</p>
                  <p className="text-xs text-gray-500">Music Festival • 2 tickets</p>
                </div>
                <span className="text-sm font-semibold text-green-600">₵250</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Container */}
      <div className="fixed top-6 right-6 z-50">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <SaleNotificationToast
              key={notification.id}
              notification={notification}
              onClose={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Integration Instructions */}
      <div className="max-w-6xl mx-auto mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">
          💡 Integration Instructions
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>1.</strong> Install required dependency: <code className="bg-blue-100 px-2 py-1 rounded">npm install framer-motion</code>
          </p>
          <p>
            <strong>2.</strong> Import the notification component in your AnalyticsOverview
          </p>
          <p>
            <strong>3.</strong> Add notification state and trigger on real-time payment updates
          </p>
          <p>
            <strong>4.</strong> Notifications will automatically appear and disappear after 5 seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default SaleNotificationDemo;