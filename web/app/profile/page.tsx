"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [myFarms, setMyFarms] = useState<any[]>([]);
  const [myShops, setMyShops] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);

  // 🗓️ 🌟 ประกาศตัวแปรคำนวณปฏิทินไว้ที่นี่ (เพื่อแก้ Error)
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  let firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  // ปรับให้วันจันทร์เป็นวันแรกของสัปดาห์ (0=จันทร์, 6=อาทิตย์)
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
          const petIds = petsRes.data.map((p: any) => p.id);
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

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-pink-500 font-bold animate-pulse">🐾 WHISKORA...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-12 pb-20 animate-in fade-in duration-700 space-y-8">
      
      {/* 👤 Profile Header */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-pink-50 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 opacity-40"></div>
        <div className="w-24 h-24 bg-gray-50 rounded-full overflow-hidden flex items-center justify-center text-5xl shadow-inner border-4 border-white shrink-0 relative z-10">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : "👤"}
        </div>
        <div className="flex-1 text-center md:text-left relative z-10">
          <h1 className="text-2xl font-black text-gray-800 leading-tight mb-1">
            {profile?.username || profile?.full_name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-gray-400 text-sm mb-4">{user?.email}</p>
          <Link href="/profile/edit" className="inline-block text-xs font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-full hover:bg-gray-100 transition border border-gray-100">
            แก้ไขโปรไฟล์ ✎
          </Link>
          <Link 
          href="/pets/vaccines/bulk-add" 
          className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-3 bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-100 font-bold rounded-xl transition-all shadow-sm text-sm"
          >
          <span className="text-lg">💉</span> เพิ่มวัคซีนแบบกลุ่ม
          </Link>
        </div>
      </section>

      {/* 📊 Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <Link href="/profile/pets" className="block transform transition hover:scale-[1.03] active:scale-95">
          <StatCard label="สัตว์เลี้ยง" value={pets.length.toString()} color="text-pink-500" />
        </Link>
        <StatCard label="สนใจ" value="0" />
        <StatCard label="การจอง" value="0" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* 📅 ปฏิทินนัดหมาย (แก้ไขลอจิกอิโมจิและลิงก์กลับมาให้ครบ) */}
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 h-full">
          <div className="flex justify-between items-center mb-6 px-1">
            <h3 className="font-black text-gray-800 text-sm md:text-base flex items-center gap-2"><span>📅</span> ปฏิทินนัดหมาย</h3>
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="p-1.5 text-gray-400 hover:text-pink-500 transition active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="text-[10px] font-bold text-pink-500 bg-pink-50 px-3 py-1.5 rounded-full text-center min-w-[100px] select-none">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
              </div>
              <button onClick={handleNextMonth} className="p-1.5 text-gray-400 hover:text-pink-500 transition active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 text-center gap-1">
            {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map(d => <div key={d} className="text-[10px] font-bold text-gray-300 mb-2">{d}</div>)}
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
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl text-[11px] font-bold relative transition-all ${
                    isToday ? 'bg-pink-500 text-white shadow-lg shadow-pink-100 z-10' : 
                    hasAppt ? (isPast ? 'bg-gray-100 text-gray-400' : 'bg-pink-50 hover:bg-pink-100 text-gray-800') : 
                    'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={isPast && hasAppt ? "line-through opacity-50" : ""}>{day}</span>
                  {hasAppt && (
                    <div className={`flex gap-0.5 mt-0.5 ${isPast ? 'grayscale opacity-50' : ''}`}>
                      {dayAppts.slice(0, 2).map((appt, idx) => {
                        let emoji = '💉';
                        if (appt.vaccine_name.includes('เห็บ') || appt.vaccine_name.includes('หยด')) emoji = '💧';
                        else if (appt.vaccine_name.includes('พยาธิ')) emoji = '💊';
                        return <span key={idx} className="text-[9px]">{emoji}</span>;
                      })}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* 🏢 จัดการธุรกิจ */}
<section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-40"></div>
  <h3 className="font-black text-gray-800 text-sm mb-4 relative z-10 flex items-center gap-2"><span>🤝</span> จัดการธุรกิจ</h3>
  <div className="space-y-2 relative z-10">
    
    {/* 🌟 แก้ไข: เติม ?from=profile ต่อท้ายทุกลิงก์ */}
    {myFarms.map(f => (
      <BusinessLink key={f.id} href={`/farm-dashboard/${f.id}?from=profile`} label={`ฟาร์ม : ${f.farm_name}`} icon="🏡" theme="pink" />
    ))}
    
    {myShops.map(s => (
      <BusinessLink key={s.id} href={`/shop-dashboard/${s.id}?from=profile`} label={`ร้านค้า : ${s.shop_name}`} icon="🛍️" theme="teal" />
    ))}
    
    {myServices.map(v => (
      <BusinessLink key={v.id} href={`/service-dashboard/${v.id}?from=profile`} label={`บริการ : ${v.service_name}`} icon="🏥" theme="blue" />
    ))}

    {(myFarms.length === 0 && myShops.length === 0 && myServices.length === 0) && (
      <Link href="/partner" className="block p-8 border-2 border-dashed border-gray-100 rounded-[1.5rem] text-center text-xs font-bold text-gray-400 hover:border-pink-200 transition">+ สมัครเป็นพาร์ทเนอร์</Link>
    )}
  </div>
</section>

      </div>

      {/* 💸 บัญชีสัตว์เลี้ยง */}
      <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full opacity-50"></div>
        <div className="flex justify-between items-center mb-4 relative z-10">
          <h3 className="font-black text-gray-800 text-sm flex items-center gap-2"><span>💸</span> บัญชีสัตว์เลี้ยง</h3>
          <Link href="/profile/finance" className="text-xs font-bold text-green-500 bg-green-50 px-3 py-1.5 rounded-full">จัดการบัญชี ➔</Link>
        </div>
        <Link href="/profile/finance" className="bg-gradient-to-r from-emerald-400 to-teal-500 p-6 rounded-[1.5rem] text-white shadow-lg shadow-green-100 hover:scale-[1.01] transition flex items-center justify-between group relative z-10">
          <div>
            <h3 className="text-lg font-black mb-1">บันทึกรายรับ-รายจ่าย 📝</h3>
            <p className="text-[10px] font-medium opacity-90">ติดตามค่าอาหาร ค่ารักษา และต้นทุนฟาร์ม</p>
          </div>
          <div className="text-3xl bg-white/20 w-14 h-14 flex items-center justify-center rounded-2xl group-hover:rotate-12 transition">🧾</div>
        </Link>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <QuickLink icon="❤️" title="Wishlist" href="/wishlist" />
        <QuickLink icon="🛒" title="ออเดอร์" href="/history" />
      </div>

    </div>
  );
}

// Helper Components
function StatCard({ label, value, color = "text-gray-800" }: { label: string, value: string, color?: string }) {
  return (
    <div className="bg-white py-6 rounded-[2rem] border border-gray-100 text-center shadow-sm transition-all bg-gradient-to-b from-white to-gray-50/30">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function BusinessLink({ href, label, icon, theme }: { href: string, label: string, icon: string, theme: string }) {
  const styles: any = {
    pink: "bg-pink-50 text-pink-500 border-pink-100 hover:bg-pink-100",
    teal: "bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100",
    blue: "bg-blue-50 text-blue-500 border-blue-100 hover:bg-blue-100"
  };
  return (
    <Link href={href} className={`flex items-center gap-3 p-4 rounded-2xl border transition font-bold text-xs ${styles[theme]}`}>
      <span className="text-xl">{icon}</span>
      <span className="truncate flex-1">{label}</span>
      <span className="opacity-40">➔</span>
    </Link>
  );
}

function QuickLink({ icon, title, href }: { icon: string, title: string, href: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-pink-200 transition shadow-sm group">
      <span className="text-2xl group-hover:scale-110 transition">{icon}</span>
      <p className="text-sm font-bold text-gray-800">{title}</p>
    </Link>
  );
}