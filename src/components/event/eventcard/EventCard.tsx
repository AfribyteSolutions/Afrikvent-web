"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Event } from "@/types/index"; // ✅ Use the correct Event type that matches your database

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
  const router = useRouter();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBA"; // Handle null dates
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatPrice = (price: number | string) => {
    if (typeof price === "string") return price;
    return price > 0 ? `₵${price}+` : "Free";
  };

  // Handle nullable properties safely
  const eventDate = event.date;
  const eventImage = (() => {
    if (event.image) {
      // Handle both string and string array
      if (Array.isArray(event.image)) {
        return event.image[0] || "/images/event-placeholder.jpg";
      }
      return event.image;
    }
    if (event.images && Array.isArray(event.images)) {
      return event.images[0] || "/images/event-placeholder.jpg";
    }
    return "/images/event-placeholder.jpg";
  })();
  const eventLocation = event.location || "Location TBA";
  const eventVenue = event.venue || "";
  const eventPrice = event.price || 0;

  const handleClick = () => {
    if (onClick) {
      onClick(event); // If parent passed custom handler, use it
    } else {
      router.push(`/events/${event.id}`); // ✅ Navigate to events detail page (using number id)
    }
  };

  return (
    <div
      className={`cursor-pointer transition-all duration-300 group rounded-lg ${className}`}
      onClick={handleClick}
    >
      {/* Event Image */}
      <div className="relative h-32 w-full mb-3 rounded-lg overflow-hidden border border-transparent group-hover:border-blue-500 transition-all duration-300 border-4">
        <Image
          src={eventImage}
          alt={event.title}
          fill
          className="object-cover rounded-lg"
        />
      </div>

      {/* Event Details */}
      <div className="p-3 space-y-2 text-left">
        <h3 className="font-bold text-sm text-gray-600 leading-tight line-clamp-2">
          {event.title}
        </h3>

        <div className="text-xs text-blue-400 font-medium">
          {formatDate(eventDate)}
        </div>

        <div className="text-xs text-gray-400">
          {eventVenue && eventLocation
            ? `${eventVenue} / ${eventLocation}`
            : eventLocation}
        </div>

        <div className="pt-2 flex justify-start">
          <span className="inline-block bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
            {formatPrice(eventPrice)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;