"use client";
import React from "react";
import { useRouter } from "next/navigation";
import VideoSlider from "@/components/video/VideoSlider";
import { useRecommendedEvents, useSponsoredEvents, useUpcomingEvents } from '@/hooks/useEvents';
import RecommendedEvents from '@/components/event/recommendedevents/RecommendedEvents';
import SponsoredEvents from '@/components/event/sponsoredevents/SponsoredEvents';
import UpcomingEvents from '@/components/event/upcomingevents/UpcomingEvents';
import PromotionalBannerSection from '@/components/promotionbanner/PromotionBannerSection';
import { Event } from "@/types/event";

const slides = [
  { src: "/videos/video1.mp4" },
  { src: "/videos/video2.mp4" },
  { src: "/videos/video3.mp4" },
  { src: "/videos/video4.mp4" },
  { src: "/videos/video5.mp4" },
  { src: "/videos/video6.mp4" },
  { src: "/videos/video7.mp4" },
];

// Example promotional banners data (you can remove this and use API instead)
const examplePromotionalBanners = [
  {
    id: "banner-1",
    imageUrl: "/images/promotions/tech-conference-banner.jpg",
    altText: "TechCorp 2024 Conference - Innovation Summit",
    href: "https://techcorp.com/conference-2024",
    openInNewTab: true,
    overlayText: {
      title: "TechCorp Innovation Summit 2024",
      subtitle: "Join 5000+ developers & entrepreneurs",
      buttonText: "Register Now"
    },
    height: 250,
    isActive: true,
    priority: 10,
    // 💡 Updated the dates to the current year to ensure the banner is active.
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  }
];

export default function HomePage() {
  const router = useRouter();
  const { events: recommendedEvents, loading: recommendedLoading, error: recommendedError } = useRecommendedEvents(10);
  const { events: sponsoredEvents, loading: sponsoredLoading, error: sponsoredError } = useSponsoredEvents(8);
  const { events: upcomingEvents, loading: upcomingLoading, error: upcomingError } = useUpcomingEvents(12);

  const handleEventClick = (event: Event) => {
    router.push(`/events/${event.id}`);
  };

  const handleSeeMore = () => {
    router.push('/events');
  };

  // Loading component for carousels
  const CarouselSkeleton = ({ title }: { title: string }) => (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-2"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-72 md:w-80">
              <div className="bg-gray-300 rounded-xl h-48 mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Error component for carousels
  const CarouselError = ({ error }: { error: string }) => (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    </section>
  );

  return (
    <main className="w-full">
      {/* Hero Section with Video Slider */}
      <section className="w-full h-screen">
        <VideoSlider slides={slides} interval={4000} />
      </section>

      {/* Recommended Events Section */}
      {recommendedLoading ? (
        <CarouselSkeleton title="Recommended Events" />
      ) : recommendedError ? (
        <CarouselError error={recommendedError} />
      ) : (
        <RecommendedEvents
          events={recommendedEvents}
          onEventClick={handleEventClick}
          onSeeMore={handleSeeMore}
        />
      )}

      {/* Sponsored Events Section */}
      {sponsoredLoading ? (
        <CarouselSkeleton title="Sponsored Events" />
      ) : sponsoredError ? (
        <CarouselError error={sponsoredError} />
      ) : sponsoredEvents.length > 0 ? (
        <SponsoredEvents
          events={sponsoredEvents}
          onEventClick={handleEventClick}
          onSeeMore={handleSeeMore}
        />
      ) : null}

      {/* Upcoming Events Section */}
      {upcomingLoading ? (
        <CarouselSkeleton title="Upcoming Events" />
      ) : upcomingError ? (
        <CarouselError error={upcomingError} />
      ) : upcomingEvents.length > 0 ? (
        <UpcomingEvents
          events={upcomingEvents}
          onEventClick={handleEventClick}
          onSeeMore={handleSeeMore}
        />
      ) : null}

      {/* Discover Amazing Events Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Discover Amazing Events
            </h2>
            <p className="text-lg text-gray-600 mb-12">
              From music festivals to tech conferences, find events that match your interests 
              and connect with like-minded people in your community.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Discovery</h3>
                <p className="text-gray-600">
                  Find events that match your interests with our smart recommendation system.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Booking</h3>
                <p className="text-gray-600">
                  Book your tickets safely with our secure payment system and instant confirmation.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Community</h3>
                <p className="text-gray-600">
                  Connect with other attendees and build lasting relationships through shared experiences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Banner Section - This is the new addition */}
      <PromotionalBannerSection
        maxBanners={1}
        className="bg-white"
        // You can either use the API endpoint or static banners
        // apiEndpoint="/api/promotional-banners"
        banners={examplePromotionalBanners}
      />

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Find Your Next Event?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of event-goers who trust our platform to discover amazing experiences.
          </p>
          <button 
            onClick={() => router.push('/events')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Explore All Events
          </button>
        </div>
      </section>
    </main>
  );
}
