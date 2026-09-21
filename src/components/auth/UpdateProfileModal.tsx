"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User as UserIcon, Loader2, Phone } from "lucide-react";
import Image from "next/image";
import { mwakwaAuth, mwakwaFiles, type MwakwaUser } from "@/lib/mwakwaBackend";

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: MwakwaUser | null;
}

export default function UpdateProfileModal({ isOpen, onClose, user }: UpdateProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.display_name || user.full_name || "");
      setPhone(user.phone || "");
      setImageUrl(user.avatar_url || null);
    }
  }, [user, isOpen]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      await mwakwaAuth.updateMe({ display_name: name, phone, avatar_url: imageUrl });
      onClose();
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const result = await mwakwaFiles.uploadPublic(file);
      const newImageUrl = result.file_url;
      setImageUrl(newImageUrl);
      await mwakwaAuth.updateMe({ avatar_url: newImageUrl });
    } catch (err) {
      setError(`Image upload failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-bold text-white text-center">Update Profile</h2>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative w-24 h-24 rounded-full border-4 border-gray-200 overflow-hidden group">
                  {imageUrl ? <Image src={imageUrl} alt="Profile" width={96} height={96} className="object-cover w-full h-full" /> : <div className="w-full h-full bg-gray-400 flex items-center justify-center"><UserIcon className="w-12 h-12 text-white" /></div>}
                  <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer text-sm">Change</label>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={loading} />
                </div>
              </div>
              <div className="relative"><UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" /><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your Name" className="w-full pl-10 pr-4 py-3 border rounded-lg" /></div>
              <div className="relative"><Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full pl-10 pr-4 py-3 border rounded-lg" /></div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">{loading ? <span className="flex justify-center items-center"><Loader2 className="w-5 h-5 animate-spin mr-2" />Saving...</span> : "Save Changes"}</button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
