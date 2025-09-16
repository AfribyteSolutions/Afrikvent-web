// src/components/tickets/StackedTicketCard.tsx
"use client";
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Download, Share2, Copy, Calendar, MapPin, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { QRCode } from './QRCodeComponent';
import { EnhancedTicket, TicketTemplate, User } from '@/types/ticket';
import { formatTicketDate, formatTicketTime, getDaysUntilEvent, getStatusColor } from '@/utils/ticketUtils';
import { getTemplateById, getTemplateStyles } from '@/config/ticketTemplates';

interface StackedTicketCardProps {
  tickets: EnhancedTicket[];
  template?: string;
  onDownload?: (ticket: EnhancedTicket) => Promise<void>;
  onShare?: (ticket: EnhancedTicket) => Promise<void>;
  onCopy?: (ticket: EnhancedTicket) => void;
  onView?: (ticket: EnhancedTicket) => void;
  user?: User;
  className?: string;
}

interface SingleTicketProps {
  ticket: EnhancedTicket;
  template: string;
  onDownload?: (ticket: EnhancedTicket) => Promise<void>;
  onShare?: (ticket: EnhancedTicket) => Promise<void>;
  onCopy?: (ticket: EnhancedTicket) => void;
  onView?: (ticket: EnhancedTicket) => void;
  user?: User;
  isActive?: boolean;
  zIndex: number;
  translateY: number;
  scale: number;
  onPull: (deltaY: number) => void;
  onRelease: () => void;
}

