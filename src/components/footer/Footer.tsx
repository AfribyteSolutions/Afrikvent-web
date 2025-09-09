"use client";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 px-6 mt-16">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo + About */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo.png" // replace with Afrikvent logo
                alt="Afrikvent Logo"
                width={140}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed max-w-md">
              Discover, book, and stream African events worldwide. Your trusted platform for connecting with culture and community.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              <Link 
                href="https://facebook.com" 
                target="_blank"
                className="w-10 h-10 bg-gray-100 hover:bg-blue-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-200"
              >
                <Facebook className="w-4 h-4" />
              </Link>
              <Link 
                href="https://twitter.com" 
                target="_blank"
                className="w-10 h-10 bg-gray-100 hover:bg-blue-400 hover:text-white rounded-full flex items-center justify-center transition-all duration-200"
              >
                <Twitter className="w-4 h-4" />
              </Link>
              <Link 
                href="https://instagram.com" 
                target="_blank"
                className="w-10 h-10 bg-gray-100 hover:bg-pink-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-200"
              >
                <Instagram className="w-4 h-4" />
              </Link>
              <Link 
                href="https://youtube.com" 
                target="_blank"
                className="w-10 h-10 bg-gray-100 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-200"
              >
                <Youtube className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-600 hover:text-blue-500 text-sm transition-colors">
                  Discover Events
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-gray-600 hover:text-blue-500 text-sm transition-colors">
                  My Events
                </Link>
              </li>
              <li>
                <Link href="/organiser" className="text-gray-600 hover:text-blue-500 text-sm transition-colors">
                  Event Organizers
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-600 hover:text-blue-500 text-sm transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-blue-500 text-sm transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-blue-500 text-sm transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-blue-500 text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-blue-500 text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Afrikvent. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
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

