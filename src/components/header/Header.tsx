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
  const [menuOpen, setMenuOpen] = useState(false);

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
      <header className="w-full bg-white shadow-md px-4 py-2 md:px-6 md:py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between relative">
          {/* Left Nav (desktop) */}
          <nav className="hidden md:flex items-center space-x-6 text-black">
            <Link href="/" className="hover:text-[#0052cc]">Home</Link>
            <Link href="/events" className="hover:text-[#0052cc]">Events</Link>
            <Link href="/organiser" className="hover:text-[#0052cc]">Organiser Space</Link>
          </nav>

          {/* Logo Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="Afrikvent Logo"
                width={100}
                height={30}
                className="mx-auto"
              />
            </Link>
          </div>

          {/* Right Nav Desktop */}
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

          {/* 🔹 Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col justify-between w-6 h-4 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span
              className={`block h-0.5 bg-black transition-all duration-300 ${
                menuOpen ? "rotate-45 translate-y-1.5" : ""
              }`}
            />
            <span
              className={`block h-0.5 bg-black transition-all duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-1.5" : ""
              }`}
            />
          </button>
        </div>

        {/* 🔹 Mobile Menu */}
        <div
          className={`md:hidden fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6 space-y-4">
            <Link href="/" onClick={() => setMenuOpen(false)} className="block hover:text-[#0052cc]">Home</Link>
            <Link href="/events" onClick={() => setMenuOpen(false)} className="block hover:text-[#0052cc]">Events</Link>
            <Link href="/organiser" onClick={() => setMenuOpen(false)} className="block hover:text-[#0052cc]">Organiser Space</Link>

            <div className="border-t pt-4">
              {user ? (
                <>
                  <p className="mb-2 text-sm">{user.email}</p>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowSignUp(true);
                      setMenuOpen(false);
                    }}
                    className="w-full mb-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => {
                      setShowSignIn(true);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
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
