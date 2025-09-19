// src/app/organiser/page.tsx
'use client';
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import DashboardStats from "@/components/organiser/DashboardStats";
import EventsList from "@/components/organiser/EventsList";
import CreateEventModal from "@/components/organiser/CreateEventModal";
import TicketManagement from "@/components/organiser/TicketManagement";
import AnalyticsOverview from "@/components/organiser/AnalyticsOverview";

type TabType = 'overview' | 'events' | 'tickets' | 'analytics';

export default function OrganiserPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Fetch user profile from USERS table
        const { data: profile } = await supabase
          .from('USERS')
          .select('name, email')
          .eq('user_id', session.user.id)
          .single();
        
        setUserProfile({
          name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Organiser',
          email: profile?.email || session.user.email || ''
        });
      }
      setLoading(false);
    };

    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const tabs = [
    { id: 'overview' as TabType, name: 'Overview', icon: '📊' },
    { id: 'events' as TabType, name: 'My Events', icon: '🎪' },
    { id: 'tickets' as TabType, name: 'Tickets', icon: '🎫' },
    { id: 'analytics' as TabType, name: 'Analytics', icon: '📈' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <DashboardStats user={user} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <EventsList limit={5} showCreateButton={false} user={user} />
              <AnalyticsOverview user={user} />
            </div>
          </div>
        );
      case 'events':
        return <EventsList user={user} />;
      case 'tickets':
        return <TicketManagement user={user} />;
      case 'analytics':
        return <AnalyticsOverview user={user} detailed={true} />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access the organiser dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 h-auto sm:h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Organiser Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {userProfile?.name || 'Organiser'}
              </p>
            </div>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-8">
        {/* Tab Navigation */}
        <div className="mb-6 sm:mb-8">
          <nav className="flex flex-wrap gap-4 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderContent()}
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onSuccess={() => {
          setShowCreateEvent(false);
        }}
        user={user}
      />
    </div>
  );
}