import React, { useRef } from "react";
import EventCard from "../eventcard/EventCard";
import { Event } from "@/hooks/useEvents"; // Use the transformed Event type
import { ArrowRight } from "lucide-react";

interface EventCarouselProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  title?: string;
  onSeeMore?: () => void;
}

const EventCarousel: React.FC<EventCarouselProps> = ({
  events,
  onEventClick,
  title = "Events",
  onSeeMore,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
              {title}
            </h2>
            <div className="mt-1 sm:mt-2 h-1 w-12 sm:w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          </div>

          {/* See More Arrow Button */}
          {onSeeMore && (
            <button
              onClick={onSeeMore}
              className="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              aria-label="See more events"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Event Count Indicator */}
          <div className="mb-4 sm:mb-6">
            <span className="text-xs sm:text-sm text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full">
              {events.length} {events.length === 1 ? 'Event' : 'Events'}
            </span>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none", // For Firefox
              msOverflowStyle: "none", // For Internet Explorer and Edge
            }}
          >
            {events.map((event, index) => (
              <div 
                key={event.id} 
                className="flex-shrink-0 w-64 sm:w-72 md:w-80 lg:w-96 snap-start first:ml-0 last:mr-4"
              >
                <div className="group">
                  <EventCard
                    event={event}
                    onClick={onEventClick}
                    className="h-full transform group-hover:scale-[1.02] transition-transform duration-300 shadow-md hover:shadow-xl"
                  />
          
                </div>
              </div>
            ))}
            
            {/* End Spacer for Better Scroll Experience */}
            <div className="flex-shrink-0 w-4 sm:w-6"></div>
          </div>

          {/* Scroll Indicators */}
          <div className="flex justify-center mt-4 sm:mt-6 space-x-1">
            {events.slice(0, Math.min(events.length, 8)).map((_, index) => (
              <div
                key={index}
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-300"
              />
            ))}
            {events.length > 8 && (
              <div className="flex items-center ml-2">
                <span className="text-xs text-gray-400">+{events.length - 8}</span>
              </div>
            )}
          </div>

          {/* Modern Gradient Overlays */}
          <div className="absolute top-0 left-0 w-4 sm:w-6 lg:w-8 h-full bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 right-0 w-4 sm:w-6 lg:w-8 h-full bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
          
          {/* Bottom fade for mobile */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none sm:hidden" />
        </div>

        {/* Mobile Swipe Hint */}
        <div className="flex justify-center mt-4 sm:hidden">
          <div className="flex items-center space-x-2 text-gray-400 text-xs">
            <div className="flex space-x-1">
              <div className="w-6 h-0.5 bg-gray-300 rounded"></div>
              <div className="w-4 h-0.5 bg-gray-400 rounded"></div>
              <div className="w-6 h-0.5 bg-gray-300 rounded"></div>
            </div>
            <span>Swipe to explore</span>
          </div>
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          /* Smooth scroll behavior enhancement */
          @media (prefers-reduced-motion: no-preference) {
            .scroll-smooth {
              scroll-behavior: smooth;
            }
          }
        `}</style>
      </div>
    </section>
  );
};

export default EventCarousel;