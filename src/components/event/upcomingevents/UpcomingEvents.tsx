// components/event/upcomingevents/UpcomingEvents.tsx
import React from 'react';
import EventCarousel from '../eventcarousel/EventCarousel';
import { Event } from '@/types/event';

interface UpcomingEventsProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onSeeMore?: () => void;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events,
  onEventClick,
  onSeeMore
}) => {
  return (
    <EventCarousel
      events={events}
      onEventClick={onEventClick}
      title="Upcoming Events"
      onSeeMore={onSeeMore}
    />
  );
};

export default UpcomingEvents;