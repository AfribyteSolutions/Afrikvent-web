// components/tickets/TicketsSection.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Calendar, Search, Filter, Download, Share2, Copy, Eye, Grid, List } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { TicketCard } from "./TicketCard";

// Database types
import { Database } from "@/types/database.types";
type TicketRow = Database["public"]["Tables"]["TICKETS"]["Row"];
type TicketTypeRow = Database["public"]["Tables"]["TICKET_TYPES"]["Row"];
type EventRow = Database["public"]["Tables"]["EVENTS"]["Row"];

// App types
import { UserTicket, EnhancedTicket, User as TicketUser } from "@/types/ticket";

interface TicketFilterState { 
  search: string;
  dateRange: string;
  status: "active" | "expired";
}

interface TicketsSectionProps {
  userTickets?: UserTicket[];
  user?: TicketUser;
  onTabChange?: (tab: "active" | "expired") => void;
  onTicketCountChange?: (count: number) => void;
  isLoading?: boolean;
  error?: string | null;
  userId?: string;
}

// Available templates
const TICKET_TEMPLATES = [
  { id: "classic", name: "Classic" },
  { id: "modern", name: "Modern" },
  { id: "minimal", name: "Minimal" },
  { id: "colorful", name: "Colorful" },
  { id: "random", name: "Random" },
];

const enhanceTicket = (ticket: UserTicket): EnhancedTicket => {
  const eventDateIso = ticket.eventDate || new Date().toISOString();
  const orderId = `ORD-${ticket.id.toString().padStart(6, "0")}`;
  
  let qrCode: string;
  if (ticket.qrCodeData && ticket.qrCodeData.trim() !== '') {
    qrCode = ticket.qrCodeData;
  } else {
    qrCode = `TKT${ticket.id.toString().padStart(3, "0")}`;
  }

  const eventDate = new Date(eventDateIso);
  const now = new Date();
  const isEventInFuture = eventDate.getTime() > now.getTime();
  const ticketStatus = isEventInFuture ? "active" : "expired";

  const enhanced: EnhancedTicket = {
    id: ticket.id.toString(),
    eventId: ticket.eventId?.toString() || "",
    eventTitle: ticket.eventTitle || "Untitled Event",
    eventDate: eventDateIso,
    eventTime: ticket.eventTime || "TBD",
    eventLocation: ticket.eventLocation || "Location TBA",
    ticketType: ticket.ticketType || "General Admission",
    quantity: ticket.quantity,
    totalPrice: ticket.totalPrice ?? 0,
    purchaseDate: ticket.purchaseDate,
    status: ticket.status,
    userId: ticket.userId ?? "",
    qrCode,
    orderId,
    ticketStatus,
    qrCodeData: ticket.qrCodeData,
    validationCode: qrCode,
  };

  return enhanced;
};

const filterTickets = (tickets: EnhancedTicket[], filters: TicketFilterState): EnhancedTicket[] => {
  return tickets.filter((ticket) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        (ticket.eventTitle || "").toLowerCase().includes(searchLower) ||
        (ticket.eventLocation || "").toLowerCase().includes(searchLower) ||
        (ticket.orderId || "").toLowerCase().includes(searchLower) ||
        (ticket.ticketType || "").toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.dateRange && filters.dateRange !== "all") {
      const now = new Date();
      const eventDate = ticket.eventDate ? new Date(ticket.eventDate) : new Date(0);
      const isUpcoming = eventDate.getTime() > now.getTime();

      switch (filters.dateRange) {
        case "upcoming":
          if (!isUpcoming) return false;
          break;
        case "thisWeek": {
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (eventDate < now || eventDate > weekFromNow) return false;
          break;
        }
        case "thisMonth": {
          const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          if (eventDate < now || eventDate > monthFromNow) return false;
          break;
        }
        case "past":
          if (isUpcoming) return false;
          break;
        default:
          break;
      }
    }

    return true;
  });
};

const deduplicateTickets = (tickets: UserTicket[]): UserTicket[] => {
  const seenIds = new Set<string>();
  const deduplicated = tickets.filter((ticket) => {
    const key = ticket.id.toString();
    if (seenIds.has(key)) {
      console.log(`Duplicate ticket ID found: ${key}, skipping`);
      return false;
    }
    seenIds.add(key);
    return true;
  });

  console.log(`TicketSection deduplication: ${tickets.length} → ${deduplicated.length} tickets`);
  return deduplicated;
};

