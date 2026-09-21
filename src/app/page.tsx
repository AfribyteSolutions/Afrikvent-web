"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import VideoSlider from "@/components/video/VideoSlider";
import { useRecommendedEvents, useSponsoredEvents, useUpcomingEvents, Event } from "@/hooks/useEvents";
import RecommendedEvents from "@/components/event/recommendedevents/RecommendedEvents";
import SponsoredEvents from "@/components/event/sponsoredevents/SponsoredEvents";
import UpcomingEvents from "@/components/event/upcomingevents/UpcomingEvents";
import SearchResults from "@/components/event/SearchResults";
import EventFilters, { FilterState } from "@/components/event/EventFilters";
import PromotionalBannerSection from "@/components/promotionbanner/PromotionBannerSection";
import { mwakwaData } from "@/lib/mwakwaBackend";

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

type SiteSectionConfig = { id?: string; section_key?: string; title?: string; body?: string; button_text?: string; button_url?: string; is_enabled?: boolean; sort_order?: number; section_type?: string; subtitle?: string; media_url?: string; mobile_media_url?: string; media_type?: string };

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [siteSections, setSiteSections] = useState<Record<string, SiteSectionConfig>>({});
  const [cmsLoaded, setCmsLoaded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    location: "",
    priceRange: "",
    dateRange: ""
  });

  useEffect(() => {
    mwakwaData.siteSections.filter({ page_slug: "home" }, "sort_order", 100, 0)
      .then((rows) => setSiteSections(Object.fromEntries(rows.map((row) => [row.section_key, row as SiteSectionConfig]))))
      .catch(() => setSiteSections({}))
      .finally(() => setCmsLoaded(true));
  }, []);

  const hasCmsSections = Object.keys(siteSections).length > 0;
  const sectionEnabled = (key: string) => !cmsLoaded || !hasCmsSections || siteSections[key]?.is_enabled === true;
  const sectionTitle = (key: string, fallback: string) => siteSections[key]?.title || fallback;

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
    <main className="w-full cms-brand-bg min-h-screen">
      {/* Hero Section with Video Slider */}
      {sectionEnabled("hero") && <section className="w-full h-screen relative">
        <VideoSlider 
          slides={siteSections.hero?.media_url ? [{ src: siteSections.hero.media_url }] : slides}
          mobileVideoSrc={siteSections.hero?.mobile_media_url || mobileVideoSrc}
          interval={4000} 
          onSearch={handleSearch}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          isSearching={isSearching}
        />
        {(siteSections.hero?.title || siteSections.hero?.subtitle) && <div className="absolute inset-x-0 top-24 z-20 text-center text-white px-4 pointer-events-none">
          {siteSections.hero?.title && <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg">{siteSections.hero.title}</h1>}
          {siteSections.hero?.subtitle && <p className="mt-3 text-base md:text-xl drop-shadow-lg">{siteSections.hero.subtitle}</p>}
        </div>}
      </section>}

      {/* CMS-controlled homepage blocks */}
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
          {sectionEnabled("recommended") && <div>{siteSections.recommended?.title && siteSections.recommended.title !== "Recommended Events" && <div className="max-w-7xl mx-auto px-4 pt-10"><h2 className="text-2xl md:text-4xl font-bold">{siteSections.recommended.title}</h2></div>}{recommendedLoading ? (
            <CarouselSkeleton title={sectionTitle("recommended", "Recommended Events")} />
          ) : recommendedError ? (
            <CarouselError error={recommendedError} title={sectionTitle("recommended", "Recommended Events")} />
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
              title={sectionTitle("recommended", "Recommended Events")}
              message="No recommended events available at the moment."
            />
          )}</div>}

          {sectionEnabled("sponsored") && <div>{siteSections.sponsored?.title && siteSections.sponsored.title !== "Sponsored Events" && <div className="max-w-7xl mx-auto px-4 pt-10"><h2 className="text-2xl md:text-4xl font-bold">{siteSections.sponsored.title}</h2></div>}{sponsoredLoading ? (
            <CarouselSkeleton title={sectionTitle("sponsored", "Sponsored Events")} />
          ) : sponsoredError ? (
            <CarouselError error={sponsoredError} title={sectionTitle("sponsored", "Sponsored Events")} />
          ) : sponsoredEvents.length > 0 ? (
            <div className="bg-white">
              <SponsoredEvents
                events={sponsoredEvents}
                onEventClick={handleEventClick}
                onSeeMore={handleSeeMore}
              />
            </div>
          ) : null}</div>}

          {sectionEnabled("upcoming") && <div>{siteSections.upcoming?.title && siteSections.upcoming.title !== "Upcoming Events" && <div className="max-w-7xl mx-auto px-4 pt-10"><h2 className="text-2xl md:text-4xl font-bold">{siteSections.upcoming.title}</h2></div>}{upcomingLoading ? (
            <CarouselSkeleton title={sectionTitle("upcoming", "Upcoming Events")} />
          ) : upcomingError ? (
            <CarouselError error={upcomingError} title={sectionTitle("upcoming", "Upcoming Events")} />
          ) : upcomingEvents.length > 0 ? (
            <div className="bg-white">
              <UpcomingEvents
                events={upcomingEvents}
                onEventClick={handleEventClick}
                onSeeMore={handleSeeMore}
              />
            </div>
          ) : null}</div>}

          {sectionEnabled("promotion_banners") && <PromotionalBannerSection />}

          {sectionEnabled("final_cta") && <section className="py-16 cms-cta-gradient text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{sectionTitle("final_cta", "Ready to Find Your Next Event?")}</h2>
              <p className="text-xl mb-8 opacity-90">
                {siteSections.final_cta?.body || "Join event-goers discovering experiences through Mwakwa."}
              </p>
              <button
                onClick={() => router.push(siteSections.final_cta?.button_url || "/events")}
                className="bg-white cms-primary-text px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                {siteSections.final_cta?.button_text || "Explore All Events"}
              </button>
            </div>
          </section>}
        </>
      )}
    </main>
  );
}