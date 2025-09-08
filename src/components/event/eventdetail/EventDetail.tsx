// components/EventDetails.tsx
import React, { useState } from 'react';
import Image from 'next/image';
import { Event, TicketOption } from '@/types/event';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ShareIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface EventDetailsProps {
  event: Event;
  onBookTicket?: (event: Event, ticketType: TicketOption) => void;
  onShare?: (event: Event) => void;
  onAddToCalendar?: (event: Event) => void;
}

interface Comment {
  id: string;
  user: {
    name: string;
    avatar: string;
    isHost?: boolean;
  };
  message: string;
  timestamp: string;
}

const EventDetails: React.FC<EventDetailsProps> = ({ 
  event, 
  onBookTicket, 
  onShare,
  onAddToCalendar 
}) => {
  const [selectedTicket, setSelectedTicket] = useState<TicketOption | null>(null);
  const [newComment, setNewComment] = useState('');

  // Mock comments data (in real app, this would come from props or API)
  const comments: Comment[] = [
    {
      id: '1',
      user: { name: 'Adamu Kenneth', avatar: '/avatar1.jpg' },
      message: 'This Event Seems Awesome But Is It Kid-Friendly?',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      user: { name: 'Obi Diego', avatar: '/avatar2.jpg', isHost: true },
      message: 'Absolutely Adamu, It Is Kid Friendly And It Will Be Fun Too!',
      timestamp: '1 hour ago'
    },
    {
      id: '3',
      user: { name: 'Falesu Johanson', avatar: '/avatar3.jpg' },
      message: 'Excited To Attend Again This Year. This Is The Highlight Of My Year !',
      timestamp: '45 minutes ago'
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleBookNow = () => {
    if (selectedTicket && onBookTicket) {
      onBookTicket(event, selectedTicket);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Image */}
      <div className="relative h-64 w-full">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30" />
      </div>

      <div className="p-6">
        {/* Event Date */}
        <div className="text-green-600 text-sm font-medium mb-2">
          {formatDate(event.date)}
        </div>

        {/* Event Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {event.title}
        </h1>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-4">
          <MapPinIcon className="w-5 h-5 mr-2" />
          <span>{event.venue}, {event.location}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onShare?.(event)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ShareIcon className="w-5 h-5" />
            <span>Share</span>
          </button>
          <button
            onClick={() => onAddToCalendar?.(event)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Add to Calendar</span>
          </button>
        </div>

        {/* Event Info */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Event Info</h2>
          <p className="text-gray-600 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Organizer Info */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Organizer Info</h2>
          <div className="flex items-center">
            <UserGroupIcon className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-blue-600 font-medium">{event.organizer}</span>
          </div>
        </div>

        {/* Ticket Options */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Options</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {event.ticketOptions.map((ticket, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  selectedTicket?.type === ticket.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="font-semibold text-gray-900 mb-1">
                  {ticket.type}
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {ticket.price} {ticket.currency}
                </div>
                <div className="text-xs text-gray-500">
                  {ticket.availability}
                </div>
              </div>
            ))}
          </div>

          {/* Book Now Button */}
          <button
            onClick={handleBookNow}
            disabled={!selectedTicket}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {selectedTicket 
              ? `From ${selectedTicket.price} ${selectedTicket.currency} - Book Now`
              : 'Select a ticket option'
            }
          </button>
        </div>

        {/* Comments & Questions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Comments & Questions</h2>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">
            Comments are verified and are from people that have attended events from the same organizer.
          </p>

          {/* Comments List */}
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {comment.user.name.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">
                      {comment.user.name}
                    </span>
                    {comment.user.isHost && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                        Host
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{comment.timestamp}</span>
                  </div>
                  <p className="text-gray-700 text-sm">{comment.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
            <div className="flex-1 flex">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;