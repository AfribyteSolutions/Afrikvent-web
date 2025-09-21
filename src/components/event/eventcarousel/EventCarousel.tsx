import React, { useRef } from "react";
import EventCard from "../eventcard/EventCard";
import { Event } from "@/lib/event/eventService"; // Import from EventService directly
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
    <section className="w-full py-8 sm:py-12 lg:py-16 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-transparent">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
              {title}
            </h2>
            <div className="mt-1 sm:mt-2 h-1 w-12 sm:w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          </div>
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
            {events.map((event) => (
              <div 
                key={event.id} 
                className="flex-shrink-0 w-80 xl:w-96 snap-start first:ml-0 last:mr-4"
              >
                <EventCard
                  event={event}
                  onClick={onEventClick}
                  className="h-full transform hover:scale-[1.02] transition-transform duration-300"
                />
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