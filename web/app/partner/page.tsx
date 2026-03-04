"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PartnerHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [myFarms, setMyFarms] = useState<any[]>([]);
  const [myShops, setMyShops] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchMyBusinesses = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const userId = session.user.id;

        const [farmsRes, shopsRes, servicesRes] = await Promise.all([
          supabase.from("farms").select("*").eq("user_id", userId),
          supabase.from("shops").select("*").eq("user_id", userId),
          supabase.from("services").select("*").eq("user_id", userId),
        ]);

        if (farmsRes.data) setMyFarms(farmsRes.data);
        if (shopsRes.data) setMyShops(shopsRes.data);
        if (servicesRes.data) setMyServices(servicesRes.data);

      } catch (error) {
        console.error("Error fetching businesses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBusinesses();
  }, [router]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังโหลดข้อมูลพาร์ทเนอร์... ⏳</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 md:pt-12 pb-20 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
        <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight mb-4">
          ร่วมเป็นพาร์ทเนอร์กับ <span className="text-pink-500">Whiskora</span> 🤝🏻
        </h1>
        <p className="text-gray-500 text-sm md:text-base font-medium leading-relaxed">
          ขยายธุรกิจสัตว์เลี้ยงของคุณให้เติบโตไปกับเรา ไม่ว่าจะเป็นฟาร์มเพาะพันธุ์ ร้านขายสินค้า หรือบริการดูแลสัตว์เลี้ยง ครบจบในที่เดียว
        </p>
      </div>

      {/* Grid 3 หมวดหมู่ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        
        <PartnerCategoryCard 
          title="ฟาร์มสัตว์เลี้ยง" 
          description="ระบบจัดการฟาร์มเพาะพันธุ์ ประวัติสายเลือด และวัคซีน"
          icon="🏡"
          colorTheme="pink"
          items={myFarms}
          registerUrl="/partner/register-farm"
          dashboardUrlPrefix="/farm-dashboard"
        />

        <PartnerCategoryCard 
          title="ร้านค้าสำหรับสัตว์เลี้ยง" 
          description="เปิดร้านขายอาหาร ของเล่น และอุปกรณ์สัตว์เลี้ยง"
          icon="🛍️"
          colorTheme="teal"
          items={myShops}
          registerUrl="/partner/register-shop"
          dashboardUrlPrefix="/shop-dashboard"
        />

        <PartnerCategoryCard 
          title="บริการเกี่ยวกับสัตว์เลี้ยง" 
          description="รับอาบน้ำ ตัดขน คลินิก หรือโรงแรมรับฝากเลี้ยง"
          icon="✂️"
          colorTheme="blue"
          items={myServices}
          registerUrl="/partner/register-service"
          dashboardUrlPrefix="/service-dashboard"
        />

      </div>
    </div>
  );
}

function PartnerCategoryCard({ title, description, icon, colorTheme, items, registerUrl, dashboardUrlPrefix }: any) {
  const themeStyles = {
    pink: { bg: "bg-pink-50", text: "text-pink-500", border: "border-pink-100", hover: "hover:border-pink-300", btn: "bg-pink-500 hover:bg-pink-600 shadow-pink-200" },
    teal: { bg: "bg-teal-50", text: "text-teal-500", border: "border-teal-100", hover: "hover:border-teal-300", btn: "bg-teal-500 hover:bg-teal-600 shadow-teal-200" },
    blue: { bg: "bg-blue-50", text: "text-blue-500", border: "border-blue-100", hover: "hover:border-blue-300", btn: "bg-blue-500 hover:bg-blue-600 shadow-blue-200" },
  }[colorTheme as 'pink' | 'teal' | 'blue'];

  return (
    <div className={`bg-white rounded-[2rem] border ${themeStyles.border} p-6 shadow-sm flex flex-col h-full transition-all duration-300 ${themeStyles.hover}`}>
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="text-xl font-black text-gray-800 mb-2">{title}</h2>
      <p className="text-sm text-gray-500 mb-6 flex-1">{description}</p>

      {items.length === 0 ? (
        <Link 
          href={registerUrl}
          className={`w-full py-3.5 rounded-xl font-bold text-white text-center transition shadow-lg ${themeStyles.btn}`}
        >
          สมัครเปิด{title}
        </Link>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-400">กิจการของคุณ</p>
          
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
            {items.map((item: any) => {
              const petEmojiMap: Record<string, string> = {
                cat: '🐱', dog: '🐶', rabbit: '🐰', hamster: '🐹', bird: '🦜', squirrel: '🐿️',
                hedgehog: '🦔', fish: '🐟', turtle: '🐢', frog: '🐸', lizard: '🦎', snake: '🐍',
                raccoon: '🦝', other: '🐾'
              };

              const speciesLabel = item.species ? (petEmojiMap[item.species] || '🐾') : "";

              return (
                <Link 
                  key={item.id} 
                  // 🌟 จุดสำคัญ: เพิ่ม ?from=partner เข้าไปใน URL Dashboard
                  href={`${dashboardUrlPrefix}/${item.id}?from=partner`} 
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition group"
                >
                  <span className="font-bold text-sm text-gray-700 truncate pr-2">
                    {item.shop_name || item.name || item.farm_name || item.service_name}
                    {speciesLabel && (
                      <span className="text-gray-400 font-medium text-[11px] ml-1.5 inline-block">
                        {speciesLabel}
                      </span>
                    )}
                  </span>
                  <span className={`text-xs font-black ${themeStyles.text} shrink-0`}>จัดการ ➔</span>
                </Link>
              );
            })}
          </div>

          <Link 
            href={registerUrl}
            className={`block w-full text-center py-2.5 mt-2 rounded-xl text-xs font-bold transition border ${themeStyles.bg} ${themeStyles.text} ${themeStyles.border} hover:bg-white`}
          >
            + เปิดเพิ่มอีกแห่ง
          </Link>
        </div>
      )}
    </div>
  );
}