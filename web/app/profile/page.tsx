"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827',      // Gray-900 (เข้ม สุขุม)
  inkSoft: '#4B5563',  // Gray-600
  muted: '#9CA3AF',    // Gray-400
  pink: '#E84677',     // Brand Primary
  pinkSoft: '#FDF2F5', // Very light pink for subtle backgrounds
  line: '#E5E7EB',     // Gray-200 for crisp borders
  paper: '#FFFFFF',
};

// ─── Elegant Minimal Icons (แทนที่ Emojis) ──────────────────────────────────
const Icon = {
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Paw: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5z"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Syringe: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>,
  Wallet: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h4"/><path d="M16 16h4"/><path d="M16 8h.01"/></svg>,
  Business: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Building: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  Shop: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Stethoscope: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>,
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [profile, setProfile] = useState<import('@/lib/types').UserProfile | null>(null);
  const [pets, setPets] = useState<import('@/lib/types').Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const [myFarms, setMyFarms] = useState<import('@/lib/types').Farm[]>([]);
  const [myShops, setMyShops] = useState<import('@/lib/types').Shop[]>([]);
  const [myServices, setMyServices] = useState<import('@/lib/types').Service[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<{ next_due: string; vaccine_name: string; pet_id: string }[]>([]);

  // 🗓️ 🌟 ประกาศตัวแปรคำนวณปฏิทิน
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  let firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");
        setUser(session.user);
        const uid = session.user.id;

        const [profileRes, farmRes, shopRes, serviceRes, petsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          supabase.from("farms").select("*").eq("user_id", uid),
          supabase.from("shops").select("*").eq("user_id", uid),
          supabase.from("services").select("*").eq("user_id", uid),
          supabase.from("pets").select("*").eq("user_id", uid)
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        if (farmRes.data) setMyFarms(farmRes.data);
        if (shopRes.data) setMyShops(shopRes.data);
        if (serviceRes.data) setMyServices(serviceRes.data);
        if (petsRes.data) setPets(petsRes.data);

        if (petsRes.data && petsRes.data.length > 0) {
          const petIds = petsRes.data.map((p) => p.id);
          const { data: vacData } = await supabase
            .from("vaccines")
            .select("next_due, vaccine_name, pet_id") 
            .in("pet_id", petIds)
            .not("next_due", "is", null);
          if (vacData) setAppointments(vacData);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [router]);

  if (loading) return (
    <div className="min-h-[50vh] flex items-center justify-center text-sm font-semibold tracking-widest text-gray-400 animate-pulse uppercase">
      Loading Profile...
    </div>
  );

  const isPartner = myFarms.length > 0 || myShops.length > 0 || myServices.length > 0;

  return (
    <>
      <style>{`
        /* Premium subtle transitions */
        .premium-card {
          background: #ffffff;
          border: 1px solid ${F.line};
          border-radius: 1.25rem; /* rounded-2xl (Less bubbly) */
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          transition: all 0.2s ease-in-out;
        }
        .premium-card:hover {
          border-color: #D1D5DB;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }
        .premium-btn {
          transition: all 0.15s ease;
        }
        .premium-btn:active {
          transform: scale(0.98);
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-12 pb-24 animate-in fade-in duration-500 space-y-6" style={{ color: F.ink, fontFamily: 'var(--font-ui)' }}>
        
        {/* 👤 1. Sleek Profile Header */}
        <section className="premium-card p-6 md:p-8 flex flex-col md:flex-row items-center md:items-center gap-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl shadow-sm border border-gray-100 bg-gray-50 shrink-0 text-gray-300">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <Icon.User />}
          </div>
          
          <div className="flex-1 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 mb-0.5">
                {profile?.username || profile?.full_name || user?.email?.split('@')[0]}
              </h1>
              <p className="text-sm text-gray-500 font-light">{user?.email}</p>
            </div>
            <Link 
              href="/profile/edit" 
              className="premium-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 shadow-sm"
            >
              <Icon.Edit />
              แก้ไขโปรไฟล์
            </Link>
          </div>
        </section>

        {/* ─── Grid Layout ──────────────────────────────────────────────────────── */}
        <div className={`grid grid-cols-1 gap-6 items-start ${isPartner ? 'md:grid-cols-12' : 'max-w-2xl mx-auto'}`}>
          
          {/* 📅 ฝั่งซ้าย: ข้อมูลสัตว์เลี้ยง & ปฏิทิน */}
          <div className={`space-y-6 ${isPartner ? 'md:col-span-7' : 'w-full'}`}>
            
            {/* 🌟 2. Stats & Quick Actions (Pet Management) */}
            <div className="premium-card p-1">
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                {/* Total Pets Section */}
                <Link href="/profile/pets" className="p-5 md:p-6 group flex flex-col justify-between hover:bg-gray-50/50 rounded-l-[1.25rem] transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center"><Icon.Paw /></div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">สัตว์เลี้ยง</span>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-gray-900">{pets.length}</span>
                    <span className="text-sm font-medium text-gray-500 ml-1.5">ตัว</span>
                  </div>
                </Link>

                {/* Actions Section */}
                <div className="p-5 md:p-6 flex flex-col justify-center gap-3">
                  <Link 
                    href="/pets/create" 
                    className="flex items-center justify-between group p-3 rounded-xl border border-transparent hover:border-pink-100 hover:bg-pink-50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-pink-600">เพิ่มสัตว์เลี้ยงใหม่</span>
                    <span className="text-gray-400 group-hover:text-pink-500"><Icon.ChevronRight /></span>
                  </Link>
                  {pets.length > 0 && (
                    <Link 
                      href="/pets/vaccines/bulk-add" 
                      className="flex items-center justify-between group p-3 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 group-hover:text-teal-600"><Icon.Syringe /></span>
                        <span className="text-sm font-medium text-gray-600 group-hover:text-teal-600">เพิ่มวัคซีนแบบกลุ่ม</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* 📅 3. Refined Calendar */}
            <section className="premium-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                  <span className="text-gray-400"><Icon.Calendar /></span> ปฏิทินนัดหมาย
                </h3>
                <div className="flex items-center gap-1">
                  <button onClick={handlePrevMonth} className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="text-xs font-bold text-gray-900 min-w-[100px] text-center select-none tracking-wide">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                  </div>
                  <button onClick={handleNextMonth} className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 text-center gap-y-3 gap-x-1 border-t border-gray-100 pt-4">
                {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map(d => <div key={d} className="text-[11px] font-semibold text-gray-400 mb-1">{d}</div>)}
                {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const currentCellDate = new Date(dateStr);
                  currentCellDate.setHours(0, 0, 0, 0);

                  const dayAppts = appointments.filter(a => a.next_due && a.next_due.split('T')[0] === dateStr);
                  const hasAppt = dayAppts.length > 0;
                  const isPast = currentCellDate < today;
                  const isToday = currentCellDate.getTime() === today.getTime();

                  return (
                    <Link 
                      key={day} 
                      href={hasAppt ? `/pets/vaccines/all?date=${dateStr}` : "#"}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-medium relative transition-colors ${
                        isToday ? 'bg-pink-200 text-white shadow-sm' : 
                        hasAppt ? (isPast ? 'bg-gray-50 text-gray-400' : 'bg-pink-50 text-pink-700 hover:bg-pink-100 font-bold') : 
                        'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className={isPast && hasAppt ? "line-through opacity-60" : ""}>{day}</span>
                      {/* Elegant Dots instead of Emojis */}
                      {hasAppt && (
                        <div className="flex gap-1 mt-1">
                          {dayAppts.slice(0, 3).map((_, idx) => (
                            <div key={idx} className={`w-1 h-1 rounded-full ${isPast ? 'bg-gray-300' : 'bg-pink-500'}`} />
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          {/* 🏢 ฝั่งขวา: การเงิน & ธุรกิจ */}
          <div className={`space-y-6 ${isPartner ? 'md:col-span-5' : 'w-full'}`}>
            
            {/* 💸 4. Clean Finance Card */}
            <section className="premium-card p-6 flex flex-col h-[180px] justify-between group relative overflow-hidden">
              {/* Subtle background graphic */}
              <div className="absolute -right-6 -top-6 text-gray-50 opacity-50 transform rotate-12 scale-150 pointer-events-none">
                <Icon.Wallet />
              </div>
              
              <div className="relative z-10 flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center border border-gray-100">
                  <Icon.Wallet />
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-base font-bold text-gray-900 mb-1">บัญชีสัตว์เลี้ยง</h3>
                <p className="text-xs text-gray-500 font-light mb-4">บันทึกรายรับ-รายจ่าย ค่าอาหารและรักษา</p>
                <Link 
                  href="/profile/finance" 
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors"
                >
                  จัดการบัญชี <Icon.ChevronRight />
                </Link>
              </div>
            </section>

            {/* 🤝 5. Business Management (Partner Only) */}
            {isPartner && (
              <section className="premium-card p-6">
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-base">
                  <span className="text-gray-400"><Icon.Business /></span> จัดการธุรกิจ
                </h3>
                <div className="space-y-3">
                  {myFarms.map(f => (
                    <BusinessLink key={f.id} href={`/farm-dashboard/${f.id}?from=profile`} label={`${f.farm_name}`} type="ฟาร์ม" icon={<Icon.Building />} />
                  ))}
                  {myShops.map(s => (
                    <BusinessLink key={s.id} href={`/shop-dashboard/${s.id}?from=profile`} label={`${s.shop_name}`} type="ร้านค้า" icon={<Icon.Shop />} />
                  ))}
                  {myServices.map(v => (
                    <BusinessLink key={v.id} href={`/service-dashboard/${v.id}?from=profile`} label={`${v.service_name}`} type="บริการ" icon={<Icon.Stethoscope />} />
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

// ─── Refined Helper Component ─────────────────────────────────────────────────
function BusinessLink({ href, label, type, icon }: { href: string, label: string, type: string, icon: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 transition-all group"
    >
      <span className="text-gray-400 group-hover:text-gray-900 transition-colors">{icon}</span>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-[10px] font-medium text-gray-500 border border-gray-200 px-2 py-0.5 rounded-md bg-white shrink-0">{type}</span>
        <p className="font-semibold text-sm text-gray-900 truncate">{label}</p>
      </div>
      <span className="text-gray-300 group-hover:text-gray-900 transition-colors"><Icon.ChevronRight /></span>
    </Link>
  );
}