"use client";
import React, { useState, useEffect } from "react";
import PromotionalBanner from "./PromotionBanner";

interface PromotionalBannerData {
  id: string;
  imageUrl: string;
  altText: string;
  href: string;
  openInNewTab?: boolean;
  overlayText?: {
    title?: string;
    subtitle?: string;
    buttonText?: string;
  };
  height?: number;
  isActive: boolean;
  priority: number; // Higher priority shows first
  startDate?: string;
  endDate?: string;
  clickCount?: number;
  impressionCount?: number;
}

interface PromotionalBannerSectionProps {
  /** Maximum number of banners to display */
  maxBanners?: number;
  /** Section title (optional) */
  sectionTitle?: string;
  /** Custom section className */
  className?: string;
  /** API endpoint to fetch banners from */
  apiEndpoint?: string;
  /** Static banners data (alternative to API) */
  banners?: PromotionalBannerData[];
}

const PromotionBannerSection: React.FC<PromotionalBannerSectionProps> = ({
  maxBanners = 1,
  sectionTitle,
  className = "",
  apiEndpoint = "/api/promotional-banners",
  banners: staticBanners,
}) => {
  const [banners, setBanners] = useState<PromotionalBannerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch banners from API or use static data
  useEffect(() => {
    const fetchBanners = async () => {
      if (staticBanners) {
        setBanners(staticBanners);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(apiEndpoint);
        if (!response.ok) {
          throw new Error("Failed to fetch promotional banners");
        }
        const data: PromotionalBannerData[] = await response.json();
        setBanners(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load banners");
        console.error("Error fetching promotional banners:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [apiEndpoint, staticBanners]);

  // Filter and sort banners
  const activeBanners = banners
    .filter(banner => {
      // Check if banner is active
      if (!banner.isActive) return false;
      
      // Check date range if specified
      const now = new Date();
      if (banner.startDate && new Date(banner.startDate) > now) return false;
      if (banner.endDate && new Date(banner.endDate) < now) return false;
      
      return true;
    })
    .sort((a, b) => b.priority - a.priority) // Sort by priority (highest first)
    .slice(0, maxBanners); // Limit to maxBanners

  // Handle banner click tracking
  const handleBannerClick = async (bannerId: string) => {
    try {
      // Track click event
      await fetch("/api/promotional-banners/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bannerId,
          action: "click",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Error tracking banner click:", err);
    }
  };

  // Handle banner impression tracking
  useEffect(() => {
    const trackImpressions = async () => {
      if (activeBanners.length === 0) return;

      try {
        await fetch("/api/promotional-banners/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bannerIds: activeBanners.map(b => b.id),
            action: "impression",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error("Error tracking banner impressions:", err);
      }
    };

    trackImpressions();
  }, [activeBanners]);

  // Don't render section if no active banners
  if (loading || error || activeBanners.length === 0) {
    return null;
  }

  return (
    <section className={`py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {sectionTitle && (
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {sectionTitle}
            </h2>
          </div>
        )}
        
        <div className={`space-y-6 ${maxBanners > 1 ? 'md:space-y-0 md:grid md:grid-cols-2 md:gap-6' : ''}`}>
          {activeBanners.map((banner) => (
            <PromotionalBanner
              key={banner.id}
              imageUrl={banner.imageUrl}
              altText={banner.altText}
              href={banner.href}
              openInNewTab={banner.openInNewTab}
              overlayText={banner.overlayText}
              height={banner.height}
              onBannerClick={() => handleBannerClick(banner.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromotionBannerSection;