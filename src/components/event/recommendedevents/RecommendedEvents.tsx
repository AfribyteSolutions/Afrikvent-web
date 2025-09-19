// components/event/recommendedevents/RecommendedEvents.tsx
import React from "react";
import EventCarousel from "../eventcarousel/EventCarousel";
import { Event } from "@/hooks/useEvents"; // Use the transformed Event type

interface RecommendedEventsProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  title?: string;
  onSeeMore?: () => void;
}

const RecommendedEvents: React.FC<RecommendedEventsProps> = ({
  events,
  onEventClick,
  title = "Recommended Events",
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

export default RecommendedEvents;