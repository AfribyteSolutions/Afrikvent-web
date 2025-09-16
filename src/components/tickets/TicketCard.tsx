// src/components/tickets/TicketCard.tsx
"use client";
import React, { useRef, useState } from 'react';
import { Download, Share2, Copy, Calendar, MapPin, Clock, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import { QRCode } from './QRCodeComponent';
import { EnhancedTicket, TicketTemplate, User } from '@/types/ticket';
import { formatTicketDate, formatTicketTime, getDaysUntilEvent, getStatusColor } from '@/utils/ticketUtils';
import { getTemplateById, getTemplateStyles } from '@/config/ticketTemplates';

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

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  template = 'classic',
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

  const ticketTemplate = getTemplateById(template);
  const templateStyles = getTemplateStyles(ticketTemplate);

  // Use a vibrant teal/cyan color scheme to match the reference
  const cardStyles = {
    backgroundColor: '#0BBCD6', // Vibrant teal
    color: '#FFFFFF',
    accentColor: '#FFFFFF'
  };

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      if (onDownload) {
        await onDownload(ticket);
      } else {
        // Default download implementation using canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx && ticketRef.current) {
          // Simple canvas implementation - in production, use html2canvas
          canvas.width = 800;
          canvas.height = 400;
          ctx.fillStyle = cardStyles.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = cardStyles.color;
          ctx.font = '20px Arial';
          ctx.fillText(ticket.eventTitle, 20, 50);

          const link = document.createElement('a');
          link.download = `afrivents-ticket-${ticket.orderId}.png`;
          link.href = canvas.toDataURL('image/png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      alert('Failed to download ticket. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (onShare) {
        await onShare(ticket);
      } else {
        // Default share implementation
        if (navigator.share) {
          await navigator.share({
            title: `${ticket.eventTitle} - Ticket`,
            text: `My ticket for ${ticket.eventTitle} on ${formatTicketDate(ticket.eventDate)}`,
            url: `${window.location.origin}/tickets/${ticket.id}`,
          });
        } else {
          // Fallback for browsers without Web Share API
          const shareText = `🎫 ${ticket.eventTitle}\n📅 ${formatTicketDate(ticket.eventDate)} at ${formatTicketTime(ticket.eventDate)}\n📍 ${ticket.eventLocation}\n🎟️ Order: ${ticket.orderId}`;
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            alert('Ticket details copied to clipboard!');
          } else {
            // Even more fallback
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Ticket details copied to clipboard!');
          }
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
      // Default copy implementation
      if (navigator.clipboard) {
        navigator.clipboard.writeText(ticket.orderId);
        alert('Order ID copied to clipboard!');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = ticket.orderId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Order ID copied to clipboard!');
      }
    }
  };

  const handleView = () => {
    if (onView) {
      onView(ticket);
    } else {
      // Default view implementation
      console.log('Viewing ticket:', ticket.id);
    }
  };

  const isExpired = ticket.ticketStatus === 'expired';
  const daysUntil = getDaysUntilEvent(ticket.eventDate);

  return (
    <div className={`relative max-w-sm mx-auto ${className}`}>
      {/* Main Ticket Card */}
      <div
        ref={ticketRef}
        className="relative rounded-t-3xl rounded-b-lg overflow-hidden shadow-2xl"
        style={{ backgroundColor: cardStyles.backgroundColor }}
      >
        {/* Large notch at top center */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-gray-100 rounded-full"></div>

        {/* Header Section with Date/Time and Actions in corners */}
        <div className="flex justify-between items-start p-4 pt-6 relative">
          <div>
            <div className="text-xs font-medium opacity-90 mb-1">
              {formatTicketDate(ticket.eventDate).split(',')[0]} {/* Date only */}
            </div>
            <div className="text-sm font-bold">
              {formatTicketTime(ticket.eventDate)}
            </div>
          </div>
          
          {/* Action Icons moved to top right corner */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <Share2 className="w-4 h-4" color={cardStyles.color} />
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <Download className="w-4 h-4" color={cardStyles.color} />
            </button>
            <button
              onClick={handleView}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" color={cardStyles.color} />
            </button>
          </div>
        </div>

        {/* Ticket Details Section */}
        <div className="px-4 pb-4">
          {/* Ticket Type and Order ID */}
          <div className="mb-3">
            <div className="text-xs opacity-80 mb-1">Ticket Type</div>
            <div className="font-semibold text-sm">{ticket.ticketType}</div>
          </div>
          
          <div className="mb-4">
            <div className="text-xs opacity-80 mb-1">Order ID</div>
            <div className="font-bold text-sm tracking-wide">{ticket.orderId}</div>
          </div>

          {/* Event Location */}
          <div className="mb-6">
            <div className="text-xs opacity-80 mb-1">Place</div>
            <div className="text-xs leading-snug">
              {ticket.eventLocation}
            </div>
          </div>

          {/* Decorative tear line before QR code */}
          <div className="relative mb-4">
            <div className="border-t border-dashed border-white border-opacity-30"></div>
            <div className="absolute -left-4 -top-2 w-4 h-4 bg-gray-100 rounded-full"></div>
            <div className="absolute -right-4 -top-2 w-4 h-4 bg-gray-100 rounded-full"></div>
          </div>

          {/* QR Code Section */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <QRCode
                value={ticket.qrCode}
                size={120}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                level="M"
              />
            </div>
          </div>

          {/* Scan Instructions */}
          <div className="text-center mt-3">
            <div className="text-xs font-medium opacity-90">
              {ticket.eventTitle}
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      {!isExpired && (
        <div className="absolute top-2 left-4 z-10">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
            {daysUntil >= 0 && (
              <span className="ml-1">
                ({daysUntil === 0 ? 'Today' : `${daysUntil}d`})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Hidden Action Buttons for Accessibility */}
      <div className="sr-only">
        <button onClick={handleCopy}>Copy Order ID</button>
        <button onClick={handleView}>View Full Details</button>
      </div>
    </div>
  );
};