"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA', tealBorder: '#99F6E4',
  blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  Farm: () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Shop: () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Service: () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>,
  Chevron: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
};

const THEME: Record<string, any> = {
  pink: { accent: F.pink, soft: F.pinkSoft, border: F.pinkBorder, hover: '#D63F6A' },
  teal: { accent: F.teal, soft: F.tealSoft, border: F.tealBorder, hover: '#0B7E74' },
  blue: { accent: F.blue, soft: F.blueSoft, border: F.blueBorder, hover: '#1D4FD7' },
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
        if (!session) { router.push(`/login?redirect=${encodeURIComponent('/partner')}`); return; }
        const userId = session.user.id;
        const [farmsRes, shopsRes, servicesRes] = await Promise.all([
          supabase.from("farms").select("*").eq("user_id", userId),
          supabase.from("shops").select("*").eq("user_id", userId),
          supabase.from("services").select("*").eq("user_id", userId),
        ]);
        if (farmsRes.data) setMyFarms(farmsRes.data);
        if (shopsRes.data) setMyShops(shopsRes.data);
        if (servicesRes.data) setMyServices(servicesRes.data);
      } catch (error) { console.error("Error fetching businesses:", error); }
      finally { setLoading(false); }
    };
    fetchMyBusinesses();
  }, [router]);

  const categories = [
    { title: 'ฟาร์มสัตว์เลี้ยง', desc: 'จัดการระบบเพาะพันธุ์ ประวัติสายเลือด และวัคซีนสัตว์เลี้ยง', icon: <Icon.Farm />, theme: 'pink', items: myFarms, registerUrl: '/partner/register-farm', dash: '/farm-dashboard', nameKey: 'farm_name' },
    { title: 'ร้านค้าสัตว์เลี้ยง', desc: 'เปิดร้านขายอาหาร ของเล่น และอุปกรณ์สำหรับสัตว์เลี้ยง', icon: <Icon.Shop />, theme: 'teal', items: myShops, registerUrl: '/partner/register-shop', dash: '/shop-dashboard', nameKey: 'shop_name' },
    { title: 'บริการสัตว์เลี้ยง', desc: 'ระบบรับจองคิวอาบน้ำ ตัดขน คลินิก หรือโรงแรมรับฝากเลี้ยง', icon: <Icon.Service />, theme: 'blue', items: myServices, registerUrl: '/partner/register-service', dash: '/service-dashboard', nameKey: 'service_name' },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ph-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .ph-body { max-width: 1000px; margin: 0 auto; padding: 40px 20px 80px; }
        .ph-hero { margin-bottom: 36px; }
        .ph-hero h1 { font-family: inherit; font-size: 36px; font-weight: 700; letter-spacing: -0.8px; margin: 0 0 12px; }
        .ph-hero h1 .accent { color: ${F.pink}; }
        .ph-hero p { font-size: 15px; font-weight: 500; line-height: 1.7; color: ${F.inkSoft}; max-width: 600px; margin: 0; }
        .ph-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .ph-card { background: white; border: 1px solid ${F.line}; border-radius: 22px; padding: 26px; display: flex; flex-direction: column; transition: all .2s; }
        .ph-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.06); transform: translateY(-2px); }
        .ph-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
        .ph-title { font-family: inherit; font-size: 19px; font-weight: 700; color: ${F.ink}; margin: 0 0 8px; }
        .ph-desc { font-size: 13px; font-weight: 500; color: ${F.muted}; line-height: 1.6; margin: 0 0 22px; flex: 1; }
        .ph-mine-label { display: flex; align-items: center; gap: 7px; font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; }
        .ph-mine-dot { width: 6px; height: 6px; border-radius: 50%; }
        .ph-items { display: flex; flex-direction: column; gap: 8px; max-height: 170px; overflow-y: auto; margin-bottom: 12px; }
        .ph-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 14px; border-radius: 12px; border: 1px solid ${F.line}; background: #FAFAFA; text-decoration: none; transition: all .15s; }
        .ph-item:hover { background: white; }
        .ph-item-name { font-size: 14px; font-weight: 700; color: ${F.inkSoft}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ph-item-arrow { color: ${F.muted}; flex-shrink: 0; display: flex; }
        .ph-add-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; text-decoration: none; padding: 6px 0; }
        .ph-register-btn { display: block; width: 100%; text-align: center; padding: 14px; border-radius: 13px; font-size: 14px; font-weight: 700; color: white; text-decoration: none; transition: all .15s; }
        .ph-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .ph-spinner { padding: 9px 14px; border-radius: 12px; border: 3px solid ${F.pinkBorder}; border-top-color: ${F.pink}; animation: phspin 1s linear infinite; }
        @keyframes phspin { to { transform: rotate(360deg); } }
        @media (max-width: 820px) { .ph-grid { grid-template-columns: 1fr; } .ph-hero h1 { font-size: 30px; } }
      `}</style>

      {loading ? (
        <div className="ph-loading">
          <div className="ph-spinner" />
          <p style={{ fontSize: 13, fontWeight: 700, color: F.muted }}>กำลังโหลด...</p>
        </div>
      ) : (
        <div className="ph-page">
          <div className="ph-body">
            <div className="ph-hero">
              <h1>ศูนย์รวม<span className="accent">พาร์ทเนอร์</span></h1>
              <p>ศูนย์รวมการจัดการธุรกิจสัตว์เลี้ยงของคุณ ขยายการเติบโตและเข้าถึงกลุ่มลูกค้าคนรักสัตว์ได้ง่ายกว่าที่เคย ครบจบในที่เดียว</p>
            </div>

            <div className="ph-grid">
              {categories.map((cat) => {
                const t = THEME[cat.theme];
                return (
                  <div key={cat.title} className="ph-card">
                    <div className="ph-icon" style={{ background: t.soft, color: t.accent }}>{cat.icon}</div>
                    <h2 className="ph-title">{cat.title}</h2>
                    <p className="ph-desc">{cat.desc}</p>

                    {cat.items.length > 0 ? (
                      <div>
                        <div className="ph-mine-label"><span className="ph-mine-dot" style={{ background: t.accent }} /> กิจการของคุณ</div>
                        <div className="ph-items">
                          {cat.items.map((item: any) => (
                            <Link key={item.id} href={`${cat.dash}/${item.id}?from=partner`} className="ph-item"
                              onMouseEnter={(e) => (e.currentTarget.style.borderColor = t.border)}
                              onMouseLeave={(e) => (e.currentTarget.style.borderColor = F.line)}>
                              <span className="ph-item-name">{item[cat.nameKey] || item.name}</span>
                              <span className="ph-item-arrow"><Icon.Chevron /></span>
                            </Link>
                          ))}
                        </div>
                        <Link href={cat.registerUrl} className="ph-add-link" style={{ color: t.accent }}><Icon.Plus /> เปิดเพิ่มอีกแห่ง</Link>
                      </div>
                    ) : (
                      <Link href={cat.registerUrl} className="ph-register-btn" style={{ background: t.accent }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = t.hover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = t.accent)}>
                        สมัครเปิด{cat.title}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
