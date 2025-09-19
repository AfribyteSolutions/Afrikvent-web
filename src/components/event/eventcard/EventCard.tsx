// components/event/eventcard/EventCard.tsx
import React from "react";
import { Event } from "@/hooks/useEvents";
import { Calendar, MapPin, Clock, User, Sparkles } from "lucide-react";

interface EventCardProps {
  event: Event;
  onClick?: (event: Event) => void;
  className?: string;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  className = "",
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 hover:border-transparent ${className}`}
      onClick={handleClick}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 group-hover:to-black/10 transition-all duration-500 pointer-events-none z-10" />
      
      {/* Event Image - Adaptive to any size/ratio */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        
        {/* Gradient overlay on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Sponsored badge with glow effect */}
        {event.isSponsored && (
          <div className="absolute top-3 left-3 z-20">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
              <Sparkles className="w-3 h-3" />
              Sponsored
            </div>
          </div>
        )}
        
        {/* Price tag with modern styling */}
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-semibold border border-white/20">
            {event.price}
          </div>
        </div>
        
        {/* Bottom overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
          <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 drop-shadow-lg">
            {event.title}
          </h3>
          
          {/* Quick info on image */}
          <div className="flex items-center gap-4 text-sm opacity-90">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{event.time}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content section - Compact and modern */}
      <div className="p-4 space-y-3">
        {/* Location and organizer */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3 h-3 text-blue-600" />
            </div>
            <span className="text-sm font-medium line-clamp-1">{event.venue}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-purple-600" />
            </div>
            <span className="text-sm line-clamp-1">{event.organizer}</span>
          </div>
        </div>
        
        {/* Description with modern truncation */}
        {event.description && (
          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}
        
        {/* Tags with modern styling */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {event.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/50"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 2 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                +{event.tags.length - 2} more
              </span>
            )}
          </div>
        )}
        
        {/* Hover action indicator */}
        <div className="flex items-center justify-between pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-xs text-gray-400 font-medium">Click to view details</div>
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center transform translate-x-2 group-hover:translate-x-0 transition-transform duration-300">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Subtle border glow on hover */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-200/50 transition-colors duration-300 pointer-events-none" />
    </div>
  );
};

export default EventCard;