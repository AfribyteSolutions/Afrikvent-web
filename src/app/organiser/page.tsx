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
import OrganiserProfileSetup from "@/components/organiser/OrganizerProfileSetUp";
import OrganizerStream from "@/components/stream/OrganizerStream";
import { DatabaseEvent, OrganizerProfile } from "@/types/event";

type TabType = 'overview' | 'events' | 'tickets' | 'analytics';

export default function OrganiserPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showOrganizerStream, setShowOrganizerStream] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DatabaseEvent | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        const { data: profile } = await supabase
          .from('USERS')
          .select('name, email')
          .eq('user_id', session.user.id)
          .single();
        
        setUserProfile({
          name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Organiser',
          email: profile?.email || session.user.email || ''
        });

        await fetchOrganizerProfile(session.user.id);
      }
      setLoading(false);
    };

    getCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchOrganizerProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setOrganizerProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchOrganizerProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data: orgProfile, error } = await supabase
        .from('ORGANIZER_KYC')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching organizer profile:', error);
      } else if (orgProfile) {
        setOrganizerProfile(orgProfile as OrganizerProfile);
      }
    } catch (error) {
      console.error('Error fetching organizer profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateEventClick = () => {
    if (!organizerProfile) {
      setShowProfileSetup(true);
    } else {
      setShowCreateEvent(true);
    }
  };

  const handleProfileSetupSuccess = () => {
    setShowProfileSetup(false);
    if (user) {
      fetchOrganizerProfile(user.id);
    }
    setShowCreateEvent(true);
  };

  const handleGoLive = (event: DatabaseEvent) => {
    setSelectedEvent(event);
    setShowOrganizerStream(true);
  };

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
              <EventsList 
                limit={5} 
                showCreateButton={false} 
                user={user}
                onGoLive={handleGoLive}
              />
              <AnalyticsOverview user={user} />
            </div>
          </div>
        );
      case 'events':
        return <EventsList user={user} onGoLive={handleGoLive} />;
      case 'tickets':
        return <TicketManagement user={user} />;
      case 'analytics':
        return <AnalyticsOverview user={user} detailed={true} />;
      default:
        return null;
    }
  };

  const renderProfileStatusBanner = () => {
    if (profileLoading) return null;

    if (!organizerProfile) {
      return (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Complete Your Organizer Profile
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You need to set up your organizer profile before you can create events. This includes your organization details and identity verification.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShowProfileSetup(true)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700 transition-colors"
                >
                  Set Up Profile Now
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (organizerProfile.kyc_status === 'pending') {
      return (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Profile Under Review
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>Your organizer profile is currently being reviewed. You will be able to create events once approved.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (organizerProfile.kyc_status === 'rejected') {
      return (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Profile Rejected
              </h3>
              <div className="mt-1 text-sm text-red-700">
                <p>Your organizer profile was rejected. Reason: {organizerProfile.rejection_reason}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShowProfileSetup(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (organizerProfile.kyc_status === 'approved') {
      return (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Profile Approved ✓
              </h3>
              <div className="mt-1 text-sm text-green-700">
                <p>Your organizer profile has been approved. You can now create and manage events.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const canCreateEvents = organizerProfile && organizerProfile.kyc_status === 'approved';

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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 h-auto sm:h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Organiser Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {userProfile?.name || 'Organiser'}
                {organizerProfile && (
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100">
                    {organizerProfile.organization_name}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleCreateEventClick}
              disabled={!canCreateEvents && organizerProfile?.kyc_status === 'pending'}
              className={`px-4 sm:px-6 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base ${
                canCreateEvents
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : organizerProfile?.kyc_status === 'pending'
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
              title={
                !organizerProfile 
                  ? 'Complete profile setup to create events'
                  : organizerProfile.kyc_status === 'pending'
                  ? 'Profile under review - please wait for approval'
                  : organizerProfile.kyc_status === 'rejected'
                  ? 'Update your profile to create events'
                  : 'Create a new event'
              }
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {!organizerProfile ? 'Setup Profile First' : 'Create Event'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-8">
        {renderProfileStatusBanner()}

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

        {renderContent()}
      </div>

      <CreateEventModal
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onSuccess={() => {
          setShowCreateEvent(false);
        }}
        user={user}
      />

      <OrganiserProfileSetup
        isOpen={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        onSuccess={handleProfileSetupSuccess}
        user={user}
        existingProfile={organizerProfile || undefined}
      />

      {showOrganizerStream && selectedEvent && user && (
        <OrganizerStream
          eventId={selectedEvent.id}
          userId={user.id}
          eventTitle={selectedEvent.title}
          onClose={() => {
            setShowOrganizerStream(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}