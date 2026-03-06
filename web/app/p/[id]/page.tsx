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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        // 🌟 ดึงข้อมูลสัตว์เลี้ยง (ไม่ต้องเช็ค Session ให้คนนอกดูได้เลย)
        const { data: petData, error: petError } = await supabase
          .from("pets")
          .select("*")
          .eq("id", petId)
          .single();

        if (petError) throw petError;
        setPet(petData);

        // ดึงข้อมูลเจ้าของ
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, full_name, phone") // อาจจะไม่ดึง address มาโชว์หน้า Public เพื่อความปลอดภัย
          .eq("id", petData.user_id)
          .single();

        if (profileData) setProfile(profileData);
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

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-20 animate-in fade-in duration-700 space-y-8 bg-gray-50 min-h-screen">
      
      {/* 🌟 รูปภาพและชื่อ */}
      <div className="flex flex-col items-center text-center space-y-4">
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
          <p className="text-sm font-bold text-pink-500 mt-1">Whiskora Verified Pet ✨</p>
        </div>
      </div>

      {/* 🌟 ข้อมูลสัตว์เลี้ยง */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-black text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
          <span className="text-xl">📋</span> ข้อมูลส่วนตัว
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-gray-400">สายพันธุ์</p>
            <p className="text-sm font-bold text-gray-800">{pet.breed || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400">สี</p>
            <p className="text-sm font-bold text-gray-800">{pet.color || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-bold text-gray-400">สิ่งที่แพ้ / หมายเหตุ</p>
            <p className="text-sm font-medium text-gray-800">{pet.allergies || pet.traits || 'ไม่มีข้อมูลเพิ่มเติม'}</p>
          </div>
        </div>
      </div>

      {/* 🌟 ข้อมูลการติดต่อเจ้าของ */}
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

      {/* Banner ชวนสร้างบัตร (เนียนโปรโมทแอปชัช) */}
      <div className="pt-4 text-center">
        <Link href="/" className="inline-block bg-pink-100 text-pink-600 font-bold px-6 py-3 rounded-2xl text-xs hover:bg-pink-200 transition">
          สร้างบัตรประจำตัวสัตว์เลี้ยงฟรี ที่ Whiskora 🐾
        </Link>
      </div>

    </div>
  );
}