"use client"; // must be the very first line

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ correct import for App Router
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
        router.push("/login"); // redirect to login if error
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
