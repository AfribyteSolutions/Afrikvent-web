// components/event/upcomingevents/UpcomingEvents.tsx
import React from "react";
import EventCarousel from "../eventcarousel/EventCarousel";
import { Event } from "@/hooks/useEvents"; // Use the transformed Event type

interface UpcomingEventsProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  title?: string;
  onSeeMore?: () => void;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events,
  onEventClick,
  title = "Upcoming Events",
  onSeeMore,
}) => {
  return (
    <EventCarousel
      events={events}
      onEventClick={onEventClick}
      title={title}
      onSeeMore={onSeeMore}
    />
  );
};

export default UpcomingEvents;