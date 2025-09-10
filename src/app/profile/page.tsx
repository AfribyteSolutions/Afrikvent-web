"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import UpdateProfileModal from "@/components/auth/UpdateProfileModal";

// 💡 Define a type for your profile data
interface Profile {
  id: string;
  name: string;
  phone: string;
  avatar_url: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  // 💡 Use the new Profile type
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
      } else {
        setUser(user);

        // Fetch user profile from the profiles table
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, phone, avatar_url") // 💡 Explicitly select columns for better type safety
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      }
    };
    fetchUserAndProfile();
  }, [router, showUpdateModal]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-medium">Loading profile...</p>
      </div>
    );
  }
  
  const displayName = profile?.name || user.user_metadata?.name || user.email;
  const displayPhone = profile?.phone || user.user_metadata?.phone;

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg -mt-16 bg-gray-200 flex items-center justify-center">
              {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                <Image
                  src={profile?.avatar_url || user.user_metadata.avatar_url}
                  alt="Profile Picture"
                  width={96}
                  height={96}
                  className="object-cover"
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
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800">Account Details</h3>
              <p className="mt-2 text-sm text-gray-600">Email: {user.email}</p>
              <p className="mt-1 text-sm text-gray-600">Phone: {displayPhone || "Not provided"}</p>
              <p className="mt-1 text-sm text-gray-600">Last Signed In: {new Date(user.last_sign_in_at || "").toLocaleDateString()}</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpdateModal(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Update Profile
          </button>
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