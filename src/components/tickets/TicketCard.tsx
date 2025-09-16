// src/components/tickets/TicketCard.tsx
"use client";
import React, { useRef, useState } from 'react';
import { Download, Share2, Copy, Calendar, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
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
          ctx.fillStyle = templateStyles.backgroundColor || '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = templateStyles.color || '#000000';
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
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* Downloadable Ticket Section */}
      <div ref={ticketRef} className="relative" style={templateStyles}>
        {/* Afrivents Logo */}
        {ticketTemplate.showLogo && (
          <div className={`absolute ${
            ticketTemplate.logoPosition === 'top-left' ? 'top-4 left-4' :
            ticketTemplate.logoPosition === 'top-right' ? 'top-4 right-4' :
            'top-4 left-1/2 transform -translate-x-1/2'
          } z-20`}>
            <div className="text-lg font-bold" style={{ color: ticketTemplate.accentColor }}>
              AFRIVENTS
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.ticketStatus)}`}>
            {isExpired ? <XCircle className="w-4 h-4 mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
            {isExpired ? 'Expired' : 'Active'}
            {!isExpired && daysUntil >= 0 && (
              <span className="ml-1 text-xs">
                ({daysUntil === 0 ? 'Today' : `${daysUntil}d`})
              </span>
            )}
          </span>
        </div>

        {/* Main Ticket Content */}
        <div className="p-6 pt-16">
          <div className={`flex flex-col ${ticketTemplate.qrPosition === 'right' ? 'lg:flex-row' : ''} gap-6`}>
            {/* Event Details Section */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-4 pr-20" style={{ color: templateStyles.color }}>
                {ticket.eventTitle}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center" style={{ color: templateStyles.color }}>
                  <Calendar className="w-5 h-5 mr-3" style={{ color: ticketTemplate.accentColor }} />
                  <span className="font-medium">{formatTicketDate(ticket.eventDate)}</span>
                </div>
                
                <div className="flex items-center" style={{ color: templateStyles.color }}>
                  <Clock className="w-5 h-5 mr-3" style={{ color: ticketTemplate.accentColor }} />
                  <span>{formatTicketTime(ticket.eventDate)}</span>
                </div>
                
                <div className="flex items-center" style={{ color: templateStyles.color }}>
                  <MapPin className="w-5 h-5 mr-3" style={{ color: ticketTemplate.accentColor }} />
                  <span className="text-sm">{ticket.eventLocation}</span>
                </div>
              </div>

              {/* Ticket Details Grid */}
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: ticketTemplate.backgroundColor === '#1f2937' ? '#374151' : '#f9fafb' }}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium" style={{ color: templateStyles.color }}>Type:</span>
                    <p className="font-semibold" style={{ color: ticketTemplate.accentColor }}>{ticket.ticketType}</p>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: templateStyles.color }}>Qty:</span>
                    <p className="font-semibold" style={{ color: ticketTemplate.accentColor }}>{ticket.quantity}</p>
                  </div>
                  {ticket.seatNumber && (
                    <div>
                      <span className="font-medium" style={{ color: templateStyles.color }}>Seat:</span>
                      <p className="font-semibold" style={{ color: ticketTemplate.accentColor }}>{ticket.seatNumber}</p>
                    </div>
                  )}
                  {ticket.gate && (
                    <div>
                      <span className="font-medium" style={{ color: templateStyles.color }}>Gate:</span>
                      <p className="font-semibold" style={{ color: ticketTemplate.accentColor }}>{ticket.gate}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="font-medium" style={{ color: templateStyles.color }}>Order ID:</span>
                    <p className="font-mono text-lg font-bold" style={{ color: ticketTemplate.accentColor }}>
                      {ticket.orderId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            {ticketTemplate.qrPosition === 'right' && (
              <div className="flex flex-col items-center justify-center rounded-lg p-6 min-w-[200px]" 
                   style={{ backgroundColor: ticketTemplate.backgroundColor === '#1f2937' ? '#374151' : '#f9fafb' }}>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <QRCode
                    value={ticket.qrCode}
                    size={120}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    level="M"
                  />
                </div>
                <p className="text-xs mt-3 text-center opacity-75" style={{ color: templateStyles.color }}>
                  Scan at venue entrance
                </p>
              </div>
            )}
          </div>

          {/* QR Code at Bottom */}
          {ticketTemplate.qrPosition === 'bottom' && (
            <div className="mt-6 flex justify-center">
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg shadow-sm inline-block">
                  <QRCode
                    value={ticket.qrCode}
                    size={120}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    level="M"
                  />
                </div>
                <p className="text-xs mt-3 opacity-75" style={{ color: templateStyles.color }}>
                  Scan at venue entrance
                </p>
              </div>
            </div>
          )}

          {/* Decorative Tear Line */}
          <div className="mt-6 border-t-2 border-dashed relative" style={{ borderColor: ticketTemplate.accentColor }}>
            <div className="absolute -left-6 -top-3 w-6 h-6 rounded-full" style={{ backgroundColor: templateStyles.backgroundColor }}></div>
            <div className="absolute -right-6 -top-3 w-6 h-6 rounded-full" style={{ backgroundColor: templateStyles.backgroundColor }}></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
          
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {isSharing ? 'Sharing...' : 'Share'}
          </button>
          
          <button
            onClick={handleCopy}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy ID
          </button>

          <button
            onClick={handleView}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
