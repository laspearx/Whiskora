"use client";

import React, { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

function ServiceDashboardContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const serviceId = params.id as string;
  const fromPage = searchParams.get("from") || "profile";

  const [service, setService] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pending: 0,
    today: 0,
    revenue: 0
  });

  const handleBackToParent = () => {
    router.push(fromPage === 'partner' ? '/partner' : '/profile');
  };

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        // 1. ดึงข้อมูลสถานบริการ
        const { data: serviceData } = await supabase
          .from("services")
          .select("*")
          .eq("id", serviceId)
          .single();
        
        if (!serviceData) return router.push("/partner");
        setService(serviceData);

        // 2. ดึงข้อมูลการจอง (สมมติว่าใช้ตาราง service_bookings)
        const { data: bookingsData } = await supabase
          .from("service_bookings")
          .select("*, pets(name, species)")
          .eq("service_id", serviceId)
          .order("booking_date", { ascending: true });

        if (bookingsData) {
          setBookings(bookingsData);
          const today = new Date().toISOString().split('T')[0];
          setStats({
            totalBookings: bookingsData.length,
            pending: bookingsData.filter(b => b.status === "pending").length,
            today: bookingsData.filter(b => b.booking_date === today).length,
            revenue: 0 // รอเชื่อมระบบชำระเงินในอนาคต
          });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) fetchServiceData();
  }, [serviceId, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-500 font-bold animate-pulse">กำลังโหลด...⏳</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 md:pt-10 pb-20 animate-in fade-in duration-700 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleBackToParent} className="p-2.5 bg-white hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition shadow-sm border border-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">{service?.service_name}</h1>
            <p className="text-xs font-bold text-blue-500 mt-0.5">แดชบอร์ดจัดการงานบริการ</p>
          </div>
        </div>
        <Link href={`/service-dashboard/${serviceId}/manage-services?from=${fromPage}`} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition">
          + เพิ่มบริการ
        </Link>
      </div>

      {/* 📊 Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="คิววันนี้" value={stats.today} unit="นัด" color="text-blue-600" icon="📅" />
        <StatCard label="รออนุมัติ" value={stats.pending} unit="รายการ" color="text-orange-500" icon="⏳" />
        <StatCard label="การจองทั้งหมด" value={stats.totalBookings} unit="ครั้ง" color="text-gray-800" icon="📝" />
        <StatCard label="รายได้สะสม" value="0" unit="บาท" color="text-green-600" icon="💰" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 📅 ตารางนัดหมาย (Booking List) */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><span>🗓️</span> รายการนัดหมายล่าสุด</h2>
            <Link href={`/service-dashboard/${serviceId}/bookings?from=${fromPage}`} className="text-xs font-bold text-blue-600">ดูตารางทั้งหมด ➔</Link>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            {bookings.length === 0 ? (
              <div className="p-16 text-center text-gray-400 font-bold">
                <p className="text-4xl mb-2">🎈</p>
                ยังไม่มีการจองในขณะนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">สัตว์เลี้ยง</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">บริการ/เวลา</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">สถานะ</th>
                      <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700">{booking.pets?.name}</span>
                            <span className="text-[10px] text-gray-400">{booking.pets?.species}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-800">{booking.service_type}</span>
                            <span className="text-[10px] text-blue-500 font-bold">{booking.booking_time} น.</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-50 text-green-600' : 
                            booking.status === 'pending' ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-400'
                          }`}>
                            {booking.status === 'confirmed' ? 'ยืนยันแล้ว' : booking.status === 'pending' ? 'รอดำเนินการ' : 'เสร็จสิ้น'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="text-[11px] font-bold text-blue-500 hover:underline">จัดการ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 🛠️ เครื่องมือจัดการ (Service Tools) */}
        <div className="md:col-span-4 space-y-4">
          <h2 className="text-lg font-black text-gray-800 px-2">🛠️ ตั้งค่าบริการ</h2>
          <div className="grid grid-cols-1 gap-3">
            <ToolLink href={`/service-dashboard/${serviceId}/manage-services?from=${fromPage}`} icon="✂️" title="รายการบริการ" desc="ตั้งราคาและประเภทบริการ" />
            <ToolLink href={`/service-dashboard/${serviceId}/finance?from=${fromPage}`} icon="📊" title="สรุปรายได้" desc="รายงานรายได้งานบริการ" />
            <ToolLink href={`/service-dashboard/${serviceId}/settings?from=${fromPage}`} icon="🏥" title="ข้อมูลสถานบริการ" desc="ที่อยู่และเวลาเปิด-ปิด" />
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
    <Link href={href} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:border-blue-200 transition-all flex items-center gap-4 group">
      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition">{icon}</div>
      <div>
        <h4 className="text-sm font-black text-gray-800">{title}</h4>
        <p className="text-[10px] font-bold text-gray-400">{desc}</p>
      </div>
    </Link>
  );
}

export default function ServiceDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-blue-500 font-bold">🏥 Loading Whiskora...</div>}>
      <ServiceDashboardContent />
    </Suspense>
  );
}