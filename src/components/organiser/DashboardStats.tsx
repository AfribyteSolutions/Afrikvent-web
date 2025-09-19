// src/components/organiser/DashboardStats.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface DashboardStatsProps {
  user: User | null;
}

interface StatsData {
  totalEvents: number;
  activeEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  loading: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ user }) => {
  const [stats, setStats] = useState<StatsData>({
    totalEvents: 0,
    activeEvents: 0,
    totalRevenue: 0,
    totalTicketsSold: 0,
    loading: true
  });

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      setStats(prev => ({ ...prev, loading: true }));

      // Fetch events data
      const { data: eventsData, error: eventsError } = await supabase
        .from('EVENTS')
        .select('id, event_status')
        .eq('organizer_id', user.id);

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
      }

      // Calculate total and active events
      const totalEvents = eventsData?.length || 0;
      const activeEvents = eventsData?.filter(event => 
        event.event_status === 'active' || event.event_status === 'published'
      ).length || 0;

      // Fetch tickets data for revenue and count
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('TICKETS')
        .select(`
          total,
          ticket_status,
          event_id,
          EVENTS!inner(organizer_id)
        `)
        .eq('EVENTS.organizer_id', user.id);

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        setStats({
          totalEvents,
          activeEvents,
          totalRevenue: 0,
          totalTicketsSold: 0,
          loading: false
        });
        return;
      }

      // Calculate revenue and tickets sold
      const paidTickets = ticketsData?.filter(ticket => 
        ticket.ticket_status === 'paid' || ticket.ticket_status === 'used'
      ) || [];

      const totalRevenue = paidTickets.reduce((sum, ticket) => 
        sum + (ticket.total || 0), 0
      );

      const totalTicketsSold = paidTickets.length;

      setStats({
        totalEvents,
        activeEvents,
        totalRevenue,
        totalTicketsSold,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const statsConfig = [
    {
      name: 'Total Events',
      value: stats.loading ? '...' : stats.totalEvents,
      icon: '🎪',
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Active Events',
      value: stats.loading ? '...' : stats.activeEvents,
      icon: '🟢',
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Total Revenue',
      value: stats.loading ? '...' : `₵${stats.totalRevenue.toLocaleString()}`,
      icon: '💰',
      color: 'bg-yellow-500',
      change: '+23%',
      changeType: 'positive'
    },
    {
      name: 'Tickets Sold',
      value: stats.loading ? '...' : stats.totalTicketsSold.toLocaleString(),
      icon: '🎫',
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  stat.value
                )}
              </p>
            </div>
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
              {stat.icon}
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${
              stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {stat.change}
            </span>
            <span className="text-sm text-gray-500 ml-2">from last month</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;