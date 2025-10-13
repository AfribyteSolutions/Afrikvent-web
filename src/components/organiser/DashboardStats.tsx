// src/components/organiser/DashboardStats.tsx
'use client';
import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

interface TicketWithEvent {
    total: number | null;
    quantity: string | null;
    ticket_status: string | null;
    created_at: string;
    event_id: string;
    EVENTS: {
        currency: string | null;
    }[];
}

const getSum = (data: Record<string, number>): number => {
    return Object.values(data).reduce((sum, value) => sum + value, 0);
};

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

    // Memoize the fetch function to avoid unnecessary re-renders
    const fetchDashboardStats = useCallback(async () => {
        if (!user) return;

        try {
            setStats(prev => ({ ...prev, loading: true }));

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

            // 2. Fetch All Successful Tickets (paid/used/completed)
            const { data: allTicketsData, error: ticketsError } = await supabase
                .from('TICKETS')
                .select(`
                    total,
                    quantity,
                    ticket_status,
                    created_at,
                    event_id,
                    EVENTS!inner(currency)
                `)
                .eq('EVENTS.organizer_id', user.id)
                .in('ticket_status', ['paid', 'used', 'completed', 'success']);
            
            if (ticketsError) throw ticketsError;
            const allSuccessTickets: TicketWithEvent[] = allTicketsData || [];

            // --- Calculate Revenue and Tickets Sold ---
            
            // Helper: Calculate revenue from tickets
            const calculateRevenue = (tickets: TicketWithEvent[]) => {
                const revenueByCurrency: Record<string, number> = {};
                tickets.forEach(ticket => {
                    const currency = ticket.EVENTS[0]?.currency || 'XOF';
                    const total = Number(ticket.total) || 0;
                    revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + total;
                });
                return revenueByCurrency;
            };

            // Helper: Calculate tickets sold from tickets
            const calculateTicketsSold = (tickets: TicketWithEvent[]) => {
                const ticketsByCurrency: Record<string, number> = {};
                tickets.forEach(ticket => {
                    const currency = ticket.EVENTS[0]?.currency || 'XOF';
                    const quantity = parseInt(String(ticket.quantity || '1'), 10);
                    ticketsByCurrency[currency] = (ticketsByCurrency[currency] || 0) + quantity;
                });
                return ticketsByCurrency;
            };

            // --- All-Time Totals ---
            const totalRevenueAllTime = calculateRevenue(allSuccessTickets);
            const totalTicketsSoldAllTime = calculateTicketsSold(allSuccessTickets);

            // --- Current Month ---
            const currentMonthEvents = allEvents.filter(event =>
                new Date(event.created_at) >= startOfCurrentMonth
            );
            const currentMonthTickets = allSuccessTickets.filter(ticket =>
                new Date(ticket.created_at) >= startOfCurrentMonth
            );
            const currentTotalEvents = currentMonthEvents.length;
            const currentActiveEvents = currentMonthEvents.filter(event =>
                event.event_status === 'active' || event.event_status === 'published'
            ).length;
            const currentRevenue = calculateRevenue(currentMonthTickets);
            const currentTicketsSold = calculateTicketsSold(currentMonthTickets);

            // --- Previous Month ---
            const previousMonthEvents = allEvents.filter(event => {
                const eventDate = new Date(event.created_at);
                return eventDate >= startOfPreviousMonth && eventDate < startOfCurrentMonth;
            });
            const previousMonthTickets = allSuccessTickets.filter(ticket => {
                const ticketDate = new Date(ticket.created_at);
                return ticketDate >= startOfPreviousMonth && ticketDate < startOfCurrentMonth;
            });
            const previousTotalEvents = previousMonthEvents.length;
            const previousActiveEvents = previousMonthEvents.filter(event =>
                event.event_status === 'active' || event.event_status === 'published'
            ).length;
            const previousRevenue = calculateRevenue(previousMonthTickets);
            const previousTicketsSold = calculateTicketsSold(previousMonthTickets);

            // --- Calculate Changes ---
            const eventChange = calculateChange(currentTotalEvents, previousTotalEvents);
            const activeEventChange = calculateChange(currentActiveEvents, previousActiveEvents);
            const revenueChange = calculateChange(getSum(currentRevenue), getSum(previousRevenue));
            const ticketsSoldChange = calculateChange(getSum(currentTicketsSold), getSum(previousTicketsSold));

            // --- Set State ---
            setStats({
                totalEvents: allEvents.length, 
                activeEvents: allEvents.filter(e => 
                    e.event_status === 'active' || e.event_status === 'published'
                ).length, 
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
    }, [user]);

    useEffect(() => {
        if (!user) {
            setStats(prev => ({ ...prev, loading: false }));
            return;
        }

        // Initial fetch
        fetchDashboardStats();

        // Set up real-time subscriptions
        let ticketsChannel: RealtimeChannel;
        let eventsChannel: RealtimeChannel;
        let paymentsChannel: RealtimeChannel;

        const setupRealtimeSubscriptions = async () => {
            // Subscribe to TICKETS table changes
            ticketsChannel = supabase
                .channel('dashboard-tickets-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*', // INSERT, UPDATE, DELETE
                        schema: 'public',
                        table: 'TICKETS'
                    },
                    (payload) => {
                        console.log('Ticket change detected:', payload);
                        fetchDashboardStats();
                    }
                )
                .subscribe((status) => {
                    console.log('Tickets subscription status:', status);
                });

            // Subscribe to EVENTS table changes
            eventsChannel = supabase
                .channel('dashboard-events-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'EVENTS',
                        filter: `organizer_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log('Event change detected:', payload);
                        fetchDashboardStats();
                    }
                )
                .subscribe((status) => {
                    console.log('Events subscription status:', status);
                });

            // Subscribe to PAYMENTS table changes (optional but recommended)
            paymentsChannel = supabase
                .channel('dashboard-payments-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'PAYMENTS',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        console.log('Payment change detected:', payload);
                        // Only refresh if payment status changed to success/completed
                        const newRecord = payload.new as { payment_status?: string } | null;
                        if (newRecord && newRecord.payment_status === 'completed') {
                            fetchDashboardStats();
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('Payments subscription status:', status);
                });
        };

        setupRealtimeSubscriptions();

        // Cleanup function
        return () => {
            console.log('Cleaning up real-time subscriptions...');
            if (ticketsChannel) {
                supabase.removeChannel(ticketsChannel);
            }
            if (eventsChannel) {
                supabase.removeChannel(eventsChannel);
            }
            if (paymentsChannel) {
                supabase.removeChannel(paymentsChannel);
            }
        };
    }, [user, fetchDashboardStats]);

    const calculateChange = (currentValue: number, previousValue: number) => {
        if (previousValue === 0) {
            return currentValue > 0 ? 'New' : 'N/A';
        }
        const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
        return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
    };
    
    const formatCurrency = (currency: string, value: number) => {
        const currencyCode = currency || 'USD'; 
        
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0 
            }).format(value);
        } catch (e) {
            return `${currencyCode} ${value.toLocaleString()}`;
        }
    };

    const statsConfig = [
        {
            name: 'Total Events',
            value: stats.totalEvents.toLocaleString(),
            change: stats.eventChange,
            icon: '🎪',
            color: 'bg-blue-500',
            changeType: stats.eventChange.includes('+') ? 'positive' : (stats.eventChange.includes('-') ? 'negative' : 'neutral')
        },
        {
            name: 'Active Events',
            value: stats.activeEvents.toLocaleString(),
            change: stats.activeEventChange,
            icon: '🔥',
            color: 'bg-green-500',
            changeType: stats.activeEventChange.includes('+') ? 'positive' : (stats.activeEventChange.includes('-') ? 'negative' : 'neutral')
        },
        {
            name: 'Total Revenue',
            value: stats.totalRevenueByCurrency,
            change: stats.revenueChange,
            icon: '💰',
            color: 'bg-yellow-500',
            changeType: stats.revenueChange.includes('+') ? 'positive' : (stats.revenueChange.includes('-') ? 'negative' : 'neutral')
        },
        {
            name: 'Tickets Sold',
            value: stats.totalTicketsSoldByCurrency,
            change: stats.ticketsSoldChange,
            icon: '🎫',
            color: 'bg-purple-500',
            changeType: stats.ticketsSoldChange.includes('+') ? 'positive' : (stats.ticketsSoldChange.includes('-') ? 'negative' : 'neutral')
        }
    ];

    const renderValue = (name: string, value: string | Record<string, number>): ReactNode => {
        if (name === 'Total Revenue' && typeof value === 'object') {
            const revenueEntries = Object.entries(value);
            if (revenueEntries.length === 0 || getSum(value) === 0) {
                return <span className="text-2xl font-normal text-gray-500">No revenue yet</span>;
            }
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
            const totalTickets = getSum(value);
            if (totalTickets === 0) {
                return <span className="text-2xl font-normal text-gray-500">No tickets sold</span>;
            }
            return (
                <span className="block text-3xl md:text-3xl font-bold">
                    {totalTickets.toLocaleString()}
                </span>
            );
        }
        
        if (typeof value === 'string') {
            return <span className="text-3xl md:text-3xl font-bold">{value}</span>;
        }

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
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                <div className="mt-2">
                                    {stats.loading ? (
                                        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                                    ) : (
                                        renderValue(stat.name, stat.value)
                                    )}
                                </div>
                            </div>
                            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0`}>
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
                                    No data available
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