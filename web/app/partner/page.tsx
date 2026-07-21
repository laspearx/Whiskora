"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#1f1a1c', inkSoft: '#4a3f44', muted: '#8e7e84',
  pink: '#e84677', pinkSoft: '#fde2ea', pinkBorder: '#FBCFE8', pinkDeep: '#c4325f',
  teal: '#0D9488', tealSoft: '#F0FDFA', tealBorder: '#99F6E4',
  blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  cream: '#fffafc', paper: '#fdf0f3', line: '#f3dde3', lineMid: '#E5E7EB',
  bg: '#fffafc',
};

export default function PartnerHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [myFarms, setMyFarms] = useState<any[]>([]);
  const [myShops, setMyShops] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchMyBusinesses = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        if (!s) { setLoading(false); return; }
        const userId = s.user.id;
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
  }, []);

  const categories = [
    {
      title: 'ฟาร์มสัตว์เลี้ยง',
      thumbnail: '/trumbnail-farm.png',
      accentColor: F.pink,
      softColor: F.pinkSoft,
      borderColor: F.pinkBorder,
      hoverColor: F.pinkDeep,
      items: myFarms,
      registerUrl: '/partner/register-farm',
      dash: '/farm-dashboard',
      nameKey: 'farm_name',
    },
    {
      title: 'ร้านค้าสัตว์เลี้ยง',
      thumbnail: '/trumbnail-pet-shop.png',
      accentColor: F.teal,
      softColor: F.tealSoft,
      borderColor: F.tealBorder,
      hoverColor: '#0B7E74',
      items: myShops,
      registerUrl: '/partner/register-shop',
      dash: '/shop-dashboard',
      nameKey: 'shop_name',
    },
    {
      title: 'บริการสัตว์เลี้ยง',
      thumbnail: '/trumbnail-service.png',
      accentColor: F.blue,
      softColor: F.blueSoft,
      borderColor: F.blueBorder,
      hoverColor: '#1D4FD7',
      items: myServices,
      registerUrl: '/partner/register-service',
      dash: '/service-dashboard',
      nameKey: 'service_name',
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        @keyframes page-rise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pp-page {
          max-width: 760px;
          margin: 0 auto;
          padding: 24px 0 80px;
          animation: page-rise .45s ease both;
          color: ${F.ink};
        }

        /* ── Header ── */
        .pp-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }
        .pp-back {
          width: 38px; height: 38px;
          border-radius: 12px;
          border: 1px solid ${F.line};
          background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: transform .15s, background .15s;
          flex: 0 0 auto;
          color: ${F.ink};
        }
        .pp-back:hover { transform: translateY(-1px); background: ${F.paper}; }
        .pp-header-icon {
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          flex: 0 0 auto;
        }
        .pp-header-icon img { width: 44px; height: 44px; object-fit: contain; }
        .pp-header-text h1 {
          margin: 0;
          font-size: 22px; font-weight: 700;
          letter-spacing: -0.01em;
          color: ${F.ink}; line-height: 1.2;
        }
        .pp-header-text p {
          margin: 3px 0 0;
          font-size: 13px; color: ${F.muted}; font-weight: 400;
        }

        /* ── Guest banner ── */
        .pp-banner {
          background: linear-gradient(135deg, ${F.pinkSoft}, #fff6f9);
          border: 1px solid ${F.pinkBorder};
          border-radius: 20px;
          padding: 24px 22px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .pp-banner-icon { width: 60px; height: 60px; flex-shrink: 0; }
        .pp-banner-icon img { width: 100%; height: 100%; object-fit: contain; }
        .pp-banner-text h2 { margin: 0 0 6px; font-size: 18px; font-weight: 700; color: ${F.ink}; }
        .pp-banner-text p { margin: 0; font-size: 13px; color: ${F.inkSoft}; line-height: 1.6; }

        /* ── Category card ── */
        .pp-card {
          background: rgba(255,255,255,.94);
          border: 1px solid ${F.line};
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 14px;
          box-shadow: 0 4px 14px rgba(31,26,28,.04);
          animation: page-rise .45s ease both;
        }

        /* ── Thumbnail image + button overlay ── */
        .pp-thumb-wrap {
          position: relative;
          width: 100%;
          background: #fff0f5;
          display: block;
        }
        .pp-thumb-wrap img {
          width: 100%;
          height: auto;
          display: block;
        }
        .pp-thumb-btn {
          position: absolute;
          left: 3.8%;
          bottom: 19%;
          width: 41%;
          height: 12%;
          border-radius: 999px;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: background .18s;
        }
        .pp-thumb-btn:hover {
          background: rgba(232, 70, 119, 0.18);
        }

        /* ── Business items list ── */
        .pp-card-body {
          padding: 14px 16px 16px;
        }
        .pp-items-label {
          font-size: 10px; font-weight: 700; color: ${F.muted};
          text-transform: uppercase; letter-spacing: 0.07em;
          margin: 0 0 8px;
          display: flex; align-items: center; gap: 6px;
        }
        .pp-items-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .pp-items { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
        .pp-item {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 12px 14px;
          border-radius: 13px;
          border: 1px solid ${F.line};
          background: white;
          text-decoration: none;
          transition: all .15s;
        }
        .pp-item:hover { border-color: ${F.pinkBorder}; box-shadow: 0 2px 8px rgba(232,70,119,.07); }
        .pp-item-name {
          font-size: 14px; font-weight: 600; color: ${F.inkSoft};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pp-item-chevron { color: ${F.line}; flex-shrink: 0; transition: color .15s; }
        .pp-item:hover .pp-item-chevron { color: ${F.pink}; }

        /* ── Add more link ── */
        .pp-add-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; text-decoration: none;
          padding: 4px 0;
          transition: opacity .15s;
        }
        .pp-add-link:hover { opacity: .75; }

        /* ── Guest login hint ── */
        .pp-login-hint {
          text-align: center;
          margin-top: 20px;
          padding: 16px;
          border: 1px solid ${F.line};
          border-radius: 16px;
          background: white;
        }
        .pp-login-hint p { margin: 0 0 10px; font-size: 13px; color: ${F.muted}; }
        .pp-login-hint a {
          font-size: 14px; font-weight: 700; color: ${F.pink};
          text-decoration: none;
        }
        .pp-login-hint a:hover { text-decoration: underline; }

        @media (max-width: 560px) {
          .pp-page { padding: 16px 0 80px; }
          .pp-card { border-radius: 16px; }
          .pp-banner { padding: 18px 16px; }
        }
      `}</style>

      <div className="pp-page">

        {/* Header */}
        <div className="pp-header">
          <button className="pp-back" onClick={() => router.back()} aria-label="ย้อนกลับ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <div className="pp-header-icon">
            <img src="/icons/icon-partner.png" alt="" />
          </div>
          <div className="pp-header-text">
            <h1>{session ? 'ศูนย์รวมพาร์ทเนอร์' : 'เปิดธุรกิจกับ Whiskora'}</h1>
            <p>{session ? 'จัดการกิจการสัตว์เลี้ยงทั้งหมดของคุณ' : 'ฟาร์ม ร้านค้า และบริการ ฟรีในโปรแกรม Genesis'}</p>
          </div>
        </div>

        {/* Guest banner */}
        {!session && (
          <div className="pp-banner">
            <div className="pp-banner-icon">
              <img src="/icons/icon-partner.png" alt="" />
            </div>
            <div className="pp-banner-text">
              <h2>เข้าถึงลูกค้าคนรักสัตว์เลี้ยง</h2>
              <p>เปิดฟาร์ม ร้านค้า หรือบริการของคุณได้ฟรี ไม่มีค่าธรรมเนียม ในช่วง Genesis Program</p>
            </div>
          </div>
        )}

        {/* Category cards */}
        {categories.map((cat) => {
          const registerHref = session
            ? cat.registerUrl
            : `/login?redirect=${encodeURIComponent(cat.registerUrl)}`;
          return (
            <div key={cat.title} className="pp-card">
              {/* Thumbnail with clickable overlay on the drawn button */}
              <div className="pp-thumb-wrap">
                <img src={cat.thumbnail} alt={cat.title} />
                <Link href={registerHref} className="pp-thumb-btn" aria-label={`สมัครเปิด${cat.title}`} />
              </div>

              {/* Logged-in: show existing businesses */}
              {session && cat.items.length > 0 && (
                <div className="pp-card-body">
                  <div className="pp-items-label">
                    <span className="pp-items-dot" style={{ background: cat.accentColor }} />
                    กิจการของคุณ
                  </div>
                  <div className="pp-items">
                    {cat.items.map((item: any) => (
                      <Link key={item.id} href={`${cat.dash}/${item.id}?from=partner`} className="pp-item">
                        <span className="pp-item-name">{item[cat.nameKey] || item.name}</span>
                        <svg className="pp-item-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </Link>
                    ))}
                  </div>
                  <Link href={cat.registerUrl} className="pp-add-link" style={{ color: cat.accentColor }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                    เปิดเพิ่มอีกแห่ง
                  </Link>
                </div>
              )}
            </div>
          );
        })}

        {/* Guest login hint */}
        {!session && (
          <div className="pp-login-hint">
            <p>มีบัญชีแล้ว?</p>
            <Link href="/login?redirect=/partner">เข้าสู่ระบบเพื่อจัดการกิจการ →</Link>
          </div>
        )}

      </div>
    </>
  );
}
