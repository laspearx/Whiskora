"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "@/i18n/context";
import { speciesName } from "@/lib/species";

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827',
  inkSoft: '#4B5563',
  muted: '#9CA3AF',
  pink: '#E84677',
  sky: '#0EA5E9',      // ฟ้าคลินิก/โรงพยาบาล (Professional Trust)
  skySoft: '#F0F9FF',
  line: '#E5E7EB',
  paper: '#FFFFFF',
};

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Stethoscope: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>,
  MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  ImagePlaceholder: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
};

// service categories are stored in Thai (services.category): the API value and the badge lookup use it as is; only
// the label is translated (serviceHub.category.*). Unknown stored values are shown as stored.
const ALL = "all";
const CATEGORIES: { value: string; key: string }[] = [
  { value: "อาบน้ำ-ตัดขน", key: "grooming" },
  { value: "คลินิก/โรงพยาบาล", key: "clinic" },
  { value: "โรงแรมสัตว์เลี้ยง", key: "hotel" },
  { value: "ฝึกสอนสัตว์", key: "training" },
  { value: "บริการอื่นๆ", key: "other" },
];
const SPECIES = ["cat", "dog", "rabbit", "hamster", "bird", "squirrel", "hedgehog", "fish"];

export default function ServiceHubPage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [activePetType, setActivePetType] = useState(ALL);
  const [loadError, setLoadError] = useState(false);
  const t = useTranslations("serviceHub");
  const tc = useTranslations("common");
  const locale = useLocale();
  const categoryLabel = (value: string) => {
    const c = CATEGORIES.find((x) => x.value === value);
    return c ? t(`category.${c.key}`) : value;
  };

  const categories = [{ value: ALL, label: tc("all") }, ...CATEGORIES.map((c) => ({ value: c.value, label: t(`category.${c.key}`) }))];
  const petTypes = [
    { value: ALL, label: tc("all") },
    ...SPECIES.map((id) => ({ value: id, label: speciesName(id, locale) })),
    { value: "other", label: tc("otherPets") },
  ];

  useEffect(() => {
    fetchServices();
  }, [activeCategory, activePetType]);

  const fetchServices = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      let query = supabase.from("services").select("*").eq("is_published", true).order("created_at", { ascending: false });

      if (activeCategory !== ALL) {
        query = query.eq("category", activeCategory);
      }
      if (activePetType !== ALL) {
        query = query.contains("pet_types", [activePetType]);
      }

      const { data, error } = await query;
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error:", error);
      setLoadError(true);   // a failed load is an error, not "no services"
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.service_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .premium-card {
          background: #ffffff;
          border: 1px solid ${F.line};
          border-radius: 1.25rem;
          transition: all 0.25s ease;
        }
        .premium-card:hover {
          border-color: #D1D5DB;
          box-shadow: 0 12px 30px rgba(0,0,0,0.05);
          transform: translateY(-2px);
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-24 animate-in fade-in duration-500" style={{ fontFamily: 'var(--font-ui)', color: F.ink }}>
        
        {/* 🏥 Header & Search */}
        <div className="mb-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t("title")}</h1>
              <p className="text-sm font-medium" style={{ color: F.inkSoft }}>{t("subtitle")}</p>
            </div>
            
            {/* Sleek Search Bar */}
            <div className="relative w-full md:max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Icon.Search /></span>
              <input 
                type="search" 
                aria-label={t("searchLabel")}
                placeholder={`${t("searchLabel")}…`}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-sky-400 focus:ring-4 focus:ring-sky-50 font-medium text-sm transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 🏷️ Minimal Category Tabs */}
          <div className="flex gap-6 border-b border-gray-100 overflow-x-auto no-scrollbar pb-px" role="group" aria-label={t("categoryLabel")}>
            {categories.map((cat) => (
              <button
                key={cat.value}
                aria-pressed={activeCategory === cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`pb-4 text-sm font-semibold transition-all shrink-0 relative whitespace-nowrap ${
                  activeCategory === cat.value ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {cat.label}
                {activeCategory === cat.value && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 rounded-t-full" style={{ background: F.sky }}></div>
                )}
              </button>
            ))}
          </div>

          {/* 🐶 Premium Pet Type Pills */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar" role="group" aria-label={t("speciesLabel")}>
            {petTypes.map((type) => {
              const isActive = activePetType === type.value;
              return (
                <button
                  key={type.value}
                  aria-pressed={isActive}
                  onClick={() => setActivePetType(type.value)}
                  className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all shrink-0 border ${
                    isActive
                    ? "bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-200" 
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 🏥 Service Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
            <span className="sr-only">{tc("loading")}</span>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-gray-50 animate-pulse rounded-2xl border border-gray-100" aria-hidden="true"></div>
            ))}
          </div>
        ) : loadError ? (
          <div role="alert" data-testid="service-hub-error" className="py-20 px-6 text-center bg-red-50 rounded-3xl border border-red-100">
            <p className="font-semibold text-red-900">{tc("loadErrorTitle")}</p>
            <p className="text-sm text-red-800 mt-1">{tc("loadErrorText")}</p>
            <button type="button" onClick={fetchServices} className="mt-5 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold">{tc("retry")}</button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-20 px-6 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <div className="text-gray-300 mb-3 flex justify-center"><Icon.Search /></div>
            {services.length === 0 && activeCategory === ALL && activePetType === ALL ? (
              <>
                {/* ยังไม่มีบริการเปิดในระบบเลย — ไม่ให้ผู้ใช้เข้าใจว่าแค่ค้นผิดคำ */}
                <p className="text-gray-600 font-semibold">{t("noServicesTitle")}</p>
                <p className="text-sm text-gray-500 mt-1">{t("noServicesText")}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href="/partner/register-service" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#E84677' }}>{t("registerService")}</Link>
                  <Link href="/farm-hub" className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-600">{tc("browseFarms")}</Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 font-semibold">{t("noMatchTitle")}</p>
                <p className="text-sm text-gray-500 mt-1">{t("noMatchText")}</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredServices.map((service) => (
              <Link 
                key={service.id} 
                href={`/services/${service.id}`}
                className="premium-card flex flex-col overflow-hidden group"
              >
                {/* Image Header (16:9 for landscape places) */}
                <div className="aspect-[16/9] bg-gray-50 relative overflow-hidden border-b border-gray-100">
                  {service.image_url ? (
                    <img 
                      src={service.image_url} 
                      alt={service.service_name} 
                      className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50/50">
                      <Icon.ImagePlaceholder />
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div 
                    className="absolute top-4 left-4 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-md"
                    style={{ background: 'rgba(14, 165, 233, 0.9)' }} // Sky-500
                  >
                    {categoryLabel(service.category)}
                  </div>
                </div>

                {/* Detail Content */}
                <div className="p-5 md:p-6 flex flex-col flex-1">
                  
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-2 group-hover:text-sky-600 transition-colors">
                    {service.service_name}
                  </h3>
                  
                  {/* Address */}
                  <div className="flex items-start gap-1.5 text-xs font-medium text-gray-500 line-clamp-2 mb-4 h-8">
                    <span className="mt-0.5 shrink-0 text-gray-400"><Icon.MapPin /></span>
                    <span>{service.address || t("addressFallback")}</span>
                  </div>

                  {/* Footer (Rating & Action) */}
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#FBBF24]"><Icon.Star /></span>
                      <span className="text-sm font-bold text-gray-900">4.9</span>
                      <span className="text-xs text-gray-400 font-medium">(120)</span>
                    </div>
                    
                    <span className="text-[13px] font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
                      {tc("viewDetails")} <span aria-hidden="true">➔</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}