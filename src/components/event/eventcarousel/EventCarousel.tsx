import React, { useState, useEffect } from 'react';
import { Event } from '@/hooks/useEvents';
import { ArrowRight, Calendar, MapPin, Clock, User, Sparkles } from 'lucide-react';

interface Event3DCarouselProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  title?: string;
  onSeeMore?: () => void;
}

const Event3DCarousel: React.FC<Event3DCarouselProps> = ({
  events,
  onEventClick,
  title = "Featured Events",
  onSeeMore,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (events.length > 1 && !isAnimating) {
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % events.length);
        setTimeout(() => setIsAnimating(false), 1000);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [events.length, isAnimating]);

  if (events.length === 0) {
    return null;
  }

  const displayEvents = events.slice(0, 5); // Limit to 5 cards max for optimal 3D effect

  return (
    <div className="w-full py-16 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-700 to-purple-700 bg-clip-text text-transparent">
              {title}
            </h2>
            {onSeeMore && (
              <button
                onClick={onSeeMore}
                className="group flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300"
                aria-label="See more events"
              >
                <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            )}
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto" />
        </div>

        {/* 3D Carousel Container */}
        <div className="relative flex justify-center items-center h-96">
          <div className="relative w-80 h-80 perspective-1000">
            <div 
              className="absolute w-full h-full transform-style-preserve-3d transition-transform duration-1000 ease-out"
              style={{
                transform: `translateZ(-200px) rotateY(${-currentIndex * (360 / displayEvents.length)}deg)`
              }}
            >
              {displayEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="absolute top-0 left-0 w-80 h-72 cursor-pointer group"
                  style={{
                    transform: `rotateY(${index * (360 / displayEvents.length)}deg) translateZ(200px)`
                  }}
                  onClick={() => onEventClick?.(event)}
                >
                  {/* Event Card */}
                  <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 group-hover:border-blue-200">
                    {/* Image Section */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        {event.isSponsored && (
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                            <Sparkles className="w-3 h-3" />
                            Sponsored
                          </div>
                        )}
                        
                        <div className="bg-black/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-bold">
                          {event.price}
                        </div>
                      </div>
                      
                      {/* Title Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg leading-tight line-clamp-2 drop-shadow-lg">
                          {event.title}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>{event.date}</span>
                        <Clock className="w-4 h-4 text-purple-500 ml-2" />
                        <span>{event.time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 text-green-500" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <User className="w-4 h-4 text-orange-500" />
                        <span className="truncate">{event.organizer}</span>
                      </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation Dots */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {displayEvents.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentIndex === index 
                    ? 'bg-blue-500 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => {
                  if (!isAnimating) {
                    setIsAnimating(true);
                    setCurrentIndex(index);
                    setTimeout(() => setIsAnimating(false), 1000);
                  }
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Event Counter */}
        <div className="text-center mt-8">
          <span className="text-sm text-gray-500 font-medium px-4 py-2 bg-white/60 backdrop-blur rounded-full shadow-sm">
            Showing {displayEvents.length} of {events.length} events
          </span>
        </div>
      </div>
      
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
};

export default Event3DCarousel;