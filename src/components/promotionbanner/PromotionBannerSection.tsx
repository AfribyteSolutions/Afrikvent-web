"use client";
import React, { useEffect, useMemo, useState } from "react";
import PromotionalBanner from "./PromotionBanner";
import { mwakwaData } from "@/lib/mwakwaBackend";

type BannerRow = {
  id: string; title?: string; subtitle?: string; button_text?: string; image_url?: string;
  alt_text?: string; target_url?: string; open_in_new_tab?: boolean; is_active?: boolean;
  starts_at?: string; ends_at?: string; display_order?: number; click_count?: number; impression_count?: number;
};

export default function PromotionBannerSection({ maxBanners = 1, sectionTitle, className = "" }: { maxBanners?: number; sectionTitle?: string; className?: string }) {
  const [rows, setRows] = useState<BannerRow[]>([]);
  useEffect(() => {
    mwakwaData.promotionBanners.list("display_order", 50, 0).then(r => setRows(r as BannerRow[])).catch(() => setRows([]));
  }, []);

  const active = useMemo(() => {
    const now = Date.now();
    return rows.filter(b => b.is_active !== false && (!b.starts_at || new Date(b.starts_at).getTime() <= now) && (!b.ends_at || new Date(b.ends_at).getTime() >= now)).slice(0, maxBanners);
  }, [rows, maxBanners]);

  useEffect(() => {
    active.forEach(b => mwakwaData.promotionBanners.update(b.id, { impression_count: (b.impression_count || 0) + 1 }).catch(() => {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.map(b => b.id).join(",")]);

  if (!active.length) return null;
  return <section className={`py-8 ${className}`}><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {sectionTitle && <h2 className="text-center mb-6 text-2xl md:text-3xl font-bold">{sectionTitle}</h2>}
    <div className={`space-y-6 ${maxBanners > 1 ? "md:space-y-0 md:grid md:grid-cols-2 md:gap-6" : ""}`}>
      {active.map(b => <PromotionalBanner key={b.id} imageUrl={b.image_url || ""} altText={b.alt_text || b.title || "Mwakwa promotion"} href={b.target_url || "/events"} openInNewTab={b.open_in_new_tab} overlayText={{ title: b.title, subtitle: b.subtitle, buttonText: b.button_text }} onBannerClick={() => mwakwaData.promotionBanners.update(b.id, { click_count: (b.click_count || 0) + 1 }).catch(() => {})} />)}
    </div>
  </div></section>;
}
