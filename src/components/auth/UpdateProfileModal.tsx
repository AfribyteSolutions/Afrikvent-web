"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { X, User as UserIcon, Loader2, Phone } from "lucide-react";
import Image from "next/image";
import { Database } from "@/types/database.types";

// Use the database type for USERS table
type UserProfile = Database["public"]["Tables"]["USERS"]["Row"];

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const UpdateProfileModal: React.FC<UpdateProfileModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      // Set initial form values from USERS table
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from("USERS")
            .select("name, phone, image_url")
            .eq("user_id", user.id)
            .single();

          if (error) {
            // If user doesn't exist in USERS table, use auth metadata
            console.log("Profile not found, using auth metadata");
            setName(user.user_metadata?.name || user.user_metadata?.full_name || "");
            setPhone(user.user_metadata?.phone || "");
            setImageUrl(user.user_metadata?.avatar_url || null);
          } else {
            // Use data from USERS table
            setName(data.name || "");
            setPhone(data.phone || "");
            setImageUrl(data.image_url || null);
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
          setError("Failed to load profile data.");
        }
      };
      
      fetchProfile();
    }
  }, [user, isOpen]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!user) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    try {
      // Check if user exists in USERS table
      const { data: existingUser, error: fetchError } = await supabase
        .from("USERS")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(fetchError.message);
      }

      if (existingUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from("USERS")
          .update({ 
            name, 
            phone,
            image_url: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        // Create new user record
        const { error: insertError } = await supabase
          .from("USERS")
          .insert([{
            user_id: user.id,
            email: user.email,
            name,
            phone,
            image_url: imageUrl,
            role: 'user',
            is_active: true,
            last_login_at: new Date().toISOString()
          }]);

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      // Success - close modal and trigger refresh
      onClose();
      
      // Trigger a page refresh or parent component update
      window.location.reload();

    } catch (err) {
      console.error("Profile update error:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    setLoading(true);
    setError("");

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `profile-${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    try {
      // Upload image to Supabase storage - using user-profiles bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-profiles")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("user-profiles")
        .getPublicUrl(filePath);

      const newImageUrl = publicUrlData.publicUrl;

      // Update local state
      setImageUrl(newImageUrl);

      // Update database immediately
      if (user) {
        const { error: profileUpdateError } = await supabase
          .from("USERS")
          .update({ 
            image_url: newImageUrl,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id);

        if (profileUpdateError) {
          console.warn("Failed to update profile image in database:", profileUpdateError);
          // Don't throw error here as the image upload was successful
        }
      }
      
    } catch (err) {
      console.error("Image upload error:", err);
      setError(`Image upload failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  Update Profile
                </h2>
                <p className="text-blue-100 mt-2 text-sm">
                  Update your personal details and profile picture.
                </p>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative w-24 h-24 rounded-full border-4 border-gray-200 overflow-hidden group">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt="Profile Picture"
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-sm font-medium text-center">
                      Change<br />Image
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Click on the image to change your profile picture
                  </p>
                </div>

                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                  />
                  <p className="text-xs text-red-500 mt-1 pl-10">
                    * This is the name that will appear on your tickets.
                  </p>
                </div>
                
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Phone Number (e.g., +233 20 123 4567)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1 pl-10">
                    Include country code for better communication
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Profile"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateProfileModal;