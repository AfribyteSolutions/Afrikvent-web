"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import UpdateProfileModal from "@/components/auth/UpdateProfileModal";
import { Database } from "@/types/database.types";

// Use the database type for USERS table
type UserProfile = Database["public"]["Tables"]["USERS"]["Row"];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error fetching user:", userError);
          router.push("/");
          return;
        }

        if (!user) {
          router.push("/");
          return;
        }

        setUser(user);

        // Fetch user profile from the USERS table using user_id
        const { data: profileData, error: profileError } = await supabase
          .from("USERS")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          // If user doesn't exist in USERS table, create a new record
          if (profileError.code === 'PGRST116') { // No rows returned
            console.log("User not found in USERS table, creating new record...");
            
            const newUserData = {
              user_id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.user_metadata?.full_name || null,
              phone: user.user_metadata?.phone || null,
              image_url: user.user_metadata?.avatar_url || null,
              role: 'user', // Default role
              is_active: true,
              last_login_at: new Date().toISOString(),
            };

            const { data: newProfile, error: insertError } = await supabase
              .from("USERS")
              .insert([newUserData])
              .select()
              .single();

            if (insertError) {
              console.error("Error creating user profile:", insertError);
              setError("Failed to create user profile");
            } else {
              setProfile(newProfile);
            }
          } else {
            console.error("Error fetching profile:", profileError);
            setError("Failed to load profile");
          }
        } else {
          setProfile(profileData);
          
          // Update last login time
          await supabase
            .from("USERS")
            .update({ last_login_at: new Date().toISOString() })
            .eq("user_id", user.id);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, [router, showUpdateModal]);


  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-medium">Redirecting...</p>
      </div>
    );
  }

  // Get display values with fallbacks
  const displayName = profile?.name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const displayPhone = profile?.phone || user.user_metadata?.phone || 'Not provided';
  const displayAvatar = profile?.image_url || user.user_metadata?.avatar_url;
  const displayRole = profile?.role || 'user';
  const lastLoginAt = profile?.last_login_at || user.last_sign_in_at;

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg -mt-16 bg-gray-200 flex items-center justify-center">
              {displayAvatar ? (
                <Image
                  src={displayAvatar}
                  alt="Profile Picture"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-gray-500" />
              )}
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {displayName}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Welcome to your profile!
            </p>
            {profile?.role && (
              <span className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                profile.role === 'organizer' 
                  ? 'bg-purple-100 text-purple-800'
                  : profile.role === 'admin'
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {displayRole}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Account Details</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">{user.email}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="text-sm font-medium text-gray-900">{displayPhone}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Role:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{displayRole}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium ${
                    profile?.is_active ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {profile?.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Login:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {lastLoginAt ? new Date(lastLoginAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Member Since:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional profile stats if user is organizer */}
            {profile?.role === 'organizer' && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Organizer Profile</h3>
                <p className="text-sm text-purple-600">
                  You have organizer privileges to create and manage events.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowUpdateModal(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Update Profile
            </button>
            
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/");
              }}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <UpdateProfileModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        user={user}
      />
    </>
  );
}