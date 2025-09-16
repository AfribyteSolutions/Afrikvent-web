// src/components/tickets/StackedTicketCard.tsx
"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { EnhancedTicket, User } from "@/types/ticket";
import { TicketCard } from "./TicketCard";

interface StackedTicketCardProps {
  tickets: EnhancedTicket[];
  template: string;
  onDownload?: (ticket: EnhancedTicket) => Promise<void>;
  onShare?: (ticket: EnhancedTicket) => Promise<void>;
  onCopy?: (ticket: EnhancedTicket) => void;
  onView?: (ticket: EnhancedTicket) => void;
  user?: User;
  className?: string;
}

export const StackedTicketCard: React.FC<StackedTicketCardProps> = ({
  tickets,
  template,
  onDownload,
  onShare,
  onCopy,
  onView,
  user,
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UX hint: show until user swipes once
  const [showHint, setShowHint] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("seenHint") !== "true";
    }
    return true;
  });

  // Reset button delay
  const [showReset, setShowReset] = useState(false);

  // clamp index if tickets array changes
  useEffect(() => {
    if (currentIndex > tickets.length - 1) {
      setCurrentIndex(Math.max(0, tickets.length - 1));
    }
  }, [tickets.length, currentIndex]);

  const handleDragEnd = (info: PanInfo) => {
    const offsetY = info.offset.y;
    const velocityY = info.velocity.y;
    const threshold = 120;
    const velocityThreshold = 800;

    if (offsetY > threshold || velocityY > velocityThreshold) {
      // mark hint as seen
      if (showHint) {
        localStorage.setItem("seenHint", "true");
        setShowHint(false);
      }

      // reveal next
      setCurrentIndex((prev) => (prev < tickets.length - 1 ? prev + 1 : prev));
    }
  };

  // when at last card, start timer to show reset
  useEffect(() => {
    if (currentIndex >= tickets.length - 1 && tickets.length > 1) {
      const timer = setTimeout(() => setShowReset(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowReset(false);
    }
  }, [currentIndex, tickets.length]);

  return (
    <div className={`w-full max-w-md mx-auto flex flex-col items-center ${className}`}>
      {/* UX hint */}
      {showHint && (
        <div className="sm:hidden text-center mb-3">
          <div className="inline-block bg-black bg-opacity-5 px-3 py-1 rounded-full text-sm text-gray-600 animate-fade-in">
            Pull down to reveal next ticket
          </div>
        </div>
      )}

      {/* Ticket stack */}
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ minHeight: 480 }}
      >
        <AnimatePresence initial={false}>
          {tickets.map((ticket, index) => {
            const rel = index - currentIndex;
            if (rel < 0 || rel >= 4) return null; // show top + next 3

            const yOffset = rel * 16;
            const scale = 1 - rel * 0.02;
            const zIndex = tickets.length - index;
            const isTop = rel === 0;

            return (
              <motion.div
                key={ticket.id}
                className="absolute left-0 right-0 mx-auto w-full"
                style={{ zIndex }}
                initial={{ y: yOffset + 10, scale, opacity: 0.98 }}
                animate={{ y: yOffset, scale, opacity: 1 }}
                exit={{ opacity: 0, y: 80, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag={isTop ? "y" : false}
                dragConstraints={{ top: 0, bottom: 320 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (isTop) handleDragEnd(info);
                }}
                onClick={() => {
                  if (!isTop) {
                    setCurrentIndex(index);
                  } else {
                    if (onView) onView(ticket);
                  }
                }}
              >
                <div className="pointer-events-auto">
                  <TicketCard
                    ticket={ticket}
                    template={template}
                    onDownload={onDownload}
                    onShare={onShare}
                    onCopy={onCopy}
                    onView={onView}
                    user={user}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Navigation controls BELOW the cards */}
      {tickets.length > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-3">
          {/* Back button */}
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentIndex === 0}
            className={`px-2 py-1 text-sm rounded-md shadow transition-colors ${
              currentIndex === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Back
          </button>

          {/* Numbered buttons */}
          <div className="flex space-x-2">
            {tickets.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Show ticket ${i + 1}`}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  i === currentIndex
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-gray-700 hover:bg-blue-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset button BELOW everything */}
      {showReset && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setCurrentIndex(0)}
            className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
          >
            Reset to top
          </button>
        </div>
      )}
    </div>
  );
};
