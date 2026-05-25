"use client";

import React, { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF', pink: '#E84677',
  orange: '#F97316', red: '#EF4444', green: '#16A34A',
  teal: '#0D9488', tealSoft: '#F0FDFA', tealBorder: '#99F6E4',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  Edit: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>,
  Chevron: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

function ShopDashboardContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const shopId = params.id as string;
  const fromPage = searchParams.get("from") || "profile";

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalItems: 0, lowStock: 0, outOfStock: 0, totalSales: 0 });

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push(`/login?redirect=${encodeURIComponent(`/shop-dashboard/${shopId}`)}`);
        const { data: shopData } = await supabase.from("shops").select("*").eq("id", shopId).single();
        if (!shopData) return router.push("/partner");
        setShop(shopData);
        const { data: productsData } = await supabase.from("products").select("*").eq("shop_id", shopId);
        if (productsData) {
          setProducts(productsData);
          setStats({
            totalItems: productsData.length,
            lowStock: productsData.filter((p) => p.stock > 0 && p.stock <= 5).length,
            outOfStock: productsData.filter((p) => p.stock === 0).length,
            totalSales: 0,
          });
        }
      } catch (error) { console.error("Error:", error); }
      finally { setLoading(false); }
    };
    if (shopId) fetchShopData();
  }, [shopId, router]);

  const stat = [
    { label: 'สินค้าทั้งหมด', value: stats.totalItems, unit: 'รายการ', color: F.ink, icon: '📦' },
    { label: 'สต็อกใกล้หมด', value: stats.lowStock, unit: 'รายการ', color: F.orange, icon: '⚠️' },
    { label: 'สินค้าหมด', value: stats.outOfStock, unit: 'รายการ', color: F.red, icon: '🚫' },
    { label: 'ยอดขายเดือนนี้', value: 0, unit: 'บาท', color: F.teal, icon: '💰' },
  ];
  const tools = [
    { href: `/shop-dashboard/${shopId}/orders?from=${fromPage}`, icon: '📜', title: 'รายการคำสั่งซื้อ', desc: 'จัดการออเดอร์จากลูกค้า' },
    { href: `/shop-dashboard/${shopId}/finance?from=${fromPage}`, icon: '💸', title: 'บัญชีร้านค้า', desc: 'สรุปรายรับ-รายจ่ายร้าน' },
    { href: `/shop-dashboard/${shopId}/edit?from=${fromPage}`, icon: '⚙️', title: 'ตั้งค่าหน้าร้าน', desc: 'ข้อมูลติดต่อและเวลาเปิด-ปิด' },
  ];

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .sd-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .sd-body { max-width: 960px; margin: 0 auto; padding: 24px 20px 80px; }
        .sd-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 22px; }
        .sd-top-left { display: flex; align-items: center; gap: 14px; }
        .sd-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.tealBorder}; box-shadow: 0 2px 8px rgba(13,148,136,0.1); transition: all .18s ease; flex-shrink: 0; }
        .sd-back:hover { color: ${F.teal}; border-color: ${F.teal}; transform: translateX(-1px); }
        .sd-title { font-family: inherit; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.3px; }
        .sd-sub { font-size: 12px; font-weight: 700; color: ${F.teal}; margin-top: 2px; }
        .sd-add { display: inline-flex; align-items: center; gap: 6px; background: ${F.teal}; color: white; padding: 11px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 14px rgba(13,148,136,0.25); transition: all .15s; white-space: nowrap; }
        .sd-add:hover { background: #0B7E74; }
        .sd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
        .sd-stat { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 18px; position: relative; overflow: hidden; }
        .sd-stat-icon { position: absolute; right: -4px; top: -4px; font-size: 38px; opacity: 0.1; }
        .sd-stat-label { font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .sd-stat-value { font-family: inherit; font-size: 24px; font-weight: 700; }
        .sd-stat-unit { font-size: 10px; font-weight: 600; color: ${F.muted}; margin-left: 3px; }
        .sd-cols { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .sd-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 2px; }
        .sd-sec-title { font-family: inherit; font-size: 17px; font-weight: 700; color: ${F.ink}; }
        .sd-sec-link { font-size: 12px; font-weight: 700; color: ${F.teal}; text-decoration: none; }
        .sd-table-wrap { background: white; border: 1px solid ${F.line}; border-radius: 18px; overflow: hidden; }
        .sd-empty { padding: 40px; text-align: center; color: ${F.muted}; font-size: 14px; font-weight: 600; }
        .sd-table { width: 100%; border-collapse: collapse; }
        .sd-table th { padding: 13px 16px; text-align: left; font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.05em; background: #FAFAFA; border-bottom: 1px solid ${F.line}; }
        .sd-table td { padding: 13px 16px; border-bottom: 1px solid ${F.line}; }
        .sd-table tr:last-child td { border-bottom: none; }
        .sd-prod { display: flex; align-items: center; gap: 10px; }
        .sd-prod-img { width: 38px; height: 38px; border-radius: 9px; overflow: hidden; background: ${F.tealSoft}; border: 1px solid ${F.line}; flex-shrink: 0; }
        .sd-prod-img img { width: 100%; height: 100%; object-fit: cover; }
        .sd-prod-name { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sd-price { font-family: inherit; font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .sd-stock { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
        .sd-stock.low { background: #FEF2F2; color: ${F.red}; }
        .sd-stock.ok { background: #F0FDF4; color: ${F.green}; }
        .sd-edit { color: ${F.muted}; display: inline-flex; transition: color .15s; }
        .sd-edit:hover { color: ${F.teal}; }
        .sd-tools { display: flex; flex-direction: column; gap: 12px; }
        .sd-tool { display: flex; align-items: center; gap: 13px; background: white; border: 1px solid ${F.line}; border-radius: 16px; padding: 16px; text-decoration: none; transition: all .15s; }
        .sd-tool:hover { border-color: ${F.tealBorder}; }
        .sd-tool-icon { width: 44px; height: 44px; border-radius: 13px; background: ${F.tealSoft}; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .sd-tool-title { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .sd-tool-desc { font-size: 11px; font-weight: 500; color: ${F.muted}; margin-top: 1px; }
        .sd-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .sd-spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${F.tealBorder}; border-top-color: ${F.teal}; animation: sdspin 1s linear infinite; }
        @keyframes sdspin { to { transform: rotate(360deg); } }
        @media (max-width: 720px) { .sd-stats { grid-template-columns: 1fr 1fr; } .sd-cols { grid-template-columns: 1fr; } }
      `}</style>

      {loading ? (
        <div className="sd-loading">
          <div className="sd-spinner" />
          <p style={{ fontSize: 13, fontWeight: 700, color: F.muted }}>กำลังเปิดร้านค้า...</p>
        </div>
      ) : (
        <div className="sd-page">
          <div className="sd-body">
            <div className="sd-top">
              <div className="sd-top-left">
                <button className="sd-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
                <div>
                  <h1 className="sd-title">{shop?.shop_name}</h1>
                  <p className="sd-sub">แดชบอร์ดจัดการร้านค้า</p>
                </div>
              </div>
              <Link href={`/shop-dashboard/${shopId}/products/create?from=${fromPage}`} className="sd-add"><Icon.Plus /> เพิ่มสินค้า</Link>
            </div>

            <div className="sd-stats">
              {stat.map((s, i) => (
                <div key={i} className="sd-stat">
                  <div className="sd-stat-icon">{s.icon}</div>
                  <div className="sd-stat-label">{s.label}</div>
                  <div><span className="sd-stat-value" style={{ color: s.color }}>{s.value}</span><span className="sd-stat-unit">{s.unit}</span></div>
                </div>
              ))}
            </div>

            <div className="sd-cols">
              <div>
                <div className="sd-sec-head">
                  <h2 className="sd-sec-title">📦 คลังสินค้าล่าสุด</h2>
                  <Link href={`/shop-dashboard/${shopId}/products?from=${fromPage}`} className="sd-sec-link">ดูทั้งหมด →</Link>
                </div>
                <div className="sd-table-wrap">
                  {products.length === 0 ? (
                    <div className="sd-empty">ยังไม่มีสินค้าในร้าน</div>
                  ) : (
                    <table className="sd-table">
                      <thead><tr><th>สินค้า</th><th>ราคา</th><th>คงเหลือ</th><th></th></tr></thead>
                      <tbody>
                        {products.slice(0, 5).map((product) => (
                          <tr key={product.id}>
                            <td>
                              <div className="sd-prod">
                                <div className="sd-prod-img">{product.image_url && <img src={product.image_url} alt={product.name} />}</div>
                                <span className="sd-prod-name">{product.name}</span>
                              </div>
                            </td>
                            <td><span className="sd-price">฿{Number(product.price).toLocaleString()}</span></td>
                            <td><span className={`sd-stock ${product.stock <= 5 ? 'low' : 'ok'}`}>{product.stock} ชิ้น</span></td>
                            <td style={{ textAlign: 'right' }}>
                              <Link href={`/shop-dashboard/${shopId}/products/${product.id}/edit?from=${fromPage}`} className="sd-edit"><Icon.Edit /></Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div>
                <div className="sd-sec-head"><h2 className="sd-sec-title">🛠️ เครื่องมือ</h2></div>
                <div className="sd-tools">
                  {tools.map((t, i) => (
                    <Link key={i} href={t.href} className="sd-tool">
                      <div className="sd-tool-icon">{t.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="sd-tool-title">{t.title}</div>
                        <div className="sd-tool-desc">{t.desc}</div>
                      </div>
                      <span style={{ color: F.muted, display: 'flex' }}><Icon.Chevron /></span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ShopDashboardPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #99F6E4', borderTopColor: '#0D9488', animation: 'sdspin 1s linear infinite' }} /></div>}>
      <ShopDashboardContent />
    </Suspense>
  );
}