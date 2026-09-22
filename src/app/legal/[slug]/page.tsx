"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { mwakwaData } from "@/lib/mwakwaBackend";

type Row = Record<string, unknown>;
function renderBody(body = "") { return body.split("\n").map((line,i)=> line.startsWith("# ") ? <h1 key={i} className="text-3xl md:text-4xl font-bold mt-2 mb-6">{line.slice(2)}</h1> : line.startsWith("## ") ? <h2 key={i} className="text-xl font-semibold mt-8 mb-3">{line.slice(3)}</h2> : !line.trim() ? <div key={i} className="h-2"/> : <p key={i} className="text-gray-700 leading-7 mb-3">{line}</p>); }
export default function LegalPage(){
 const params=useParams(); const slug=String(params?.slug||""); const [page,setPage]=useState<Row|null>(null); const [business,setBusiness]=useState<Row|null>(null); const [loaded,setLoaded]=useState(false);
 useEffect(()=>{ if(!slug)return; Promise.all([mwakwaData.contentPages.filter({slug,is_published:true},undefined,1,0),mwakwaData.businessInfo.filter({is_active:true},undefined,1,0)]).then(([p,b])=>{setPage(p?.[0]||null);setBusiness(b?.[0]||null)}).finally(()=>setLoaded(true));},[slug]);
 const address=useMemo(()=>business?[business.address_line1,business.address_line2,business.city,business.region,business.postal_code,business.country].filter(Boolean).join(", "):"",[business]);
 return <><Header/><main className="min-h-screen bg-gray-50 py-8 md:py-12"><article className="max-w-3xl mx-auto bg-white px-5 py-8 md:px-10 md:py-10 md:rounded-2xl md:shadow-sm">{!loaded?<p>Loading…</p>:page?renderBody(page.body||""):<><h1 className="text-3xl font-bold">Page not found</h1><p className="mt-3 text-gray-600">This legal page is not currently published.</p></>} {page&&<section className="mt-10 border-t pt-6"><h2 className="text-xl font-semibold mb-3">Mwakwa operator</h2>{business?<div className="text-gray-700 space-y-1"><p>{business.legal_name}</p>{address&&<p>{address}</p>}{(business.support_email||business.email)&&<p>Contact: {business.support_email||business.email}</p>}{business.phone&&<p>Phone: {business.phone}</p>}{business.registration_number&&<p>Registration: {business.registration_number}</p>}</div>:<p className="text-gray-500">Operator details are being updated.</p>}</section>}</article></main><Footer/></>;
}
