import React, { useRef } from 'react';
import EventCard from '../eventcard/EventCard';
import { Event } from '@/types/event';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface EventCarouselProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  title?: string;
  onSeeMore?: () => void;
}

const EventCarousel: React.FC<EventCarouselProps> = ({
  events,
  onEventClick,
  title = 'Events',
  onSeeMore
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardWidth = 320; // Approximate card width + gap
    const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time
    
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const canScrollLeft = () => {
    if (!scrollContainerRef.current) return false;
    return scrollContainerRef.current.scrollLeft > 0;
  };

  const canScrollRight = () => {
    if (!scrollContainerRef.current) return false;
    const container = scrollContainerRef.current;
    return container.scrollLeft < container.scrollWidth - container.clientWidth;
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
            {title}
          </h2>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* See More Button */}
            {onSeeMore && (
              <button
                onClick={onSeeMore}
                className="text-sm md:text-lg text-blue-600 hover:text-blue-700 font-semibold transition-colors inline-flex items-center gap-1 md:gap-2 group"
              >
                See More
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft()}
                className="p-1.5 md:p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight()}
                className="p-1.5 md:p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
            style={{
              scrollbarWidth: 'none', // For Firefox
              msOverflowStyle: 'none', // For Internet Explorer and Edge
            }}
          >
            {events.map((event) => (
              <div
                key={event.id}
                className="flex-shrink-0 w-72 md:w-80"
              >
                <EventCard
                  event={event}
                  onClick={onEventClick}
                  className="h-full"
                />
              </div>
            ))}
          </div>
          
          {/* Gradient Overlays for Visual Effect */}
          <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export default EventCarousel;
