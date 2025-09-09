"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import AuthModal from "@/components/auth/AuthModal";

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  // 🔹 Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // 🔹 Listen for login/logout changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <>
      <header className="w-full bg-white shadow-md px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between relative">
          {/* Left Nav (desktop) */}
          <nav className="hidden md:flex items-center space-x-6 text-black">
            <Link href="/" className="hover:text-[#0052cc]">
              Home
            </Link>
            <Link href="/events" className="hover:text-[#0052cc]">
              Events
            </Link>
            <Link href="/organiser" className="hover:text-[#0052cc]">
              Organiser Space
            </Link>
          </nav>

          {/* Logo Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="Afrikvent Logo"
                width={110}
                height={35}
                className="mx-auto"
              />
            </Link>
          </div>

          {/* Right Nav */}
          <nav className="hidden md:flex items-center space-x-4 text-black">
            {user ? (
              <div className="relative group">
                <button className="px-3 py-1.5 rounded-full bg-gray-200 text-sm">
                  {user.email}
                </button>
                <div className="absolute hidden group-hover:block right-0 mt-2 w-40 bg-white shadow-lg rounded">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowSignUp(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setShowSignIn(true)}
                  className="px-3 py-1.5 text-blue-600 rounded-full border border-blue-600 text-sm hover:bg-blue-50"
                >
                  Sign In
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* 🔹 Sign In Modal */}
      <AuthModal
        type="signin"
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={(email) => console.log("Signed in:", email)}
      />

      {/* 🔹 Sign Up Modal */}
      <AuthModal
        type="signup"
        isOpen={showSignUp}
        onClose={() => setShowSignUp(false)}
        onSuccess={(email) => console.log("Signed up:", email)}
      />
    </>
  );
};

export default Header;
