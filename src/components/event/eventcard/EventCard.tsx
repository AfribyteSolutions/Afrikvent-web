"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";  // ✅ import router
import { Event } from "@/types/event";

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
  const router = useRouter(); // ✅ get router instance

  const formatDate = (dateString: string) => {
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

  const handleClick = () => {
    if (onClick) {
      onClick(event); // ✅ If parent passed custom handler, use it
    } else {
      router.push(`/${event.id}`); // ✅ Navigate to detail page
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
          src={event.image}
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
          {formatDate(event.date)}
        </div>

        <div className="text-xs text-gray-400">
          {event.venue && event.location
            ? `${event.venue} / ${event.location}`
            : event.location}
        </div>

        <div className="pt-2 flex justify-start">
          <span className="inline-block bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
            {formatPrice(event.price || "Free")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
