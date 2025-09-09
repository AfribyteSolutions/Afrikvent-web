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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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

          {/* Right Nav (desktop) */}
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-700 hover:text-[#0052cc] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {/* Modern Two-Line Hamburger Icon */}
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span
                  className={`bg-current h-0.5 w-5 rounded-sm transform transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'
                  }`}
                />
                <span
                  className={`bg-current h-0.5 w-5 rounded-sm transform transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu - Full Screen */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-white z-40 transform transition-all duration-300 ease-in-out">
            <div className="h-full flex flex-col">
              {/* Logo at Top */}
              <div className="pt-8 pb-12 border-b border-gray-200">
                <div className="flex justify-center">
                  <Image
                    src="/images/logo.png"
                    alt="Afrikvent Logo"
                    width={130}
                    height={42}
                  />
                </div>
              </div>

              {/* Navigation Links - Middle */}
              <div className="flex-1 flex flex-col justify-center px-4">
                <div className="flex flex-col items-center space-y-8">
                  <Link
                    href="/"
                    onClick={closeMobileMenu}
                    className="text-gray-700 hover:text-[#0052cc] font-medium text-2xl py-3"
                  >
                    Home
                  </Link>
                  <Link
                    href="/events"
                    onClick={closeMobileMenu}
                    className="text-gray-700 hover:text-[#0052cc] font-medium text-2xl py-3"
                  >
                    Events
                  </Link>
                  <Link
                    href="/organiser"
                    onClick={closeMobileMenu}
                    className="text-gray-700 hover:text-[#0052cc] font-medium text-2xl py-3"
                  >
                    Organiser Space
                  </Link>
                </div>
              </div>

              {/* Auth Section - Bottom */}
              <div className="pb-8 px-4">
                {user ? (
                  <div className="flex flex-col items-center space-y-4">
                    <span className="text-sm text-gray-600">{user.email}</span>
                    <button
                      onClick={handleSignOut}
                      className="px-8 py-3 text-red-600 rounded-full border border-red-600 text-lg hover:bg-red-50 w-full max-w-sm"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <button
                      onClick={() => {
                        setShowSignUp(true);
                        closeMobileMenu();
                      }}
                      className="px-8 py-3 bg-blue-600 text-white rounded-full text-lg hover:bg-blue-700 w-full max-w-sm"
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={() => {
                        setShowSignIn(true);
                        closeMobileMenu();
                      }}
                      className="px-8 py-3 text-blue-600 rounded-full border border-blue-600 text-lg hover:bg-blue-50 w-full max-w-sm"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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