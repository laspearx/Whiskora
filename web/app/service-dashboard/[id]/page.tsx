"use client";

import React, { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { speciesTh } from "@/lib/species";
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF', pink: '#E84677',
  orange: '#F97316', green: '#16A34A',
  blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  Chevron: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

function ServiceDashboardContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const serviceId = params.id as string;
  const fromPage = searchParams.get("from") || "profile";

  const [service, setService] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBookings: 0, pending: 0, today: 0, revenue: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push(`/login?redirect=${encodeURIComponent(`/service-dashboard/${serviceId}`)}`);
        const { data: serviceData } = await supabase.from("services").select("*").eq("id", serviceId).single();
        if (!serviceData) return router.push("/partner");
        setService(serviceData);
        const today = new Date().toISOString().split("T")[0];
        const { data: bookingsData } = await supabase.from("service_bookings").select("*, pets(name, species)").eq("service_id", serviceId).order("booking_date", { ascending: true });
        if (bookingsData) {
          setBookings(bookingsData);
          setStats({
            totalBookings: bookingsData.length,
            pending: bookingsData.filter((b) => b.status === "pending").length,
            today: bookingsData.filter((b) => b.booking_date === today).length,
            revenue: 0,
          });
        }
      } catch (error) { console.error("Error:", error); }
      finally { setLoading(false); }
    };
    if (serviceId) fetchData();
  }, [serviceId, router]);

  const stat = [
    { label: 'คิววันนี้', value: stats.today, unit: 'นัด', color: F.blue, icon: '📅' },
    { label: 'รออนุมัติ', value: stats.pending, unit: 'รายการ', color: F.orange, icon: '⏳' },
    { label: 'การจองทั้งหมด', value: stats.totalBookings, unit: 'ครั้ง', color: F.ink, icon: '📝' },
    { label: 'รายได้สะสม', value: 0, unit: 'บาท', color: F.green, icon: '💰' },
  ];
  const tools = [
    { href: `/service-dashboard/${serviceId}/manage-services?from=${fromPage}`, icon: '/icons/icon-vet-care.png', title: 'รายการบริการ', desc: 'ตั้งราคาและประเภทบริการ' },
    { href: `/service-dashboard/${serviceId}/finance?from=${fromPage}`, icon: '/icons/icon-wallet.png', title: 'สรุปรายได้', desc: 'รายงานรายได้งานบริการ' },
    { href: `/service-dashboard/${serviceId}/settings?from=${fromPage}`, icon: '/icons/icon-setting.png', title: 'ข้อมูลสถานบริการ', desc: 'ที่อยู่และเวลาเปิด-ปิด' },
  ];
  const statusLabel = (s: string) => s === 'confirmed' ? 'ยืนยันแล้ว' : s === 'pending' ? 'รอดำเนินการ' : 'เสร็จสิ้น';
  const statusClass = (s: string) => s === 'confirmed' ? 'ok' : s === 'pending' ? 'pending' : 'done';

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .svd-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .svd-body { max-width: 960px; margin: 0 auto; padding: 24px 20px 80px; }
        .svd-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 22px; }
        .svd-top-left { display: flex; align-items: center; gap: 14px; }
        .svd-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .svd-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .svd-title { font-family: inherit; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.3px; }
        .svd-sub { font-size: 12px; font-weight: 700; color: ${F.blue}; margin-top: 2px; }
        .svd-add { display: inline-flex; align-items: center; gap: 6px; background: ${F.blue}; color: white; padding: 11px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 14px rgba(37,99,235,0.25); transition: all .15s; white-space: nowrap; }
        .svd-add:hover { background: #1D4FD7; }
        .svd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
        .svd-stat { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 18px; position: relative; overflow: hidden; }
        .svd-stat-icon { position: absolute; right: -4px; top: -4px; font-size: 38px; opacity: 0.1; }
        .svd-stat-label { font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .svd-stat-value { font-family: inherit; font-size: 24px; font-weight: 700; }
        .svd-stat-unit { font-size: 10px; font-weight: 600; color: ${F.muted}; margin-left: 3px; }
        .svd-cols { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .svd-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 2px; }
        .svd-sec-title { font-family: inherit; font-size: 17px; font-weight: 700; color: ${F.ink}; }
        .svd-sec-link { font-size: 12px; font-weight: 700; color: ${F.blue}; text-decoration: none; }
        .svd-table-wrap { background: white; border: 1px solid ${F.line}; border-radius: 18px; overflow: hidden; }
        .svd-empty { padding: 44px; text-align: center; color: ${F.muted}; font-size: 14px; font-weight: 600; }
        .svd-empty-emoji { font-size: 36px; display: block; margin-bottom: 8px; }
        .svd-table { width: 100%; border-collapse: collapse; }
        .svd-table th { padding: 13px 16px; text-align: left; font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.05em; background: #FAFAFA; border-bottom: 1px solid ${F.line}; }
        .svd-table td { padding: 13px 16px; border-bottom: 1px solid ${F.line}; }
        .svd-table tr:last-child td { border-bottom: none; }
        .svd-pet-name { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; }
        .svd-pet-species { font-size: 10px; color: ${F.muted}; }
        .svd-svc { font-size: 13px; font-weight: 700; color: ${F.ink}; }
        .svd-time { font-size: 10px; font-weight: 700; color: ${F.blue}; }
        .svd-status { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
        .svd-status.ok { background: #F0FDF4; color: ${F.green}; }
        .svd-status.pending { background: #FFF7ED; color: ${F.orange}; }
        .svd-status.done { background: ${F.line}; color: ${F.muted}; }
        .svd-manage { font-size: 11px; font-weight: 700; color: ${F.blue}; background: none; border: none; cursor: pointer; }
        .svd-tools { display: flex; flex-direction: column; gap: 12px; }
        .svd-tool { display: flex; align-items: center; gap: 13px; background: white; border: 1px solid ${F.line}; border-radius: 16px; padding: 16px; text-decoration: none; transition: all .15s; }
        .svd-tool:hover { border-color: ${F.blueBorder}; }
        .svd-tool-icon { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .svd-tool-icon img { width: 38px; height: 38px; object-fit: contain; }
        .svd-tool-title { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .svd-tool-desc { font-size: 11px; font-weight: 500; color: ${F.muted}; margin-top: 1px; }
        @media (max-width: 720px) { .svd-stats { grid-template-columns: 1fr 1fr; } .svd-cols { grid-template-columns: 1fr; } }
      `}</style>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="svd-page">
          <div className="svd-body">
            <div className="svd-top">
              <div className="svd-top-left">
                <button className="svd-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
                <div>
                  <h1 className="svd-title">{service?.service_name}</h1>
                  <p className="svd-sub">แดชบอร์ดจัดการบริการ</p>
                </div>
              </div>
              <Link href={`/service-dashboard/${serviceId}/manage-services?from=${fromPage}`} className="svd-add"><Icon.Plus /> จัดการบริการ</Link>
            </div>

            <div className="svd-stats">
              {stat.map((s, i) => (
                <div key={i} className="svd-stat">
                  <div className="svd-stat-icon">{s.icon}</div>
                  <div className="svd-stat-label">{s.label}</div>
                  <div><span className="svd-stat-value" style={{ color: s.color }}>{s.value}</span><span className="svd-stat-unit">{s.unit}</span></div>
                </div>
              ))}
            </div>

            <div className="svd-cols">
              <div>
                <div className="svd-sec-head">
                  <h2 className="svd-sec-title">🗓️ รายการนัดหมายล่าสุด</h2>
                  <Link href={`/service-dashboard/${serviceId}/bookings?from=${fromPage}`} className="svd-sec-link">ดูทั้งหมด →</Link>
                </div>
                <div className="svd-table-wrap">
                  {bookings.length === 0 ? (
                    <div className="svd-empty"><span className="svd-empty-emoji">🎈</span>ยังไม่มีการจองในขณะนี้</div>
                  ) : (
                    <table className="svd-table">
                      <thead><tr><th>สัตว์เลี้ยง</th><th>บริการ/เวลา</th><th>สถานะ</th><th></th></tr></thead>
                      <tbody>
                        {bookings.slice(0, 5).map((booking) => (
                          <tr key={booking.id}>
                            <td>
                              <div className="svd-pet-name">{booking.pets?.name}</div>
                              <div className="svd-pet-species">{speciesTh(booking.pets?.species)}</div>
                            </td>
                            <td>
                              <div className="svd-svc">{booking.service_type}</div>
                              <div className="svd-time">{booking.booking_time} น.</div>
                            </td>
                            <td><span className={`svd-status ${statusClass(booking.status)}`}>{statusLabel(booking.status)}</span></td>
                            <td style={{ textAlign: 'right' }}><button className="svd-manage">จัดการ</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div>
                <div className="svd-sec-head"><h2 className="svd-sec-title">🛠️ ตั้งค่าบริการ</h2></div>
                <div className="svd-tools">
                  {tools.map((t, i) => (
                    <Link key={i} href={t.href} className="svd-tool">
                      <div className="svd-tool-icon"><img src={t.icon} alt="" /></div>
                      <div style={{ flex: 1 }}>
                        <div className="svd-tool-title">{t.title}</div>
                        <div className="svd-tool-desc">{t.desc}</div>
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

export default function ServiceDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ServiceDashboardContent />
    </Suspense>
  );
}