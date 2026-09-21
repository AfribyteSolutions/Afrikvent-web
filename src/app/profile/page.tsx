"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import { mwakwaAuth, type MwakwaUser } from "@/lib/mwakwaBackend";
import UpdateProfileModal from "@/components/auth/UpdateProfileModal";

export default function ProfilePage() {
  const [user, setUser] = useState<MwakwaUser | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const currentUser = await mwakwaAuth.me();
        if (!currentUser) {
          router.push("/");
          return;
        }
        setUser(currentUser);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router, showUpdateModal]);

  if (loading) return <div className="flex items-center justify-center h-screen"><p>Loading profile...</p></div>;
  if (error) return <div className="flex items-center justify-center h-screen"><p>{error}</p></div>;
  if (!user) return <div className="flex items-center justify-center h-screen"><p>Redirecting...</p></div>;

  const displayName = user.display_name || user.full_name || user.email?.split("@")[0] || "User";
  const displayPhone = user.phone || "Not provided";
  const displayAvatar = user.avatar_url;
  const displayRole = user.account_type || user.role || "attendee";

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg -mt-16 bg-gray-200 flex items-center justify-center">
              {displayAvatar ? <Image src={displayAvatar} alt="Profile Picture" width={96} height={96} className="object-cover w-full h-full" /> : <UserIcon className="w-12 h-12 text-gray-500" />}
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{displayName}</h2>
            <p className="mt-2 text-sm text-gray-600">Welcome to your profile!</p>
            <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-blue-100 text-blue-800">{displayRole}</span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Account Details</h3>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Email:</span><span className="text-sm font-medium">{user.email}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Phone:</span><span className="text-sm font-medium">{displayPhone}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Account:</span><span className="text-sm font-medium capitalize">{displayRole}</span></div>
          </div>

          <div className="space-y-3">
            <button onClick={() => setShowUpdateModal(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Update Profile</button>
            <button onClick={() => mwakwaAuth.logout("/")} className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300">Sign Out</button>
          </div>
        </div>
      </div>
      <UpdateProfileModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} user={user} />
    </>
  );
}
