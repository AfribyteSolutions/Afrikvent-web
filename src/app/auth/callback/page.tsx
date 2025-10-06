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
        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          console.error("Auth error:", error.message);
          setError(error.message);
          // Wait a bit so user can see the error, then redirect to login
          setTimeout(() => {
            router.push("/login");
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
            // User not found, create new user record
            const { error: insertError } = await supabase.from("users").insert({
              user_id: data.session.user.id,
              name: data.session.user.user_metadata?.name || data.session.user.email?.split("@")[0] || "User",
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

          // Redirect to home page
          router.push("/");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    };

    handleAuth();
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
              Redirecting to login...
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
              Processing login...
            </p>
            <p className="text-sm text-center text-gray-600">
              Please wait while we complete your authentication.
            </p>
          </>
        )}
      </div>
    </div>
  );
}