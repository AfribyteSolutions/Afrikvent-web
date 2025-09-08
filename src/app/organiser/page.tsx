// src/app/events/[id]/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { MOCK_EVENTS } from '@/data/event/events';
 // ✅ import the array

// Helper to fetch event by ID
const getEventById = (id: string) => {
  return MOCK_EVENTS.find(e => e.id.toString() === id);
};

export default function Organiser() {
  const params = useParams();
  const id = params?.id as string;

  const event = getEventById(id); // ✅ now safe

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-8">
            The event you are looking for does not exist or has been moved.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 w-full">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
              {event.title}
            </h1>
            <p className="text-xl text-gray-200">{event.category}</p>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About This Event
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {event.description}
              </p>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Event Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-gray-700">
                      {formatDate(event.date)} at {event.time}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-gray-700">
                      {event.venue}, {event.location}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-gray-700">
                      Organized by {event.organizer}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Get Tickets
              </h3>
              <div className="text-3xl font-bold text-blue-500 mb-4">
                {event.price}
              </div>
              <div className="space-y-3">
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                  Buy Tickets
                </button>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Or dial:</p>
                  <p className="font-mono text-lg font-semibold text-gray-900">
                    {event.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Share Event */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Share Event
              </h3>
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors">
                  Facebook
                </button>
                <button className="flex-1 bg-blue-400 hover:bg-blue-500 text-white py-2 px-3 rounded text-sm transition-colors">
                  Twitter
                </button>
                <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm transition-colors">
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
