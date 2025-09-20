// src/components/organiser/AnalyticsOverview.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types'; // Adjust path to your database types

// Use your actual database types
type EventRow = Database['public']['Tables']['EVENTS']['Row'];
type UserRow = Database['public']['Tables']['USERS']['Row'];
type TicketRow = Database['public']['Tables']['TICKETS']['Row'];

interface AnalyticsOverviewProps {
  user: User | null;
  detailed?: boolean;
}

// Type for the joined query result
interface SupabaseTicketWithJoins {
  total: number | null;
  unit_price: number | null;
  quantity: string | null;
  ticket_status: string | null;
  created_at: string;
  event_id: number | null;
  EVENTS: Array<{
    id: number;
    title: string;
    organizer_id: string;
  }>;
  USERS: Array<{
    name: string;
  }>;
}

interface AnalyticsData {
  totalRevenue: number;
  totalTicketsSold: number;
  totalEvents: number;
  averageTicketPrice: number;
  conversionRate: number;
  topSellingEvents: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  salesByMonth: Array<{
    month: string;
    sales: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    type: 'sale' | 'refund';
    event: string;
    amount: number;
    time: string;
    buyer_name?: string | null;
  }>;
  recentEvents: Array<{
    id: number;
    title: string;
    event_status: string;
    event_date: string;
    created_at: string;
    ticketsSold?: number;
    revenue?: number;
  }>;
  loading: boolean;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ user, detailed = false }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalEvents: 0,
    averageTicketPrice: 0,
    conversionRate: 0,
    topSellingEvents: [],
    salesByMonth: [],
    recentActivity: [],
    recentEvents: [],
    loading: true
  });

  const [toggleLoading, setToggleLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      setAnalyticsData(prev => ({ ...prev, loading: true }));

      // Fetch events data
      const { data: eventsData } = await supabase
        .from('EVENTS')
        .select('id, title, event_status, event_date, created_at')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      const totalEvents = eventsData?.length || 0;

      // Fetch tickets data with payments and events
      const { data: ticketsData } = await supabase
        .from('TICKETS')
        .select(`
          total,
          unit_price,
          quantity,
          ticket_status,
          created_at,
          event_id,
          EVENTS!inner(id, title, organizer_id),
          USERS!inner(name)
        `)
        .eq('EVENTS.organizer_id', user.id);

      const confirmedTickets = (ticketsData as SupabaseTicketWithJoins[] | null)?.filter(ticket => 
        ticket.ticket_status === 'paid' || ticket.ticket_status === 'used'
      ) || [];

      const totalRevenue = confirmedTickets.reduce((sum, ticket) => 
        sum + (ticket.total || 0), 0
      );

      const totalTicketsSold = confirmedTickets.reduce((sum, ticket) => 
        sum + parseInt(ticket.quantity || '0'), 0
      );

      const averageTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;

      // Calculate event performance data
      const eventPerformance = eventsData?.reduce((acc, event) => {
        const eventTickets = confirmedTickets.filter(ticket => 
          ticket.EVENTS?.[0]?.id === event.id
        );
        
        const eventRevenue = eventTickets.reduce((sum, ticket) => 
          sum + (ticket.total || 0), 0
        );
        
        const eventTicketsSold = eventTickets.reduce((sum, ticket) => 
          sum + parseInt(ticket.quantity || '0'), 0
        );

        acc[event.id] = {
          revenue: eventRevenue,
          ticketsSold: eventTicketsSold
        };
        return acc;
      }, {} as Record<number, { revenue: number; ticketsSold: number }>) || {};

      // Add performance data to recent events
      const recentEvents = eventsData?.slice(0, 5).map(event => ({
        ...event,
        ticketsSold: eventPerformance[event.id]?.ticketsSold || 0,
        revenue: eventPerformance[event.id]?.revenue || 0
      })) || [];

      // Calculate top selling events
      const eventSales = confirmedTickets.reduce((acc, ticket) => {
        const eventTitle = ticket.EVENTS?.[0]?.title || 'Unknown Event';
        if (!acc[eventTitle]) {
          acc[eventTitle] = { sales: 0, revenue: 0 };
        }
        acc[eventTitle].sales += parseInt(ticket.quantity || '0');
        acc[eventTitle].revenue += ticket.total || 0;
        return acc;
      }, {} as Record<string, { sales: number; revenue: number }>);

      const topSellingEvents = Object.entries(eventSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      // Calculate sales by month (last 6 months)
      const salesByMonth = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
        
        const monthTickets = confirmedTickets.filter(ticket => {
          const ticketDate = new Date(ticket.created_at);
          return ticketDate.getMonth() === monthDate.getMonth() && 
                 ticketDate.getFullYear() === monthDate.getFullYear();
        });

        const monthRevenue = monthTickets.reduce((sum, ticket) => sum + (ticket.total || 0), 0);
        const monthSales = monthTickets.reduce((sum, ticket) => sum + parseInt(ticket.quantity || '0'), 0);

        salesByMonth.push({
          month: monthName,
          sales: monthSales,
          revenue: monthRevenue
        });
      }

      // Recent activity (last 4 transactions)
      const recentActivity = confirmedTickets
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)
        .map(ticket => ({
          type: 'sale' as const,
          event: ticket.EVENTS?.[0]?.title || 'Unknown Event',
          amount: ticket.total || 0,
          time: formatTimeAgo(ticket.created_at),
          buyer_name: ticket.USERS?.[0]?.name || undefined
        }));

      setAnalyticsData({
        totalRevenue,
        totalTicketsSold,
        totalEvents,
        averageTicketPrice: Math.round(averageTicketPrice),
        conversionRate: 3.2, // This would need more complex calculation
        topSellingEvents,
        salesByMonth,
        recentActivity,
        recentEvents,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setAnalyticsData(prev => ({ ...prev, loading: false }));
    }
  };

  const handlePublishToggle = async (eventId: number, currentStatus: string) => {
    if (!user) return;

    setToggleLoading(prev => ({ ...prev, [eventId]: true }));

    try {
      const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
      
      const { error } = await supabase
        .from('EVENTS')
        .update({ event_status: newStatus })
        .eq('id', eventId)
        .eq('organizer_id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setAnalyticsData(prev => ({
        ...prev,
        recentEvents: prev.recentEvents.map(event =>
          event.id === eventId
            ? { ...event, event_status: newStatus }
            : event
        )
      }));

    } catch (error) {
      console.error('Error toggling event status:', error);
    } finally {
      setToggleLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'refund':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
            Live
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></div>
            Draft
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></div>
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5"></div>
            {status}
          </span>
        );
    }
  };

  if (analyticsData.loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
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
      {detailed && (
        <>
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Over Time</h3>
            <div className="h-64">
              <div className="flex items-end justify-between h-full space-x-2">
                {analyticsData.salesByMonth.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t-sm"
                      style={{ 
                        height: `${Math.max(...analyticsData.salesByMonth.map(d => d.revenue)) > 0 ? (data.revenue / Math.max(...analyticsData.salesByMonth.map(d => d.revenue))) * 100 : 10}%`,
                        minHeight: '20px'
                      }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                    <span className="text-xs font-medium text-gray-700">₵{data.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* My Events with integrated publish toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Publish or Draft Events</h3>
        </div>
        
        <div className="space-y-4">
          {analyticsData.recentEvents.length > 0 ? (
            analyticsData.recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    {getStatusBadge(event.event_status)}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>📅 {new Date(event.event_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                    <span>📍 ghana</span>
                  </div>
                </div>
                
                  <div className="flex items-center gap-3 ml-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePublishToggle(event.id, event.event_status)}
                        disabled={toggleLoading[event.id] || event.event_status === 'cancelled'}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          event.event_status === 'published' ? 'bg-green-600' : 'bg-gray-200'
                        } ${
                          event.event_status === 'cancelled' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                            event.event_status === 'published' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                        {toggleLoading[event.id] && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </button>
                      <span className="text-xs text-gray-500">Publish</span>
                    </div>
                  </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No events created yet</p>
          )}
        </div>
      </div>

      {/* Top Selling Events / Performance Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {detailed ? 'Top Selling Events' : 'Performance Overview'}
        </h3>
        
        {detailed ? (
          <div className="space-y-4">
            {analyticsData.topSellingEvents.length > 0 ? (
              analyticsData.topSellingEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{event.name}</h4>
                    <p className="text-sm text-gray-600">{event.sales} tickets sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₵{event.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data available</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">₵{analyticsData.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{analyticsData.totalTicketsSold}</p>
              <p className="text-sm text-gray-600">Tickets Sold</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">₵{analyticsData.averageTicketPrice}</p>
              <p className="text-sm text-gray-600">Avg. Ticket Price</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{analyticsData.conversionRate}%</p>
              <p className="text-sm text-gray-600">Conversion Rate</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {analyticsData.recentActivity.length > 0 ? (
            analyticsData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.type === 'sale' ? 'New ticket sale' : 'Refund processed'}
                  </p>
                  <p className="text-sm text-gray-600">{activity.event}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    activity.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activity.amount > 0 ? '+' : ''}₵{Math.abs(activity.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {detailed && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Export Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Sales Report
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics Report
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Attendee Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsOverview;