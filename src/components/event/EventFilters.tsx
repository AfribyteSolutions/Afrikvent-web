"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, CalendarDaysIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

// Define the shape of the filter state
export interface FilterState {
  search: string;
  location: string;
  priceRange: string;
  dateRange: string;
}

// Define the shape of a city option
interface CityOption {
  name: string;
}

interface EventFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  locations?: CityOption[];
}

// Location Dropdown Component
const LocationDropdown: React.FC<{
  locations: CityOption[];
  onSelect: (location: string) => void;
  selectedLocation: string;
}> = ({ locations, onSelect, selectedLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (location: string) => {
    onSelect(location);
    setSearchTerm("");
    setIsOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="group flex justify-between items-center w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm py-3 px-4 text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <MapPinIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          <span className={selectedLocation ? "text-gray-900" : "text-gray-500"}>
            {selectedLocation || "All Locations"}
          </span>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-all duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full rounded-xl bg-white shadow-xl ring-1 ring-black/5 border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                placeholder="Search city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto py-2">
            <li
              className="cursor-pointer px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
              onClick={() => handleSelect("")}
            >
              <div className="flex items-center space-x-2">
                <MapPinIcon className="h-4 w-4 text-gray-400" />
                <span>All Locations</span>
              </div>
            </li>
            {filteredLocations.length > 0 ? (
              filteredLocations.map((location) => (
                <li
                  key={location.name}
                  className="cursor-pointer px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                  onClick={() => handleSelect(location.name)}
                >
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <span>{location.name}</span>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-2.5 text-sm text-gray-500">No cities found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// Custom Select Component
const CustomSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  icon: React.ReactNode;
}> = ({ value, onChange, options, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="group flex justify-between items-center w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm py-3 px-4 text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 group-hover:text-blue-500 transition-colors">
            {icon}
          </span>
          <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-all duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full rounded-xl bg-white shadow-xl ring-1 ring-black/5 border border-gray-100 overflow-hidden">
          <ul className="py-2">
            {options.map((option) => (
              <li
                key={option.value}
                className="cursor-pointer px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const EventFilters: React.FC<EventFiltersProps> = ({ 
  onFilterChange, 
  locations = [
    { name: "Accra" },
    { name: "Kumasi" },
    { name: "Cape Coast" },
    { name: "Tamale" },
    { name: "Tema" },
    { name: "Sunyani" }
  ]
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    location: '',
    priceRange: '',
    dateRange: '',
  });

  const handleInputChange = (name: string, value: string) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const priceOptions = [
    { value: "", label: "Any Price" },
    { value: "free", label: "Free Events" },
    { value: "0-50", label: "₵0 - ₵50" },
    { value: "50-200", label: "₵50 - ₵200" },
    { value: "200+", label: "₵200+" }
  ];

  const dateOptions = [
    { value: "", label: "Any Date" },
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "this-week", label: "This Week" },
    { value: "this-weekend", label: "This Weekend" },
    { value: "this-month", label: "This Month" },
    { value: "next-month", label: "Next Month" }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              name="search"
              className="block w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm pl-11 pr-4 py-3 text-sm font-medium placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200"
              placeholder="Search events, organizers, venues..."
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
            />
          </div>
        </div>

        {/* Location Dropdown */}
        <div>
          <LocationDropdown
            locations={locations}
            selectedLocation={filters.location}
            onSelect={(location) => handleInputChange('location', location)}
          />
        </div>

        {/* Price Range */}
        <div>
          <CustomSelect
            value={filters.priceRange}
            onChange={(value) => handleInputChange('priceRange', value)}
            options={priceOptions}
            placeholder="Any Price"
            icon={<CurrencyDollarIcon className="h-4 w-4" />}
          />
        </div>

        {/* Date Range - Full width on small screens */}
        <div className="sm:col-span-2 lg:col-span-1">
          <CustomSelect
            value={filters.dateRange}
            onChange={(value) => handleInputChange('dateRange', value)}
            options={dateOptions}
            placeholder="Any Date"
            icon={<CalendarDaysIcon className="h-4 w-4" />}
          />
        </div>

        {/* Clear Filters Button */}
        <div className="sm:col-span-2 lg:col-span-1 flex items-end">
          <button
            type="button"
            className="w-full px-4 py-3 text-sm font-medium text-gray-600 bg-white/60 border border-gray-200 rounded-xl hover:bg-white hover:text-gray-900 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            onClick={() => {
              const clearedFilters = { search: '', location: '', priceRange: '', dateRange: '' };
              setFilters(clearedFilters);
              onFilterChange(clearedFilters);
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.search || filters.location || filters.priceRange || filters.dateRange) && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs font-medium text-gray-500 px-2 py-1">Active filters:</span>
          {filters.search && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: &ldquo;{filters.search}&rdquo;
              <button 
                onClick={() => handleInputChange('search', '')}
                className="ml-1.5 h-3 w-3 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center"
              >
                ×
              </button>
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {filters.location}
              <button 
                onClick={() => handleInputChange('location', '')}
                className="ml-1.5 h-3 w-3 rounded-full bg-green-200 hover:bg-green-300 flex items-center justify-center"
              >
                ×
              </button>
            </span>
          )}
          {filters.priceRange && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {priceOptions.find(opt => opt.value === filters.priceRange)?.label}
              <button 
                onClick={() => handleInputChange('priceRange', '')}
                className="ml-1.5 h-3 w-3 rounded-full bg-purple-200 hover:bg-purple-300 flex items-center justify-center"
              >
                ×
              </button>
            </span>
          )}
          {filters.dateRange && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {dateOptions.find(opt => opt.value === filters.dateRange)?.label}
              <button 
                onClick={() => handleInputChange('dateRange', '')}
                className="ml-1.5 h-3 w-3 rounded-full bg-orange-200 hover:bg-orange-300 flex items-center justify-center"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EventFilters;