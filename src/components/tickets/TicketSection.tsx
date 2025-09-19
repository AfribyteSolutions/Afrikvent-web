"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Search, Filter, Download, Share2, Copy, Eye, Grid, List } from 'lucide-react';
import { supabase } from "@/lib/supabaseClient";

// Database types
import { Database } from "@/types/database.types";
type TicketRow = Database["public"]["Tables"]["TICKETS"]["Row"];
type TicketTypeRow = Database["public"]["Tables"]["TICKET_TYPES"]["Row"];
type EventRow = Database["public"]["Tables"]["EVENTS"]["Row"];

// Import application types instead of redefining them
import { UserTicket, User } from "@/types/index";

interface EnhancedTicket extends UserTicket {
  ticketStatus: 'active' | 'expired';
  orderId: string;
  eventDateTime: Date;
  isUpcoming: boolean;
  isPast: boolean;
  daysUntilEvent: number;
}

interface TicketFilterState {
  search: string;
  dateRange: string;
  status: 'active' | 'expired';
}

interface TicketsSectionProps {
  userTickets?: UserTicket[];
  user?: User;
  onTabChange?: (tab: 'active' | 'expired') => void;
  isLoading?: boolean;
  error?: string | null;
  userId?: string;
}

// Mock ticket templates for the template selector
const TICKET_TEMPLATES = [
  { id: 'classic', name: 'Classic' },
  { id: 'modern', name: 'Modern' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'colorful', name: 'Colorful' }
];

// Utility functions
const enhanceTicket = (ticket: UserTicket): EnhancedTicket => {
  const eventDateTime = new Date(ticket.eventDate);
  const now = new Date();
  const isUpcoming = eventDateTime > now;
  const isPast = eventDateTime <= now;
  const daysUntilEvent = Math.ceil((eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    ...ticket,
    ticketStatus: isUpcoming ? 'active' : 'expired',
    orderId: `ORD-${ticket.id.toString().padStart(6, '0')}`,
    eventDateTime,
    isUpcoming,
    isPast,
    daysUntilEvent,
  };
};

const filterTickets = (tickets: EnhancedTicket[], filters: TicketFilterState): EnhancedTicket[] => {
  return tickets.filter(ticket => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        ticket.eventTitle.toLowerCase().includes(searchLower) ||
        ticket.eventLocation.toLowerCase().includes(searchLower) ||
        ticket.orderId.toLowerCase().includes(searchLower) ||
        ticket.ticketType.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const eventDate = ticket.eventDateTime;
      
      switch (filters.dateRange) {
        case 'upcoming':
          if (!ticket.isUpcoming) return false;
          break;
        case 'thisWeek':
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (eventDate < now || eventDate > weekFromNow) return false;
          break;
        case 'thisMonth':
          const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          if (eventDate < now || eventDate > monthFromNow) return false;
          break;
        case 'past':
          if (ticket.isUpcoming) return false;
          break;
      }
    }

    return true;
  });
};

