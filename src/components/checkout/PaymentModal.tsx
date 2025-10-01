// components/checkout/EnhancedPaymentModal.tsx - Fixed TypeScript Implementation
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Smartphone, ArrowLeft, Globe, Download, Share2, MoreHorizontal, CheckCircle } from 'lucide-react';
import CheckoutButton from '@/components/CheckOutButton';
import { User } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { EnhancedTicket } from '@/types/ticket';
import { getCurrencyInfo } from '@/utils/currency'; // <-- ADDED
import StripeCheckoutButton from '@/components/StripeCheckoutButton';

type TicketTypeRow = Database['public']['Tables']['TICKET_TYPES']['Row'];

// Properly typed QRCode component props
interface QRCodeProps {
  value: string;
  size: number;
}

// Mock QRCode component with proper TypeScript typing
const QRCode: React.FC<QRCodeProps> = ({ value, size }) => (
  <div 
    className="bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-mono border-2 border-gray-300"
    style={{ width: size, height: size }}
  >
    QR: {value.slice(-8)}
  </div>
);

// Ticket colors
const TICKET_COLORS = [
  { bg: '#E53E3E', accent: '#C53030' },
  { bg: '#D53F8C', accent: '#B83280' },
  { bg: '#9F7AEA', accent: '#805AD5' },
  { bg: '#667EEA', accent: '#5A67D8' },
  { bg: '#4299E1', accent: '#3182CE' },
  { bg: '#0BC5EA', accent: '#00B5D8' },
  { bg: '#38B2AC', accent: '#319795' },
  { bg: '#48BB78', accent: '#38A169' },
];

const generateRandomColor = (ticketId: string) => {
  const hash = ticketId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const index = Math.abs(hash) % TICKET_COLORS.length;
  return TICKET_COLORS[index];
};

