"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Download, Share2, Copy, CheckCircle, Clock, MapPin, MoreHorizontal } from 'lucide-react';
import { QRCode } from './QRCodeComponent';
import { EnhancedTicket, User } from '@/types/ticket';
import { 
  formatTicketDate, 
  formatTicketTime, 
  getDaysUntilEvent, 
  getStatusColor,
  enhanceTicket 
} from '@/utils/ticketUtils';

interface TicketCardProps {
  ticket: EnhancedTicket;
  template?: string;
  onDownload?: (ticket: EnhancedTicket) => Promise<void>;
  onShare?: (ticket: EnhancedTicket) => Promise<void>;
  onCopy?: (ticket: EnhancedTicket) => void;
  onView?: (ticket: EnhancedTicket) => void;
  user?: User;
  className?: string;
}

// Vibrant, high-contrast colors that look great with white text
const TICKET_COLORS = [
  { bg: '#E53E3E', accent: '#C53030' }, // Bold Red
  { bg: '#D53F8C', accent: '#B83280' }, // Hot Pink
  { bg: '#9F7AEA', accent: '#805AD5' }, // Deep Purple
  { bg: '#667EEA', accent: '#5A67D8' }, // Royal Blue
  { bg: '#4299E1', accent: '#3182CE' }, // Ocean Blue
  { bg: '#0BC5EA', accent: '#00B5D8' }, // Cyan
  { bg: '#38B2AC', accent: '#319795' }, // Teal
  { bg: '#48BB78', accent: '#38A169' }, // Emerald Green
  { bg: '#68D391', accent: '#48BB78' }, // Lime Green
  { bg: '#ECC94B', accent: '#D69E2E' }, // Bright Yellow
  { bg: '#ED8936', accent: '#DD6B20' }, // Orange
  { bg: '#F56565', accent: '#E53E3E' }, // Bright Coral
  { bg: '#FC8181', accent: '#F56565' }, // Salmon
  { bg: '#F687B3', accent: '#ED64A6' }, // Rose Pink
  { bg: '#B794F6', accent: '#9F7AEA' }, // Lavender
  { bg: '#63B3ED', accent: '#4299E1' }, // Sky Blue
  { bg: '#4FD1C7', accent: '#38B2AC' }, // Turquoise
  { bg: '#9AE6B4', accent: '#68D391' }, // Mint
  { bg: '#F6E05E', accent: '#ECC94B' }, // Golden
  { bg: '#FBB6CE', accent: '#F687B3' }, // Bubblegum Pink
];

const generateRandomColor = (ticketId: string) => {
  // Use ticket ID to ensure consistent color for the same ticket
  const hash = ticketId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const index = Math.abs(hash) % TICKET_COLORS.length;
  return TICKET_COLORS[index];
};

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  template = 'random',
  onDownload,
  onShare,
  onCopy,
  onView,
  user,
  className = '',
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [cardColors, setCardColors] = useState({ bg: '#0BBCD6', accent: '#FFFFFF' });

  // Set random colors based on ticket ID for consistency
  useEffect(() => {
    const colors = generateRandomColor(ticket.id);
    setCardColors(colors);
  }, [ticket.id]);

  const handleDownload = async () => {
    if (!ticketRef.current || isDownloading) return;
    setIsDownloading(true);
    
    try {
      if (onDownload) {
        await onDownload(ticket);
      } else {
        // Fallback download implementation
        console.log('Download ticket:', ticket.orderId);
        // You can implement html2canvas here for actual image generation
        alert(`Ticket ${ticket.orderId} download started`);
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      alert('Failed to download ticket. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    try {
      if (onShare) {
        await onShare(ticket);
      } else {
        const shareText = `🎫 ${ticket.eventTitle}\n📅 ${formatTicketDate(ticket.eventDate)} at ${formatTicketTime(ticket.eventDate)}\n📍 ${ticket.eventLocation}\n🎟️ Order: ${ticket.orderId}`;
        
        if (navigator.share) {
          await navigator.share({
            title: `${ticket.eventTitle} - Ticket`,
            text: shareText,
            url: `${window.location.origin}/tickets/${ticket.id}`,
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          alert('Ticket details copied to clipboard!');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing ticket:', error);
        alert('Failed to share ticket. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(ticket);
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(ticket.orderId);
        alert('Order ID copied to clipboard!');
      }
    }
  };

  const handleView = () => {
    if (onView) {
      onView(ticket);
    } else {
      console.log('Viewing ticket details:', ticket.id);
    }
  };

  const isExpired = ticket.ticketStatus === 'expired';
  const daysUntil = getDaysUntilEvent(ticket.eventDate);
  const statusColorClass = getStatusColor(ticket.ticketStatus);

  return (
    <div className={`relative max-w-sm mx-auto ${className}`}>
      {/* Main Ticket Card */}
      <div
        ref={ticketRef}
        className="relative rounded-t-3xl rounded-b-lg overflow-hidden shadow-2xl"
        style={{ backgroundColor: cardColors.bg, color: '#FFFFFF' }}
      >
        {/* Decorative notch at top */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-gray-100 rounded-full"></div>

        {/* Header Section */}
        <div className="flex justify-between items-start p-4 pt-6">
          <div>
            <div className="text-xs font-medium opacity-90 mb-1">
              {formatTicketDate(ticket.eventDate)}
            </div>
            <div className="text-sm font-bold">
              {formatTicketTime(ticket.eventDate)}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Share ticket"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Download ticket"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleView}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="View details"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="px-4 pb-6">
          {/* Ticket Type and Order ID Row */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-xs opacity-80 mb-1">Ticket Type</div>
              <div className="font-semibold text-sm">{ticket.ticketType}</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-80 mb-1">Order ID</div>
              <div className="font-mono text-xs">{ticket.orderId}</div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <div className="text-xs opacity-80 mb-1">Place</div>
            <div className="text-sm leading-snug">
              {ticket.eventLocation}
            </div>
          </div>

          {/* Event Type - Online or In-Person */}
          <div className="mb-8">
            <div className="text-xs opacity-80 mb-1">Format</div>
            <div className="text-sm">
              {ticket.eventLocation.toLowerCase().includes('online') || 
               ticket.eventLocation.toLowerCase().includes('virtual') || 
               ticket.eventLocation.toLowerCase().includes('zoom') ? 'Online' : 'In-Person'}
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg">
              <QRCode
                value={ticket.qrCode}
                size={120}
                level="M"
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
          </div>

          {/* Event Title at bottom */}
          <div className="text-center mt-4">
            <div className="text-sm font-medium opacity-90">
              {ticket.eventTitle}
            </div>
          </div>
        </div>
      </div>



      {/* Copy Action - Hidden but accessible */}
      <button
        onClick={handleCopy}
        className="sr-only"
        aria-label="Copy order ID to clipboard"
      >
        Copy Order ID
      </button>
    </div>
  );
};