"use client";

import React, { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

function ShopDashboardContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const shopId = params.id as string;
  const fromPage = searchParams.get("from") || "profile";

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalSales: 0
  });

  const handleBackToParent = () => {
    router.push(fromPage === 'partner' ? '/partner' : '/profile');
  };

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        // 1. ดึงข้อมูลร้านค้า
        const { data: shopData } = await supabase
          .from("shops")
          .select("*")
          .eq("id", shopId)
          .single();
        
        if (!shopData) return router.push("/partner");
        setShop(shopData);

        // 2. ดึงข้อมูลสินค้าและคำนวณสถิติ
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("shop_id", shopId);

        if (productsData) {
          setProducts(productsData);
          setStats({
            totalItems: productsData.length,
            lowStock: productsData.filter(p => p.stock > 0 && p.stock <= 5).length,
            outOfStock: productsData.filter(p => p.stock === 0).length,
            totalSales: 0 // ส่วนนี้รอเชื่อมกับตาราง Orders ในอนาคต
          });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (shopId) fetchShopData();
  }, [shopId, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-teal-500 font-bold animate-pulse">กำลังเปิดร้านค้า... 🛍️</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 md:pt-10 pb-20 animate-in fade-in duration-700 space-y-8">
      
      {/* 🏪 Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleBackToParent} className="p-2.5 bg-white hover:bg-teal-50 text-gray-400 hover:text-teal-600 rounded-xl transition shadow-sm border border-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">{shop?.shop_name}</h1>
            <p className="text-xs font-bold text-teal-500 mt-0.5">แดชบอร์ดจัดการร้านค้า</p>
          </div>
        </div>
        <Link href={`/shop-dashboard/${shopId}/products/create?from=${fromPage}`} className="bg-teal-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-teal-100 hover:bg-teal-600 transition">
          + เพิ่มสินค้าใหม่
        </Link>
      </div>

      {/* 📊 Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="สินค้าทั้งหมด" value={stats.totalItems} unit="รายการ" color="text-gray-800" icon="📦" />
        <StatCard label="สต็อกใกล้หมด" value={stats.lowStock} unit="รายการ" color="text-orange-500" icon="⚠️" />
        <StatCard label="สินค้าหมด" value={stats.outOfStock} unit="รายการ" color="text-red-500" icon="🚫" />
        <StatCard label="ยอดขายเดือนนี้" value="0" unit="บาท" color="text-teal-600" icon="💰" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 📦 ตารางสินค้าด่วน (Inventory Preview) */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><span>📦</span> คลังสินค้าล่าสุด</h2>
            <Link href={`/shop-dashboard/${shopId}/products?from=${fromPage}`} className="text-xs font-bold text-teal-600">ดูทั้งหมด ➔</Link>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            {products.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-bold">ยังไม่มีสินค้าในร้าน</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">สินค้า</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">ราคา</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">คงเหลือ</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.slice(0, 5).map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-50 rounded-lg overflow-hidden border border-gray-100">
                              {product.image_url && <img src={product.image_url} className="w-full h-full object-cover" />}
                            </div>
                            <span className="text-sm font-bold text-gray-700 truncate max-w-[150px]">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-gray-800">฿{product.price.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                            product.stock <= 5 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                          }`}>
                            {product.stock} ชิ้น
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/shop-dashboard/${shopId}/products/${product.id}/edit?from=${fromPage}`} className="text-gray-300 hover:text-teal-500 transition">✎</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 🛠️ ทางลัดจัดการร้าน (Quick Tools) */}
        <div className="md:col-span-4 space-y-4">
          <h2 className="text-lg font-black text-gray-800 px-2">🛠️ เครื่องมือจัดการ</h2>
          <div className="grid grid-cols-1 gap-3">
            <ToolLink href={`/shop-dashboard/${shopId}/orders?from=${fromPage}`} icon="📜" title="รายการคำสั่งซื้อ" desc="จัดการออเดอร์จากลูกค้า" />
            <ToolLink href={`/shop-dashboard/${shopId}/finance?from=${fromPage}`} icon="💸" title="บัญชีร้านค้า" desc="สรุปรายรับ-รายจ่ายร้าน" />
            <ToolLink href={`/shop-dashboard/${shopId}/edit?from=${fromPage}`} icon="⚙️" title="ตั้งค่าหน้าร้าน" desc="ข้อมูลติดต่อและเวลาเปิด-ปิด" />
          </div>
        </div>
      </div>

    </div>
  );
}

// Helper Components
function StatCard({ label, value, unit, color, icon }: any) {
  return (
    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-2 -top-2 text-4xl opacity-10 group-hover:scale-125 transition-transform">{icon}</div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-black ${color}`}>{value}</span>
        <span className="text-[10px] font-bold text-gray-400">{unit}</span>
      </div>
    </div>
  );
}

function ToolLink({ href, icon, title, desc }: any) {
  return (
    <Link href={href} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:border-teal-200 transition-all flex items-center gap-4 group">
      <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition">{icon}</div>
      <div>
        <h4 className="text-sm font-black text-gray-800">{title}</h4>
        <p className="text-[10px] font-bold text-gray-400">{desc}</p>
      </div>
    </Link>
  );
}

export default function ShopDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopDashboardContent />
    </Suspense>
  );
}