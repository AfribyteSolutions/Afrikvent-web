"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import VideoSlider from "@/components/video/VideoSlider";
import { useRecommendedEvents, useSponsoredEvents, useUpcomingEvents, Event } from "@/hooks/useEvents";
import RecommendedEvents from "@/components/event/recommendedevents/RecommendedEvents";
import SponsoredEvents from "@/components/event/sponsoredevents/SponsoredEvents";
import UpcomingEvents from "@/components/event/upcomingevents/UpcomingEvents";
import PromotionalBannerSection from "@/components/promotionbanner/PromotionBannerSection";
import SearchResults from "@/components/event/SearchResults";
import EventFilters, { FilterState } from "@/components/event/EventFilters";

// Desktop slides
const slides = [
  { src: "/videos/video1.mp4" },
  { src: "/videos/video2.mp4" },
  { src: "/videos/video3.mp4" },
  { src: "/videos/video4.mp4" },
  { src: "/videos/video5.mp4" },
  { src: "/videos/video6.mp4" },
  { src: "/videos/video7.mp4" },
];

// Mobile vertical video (reel format)
const mobileVideoSrc = "/videos/mobile-reel.mp4"; // Replace with your actual mobile video path

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    location: "",
    priceRange: "",
    dateRange: ""
  });

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

  const performSearch = (searchFilters: FilterState) => {
    setIsSearching(true);
    setSearchError(null);

    const allEvents = [
      ...recommendedEvents,
      ...sponsoredEvents,
      ...upcomingEvents
    ].filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    );

    const filteredEvents = allEvents.filter(event => {
      let matches = true;

      if (searchFilters.search) {
        const searchTerm = searchFilters.search.toLowerCase();
        const eventMatches = (
          event.title.toLowerCase().includes(searchTerm) ||
          event.description?.toLowerCase().includes(searchTerm) ||
          event.location?.toLowerCase().includes(searchTerm) ||
          event.organizer?.toLowerCase().includes(searchTerm)
        );
        matches = matches && eventMatches;
      }

      if (searchFilters.location) {
        matches = matches && event.location?.toLowerCase().includes(searchFilters.location.toLowerCase());
      }

      if (searchFilters.priceRange) {
        matches = matches && filterByPrice(event, searchFilters.priceRange);
      }

      if (searchFilters.dateRange) {
        matches = matches && filterByDate(event, searchFilters.dateRange);
      }

      return matches;
    });

    setSearchResults(filteredEvents);
    setShowSearchResults(true);
    setIsSearching(false);
  };

  const filterByPrice = (event: Event, priceRange: string) => {
    const eventPrice = parseFloat(event.price?.toString() || '0');
    
    switch (priceRange) {
      case 'free':
        return eventPrice === 0;
      case '0-50':
        return eventPrice >= 0 && eventPrice <= 50;
      case '50-200':
        return eventPrice > 50 && eventPrice <= 200;
      case '200+':
        return eventPrice > 200;
      default:
        return true;
    }
  };

  const filterByDate = (event: Event, dateRange: string) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const saturday = new Date(startOfWeek.getTime() + (6 - day) * 24 * 60 * 60 * 1000);
    const sunday = new Date(saturday.getTime() + 24 * 60 * 60 * 1000);

    switch (dateRange) {
      case 'today':
        return eventDate.toDateString() === today.toDateString();
      case 'tomorrow':
        return eventDate.toDateString() === tomorrow.toDateString();
      case 'this-week':
        return eventDate >= today && eventDate <= weekFromNow;
      case 'this-weekend':
        return (eventDate.toDateString() === saturday.toDateString() || 
                eventDate.toDateString() === sunday.toDateString());
      case 'this-month':
        return eventDate >= today && eventDate <= monthFromNow;
      case 'next-month':
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        return eventDate >= nextMonthStart && eventDate <= nextMonthEnd;
      default:
        return true;
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchQuery("");
      setFilters(prev => ({ ...prev, search: "" }));
      return;
    }

    const trimmedQuery = query.trim();
    const searchFilters = { ...filters, search: trimmedQuery };
    
    setFilters(searchFilters);
    setSearchQuery(trimmedQuery);
    performSearch(searchFilters);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    
    if (newFilters.search || newFilters.location || newFilters.priceRange || newFilters.dateRange) {
      performSearch(newFilters);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchError(null);
    setFilters({
      search: "",
      location: "",
      priceRange: "",
      dateRange: ""
    });
  };

  const handleEventClick = (event: Event) => {
    router.push(`/events/${event.id}`);
  };

  const handleSeeMore = () => {
    router.push("/events");
  };

  const CarouselSkeleton = ({ title }: { title: string }) => (
    <section className="py-16 bg-white text-gray-900">
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

  const CarouselError = ({ error, title }: { error: string; title: string }) => (
    <section className="py-16 bg-white text-gray-900">
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

  const EmptySection = ({ title, message }: { title: string; message: string }) => (
    <section className="py-16 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </section>
  );

  return (
    <main className="w-full bg-white text-gray-900 min-h-screen">
      {/* Hero Section with Video Slider */}
      <section className="w-full h-screen">
        <VideoSlider 
          slides={slides}
          mobileVideoSrc={mobileVideoSrc} // Pass mobile video here
          interval={4000} 
          onSearch={handleSearch}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          isSearching={isSearching}
        />
      </section>

      {/* Rest of the content remains the same */}
      {showSearchResults ? (
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <EventFilters onFilterChange={handleFilterChange} />
          </div>
          <SearchResults
            query={filters.search || searchQuery}
            results={searchResults}
            loading={isSearching}
            error={searchError}
            onEventClick={handleEventClick}
            onClearSearch={clearSearch}
            filters={filters}
          />
        </div>
      ) : (
        <>
          {recommendedLoading ? (
            <CarouselSkeleton title="Recommended Events" />
          ) : recommendedError ? (
            <CarouselError error={recommendedError} title="Recommended Events" />
          ) : recommendedEvents.length > 0 ? (
            <div className="bg-white">
              <RecommendedEvents
                events={recommendedEvents}
                onEventClick={handleEventClick}
                onSeeMore={handleSeeMore}
              />
            </div>
          ) : (
            <EmptySection 
              title="Recommended Events"
              message="No recommended events available at the moment."
            />
          )}

          {sponsoredLoading ? (
            <CarouselSkeleton title="Sponsored Events" />
          ) : sponsoredError ? (
            <CarouselError error={sponsoredError} title="Sponsored Events" />
          ) : sponsoredEvents.length > 0 ? (
            <div className="bg-white">
              <SponsoredEvents
                events={sponsoredEvents}
                onEventClick={handleEventClick}
                onSeeMore={handleSeeMore}
              />
            </div>
          ) : null}

          {upcomingLoading ? (
            <CarouselSkeleton title="Upcoming Events" />
          ) : upcomingError ? (
            <CarouselError error={upcomingError} title="Upcoming Events" />
          ) : upcomingEvents.length > 0 ? (
            <div className="bg-white">
              <UpcomingEvents
                events={upcomingEvents}
                onEventClick={handleEventClick}
                onSeeMore={handleSeeMore}
              />
            </div>
          ) : null}

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
        </>
      )}
    </main>
  );
}