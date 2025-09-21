"use client";
import React from "react";
import Image from "next/image";
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Event } from "@/hooks/useEvents";
import { FilterState } from "@/components/event/EventFilters";

interface SearchResultsProps {
  query: string;
  results: Event[];
  loading: boolean;
  error: string | null;
  onEventClick: (event: Event) => void;
  onClearSearch: () => void;
  filters?: FilterState;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  results,
  loading,
  error,
  onEventClick,
  onClearSearch,
  filters,
}) => {
  // Loading skeleton for search results
  const SearchSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-300"></div>
          <div className="p-6">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error state
  const ErrorState = () => (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Search Error</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={onClearSearch}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );

  // Empty results state
  const EmptyState = () => (
    <div className="text-center py-16">
      <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
      <p className="text-gray-600 mb-6">
        We could not find any events matching `{query}`. Try adjusting your search terms.
      </p>
      <button
        onClick={onClearSearch}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Clear Search
      </button>
    </div>
  );

  // Event card component
  const EventCard = ({ event }: { event: Event }) => (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-200 hover:shadow-xl"
      onClick={() => onEventClick(event)}
    >
      <div className="relative h-48">
        <Image
          src={event.image || "/images/event-placeholder.jpg"}
          alt={event.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Removed is_featured check since it doesn't exist in Event type */}
        {event.price && (
          <div className="absolute top-3 right-3">
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
              ${event.price}
            </span>
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="mr-4">📅 {new Date(event.date).toLocaleDateString()}</span>
          <span>📍 {event.location}</span>
        </div>
        {event.organizer && (
          <div className="text-sm text-gray-500">
            by {event.organizer}
          </div>
        )}
      </div>
    </div>
  );

  // Helper function to get search title
  const getSearchTitle = () => {
    if (query) return "Search Results";
    if (filters?.location || filters?.priceRange || filters?.dateRange) {
      return "Filtered Events";
    }
    return "All Events";
  };

  // Helper function to get results description
  const getResultsDescription = () => {
    const activeFilters = [];
    if (query) activeFilters.push(`"${query}"`);
    if (filters?.location) activeFilters.push(filters.location);
    if (filters?.priceRange) activeFilters.push(getPriceRangeLabel(filters.priceRange));
    if (filters?.dateRange) activeFilters.push(getDateRangeLabel(filters.dateRange));

    if (activeFilters.length === 0) {
      return `${results.length} events found`;
    }

    return `${results.length} events found for ${activeFilters.join(", ")}`;
  };

  // Helper function to get price range label
  const getPriceRangeLabel = (priceRange: string) => {
    const priceOptions: { [key: string]: string } = {
      "free": "Free Events",
      "0-50": "₵0 - ₵50",
      "50-200": "₵50 - ₵200",
      "200+": "₵200+"
    };
    return priceOptions[priceRange] || priceRange;
  };

  // Helper function to get date range label
  const getDateRangeLabel = (dateRange: string) => {
    const dateOptions: { [key: string]: string } = {
      "today": "Today",
      "tomorrow": "Tomorrow",
      "this-week": "This Week",
      "this-weekend": "This Weekend",
      "this-month": "This Month",
      "next-month": "Next Month"
    };
    return dateOptions[dateRange] || dateRange;
  };

  return (
    <section className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {getSearchTitle()}
            </h2>
            <p className="text-gray-600">
              {loading ? (
                "Searching..."
              ) : error ? (
                "Search failed"
              ) : (
                getResultsDescription()
              )}
            </p>
          </div>
          <button
            onClick={onClearSearch}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
            Back to Home
          </button>
        </div>

        {/* Search Results Content */}
        {loading ? (
          <SearchSkeleton />
        ) : error ? (
          <ErrorState />
        ) : results.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Load More Button (if you want pagination) */}
        {results.length > 0 && !loading && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Load More Events
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchResults;