"use client";

import React, { useState, useEffect } from "react";
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
  teal: '#0D9488',
  blue: '#2563EB',
  line: '#E5E7EB',
  paper: '#FFFFFF',
};

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  Farm: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Shop: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Service: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 0l.3.3a2 2 0 0 1 0 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.83 0l.3.3a2 2 0 0 1 0 2.83l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77"/><path d="m4.86 19.14 1.42 1.42"/><circle cx="4" cy="20" r="2"/><path d="M14.7 6.3 6.3 14.7"/><path d="m14.7 6.3-2.8-2.8a2 2 0 0 0-2.8 0L3.5 9.1a2 2 0 0 0 0 2.8l2.8 2.8"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

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

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold tracking-widest text-gray-400 animate-pulse uppercase">
      Loading Partner Hub...
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 pt-12 pb-24 animate-in fade-in duration-700" style={{ fontFamily: 'var(--font-ui)', color: F.ink }}>
      
      {/* 🤝 Header Section */}
      <div className="max-w-3xl mb-12 md:mb-20">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          Partner <span style={{ color: F.pink }}>Hub</span>
        </h1>
        <p className="text-base md:text-lg font-medium leading-relaxed" style={{ color: F.inkSoft }}>
          ศูนย์รวมการจัดการธุรกิจสัตว์เลี้ยงของคุณ ขยายการเติบโตและเข้าถึงกลุ่มลูกค้าคนรักสัตว์ได้ง่ายกว่าที่เคย ครบจบในที่เดียว
        </p>
      </div>

      {/* 🚀 Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        
        <PartnerCategoryCard 
          title="ฟาร์มสัตว์เลี้ยง" 
          description="จัดการระบบเพาะพันธุ์ ประวัติสายเลือด และวัคซีนสัตว์เลี้ยง"
          icon={<Icon.Farm />}
          colorTheme="pink"
          items={myFarms}
          registerUrl="/partner/register-farm"
          dashboardUrlPrefix="/farm-dashboard"
        />

        <PartnerCategoryCard 
          title="ร้านค้าสัตว์เลี้ยง" 
          description="เปิดร้านขายอาหาร ของเล่น และอุปกรณ์สำหรับสัตว์เลี้ยง"
          icon={<Icon.Shop />}
          colorTheme="teal"
          items={myShops}
          registerUrl="/partner/register-shop"
          dashboardUrlPrefix="/shop-dashboard"
        />

        <PartnerCategoryCard 
          title="บริการสัตว์เลี้ยง" 
          description="ระบบรับจองคิวอาบน้ำ ตัดขน คลินิก หรือโรงแรมรับฝากเลี้ยง"
          icon={<Icon.Service />}
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
    pink: { 
        accent: F.pink, 
        bg: "bg-pink-50/50", 
        border: "border-gray-200", 
        hover: "hover:border-pink-300", 
        btn: "bg-gray-900 hover:bg-gray-800 text-white shadow-sm" 
    },
    teal: { 
        accent: F.teal, 
        bg: "bg-teal-50/50", 
        border: "border-gray-200", 
        hover: "hover:border-teal-300", 
        btn: "bg-gray-900 hover:bg-gray-800 text-white shadow-sm" 
    },
    blue: { 
        accent: F.blue, 
        bg: "bg-blue-50/50", 
        border: "border-gray-200", 
        hover: "hover:border-blue-300", 
        btn: "bg-gray-900 hover:bg-gray-800 text-white shadow-sm" 
    },
  }[colorTheme as 'pink' | 'teal' | 'blue'];

  return (
    <div className={`bg-white rounded-2xl border ${themeStyles.border} p-7 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:shadow-gray-100/50 ${themeStyles.hover}`}>
      
      {/* Icon Area */}
      <div className={`w-14 h-14 rounded-2xl ${themeStyles.bg} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`} style={{ color: themeStyles.accent }}>
        {icon}
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm font-medium text-gray-500 mb-8 flex-1 leading-relaxed">{description}</p>

      <div className="mt-auto space-y-4">
        {items.length > 0 ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: themeStyles.accent }}></span>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">กิจการของคุณ</p>
            </div>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
              {items.map((item: any) => (
                <Link 
                  key={item.id} 
                  href={`${dashboardUrlPrefix}/${item.id}?from=partner`} 
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-gray-300 transition-all group"
                >
                  <span className="font-semibold text-sm text-gray-700 truncate pr-2">
                    {item.shop_name || item.name || item.farm_name || item.service_name}
                  </span>
                  <span className="text-gray-300 group-hover:text-gray-900 transition-colors"><Icon.ChevronRight /></span>
                </Link>
              ))}
            </div>

            <Link 
              href={registerUrl}
              className="inline-flex items-center gap-2 text-xs font-bold transition-colors py-2"
              style={{ color: themeStyles.accent }}
            >
              <Icon.Plus /> เปิดเพิ่มอีกแห่ง
            </Link>
          </div>
        ) : (
          <Link 
            href={registerUrl}
            className={`w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all ${themeStyles.btn}`}
          >
            สมัครเปิด{title}
          </Link>
        )}
      </div>
    </div>
  );
}