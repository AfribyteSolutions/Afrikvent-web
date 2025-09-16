"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Search, Filter } from 'lucide-react';
import { TicketCard } from './TicketCard';
import { StackedTicketCard } from './StackedTicketCard';
import { UserTicket, EnhancedTicket, User } from '@/types/ticket';
import { enhanceTicket, filterTickets } from '@/utils/ticketUtils';
import { TICKET_TEMPLATES } from '@/config/ticketTemplates';

interface TicketsSectionProps {
  userTickets: UserTicket[];
  user?: User;
  onTabChange?: (tab: 'active' | 'expired') => void;
  isLoading?: boolean;
  error?: string | null;
}

export const TicketsSection: React.FC<TicketsSectionProps> = ({
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

  // Ticket actions
  const handleDownload = async (ticket: EnhancedTicket) => {
    console.log('Downloading ticket:', ticket.orderId);
  };

  const handleShare = async (ticket: EnhancedTicket) => {
    console.log('Sharing ticket:', ticket.orderId);
  };

  const handleCopy = (ticket: EnhancedTicket) => {
    console.log('Copying ticket ID:', ticket.orderId);
  };

  const handleView = (ticket: EnhancedTicket) => {
    console.log('Viewing ticket details:', ticket.id);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-48 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        ))}
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
      {/* Filters */}
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
        <>
          {/* Small screens: stacked view */}
          <div className="sm:hidden">
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

          {/* Larger screens: grid (1 col on sm, 3 on lg) */}
          <div className="hidden sm:grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              />
            ))}
          </div>
        </>
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
