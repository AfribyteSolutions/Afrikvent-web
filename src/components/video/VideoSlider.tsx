"use client";
import React, { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import VideoSlide from "./VideoSlide";

type Slide = {
  src: string;
  poster?: string;
  title?: string;
  loop?: boolean;
};

type VideoSliderProps = {
  slides: Slide[];
  interval?: number;
  transitionDuration?: number;
  pauseOnHover?: boolean;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  isSearching?: boolean;
};

const VideoSlider: React.FC<VideoSliderProps> = ({
  slides,
  interval = 4000,
  transitionDuration = 0.4,
  pauseOnHover = false,
  onSearch,
  searchQuery = '',
  onSearchQueryChange,
  isSearching = false,
}) => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Local state for search input to ensure it's always controlled
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const total = slides.length;
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  // Sync local state with prop
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, interval);
    return () => clearInterval(id);
  }, [interval, total, isPaused]);

  // Play active video, pause others
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === current) {
        v.currentTime = 0;
        const playPromise = v.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch(() => {});
        }
      } else {
        v.pause();
      }
    });
  }, [current]);

  // Handle search - Fixed to use local state and prevent empty searches
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = localSearchQuery.trim();
    if (trimmedQuery && onSearch) {
      console.log('Searching for:', trimmedQuery); // Debug log
      onSearch(trimmedQuery);
    } else {
      console.log('Search query is empty or onSearch is not provided'); // Debug log
    }
  };

  // Fixed input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value); // Update local state immediately
    if (onSearchQueryChange) {
      onSearchQueryChange(value); // Also update parent state
    }
  };

  // Handle popular search clicks - Fixed to use proper state management
  const handlePopularSearchClick = (term: string) => {
    setLocalSearchQuery(term);
    if (onSearchQueryChange) {
      onSearchQueryChange(term);
    }
    if (onSearch) {
      console.log('Popular search clicked:', term); // Debug log
      onSearch(term);
    }
  };

  const trackStyle: React.CSSProperties = {
    transform: `translateX(-${current * 100}%)`,
    transition: `transform ${transitionDuration}s ease`,
    width: `${total * 100}%`,
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      style={{ backgroundColor: "black" }}
    >
      <div
        className="flex w-full h-full z-0"
        style={trackStyle}
        role="list"
        aria-roledescription="carousel"
      >
        {slides.map((s, i) => (
          <div
            key={s.src + i}
            className="w-full h-screen flex-shrink-0"
            role="listitem"
            aria-hidden={i !== current}
          >
            <VideoSlide
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              src={s.src}
              poster={s.poster}
              title={s.title}
              onEnded={() => setCurrent((prev) => (prev + 1) % total)}
              loop={s.loop ?? false}
            />
          </div>
        ))}
      </div>

      {/* Centered Overlay Content */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="w-full max-w-4xl px-4">
          {/* Hero Text */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
              Discover Amazing Events
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-xl">
              Find the perfect event for you - from conferences to concerts, workshops to festivals
            </p>
          </div>

          {/* Search Bar - Fixed with proper value binding */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              </div>
              <input
                type="text"
                className="block w-full rounded-2xl border-2 border-gray-200 bg-white/95 backdrop-blur-sm pl-14 pr-32 py-4 text-lg placeholder-gray-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 shadow-lg hover:shadow-xl"
                placeholder="Search events, organizers, venues..."
                value={localSearchQuery} // Use local state for immediate updates
                onChange={handleInputChange}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="submit"
                  disabled={isSearching || !localSearchQuery.trim()}
                  className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold text-base hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    (isSearching || !localSearchQuery.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </form>

          {/* Popular Searches */}
          <div className="max-w-2xl mx-auto mt-6">
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-sm text-white/70 mr-2">Popular:</span>
              {['Music', 'Festival', 'Live', 'Cameroon'].map((term) => (
                <button
                  key={term}
                  onClick={() => handlePopularSearchClick(term)}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-colors duration-200 border border-white/20"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Navigation Dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === current 
                ? 'bg-white shadow-lg' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoSlider;