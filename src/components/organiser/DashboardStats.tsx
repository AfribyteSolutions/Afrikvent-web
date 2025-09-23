// src/components/organiser/DashboardStats.tsx
'use client';
import React, { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { PostgrestError } from '@supabase/supabase-js';

// Define the types for the data returned from the Supabase query
type TicketRow = Database['public']['Tables']['TICKETS']['Row'];
type EventRow = Database['public']['Tables']['EVENTS']['Row'];
type UserRow = Database['public']['Tables']['USERS']['Row'];

interface TicketWithRelations extends TicketRow {
    EVENTS: Pick<EventRow, 'organizer_id' | 'currency'>[];
    USERS: Pick<UserRow, 'name' | 'email'>[];
}

interface EventWithRelations extends EventRow {
    USERS: Pick<UserRow, 'name' | 'email'>[];
}

interface DashboardStatsProps {
    user: User | null;
}

interface StatsData {
    totalEvents: number;
    activeEvents: number;
    totalRevenueByCurrency: Record<string, number>;
    totalTicketsSoldByCurrency: Record<string, number>;
    eventChange: string;
    activeEventChange: string;
    revenueChange: string;
    ticketsSoldChange: string;
    loading: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ user }) => {
    const [stats, setStats] = useState<StatsData>({
        totalEvents: 0,
        activeEvents: 0,
        totalRevenueByCurrency: {},
        totalTicketsSoldByCurrency: {},
        eventChange: 'New',
        activeEventChange: 'New',
        revenueChange: 'New',
        ticketsSoldChange: 'New',
        loading: true
    });

    useEffect(() => {
        if (user) {
            fetchDashboardStats();
        }
    }, [user]);

    const calculateChange = (currentValue: number, previousValue: number) => {
        if (previousValue === 0) {
            return currentValue > 0 ? 'New' : 'N/A';
        }
        const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
        return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
    };

    const getSum = (data: Record<string, number>): number => {
        return Object.values(data).reduce((sum, value) => sum + value, 0);
    };

    const calculateRevenue = (ticketsData: TicketWithRelations[] | null) => {
        const revenueByCurrency: Record<string, number> = {};
        const paidTickets = ticketsData?.filter(ticket =>
            ticket.ticket_status === 'paid' || ticket.ticket_status === 'used'
        ) || [];
        paidTickets.forEach(ticket => {
            const currency = ticket.EVENTS?.[0]?.currency || 'GHS';
            const total = ticket.total || 0;
            revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + total;
        });
        return revenueByCurrency;
    };

    const calculateTicketsSold = (ticketsData: TicketWithRelations[] | null) => {
        const ticketsSoldByCurrency: Record<string, number> = {};
        const paidTickets = ticketsData?.filter(ticket =>
            ticket.ticket_status === 'paid' || ticket.ticket_status === 'used'
        ) || [];
        paidTickets.forEach(ticket => {
            const currency = ticket.EVENTS?.[0]?.currency || 'GHS';
            ticketsSoldByCurrency[currency] = (ticketsSoldByCurrency[currency] || 0) + 1;
        });
        return ticketsSoldByCurrency;
    };

    const fetchDashboardStats = async () => {
        if (!user) return;

        try {
            setStats(prev => ({ ...prev, loading: true }));

            const today = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(today.getMonth() - 1);
            const twoMonthsAgo = new Date();
            twoMonthsAgo.setMonth(today.getMonth() - 2);

            const { data: allEventsData, error: eventsError } = await supabase
                .from('EVENTS')
                .select('id, event_status, created_at')
                .eq('organizer_id', user.id);

            if (eventsError) throw eventsError;

            const allEvents = allEventsData || [];

            const currentMonthEvents = allEvents.filter(event =>
                new Date(event.created_at) >= oneMonthAgo
            );
            const previousMonthEvents = allEvents.filter(event =>
                new Date(event.created_at) >= twoMonthsAgo && new Date(event.created_at) < oneMonthAgo
            );

            const { data: allTicketsData, error: ticketsError } = await supabase
                .from('TICKETS')
                .select(`
                    total,
                    ticket_status,
                    created_at,
                    EVENTS!inner(organizer_id, currency)
                `)
                .eq('EVENTS.organizer_id', user.id);
            
            if (ticketsError) throw ticketsError;

            const allTickets = allTicketsData || [];

            const currentMonthTickets = allTickets.filter(ticket =>
                new Date(ticket.created_at) >= oneMonthAgo
            );
            const previousMonthTickets = allTickets.filter(ticket =>
                new Date(ticket.created_at) >= twoMonthsAgo && new Date(ticket.created_at) < oneMonthAgo
            );

            const currentTotalEvents = currentMonthEvents.length;
            const currentActiveEvents = currentMonthEvents.filter(event =>
                event.event_status === 'active' || event.event_status === 'published'
            ).length;
            const currentRevenue = calculateRevenue(currentMonthTickets as TicketWithRelations[]);
            const currentTicketsSold = calculateTicketsSold(currentMonthTickets as TicketWithRelations[]);

            const previousTotalEvents = previousMonthEvents.length;
            const previousActiveEvents = previousMonthEvents.filter(event =>
                event.event_status === 'active' || event.event_status === 'published'
            ).length;
            const previousRevenue = calculateRevenue(previousMonthTickets as TicketWithRelations[]);
            const previousTicketsSold = calculateTicketsSold(previousMonthTickets as TicketWithRelations[]);
            
            const eventChange = calculateChange(currentTotalEvents, previousTotalEvents);
            const activeEventChange = calculateChange(currentActiveEvents, previousActiveEvents);
            const revenueChange = calculateChange(getSum(currentRevenue), getSum(previousRevenue));
            const ticketsSoldChange = calculateChange(getSum(currentTicketsSold), getSum(previousTicketsSold));

            setStats({
                totalEvents: currentTotalEvents,
                activeEvents: currentActiveEvents,
                totalRevenueByCurrency: currentRevenue,
                totalTicketsSoldByCurrency: currentTicketsSold,
                eventChange,
                activeEventChange,
                revenueChange,
                ticketsSoldChange,
                loading: false,
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    const formatCurrency = (currency: string, value: number) => {
        const symbol = currency === 'GHS' ? '₵' : 'CFA';
        return `${symbol}${value.toLocaleString()}`;
    };

    const statsConfig = [
        {
            name: 'Total Events',
            value: stats.totalEvents.toLocaleString(),
            change: stats.eventChange,
            icon: '🎪',
            color: 'bg-blue-500',
            changeType: stats.eventChange.includes('+') ? 'positive' : 'negative'
        },
        {
            name: 'Active Events',
            value: stats.activeEvents.toLocaleString(),
            change: stats.activeEventChange,
            icon: '🟢',
            color: 'bg-green-500',
            changeType: stats.activeEventChange.includes('+') ? 'positive' : 'negative'
        },
        {
            name: 'Total Revenue',
            value: stats.totalRevenueByCurrency,
            change: stats.revenueChange,
            icon: '💰',
            color: 'bg-yellow-500',
            changeType: stats.revenueChange.includes('+') ? 'positive' : 'negative'
        },
        {
            name: 'Tickets Sold',
            value: stats.totalTicketsSoldByCurrency,
            change: stats.ticketsSoldChange,
            icon: '🎫',
            color: 'bg-purple-500',
            changeType: stats.ticketsSoldChange.includes('+') ? 'positive' : 'negative'
        }
    ];

    const renderValue = (name: string, value: string | Record<string, number>): ReactNode => {
        if (name === 'Total Revenue' && typeof value === 'object') {
            const revenueEntries = Object.entries(value);
            if (revenueEntries.length === 0) {
                return <span className="text-2xl font-normal text-gray-500">No revenue yet</span>;
            }
            return revenueEntries.map(([currency, total], i) => (
                <span key={i} className="block text-2xl">
                    {formatCurrency(currency, total)}
                </span>
            ));
        }
        if (name === 'Tickets Sold' && typeof value === 'object') {
            const ticketsEntries = Object.entries(value);
            if (ticketsEntries.length === 0) {
                return <span className="text-2xl font-normal text-gray-500">No tickets sold</span>;
            }
            return ticketsEntries.map(([currency, total], i) => (
                <span key={i} className="block text-2xl">
                    {total.toLocaleString()} <span className="text-base text-gray-500">{currency}</span>
                </span>
            ));
        }
        
        // Final return must be a valid ReactNode
        return <>{value}</>;
    };

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
                                    renderValue(stat.name, stat.value)
                                )}
                            </p>
                        </div>
                        <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                            {stat.icon}
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        {stat.change !== 'N/A' && (
                            <>
                                <span className={`text-sm font-medium ${
                                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {stat.change}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                    {stat.change === 'New' ? 'in total' : 'from last month'}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardStats;