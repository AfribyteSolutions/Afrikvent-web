"use client"; // ✅ must be the first line

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ App Router uses next/navigation
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        console.error("Auth error:", error.message);
        router.push("/login");
        return;
      }

      if (data?.session) {
        router.push("/"); // redirect to home/dashboard
      }
    };

    handleAuth();
  }, [router]);

  return <p>Processing login...</p>;
}
