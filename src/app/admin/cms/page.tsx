"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { mwakwaAuth, mwakwaData, MwakwaUser } from "@/lib/mwakwaBackend";

type Tab = "site" | "brand" | "business" | "navigation" | "policies" | "overrides";
type Row = Record<string, any>;

const policyGroups = [
  { key: "fee", title: "Fees", entity: mwakwaData.feePolicies },
  { key: "payout", title: "Payouts", entity: mwakwaData.payoutPolicies },
  { key: "refund", title: "Buyer refunds", entity: mwakwaData.refundPolicies },
  { key: "cancellation", title: "Cancelled & postponed events", entity: mwakwaData.cancellationPolicies },
] as const;

function Field({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: any) => void; type?: string }) {
  if (type === "boolean") return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />{label}</label>;
  return <label className="block text-sm"><span className="block mb-1 font-medium">{label}</span><input className="w-full rounded-lg border px-3 py-2" type={type} value={value ?? ""} onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)} /></label>;
}

export default function CmsPage() {
  const [user, setUser] = useState<MwakwaUser | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("site");
  const [brand, setBrand] = useState<Row | null>(null);
  const [business, setBusiness] = useState<Row | null>(null);
  const [sections, setSections] = useState<Row[]>([]);
  const [nav, setNav] = useState<Row[]>([]);
  const [policies, setPolicies] = useState<Record<string, Row[]>>({});
  const [overrides, setOverrides] = useState<Row[]>([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    const me = await mwakwaAuth.me(); setUser(me); setReady(true);
    if (me?.role !== "admin") return;
    const [brands, businesses, ss, ni, ov, ...ps] = await Promise.all([
      mwakwaData.brandSettings.list("-updated_date", 10, 0),
      mwakwaData.businessInfo.list("-updated_date", 10, 0),
      mwakwaData.siteSections.list("sort_order", 100, 0),
      mwakwaData.navigationItems.list("sort_order", 100, 0),
      mwakwaData.eventPolicyOverrides.list("-created_date", 100, 0),
      ...policyGroups.map(g => g.entity.list("-updated_date", 50, 0)),
    ]);
    setBrand((brands as Row[])[0] || null); setBusiness((businesses as Row[])[0] || null); setSections(ss as Row[]); setNav(ni as Row[]); setOverrides(ov as Row[]);
    setPolicies(Object.fromEntries(policyGroups.map((g, i) => [g.key, ps[i] as Row[]])));
  };
  useEffect(() => { load().catch(e => setMessage(e?.message || "Could not load CMS")); }, []);

  const save = async (entity: any, row: Row) => { const { id, created_date, updated_date, created_by_id, ...data } = row; await entity.update(id, data); setMessage("Saved"); };
  const patch = (rows: Row[], setRows: (v: Row[]) => void, id: string, key: string, value: any) => setRows(rows.map(r => r.id === id ? { ...r, [key]: value } : r));
  const activePolicies = useMemo(() => policyGroups.map(g => ({ ...g, rows: policies[g.key] || [] })), [policies]);

  if (!ready) return <main className="p-8">Loading CMS…</main>;
  if (user?.role !== "admin") return <main className="max-w-xl mx-auto p-8"><h1 className="text-2xl font-bold">Admin access required</h1><p className="mt-3">This area controls Mwakwa commercial policy and public-site configuration.</p><Link className="inline-block mt-5 underline" href="/">Return home</Link></main>;

  return <main className="min-h-screen bg-gray-50 text-gray-900">
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6"><div><h1 className="text-3xl font-bold">Mwakwa Control Center</h1><p className="text-gray-600">Website, branding and commercial policy.</p></div><Link href="/" className="rounded-lg border px-4 py-2 bg-white">View site</Link></div>
      {message && <div className="mb-4 rounded-lg bg-white border px-4 py-3">{message}</div>}
      <div className="flex gap-2 overflow-x-auto mb-6">{([['site','Site'],['brand','Brand'],['business','Business info'],['navigation','Navigation'],['policies','Commercial policies'],['overrides','Event approvals']] as [Tab,string][]).map(([k,l]) => <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-full px-4 py-2 ${tab===k?'cms-primary-bg text-white':'bg-white border'}`}>{l}</button>)}</div>

      {tab === "site" && <div className="space-y-4">{sections.map((r, i) => <section key={r.id} className="bg-white rounded-xl border p-4 grid md:grid-cols-2 gap-4"><div className="md:col-span-2 flex justify-between"><strong>{r.section_key}</strong><Field label="Enabled" type="boolean" value={r.is_enabled} onChange={v => patch(sections,setSections,r.id,'is_enabled',v)} /></div><Field label="Title" value={r.title} onChange={v=>patch(sections,setSections,r.id,'title',v)} /><Field label="Subtitle" value={r.subtitle} onChange={v=>patch(sections,setSections,r.id,'subtitle',v)} /><Field label="Button text" value={r.button_text} onChange={v=>patch(sections,setSections,r.id,'button_text',v)} /><Field label="Button URL" value={r.button_url} onChange={v=>patch(sections,setSections,r.id,'button_url',v)} /><Field label="Desktop media URL" value={r.media_url} onChange={v=>patch(sections,setSections,r.id,'media_url',v)} /><Field label="Mobile media URL" value={r.mobile_media_url} onChange={v=>patch(sections,setSections,r.id,'mobile_media_url',v)} /><button className="md:col-span-2 justify-self-start rounded-lg cms-primary-bg text-white px-4 py-2" onClick={()=>save(mwakwaData.siteSections, sections[i])}>Save section</button></section>)}</div>}

      {tab === "brand" && brand && <section className="bg-white rounded-xl border p-4 grid md:grid-cols-2 gap-4"><Field label="Brand name" value={brand.brand_name} onChange={v=>setBrand({...brand,brand_name:v})}/><Field label="Primary domain" value={brand.primary_domain} onChange={v=>setBrand({...brand,primary_domain:v})}/><Field label="Logo URL" value={brand.logo_url} onChange={v=>setBrand({...brand,logo_url:v})}/><Field label="Favicon URL" value={brand.favicon_url} onChange={v=>setBrand({...brand,favicon_url:v})}/><Field label="Primary color" value={brand.primary_color} onChange={v=>setBrand({...brand,primary_color:v})}/><Field label="Secondary color" value={brand.secondary_color} onChange={v=>setBrand({...brand,secondary_color:v})}/><Field label="Background color" value={brand.background_color} onChange={v=>setBrand({...brand,background_color:v})}/><Field label="Text color" value={brand.text_color} onChange={v=>setBrand({...brand,text_color:v})}/><Field label="Footer description" value={brand.footer_description} onChange={v=>setBrand({...brand,footer_description:v})}/><Field label="Copyright text" value={brand.copyright_text} onChange={v=>setBrand({...brand,copyright_text:v})}/><button className="md:col-span-2 justify-self-start rounded-lg cms-primary-bg text-white px-4 py-2" onClick={()=>save(mwakwaData.brandSettings,brand)}>Save branding</button></section>}

      {tab === "navigation" && <div className="space-y-3">{nav.map((r,i)=><section key={r.id} className="bg-white rounded-xl border p-4 grid md:grid-cols-4 gap-3"><Field label="Label" value={r.label} onChange={v=>patch(nav,setNav,r.id,'label',v)}/><Field label="URL" value={r.url} onChange={v=>patch(nav,setNav,r.id,'url',v)}/><Field label="Location" value={r.location} onChange={v=>patch(nav,setNav,r.id,'location',v)}/><div className="space-y-2"><Field label="Enabled" type="boolean" value={r.is_enabled} onChange={v=>patch(nav,setNav,r.id,'is_enabled',v)}/><Field label="Requires sign-in" type="boolean" value={r.requires_auth} onChange={v=>patch(nav,setNav,r.id,'requires_auth',v)}/></div><button className="rounded-lg cms-primary-bg text-white px-4 py-2 justify-self-start" onClick={()=>save(mwakwaData.navigationItems,nav[i])}>Save</button></section>)}</div>}

      {tab === "policies" && <div className="space-y-6">{activePolicies.map(group=><section key={group.key}><h2 className="text-xl font-bold mb-2">{group.title}</h2>{group.rows.length===0?<div className="bg-white border rounded-xl p-4 text-gray-600">No policy configured yet.</div>:group.rows.map((r,idx)=><div key={r.id} className="bg-white border rounded-xl p-4 mb-3 grid md:grid-cols-3 gap-3"><Field label="Name" value={r.name} onChange={v=>setPolicies({...policies,[group.key]:group.rows.map(x=>x.id===r.id?{...x,name:v}:x)})}/>{Object.entries(r).filter(([k,v])=>!['id','name','created_date','updated_date','created_by_id'].includes(k)&&['string','number','boolean'].includes(typeof v)).map(([k,v])=><Field key={k} label={k.replaceAll('_',' ')} type={typeof v==='boolean'?'boolean':typeof v==='number'?'number':'text'} value={v} onChange={nv=>setPolicies({...policies,[group.key]:group.rows.map(x=>x.id===r.id?{...x,[k]:nv}:x)})}/>)}<button className="md:col-span-3 justify-self-start rounded-lg cms-primary-bg text-white px-4 py-2" onClick={()=>save(group.entity,group.rows[idx])}>Save policy</button></div>)}</section>)}</div>}

      {tab === "overrides" && <div className="space-y-3"><p className="text-gray-600">Organizer event-specific commercial exceptions require platform review here before they can take effect.</p>{overrides.length===0?<div className="bg-white border rounded-xl p-4">No event policy requests.</div>:overrides.map((r,i)=><section key={r.id} className="bg-white border rounded-xl p-4"><div className="grid md:grid-cols-4 gap-3"><div><b>Event</b><div>{r.event_id}</div></div><div><b>Policy</b><div>{r.policy_type}</div></div><div><b>Status</b><div>{r.status}</div></div><div><b>Reason</b><div>{r.reason||'—'}</div></div></div><pre className="mt-3 bg-gray-50 p-3 rounded-lg overflow-auto text-xs">{JSON.stringify(r.requested_config||{},null,2)}</pre><div className="flex gap-2 mt-3"><button className="rounded-lg bg-green-700 text-white px-4 py-2" onClick={async()=>{const next={...r,status:'approved',reviewed_by:user.id,reviewed_at:new Date().toISOString()}; await save(mwakwaData.eventPolicyOverrides,next); setOverrides(overrides.map(x=>x.id===r.id?next:x));}}>Approve</button><button className="rounded-lg bg-red-700 text-white px-4 py-2" onClick={async()=>{const next={...r,status:'rejected',reviewed_by:user.id,reviewed_at:new Date().toISOString()}; await save(mwakwaData.eventPolicyOverrides,next); setOverrides(overrides.map(x=>x.id===r.id?next:x));}}>Reject</button></div></section>)}</div>}
    </div>
  </main>;
}
