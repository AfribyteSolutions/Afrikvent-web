// components/event/sponsoredevents/SponsoredEvents.tsx
import React from 'react';
import EventCarousel from '../eventcarousel/EventCarousel';
import { Event } from '@/types/event';

interface SponsoredEventsProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onSeeMore?: () => void;
}

const SponsoredEvents: React.FC<SponsoredEventsProps> = ({
  events,
  onEventClick,
  onSeeMore
}) => {
  return (
    <EventCarousel
      events={events}
      onEventClick={onEventClick}
      title="Sponsored Events"
      onSeeMore={onSeeMore}
    />
  );
};

export default SponsoredEvents;