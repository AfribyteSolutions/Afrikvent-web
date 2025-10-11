// src/components/organiser/TicketManagement.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types'; // Adjust path as needed

// Use your actual database types
type EventRow = Database['public']['Tables']['EVENTS']['Row'];
type UserRow = Database['public']['Tables']['USERS']['Row'];
type TicketTypeRow = Database['public']['Tables']['TICKET_TYPES']['Row'];
type PaymentRow = Database['public']['Tables']['PAYMENTS']['Row'];

interface TicketSale {
  id: number;
  eventTitle: string;
  eventDate: string;
  buyerName: string;
  buyerEmail: string;
  ticketType: string;
  quantity: string;
  totalAmount: number;
  purchaseDate: string;
  status: 'paid' | 'pending' | 'cancelled' | 'refunded' | 'used';
  paymentMethod: string;
}

interface TicketManagementProps {
  user: User | null;
}

// Type for the joined query result
interface SupabaseTicketWithJoins {
  id: number;
  quantity: string | null;
  total: number | null;
  unit_price: number | null;
  ticket_status: string | null;
  created_at: string;
  EVENTS: EventRow[];
  USERS: UserRow[];
  TICKET_TYPES: TicketTypeRow[];
  PAYMENTS: PaymentRow[];
}

const TicketManagement: React.FC<TicketManagementProps> = ({ user }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [ticketSales, setTicketSales] = useState<TicketSale[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTicketSales();
    }
  }, [user]);

  const fetchTicketSales = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch tickets with related data
      const { data: ticketsData, error } = await supabase
        .from('TICKETS')
        .select(`
          id,
          quantity,
          total,
          unit_price,
          ticket_status,
          created_at,
          EVENTS!inner(title, event_date, organizer_id),
          USERS!inner(name, email),
          TICKET_TYPES(name),
          PAYMENTS(payment_method, created_at)
        `)
        .eq('EVENTS.organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        return;
      }

      // Transform data to match our interface
      const transformedTickets: TicketSale[] = (ticketsData as SupabaseTicketWithJoins[])?.map(ticket => ({
        id: ticket.id,
        eventTitle: ticket.EVENTS?.[0]?.title || 'Unknown Event',
        eventDate: ticket.EVENTS?.[0]?.event_date || '',
        buyerName: ticket.USERS?.[0]?.name || 'Unknown',
        buyerEmail: ticket.USERS?.[0]?.email || 'Unknown',
        ticketType: ticket.TICKET_TYPES?.[0]?.name || 'General',
        quantity: ticket.quantity || '1',
        totalAmount: ticket.total || 0,
        purchaseDate: ticket.created_at,
        status: ticket.ticket_status as TicketSale['status'],
        paymentMethod: ticket.PAYMENTS?.[0]?.payment_method || 'Unknown'
      })) || [];

      setTicketSales(transformedTickets);

      // Extract unique event titles
      const uniqueEvents = [...new Set(transformedTickets.map(sale => sale.eventTitle))];
      setEvents(uniqueEvents);

    } catch (error) {
      console.error('Error fetching ticket sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = ticketSales.filter(sale => {
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      sale.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = selectedEvent === 'all' || sale.eventTitle === selectedEvent;
    return matchesStatus && matchesSearch && matchesEvent;
  });

  const getStatusColor = (status: TicketSale['status']) => {
    switch (status) {
      case 'paid':
      case 'used':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TicketSale['status']) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'used':
        return 'Used';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEventDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const confirmedSales = filteredSales.filter(sale =>
    sale.status === 'paid' || sale.status === 'used'
  );
  
  const totalRevenue = confirmedSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalTickets = confirmedSales.reduce((sum, sale) => sum + parseInt(sale.quantity), 0);
  const pendingSales = filteredSales.filter(sale => sale.status === 'pending').length;

  const handleRefund = async (saleId: number) => {
    try {
      const { error } = await supabase
        .from('TICKETS')
        .update({
          ticket_status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (error) {
        console.error('Error processing refund:', error);
        alert('Failed to process refund');
        return;
      }

      // Refresh data
      fetchTicketSales();
      alert('Refund processed successfully');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    }
  };

  const handleResendConfirmation = async (saleId: number) => {
    // This would typically send an email confirmation
    // For now, just show a message
    alert('Confirmation email resent successfully');
    console.log('Resending confirmation for sale:', saleId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{filteredSales.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
              <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">CFA{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingSales}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by buyer name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="used">Used</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Ticket Sales ({filteredSales.length})
          </h3>
        </div>
        
        {filteredSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{sale.buyerName}</div>
                        <div className="text-sm text-gray-500">{sale.buyerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{sale.eventTitle}</div>
                        <div className="text-sm text-gray-500">{formatEventDate(sale.eventDate)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.ticketType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₵{sale.totalAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sale.status)}`}>
                        {getStatusText(sale.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sale.purchaseDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {(sale.status === 'paid' || sale.status === 'used') && (
                          <button
                            onClick={() => handleRefund(sale.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Process Refund"
                          >
                            Refund
                          </button>
                        )}
                        {sale.status === 'pending' && (
                          <button
                            onClick={() => handleResendConfirmation(sale.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Resend Confirmation"
                          >
                            Resend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ticket sales found</h3>
            <p className="text-gray-600">
              {ticketSales.length === 0
                ? "You haven't sold any tickets yet."
                : "No sales match your current filters."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketManagement;