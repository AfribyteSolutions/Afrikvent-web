"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the hash parameters from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Check if there's an error in the URL
        const errorParam = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
        
        if (errorParam) {
          console.error("OAuth error:", errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setTimeout(() => {
            router.push("/");
          }, 2000);
          return;
        }

        // Check for access token (implicit flow) or code (PKCE flow)
        const accessToken = hashParams.get('access_token');
        const code = searchParams.get('code');

        if (!accessToken && !code) {
          // No auth data found, just redirect to home
          console.log("No auth data found in URL, redirecting to home");
          router.push("/");
          return;
        }

        // Let Supabase handle the session automatically
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError.message);
          setError(sessionError.message);
          setTimeout(() => {
            router.push("/");
          }, 2000);
          return;
        }

        if (data?.session) {
          // Check if user exists in users table
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", data.session.user.id)
            .single();

          // If user doesn't exist in users table, create them
          if (userError && userError.code === "PGRST116") {
            const { error: insertError } = await supabase.from("users").insert({
              user_id: data.session.user.id,
              name: data.session.user.user_metadata?.full_name || 
                    data.session.user.user_metadata?.name || 
                    data.session.user.email?.split("@")[0] || 
                    "User",
              email: data.session.user.email || "",
              phone: data.session.user.user_metadata?.phone || "",
              role: "attendee",
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            if (insertError) {
              console.error("Error creating user record:", insertError);
            }
          }

          // Successfully authenticated, redirect to home
          router.push("/");
        } else {
          // No session found after auth
          console.log("No session found, redirecting to home");
          router.push("/");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    };

    // Small delay to ensure URL params are available
    const timer = setTimeout(() => {
      handleAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-center text-gray-800 mb-2">
              Authentication Failed
            </p>
            <p className="text-sm text-center text-gray-600 mb-4">{error}</p>
            <p className="text-xs text-center text-gray-500">
              Redirecting to home...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-center text-gray-800 mb-2">
              Completing sign in...
            </p>
            <p className="text-sm text-center text-gray-600">
              You will be redirected to the home page shortly.
            </p>
          </>
        )}
      </div>
    </div>
  );
}