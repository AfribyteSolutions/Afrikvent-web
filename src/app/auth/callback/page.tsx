"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ use this instead of next/router
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth error:", error.message);
        return;
      }

      if (data?.session) {
        // ✅ redirect after successful login
        router.push("/");
      } else {
        router.push("/login");
      }
    };

    handleAuth();
  }, [router]);

  return <p>Processing login...</p>;
}