// Currency formatting helper - uses getCurrencyInfo utility
const formatCurrency = (amount: number | null | undefined, currencyCode: string | null | undefined): string => {
  const safeAmount = amount || 0;
  const currencyInfo = getCurrencyInfo(currencyCode || undefined);
  const symbol = currencyInfo?.symbol ?? '';

  try {
    // No decimals per your original formatting
    return `${symbol}${safeAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  } catch (e) {
    return `${symbol}${safeAmount.toLocaleString()}`;
  }
};

const formatTicketDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const formatTicketTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Properly typed TicketCard props
interface TicketCardProps {
  ticket: EnhancedTicket;
  onDownload?: (ticket: EnhancedTicket) => Promise<void>;
  onShare?: (ticket: EnhancedTicket) => Promise<void>;
  onView?: (ticket: EnhancedTicket) => void;
}

// TicketCard Component for Modal with proper TypeScript
const TicketCard: React.FC<TicketCardProps> = ({ ticket, onDownload, onShare, onView }) => {
  const [cardColors] = useState(() => generateRandomColor(ticket.id));

  const handleDownload = async () => {
    if (onDownload) {
      await onDownload(ticket);
    } else {
      alert(`Ticket ${ticket.orderId} download started`);
    }
  };

  const handleShare = async () => {
    if (onShare) {
      await onShare(ticket);
    } else {
      const shareText = `🎫 ${ticket.eventTitle}\n📅 ${formatTicketDate(ticket.eventDate)} at ${formatTicketTime(ticket.eventDate)}\n📍 ${ticket.eventLocation}\n🎟️ Order: ${ticket.orderId}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${ticket.eventTitle} - Ticket`,
            text: shareText,
          });
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            navigator.clipboard?.writeText(shareText);
            alert('Ticket details copied to clipboard!');
          }
        }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        alert('Ticket details copied to clipboard!');
      }
    }
  };

  return (
    <div className="relative max-w-sm mx-auto">
      <div
        className="relative rounded-t-3xl rounded-b-lg overflow-hidden shadow-2xl text-white"
        style={{ backgroundColor: cardColors.bg }}
      >
        {/* Decorative notch at top */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-100 rounded-full"></div>

        {/* Header Section */}
        <div className="flex justify-between items-start p-4 pt-8">
          <div>
            <div className="text-xs font-medium opacity-90 mb-1">
              {formatTicketDate(ticket.eventDate)}
            </div>
            <div className="text-sm font-bold">
              {formatTicketTime(ticket.eventDate)}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleShare}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Share ticket"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Download ticket"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onView && onView(ticket)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="View details"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs opacity-80 mb-1">Ticket Type</div>
              <div className="font-semibold text-sm">{ticket.ticketType}</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-80 mb-1">Order ID</div>
              <div className="font-mono text-xs">{ticket.orderId}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs opacity-80 mb-1">Venue</div>
            <div className="text-sm leading-snug">
              {ticket.eventLocation}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xs opacity-80 mb-1">Format</div>
            <div className="text-sm">
              {ticket.eventLocation.toLowerCase().includes('online') || 
               ticket.eventLocation.toLowerCase().includes('virtual') || 
               ticket.eventLocation.toLowerCase().includes('zoom') ? 'Online' : 'In-Person'}
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-lg">
              <QRCode
                value={ticket.qrCode}
                size={100}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm font-medium opacity-90">
              {ticket.eventTitle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type PaymentMethod = 'mobile_money' | 'credit_card' | null;
type Country = {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  mtnSupported: boolean;
  vodafoneSupported: boolean;
  airtelSupported: boolean;
};

// Comprehensive list of MTN Mobile Money supported countries
const COUNTRIES: Country[] = [
 
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dialCode: '237', mtnSupported: true, vodafoneSupported: false, airtelSupported: false },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '233', mtnSupported: true, vodafoneSupported: true, airtelSupported: true },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '234', mtnSupported: true, vodafoneSupported: false, airtelSupported: true },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '256', mtnSupported: true, vodafoneSupported: false, airtelSupported: true },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '250', mtnSupported: true, vodafoneSupported: false, airtelSupported: false },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', dialCode: '260', mtnSupported: true, vodafoneSupported: false, airtelSupported: true },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', dialCode: '229', mtnSupported: true, vodafoneSupported: false, airtelSupported: false },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', dialCode: '242', mtnSupported: true, vodafoneSupported: false, airtelSupported: false },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', dialCode: '225', mtnSupported: true, vodafoneSupported: false, airtelSupported: false },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', dialCode: '224', mtnSupported: true, vodafoneSupported: false, airtelSupported: false },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', dialCode: '231', mtnSupported: true, vodafoneSupported: false, airtelSupported: false },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', dialCode: '211', mtnSupported: true, vodafoneSupported: false, airtelSupported: false },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', dialCode: '268', mtnSupported: true, vodafoneSupported: false, airtelSupported: false },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '93', mtnSupported: true, vodafoneSupported: false, airtelSupported: false },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', dialCode: '967', mtnSupported: true, vodafoneSupported: false, airtelSupported: false }
];

interface EnhancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTicket: TicketTypeRow;
  quantity: number;
  user: User | null;
  eventTitle: string;
  eventDate: string | null;
  eventLocation: string | null;
  eventId?: number; // Add event ID
  eventImage?: string; // Add event image
  onPaymentSuccess?: (tickets: EnhancedTicket[]) => void;
  // 💥 FIX: Add the eventCurrency prop to the interface 💥
  eventCurrency: string | null; 
}

const EnhancedPaymentModal: React.FC<EnhancedPaymentModalProps> = ({
  isOpen,
  onClose,
  selectedTicket,
  quantity,
  user,
  eventTitle,
  eventDate, // Receive event date
  eventLocation, // Receive event location  
  eventId, // Receive event ID
  eventImage, // Receive event image
  onPaymentSuccess,
  // 💥 FIX: Destructure the new prop 💥
  eventCurrency
}) => {
  const [step, setStep] = useState<'method' | 'details' | 'success'>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [provider, setProvider] = useState<'mtn' | 'vodafone' | 'airteltigo'>('mtn');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [generatedTickets, setGeneratedTickets] = useState<EnhancedTicket[]>([]);

  const totalAmount = (selectedTicket.price || 0) * quantity;

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep('details');
  };

  const handleBackToMethods = () => {
    if (step === 'success') {
      // Reset everything when going back from success
      setStep('method');
      setPaymentMethod(null);
      setPhoneNumber('');
      setGeneratedTickets([]);
    } else {
      setStep('method');
      setPaymentMethod(null);
    }
  };

  const handlePaymentSuccess = (tickets: EnhancedTicket[]) => {
    setGeneratedTickets(tickets);
    setStep('success');
    
    // Call the external success handler if provided
    if (onPaymentSuccess) {
      onPaymentSuccess(tickets);
    }
  };

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
    // Stay on details page to retry
  };

  const handleCloseModal = () => {
    onClose();
    // Reset modal state after closing
    setTimeout(() => {
      setStep('method');
      setPaymentMethod(null);
      setPhoneNumber('');
      setGeneratedTickets([]);
    }, 300);
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length >= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    } else if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const getFullPhoneNumber = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return `${selectedCountry.dialCode}${cleaned}`;
  };

  const getAvailableProviders = () => {
    const providers = [];
    if (selectedCountry.mtnSupported) {
      providers.push({ id: 'mtn', name: 'MTN', color: 'border-yellow-400 bg-yellow-50 text-yellow-800' });
    }
    if (selectedCountry.vodafoneSupported) {
      providers.push({ id: 'vodafone', name: 'Vodafone', color: 'border-red-400 bg-red-50 text-red-800' });
    }
    if (selectedCountry.airtelSupported) {
      providers.push({ id: 'airteltigo', name: 'Airtel', color: 'border-green-400 bg-green-50 text-green-800' });
    }
    return providers;
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setPhoneNumber('');
    
    const availableProviders = getAvailableProviders();
    if (availableProviders.length > 0) {
      const mtnProvider = availableProviders.find(p => p.id === 'mtn');
      setProvider((mtnProvider?.id || availableProviders[0].id) as 'mtn' | 'vodafone' | 'airteltigo');
    }
  };

  const isPhoneNumberValid = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 10;
  };

  const handleTicketDownload = async (ticket: EnhancedTicket) => {
    console.log('Downloading ticket:', ticket.orderId);
    // Implement actual download logic here
    alert(`Downloading ticket ${ticket.orderId}...`);
  };

  const handleTicketShare = async (ticket: EnhancedTicket) => {
    console.log('Sharing ticket:', ticket.orderId);
    // Share logic is handled in TicketCard
  };

  const handleTicketView = (ticket: EnhancedTicket) => {
    console.log('Viewing ticket details:', ticket.orderId);
    alert(`Viewing details for ${ticket.orderId}`);
  };
  

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {step !== 'method' && (
                    <button
                      onClick={handleBackToMethods}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  <h2 className="text-xl font-bold text-gray-900">
                    {step === 'method' && 'Payment Method'}
                    {step === 'details' && 'Payment Details'}
                    {step === 'success' && 'Your Tickets'}
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Order Summary - Show only for method and details steps */}
              {(step === 'method' || step === 'details') && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Event</span>
                      <span className="font-medium text-gray-900">{eventTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ticket</span>
                      <span className="font-medium text-gray-900">{selectedTicket.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity</span>
                      <span className="font-medium text-gray-900">{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per ticket</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedTicket.price as unknown as number, eventCurrency)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">{formatCurrency(totalAmount, eventCurrency)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              {step === 'method' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
                  
                  {/* Mobile Money */}
                  <button
                    onClick={() => handleMethodSelect('mobile_money')}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Mobile Money</h4>
                        <p className="text-sm text-gray-600">MTN For Now</p>
                      </div>
                      <Globe className="w-5 h-5 text-gray-400 ml-auto" />
                    </div>
                  </button>

                  {/* Credit Card */}
                  <button
                    onClick={() => handleMethodSelect('credit_card')}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Credit Card</h4>
                        <p className="text-sm text-gray-600">Visa, Mastercard</p>
                      </div>
                    </div>
                  </button>
                </motion.div>
              )}

              {/* Mobile Money Details */}
              {step === 'details' && paymentMethod === 'mobile_money' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h3 className="font-semibold text-gray-900">Mobile Money Details</h3>
                  
                  {/* Country Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Country
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="font-medium">{selectedCountry.name}</span>
                          <span className="text-gray-500 text-sm">+{selectedCountry.dialCode}</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showCountryDropdown && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {COUNTRIES.map((country) => (
                            <button
                              key={country.code}
                              onClick={() => handleCountrySelect(country)}
                              className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2"
                            >
                              <span className="text-lg">{country.flag}</span>
                              <span className="font-medium">{country.name}</span>
                              <span className="text-gray-500 text-sm">+{country.dialCode}</span>
                              {country.mtnSupported && <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">MTN</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Provider
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {getAvailableProviders().map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setProvider(p.id as 'mtn')}
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex-1 min-w-[80px] ${
                            provider === p.id
                              ? `border-2 ${p.color}`
                              : 'border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <span className="text-lg">{selectedCountry.flag}</span>
                        <span className="text-gray-600 text-sm">+{selectedCountry.dialCode}</span>
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="XXX XXX XXX"
                        className="w-full pl-20 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your {provider.toUpperCase()} mobile money number for {selectedCountry.name}
                    </p>
                    {phoneNumber && (
                      <p className="text-xs text-blue-600 mt-1">
                        Full number: +{getFullPhoneNumber()}
                      </p>
                    )}
                  </div>

                  {/* Checkout Button */}
                  <div className="pt-4">
                    <CheckoutButton
                      ticketId={selectedTicket.id}
                      userId={user?.id || ''}
                      phone={getFullPhoneNumber()}
                      quantity={quantity}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      disabled={!isPhoneNumberValid()}
                      className="w-full"
                      eventTitle={eventTitle}
                      eventDate={eventDate || new Date().toISOString()}
                      eventLocation={eventLocation || 'Location TBA'}
                      ticketTypeName={selectedTicket.name}
                      eventId={eventId}
                      eventImage={eventImage}
                    />
                  </div>
                </motion.div>
              )}


{/* Credit Card Details */}
{step === 'details' && paymentMethod === 'credit_card' && (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="space-y-6"
  >
    <h3 className="font-semibold text-gray-900">Credit Card Payment</h3>
    
    <div className="bg-blue-50 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Secure Payment via Stripe</p>
          <p className="text-xs">You will be redirected to Stripe secure checkout page to complete your payment.</p>
        </div>
      </div>
    </div>

    {/* Customer Email */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email Address
      </label>
      <input
        type="email"
        value={user?.email || ''}
        disabled
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
      />
      <p className="text-xs text-gray-500 mt-1">
        Payment confirmation will be sent to this email
      </p>
    </div>

    {/* Stripe Checkout Button */}
    <div className="pt-4">
      <StripeCheckoutButton
        ticketId={selectedTicket.id}
        userId={user?.id || ''}
        customerEmail={user?.email || ''}
        quantity={quantity}
        onSuccess={() => {
          // Stripe will redirect, so this won't really be called
          console.log('Stripe payment initiated successfully');
        }}
        onError={handlePaymentError}
        disabled={!user?.email}
        className="w-full"
        eventTitle={eventTitle}
        eventDate={eventDate || new Date().toISOString()}
        eventLocation={eventLocation || 'Location TBA'}
        ticketTypeName={selectedTicket.name}
        eventId={eventId}
        eventImage={eventImage}
      />
    </div>

    {/* Security Notice */}
    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <span>Secured by Stripe • Your payment information is encrypted</span>
    </div>
  </motion.div>
)}

              {/* Success Step - Show Generated Tickets */}
              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Success Header */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                    <p className="text-gray-600">
                      Your ticket{generatedTickets.length > 1 ? 's have' : ' has'} been generated successfully.
                      Save or share your ticket{generatedTickets.length > 1 ? 's' : ''} for event entry.
                    </p>
                  </div>

                  {/* Generated Tickets */}
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {generatedTickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onDownload={handleTicketDownload}
                        onShare={handleTicketShare}
                        onView={handleTicketView}
                      />
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        // Download all tickets
                        generatedTickets.forEach(ticket => handleTicketDownload(ticket));
                      }}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download All
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                    <h4 className="font-semibold mb-2">Important Instructions:</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Show your QR code at the event entrance for scanning</li>
                      <li>• Save a screenshot of your ticket as backup</li>
                      <li>• Arrive early to avoid queues at the entrance</li>
                      <li>• Contact support if you have any issues with your ticket</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedPaymentModal;
