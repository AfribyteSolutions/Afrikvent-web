"use client";
import React from "react";
import Image from "next/image";

interface PromotionalBannerProps {
  /** Banner image URL */
  imageUrl: string;
  /** Alt text for the banner image */
  altText: string;
  /** Click destination URL */
  href: string;
  /** Whether to open link in new tab (default: true) */
  openInNewTab?: boolean;
  /** Optional overlay text for the banner */
  overlayText?: {
    title?: string;
    subtitle?: string;
    buttonText?: string;
  };
  /** Banner height in pixels (default: 200) */
  height?: number;
  /** Whether banner is currently active/visible (default: true) */
  isActive?: boolean;
  /** Optional click tracking function */
  onBannerClick?: () => void;
  /** Custom CSS classes */
  className?: string;
}

const PromotionBanner: React.FC<PromotionalBannerProps> = ({
  imageUrl,
  altText,
  href,
  openInNewTab = true,
  overlayText,
  height = 200,
  isActive = true,
  onBannerClick,
  className = "",
}) => {
  // Don't render if banner is not active
  if (!isActive) return null;

  const handleClick = () => {
    // Track the click for analytics
    if (onBannerClick) {
      onBannerClick();
    }
    
    // Optional: Add analytics tracking here
    // analytics.track('promotional_banner_clicked', { href, altText });
  };

  const bannerContent = (
    <div 
      className={`relative w-full overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${className}`}
      style={{ height: `${height}px` }}
      onClick={handleClick}
    >
      {/* Banner Image */}
      <Image
        src={imageUrl}
        alt={altText}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
        priority={false}
      />
      
      {/* Optional Overlay Content */}
      {overlayText && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            {overlayText.title && (
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                {overlayText.title}
              </h3>
            )}
            {overlayText.subtitle && (
              <p className="text-lg md:text-xl mb-4 opacity-90">
                {overlayText.subtitle}
              </p>
            )}
            {overlayText.buttonText && (
              <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {overlayText.buttonText}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* "Ad" label for transparency */}
      <div className="absolute top-2 right-2 bg-gray-900/70 text-white text-xs px-2 py-1 rounded">
        Ad
      </div>
    </div>
  );

  // Wrap in link
  if (href) {
    return (
      <a
        href={href}
        target={openInNewTab ? "_blank" : "_self"}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className="block"
      >
        {bannerContent}
      </a>
    );
  }

  return bannerContent;
};

export default PromotionBanner;