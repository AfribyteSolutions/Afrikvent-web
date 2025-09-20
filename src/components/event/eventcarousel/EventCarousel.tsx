import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar, MapPin, Clock, User, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

// Mock Event interface for demo
interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  price: string;
  image: string;
  isSponsored?: boolean;
  description?: string;
}

interface EventCarouselProps {
  events?: Event[];
  onEventClick?: (event: Event) => void;
  title?: string;
  onSeeMore?: () => void;
}

// Sample data for demo
const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'Tech Innovation Summit 2025',
    date: 'Oct 15',
    time: '9:00 AM',
    venue: 'Convention Center',
    organizer: 'Tech Community',
    price: '$50',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
    isSponsored: true,
    description: 'Join us for an exciting day of technology talks and networking.'
  },
  {
    id: '2',
    title: 'Digital Marketing Workshop',
    date: 'Oct 22',
    time: '2:00 PM',
    venue: 'Business Hub',
    organizer: 'Marketing Pro',
    price: '$30',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop',
    description: 'Learn the latest digital marketing strategies and tools.'
  },
  {
    id: '3',
    title: 'Startup Pitch Night',
    date: 'Oct 28',
    time: '6:30 PM',
    venue: 'Innovation Lab',
    organizer: 'Startup Network',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop',
    isSponsored: true,
    description: 'Watch promising startups pitch their innovative ideas.'
  },
  {
    id: '4',
    title: 'UI/UX Design Conference',
    date: 'Nov 5',
    time: '10:00 AM',
    venue: 'Design Studio',
    organizer: 'Design Guild',
    price: '$75',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=300&fit=crop',
    description: 'Explore the future of user experience and interface design.'
  },
  {
    id: '5',
    title: 'Blockchain & Crypto Meetup',
    date: 'Nov 12',
    time: '7:00 PM',
    venue: 'Tech Lounge',
    organizer: 'Crypto Community',
    price: '$25',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop',
    description: 'Deep dive into blockchain technology and cryptocurrency trends.'
  }
];

const EventCarousel: React.FC<EventCarouselProps> = ({
  events = sampleEvents,
  onEventClick,
  title = "Featured Events",
  onSeeMore,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Get items per view based on screen size
  const getItemsPerView = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return 3; // Desktop: 3 cards
      if (window.innerWidth >= 768) return 2;  // Tablet: 2 cards
      return 1; // Mobile: 1 card
    }
    return 1;
  };

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
      setCurrentIndex(0); // Reset to first slide on resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (!isAutoPlay || events.length <= itemsPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = events.length - itemsPerView;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [events.length, itemsPerView, isAutoPlay]);

  const nextSlide = () => {
    const maxIndex = events.length - itemsPerView;
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    const maxIndex = events.length - itemsPerView;
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (events.length === 0) {
    return null;
  }

  const maxIndex = Math.max(0, events.length - itemsPerView);

  return (
    <div className="w-full py-12 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              {title}
            </h2>
            <div className="hidden sm:block w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
          </div>
          
          {onSeeMore && (
            <button
              onClick={onSeeMore}
              className="group flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all duration-300 hover:shadow-lg"
            >
              <span className="hidden sm:inline">See All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          )}
        </div>

        {/* Carousel Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
        >
          {/* Cards Container */}
          <div className="overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${(currentIndex * 100) / itemsPerView}%)`
              }}
            >
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className="flex-shrink-0 px-2 sm:px-3"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <div 
                    className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 cursor-pointer group"
                    onClick={() => onEventClick?.(event)}
                  >
                    {/* Image */}
                    <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        {event.isSponsored && (
                          <div className="flex items-center gap-1.5 bg-amber-400 text-amber-900 px-3 py-1.5 rounded-full text-xs font-semibold">
                            <Sparkles className="w-3 h-3" />
                            Sponsored
                          </div>
                        )}
                        
                        <div className="bg-black/70 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-semibold ml-auto">
                          {event.price}
                        </div>
                      </div>

                      {/* Date/Time overlay */}
                      <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium">
                          <Clock className="w-3.5 h-3.5 text-green-600" />
                          {event.time}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                      <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-2 text-sm sm:text-base text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <span className="truncate">{event.organizer}</span>
                        </div>
                      </div>

                      {event.description && (
                        <p className="mt-3 text-gray-600 text-sm leading-relaxed line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {events.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200"
                aria-label="Previous events"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200"
                aria-label="Next events"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
              </button>
            </>
          )}
        </div>

        {/* Pagination Dots */}
        {events.length > itemsPerView && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }, (_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  currentIndex === index
                    ? 'bg-blue-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Event Counter */}
        <div className="text-center mt-6">
          <span className="text-sm text-gray-500 bg-white/60 backdrop-blur px-4 py-2 rounded-full">
            Showing {Math.min(events.length, itemsPerView)} of {events.length} events
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCarousel;