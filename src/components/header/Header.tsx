"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import AuthModal from "@/components/auth/AuthModal";
import { useRouter } from "next/navigation";
import { ChevronDown, User as UserIcon, LogOut } from "lucide-react";

const Header = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

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
    setIsProfileDropdownOpen(false);
    router.push("/");
  };

  const handleAuthSuccess = () => {
    setShowSignIn(false);
    setShowSignUp(false);
    router.push("/profile");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
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
              <div className="relative">
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-200 text-sm focus:outline-none"
                >
                  <span className="w-7 h-7 rounded-full overflow-hidden">
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="Profile Picture"
                        width={28}
                        height={28}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </span>
                  <span>{user.user_metadata?.name || user.email}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link href="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Manage Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
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
                    <span className="flex items-center space-x-2 text-gray-600 font-semibold text-lg">
                      <span className="w-8 h-8 rounded-full overflow-hidden">
                        {user.user_metadata?.avatar_url ? (
                          <Image
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </span>
                      <span>{user.user_metadata?.name || user.email}</span>
                    </span>
                    <Link
                      href="/profile"
                      onClick={closeMobileMenu}
                      className="px-8 py-3 bg-blue-600 text-white rounded-full text-lg hover:bg-blue-700 w-full max-w-sm text-center"
                    >
                      Manage Profile
                    </Link>
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

      <AuthModal
        type="signin"
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={handleAuthSuccess}
      />

      <AuthModal
        type="signup"
        isOpen={showSignUp}
        onClose={() => setShowSignUp(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default Header;