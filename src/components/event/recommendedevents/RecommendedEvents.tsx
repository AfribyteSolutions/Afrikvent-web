// components/RecommendedEvents.tsx
import React from 'react';
import EventCard from '../eventcard/EventCard';
import { Event } from '@/types/event';

interface RecommendedEventsProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  title?: string;
  showAll?: boolean;
}

const RecommendedEvents: React.FC<RecommendedEventsProps> = ({
  events,
  onEventClick,
  title = 'Staff Picks',
  showAll = false
}) => {
  const handleViewAll = () => {
    console.log('View all events');
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Centered */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-700 mb-4">
            {title}
          </h2>
          {!showAll && (
            <button
              onClick={handleViewAll}
              className="text-blue-400 hover:text-gray font-semibold text-lg transition-colors inline-flex items-center gap-2"
            >
              See More
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={onEventClick}
              className="h-full"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendedEvents;