// Enhanced ticket card component with better styling
const TicketCard: React.FC<{
  ticket: EnhancedTicket;
  template: string;
  onDownload: (ticket: EnhancedTicket) => void;
  onShare: (ticket: EnhancedTicket) => void;
  onCopy: (ticket: EnhancedTicket) => void;
  onView: (ticket: EnhancedTicket) => void;
  user?: User;
  className?: string;
}> = ({ ticket, template, onDownload, onShare, onCopy, onView, user, className }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Template-based styling
  const getTemplateColors = () => {
    switch (template) {
      case 'modern':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-blue-50',
          border: 'border-purple-200',
          accent: 'bg-purple-500',
          text: 'text-purple-900',
        };
      case 'minimal':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          accent: 'bg-gray-800',
          text: 'text-gray-900',
        };
      case 'colorful':
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-pink-50',
          border: 'border-orange-200',
          accent: 'bg-orange-500',
          text: 'text-orange-900',
        };
      default: // classic
        return {
          bg: 'bg-white',
          border: 'border-gray-200',
          accent: ticket.ticketStatus === 'active' ? 'bg-green-500' : 'bg-gray-400',
          text: 'text-gray-900',
        };
    }
  };

  const colors = getTemplateColors();

  return (
    <div className={`${colors.bg} rounded-lg shadow-sm border ${colors.border} overflow-hidden transition-all hover:shadow-md ${className || ''}`}>
      {/* Status indicator bar */}
      <div className={`h-2 ${colors.accent}`} />
      
      <div className="p-6">
        {/* Header with event info */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className={`font-bold ${colors.text} text-lg leading-tight mb-1`}>
              {ticket.eventTitle}
            </h3>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              📍 {ticket.eventLocation}
            </p>
          </div>
          <div className="text-right ml-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              ticket.ticketStatus === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {ticket.ticketStatus === 'active' ? '🎫 Active' : '⏰ Expired'}
            </span>
            {ticket.isUpcoming && (
              <p className="text-xs text-gray-500 mt-1">
                {ticket.daysUntilEvent > 0 ? `${ticket.daysUntilEvent} days` : 'Today!'}
              </p>
            )}
          </div>
        </div>

        {/* Event details grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date & Time</p>
              <p className="font-semibold text-sm">{formatDate(ticket.eventDate)}</p>
              <p className="text-sm text-gray-600">{formatTime(ticket.eventDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ticket Type</p>
              <p className="font-semibold text-sm">{ticket.ticketType}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</p>
              <p className="font-semibold text-sm">{ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Price</p>
              <p className="font-bold text-lg">${ticket.totalPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Order ID */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order ID</p>
          <p className="font-mono text-sm font-medium">{ticket.orderId}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onView(ticket)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onDownload(ticket)}
              className="flex items-center justify-center py-3 px-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onShare(ticket)}
              className="flex items-center justify-center py-3 px-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
              title="Share Ticket"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onCopy(ticket)}
              className="flex items-center justify-center py-3 px-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
              title="Copy Order ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TicketsSection: React.FC<TicketsSectionProps> = ({
  userTickets: propUserTickets = [],
  user,
  onTabChange,
  isLoading: propIsLoading = false,
  error: propError = null,
  userId,
}) => {
  const [ticketFilter, setTicketFilter] = useState<'active' | 'expired'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Local state for database operations
  const [dbUserTickets, setDbUserTickets] = useState<UserTicket[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string>('');

  // Determine which data source to use
  const shouldFetchFromDb = userId && propUserTickets.length === 0;
  const userTickets = shouldFetchFromDb ? dbUserTickets : propUserTickets;
  const isLoading = shouldFetchFromDb ? dbLoading : propIsLoading;
  const error = shouldFetchFromDb ? dbError : propError;

  // Fetch tickets from database if needed
  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!shouldFetchFromDb) return;

      try {
        setDbLoading(true);
        setDbError(null);

        const { data: ticketsData, error: ticketsError } = await supabase
          .from("TICKETS")
          .select(`
            *,
            TICKET_TYPES(
              *,
              EVENTS(*)
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (ticketsError) {
          console.error("Tickets error:", ticketsError);
          throw ticketsError;
        }

        interface TicketWithRelations extends TicketRow {
          TICKET_TYPES: TicketTypeRow & { 
            EVENTS: EventRow 
          };
        }

        const transformedTickets: UserTicket[] = (ticketsData || []).map(
          (ticket: TicketWithRelations) => {
            const ticketType = ticket.TICKET_TYPES;
            const event = ticketType?.EVENTS;

            return {
              id: ticket.id,
              eventId: event?.id || 0,
              eventTitle: event?.title || "Unknown Event",
              eventDate: event?.event_date || "",
              eventLocation: event?.location_name || "",
              ticketType: ticketType?.name || "General",
              quantity: parseInt(ticket.quantity || "1"),
              totalPrice: ticket.total || 0,
              purchaseDate: ticket.created_at,
              status: (ticket.ticket_status as UserTicket["status"]) || "confirmed",
              userId: ticket.user_id || "",
              qr_code_data: ticket.qr_code_data || undefined,
              unit_price: ticket.unit_price || undefined,
              used_at: ticket.used_at || undefined,
              scanned_by: ticket.scanned_by || undefined,
              ticket_status: ticket.ticket_status || undefined,
            } as UserTicket;
          }
        );

        setDbUserTickets(transformedTickets);
      } catch (err) {
        console.error("Error fetching user tickets:", err);
        setDbError("Failed to load tickets");
      } finally {
        setDbLoading(false);
      }
    };

    fetchUserTickets();
  }, [userId, shouldFetchFromDb]);

  // Enhanced tickets
  const enhancedTickets = useMemo(() => 
    userTickets.map(enhanceTicket), 
    [userTickets]
  );

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    const statusFiltered = enhancedTickets.filter(ticket => 
      ticket.ticketStatus === ticketFilter
    );
    
    return filterTickets(statusFiltered, {
      search: searchTerm,
      dateRange: dateFilter,
      status: ticketFilter,
    });
  }, [enhancedTickets, ticketFilter, searchTerm, dateFilter]);

  // Notify parent of tab changes
  useEffect(() => {
    if (onTabChange) {
      onTabChange(ticketFilter);
    }
  }, [ticketFilter, onTabChange]);

  // Enhanced ticket actions with feedback
  const handleDownload = async (ticket: EnhancedTicket) => {
    console.log('Downloading ticket:', ticket.orderId);
    // TODO: Implement actual PDF generation and download
    alert(`Downloading ticket ${ticket.orderId} for ${ticket.eventTitle}`);
  };

  const handleShare = async (ticket: EnhancedTicket) => {
    console.log('Sharing ticket:', ticket.orderId);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${ticket.eventTitle}`,
          text: `Check out my ticket for ${ticket.eventTitle} on ${new Date(ticket.eventDate).toLocaleDateString()}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback for browsers without native sharing
      const shareText = `I'm going to ${ticket.eventTitle} on ${new Date(ticket.eventDate).toLocaleDateString()}! 🎫`;
      navigator.clipboard.writeText(shareText);
      alert('Share text copied to clipboard!');
    }
  };

  const handleCopy = (ticket: EnhancedTicket) => {
    navigator.clipboard.writeText(ticket.orderId);
    setCopyFeedback(`Copied: ${ticket.orderId}`);
    console.log('Copied ticket ID:', ticket.orderId);
    
    // Clear feedback after 2 seconds
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleView = (ticket: EnhancedTicket) => {
    console.log('Viewing ticket details:', ticket.id);
    // TODO: Navigate to ticket detail page or show modal
    alert(`Viewing details for ticket: ${ticket.orderId}\nEvent: ${ticket.eventTitle}\nDate: ${new Date(ticket.eventDate).toLocaleDateString()}`);
  };

  // Loading state with enhanced skeleton
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-2 bg-gray-300"></div>
              <div className="p-6 animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-gray-300 rounded"></div>
                  <div className="w-10 h-10 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          ))}
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
            onClick={() => {
              window.location.href = '/events';
            }}
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
      {/* Copy feedback notification */}
      {copyFeedback && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {copyFeedback}
        </div>
      )}

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
              placeholder="Search tickets by event name, location, or order ID..."
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

          {/* Template Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Template:</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TICKET_TEMPLATES.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredTickets.length} of {ticketFilter === 'active' ? activeTickets.length : expiredTickets.length} {ticketFilter} tickets
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

      {/* Tickets List */}
      {filteredTickets.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' 
          : 'space-y-6'
        }>
          {filteredTickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              template={selectedTemplate}
              onDownload={handleDownload}
              onShare={handleShare}
              onCopy={handleCopy}
              onView={handleView}
              user={user}
              className={viewMode === 'list' ? 'max-w-4xl mx-auto' : ''}
            />
          ))}
        </div>
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