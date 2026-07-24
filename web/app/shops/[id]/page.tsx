"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  teal: '#0D9488', tealSoft: '#F0FDFA', tealBorder: '#99F6E4',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Share: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
};

export default function PublicShopProfile() {
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;

  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const { data, error } = await supabase.from('shops').select('*').eq('id', shopId).single();
        if (error || !data) { router.push('/'); return; }
        setShop(data);
      } catch { router.push('/'); }
      finally { setLoading(false); }
    };
    if (shopId) fetchShop();
  }, [shopId, router]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: shop?.shop_name, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };

  if (loading) return <PageLoader />;
  if (!shop) return null;

  const mapQuery = shop.lat && shop.lng
    ? `${shop.lat},${shop.lng}`
    : encodeURIComponent(shop.address || shop.shop_name);
  const mapsUrl = `https://maps.google.com/?q=${mapQuery}`;

  const speciesArr: string[] = Array.isArray(shop.supported_species)
    ? shop.supported_species
    : (shop.supported_species || '').split(',').filter(Boolean);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .sh-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: transparent; }
        .sh-body { max-width: 960px; margin: 0 auto; padding-bottom: 100px; }
        .sh-cover { position: relative; aspect-ratio: 3/1; min-height: 140px; background: linear-gradient(135deg, ${F.tealSoft}, #CCFBF1); overflow: hidden; width: 100vw; left: 50%; transform: translateX(-50%); }
        .sh-cover img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
        .sh-cover-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.15), transparent 40%); }
        .sh-cover-top { position: absolute; top: 16px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; z-index: 2; }
        .sh-cover-btn { width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); color: ${F.ink}; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; box-shadow: 0 2px 10px rgba(0,0,0,0.12); transition: all .15s; }
        .sh-identity { background: white; border-radius: 24px 24px 0 0; margin-top: -24px; position: relative; z-index: 3; padding: 0 24px 24px; }
        .sh-id-row { display: flex; align-items: flex-end; gap: 18px; padding-top: 14px; flex-wrap: wrap; }
        .sh-avatar { width: 100px; height: 100px; border-radius: 50%; border: 4px solid white; margin-top: -62px; overflow: hidden; background: ${F.tealSoft}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
        .sh-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sh-id-main { flex: 1; min-width: 160px; }
        .sh-name { font-family: inherit; font-size: 24px; font-weight: 700; color: ${F.ink}; line-height: 1.15; letter-spacing: -0.4px; }
        .sh-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${F.tealSoft}; color: ${F.teal}; border: 1px solid ${F.tealBorder}; margin-top: 6px; }
        .sh-bio { font-size: 13px; color: ${F.inkSoft}; line-height: 1.65; background: ${F.tealSoft}; border: 1px solid ${F.tealBorder}; border-radius: 16px; padding: 16px; margin-top: 16px; }
        .sh-section { max-width: 960px; margin: 0 auto; padding: 0 24px; margin-top: 20px; }
        .sh-card { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 22px; }
        .sh-sec-title { font-family: inherit; font-size: 16px; font-weight: 700; color: ${F.ink}; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .sh-info-grid { display: flex; flex-direction: column; }
        .sh-info-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px dotted ${F.lineMid}; }
        .sh-info-row:last-child { border-bottom: none; }
        .sh-info-row-link { text-decoration: none; cursor: pointer; border-radius: 10px; margin: 0 -8px; padding: 11px 8px; transition: background .15s; display: flex; align-items: center; gap: 12px; border-bottom: 1px dotted ${F.lineMid}; }
        .sh-info-row-link:last-child { border-bottom: none; }
        .sh-info-row-link:hover { background: ${F.tealSoft}; }
        .sh-info-icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; }
        .sh-info-label { font-size: 13px; color: ${F.muted}; font-weight: 400; min-width: 110px; }
        .sh-info-val { font-size: 13px; color: ${F.ink}; font-weight: 500; margin-left: auto; text-align: right; }
        .sh-info-val.link { color: ${F.teal}; }
        .sh-species-pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .sh-species-pill { padding: 5px 12px; border-radius: 20px; background: ${F.tealSoft}; color: ${F.teal}; font-size: 12px; font-weight: 700; border: 1px solid ${F.tealBorder}; }
        .sh-cta-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 60; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .sh-cta-inner { max-width: 960px; margin: 0 auto; display: flex; gap: 12px; }
        .sh-cta-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 26px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; text-decoration: none; }
        .sh-cta-primary { background: ${F.teal}; color: white; box-shadow: 0 4px 14px rgba(13,148,136,0.3); }
        .sh-cta-ghost { background: white; color: ${F.teal}; border: 1px solid ${F.tealBorder}; }
        .sh-toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: ${F.ink}; color: white; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 60; }
        @media (max-width: 720px) { .sh-identity, .sh-section { padding-left: 16px; padding-right: 16px; } }
      `}</style>

      <div className="sh-page">
        <div className="sh-body">
          {/* Cover */}
          <div className="sh-cover">
            {(shop.cover_url || shop.image_url) && <img src={shop.cover_url || shop.image_url} alt={shop.shop_name} />}
            <div className="sh-cover-overlay" />
            <div className="sh-cover-top">
              <button className="sh-cover-btn" onClick={() => router.back()}><Icon.ArrowLeft /></button>
              <button className="sh-cover-btn" onClick={handleShare}><Icon.Share /></button>
            </div>
          </div>

          {/* Identity */}
          <div className="sh-identity">
            <div className="sh-id-row">
              <div className="sh-avatar">
                {shop.image_url
                  ? <img src={shop.image_url} alt={shop.shop_name} />
                  : <img src="/icons/icon-shop.png" alt="" style={{ width: 48, height: 48, objectFit: 'contain', opacity: 0.4 }} />}
              </div>
              <div className="sh-id-main">
                <h1 className="sh-name">{shop.shop_name}</h1>
                <div className="sh-badge">Pet Shop</div>
              </div>
            </div>
            {shop.bio && <p className="sh-bio">{shop.bio}</p>}
          </div>

          {/* Contact Info */}
          <div className="sh-section">
            <div className="sh-card">
              <div className="sh-sec-title">
                <img src="/icons/icon-nav-profile.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                ข้อมูลติดต่อ
              </div>
              <div className="sh-info-grid">
                {shop.owner_name && (
                  <div className="sh-info-row">
                    <div className="sh-info-icon"><img src="/icons/icon-nav-profile.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} /></div>
                    <span className="sh-info-label">เจ้าของ</span>
                    <span className="sh-info-val">{shop.owner_name}</span>
                  </div>
                )}
                {shop.phone && (
                  <a className="sh-info-row-link" href={`tel:${shop.phone}`}>
                    <div className="sh-info-icon"><img src="/icons/icon-phone.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} /></div>
                    <span className="sh-info-label">เบอร์โทรศัพท์</span>
                    <span className="sh-info-val link">{shop.phone}</span>
                  </a>
                )}
                {shop.address && (
                  <a className="sh-info-row-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <div className="sh-info-icon"><img src="/icons/icon-location.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} /></div>
                    <span className="sh-info-label">ที่อยู่</span>
                    <span className="sh-info-val link">{shop.address}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Species */}
          {speciesArr.length > 0 && (
            <div className="sh-section">
              <div className="sh-card">
                <div className="sh-sec-title">
                  <img src="/icons/icon-my-pets.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                  สินค้าสำหรับสัตว์เลี้ยง
                </div>
                <div className="sh-species-pills">
                  {speciesArr.map(s => (
                    <span key={s} className="sh-species-pill">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Bar */}
        <div className="sh-cta-bar">
          <div className="sh-cta-inner">
            <button className="sh-cta-btn sh-cta-ghost" onClick={handleShare}><Icon.Share /> แชร์</button>
            {shop.phone && (
              <a className="sh-cta-btn sh-cta-primary" href={`tel:${shop.phone}`}>
                <img src="/icons/icon-phone.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                โทรติดต่อ
              </a>
            )}
            {shop.address && (
              <a className="sh-cta-btn sh-cta-ghost" href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                <img src="/icons/icon-location.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                แผนที่
              </a>
            )}
          </div>
        </div>

        {copied && <div className="sh-toast">คัดลอกลิงก์แล้ว</div>}
      </div>
    </>
  );
}
