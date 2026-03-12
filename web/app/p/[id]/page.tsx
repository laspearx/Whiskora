"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function PublicPetProfilePage() {
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        // 🌟 1. ดึงข้อมูลสัตว์เลี้ยง
        const { data: petData, error: petError } = await supabase
          .from("pets")
          .select("*")
          .eq("id", petId)
          .single();

        if (petError) throw petError;
        setPet(petData);

        // 🌟 2. ดึงข้อมูลฟาร์ม (ถ้ามี)
        if (petData.farm_id && petData.farm_id !== 'PERSONAL') {
          const { data: farmData } = await supabase
            .from("farms")
            .select("farm_name, phone, facebook_link, line_id")
            .eq("id", petData.farm_id)
            .single();
            
          if (farmData) setFarm(farmData);
        } else {
          // 🌟 3. ถ้าไม่ใช่ฟาร์ม ให้ดึงข้อมูลเจ้าของแทน
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังโหลดข้อมูลน้อง... 🐾</div>;
  if (!pet) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">ไม่พบข้อมูลสัตว์เลี้ยง 😢</div>;

  // 🌟 ตัวแปรเช็คว่าน้องเป็นสัตว์เลี้ยงฟาร์มไหม?
  const isFarmPet = pet.farm_id && pet.farm_id !== 'PERSONAL';

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-20 animate-in fade-in duration-700 space-y-8 bg-gray-50 min-h-screen">
      
      {/* 🌟 รูปภาพและชื่อ */}
      <div className="flex flex-col items-center text-center space-y-4 relative">
        {/* ป้ายสถานะสำหรับน้องฟาร์ม */}
        {isFarmPet && pet.status === 'พร้อมย้ายบ้าน' && (
           <div className="absolute top-0 right-4 bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-pink-200 animate-bounce">
             ✨ พร้อมย้ายบ้าน
           </div>
        )}
        {isFarmPet && pet.status === 'พ่อพันธุ์ / แม่พันธุ์' && (
           <div className="absolute top-0 right-4 bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-blue-200">
             👑 พ่อแม่พันธุ์
           </div>
        )}

        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100">
          {pet.image_url ? (
            <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🐾</div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center justify-center gap-2">
            {pet.name} {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? <span className="text-blue-500">♂️</span> : <span className="text-pink-500">♀️</span>}
          </h1>
          <p className="text-sm font-bold text-pink-500 mt-1">
             {isFarmPet ? `น้องจากฟาร์ม ${farm?.farm_name || ''} 🏡` : 'Whiskora Verified Pet ✨'}
          </p>
        </div>
      </div>

      {/* 🌟 ข้อมูลสัตว์เลี้ยง (พื้นฐาน) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-black text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
          <span className="text-xl">📋</span> ข้อมูลส่วนตัว
        </h2>
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">สายพันธุ์</p>
            <p className="text-sm font-black text-gray-800 truncate">{pet.breed || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">สี</p>
            <p className="text-sm font-black text-gray-800 truncate">{pet.color || '-'}</p>
          </div>
          
          <div className="col-span-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">สิ่งที่แพ้ / หมายเหตุ</p>
            <p className="text-sm font-bold text-gray-600 bg-gray-50 p-3 rounded-xl mt-1">{pet.allergies || pet.traits || 'ไม่มีข้อมูลเพิ่มเติม'}</p>
          </div>
        </div>
      </div>

      {/* 🌟🌟 ข้อมูลพันธุกรรม (โชว์เฉพาะสัตว์ฟาร์ม หรือ ตัวที่มีการกรอกข้อมูลมา) 🌟🌟 */}
      {isFarmPet && (pet.pattern || pet.coat || pet.ear || pet.leg || pet.eye_color) && (
        <div className="bg-blue-50/50 rounded-3xl p-6 shadow-sm border border-blue-100 space-y-4">
          <h2 className="font-black text-blue-900 border-b border-blue-100/50 pb-2 flex items-center gap-2">
            <span className="text-xl">🧬</span> ลักษณะทางพันธุกรรม
          </h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            {pet.pattern && (
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">แพทเทิร์น</p>
                <p className="text-sm font-black text-blue-900">{pet.pattern}</p>
              </div>
            )}
            {pet.coat && (
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">ความยาวขน</p>
                <p className="text-sm font-black text-blue-900">{pet.coat}</p>
              </div>
            )}
            {pet.ear && (
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">ลักษณะหู</p>
                <p className="text-sm font-black text-blue-900">{pet.ear}</p>
              </div>
            )}
            {pet.leg && (
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">ลักษณะขา</p>
                <p className="text-sm font-black text-blue-900">{pet.leg}</p>
              </div>
            )}
            {pet.eye_color && (
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">สีตา</p>
                <p className="text-sm font-black text-blue-900">{pet.eye_color}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🌟 ข้อมูลการติดต่อเจ้าของ (โชว์เฉพาะ "สัตว์เลี้ยงบ้าน" ไม่ใช่ของฟาร์ม) */}
      {!isFarmPet && (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 shadow-xl text-white space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <h2 className="font-black text-white border-b border-white/10 pb-2 flex items-center gap-2 relative z-10">
            <span className="text-xl">👤</span> ติดต่อเจ้าของ
          </h2>
          <div className="relative z-10 space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-400">ชื่อเจ้าของ</p>
              <p className="text-base font-bold text-white">{profile?.full_name || profile?.username || 'ผู้ใช้งาน Whiskora'}</p>
            </div>
            {profile?.phone && (
              <div>
                <p className="text-xs font-bold text-gray-400 mb-1">เบอร์โทรศัพท์</p>
                <a href={`tel:${profile.phone}`} className="inline-block bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-black transition">
                  📞 {profile.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🌟 ส่วนสั่งซื้อ (โชว์เฉพาะสัตว์ฟาร์ม ที่ "พร้อมย้ายบ้าน") */}
      {isFarmPet && pet.status === 'พร้อมย้ายบ้าน' && (
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-pink-100/50 border-2 border-pink-100 animate-in slide-in-from-bottom-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">ค่าตัว / สินสอด</p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-pink-500">
              {pet.price ? `฿${pet.price.toLocaleString()}` : 'ติดต่อสอบถาม'}
            </p>
          </div>
          
          <button 
            onClick={() => {
               alert(`สนใจรับน้อง ${pet.name} ใช่ไหมครับ? \nติดต่อฟาร์ม ${farm?.farm_name || ''} เบอร์: ${farm?.phone || 'ยังไม่ระบุ'} \n(ฟีเจอร์แชทกำลังมาเร็วๆ นี้!) 🐾`); 
            }}
            className="w-full relative z-10 bg-pink-500 hover:bg-pink-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-pink-200 active:scale-95 flex items-center justify-center gap-2 text-lg"
          >
            🛒 สนใจรับเลี้ยง (ติดต่อฟาร์ม)
          </button>
        </div>
      )}

      {/* Banner ชวนสร้างบัตร (เนียนโปรโมทแอปชัช) */}
      <div className="pt-4 text-center pb-8 border-t border-gray-100">
        <Link href="/" className="inline-block bg-white border border-gray-200 text-gray-500 font-bold px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition">
          สร้างบัตรประจำตัวสัตว์เลี้ยงฟรี ที่ Whiskora 🐾
        </Link>
      </div>

    </div>
  );
}