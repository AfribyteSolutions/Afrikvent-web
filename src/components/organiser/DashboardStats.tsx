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

// Updated interface to correctly access the nested currency
interface TicketWithRelations extends TicketRow {
    EVENTS: Pick<EventRow, 'organizer_id' | 'currency'>[];
    USERS: Pick<UserRow, 'name' | 'email'>[];
}

interface DashboardStatsProps {
    user: User | null;
}

interface StatsData {
    totalEvents: number;
    activeEvents: number;
    // These hold ALL-TIME totals
    totalRevenueByCurrency: Record<string, number>;
    totalTicketsSoldByCurrency: Record<string, number>;
    // Changes still represent month-over-month
    eventChange: string;
    activeEventChange: string;
    revenueChange: string;
    ticketsSoldChange: string;
    loading: boolean;
}

// --- START: Helper Functions ---

// Helper function to sum a Record<string, number>
const getSum = (data: Record<string, number>): number => {
    return Object.values(data).reduce((sum, value) => sum + value, 0);
};

const calculateRevenue = (ticketsData: TicketWithRelations[] | null) => {
    // ESLint fix: Changed to const
    const revenueByCurrency: Record<string, number> = {}; 
    
    const paidTickets = ticketsData?.filter(ticket =>
        // Only count successfully paid/used tickets
        ticket.ticket_status === 'paid' || ticket.ticket_status === 'used'
    ) || [];
    
    paidTickets.forEach(ticket => {
        // FIX: Default to 'XOF' (CFA Franc) if event currency is missing
        const currency = ticket.EVENTS?.[0]?.currency || 'XOF'; 
        const total = ticket.total || 0;
        revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + total;
    });
    return revenueByCurrency;
};

const calculateTicketsSold = (ticketsData: TicketWithRelations[] | null) => {
    // ESLint fix: Changed to const
    const ticketsSoldByCurrency: Record<string, number> = {}; 
    
    const paidTickets = ticketsData?.filter(ticket =>
        ticket.ticket_status === 'paid' || ticket.ticket_status === 'used'
    ) || [];
    
    paidTickets.forEach(ticket => {
        // FIX: Default to 'XOF' (CFA Franc) if event currency is missing
        const currency = ticket.EVENTS?.[0]?.currency || 'XOF';
        // Ensure quantity is parsed to a number, defaulting to 1
        const quantity = parseInt(ticket.quantity || '1', 10); 
        ticketsSoldByCurrency[currency] = (ticketsSoldByCurrency[currency] || 0) + quantity;
    });
    return ticketsSoldByCurrency;
};

// --- END: Helper Functions ---