const SingleTicketCard: React.FC<SingleTicketProps> = ({
  ticket,
  template,
  onDownload,
  onShare,
  onCopy,
  onView,
  user,
  isActive = false,
  zIndex,
  translateY,
  scale,
  onPull,
  onRelease,
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  const ticketTemplate = getTemplateById(template);
  const templateStyles = getTemplateStyles(ticketTemplate);

  // Touch/Mouse handlers
  const handleStart = (clientY: number) => {
    if (!isActive) return;
    setIsDragging(true);
    setStartY(clientY);
    setCurrentY(clientY);
  };

  const handleMove = (clientY: number) => {
    if (!isDragging || !isActive) return;
    const deltaY = clientY - startY;
    setCurrentY(clientY);
    onPull(deltaY);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    onRelease();
  };

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    
    setIsDownloading(true);
    try {
      if (onDownload) {
        await onDownload(ticket);
      } else {
        // Default download implementation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx && ticketRef.current) {
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
        if (navigator.share) {
          await navigator.share({
            title: `${ticket.eventTitle} - Ticket`,
            text: `My ticket for ${ticket.eventTitle} on ${formatTicketDate(ticket.eventDate)}`,
            url: `${window.location.origin}/tickets/${ticket.id}`,
          });
        } else {
          const shareText = `🎫 ${ticket.eventTitle}\n📅 ${formatTicketDate(ticket.eventDate)} at ${formatTicketTime(ticket.eventDate)}\n📍 ${ticket.eventLocation}\n🎟️ Order: ${ticket.orderId}`;
          
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
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
      console.log('Viewing ticket:', ticket.id);
    }
  };

  const isExpired = ticket.ticketStatus === 'expired';
  const daysUntil = getDaysUntilEvent(ticket.eventDate);

  return (
    <div 
      ref={ticketRef}
      className={`absolute w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ${
        isActive ? 'cursor-grab' : 'cursor-pointer'
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{
        zIndex,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transition: isDragging ? 'none' : 'all 0.3s ease-out',
      }}
      onMouseDown={(e) => handleStart(e.clientY)}
      onMouseMove={(e) => handleMove(e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
      onTouchMove={(e) => {
        e.preventDefault();
        handleMove(e.touches[0].clientY);
      }}
      onTouchEnd={handleEnd}
    >
      {/* Ticket Content */}
      <div className="relative" style={templateStyles}>
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
          <div className="flex flex-col lg:flex-row gap-6">
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
          </div>

          {/* Decorative Tear Line */}
          <div className="mt-6 border-t-2 border-dashed relative" style={{ borderColor: ticketTemplate.accentColor }}>
            <div className="absolute -left-6 -top-3 w-6 h-6 rounded-full" style={{ backgroundColor: templateStyles.backgroundColor }}></div>
            <div className="absolute -right-6 -top-3 w-6 h-6 rounded-full" style={{ backgroundColor: templateStyles.backgroundColor }}></div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Only show for active ticket */}
      {isActive && (
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
      )}
    </div>
  );
};

// Enhanced TicketsSection to work with stacked cards
export const EnhancedTicketsSection: React.FC<{
  userTickets: EnhancedTicket[];
  user?: User;
  onTabChange?: (tab: 'active' | 'expired') => void;
  isLoading?: boolean;
  error?: string | null;
}> = ({
  userTickets,
  user,
  onTabChange,
  isLoading = false,
  error = null,
}) => {
  const [ticketFilter, setTicketFilter] = useState<'active' | 'expired'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [viewMode, setViewMode] = useState<'stacked' | 'grid'>('stacked');

  // Enhanced tickets with QR codes and additional data
  const enhancedTickets = useMemo(() => 
    userTickets.map((userTicket: EnhancedTicket) => ({
      ...userTicket,
      qrCode: userTicket.qrCode || `${userTicket.orderId}-${userTicket.id}`,
      ticketStatus: new Date(userTicket.eventDate) > new Date() ? 'active' : 'expired'
    } as EnhancedTicket)), 
    [userTickets]
  );

  // Filtered tickets based on current filters
  const filteredTickets = useMemo(() => {
    const statusFiltered = enhancedTickets.filter(enhancedTicket => 
      enhancedTicket.ticketStatus === ticketFilter
    );
    
    return statusFiltered.filter(enhancedTicket => {
      // Search filter
      if (searchTerm && !enhancedTicket.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !enhancedTicket.eventLocation.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !enhancedTicket.orderId.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Date filter
      if (dateFilter !== 'all') {
        const ticketDate = new Date(enhancedTicket.eventDate);
        const now = new Date();
        
        switch (dateFilter) {
          case 'upcoming':
            return ticketDate > now;
          case 'thisWeek':
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return ticketDate >= now && ticketDate <= weekFromNow;
          case 'thisMonth':
            const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            return ticketDate >= now && ticketDate <= monthFromNow;
          case 'past':
            return ticketDate < now;
          default:
            return true;
        }
      }
      
      return true;
    });
  }, [enhancedTickets, ticketFilter, searchTerm, dateFilter]);

  // Notify parent of tab changes
  useEffect(() => {
    if (onTabChange) {
      onTabChange(ticketFilter);
    }
  }, [ticketFilter, onTabChange]);

  // Handle ticket actions
  const handleDownload = async (ticketToDownload: EnhancedTicket) => {
    console.log('Downloading ticket:', ticketToDownload.orderId);
  };

  const handleShare = async (ticketToShare: EnhancedTicket) => {
    console.log('Sharing ticket:', ticketToShare.orderId);
  };

  const handleCopy = (ticketToCopy: EnhancedTicket) => {
    console.log('Copying ticket ID:', ticketToCopy.orderId);
  };

  const handleView = (ticketToView: EnhancedTicket) => {
    console.log('Viewing ticket details:', ticketToView.id);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-300 rounded mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Error Loading Tickets
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (userTickets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-sm mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No tickets yet
          </h3>
          <p className="text-gray-600 mb-6">
            You have not purchased any tickets yet. Start exploring events!
          </p>
          <button 
            onClick={() => {/* Navigate to events */}}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  const activeTickets = enhancedTickets.filter(ticket => ticket.ticketStatus === 'active');
  const expiredTickets = enhancedTickets.filter(ticket => ticket.ticketStatus === 'expired');

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Sub-tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTicketFilter('active')}
              className={`flex-1 py-2 px-6 rounded-md text-sm font-medium transition-colors ${
                ticketFilter === 'active'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active ({activeTickets.length})
            </button>
            <button
              onClick={() => setTicketFilter('expired')}
              className={`flex-1 py-2 px-6 rounded-md text-sm font-medium transition-colors ${
                ticketFilter === 'expired'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Expired ({expiredTickets.length})
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="past">Past Events</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                viewMode === 'stacked' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Stacked
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredTickets.length} {ticketFilter} tickets
          </p>
          {(searchTerm || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('all');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Tickets Display */}
      {filteredTickets.length > 0 ? (
        viewMode === 'stacked' ? (
          <div className="max-w-md mx-auto">
            <StackedTicketCard
              tickets={filteredTickets}
              template={selectedTemplate}
              onDownload={handleDownload}
              onShare={handleShare}
              onCopy={handleCopy}
              onView={handleView}
              user={user}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredTickets.map(ticketItem => (
              <SingleTicketCard
                key={ticketItem.id}
                ticket={ticketItem}
                template={selectedTemplate}
                onDownload={handleDownload}
                onShare={handleShare}
                onCopy={handleCopy}
                onView={handleView}
                user={user}
                isActive={true}
                zIndex={1}
                translateY={0}
                scale={1}
                onPull={() => {}}
                onRelease={() => {}}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <div className="max-w-sm mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No {ticketFilter} tickets found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || dateFilter !== 'all' 
                ? "No tickets match your current filters. Try adjusting your search criteria."
                : `You don't have any ${ticketFilter} tickets at the moment.`
              }
            </p>
            {(searchTerm || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('all');
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const StackedTicketCard: React.FC<StackedTicketCardProps> = ({
  tickets,
  template = 'classic',
  onDownload,
  onShare,
  onCopy,
  onView,
  user,
  className = '',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate positions and scales for stacked effect
  const getTicketStyle = (index: number) => {
    const isActive = index === activeIndex;
    const offset = index - activeIndex;
    
    let translateY = 0;
    let scale = 1;
    const stackIndex = tickets.length - Math.abs(offset);

    if (isActive && pullDistance > 0) {
      // Active card being pulled
      translateY = Math.min(pullDistance, 100);
    } else if (offset > 0) {
      // Cards behind the active one
      translateY = offset * 20 + Math.max(0, pullDistance * 0.3);
      scale = 1 - (offset * 0.05);
    } else if (offset < 0) {
      // Cards in front (shouldn't happen with current logic)
      translateY = offset * 20;
      scale = 1 + (offset * 0.05);
    }

    return { translateY, scale, zIndex: stackIndex };
  };

  const handlePull = (deltaY: number) => {
    if (deltaY > 0) {
      setPullDistance(deltaY);
    }
  };

  const handleRelease = () => {
    if (pullDistance > 50 && activeIndex < tickets.length - 1) {
      // Switch to next ticket if pulled enough
      setActiveIndex(prev => prev + 1);
    }
    setPullDistance(0);
  };

  const handleTicketClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  if (tickets.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`relative h-96 ${className}`}
      style={{ minHeight: '400px' }}
    >
      {/* Stacked Tickets */}
      {tickets.map((ticketItem, index) => {
        const { translateY, scale, zIndex } = getTicketStyle(index);
        return (
          <div
            key={ticketItem.id}
            onClick={() => handleTicketClick(index)}
          >
            <SingleTicketCard
              ticket={ticketItem}
              template={template}
              onDownload={onDownload}
              onShare={onShare}
              onCopy={onCopy}
              onView={onView}
              user={user}
              isActive={index === activeIndex}
              zIndex={zIndex}
              translateY={translateY}
              scale={scale}
              onPull={handlePull}
              onRelease={handleRelease}
            />
          </div>
        );
      })}

      {/* Stack Indicator */}
      {tickets.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-50">
          {tickets.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'bg-blue-500 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Instructions */}
      {tickets.length > 1 && activeIndex < tickets.length - 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded-full">
            Pull down to see next ticket
          </div>
        </div>
      )}
    </div>
  );
};