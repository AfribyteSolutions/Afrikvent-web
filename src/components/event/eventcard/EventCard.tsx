// components/event/eventcard/EventCard.tsx
import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Sparkles, ArrowUpRight } from "lucide-react";

// Updated Event interface with currency fields
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  image: string;
  organizer: string;
  organization_name?: string;
  organizer_name?: string;
  price: string;
  currency: string; // Add this
  currency_symbol: string; // Add this
  tags: string[];
  isSponsored?: boolean;
  ticketOptions?: TicketOption[];
}

interface TicketOption {
  type: string;
  price: string;
  currency: string;
  currency_symbol: string;
  availability: string;
}

interface EventCardProps {
  event: Event;
  onClick?: (event: Event) => void;
  className?: string;
}

interface UserLocation {
  country: string;
  currency: string;
  currencySymbol: string;
}

interface ExchangeRates {
  [key: string]: number;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  className = "",
}) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [convertedPrice, setConvertedPrice] = useState<string>("");

  // Currency mapping
  const currencyMap: { [key: string]: { currency: string; symbol: string } } = {
    US: { currency: "USD", symbol: "$" },
    GB: { currency: "GBP", symbol: "£" },
    DE: { currency: "EUR", symbol: "€" },
    FR: { currency: "EUR", symbol: "€" },
    IT: { currency: "EUR", symbol: "€" },
    ES: { currency: "EUR", symbol: "€" },
    JP: { currency: "JPY", symbol: "¥" },
    CA: { currency: "CAD", symbol: "C$" },
    AU: { currency: "AUD", symbol: "A$" },
    GH: { currency: "GHS", symbol: "₵" },
    NG: { currency: "NGN", symbol: "₦" },
    KE: { currency: "KES", symbol: "KSh" },
    ZA: { currency: "ZAR", symbol: "R" },
    IN: { currency: "INR", symbol: "₹" },
    CN: { currency: "CNY", symbol: "¥" },
    BR: { currency: "BRL", symbol: "R$" },
    MX: { currency: "MXN", symbol: "$" },
    SN: { currency: "XOF", symbol: "CFA" },
    // Add more West African countries that use CFA
    BF: { currency: "XOF", symbol: "CFA" }, // Burkina Faso
    CI: { currency: "XOF", symbol: "CFA" }, // Côte d'Ivoire
    GW: { currency: "XOF", symbol: "CFA" }, // Guinea-Bissau
    ML: { currency: "XOF", symbol: "CFA" }, // Mali
    NE: { currency: "XOF", symbol: "CFA" }, // Niger
    TG: { currency: "XOF", symbol: "CFA" }, // Togo
  };

  // Get user location and currency
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();

        if (data.country_code && currencyMap[data.country_code]) {
          setUserLocation({
            country: data.country_code,
            currency: currencyMap[data.country_code].currency,
            currencySymbol: currencyMap[data.country_code].symbol,
          });
        } else {
          // Fallback to CFA
          setUserLocation({
            country: "SN",
            currency: "XOF",
            currencySymbol: "CFA",
          });
        }
      } catch (error) {
        console.error("Failed to get user location:", error);
        // Fallback to CFA
        setUserLocation({
          country: "SN",
          currency: "XOF",
          currencySymbol: "CFA",
        });
      }
    };

    getUserLocation();
  }, []);

  // Get exchange rates
  useEffect(() => {
    const getExchangeRates = async () => {
      if (!userLocation || !event.currency) return;
      if (userLocation.currency === event.currency) return;

      try {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${event.currency}`
        );
        const data = await response.json();
        setExchangeRates(data.rates);
      } catch (error) {
        console.error("Failed to get exchange rates:", error);
      }
    };

    getExchangeRates();
  }, [userLocation, event.currency]);

  // Convert price
  useEffect(() => {
    if (!userLocation || !exchangeRates || !event.price || !event.currency)
      return;

    if (userLocation.currency === event.currency) return;

    // Handle "Free" events
    if (event.price.toLowerCase() === "free") return;

    const priceMatch = event.price.match(/[\d,]+\.?\d*/);
    if (!priceMatch) return;

    const numericPrice = parseFloat(priceMatch[0].replace(",", ""));

    if (exchangeRates[userLocation.currency]) {
      const convertedAmount =
        numericPrice * exchangeRates[userLocation.currency];
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(convertedAmount);

      setConvertedPrice(`${userLocation.currencySymbol}${formatted}`);
    }
  }, [userLocation, exchangeRates, event.price, event.currency]);

  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  const getOrganizerName = () =>
    event.organization_name || event.organizer_name || event.organizer || "Event Organizer";

  const getPriceDisplay = () => {
    // Handle free events
    if (event.price.toLowerCase() === "free") {
      return { primary: "Free", secondary: null };
    }

    // Use the event's currency and symbol from the database
    const originalPrice = `${event.currency_symbol}${event.price}`;

    if (
      convertedPrice &&
      userLocation &&
      userLocation.currency !== event.currency
    ) {
      return { primary: originalPrice, secondary: `≈ ${convertedPrice}` };
    }

    return { primary: originalPrice, secondary: null };
  };

  const getEventTime = () => {
    if (!event.time || event.time === "TBD") {
      return "TBD";
    }

    // Handle different time formats
    if (typeof event.time === "string") {
      // If it's already in HH:MM format
      if (event.time.match(/^\d{2}:\d{2}$/)) {
        return event.time;
      }
      
      // If it contains time info, try to parse it
      if (event.time.includes(":")) {
        try {
          // Extract time part if it's a full datetime string
          const timePart = event.time.includes("T") ? event.time.split("T")[1] : event.time;
          const timeOnly = timePart.split(".")[0]; // Remove milliseconds if present
          
          // Create a date object to format the time
          const [hours, minutes] = timeOnly.split(":");
          const date = new Date();
          date.setHours(parseInt(hours, 10));
          date.setMinutes(parseInt(minutes, 10));
          
          return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        } catch {
          return "TBD";
        }
      }

      // Try to parse as full datetime
      try {
        const startTime = new Date(event.time);
        if (!isNaN(startTime.getTime())) {
          return startTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }
      } catch {
        return "TBD";
      }
    }

    return "TBD";
  };

  const getEventDate = () => {
    if (!event.date || event.date === "TBD") {
      return "TBD";
    }

    // Handle different date formats
    if (typeof event.date === "string") {
      // If it's already formatted (contains / or -)
      if (event.date.includes("/") || event.date.includes("-") || event.date.includes(" ")) {
        try {
          const eventDate = new Date(event.date);
          if (!isNaN(eventDate.getTime())) {
            return eventDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          }
          // If parsing fails, return as is if it looks like a date
          return event.date;
        } catch {
          return event.date;
        }
      }

      // Try to parse as ISO string or other formats
      try {
        const eventDate = new Date(event.date);
        if (!isNaN(eventDate.getTime())) {
          return eventDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
      } catch {
        return "TBD";
      }
    }

    return "TBD";
  };

  const priceDisplay = getPriceDisplay();

  return (
    <div
      className={`group relative bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 cursor-pointer border border-white/50 hover:border-white/80 ${className}`}
      onClick={handleClick}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
      <div className="relative bg-white rounded-3xl overflow-hidden">
        <div className="relative aspect-[4/5] sm:aspect-[5/6] overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />
          <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 right-2 sm:right-3 md:right-4 flex justify-between items-start z-30">
            {event.isSponsored && (
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-900 px-1.5 sm:px-2.5 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-[9px] sm:text-xs font-bold shadow-xl backdrop-blur-sm border border-amber-300/50">
                <Sparkles className="w-2 sm:w-3 md:w-3.5 h-2 sm:h-3 md:h-3.5" />
                <span className="tracking-wide">SPONSORED</span>
              </div>
            )}
            <div className="bg-black/90 backdrop-blur-xl text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-[9px] sm:text-xs md:text-sm font-bold border border-white/30 shadow-xl">
              <div className="text-center">
                <div className="bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                  {priceDisplay.primary}
                </div>
                {priceDisplay.secondary && (
                  <div className="text-[7px] sm:text-[8px] md:text-[9px] text-gray-300 mt-0.5 opacity-90">
                    {priceDisplay.secondary}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 md:p-6 z-30">
            <div className="space-y-1 sm:space-y-2 md:space-y-3">
              <h3 className="font-bold text-sm sm:text-lg md:text-xl lg:text-2xl leading-tight text-white drop-shadow-2xl line-clamp-2">
                {event.title}
              </h3>
              <div className="flex flex-wrap gap-1 sm:gap-2 md:gap-4 text-white/90 text-[8px] sm:text-xs md:text-sm">
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 bg-white/20 backdrop-blur-md px-1.5 sm:px-2.5 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full">
                  <Calendar className="w-2 sm:w-3 md:w-3.5 h-2 sm:h-3 md:h-3.5" />
                  <span className="font-medium">{getEventDate()}</span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 bg-white/20 backdrop-blur-md px-1.5 sm:px-2.5 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full">
                  <Clock className="w-2 sm:w-3 md:w-3.5 h-2 sm:h-3 md:h-3.5" />
                  <span className="font-medium">{getEventTime()}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl">
                <ArrowUpRight className="w-5 sm:w-6 h-5 sm:h-6 text-gray-800" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-br from-gray-50/80 to-white">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <MapPin className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-gray-700 font-medium text-sm sm:text-base truncate">
                  {event.venue}, {event.location}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-xs sm:text-sm font-bold text-white">
                  {getOrganizerName().charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-gray-700 font-medium text-sm sm:text-base truncate">
                  {getOrganizerName()}
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base line-clamp-3">
            {event.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventCard;