"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { mwakwaData } from "@/lib/mwakwaBackend";

type NavItem = { id?: string; label: string; url: string; location?: string };
type BrandConfig = { brand_name?: string; logo_url?: string; footer_description?: string; copyright_text?: string };

const Footer = () => {
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  const [links, setLinks] = useState<NavItem[]>([]);
  useEffect(() => {
    Promise.all([mwakwaData.brandSettings.filter({}, undefined, 1, 0), mwakwaData.navigationItems.filter({ is_enabled: true }, "sort_order", 100, 0)])
      .then(([brands, items]) => { setBrand(brands?.[0] || null); setLinks(items); }).catch(() => {});
  }, []);
  const platformLinks = links.filter((x) => x.location === "footer_platform");
  const supportLinks = links.filter((x) => x.location === "footer_support" || x.location === "footer_legal");
  return (
    <footer className="bg-white border-t border-gray-100 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Logo + About */}
          <div>
            <Link href="/" className="inline-block mb-3 sm:mb-4">
              <Image
                src={brand?.logo_url || "/logo.png"}
                alt={`${brand?.brand_name || "Mwakwa"} Logo`}
                width={120}
                height={38}
                className="h-8 sm:h-10 w-auto"
              />
            </Link>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-md mb-4">
              {brand?.footer_description || "Discover social events, connect around experiences, and get the access you need to show up."}
            </p>
          </div>

          {/* Links Section - Two columns on mobile, stays same on larger screens */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Platform Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Platform</h3>
              <ul className="space-y-2 sm:space-y-3">
                {(platformLinks.length ? platformLinks : [{label:"Discover Events",url:"/events"},{label:"My Events",url:"/organiser"}]).map((item: NavItem) => (
                  <li key={item.id || item.url}><Link href={item.url} className="text-gray-600 hover:text-blue-500 text-xs sm:text-sm transition-colors">{item.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
              <ul className="space-y-2 sm:space-y-3">
                {supportLinks.length ? supportLinks.map((item: NavItem) => (
                  <li key={item.id || item.url}><Link href={item.url} className="text-gray-600 hover:text-blue-500 text-xs sm:text-sm transition-colors">{item.label}</Link></li>
                )) : <li><span className="text-gray-500 text-xs sm:text-sm">Support and legal pages are managed in CMS.</span></li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-gray-500 text-xs sm:text-sm text-center sm:text-left">
              {brand?.copyright_text || `© ${new Date().getFullYear()} ${brand?.brand_name || "Mwakwa"}. All rights reserved.`}
            </p>
            <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-right">
              Legal pages will be published before public launch.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;