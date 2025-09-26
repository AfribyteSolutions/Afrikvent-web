// Updated CreateEventModal with proper currency handling, navigation, and fee disclaimer
'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
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
  ticketTypes: TicketType[];
  eventStatus: 'draft' | 'published';
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
  format: 'in-person' | 'online';
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  user
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    venue: '',
    category: '',
    currency: 'XOF', // Default to West African CFA Franc
    image: null,
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

  const handleInputChange = (field: keyof EventFormData, value: string | 'draft' | 'published') => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, image: file }));
  };

  const addTicketType = () => {
    const newTicket: TicketType = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      quantity: 0,
      description: '',
      format: 'in-person'
    };
    setFormData(prev => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, newTicket]
    }));
  };

  const updateTicketType = (id: string, field: keyof TicketType, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.map(ticket =>
        ticket.id === id ? { ...ticket, [field]: value } : ticket
      )
    }));
  };

  const removeTicketType = (id: string) => {
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
        return true; // Tickets are optional
      case 4:
        return true; // Just choosing publish status
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && isStepValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const uploadEventImage = async (eventId: number): Promise<string | null> => {
    if (!formData.image || !user) return null;

    try {
      const fileExt = formData.image.name.split('.').pop();
      const fileName = `event-${eventId}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, formData.image, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Combine date and time - Use proper ISO format
      const eventDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      
      // Create the event with currency information
      const { data: eventData, error: eventError } = await supabase
        .from('EVENTS')
        .insert([{
          title: formData.title,
          description: formData.description,
          event_date: eventDateTime,
          start_time: formData.time, // Save time separately for easier parsing
          location_name: formData.location,
          address: formData.venue,
          organizer_id: user.id,
          event_status: formData.eventStatus,
          currency: formData.currency, // Save selected currency
          currency_symbol: selectedCurrency.symbol, // Save currency symbol
          is_featured: false,
          is_sponsored: false
        }])
        .select()
        .single();

      if (eventError) {
        throw new Error(eventError.message);
      }

      const eventId = eventData.id;

      // Upload image if provided
      let imageUrl: string | null = null;
      if (formData.image) {
        imageUrl = await uploadEventImage(eventId);
      }

      // Update event with image URL if uploaded
      if (imageUrl) {
        const { error: updateError } = await supabase
          .from('EVENTS')
          .update({ images: [imageUrl] })
          .eq('id', eventId);

        if (updateError) {
          console.warn('Error updating event with image:', updateError);
        }
      }

      // Create ticket types with proper currency information
      for (const ticketType of formData.ticketTypes) {
        const { error: ticketError } = await supabase
          .from('TICKET_TYPES')
          .insert([{
            event_id: eventId,
            name: ticketType.name,
            description: ticketType.description,
            price: ticketType.price,
            max_quatity: ticketType.quantity,
            currency: formData.currency, // Use event's currency
            currency_symbol: selectedCurrency.symbol // Use event's currency symbol
          }]);

        if (ticketError) {
          console.error('Error creating ticket type:', ticketError);
          // Don't throw here, just log - we don't want to fail the entire event creation
        }
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        venue: '',
        category: '',
        currency: 'XOF', // Reset to default CFA
        image: null,
        ticketTypes: [],
        eventStatus: 'draft'
      });

      setCurrentStep(1);
      onSuccess();

    } catch (error) {
      console.error('Error creating event:', error);
      setError(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
              <p className="text-sm text-gray-600">Step {currentStep} of 4</p>
            </div>
            <button
              onClick={onClose}
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload an image for your event (JPG, PNG, up to 5MB)</p>
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
                    Location/City *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Accra, Kumasi, Cape Coast"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., National Theatre, Accra International Conference Centre"
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
                          <h4 className="font-medium text-gray-900">Ticket Type #{index + 1}</h4>
                          <button
                            onClick={() => removeTicketType(ticket.id)}
                            className="text-red-600 hover:text-red-800"
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
                              min="1"
                              value={ticket.quantity}
                              onChange={(e) => updateTicketType(ticket.id, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="100"
                            />
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
                <h3 className="text-lg font-semibold text-gray-900">Publish Event</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-lg font-medium text-blue-900 mb-2">Ready to publish your event?</h4>
                      <p className="text-blue-700 mb-4">
                        Choose how you want to create your event. You can always change the status later from your dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fee Structure and Withdrawal Policy Disclaimer */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-amber-900 mb-3">Important: Fees & Withdrawal Policy</h4>
                      <div className="text-amber-800 space-y-3">
                        <div className="bg-white bg-opacity-70 rounded-lg p-4">
                          <h5 className="font-semibold mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Platform Fees
                          </h5>
                          <p className="text-sm">
                            We collect a <span className="font-semibold">9% service fee</span> on all ticket sales made through our platform. 
                            This fee covers payment processing, platform maintenance, customer support, and security features.
                          </p>
                        </div>
                        
                        <div className="bg-white bg-opacity-70 rounded-lg p-4">
                          <h5 className="font-semibold mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Withdrawal Policy
                          </h5>
                          <p className="text-sm mb-2">
                            For security and fraud prevention, funds can only be withdrawn <span className="font-semibold">after your event has concluded</span>. 
                            This policy protects both organizers and attendees.
                          </p>
                          <ul className="text-xs space-y-1 ml-4 list-disc">
                            <li>Withdrawals available 24 hours after event end time</li>
                            <li>All refunds and disputes must be resolved first</li>
                            <li>Identity verification may be required for large amounts</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-white bg-opacity-70 rounded border-l-4 border-amber-500">
                        <p className="text-sm text-amber-800">
                          <span className="font-semibold">By publishing this event, you acknowledge and agree to our fee structure and withdrawal policy.</span> 
                          These terms help us maintain a secure and reliable platform for all users.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.eventStatus === 'draft' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('eventStatus', 'draft')}>
                    <div className="flex items-start space-x-3">
                      <div className={`w-4 h-4 rounded-full mt-1 ${
                        formData.eventStatus === 'draft' 
                          ? 'bg-blue-500' 
                          : 'border-2 border-gray-300'
                      }`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">Save as Draft</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Create the event but keep it private. You can review, edit, and publish it later.
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
                        <h4 className="font-medium text-gray-900">Publish Immediately</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Make your event live and visible to attendees. They can start purchasing tickets right away.
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
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {formData.eventStatus === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </p>
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
                onClick={onClose}
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
                  disabled={!isStepValid() || isLoading}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed ${
                    formData.eventStatus === 'published'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {formData.eventStatus === 'published' ? 'Publishing...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {formData.eventStatus === 'published' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Publish Event
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save as Draft
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

export default CreateEventModal;