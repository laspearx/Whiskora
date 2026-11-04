"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "@/i18n/context";
import { speciesName } from "@/lib/species";
import { formatPrice } from "@/lib/format";

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827',
  inkSoft: '#4B5563',
  muted: '#9CA3AF',
  pink: '#E84677',
  pinkSoft: '#FDF2F5',
  line: '#E5E7EB',
  paper: '#FFFFFF',
};

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Shop: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  ImagePlaceholder: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
};

// product categories are stored in Thai (products.category) — the value sent to the API stays as is; only the label
// is translated (marketplace.category.*)
const ALL = "all";
const CATEGORIES: { value: string; key: string }[] = [
  { value: "อาหาร", key: "food" },
  { value: "ของเล่น", key: "toys" },
  { value: "อุปกรณ์", key: "gear" },
  { value: "ที่นอน/กรง", key: "beds" },
  { value: "สุขภาพ/อาบน้ำ", key: "care" },
];
const SPECIES = ["cat", "dog", "rabbit", "hamster", "bird", "squirrel", "hedgehog", "fish"];

export default function MarketplacePage() {
  const t = useTranslations("marketplace");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [activePetType, setActivePetType] = useState(ALL);
  const loadSequence = useRef(0);

  const categories = [{ value: ALL, label: tc("all") }, ...CATEGORIES.map((c) => ({ value: c.value, label: t(`category.${c.key}`) }))];
  const petTypes = [
    { value: ALL, label: tc("all") },
    ...SPECIES.map((id) => ({ value: id, label: speciesName(id, locale) })),
    { value: "other", label: tc("otherPets") },
  ];

  const fetchProducts = useCallback(async () => {
    const sequence = ++loadSequence.current;
    const isCurrent = () => sequence === loadSequence.current;
    setLoading(true);
    setLoadError(false);
    try {
      let query = supabase
        .from("products")
        .select("*, shops(shop_name, id)")
        .order("created_at", { ascending: false });

      if (activeCategory !== ALL) {
        query = query.eq("category", activeCategory);
      }
      if (activePetType !== ALL) {
        query = query.eq("pet_type", activePetType);
      }

      const { data, error } = await query;
      if (!isCurrent()) return;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      if (!isCurrent()) return;
      console.error("Error:", error);
      setLoadError(true);   // a failed load is an error, not "no products"
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [activeCategory, activePetType]);

  useEffect(() => {
    void fetchProducts();
    // Invalidates filter loads and manual retries, including after unmount.
    return () => { loadSequence.current += 1; };
  }, [fetchProducts]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.shops?.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <style>{`
        /* Hide scrollbar for smooth horizontal scrolling */
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
        
        {/* 🔍 Search & Header */}
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
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-pink-400 focus:ring-4 focus:ring-pink-50 font-medium text-sm transition-all outline-none"
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
                  <div className="absolute bottom-0 left-0 w-full h-0.5 rounded-t-full" style={{ background: F.pink }}></div>
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

        {/* 📦 Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" aria-busy="true">
            <span className="sr-only">{tc("loading")}</span>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-50 animate-pulse rounded-2xl border border-gray-100" aria-hidden="true"></div>
            ))}
          </div>
        ) : loadError ? (
          <div role="alert" data-testid="marketplace-error" className="py-20 px-6 text-center bg-red-50 rounded-3xl border border-red-100">
            <p className="font-semibold text-red-900">{tc("loadErrorTitle")}</p>
            <p className="text-sm text-red-800 mt-1">{tc("loadErrorText")}</p>
            <button type="button" onClick={fetchProducts} className="mt-5 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold">{tc("retry")}</button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 px-6 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <div className="text-gray-300 mb-3 flex justify-center"><Icon.Search /></div>
            {products.length === 0 && activeCategory === ALL && activePetType === ALL ? (
              <>
                <p className="text-gray-600 font-semibold">{t("noProductsTitle")}</p>
                <p className="text-sm text-gray-500 mt-1">{t("noProductsText")}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href="/partner/register-shop" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#E84677' }}>{t("openShop")}</Link>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <Link 
                key={product.id} 
                // ยังไม่มีหน้ารายละเอียดสินค้า — เปิดหน้าร้านแทนลิงก์ที่ 404
                href={`/shops/${product.shops.id}`}
                className="premium-card flex flex-col overflow-hidden group"
              >
                {/* Product Image Wrapper */}
                <div className="aspect-square bg-gray-50 relative overflow-hidden border-b border-gray-100">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50/50">
                      <Icon.ImagePlaceholder />
                    </div>
                  )}
                  
                  {/* Premium Discount Badge */}
                  {product.discount && (
                    <div 
                      className="absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm"
                      style={{ background: F.pink }}
                    >
                      {t("sale", { n: product.discount })}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 md:p-5 flex flex-col flex-1">
                  {/* Shop Name */}
                  <div className="flex items-center gap-1.5 mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    <Icon.Shop />
                    <span className="truncate">{product.shops?.shop_name}</span>
                  </div>
                  
                  {/* Product Title */}
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug group-hover:text-pink-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  {/* Price Section (Pushed to bottom) */}
                  <div className="mt-auto flex items-baseline gap-2">
                    <span className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">
                      {formatPrice(product.price, locale)}
                    </span>
                    {product.original_price && (
                      <span className="text-xs font-medium text-gray-500 line-through" aria-label={t("originalPrice", { price: formatPrice(product.original_price, locale) })}>
                        {formatPrice(product.original_price, locale)}
                      </span>
                    )}
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
