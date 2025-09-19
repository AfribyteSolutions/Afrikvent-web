// components/event/eventcard/EventCard.tsx
import React from "react";
import { Event } from "@/hooks/useEvents"; // Use the transformed Event type
import { Calendar, MapPin, Clock, User } from "lucide-react";

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
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {event.isSponsored && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
            Sponsored
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-semibold">
          {event.price}
        </div>
      </div>

      {/* Event Details */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{event.date}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{event.time}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="line-clamp-1">{event.organizer}</span>
          </div>
        </div>

        {event.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {event.description}
          </p>
        )}

        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 2 && (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                +{event.tags.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;