export const TicketsSection: React.FC<TicketsSectionProps> = ({
  userTickets: propUserTickets = [],
  user,
  onTabChange,
  onTicketCountChange,
  isLoading: propIsLoading = false,
  error: propError = null,
  userId,
}) => {
  const [ticketFilter, setTicketFilter] = useState<"active" | "expired">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("random");
  const [dbUserTickets, setDbUserTickets] = useState<UserTicket[]>([]);
  
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? "list" : "grid";
    }
    return "grid";
  });
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState("");

  const shouldFetchFromDb = Boolean(userId) && propUserTickets.length === 0;
  const rawUserTickets = shouldFetchFromDb ? dbUserTickets : propUserTickets;
  
  const userTickets = useMemo(() => {
    const deduplicated = deduplicateTickets(rawUserTickets);
    return deduplicated;
  }, [rawUserTickets]);

  useEffect(() => {
    if (onTicketCountChange) {
      onTicketCountChange(userTickets.length);
    }
  }, [userTickets.length, onTicketCountChange]);
  
  const isLoading = shouldFetchFromDb ? dbLoading : propIsLoading;
  const error = shouldFetchFromDb ? dbError : propError;

  useEffect(() => {
    const fetchUserTickets = async (): Promise<void> => {
      if (!shouldFetchFromDb || !userId) return;

      try {
        setDbLoading(true);
        setDbError(null);

        const { data: tickets, error: ticketsError } = await supabase
          .from("TICKETS")
          .select("*, qr_code_data")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (ticketsError) {
          console.error("Supabase tickets error:", ticketsError);
          throw ticketsError;
        }

        if (!tickets || tickets.length === 0) {
          setDbUserTickets([]);
          return;
        }

        const ticketTypeIds = [...new Set(tickets.map(t => t.ticket_type_id).filter(Boolean))];
        
        const { data: ticketTypes, error: typesError } = await supabase
          .from("TICKET_TYPES")
          .select(`
            id,
            name,
            event_id,
            EVENTS(
              id,
              title,
              event_date,
              location_name,
              start_time
            )
          `)
          .in("id", ticketTypeIds);

        if (typesError) {
          console.error("Ticket types error:", typesError);
          throw typesError;
        }

        interface EventData {
          id?: number;
          title?: string;
          event_date?: string;
          location_name?: string;
          start_time?: string;
        }

        interface TypeData {
          name: string;
          event: EventData;
        }

        const typeMap = new Map<number, TypeData>();
        ticketTypes?.forEach(type => {
          if (type.EVENTS && !Array.isArray(type.EVENTS)) {
            typeMap.set(type.id, {
              name: type.name || "General",
              event: type.EVENTS as EventData
            });
          }
        });

        const transformedTickets: UserTicket[] = tickets
          .map((ticket) => {
            const typeData = typeMap.get(ticket.ticket_type_id);
            
            if (!typeData) {
              return null;
            }

            const mapped: UserTicket = {
              id: ticket.id.toString(),
              eventId: typeData.event.id?.toString() ?? "",
              eventTitle: typeData.event.title ?? "Unknown Event",
              eventDate: typeData.event.event_date ?? "",
              eventTime: typeData.event.start_time ?? "TBD",
              eventLocation: typeData.event.location_name ?? "",
              ticketType: typeData.name ?? "General",
              quantity: parseInt(ticket.quantity ?? "1", 10),
              totalPrice: ticket.total ?? 0,
              purchaseDate: ticket.created_at ?? new Date().toISOString(),
              status: (ticket.ticket_status as UserTicket["status"]) ?? "confirmed",
              userId: ticket.user_id ?? "",
              qrCodeData: ticket.qr_code_data ?? undefined,
            };

            return mapped;
          })
          .filter((ticket): ticket is UserTicket => ticket !== null);

        setDbUserTickets(transformedTickets);
      } catch (err) {
        console.error("Error fetching user tickets:", err);
        setDbError("Failed to load tickets");
      } finally {
        setDbLoading(false);
      }
    };

    fetchUserTickets();
  }, [userId, shouldFetchFromDb]);

  const enhancedTickets = useMemo(() => {
    return userTickets.map(enhanceTicket);
  }, [userTickets]);

  const filteredTickets = useMemo(() => {
    const statusFiltered = enhancedTickets.filter((t) => t.ticketStatus === ticketFilter);
    return filterTickets(statusFiltered, {
      search: searchTerm,
      dateRange: dateFilter,
      status: ticketFilter,
    });
  }, [enhancedTickets, ticketFilter, searchTerm, dateFilter]);

  useEffect(() => {
    if (onTabChange) onTabChange(ticketFilter);
  }, [ticketFilter, onTabChange]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("list");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDownload = async (ticket: EnhancedTicket) => {
    console.log("Downloading ticket:", ticket.orderId);
    alert(`Downloading ticket ${ticket.orderId} for ${ticket.eventTitle}`);
  };

  const handleShare = async (ticket: EnhancedTicket) => {
    console.log("Sharing ticket:", ticket.orderId);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${ticket.eventTitle}`,
          text: `I'm attending ${ticket.eventTitle} on ${new Date(ticket.eventDate).toLocaleDateString()}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled or failed", err);
      }
    } else {
      const shareText = `I'm going to ${ticket.eventTitle} on ${new Date(ticket.eventDate).toLocaleDateString()}! 🎫`;
      navigator.clipboard.writeText(shareText);
      alert("Share text copied to clipboard!");
    }
  };

  const handleCopy = (ticket: EnhancedTicket) => {
    navigator.clipboard.writeText(ticket.orderId);
    setCopyFeedback(`Copied: ${ticket.orderId}`);
    setTimeout(() => setCopyFeedback(""), 2000);
  };

  const handleView = (ticket: EnhancedTicket) => {
    alert(`Viewing details for ticket: ${ticket.orderId}\nEvent: ${ticket.eventTitle}\nDate: ${new Date(ticket.eventDate).toLocaleDateString()}\nStatus: ${ticket.ticketStatus}\nQR Code: ${ticket.qrCode.substring(0, 20)}...`);
  };

  const activeTickets = enhancedTickets.filter((t) => t.ticketStatus === "active");
  const expiredTickets = enhancedTickets.filter((t) => t.ticketStatus === "expired");

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 mb-2">Loading Your Tickets</div>
          <div className="text-gray-600">Please wait while we fetch your tickets...</div>
        </div>
        <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6`}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="h-20 bg-gray-200 rounded mb-4" />
              <div className="flex space-x-2">
                <div className="flex-1 h-10 bg-gray-200 rounded" />
                <div className="w-10 h-10 bg-gray-200 rounded" />
                <div className="w-10 h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tickets</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (userTickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets yet</h3>
          <p className="text-gray-600 mb-6">You have not purchased any tickets yet. Start exploring events!</p>
          <button
            onClick={() => { window.location.href = "/events"; }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {copyFeedback && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {copyFeedback}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTicketFilter("active")}
            className={`flex-1 py-2 px-6 rounded-md text-sm font-medium transition-colors ${
              ticketFilter === "active" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Active ({activeTickets.length})
          </button>
          <button
            onClick={() => setTicketFilter("expired")}
            className={`flex-1 py-2 px-6 rounded-md text-sm font-medium transition-colors ${
              ticketFilter === "expired" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Expired ({expiredTickets.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="past">Past Events</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Template:</span>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TICKET_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredTickets.length} of {ticketFilter === "active" ? activeTickets.length : expiredTickets.length} {ticketFilter} tickets
          </div>

          {(searchTerm || dateFilter !== "all") && (
            <button
              onClick={() => { setSearchTerm(""); setDateFilter("all"); }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filteredTickets.length > 0 ? (
        <div className={`grid gap-6 ${
          viewMode === "grid" 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
            : "grid-cols-1"
        }`}>
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              template={selectedTemplate}
              onDownload={handleDownload}
              onShare={handleShare}
              onCopy={handleCopy}
              onView={handleView}
              user={user}
              className={viewMode === "list" ? "w-full max-w-2xl mx-auto" : ""}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No {ticketFilter} tickets found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || dateFilter !== "all"
                ? "No tickets match your current filters. Try adjusting your search criteria."
                : `You don't have any ${ticketFilter} tickets at the moment.`}
            </p>

            {(searchTerm || dateFilter !== "all") && (
              <button
                onClick={() => { setSearchTerm(""); setDateFilter("all"); }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsSection;