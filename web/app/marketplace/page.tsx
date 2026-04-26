"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function MarketplacePage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [activePetType, setActivePetType] = useState("ทั้งหมด");

  const categories = ["ทั้งหมด", "อาหาร", "ของเล่น", "อุปกรณ์", "ที่นอน/กรง", "สุขภาพ/อาบน้ำ"];
  
  // 🌟 ปรับดีไซน์ Data ให้ไม่มี Emoji เพื่อความคลีน (ใช้แค่ Text ใน UI)
  const petTypes = [
    { label: "ทั้งหมด", value: "ทั้งหมด" },
    { label: "แมว", value: "cat" },
    { label: "สุนัข", value: "dog" },
    { label: "กระต่าย", value: "rabbit" },
    { label: "หนูแฮมสเตอร์", value: "hamster" },
    { label: "นก", value: "bird" },
    { label: "กระรอก", value: "squirrel" },
    { label: "เม่นแคระ", value: "hedgehog" },
    { label: "ปลา", value: "fish" },
    { label: "สัตว์อื่นๆ", value: "other" },
  ];

  useEffect(() => {
    fetchProducts();
  }, [activeCategory, activePetType]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("products")
        .select("*, shops(shop_name, id)")
        .order("created_at", { ascending: false });

      if (activeCategory !== "ทั้งหมด") {
        query = query.eq("category", activeCategory);
      }
      if (activePetType !== "ทั้งหมด") {
        query = query.eq("pet_type", activePetType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Marketplace</h1>
              <p className="text-sm font-medium" style={{ color: F.muted }}>ค้นหาสินค้าคุณภาพสำหรับสัตว์เลี้ยงจากพาร์ทเนอร์ของเรา</p>
            </div>
            
            {/* Sleek Search Bar */}
            <div className="relative w-full md:max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Icon.Search /></span>
              <input 
                type="text" 
                placeholder="ค้นหาสินค้า, แบรนด์ หรือชื่อร้าน..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-pink-400 focus:ring-4 focus:ring-pink-50 font-medium text-sm transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 🏷️ Minimal Category Tabs */}
          <div className="flex gap-6 border-b border-gray-100 overflow-x-auto no-scrollbar pb-px">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`pb-4 text-sm font-semibold transition-all shrink-0 relative whitespace-nowrap ${
                  activeCategory === cat ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {cat}
                {activeCategory === cat && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 rounded-t-full" style={{ background: F.pink }}></div>
                )}
              </button>
            ))}
          </div>

          {/* 🐶 Premium Pet Type Pills */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
            {petTypes.map((type) => {
              const isActive = activePetType === type.value || (activePetType === "ทั้งหมด" && type.label === "ทั้งหมด");
              return (
                <button
                  key={type.label}
                  onClick={() => setActivePetType(type.label === "ทั้งหมด" ? "ทั้งหมด" : type.value!)}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-50 animate-pulse rounded-2xl border border-gray-100"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <div className="text-gray-300 mb-3 flex justify-center"><Icon.Search /></div>
            <p className="text-gray-500 font-semibold">ไม่พบสินค้าในหมวดหมู่นี้</p>
            <p className="text-sm text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือหมวดหมู่ดูอีกครั้ง</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <Link 
                key={product.id} 
                href={`/shops/${product.shops.id}/products/${product.id}`}
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
                      Sale {product.discount}%
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
                      ฿{product.price?.toLocaleString()}
                    </span>
                    {product.original_price && (
                      <span className="text-xs font-medium text-gray-400 line-through">
                        ฿{product.original_price.toLocaleString()}
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