"use client"; // must be the very first line

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ App Router import
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error("Auth error:", error.message);
        router.push("/login");
        return;
      }

      if (data?.session) {
        router.push("/");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg font-medium">Processing login...</p>
    </div>
  );
}
