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
        // 1. ดึงข้อมูลสัตว์เลี้ยง
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
            .select("farm_name, phone, facebook_link, line_id")
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังโหลดข้อมูลน้อง... 🐾</div>;
  if (!pet) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">ไม่พบข้อมูลสัตว์เลี้ยง 😢</div>;

  const isFarmPet = pet.farm_id && pet.farm_id !== 'PERSONAL';
  const isReadyToMove = pet.status === 'พร้อมย้าย' || pet.status === 'พร้อมย้ายบ้าน';
  const isBreeder = pet.status === 'พ่อพันธุ์ / แม่พันธุ์' || pet.status === 'พ่อแม่พันธุ์' || pet.status === 'พ่อพันธุ์' || pet.status === 'แม่พันธุ์';

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-20 animate-in fade-in duration-700 space-y-6 min-h-screen">
      
      {/* 🌟 ส่วน Header (รูปภาพและชื่อ) */}
      <div className="flex flex-col items-center text-center pt-4 pb-2 relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 relative">
          {pet.image_url ? (
            <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
          )}
        </div>

        <div className="mt-4 space-y-1">
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center justify-center gap-2">
            {pet.name} 
            {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? (
              <span className="text-blue-500 text-lg">♂️</span>
            ) : (
              <span className="text-pink-500 text-lg">♀️</span>
            )}
          </h1>
          <p className="text-sm font-bold text-gray-500">
             {isFarmPet ? `จากฟาร์ม ${farm?.farm_name || ''} 🏡` : 'Whiskora Verified Pet ✨'}
          </p>
        </div>

        {/* ป้ายสถานะสำหรับฟาร์ม */}
        {isFarmPet && isReadyToMove && (
          <div className="mt-3 bg-pink-100 text-pink-600 text-xs font-bold px-4 py-1.5 rounded-full">
            ✨ พร้อมย้ายบ้าน
          </div>
        )}
        {isFarmPet && isBreeder && (
          <div className="mt-3 bg-blue-100 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full">
            👑 พ่อแม่พันธุ์
          </div>
        )}
      </div>

      {/* 🌟 ข้อมูลสัตว์เลี้ยง (พื้นฐาน) */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-5">
        <h2 className="font-bold text-gray-800 border-b border-gray-50 pb-3 flex items-center gap-2 text-base">
          <span className="text-xl">📋</span> ข้อมูลส่วนตัว
        </h2>
        
        <div className="grid grid-cols-2 gap-y-5 gap-x-4">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-0.5">สายพันธุ์</p>
            <p className="text-sm font-bold text-gray-800">{pet.breed || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 mb-0.5">สี (Color)</p>
            <p className="text-sm font-bold text-gray-800">{pet.color || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-400 mb-0.5">หมายเหตุ / สิ่งที่แพ้</p>
            <p className="text-sm font-medium text-gray-700">{pet.allergies || pet.traits || '-'}</p>
          </div>
        </div>
      </div>

      {/* 🌟 ลักษณะทางพันธุกรรม */}
      {isFarmPet && (pet.pattern || pet.coat || pet.ear || pet.leg || pet.eye_color) && (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-5">
          <h2 className="font-bold text-gray-800 border-b border-gray-50 pb-3 flex items-center gap-2 text-base">
            <span className="text-xl">🧬</span> ลักษณะทางพันธุกรรม
          </h2>
          
          <div className="grid grid-cols-2 gap-y-5 gap-x-4">
            {pet.pattern && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-0.5">แพทเทิร์น</p>
                <p className="text-sm font-bold text-gray-800">{pet.pattern}</p>
              </div>
            )}
            {pet.coat && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-0.5">ความยาวขน</p>
                <p className="text-sm font-bold text-gray-800">{pet.coat}</p>
              </div>
            )}
            {pet.ear && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-0.5">ลักษณะหู</p>
                <p className="text-sm font-bold text-gray-800">{pet.ear}</p>
              </div>
            )}
            {pet.leg && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-0.5">ลักษณะขา</p>
                <p className="text-sm font-bold text-gray-800">{pet.leg}</p>
              </div>
            )}
            {pet.eye_color && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-400 mb-0.5">สีตา (Eye Color)</p>
                <p className="text-sm font-bold text-gray-800">{pet.eye_color}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🌟 ข้อมูลการติดต่อ (แยกเคส ฟาร์ม กับ คนทั่วไป) */}
      {isFarmPet ? (
        // 🏡 สำหรับสัตว์เลี้ยงฟาร์ม
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-pink-100 space-y-6">
          
          {/* ส่วนของราคา (โชว์เฉพาะพร้อมย้าย) */}
          {isReadyToMove ? (
            <div className="flex items-center justify-between bg-pink-50 p-4 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-pink-400 mb-0.5">ค่าตัว / สินสอด</p>
                <p className="text-xs text-pink-500/80 font-medium">สนใจรับน้องไปดูแลติดต่อฟาร์มได้เลย</p>
              </div>
              <p className="text-2xl font-black text-pink-600">
                {pet.price ? `฿${pet.price.toLocaleString()}` : 'ทักแชทสอบถาม'}
              </p>
            </div>
          ) : (
            // ถ้าเป็นพ่อแม่พันธุ์ โชว์ข้อความนี้แทน
            <div className="text-center bg-gray-50 p-4 rounded-2xl">
              <p className="text-sm font-bold text-gray-600">👑 พ่อแม่พันธุ์ประจำฟาร์ม</p>
              <p className="text-xs text-gray-400 mt-1">น้องไม่ได้เปิดสินสอดให้รับเลี้ยง</p>
            </div>
          )}

          {/* ข้อมูลติดต่อฟาร์ม */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 text-sm border-b border-gray-50 pb-2">ติดต่อฟาร์ม</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 text-sm">🏡</div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400">ชื่อฟาร์ม</p>
                  <p className="text-sm font-bold text-gray-800">{farm?.farm_name || 'ไม่ระบุ'}</p>
                </div>
              </div>
              {farm?.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 text-sm">📞</div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400">เบอร์โทรศัพท์</p>
                    <a href={`tel:${farm.phone}`} className="text-sm font-bold text-gray-800 hover:text-green-600">{farm.phone}</a>
                  </div>
                </div>
              )}
            </div>

            {/* ปุ่มติดต่อ (โชว์เฉพาะพร้อมย้าย) */}
            {isReadyToMove && (
              <button 
                onClick={() => alert(`ติดต่อฟาร์ม ${farm?.farm_name || ''} เบอร์: ${farm?.phone || '-'}`)}
                className="w-full mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-pink-200 active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                🛒 สนใจรับเลี้ยง (ติดต่อฟาร์ม)
              </button>
            )}
          </div>
        </div>
      ) : (
        // 👤 สำหรับสัตว์เลี้ยงทั่วไป (ไม่ใช่ฟาร์ม)
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800 border-b border-gray-50 pb-3 flex items-center gap-2 text-base">
            <span className="text-xl">👤</span> ข้อมูลเจ้าของ
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-0.5">ชื่อเจ้าของ</p>
              <p className="text-sm font-bold text-gray-800">{profile?.full_name || profile?.username || 'ผู้ใช้งาน Whiskora'}</p>
            </div>
            {profile?.phone && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-0.5">เบอร์โทรศัพท์ติดต่อ</p>
                <a href={`tel:${profile.phone}`} className="inline-block text-sm font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg mt-1">
                  📞 {profile.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="pt-4 text-center pb-8 border-t border-gray-100">
        <Link href="/" className="mt-3 bg-pink-100 text-pink-600 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-pink-200 hover:text-pink-600">
          สร้างบัตรประจำตัวสัตว์เลี้ยงฟรี ที่ Whiskora 🐾
        </Link>
      </div>

    </div>
  );
}