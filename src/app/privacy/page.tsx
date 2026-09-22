"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { mwakwaData } from "@/lib/mwakwaBackend";

type Business = { legal_name?: string; address_line1?: string; address_line2?: string; city?: string; region?: string; postal_code?: string; country?: string; support_email?: string; email?: string; phone?: string; registration_number?: string; };
type Page = { title?: string; body?: string };

function renderBody(body = "") {
  return body.split("\n").map((line, i) => {
    if (line.startsWith("# ")) return <h1 key={i} className="text-3xl md:text-4xl font-bold mt-2 mb-6">{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-semibold mt-8 mb-3">{line.slice(3)}</h2>;
    if (!line.trim()) return <div key={i} className="h-2" />;
    return <p key={i} className="text-gray-700 leading-7 mb-3">{line}</p>;
  });
}

export default function PrivacyPage() {
  const [page, setPage] = useState<Page | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  useEffect(() => {
    Promise.all([
      mwakwaData.contentPages.filter({ slug: "privacy", is_published: true }, undefined, 1, 0),
      mwakwaData.businessInfo.filter({ is_active: true }, undefined, 1, 0),
    ]).then(([pages, businesses]) => { setPage((pages?.[0] || null) as Page | null); setBusiness((businesses?.[0] || null) as Business | null); });
  }, []);
  const address = useMemo(() => business ? [business.address_line1, business.address_line2, business.city, business.region, business.postal_code, business.country].filter(Boolean).join(", ") : "", [business]);
  return <><Header/><main className="min-h-screen bg-gray-50"><article className="max-w-3xl mx-auto px-4 py-12 md:py-16 bg-white md:my-10 md:rounded-2xl md:shadow-sm md:px-10">
    {page ? renderBody(page.body || "") : <h1 className="text-3xl font-bold">Privacy Policy</h1>}
    <section className="mt-10 border-t pt-6"><h2 className="text-xl font-semibold mb-3">Operator details</h2>{business ? <div className="text-gray-700 space-y-1"><p>{business.legal_name}</p>{address && <p>{address}</p>}{(business.privacy_email || business.email) && <p>Privacy: {business.privacy_email || business.email}</p>}{business.phone && <p>Phone: {business.phone}</p>}{business.website && <p>Website: {business.website}</p>}{business.registration_number && <p>Registration: {business.registration_number}</p>}</div> : <p className="text-gray-500">Business contact details are being updated.</p>}</section>
  </article></main><Footer/></>;
}
