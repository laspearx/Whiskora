"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PublicPetProfilePage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        // 1. ดึงข้อมูลสัตว์เลี้ยง (เพิ่ม vaccine_status มาด้วย)
        const { data: petData, error: petError } = await supabase
          .from("pets")
          .select("*")
          .eq("id", petId)
          .single();

        if (petError) throw petError;
        setPet(petData);

        // 2. ดึงข้อมูลฟาร์ม (ถ้ามี)
        if (petData.farm_id && petData.farm_id !== 'PERSONAL') {
          const { data: farmData } = await supabase
            .from("farms")
            .select("id, farm_name, phone, facebook_link, line_id")
            .eq("id", petData.farm_id)
            .single();
            
          if (farmData) setFarm(farmData);
        } else {
          // 3. ถ้าไม่ใช่ฟาร์ม ให้ดึงข้อมูลเจ้าของแทน
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, full_name, phone") 
            .eq("id", petData.user_id)
            .single();

          if (profileData) setProfile(profileData);
        }

      } catch (error) {
        console.error("Error loading public profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [petId]);

  // บันทึกลีด (ใครสนใจสัตว์ตัวไหน) ก่อนเด้งออกไปช่องทางภายนอก
  const logLeadAndOpen = async (channel: "phone" | "line" | "facebook", url: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("contact_leads").insert({
        pet_id: pet?.id ?? null,
        farm_id: farm?.id ?? null,
        viewer_id: session?.user?.id ?? null,
        channel,
        pet_status: pet?.status ?? null,
      });
    } catch (err) {
      // ถ้า log ไม่สำเร็จก็ไม่ควรบล็อกผู้ใช้ — ปล่อยให้ติดต่อฟาร์มได้ต่อ
      console.error("log lead failed:", err);
    }
    setShowContactModal(false);
    if (url) window.open(url, "_blank");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังโหลดข้อมูลน้อง... 🐾</div>;
  if (!pet) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">ไม่พบข้อมูลสัตว์เลี้ยง 😢</div>;

  const isFarmPet = pet.farm_id && pet.farm_id !== 'PERSONAL';
  const isReadyToMove = pet.status === 'พร้อมย้าย' || pet.status === 'พร้อมย้ายบ้าน';
  const isBreeder = pet.status === 'พ่อพันธุ์ / แม่พันธุ์' || pet.status === 'พ่อแม่พันธุ์' || pet.status === 'พ่อพันธุ์' || pet.status === 'แม่พันธุ์';

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-20 animate-in fade-in duration-700 space-y-4 min-h-screen bg-gray-50">
      
      {/* 🌟 ปุ่มย้อนกลับ */}
      <div className="relative z-10">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white shadow-sm hover:bg-pink-50 text-gray-400 hover:text-pink-500 rounded-xl transition border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      {/* 🌟 ส่วน Header (รูปภาพและชื่อ) */}
      <div className="flex flex-col items-center text-center relative pt-2">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 relative">
          {pet.image_url ? (
            <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
          )}
        </div>

        <div className="mt-3 space-y-0.5">
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center justify-center gap-2">
            {pet.name} 
            {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? (
              <span className="text-blue-500 text-lg">♂️</span>
            ) : (
              <span className="text-pink-500 text-lg">♀️</span>
            )}
          </h1>
          <p className="text-xs font-bold text-gray-500">
             {isFarmPet ? `จากฟาร์ม ${farm?.farm_name || ''} 🏡` : 'Whiskora Verified Pet ✨'}
          </p>
        </div>

        {/* ป้ายสถานะสำหรับฟาร์ม */}
        <div className="flex gap-2 mt-2">
          {isFarmPet && isReadyToMove && (
            <div className="bg-pink-100 text-pink-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              ✨ พร้อมย้ายบ้าน
            </div>
          )}
          {isFarmPet && isBreeder && (
            <div className="bg-blue-100 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              👑 พ่อแม่พันธุ์
            </div>
          )}
        </div>
      </div>

      {/* 🌟 ส่วนราคาและปุ่มติดต่อ (ย้ายมาไว้ใต้รูปเลย) */}
      {isFarmPet && isReadyToMove && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-pink-100 space-y-4">
          <div className="flex items-center justify-between bg-pink-50 p-3.5 rounded-2xl">
            <div>
              <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-0.5">ค่าตัว / สินสอด</p>
              <p className="text-[10px] text-pink-500/80 font-medium leading-tight">สนใจรับน้อง<br/>ติดต่อฟาร์มได้เลย</p>
            </div>
            <p className="text-2xl font-black text-pink-600">
              {pet.price ? `฿${pet.price.toLocaleString()}` : 'ทักแชท'}
            </p>
          </div>

          <button 
            onClick={() => setShowContactModal(true)}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-pink-200 active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            🛒 สนใจรับเลี้ยง (ติดต่อฟาร์ม)
          </button>
        </div>
      )}

      {/* ถ้าเป็นพ่อแม่พันธุ์ โชว์ข้อความนี้แทน */}
      {isFarmPet && isBreeder && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-center">
          <div className="bg-gray-50 p-3 rounded-2xl">
            <p className="text-xs font-bold text-gray-600">👑 พ่อแม่พันธุ์ประจำฟาร์ม</p>
            <p className="text-[10px] text-gray-400 mt-0.5">น้องไม่ได้เปิดสินสอดให้รับเลี้ยงครับ</p>
          </div>
        </div>
      )}

      {/* 🌟 ข้อมูลสัตว์เลี้ยง และ พันธุกรรม */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-bold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-2 text-sm">
          <span className="text-lg">📋</span> ข้อมูลส่วนตัว
        </h2>
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
          <div>
            <p className="text-[10px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider">สายพันธุ์</p>
            <p className="text-sm font-bold text-gray-800">{pet.breed || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider">
              สี <span className="block text-[8px] text-gray-300 -mt-0.5">(Color)</span>
            </p>
            <p className="text-sm font-bold text-gray-800">{pet.color || '-'}</p>
          </div>

          {/* ถ้าเป็นสัตว์ฟาร์ม และมีข้อมูลพันธุกรรม ให้แสดงต่อเลย */}
          {isFarmPet && pet.pattern && (
            <div>
              <p className="text-[10px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider">
                แพทเทิร์น <span className="block text-[8px] text-gray-300 -mt-0.5">(Pattern)</span>
              </p>
              <p className="text-sm font-bold text-gray-800">{pet.pattern}</p>
            </div>
          )}
          {isFarmPet && pet.coat && (
            <div>
              <p className="text-[10px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider">
                ความยาวขน <span className="block text-[8px] text-gray-300 -mt-0.5">(Coat)</span>
              </p>
              <p className="text-sm font-bold text-gray-800">{pet.coat}</p>
            </div>
          )}
          {isFarmPet && pet.ear && (
            <div>
              <p className="text-[10px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider">
                ลักษณะหู <span className="block text-[8px] text-gray-300 -mt-0.5">(Ear)</span>
              </p>
              <p className="text-sm font-bold text-gray-800">{pet.ear}</p>
            </div>
          )}
          {isFarmPet && pet.eye_color && (
            <div>
              <p className="text-[10px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider">
                สีตา <span className="block text-[8px] text-gray-300 -mt-0.5">(Eye Color)</span>
              </p>
              <p className="text-sm font-bold text-gray-800">{pet.eye_color}</p>
            </div>
          )}
          {/* ขา (Leg) เอาไว้บรรทัดเดียวถ้าพื้นที่เหลือ หรือจะโชว์ก็ต่อเมื่อมีข้อมูล */}
          {isFarmPet && pet.leg && (
            <div className="col-span-2">
              <p className="text-[10px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider">
                ลักษณะขา <span className="inline text-[8px] text-gray-300 ml-1">(Leg)</span>
              </p>
              <p className="text-sm font-bold text-gray-800">{pet.leg}</p>
            </div>
          )}

          {/* หมายเหตุ / สิ่งที่แพ้ ย้ายมาล่างสุด และให้กางเต็มบรรทัด (col-span-2) */}
          <div className="col-span-2 pt-2 mt-2 border-t border-gray-50">
            <p className="text-[10px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider">หมายเหตุ / สิ่งที่แพ้</p>
            <p className="text-xs font-medium text-gray-600 bg-gray-50/50 p-2.5 rounded-xl border border-gray-50">{pet.allergies || pet.traits || '-'}</p>
          </div>
        </div>
      </div>

      {/* 🌟 ประวัติวัคซีน (Health Book) โชว์เหมือนการ์ดคนทั่วไป */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-green-100 space-y-4">
        <h2 className="font-bold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-2 text-sm">
          <span className="text-lg">🏥</span> สมุดสุขภาพ
        </h2>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
            pet.vaccine_status === 'ฉีดวัคซีนครบแล้ว' ? 'bg-green-100 text-green-500' : 'bg-orange-100 text-orange-500'
          }`}>
            {pet.vaccine_status === 'ฉีดวัคซีนครบแล้ว' ? '💉' : '⚠️'}
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">สถานะวัคซีน</p>
            <p className={`text-sm font-bold mt-0.5 ${
              pet.vaccine_status === 'ฉีดวัคซีนครบแล้ว' ? 'text-green-600' : 'text-orange-600'
            }`}>
              {pet.vaccine_status || 'รอการตรวจสอบ'}
            </p>
          </div>
        </div>
      </div>

      {/* 🌟 ข้อมูลเจ้าของ (โชว์เฉพาะสัตว์เลี้ยงทั่วไป ที่ไม่ใช่ฟาร์ม) */}
      {!isFarmPet && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-2 text-sm">
            <span className="text-lg">👤</span> ข้อมูลเจ้าของ
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider">ชื่อเจ้าของ</p>
              <p className="text-sm font-bold text-gray-800">{profile?.full_name || profile?.username || 'ผู้ใช้งาน Whiskora'}</p>
            </div>
            {profile?.phone && (
              <div>
                <p className="text-[10px] font-medium text-gray-400 mb-0.5 uppercase tracking-wider">เบอร์โทรศัพท์ติดต่อ</p>
                <a href={`tel:${profile.phone}`} className="inline-block text-sm font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg mt-0.5">
                  📞 {profile.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="pt-2 text-center pb-8">
        <Link href="/" className="inline-block bg-pink-50 text-pink-500 text-[10px] font-bold px-4 py-2 rounded-full hover:bg-pink-100 transition">
          สร้างบัตรประจำตัวสัตว์เลี้ยงฟรี ที่ Whiskora 🐾
        </Link>
      </div>

      {/* 🌟 Contact Modal — เลือกช่องทางติดต่อ (log ก่อนเด้งออก) */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowContactModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-3 animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-2">
              <p className="text-base font-black text-gray-800">ติดต่อฟาร์ม {farm?.farm_name || ""}</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">เลือกช่องทางที่สะดวก แล้วทักได้เลย 🐾</p>
            </div>

            {farm?.phone && (
              <button
                onClick={() => logLeadAndOpen("phone", `tel:${farm.phone}`)}
                className="w-full flex items-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-3.5 px-4 rounded-2xl transition active:scale-95"
              >
                <span className="text-xl">📞</span>
                <span className="text-sm">โทรหาฟาร์ม <span className="font-medium opacity-70">{farm.phone}</span></span>
              </button>
            )}

            {farm?.line_id && (
              <button
                onClick={() => logLeadAndOpen("line", `https://line.me/ti/p/~${farm.line_id}`)}
                className="w-full flex items-center gap-3 bg-green-50 hover:bg-green-100 text-green-600 font-bold py-3.5 px-4 rounded-2xl transition active:scale-95"
              >
                <span className="text-xl">💬</span>
                <span className="text-sm">แชทผ่าน LINE</span>
              </button>
            )}

            {farm?.facebook_link && (
              <button
                onClick={() => logLeadAndOpen("facebook", farm.facebook_link)}
                className="w-full flex items-center gap-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-3.5 px-4 rounded-2xl transition active:scale-95"
              >
                <span className="text-xl">📘</span>
                <span className="text-sm">ติดต่อผ่าน Facebook</span>
              </button>
            )}

            {!farm?.phone && !farm?.line_id && !farm?.facebook_link && (
              <p className="text-center text-xs text-gray-400 font-medium py-4">ฟาร์มนี้ยังไม่ได้เพิ่มช่องทางติดต่อ 😢</p>
            )}

            <button
              onClick={() => setShowContactModal(false)}
              className="w-full text-gray-400 font-bold py-3 text-sm hover:text-gray-600 transition"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

    </div>
  );
}