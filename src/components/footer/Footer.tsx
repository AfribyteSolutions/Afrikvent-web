"use client";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Logo + About */}
          <div>
            <Link href="/" className="inline-block mb-3 sm:mb-4">
              <Image
                src="/logo.png"
                alt="Afrikvent Logo"
                width={120}
                height={38}
                className="h-8 sm:h-10 w-auto"
              />
            </Link>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-md mb-4">
              Discover, book, and stream African events worldwide. Your trusted platform for connecting with culture and community.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3 sm:space-x-4 mt-4 sm:mt-6">
              <Link 
                href="https://facebook.com" 
                target="_blank"
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 hover:bg-blue-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-200"
              >
                <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
              <Link 
                href="https://twitter.com" 
                target="_blank"
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 hover:bg-blue-400 hover:text-white rounded-full flex items-center justify-center transition-all duration-200"
              >
                <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
              <Link 
                href="https://instagram.com" 
                target="_blank"
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 hover:bg-pink-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-200"
              >
                <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
              <Link 
                href="https://youtube.com" 
                target="_blank"
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-200"
              >
                <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>

          {/* Links Section - Two columns on mobile, stays same on larger screens */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Platform Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Platform</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link href="/events" className="text-gray-600 hover:text-blue-500 text-xs sm:text-sm transition-colors">
                    Discover Events
                  </Link>
                </li>
                <li>
                  <Link href="/organiser" className="text-gray-600 hover:text-blue-500 text-xs sm:text-sm transition-colors">
                    My Events
                  </Link>
                </li>
                <li>
                  <Link href="/organiser" className="text-gray-600 hover:text-blue-500 text-xs sm:text-sm transition-colors">
                    Event Organizers
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-gray-600 hover:text-blue-500 text-xs sm:text-sm transition-colors">
                    Profile
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link href="/help" className="text-gray-600 hover:text-blue-500 text-xs sm:text-sm transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-600 hover:text-blue-500 text-xs sm:text-sm transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-600 hover:text-blue-500 text-xs sm:text-sm transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-600 hover:text-blue-500 text-xs sm:text-sm transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-gray-500 text-xs sm:text-sm text-center sm:text-left">
              © {new Date().getFullYear()} Afrikvent. All rights reserved.
            </p>
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-gray-700 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-700 transition-colors">
                Terms
              </Link>
              <Link href="/cookies" className="hover:text-gray-700 transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;