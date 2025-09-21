// components/event/eventcard/EventCard.tsx
import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, User, Sparkles, ArrowUpRight } from "lucide-react";
import { Event } from "@/lib/event/eventService"; // Import from EventService directly

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
    'US': { currency: 'USD', symbol: '$' },
    'GB': { currency: 'GBP', symbol: '£' },
    'DE': { currency: 'EUR', symbol: '€' },
    'FR': { currency: 'EUR', symbol: '€' },
    'IT': { currency: 'EUR', symbol: '€' },
    'ES': { currency: 'EUR', symbol: '€' },
    'JP': { currency: 'JPY', symbol: '¥' },
    'CA': { currency: 'CAD', symbol: 'C$' },
    'AU': { currency: 'AUD', symbol: 'A$' },
    'GH': { currency: 'GHS', symbol: '₵' },
    'NG': { currency: 'NGN', symbol: '₦' },
    'KE': { currency: 'KES', symbol: 'KSh' },
    'ZA': { currency: 'ZAR', symbol: 'R' },
    'IN': { currency: 'INR', symbol: '₹' },
    'CN': { currency: 'CNY', symbol: '¥' },
    'BR': { currency: 'BRL', symbol: 'R$' },
    'MX': { currency: 'MXN', symbol: '$' },
  };

  // Get user location and currency
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        // First try to get location from IP
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.country_code && currencyMap[data.country_code]) {
          setUserLocation({
            country: data.country_code,
            currency: currencyMap[data.country_code].currency,
            currencySymbol: currencyMap[data.country_code].symbol,
          });
        } else {
          // Fallback to USD
          setUserLocation({
            country: 'US',
            currency: 'USD',
            currencySymbol: '$',
          });
        }
      } catch (error) {
        console.error('Failed to get user location:', error);
        // Fallback to USD
        setUserLocation({
          country: 'US',
          currency: 'USD',
          currencySymbol: '$',
        });
      }
    };

    getUserLocation();
  }, []);

  // Get exchange rates
  useEffect(() => {
    const getExchangeRates = async () => {
      if (!userLocation) return;

      try {
        // Using a free exchange rate API (you may want to replace with your preferred service)
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
        const data = await response.json();
        setExchangeRates(data.rates);
      } catch (error) {
        console.error('Failed to get exchange rates:', error);
      }
    };

    getExchangeRates();
  }, [userLocation]);

  // Convert price
  useEffect(() => {
    if (!userLocation || !exchangeRates || !event.price) return;

    // Extract numeric value from price string
    const priceMatch = event.price.match(/[\d,]+\.?\d*/);
    if (!priceMatch) return;

    const numericPrice = parseFloat(priceMatch[0].replace(',', ''));
    
    // Assume the original price is in USD (you may need to adjust this based on your data)
    const originalCurrency = 'USD';
    
    if (userLocation.currency !== originalCurrency && exchangeRates[userLocation.currency]) {
      const convertedAmount = numericPrice * exchangeRates[userLocation.currency];
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(convertedAmount);
      
      setConvertedPrice(`${userLocation.currencySymbol}${formatted}`);
    }
  }, [userLocation, exchangeRates, event.price]);

  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  // Get organizer name - use organization_name from ORGANIZER_KYC table
  const getOrganizerName = () => {
    // Use organization_name from ORGANIZER_KYC table if available
    if (event.organization_name) {
      return event.organization_name;
    }
    
    // Fallback to default
    return 'Event Organizer';
  };

  // Format time - work with the current Event interface
  const getEventTime = () => {
    console.log('🕐 getEventTime called with:', {
      eventTime: event.time,
      type: typeof event.time,
      truthyCheck: !!event.time,
      notTBD: event.time !== 'TBD'
    });

    // Check if event.time is already properly formatted
    if (event.time && event.time !== 'TBD') {
      console.log('✅ Event time exists and is not TBD:', event.time);
      
      // If it's already a formatted time string, use it
      if (typeof event.time === 'string' && event.time.includes(':')) {
        console.log('✅ Using formatted time string:', event.time);
        return event.time;
      }
      
      // If it's a timestamp, format it
      try {
        console.log('🔄 Attempting to parse as timestamp:', event.time);
        const startTime = new Date(event.time);
        console.log('📅 Parsed date object:', startTime, 'Valid:', !isNaN(startTime.getTime()));
        
        if (!isNaN(startTime.getTime())) {
          const formatted = startTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          console.log('✅ Formatted time:', formatted);
          return formatted;
        }
      } catch (error) {
        console.error('❌ Error formatting time:', error);
      }
    }
    
    console.log('⚠️ Falling back to TBD');
    return 'TBD';
  };

  // Format date - work with the current Event interface
  const getEventDate = () => {
    console.log('📅 getEventDate called with:', {
      eventDate: event.date,
      type: typeof event.date,
      truthyCheck: !!event.date,
      notTBD: event.date !== 'TBD'
    });

    // Check if event.date is already properly formatted
    if (event.date && event.date !== 'TBD') {
      console.log('✅ Event date exists and is not TBD:', event.date);
      
      // If it's already a formatted date string, use it
      if (typeof event.date === 'string' && (event.date.includes('/') || event.date.includes('-') || event.date.includes(' '))) {
        console.log('✅ Using formatted date string:', event.date);
        return event.date;
      }
      
      // If it's a timestamp or date string, format it
      try {
        console.log('🔄 Attempting to parse as timestamp:', event.date);
        const eventDate = new Date(event.date);
        console.log('📅 Parsed date object:', eventDate, 'Valid:', !isNaN(eventDate.getTime()));
        
        if (!isNaN(eventDate.getTime())) {
          const formatted = eventDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          console.log('✅ Formatted date:', formatted);
          return formatted;
        }
      } catch (error) {
        console.error('❌ Error formatting date:', error);
      }
    }
    
    console.log('⚠️ Falling back to TBD for date');
    return 'TBD';
  };

  console.log('Event organizer data:', {
    organization_name: event.organization_name,
    organizer_name: event.organizer_name,
    organizer: event.organizer,
    resolved: getOrganizerName()
  });

  console.log('🕐 Event time debugging:', {
    eventTime: event.time,
    eventDate: event.date,
    eventTimeType: typeof event.time,
    eventDateType: typeof event.date,
    fullEvent: event
  });

  return (
    <div
      className={`group relative bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 cursor-pointer border border-white/50 hover:border-white/80 ${className}`}
      onClick={handleClick}
    >
      {/* Premium glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
      
      {/* Main card container */}
      <div className="relative bg-white rounded-3xl overflow-hidden">
        {/* Hero Image Section - Responsive aspect ratio */}
        <div className="relative aspect-[4/5] sm:aspect-[5/6] overflow-hidden">
          {/* Main event image */}
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          
          {/* Premium overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />
          
          {/* Premium badges */}
          <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 right-2 sm:right-3 md:right-4 flex justify-between items-start z-30">
            {/* Sponsored badge */}
            {event.isSponsored && (
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-900 px-1.5 sm:px-2.5 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-[9px] sm:text-xs font-bold shadow-xl backdrop-blur-sm border border-amber-300/50">
                <Sparkles className="w-2 sm:w-3 md:w-3.5 h-2 sm:h-3 md:h-3.5" />
                <span className="tracking-wide">SPONSORED</span>
              </div>
            )}
            
            {/* Price tag with premium styling and currency conversion */}
            <div className="bg-black/90 backdrop-blur-xl text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-[9px] sm:text-xs md:text-sm font-bold border border-white/30 shadow-xl">
              <div className="text-center">
                <div className="bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                  {event.price}
                </div>
                {convertedPrice && convertedPrice !== event.price && (
                  <div className="text-[7px] sm:text-[8px] md:text-[9px] text-gray-300 mt-0.5 opacity-90">
                    ≈ {convertedPrice}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Event title overlay - Responsive positioning and sizing */}
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 md:p-6 z-30">
            <div className="space-y-1 sm:space-y-2 md:space-y-3">
              <h3 className="font-bold text-sm sm:text-lg md:text-xl lg:text-2xl leading-tight text-white drop-shadow-2xl line-clamp-2">
                {event.title}
              </h3>
              
              {/* Key event details - Responsive sizing */}
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
          
          {/* Hover overlay for interaction hint */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl">
                <ArrowUpRight className="w-5 sm:w-6 h-5 sm:h-6 text-gray-800" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Content section - Responsive padding and sizing */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-br from-gray-50/80 to-white">
          {/* Location and organizer with premium styling */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <MapPin className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-gray-800 font-semibold text-xs sm:text-sm block truncate">{event.venue}</span>
                <span className="text-gray-500 text-xs">Venue</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <User className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-gray-800 font-semibold text-xs sm:text-sm block truncate">
                  {getOrganizerName()}
                </span>
                <span className="text-gray-500 text-xs">
                  {event.organization_name ? 'Organizer' : 'Organized by'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Description */}
          {event.description && (
            <div className="border-t border-gray-100 pt-3 sm:pt-4">
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2">
                {event.description}
              </p>
            </div>
          )}
          
          {/* Tags with responsive sizing */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2">
              {event.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/60 shadow-sm"
                >
                  {tag}
                </span>
              ))}
              {event.tags.length > 3 && (
                <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
                  +{event.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Premium hover indicator - Responsive sizing */}
        <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
            <ArrowUpRight className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
          </div>
        </div>
        
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
      </div>
    </div>
  );
};

export default EventCard;