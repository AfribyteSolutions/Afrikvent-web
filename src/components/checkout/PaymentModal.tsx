'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Smartphone, ArrowLeft, Globe, Download, Share2, MoreHorizontal, CheckCircle } from 'lucide-react';
import CheckoutButton from '@/components/CheckOutButton';
import { User } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { EnhancedTicket } from '@/types/ticket';
import { getCurrencyInfo } from '@/utils/currency';
import StripeCheckoutButton from '@/components/StripeCheckoutButton';
import { supabase } from '@/lib/supabaseClient'; 
import { validateDiscountCode, incrementDiscountCodeUsage } from '@/utils/discountCode';

type TicketTypeRow = Database['public']['Tables']['TICKET_TYPES']['Row'];

interface QRCodeProps {
  value: string;
  size: number;
}

const QRCode: React.FC<QRCodeProps> = ({ value, size }) => (
  <div 
    className="bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-mono border-2 border-gray-300"
    style={{ width: size, height: size }}
  >
    QR: {value.slice(-8)}
  </div>
);

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

const formatCurrency = (amount: number | null | undefined, currencyCode: string | null | undefined): string => {
  const safeAmount = amount || 0;
  const currencyInfo = getCurrencyInfo(currencyCode || undefined);
  const symbol = currencyInfo?.symbol ?? '';

  try {
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

interface TicketCardProps {
  ticket: EnhancedTicket;
  onDownload?: (ticket: EnhancedTicket) => Promise<void>;
  onShare?: (ticket: EnhancedTicket) => Promise<void>;
  onView?: (ticket: EnhancedTicket) => void;
}

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
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-100 rounded-full"></div>

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
  eventId?: number;
  eventImage?: string;
  onPaymentSuccess?: (tickets: EnhancedTicket[]) => void;
  eventCurrency: string | null; 
}

const EnhancedPaymentModal: React.FC<EnhancedPaymentModalProps> = ({
  isOpen,
  onClose,
  selectedTicket,
  quantity,
  user,
  eventTitle,
  eventDate,
  eventLocation,
  eventId,
  eventImage,
  onPaymentSuccess,
  eventCurrency
}) => {
  const [step, setStep] = useState<'method' | 'details' | 'success'>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[1]);
  const [provider, setProvider] = useState<'mtn' | 'vodafone' | 'airteltigo'>('mtn');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [generatedTickets, setGeneratedTickets] = useState<EnhancedTicket[]>([]);
  
  // Discount code states
  const [discountCode, setDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [hasValidDiscount, setHasValidDiscount] = useState(false);

  const totalAmount = (selectedTicket.price || 0) * quantity;

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    if (!eventId) {
      setDiscountError('Event ID is missing');
      return;
    }

    setIsValidatingCode(true);
    setDiscountError('');

    const result = await validateDiscountCode(discountCode.trim(), eventId);

    setIsValidatingCode(false);

    if (result.valid) {
      setHasValidDiscount(true);
      setDiscountError('');
    } else {
      setHasValidDiscount(false);
      setDiscountError(result.error || 'Invalid discount code');
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setDiscountError('');
    setHasValidDiscount(false);
  };

  const handleFreeCheckout = async () => {
    if (!user || !eventId) {
      setDiscountError('Missing user or event information');
      return;
    }
  
    if (!hasValidDiscount) {
      setDiscountError('Please apply a valid discount code first');
      return;
    }
  
    try {
      setIsValidatingCode(true);
      setDiscountError('');
  
      // Call a server-side endpoint to generate free tickets
      // This bypasses RLS issues
      const response = await fetch('/api/generate-free-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          event_id: eventId,
          ticket_type_id: selectedTicket.id,
          quantity: quantity,
          discount_code: discountCode,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate tickets');
      }
  
      const { tickets } = await response.json();
  
      if (!tickets || tickets.length === 0) {
        throw new Error('No tickets were generated');
      }
  
      // Define the ticket type from API response
      interface GeneratedTicket {
        id: number;
        qr_code_data: string;
        created_at: string;
        user_id: string;
        event_id: number;
        ticket_type_id: number;
        quantity: string;
        unit_price: number;
        total: number;
        ticket_status: string;
      }
  
      // Convert to EnhancedTicket format
      const enhancedTickets: EnhancedTicket[] = (tickets as GeneratedTicket[]).map((ticket) => ({
        id: ticket.id.toString(),
        orderId: ticket.qr_code_data,
        eventTitle: eventTitle,
        eventDate: eventDate || new Date().toISOString(),
        eventLocation: eventLocation || 'TBA',
        ticketType: selectedTicket.name || 'General Admission',
        qrCode: ticket.qr_code_data,
        status: 'confirmed',
        ticketStatus: 'active',
        eventId: eventId.toString(),
        quantity: 1,
        totalPrice: 0,
        purchaseDate: ticket.created_at || new Date().toISOString(),
        userName: user?.user_metadata?.name || user?.email || 'Guest',
      }));
  
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
  
        console.log('Sending free ticket email...');
        
        const emailResponse = await supabase.functions.invoke('send-ticket-email', {
          body: {
            userEmail: user.email,
            userName: user?.user_metadata?.name || user?.email?.split('@')[0],
            tickets: ticketsWithAccessCodes,
            eventTitle: eventTitle,
            eventDate: eventDate || new Date().toISOString(),
            eventLocation: eventLocation || 'TBA',
            isVirtual
          }
        });
  
        if (emailResponse.error) {
          console.error('Email send error:', emailResponse.error);
        } else {
          console.log('Free ticket email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't throw - tickets are already created
      }
  
      // Call success handler to show success screen
      await handlePaymentSuccess(enhancedTickets);
  
    } catch (error) {
      console.error('Error generating free tickets:', error);
      setDiscountError(
        error instanceof Error 
          ? `Failed to generate tickets: ${error.message}` 
          : 'Failed to generate tickets. Please try again.'
      );
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setStep('details');
  };

  const handleBackToMethods = () => {
    if (step === 'success') {
      setStep('method');
      setPaymentMethod(null);
      setPhoneNumber('');
      setGeneratedTickets([]);
    } else {
      setStep('method');
      setPaymentMethod(null);
    }
  };

  const handlePaymentSuccess = async (tickets: EnhancedTicket[]) => {
    setGeneratedTickets(tickets);
    setStep('success');

    // Send email with tickets
    try {
      const isVirtual = eventLocation?.toLowerCase().includes('online') || 
                       eventLocation?.toLowerCase().includes('virtual') || 
                       eventLocation?.toLowerCase().includes('zoom');

      const ticketsWithAccessCodes = tickets.map(ticket => ({
        id: ticket.id,
        orderId: ticket.orderId,
        ticketType: ticket.ticketType,
        qrCode: ticket.qrCode,
        accessCode: ticket.qrCode.slice(-6)
      }));

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      console.log('Sending ticket email...');
      
      const emailResponse = await supabase.functions.invoke('send-ticket-email', {
        body: {
          userEmail: currentUser?.email,
          userName: currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0],
          tickets: ticketsWithAccessCodes,
          eventTitle: eventTitle,
          eventDate: eventDate || new Date().toISOString(),
          eventLocation: eventLocation || 'TBA',
          isVirtual
        }
      });

      if (emailResponse.error) {
        console.error('Email send error:', emailResponse.error);
      } else {
        console.log('Ticket email sent successfully');
      }
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    if (onPaymentSuccess) {
      onPaymentSuccess(tickets);
    }
  };

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
  };

  const handleCloseModal = () => {
    onClose();
    setTimeout(() => {
      setStep('method');
      setPaymentMethod(null);
      setPhoneNumber('');
      setGeneratedTickets([]);
      setDiscountCode('');
      setDiscountError('');
      setHasValidDiscount(false);
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
    alert(`Downloading ticket ${ticket.orderId}...`);
  };

  const handleTicketShare = async (ticket: EnhancedTicket) => {
    console.log('Sharing ticket:', ticket.orderId);
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

              {step === 'method' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
                  
                  {/* Discount Code Section */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">Have a Free Ticket Code?</h4>
                    </div>

                    {!hasValidDiscount ? (
                      <>
                        <p className="text-sm text-gray-600 mb-3">
                          Enter your discount code to get free tickets
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => {
                              setDiscountCode(e.target.value.toUpperCase());
                              setDiscountError('');
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleValidateDiscount()}
                            placeholder="Enter code (e.g. FREE100)"
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 uppercase font-mono text-sm"
                            disabled={isValidatingCode}
                          />
                          <button
                            onClick={handleValidateDiscount}
                            disabled={isValidatingCode || !discountCode.trim()}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
                          >
                            {isValidatingCode ? 'Checking...' : 'Apply'}
                          </button>
                        </div>
                        {discountError && (
                          <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {discountError}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-bold text-green-800">Code &quot;{discountCode}&quot; Applied!</span>
                            </div>
                            <button
                              onClick={handleRemoveDiscount}
                              className="text-gray-500 hover:text-gray-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                          <p className="text-sm text-green-700">✨ You&apos;re getting {quantity} free ticket{quantity > 1 ? 's' : ''}!</p>
                        </div>

                        <button
                          onClick={handleFreeCheckout}
                          disabled={isValidatingCode}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold text-base transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isValidatingCode ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating Tickets...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Get Free Tickets
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Only show payment options if no valid discount */}
                  {!hasValidDiscount && (
                    <>
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">Or pay with</span>
                        </div>
                      </div>

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
                    </>
                  )}
                </motion.div>
              )}

              {step === 'details' && paymentMethod === 'mobile_money' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h3 className="font-semibold text-gray-900">Mobile Money Details</h3>
                  
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Provider
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {getAvailableProviders().map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setProvider(p.id as 'mtn' | 'vodafone' | 'airteltigo')}
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
                  <div className="pt-4">
                    <CheckoutButton
                      ticketId={selectedTicket.id}
                      userId={user?.id || ''}
                      phone={getFullPhoneNumber()}
                      userEmail={user?.email ?? ''}  
                      ticketPrice={selectedTicket.price as number} 
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

                  <div className="pt-4">
                    <StripeCheckoutButton
                      ticketId={selectedTicket.id}
                      userId={user?.id || ''}
                      customerEmail={user?.email || ''}
                      quantity={quantity}
                      onSuccess={() => {
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

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secured by Stripe • Your payment information is encrypted</span>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
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

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
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