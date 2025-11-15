// src/components/organiser/OrganiserProfileSetup.tsx
'use client';
import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { OrganizerProfile, SocialLinks } from '@/types/event';

interface OrganiserProfileSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
  existingProfile?: OrganizerProfile;
}

export default function OrganiserProfileSetup({ 
  isOpen, 
  onClose, 
  onSuccess, 
  user, 
  existingProfile 
}: OrganiserProfileSetupProps) {
  const [formData, setFormData] = useState({
    organizationName: existingProfile?.organization_name || '',
    bio: existingProfile?.bio || '',
    website: existingProfile?.social_links?.website || '',
    facebook: existingProfile?.social_links?.facebook || '',
    twitter: existingProfile?.social_links?.twitter || '',
    instagram: existingProfile?.social_links?.instagram || '',
  });

  const [files, setFiles] = useState({
    passportPhoto: null as File | null,
    idFrontPhoto: null as File | null,
    idBackPhoto: null as File | null,
    selfieWithId: null as File | null,
  });

  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passportRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: keyof typeof files) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, [fileType]: 'File size must be less than 5MB' }));
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, [fileType]: 'Please select a valid image file' }));
        return;
      }

      setFiles(prev => ({ ...prev, [fileType]: file }));
      setErrors(prev => ({ ...prev, [fileType]: '' }));
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('kyc_documents')
      .upload(filePath, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('kyc_documents')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.organizationName.trim()) {
      newErrors.organizationName = 'Organization name is required';
    }
    
    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!existingProfile) {
      if (!files.passportPhoto) newErrors.passportPhoto = 'Passport photo is required';
      if (!files.idFrontPhoto) newErrors.idFrontPhoto = 'ID front photo is required';
      if (!files.idBackPhoto) newErrors.idBackPhoto = 'ID back photo is required';
      if (!files.selfieWithId) newErrors.selfieWithId = 'Selfie with ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setUploading(true);
    
    try {
      let passportPhotoUrl = existingProfile?.passport_photo_url || '';
      let idFrontPhotoUrl = existingProfile?.id_front_photo_url || '';
      let idBackPhotoUrl = existingProfile?.id_back_photo_url || '';
      let selfieWithIdUrl = existingProfile?.selfie_with_id_url || '';

      // Upload new files if provided
      if (files.passportPhoto) {
        passportPhotoUrl = await uploadFile(files.passportPhoto, 'passport-photos');
      }
      if (files.idFrontPhoto) {
        idFrontPhotoUrl = await uploadFile(files.idFrontPhoto, 'id-photos');
      }
      if (files.idBackPhoto) {
        idBackPhotoUrl = await uploadFile(files.idBackPhoto, 'id-photos');
      }
      if (files.selfieWithId) {
        selfieWithIdUrl = await uploadFile(files.selfieWithId, 'selfie-photos');
      }

      const profileData = {
        user_id: user.id,
        organization_name: formData.organizationName,
        bio: formData.bio,
        social_links: {
          website: formData.website,
          facebook: formData.facebook,
          twitter: formData.twitter,
          instagram: formData.instagram,
        },
        passport_photo_url: passportPhotoUrl,
        id_front_photo_url: idFrontPhotoUrl,
        id_back_photo_url: idBackPhotoUrl,
        selfie_with_id_url: selfieWithIdUrl,
        kyc_status: 'approved', // Auto-approve for now
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('ORGANIZER_KYC')
          .update(profileData)
          .eq('user_id', user.id);
      } else {
        // Create new profile
        result = await supabase
          .from('ORGANIZER_KYC')
          .insert([{
            ...profileData,
            created_at: new Date().toISOString(),
          }]);
      }

      if (result.error) throw result.error;

      onSuccess();
    } catch (error) {
      console.error('Error saving organizer profile:', error);
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {existingProfile ? 'Update Organizer Profile' : 'Set Up Organizer Profile'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Organization Info</span>
            <span>Identity Verification</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Organization Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your organization name"
                />
                {errors.organizationName && (
                  <p className="mt-1 text-sm text-red-600">{errors.organizationName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio *
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about your organization and what kind of events you organize..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.bio.length}/50 characters minimum
                </p>
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Identity Verification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Identity Verification Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Please upload clear photos of your identification documents. All documents will be securely stored and used only for verification purposes.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Passport Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passport Photo {!existingProfile && '*'}
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {files.passportPhoto ? (
                        <div>
                          <p className="text-sm text-gray-600">✓ {files.passportPhoto.name}</p>
                          <button
                            type="button"
                            onClick={() => setFiles(prev => ({ ...prev, passportPhoto: null }))}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ) : existingProfile?.passport_photo_url ? (
                        <div>
                          <p className="text-sm text-green-600">✓ Current photo uploaded</p>
                          <button
                            type="button"
                            onClick={() => passportRef.current?.click()}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Replace
                          </button>
                        </div>
                      ) : (
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a file</span>
                          <input
                            ref={passportRef}
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'passportPhoto')}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                  {errors.passportPhoto && (
                    <p className="mt-1 text-sm text-red-600">{errors.passportPhoto}</p>
                  )}
                </div>

                {/* ID Front Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Front Photo {!existingProfile && '*'}
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {files.idFrontPhoto ? (
                        <div>
                          <p className="text-sm text-gray-600">✓ {files.idFrontPhoto.name}</p>
                          <button
                            type="button"
                            onClick={() => setFiles(prev => ({ ...prev, idFrontPhoto: null }))}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ) : existingProfile?.id_front_photo_url ? (
                        <div>
                          <p className="text-sm text-green-600">✓ Current photo uploaded</p>
                          <button
                            type="button"
                            onClick={() => idFrontRef.current?.click()}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Replace
                          </button>
                        </div>
                      ) : (
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a file</span>
                          <input
                            ref={idFrontRef}
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'idFrontPhoto')}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                  {errors.idFrontPhoto && (
                    <p className="mt-1 text-sm text-red-600">{errors.idFrontPhoto}</p>
                  )}
                </div>

                {/* ID Back Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Back Photo {!existingProfile && '*'}
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {files.idBackPhoto ? (
                        <div>
                          <p className="text-sm text-gray-600">✓ {files.idBackPhoto.name}</p>
                          <button
                            type="button"
                            onClick={() => setFiles(prev => ({ ...prev, idBackPhoto: null }))}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ) : existingProfile?.id_back_photo_url ? (
                        <div>
                          <p className="text-sm text-green-600">✓ Current photo uploaded</p>
                          <button
                            type="button"
                            onClick={() => idBackRef.current?.click()}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Replace
                          </button>
                        </div>
                      ) : (
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a file</span>
                          <input
                            ref={idBackRef}
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'idBackPhoto')}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                                              <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                  {errors.idBackPhoto && (
                    <p className="mt-1 text-sm text-red-600">{errors.idBackPhoto}</p>
                  )}
                </div>

                {/* Selfie with ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selfie with ID {!existingProfile && '*'}
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {files.selfieWithId ? (
                        <div>
                          <p className="text-sm text-gray-600">✓ {files.selfieWithId.name}</p>
                          <button
                            type="button"
                            onClick={() => setFiles(prev => ({ ...prev, selfieWithId: null }))}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ) : existingProfile?.selfie_with_id_url ? (
                        <div>
                          <p className="text-sm text-green-600">✓ Current photo uploaded</p>
                          <button
                            type="button"
                            onClick={() => selfieRef.current?.click()}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Replace
                          </button>
                        </div>
                      ) : (
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a file</span>
                          <input
                            ref={selfieRef}
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'selfieWithId')}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                  {errors.selfieWithId && (
                    <p className="mt-1 text-sm text-red-600">{errors.selfieWithId}</p>
                  )}
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading && (
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {uploading ? 'Submitting...' : existingProfile ? 'Update Profile' : 'Submit for Review'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}