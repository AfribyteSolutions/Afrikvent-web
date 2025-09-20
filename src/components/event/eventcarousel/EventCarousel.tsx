import React, { useState, useEffect, useRef } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (events.length > 1 && !isAnimating && !isDragging) {
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % events.length);
        setTimeout(() => setIsAnimating(false), 1000);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [events.length, isAnimating, isDragging]);

  // Navigation functions
  const navigateToIndex = (index: number) => {
    if (!isAnimating && !isDragging) {
      setIsAnimating(true);
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  const navigateNext = () => {
    const nextIndex = (currentIndex + 1) % displayEvents.length;
    navigateToIndex(nextIndex);
  };

  const navigatePrev = () => {
    const prevIndex = (currentIndex - 1 + displayEvents.length) % displayEvents.length;
    navigateToIndex(prevIndex);
  };

  // Touch and mouse event handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setCurrentX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    setCurrentX(clientX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const deltaX = currentX - startX;
    const threshold = 50; // Minimum drag distance to trigger navigation
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        navigatePrev(); // Dragged right, go to previous
      } else {
        navigateNext(); // Dragged left, go to next
      }
    }
    
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

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
        <div className="relative flex justify-center items-center h-[500px]">
          <div 
            className="relative w-96 h-96 perspective-1000 select-none"
            ref={carouselRef}
            onMouseDown={handleMouseDown}
            onMouseMove={isDragging ? handleMouseMove : undefined}
            onMouseUp={isDragging ? handleMouseUp : undefined}
            onMouseLeave={isDragging ? handleMouseUp : undefined}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className={`absolute w-full h-full transform-style-preserve-3d transition-transform ${isDragging ? 'duration-0' : 'duration-1000'} ease-out`}
              style={{
                transform: `translateZ(-250px) rotateY(${-currentIndex * (360 / displayEvents.length)}deg)`
              }}
            >
              {displayEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="absolute top-0 left-0 w-96 h-[420px] cursor-pointer group"
                  style={{
                    transform: `rotateY(${index * (360 / displayEvents.length)}deg) translateZ(250px)`
                  }}
                  onClick={() => onEventClick?.(event)}
                >
                  {/* Event Card */}
                  <div className="w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 border border-gray-100 group-hover:border-blue-200">
                    {/* Image Section - Made much taller */}
                    <div className="relative h-80 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      
                      {/* Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        {event.isSponsored && (
                          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                            <Sparkles className="w-3.5 h-3.5" />
                            Sponsored
                          </div>
                        )}
                        
                        <div className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold">
                          {event.price}
                        </div>
                      </div>
                      
                      {/* Title Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="font-bold text-xl leading-tight line-clamp-2 drop-shadow-2xl mb-3">
                          {event.title}
                        </h3>
                        
                        {/* Quick info on image */}
                        <div className="flex flex-wrap gap-3 text-white/90 text-sm">
                          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="font-medium">{event.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-medium">{event.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Section - Smaller since image is bigger */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 text-green-500" />
                        <span className="truncate font-medium">{event.venue}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <User className="w-4 h-4 text-orange-500" />
                        <span className="truncate">{event.organizer}</span>
                      </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
            {displayEvents.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentIndex === index 
                    ? 'bg-blue-500 scale-125 shadow-lg' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => navigateToIndex(index)}
              />
            ))}
          </div>
          
          {/* Drag Hint */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-xs text-gray-400 bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm">
              {isDragging ? 'Release to navigate' : 'Drag or click dots to navigate'}
            </div>
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