const DashboardStats: React.FC<DashboardStatsProps> = ({ user }) => {
    const [stats, setStats] = useState<StatsData>({
        totalEvents: 0,
        activeEvents: 0,
        totalRevenueByCurrency: {},
        totalTicketsSoldByCurrency: {},
        eventChange: 'N/A',
        activeEventChange: 'N/A',
        revenueChange: 'N/A',
        ticketsSoldChange: 'N/A',
        loading: true
    });

    useEffect(() => {
        if (user) {
            fetchDashboardStats();
        } else {
            setStats(prev => ({ ...prev, loading: false }));
        }
    }, [user]);

    const calculateChange = (currentValue: number, previousValue: number) => {
        if (previousValue === 0) {
            return currentValue > 0 ? 'New' : 'N/A';
        }
        const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
        return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
    };
    
    const formatCurrency = (currency: string, value: number) => {
        // Use Intl.NumberFormat for robust currency display
        const currencyCode = currency || 'USD'; 
        
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0 
            }).format(value);
        } catch (e) {
            // Fallback
            return `${currencyCode} ${value.toLocaleString()}`;
        }
    };


    const fetchDashboardStats = async () => {
        if (!user) return;

        try {
            setStats(prev => ({ ...prev, loading: true }));

            // --- Date Range Setup ---
            const today = new Date();
            const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);

            const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0, 0, 0);

            // 1. Fetch All Events
            const { data: allEventsData, error: eventsError } = await supabase
                .from('EVENTS')
                .select('id, event_status, created_at')
                .eq('organizer_id', user.id);

            if (eventsError) throw eventsError;
            const allEvents = allEventsData || [];

            // 2. Fetch All Tickets
            const { data: allTicketsData, error: ticketsError } = await supabase
                .from('TICKETS')
                .select(`
                    total,
                    quantity,
                    ticket_status,
                    created_at,
                    EVENTS!inner(organizer_id, currency)
                `)
                .eq('EVENTS.organizer_id', user.id);
            
            if (ticketsError) throw ticketsError;

            const allTickets = allTicketsData || [];

            // --- Data Segmentation for Change Calculation ---
            
            // Current Month
            const currentMonthEvents = allEvents.filter(event =>
                new Date(event.created_at) >= startOfCurrentMonth
            );
            const currentMonthTickets = allTickets.filter(ticket =>
                new Date(ticket.created_at) >= startOfCurrentMonth
            );

            // Previous Month 
            const previousMonthEvents = allEvents.filter(event =>
                new Date(event.created_at) >= startOfPreviousMonth && new Date(event.created_at) < startOfCurrentMonth
            );
            const previousMonthTickets = allTickets.filter(ticket =>
                new Date(ticket.created_at) >= startOfPreviousMonth && new Date(ticket.created_at) < startOfCurrentMonth
            );
            
            // --- Calculations ---

            // Current Totals (for Change Calc)
            const currentTotalEvents = currentMonthEvents.length;
            const currentActiveEvents = currentMonthEvents.filter(event =>
                event.event_status === 'active' || event.event_status === 'published'
            ).length;
            const currentRevenue = calculateRevenue(currentMonthTickets as TicketWithRelations[]);
            const currentTicketsSold = calculateTicketsSold(currentMonthTickets as TicketWithRelations[]);

            // Previous Totals (for Change Calc)
            const previousTotalEvents = previousMonthEvents.length;
            const previousActiveEvents = previousMonthEvents.filter(event =>
                event.event_status === 'active' || event.event_status === 'published'
            ).length;
            const previousRevenue = calculateRevenue(previousMonthTickets as TicketWithRelations[]);
            const previousTicketsSold = calculateTicketsSold(previousMonthTickets as TicketWithRelations[]);
            
            // All-Time Totals (for dashboard display)
            const totalRevenueAllTime = calculateRevenue(allTickets as TicketWithRelations[]);
            const totalTicketsSoldAllTime = calculateTicketsSold(allTickets as TicketWithRelations[]);


            // Change Metrics
            const eventChange = calculateChange(currentTotalEvents, previousTotalEvents);
            const activeEventChange = calculateChange(currentActiveEvents, previousActiveEvents);
            const revenueChange = calculateChange(getSum(currentRevenue), getSum(previousRevenue));
            const ticketsSoldChange = calculateChange(getSum(currentTicketsSold), getSum(previousTicketsSold));

            // Set all-time totals for main display metrics
            setStats({
                totalEvents: allEvents.length, 
                activeEvents: allEvents.filter(e => e.event_status === 'active' || e.event_status === 'published').length, 
                totalRevenueByCurrency: totalRevenueAllTime, 
                totalTicketsSoldByCurrency: totalTicketsSoldAllTime,
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

    // --- Stats Configuration ---
    const statsConfig = [
        {
            name: 'Total Events',
            value: stats.totalEvents.toLocaleString(), // Convert to string here
            change: stats.eventChange,
            icon: '🎪',
            color: 'bg-blue-500',
            changeType: stats.eventChange.includes('+') ? 'positive' : (stats.eventChange.includes('-') ? 'negative' : 'neutral')
        },
        {
            name: 'Active Events',
            value: stats.activeEvents.toLocaleString(), // Convert to string here
            change: stats.activeEventChange,
            icon: '🔥',
            color: 'bg-green-500',
            changeType: stats.activeEventChange.includes('+') ? 'positive' : (stats.activeEventChange.includes('-') ? 'negative' : 'neutral')
        },
        {
            name: 'Total Revenue',
            value: stats.totalRevenueByCurrency, // Remains as Record<string, number> for formatting
            change: stats.revenueChange,
            icon: '💰',
            color: 'bg-yellow-500',
            changeType: stats.revenueChange.includes('+') ? 'positive' : (stats.revenueChange.includes('-') ? 'negative' : 'neutral')
        },
        {
            name: 'Tickets Sold',
            value: stats.totalTicketsSoldByCurrency, // Remains as Record<string, number> for formatting
            change: stats.ticketsSoldChange,
            icon: '🎫',
            color: 'bg-purple-500',
            changeType: stats.ticketsSoldChange.includes('+') ? 'positive' : (stats.ticketsSoldChange.includes('-') ? 'negative' : 'neutral')
        }
    ];

    // --- Fix for TS2322 (ReactNode type check) ---
    const renderValue = (name: string, value: string | Record<string, number>): ReactNode => {
        
        if (name === 'Total Revenue' && typeof value === 'object') {
            const revenueEntries = Object.entries(value);
            if (revenueEntries.length === 0 || getSum(value) === 0) {
                return <span className="text-2xl font-normal text-gray-500">No revenue yet</span>;
            }
            // Display revenue for all currencies found
            return (
                <div>
                    {revenueEntries.map(([currency, total], i) => (
                        <span key={i} className="block text-3xl md:text-3xl font-bold">
                            {formatCurrency(currency, total)}
                        </span>
                    ))}
                </div>
            );
        }
        
        if (name === 'Tickets Sold' && typeof value === 'object') {
            const ticketsEntries = Object.entries(value);
            const totalTickets = getSum(value);

            if (ticketsEntries.length === 0 || totalTickets === 0) {
                return <span className="text-2xl font-normal text-gray-500">No tickets sold</span>;
            }
            
            // Display total tickets sold across all currencies
            return (
                <span className="block text-3xl md:text-3xl font-bold">
                    {totalTickets.toLocaleString()}
                </span>
            );
        }
        
        // Final Fix: Handle the string values explicitly for Events count
        if (typeof value === 'string') {
            return <span className="text-3xl md:text-3xl font-bold">{value}</span>;
        }

        // Fallback
        return null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsConfig.map((stat, index) => {
                const isNew = stat.change === 'New';
                const isNop = stat.change === 'N/A';
                const changeTextColor = isNew 
                    ? 'text-green-600'
                    : stat.changeType === 'positive' 
                    ? 'text-green-600' 
                    : stat.changeType === 'negative' 
                    ? 'text-red-600' 
                    : 'text-gray-500';

                return (
                    <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                <div className="mt-2">
                                    {stats.loading ? (
                                        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                                    ) : (
                                        renderValue(stat.name, stat.value)
                                    )}
                                </div>
                            </div>
                            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                                {stat.icon}
                            </div>
                        </div>
                        <div className="mt-4 flex items-center">
                            {!isNop && (
                                <>
                                    <span className={`text-sm font-medium ${changeTextColor}`}>
                                        {stat.change}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">
                                        {isNew ? 'in total' : 'from last month'}
                                    </span>
                                </>
                            )}
                            {isNop && (
                                <span className="text-sm text-gray-500">
                                    {stat.change === 'New' ? 'Just started' : 'No data available'}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DashboardStats;