"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MarketplacePage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [activePetType, setActivePetType] = useState("ทั้งหมด");

  const categories = ["ทั้งหมด", "อาหาร", "ของเล่น", "อุปกรณ์", "ที่นอน/กรง", "สุขภาพ/อาบน้ำ"];
  const petTypes = [
    { label: "ทั้งหมด", icon: "🏠", value: "ทั้งหมด" },
    { label: "แมว", icon: "🐱", value: "cat" },
    { label: "สุนัข", icon: "🐶", value: "dog" },
    { label: "กระต่าย", icon: "🐰", value: "rabbit" },
    { label: "หนูแฮมสเตอร์", icon: "🐹", value: "hamster" },
    { label: "นก", icon: "🦜", value: "bird" },
    { label: "กระรอก", icon: "🐿️", value: "squirrel" },
    { label: "เม่นแคระ", icon: "🦔", value: "hedgehog" },
    { label: "ปลา", icon: "🐟", value: "fish" },
    { label: "เต่า", icon: "🐢", value: "turtle" },
    { label: "กบ", icon: "🐸", value: "frog" },
    { label: "กิ้งก่า", icon: "🦎", value: "lizard" },
    { label: "งู", icon: "🐍", value: "snake" },
    { label: "แร็กคูน", icon: "🦝", value: "raccoon" },
    { label: "สัตว์อื่นๆ", icon: "🐾", value: "other" },
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

  // กรองสินค้าตาม Search Query
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.shops?.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-24 animate-in fade-in duration-700">
      
      {/* 🔍 Search & Header */}
      <div className="mb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Whiskora Market 🛍️</h1>
            <p className="text-sm font-bold text-teal-500">รวมสินค้าเพ็ทช็อปจากทุกมุมโลก</p>
          </div>
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="ค้นหาสินค้า หรือชื่อร้านค้า..."
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-400 font-medium text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 🐶 Pet Type Filter */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {petTypes.map((type) => (
            <button
              key={type.label}
              onClick={() => setActivePetType(type.label === "ทั้งหมด" ? "ทั้งหมด" : type.value!)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all shrink-0 border-2 ${
                (activePetType === type.value || (activePetType === "ทั้งหมด" && type.label === "ทั้งหมด"))
                ? "bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-100" 
                : "bg-white border-gray-100 text-gray-400 hover:border-teal-200"
              }`}
            >
              <span>{type.icon}</span> {type.label}
            </button>
          ))}
        </div>

        {/* 🏷️ Category Tabs */}
        <div className="flex gap-6 border-b border-gray-100 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pb-3 text-sm font-bold transition-all shrink-0 relative ${
                activeCategory === cat ? "text-gray-800" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {cat}
              {activeCategory === cat && <div className="absolute bottom-0 left-0 w-full h-1 bg-teal-500 rounded-full"></div>}
            </button>
          ))}
        </div>
      </div>

      {/* 📦 Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-[2rem]"></div>)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold">ไม่พบสินค้าที่คุณกำลังมองหา 🐾</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {filteredProducts.map((product) => (
            <Link 
              key={product.id} 
              href={`/shops/${product.shops.id}/products/${product.id}`}
              className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-square bg-teal-50 relative overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🛍️</div>
                )}
                {product.discount && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">-{product.discount}%</div>
                )}
              </div>
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md truncate max-w-full">
                    🏪 {product.shops?.shop_name}
                  </span>
                </div>
                <h3 className="text-sm font-black text-gray-800 mb-1 line-clamp-2 min-h-[40px] leading-snug">
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-lg font-black text-gray-900">฿{product.price?.toLocaleString()}</span>
                  {product.original_price && (
                    <span className="text-[11px] text-gray-400 line-through">฿{product.original_price.toLocaleString()}</span>
                  )}
                </div>
                <button className="w-full mt-4 py-2 bg-gray-50 group-hover:bg-teal-500 group-hover:text-white text-gray-400 text-[11px] font-bold rounded-xl transition-colors">
                  ดูรายละเอียด ➔
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}