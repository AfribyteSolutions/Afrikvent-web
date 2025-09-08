"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "My Events", href: "/events" },
    { label: "Organiser Space", href: "/organiser" },
    { label: "Profile", href: "/profile" },
  ];

  return (
    <header className="w-full bg-white shadow-md px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-center relative">
        {/* Left Nav (desktop) */}
        <nav className="hidden md:flex items-center space-x-6 text-black absolute left-1/4 transform -translate-x-1/2">
          <Link href="/" className="hover:text-[#0052cc]">
            Home
          </Link>
          <Link href="/events" className="hover:text-[#0052cc]">
            My Events
          </Link>
        </nav>

        {/* Logo Center */}
        <div className="flex-shrink-0">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Afrikvent Logo"
              width={120}
              height={40}
              className="mx-auto"
            />
          </Link>
        </div>

        {/* Right Nav (desktop) */}
        <nav className="hidden md:flex items-center space-x-6 text-black absolute right-1/4 transform translate-x-1/2">
          <Link href="/organiser" className="hover:text-[#0052cc]">
            Organiser Space
          </Link>
          <Link href="/profile" className="hover:text-[#0052cc]">
            Profile
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden absolute right-4 flex flex-col justify-center items-center space-y-1 w-8 h-8"
        >
          <motion.span
            animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            className="w-6 h-0.5 bg-black rounded"
          />
          <motion.span
            animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            className="w-6 h-0.5 bg-black rounded"
          />
        </button>
      </div>

      {/* Mobile Menu (animated) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 w-full h-full bg-white shadow-lg p-6 flex flex-col items-center justify-center space-y-6 text-lg font-medium md:hidden"
          >
            {/* Close button inside menu */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 flex flex-col justify-center items-center space-y-1 w-8 h-8"
            >
              <motion.span
                animate={{ rotate: 45, y: 6 }}
                className="w-6 h-0.5 bg-black rounded"
              />
              <motion.span
                animate={{ rotate: -45, y: -6 }}
                className="w-6 h-0.5 bg-black rounded"
              />
            </button>

            {/* Logo on top */}
            <div className="mb-6">
              <Image
                src="/images/logo.png"
                alt="Afrikvent Logo"
                width={130}
                height={50}
              />
            </div>

            {/* Menu List */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="hover:text-[#0052cc]"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
