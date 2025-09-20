"use client";
import React from "react";
import { useRouter } from "next/navigation";
import VideoSlider from "@/components/video/VideoSlider";
import { useRecommendedEvents, useSponsoredEvents, useUpcomingEvents, Event } from "@/hooks/useEvents";
import RecommendedEvents from "@/components/event/recommendedevents/RecommendedEvents";
import SponsoredEvents from "@/components/event/sponsoredevents/SponsoredEvents";
import UpcomingEvents from "@/components/event/upcomingevents/UpcomingEvents";
import PromotionalBannerSection from "@/components/promotionbanner/PromotionBannerSection";

const slides = [
  { src: "/videos/video1.mp4" },
  { src: "/videos/video2.mp4" },
  { src: "/videos/video3.mp4" },
  { src: "/videos/video4.mp4" },
  { src: "/videos/video5.mp4" },
  { src: "/videos/video6.mp4" },
  { src: "/videos/video7.mp4" },
];

// Example promotional banners (replace with API later)
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
      buttonText: "Register Now",
    },
    height: 250,
    isActive: true,
    priority: 10,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
];

export default function HomePage() {
  const router = useRouter();

  // Hooks fetching from Supabase using the correct Event type
  const {
    events: recommendedEvents,
    loading: recommendedLoading,
    error: recommendedError,
  } = useRecommendedEvents(10);

  const {
    events: sponsoredEvents,
    loading: sponsoredLoading,
    error: sponsoredError,
  } = useSponsoredEvents(8);

  const {
    events: upcomingEvents,
    loading: upcomingLoading,
    error: upcomingError,
  } = useUpcomingEvents(12);

  // Handle event clicks - now uses the correct Event type with string ID
  const handleEventClick = (event: Event) => {
    router.push(`/events/${event.id}`);
  };

  const handleSeeMore = () => {
    router.push("/events");
  };

  // Skeleton loader for carousels
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

  // Error UI for carousels
  const CarouselError = ({ error, title }: { error: string; title: string }) => (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          {title}
        </h2>
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">Unable to load events</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  // Empty state component
  const EmptySection = ({ title, message }: { title: string; message: string }) => (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </section>
  );

  return (
    <main className="w-full">
      {/* Hero Section with Video Slider */}
      <section className="w-full h-screen">
        <VideoSlider slides={slides} interval={4000} />
      </section>

      {/* Recommended Events */}
      {recommendedLoading ? (
        <CarouselSkeleton title="Recommended Events" />
      ) : recommendedError ? (
        <CarouselError error={recommendedError} title="Recommended Events" />
      ) : recommendedEvents.length > 0 ? (
        <RecommendedEvents
          events={recommendedEvents}
          onEventClick={handleEventClick}
          onSeeMore={handleSeeMore}
        />
      ) : (
        <EmptySection 
          title="Recommended Events"
          message="No recommended events available at the moment."
        />
      )}

      {/* Sponsored Events */}
      {sponsoredLoading ? (
        <CarouselSkeleton title="Sponsored Events" />
      ) : sponsoredError ? (
        <CarouselError error={sponsoredError} title="Sponsored Events" />
      ) : sponsoredEvents.length > 0 ? (
        <SponsoredEvents
          events={sponsoredEvents}
          onEventClick={handleEventClick}
          onSeeMore={handleSeeMore}
        />
      ) : null}

      {/* Upcoming Events */}
      {upcomingLoading ? (
        <CarouselSkeleton title="Upcoming Events" />
      ) : upcomingError ? (
        <CarouselError error={upcomingError} title="Upcoming Events" />
      ) : upcomingEvents.length > 0 ? (
        <UpcomingEvents
          events={upcomingEvents}
          onEventClick={handleEventClick}
          onSeeMore={handleSeeMore}
        />
      ) : null}

      

      {/* Promotional Banner */}
      <PromotionalBannerSection
        maxBanners={1}
        className="bg-white"
        banners={examplePromotionalBanners}
      />

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Find Your Next Event?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of event-goers who trust our platform to discover amazing experiences.
          </p>
          <button
            onClick={() => router.push("/events")}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Explore All Events
          </button>
        </div>
      </section>
    </main>
  );
}