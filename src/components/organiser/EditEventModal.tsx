// EditEventModal.tsx - Real-time event editing with pre-populated data
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';


interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
  eventId: number | null;
}

interface EventData {
  id: number;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  location_name: string;
  address: string;
  category: string;
  currency: string;
  currency_symbol: string;
  images: string[];
  event_status: 'draft' | 'published' | 'cancelled';
  organizer_id: string;
  created_at: string;
  updated_at: string;
}

interface TicketTypeData {
  id: number;
  event_id: number;
  name: string;
  description: string;
  price: number;
  max_quatity: number;
  currency: string;
  currency_symbol: string;
  tickets_sold: number;
  is_active: boolean;
}

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  category: string;
  currency: string;
  image: File | null;
  existingImageUrl: string;
  ticketTypes: TicketType[];
  eventStatus: 'draft' | 'published' | 'cancelled';
}

interface TicketType {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  description: string;
  format: 'in-person' | 'online';
  isNew?: boolean;
  ticketsSold?: number;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  eventId
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [originalTickets, setOriginalTickets] = useState<TicketTypeData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    venue: '',
    category: '',
    currency: 'XOF',
    image: null,
    existingImageUrl: '',
    ticketTypes: [],
    eventStatus: 'draft'
  });

  const categories = [
    'Music & Entertainment',
    'Business & Networking',
    'Technology & Innovation',
    'Arts & Culture',
    'Sports & Fitness',
    'Food & Dining',
    'Education & Workshops',
    'Community & Social',
    'Other'
  ];

  const currencies: Currency[] = [
    // West African CFA Franc (primary default)
    { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇸🇳' },

    // Other major African currencies
    { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
    { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', flag: '🇨🇲' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
    { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', flag: '🇺🇬' },
    { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', flag: '🇹🇿' },
    { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', flag: '🇪🇹' },
    { code: 'EGP', symbol: '£', name: 'Egyptian Pound', flag: '🇪🇬' },
    { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham', flag: '🇲🇦' },
    { code: 'BWP', symbol: 'P', name: 'Botswanan Pula', flag: '🇧🇼' },

    // International currencies
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' }
  ];

  const selectedCurrency = currencies.find(c => c.code === formData.currency) || currencies[0];

  // Load event data when modal opens
  useEffect(() => {
    if (isOpen && eventId && user) {
      loadEventData();
    }
  }, [isOpen, eventId, user]);

  // Track unsaved changes
  useEffect(() => {
    if (eventData) {
      const hasChanges = checkForUnsavedChanges();
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, eventData]);

  const loadEventData = async () => {
    if (!eventId || !user) return;

    setIsDataLoading(true);
    setError('');

    try {
      // Load event details
      const { data: event, error: eventError } = await supabase
        .from('EVENTS')
        .select('*')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single();

      if (eventError) {
        throw new Error(eventError.message);
      }

      if (!event) {
        throw new Error('Event not found or you do not have permission to edit it.');
      }

      setEventData(event);

      // Load ticket types
      const { data: tickets, error: ticketsError } = await supabase
        .from('TICKET_TYPES')
        .select('*')
        .eq('event_id', eventId);

      if (ticketsError) {
        console.warn('Error loading tickets:', ticketsError);
      }

      setOriginalTickets(tickets || []);

      // Populate form with event data
      const eventDate = new Date(event.event_date);
      const formattedDate = eventDate.toISOString().split('T')[0];

      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: formattedDate,
        time: event.start_time || '',
        location: event.location_name || '',
        venue: event.address || '',
        category: event.category || '',
        currency: event.currency || 'XOF',
        image: null,
        existingImageUrl: event.images?.[0] || '',
        ticketTypes: (tickets || []).map(ticket => ({
          id: ticket.id,
          name: ticket.name,
          price: ticket.price,
          quantity: ticket.max_quatity,
          description: ticket.description || '',
          format: 'in-person' as const,
          ticketsSold: ticket.tickets_sold || 0,
          isNew: false
        })),
        eventStatus: event.event_status || 'draft'
      });

    } catch (error) {
      console.error('Error loading event data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load event data');
    } finally {
      setIsDataLoading(false);
    }
  };

  const checkForUnsavedChanges = (): boolean => {
    if (!eventData) return false;

    const eventDate = new Date(eventData.event_date);
    const formattedDate = eventDate.toISOString().split('T')[0];

    return (
      formData.title !== (eventData.title || '') ||
      formData.description !== (eventData.description || '') ||
      formData.date !== formattedDate ||
      formData.time !== (eventData.start_time || '') ||
      formData.location !== (eventData.location_name || '') ||
      formData.venue !== (eventData.address || '') ||
      formData.category !== (eventData.category || '') ||
      formData.currency !== (eventData.currency || 'XOF') ||
      formData.eventStatus !== (eventData.event_status || 'draft') ||
      formData.image !== null ||
      JSON.stringify(formData.ticketTypes) !== JSON.stringify(originalTickets.map(ticket => ({
        id: ticket.id,
        name: ticket.name,
        price: ticket.price,
        quantity: ticket.max_quatity,
        description: ticket.description || '',
        format: 'in-person' as const,
        ticketsSold: ticket.tickets_sold || 0,
        isNew: false
      })))
    );
  };

  const handleInputChange = (field: keyof EventFormData, value: string | 'draft' | 'published' | 'cancelled') => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, image: file }));
  };

  const addTicketType = () => {
    const newTicket: TicketType = {
      id: `new_${Date.now()}`,
      name: '',
      price: 0,
      quantity: 0,
      description: '',
      format: 'in-person',
      isNew: true
    };
    setFormData(prev => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, newTicket]
    }));
  };

  const updateTicketType = (id: string | number, field: keyof TicketType, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.map(ticket =>
        ticket.id === id ? { ...ticket, [field]: value } : ticket
      )
    }));
  };

  const removeTicketType = (id: string | number) => {
    const ticket = formData.ticketTypes.find(t => t.id === id);
    if (ticket && !ticket.isNew && ticket.ticketsSold && ticket.ticketsSold > 0) {
      setError('Cannot delete ticket types that have been sold. You can only deactivate them.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter(ticket => ticket.id !== id)
    }));
  };

  // Step validation functions
  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() !== '' &&
               formData.description.trim() !== '' &&
               formData.category.trim() !== '';
      case 2:
        return formData.date.trim() !== '' &&
               formData.time.trim() !== '' &&
               formData.location.trim() !== '';
      case 3:
        // Tickets are optional, but if present, name, price, and quantity must be valid
        return formData.ticketTypes.every(ticket => 
          ticket.name.trim() !== '' && 
          ticket.price >= 0 && 
          ticket.quantity > 0
        );
      case 4:
        return true; // Just choosing publish status
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && isStepValid()) {
      setCurrentStep(currentStep + 1);
      setError('');
    } else if (!isStepValid()) {
        setError('Please complete all required fields for this step before proceeding.');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const uploadEventImage = async (): Promise<string | null> => {
    if (!formData.image || !user || !eventId) return formData.existingImageUrl || null;

    try {
      const fileExt = formData.image.name.split('.').pop();
      // Use event ID and a random string to ensure unique path on update
      const fileName = `event-${eventId}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, formData.image, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        // Fallback to existing image if upload fails
        return formData.existingImageUrl || null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('Error uploading image:', error);
      return formData.existingImageUrl || null;
    }
  };

  const handleSubmit = async () => {
    if (!user || !eventId || !eventData) {
      setError('Missing required data');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Combine date and time - Use proper ISO format
      // Note: Time is in HH:MM format, combining with YYYY-MM-DD creates local time ISO
      const eventDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();

      // Upload new image if provided
      let imageUrl = formData.existingImageUrl;
      if (formData.image) {
        const uploadedUrl = await uploadEventImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Find the currency symbol for the selected currency code
      const currentCurrency = currencies.find(c => c.code === formData.currency) || currencies[0];
      const currencySymbol = currentCurrency.symbol;

      // Update the event
      const { error: eventError } = await supabase
        .from('EVENTS')
        .update({
          title: formData.title,
          description: formData.description,
          event_date: eventDateTime,
          start_time: formData.time,
          location_name: formData.location,
          address: formData.venue,
          category: formData.category,
          event_status: formData.eventStatus,
          currency: formData.currency,
          currency_symbol: currencySymbol,
          images: imageUrl ? [imageUrl] : [],
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('organizer_id', user.id);

      if (eventError) {
        throw new Error(`Failed to update event details: ${eventError.message}`);
      }

      // Handle ticket types updates
      const ticketUpdates = formData.ticketTypes.map(async (ticketType) => {
        if (ticketType.isNew) {
          // Create new ticket type
          const { error: ticketError } = await supabase
            .from('TICKET_TYPES')
            .insert([{
              event_id: eventId,
              name: ticketType.name,
              description: ticketType.description,
              price: ticketType.price,
              max_quatity: ticketType.quantity,
              currency: formData.currency,
              currency_symbol: currencySymbol
            }]);

          if (ticketError) {
            console.error('Error creating ticket type:', ticketError);
            // Non-critical error, log and continue
          }
        } else {
          // Update existing ticket type
          const { error: ticketError } = await supabase
            .from('TICKET_TYPES')
            .update({
              name: ticketType.name,
              description: ticketType.description,
              price: ticketType.price,
              // Only allow increasing quantity, not decreasing below tickets sold
              max_quatity: Math.max(ticketType.quantity, ticketType.ticketsSold || 0),
              currency: formData.currency,
              currency_symbol: currencySymbol
            })
            .eq('id', ticketType.id);

          if (ticketError) {
            console.error('Error updating ticket type:', ticketError);
            // Non-critical error, log and continue
          }
        }
      });

      await Promise.all(ticketUpdates);

      // Handle deleted ticket types (not in current formData but were in original)
      const deletedTicketIds = originalTickets
        .filter(original => 
          !formData.ticketTypes.find(current => current.id === original.id) &&
          (original.tickets_sold === 0 || original.tickets_sold === null) // Safety check: only delete if 0 sold
        )
        .map(ticket => ticket.id);

      if (deletedTicketIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('TICKET_TYPES')
          .delete()
          .in('id', deletedTicketIds);

        if (deleteError) {
          console.error('Error deleting ticket types:', deleteError);
          // Non-critical error, log and continue
        }
      }

      setHasUnsavedChanges(false);
      onSuccess();

    } catch (error) {
      console.error('Error updating event:', error);
      setError(error instanceof Error ? error.message : 'Failed to update event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close without saving?');
      if (!confirmClose) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  if (isDataLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="relative bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-center">
              <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="ml-3 text-lg font-medium text-gray-900">Loading event data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={handleClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
              <p className="text-sm text-gray-600">
                Step {currentStep} of 4
                {hasUnsavedChanges && <span className="ml-2 text-amber-600">• Unsaved changes</span>}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center">
              {[1, 2, 3, 4].map((step) => (
                <React.Fragment key={step}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Event Details</span>
              <span>Date & Location</span>
              <span>Tickets</span>
              <span>Publish</span>
            </div>
          </div>

          {/* Event Status Indicator */}
          {eventData && (
            <div className="px-6 py-3 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    eventData.event_status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : eventData.event_status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {eventData.event_status.charAt(0).toUpperCase() + eventData.event_status.slice(1)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(eventData.created_at).toLocaleDateString()}
                  {eventData.updated_at && eventData.updated_at !== eventData.created_at && (
                    <span className="ml-2">
                      • Updated: {new Date(eventData.updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form Content */}
          <div className="p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter event title"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency *
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <optgroup label="West/Central African Currencies">
                        {currencies.filter(c => ['XOF', 'XAF'].includes(c.code)).map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.flag} {currency.symbol} - {currency.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Other African Currencies">
                        {currencies.filter(c => !['XOF', 'XAF', 'USD', 'EUR', 'GBP'].includes(c.code)).map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.flag} {currency.symbol} - {currency.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="International Currencies">
                        {currencies.filter(c => ['USD', 'EUR', 'GBP'].includes(c.code)).map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.flag} {currency.symbol} - {currency.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {selectedCurrency.flag} {selectedCurrency.name}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your event..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Image
                  </label>
                  {formData.existingImageUrl && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">Current image:</p>
                      <img
                        src={formData.existingImageUrl}
                        alt="Current event media"
                        className="w-32 h-24 object-cover rounded border"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a new image to replace the current one (JPG, PNG, up to 5MB)
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Date & Location</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Time *
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name (e.g., Hotel Name, City Park) *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Accra International Conference Centre, Kumasi Sports Stadium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Address (Optional, but recommended)
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Street address, city, country"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ticket Types</h3>
                    <p className="text-sm text-gray-600">
                      Prices in {selectedCurrency.flag} {selectedCurrency.name} ({selectedCurrency.symbol})
                    </p>
                  </div>
                  <button
                    onClick={addTicketType}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Ticket Type
                  </button>
                </div>

                {formData.ticketTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">No ticket types added yet. Click -Add Ticket Type- to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.ticketTypes.map((ticket, index) => (
                      <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">Ticket Type #{index + 1}</h4>
                            {ticket.isNew && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">New</span>
                            )}
                            {ticket.ticketsSold && ticket.ticketsSold > 0 && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {ticket.ticketsSold} sold
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeTicketType(ticket.id)}
                            disabled={
                              Boolean(!ticket.isNew && ticket.ticketsSold && ticket.ticketsSold > 0)
                            }
                            className={`${
                              !ticket.isNew && ticket.ticketsSold && ticket.ticketsSold > 0
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800'
                            }`}
                            title={
                              !ticket.isNew && ticket.ticketsSold && ticket.ticketsSold > 0
                                ? 'Cannot delete ticket types with sold tickets'
                                : 'Delete ticket type'
                            }
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ticket Name *
                            </label>
                            <input
                              type="text"
                              value={ticket.name}
                              onChange={(e) => updateTicketType(ticket.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="e.g., General, VIP, Early Bird"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Price ({selectedCurrency.symbol}) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ticket.price}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                    updateTicketType(ticket.id, 'price', 0);
                                } else {
                                    updateTicketType(ticket.id, 'price', parseFloat(value) || 0);
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              min={ticket.ticketsSold && ticket.ticketsSold > 0 ? ticket.ticketsSold : 1}
                              value={ticket.quantity}
                              onChange={(e) => updateTicketType(ticket.id, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="100"
                            />
                            {ticket.ticketsSold && ticket.ticketsSold > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Min: {ticket.ticketsSold} (already sold)
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Format *
                            </label>
                            <select
                            value={ticket.format}
                            onChange={(e) => updateTicketType(ticket.id, 'format', e.target.value as 'in-person' | 'online')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                                <option value="in-person">In-Person</option>
                                <option value="online">Online</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={ticket.description}
                            onChange={(e) => updateTicketType(ticket.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Brief description of what's included"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Event Status</h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-lg font-medium text-blue-900 mb-2">Update your event status</h4>
                      <p className="text-blue-700 mb-4">
                        Choose how you want to update your event. Changes will take effect immediately after saving.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.eventStatus === 'draft'
                      ? 'border-gray-500 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('eventStatus', 'draft')}>
                    <div className="flex items-start space-x-3">
                      <div className={`w-4 h-4 rounded-full mt-1 ${
                        formData.eventStatus === 'draft'
                          ? 'bg-gray-500'
                          : 'border-2 border-gray-300'
                      }`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">Draft</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Keep the event private and not visible to attendees. Perfect for making changes before going live.
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2zM4 10V6a2 2 0 012-2h12a2 2 0 012 2v4" />
                          </svg>
                          Event will be private and not visible to attendees
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.eventStatus === 'published'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('eventStatus', 'published')}>
                    <div className="flex items-start space-x-3">
                      <div className={`w-4 h-4 rounded-full mt-1 ${
                        formData.eventStatus === 'published'
                          ? 'bg-green-500'
                          : 'border-2 border-gray-300'
                      }`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">Published</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Make your event live and visible to attendees. They can purchase tickets immediately.
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Event will be public and visible to everyone
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.eventStatus === 'cancelled'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('eventStatus', 'cancelled')}>
                    <div className="flex items-start space-x-3">
                      <div className={`w-4 h-4 rounded-full mt-1 ${
                        formData.eventStatus === 'cancelled'
                          ? 'bg-red-500'
                          : 'border-2 border-gray-300'
                      }`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">Cancelled</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Cancel the event. This will notify attendees and stop further ticket sales.
                        </p>
                        <div className="flex items-center mt-2 text-xs text-red-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          This will stop ticket sales and notify attendees
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Event Summary</h5>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Title:</span> {formData.title}</p>
                    <p><span className="font-medium">Date:</span> {formData.date} at {formData.time}</p>
                    <p><span className="font-medium">Location:</span> {formData.location}</p>
                    <p><span className="font-medium">Currency:</span> {selectedCurrency.symbol} ({selectedCurrency.name})</p>
                    <p><span className="font-medium">Ticket Types:</span> {formData.ticketTypes.length}</p>
                    <p><span className="font-medium">Status:</span>
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        formData.eventStatus === 'published'
                          ? 'bg-green-100 text-green-800'
                          : formData.eventStatus === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {formData.eventStatus.charAt(0).toUpperCase() + formData.eventStatus.slice(1)}
                      </span>
                    </p>
                    {hasUnsavedChanges && (
                      <p className="text-amber-600 font-medium mt-2">
                        ⚠️ You have unsaved changes
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                >
                  ← Previous
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
              >
                Cancel
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid() || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isLoading || !hasUnsavedChanges} // Only allow save if there are changes
                  className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed ${
                    formData.eventStatus === 'published'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : formData.eventStatus === 'cancelled'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Updating Event...
                    </>
                  ) : (
                    <>
                      {formData.eventStatus === 'published' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Update & Publish
                        </>
                      ) : formData.eventStatus === 'cancelled' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Update & Cancel Event
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;