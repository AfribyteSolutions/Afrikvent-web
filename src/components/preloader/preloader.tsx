"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

const Preloader: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Animate progress over 3s
    const duration = 3000;
    const interval = 30;
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsDone(true), 500); // fade out
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-700 ${
        isDone ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div className="mb-12">
        <Image
          src="/images/logo.png"
          alt="Afrikvent Logo"
          width={120}
          height={120}
          className="object-contain"
          priority
        />
      </div>

      {/* Loading bar */}
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{
            width: `${progress}%`,
            transition: "width 0.3s linear",
          }}
        />
      </div>

      {/* Text */}
      <p className="mt-4 text-gray-600 text-sm font-medium">Loading...</p>
    </div>
  );
};

export default Preloader;
