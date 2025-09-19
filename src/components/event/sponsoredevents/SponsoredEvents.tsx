// components/event/sponsoredevents/SponsoredEvents.tsx
import React from "react";
import EventCarousel from "../eventcarousel/EventCarousel";
import { Event } from "@/hooks/useEvents"; // Use the transformed Event type

interface SponsoredEventsProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  title?: string;
  onSeeMore?: () => void;
}

const SponsoredEvents: React.FC<SponsoredEventsProps> = ({
  events,
  onEventClick,
  title = "Sponsored Events",
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

export default SponsoredEvents;