"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ServiceHubPage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [activePetType, setActivePetType] = useState("ทั้งหมด");

  const categories = ["ทั้งหมด", "อาบน้ำ-ตัดขน", "คลินิก/โรงพยาบาล", "โรงแรมสัตว์เลี้ยง", "ฝึกสอนสัตว์", "บริการอื่นๆ"];
  
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
    fetchServices();
  }, [activeCategory, activePetType]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      let query = supabase.from("services").select("*").order("created_at", { ascending: false });

      if (activeCategory !== "ทั้งหมด") {
        query = query.eq("category", activeCategory);
      }
      // สมมติว่าในตาราง services มีคอลัมน์ pet_type เพื่อบอกว่ารับสัตว์ประเภทไหน
      if (activePetType !== "ทั้งหมด") {
        query = query.contains("pet_types", [activePetType]); 
      }

      const { data, error } = await query;
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.service_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-24 animate-in fade-in duration-700">
      
      {/* 🏥 Header & Search */}
      <div className="mb-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Whiskora Service 🏥</h1>
            <p className="text-sm font-bold text-blue-500">ค้นหาบริการดูแลสัตว์เลี้ยงที่คุณไว้วางใจ</p>
          </div>
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="ค้นหาชื่อบริการ หรือคลินิก..."
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-400 font-medium text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 🐾 Pet Type Filter (Scrollable) */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {petTypes.map((type) => (
            <button
              key={type.label}
              onClick={() => setActivePetType(type.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all shrink-0 border-2 ${
                activePetType === type.value
                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                : "bg-white border-gray-100 text-gray-400 hover:border-blue-200"
              }`}
            >
              <span>{type.icon}</span> {type.label}
            </button>
          ))}
        </div>

        {/* 📑 Category Tabs */}
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
              {activeCategory === cat && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full"></div>}
            </button>
          ))}
        </div>
      </div>

      {/* 🏥 Service Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-[2.5rem]"></div>)}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="py-24 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold">ไม่พบสถานบริการที่คุณต้องการ 🐾</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredServices.map((service) => (
            <Link 
              key={service.id} 
              href={`/services/${service.id}`}
              className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Image Header */}
              <div className="aspect-[16/9] bg-blue-50 relative overflow-hidden">
                {service.image_url ? (
                  <img src={service.image_url} alt={service.service_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🏥</div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-blue-600 shadow-sm">
                  {service.category}
                </div>
              </div>

              {/* Detail Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-black text-gray-800 line-clamp-1">{service.service_name}</h3>
                  <div className="flex items-center gap-1 text-yellow-500 font-bold text-xs">
                    ⭐ 4.9
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 font-medium mb-5 line-clamp-2">
                  {service.address || "บริการดูแลสัตว์เลี้ยงแบบครบวงจร พร้อมดูแลน้องๆ ด้วยหัวใจ"}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex gap-1">
                    {/* แสดงอิโมจิสัตว์ที่รับบริการ (ตัวอย่าง) */}
                    <span className="text-sm">🐱</span>
                    <span className="text-sm">🐶</span>
                  </div>
                  <span className="text-xs font-black text-blue-600 group-hover:translate-x-1 transition-transform">
                    จองบริการ ➔
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}