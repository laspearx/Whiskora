"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Cropper from "react-easy-crop";

// 🌟 ฐานข้อมูลสายพันธุ์
const breedData: Record<string, string[]> = {
  "cat": ["โกนจา (Konja)", "ขาวมณี (Khao Manee)", "โคราช / สีสวาด (Korat)", "ดีวอน เร็กซ์ (Devon Rex)", "บริติช ช็อตแฮร์ (British Shorthair)", "เบงกอล (Bengal)", "เปอร์เซีย (Persian)", "มันช์กิ้น (Munchkin)", "เมนคูน (Maine Coon)", "แร็กดอล (Ragdoll)", "วิเชียรมาศ (Siamese)", "ศุภลักษณ์ (Suphalak)", "สก็อตติช โฟลด์ (Scottish Fold)", "สฟิงซ์ (Sphynx)", "อเมริกัน ชอร์ตแฮร์ (American Shorthair)", "เอ็กโซติก ชอร์ตแฮร์ (Exotic Shorthair)"],
  "dog": ["คอร์กี้ (Corgi)", "ชิบะ อินุ (Shiba Inu)", "ชิวาวา (Chihuahua)", "ชิสุ (Shih Tzu)", "ซามอยด์ (Samoyed)", "ไซบีเรียน ฮัสกี้ (Siberian Husky)", "แจ็ครัสเซลล์ เทอร์เรีย (Jack Russell)", "ไทยบางแก้ว (Thai Bangkaew)", "ไทยหลังอาน (Thai Ridgeback)", "บีเกิ้ล (Beagle)", "ปอมเมอเรเนียน (Pomeranian)", "พุดเดิ้ลทอย (Toy Poodle)", "เฟรนช์ บูลด็อก (French Bulldog)", "ยอร์กเชียร์ เทอร์เรีย (Yorkshire Terrier)", "ลาบราดอร์ รีทรีฟเวอร์ (Labrador)", "โกลเด้น รีทรีฟเวอร์ (Golden Retriever)", "อเมริกัน บูลลี่ (American Bully)", "อลาสกัน มาลามิวท์ (Alaskan Malamute)"],
  "กระต่าย": ["ฮอลแลนด์ ลอป (Holland Lop)", "เนเธอร์แลนด์ ดวอร์ฟ (Netherland Dwarf)", "มินิเร็กซ์ (Mini Rex)", "ไลอ้อนเฮด (Lionhead)", "อิงลิช แองโกร่า (English Angora)", "เฟรนช์ ลอป (French Lop)"],
  "หนูแฮมสเตอร์": ["วินเทอร์ไวท์ (Winter White)", "ไซเรียน (Syrian / ไจแอนท์)", "โรโบรอฟสกี (Roborovski)", "แคมป์เบลล์ (Campbell)"],
  "นก": ["ฟอพัส (Forpus)", "ค็อกคาเทล (Cockatiel)", "ซันคอนัวร์ (Sun Conure)", "เลิฟเบิร์ด (Lovebird)", "หงส์หยก (Budgerigar)", "แอฟริกันเกรย์ (African Grey)", "มาคอว์ (Macaw)", "กรีนชีค (Green Cheek)"],
  "กระรอก": ["กระรอกบิน (Flying Squirrel)", "ชูการ์ไกลเดอร์ (Sugar Glider)", "แพรี่ด็อก (Prairie Dog)", "กระรอกดง (Finlayson's)"],
  "เม่นแคระ": ["เม่นแคระแอฟริกัน (African Pygmy)"],
  "ปลา": ["ปลากัด (Betta)", "ปลาคาร์ป (Koi)", "ปลาทอง (Goldfish)", "ปลาหางนกยูง (Guppy)", "ปลาหมอสี (Flowerhorn)", "ปลามังกร (Arowana)"],
  "เต่า": ["ซูคาต้า (Sulcata)", "ดาวอินเดีย (Indian Star)", "อัลดราบร้า (Aldabra)", "เต่าญี่ปุ่น (Red-eared Slider)", "เต่าหมูบิน (Pig-nosed)"],
  "กบ": ["ฮอร์นฟร็อก (Horned Frog)", "ไวท์ทรีฟร็อก (White's Tree Frog)", "อึ่งแม่หนาว (Chubby Frog)", "กบลูกศรพิษ (Poison Dart)"],
  "กิ้งก่า": ["เบียร์ดดราก้อน (Bearded Dragon)", "เตกู (Tegu)", "อีกัวน่า (Iguana)", "คาเมเลี่ยน (Chameleon)", "เครสเตดเกตุโก (Crested Gecko)", "เลพเพิร์ดเกตุโก (Leopard Gecko)"],
  "งู": ["คอร์นสเนค (Corn Snake)", "บอลไพธอน (Ball Python)", "ฮ็อกโนส (Hognose)", "คิงสเนค (King Snake)", "มิลค์สเนค (Milk Snake)"],
  "แร็กคูน": ["แร็กคูน (Raccoon)"],
  "สัตว์แปลกอื่นๆ": ["เมียร์แคต (Meerkat)", "เฟอร์เรท (Ferret)", "ชินชิลล่า (Chinchilla)", "บุชเบบี้ (Bushbaby)"]
};

// --- Helper Functions สำหรับจัดการ Crop รูป ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: import('react-easy-crop').Area): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, "image/jpeg", 0.9);
  });
}

export default function CreateFarmPetPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [farm, setFarm] = useState<import('@/lib/types').Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🌟 State สำหรับการ Crop รูปภาพ
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // State สำหรับเก็บข้อมูล
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    customBreed: "",
    gender: "",
    birthDate: "",
    status: "", 
    price: ""
  });

  useEffect(() => {
    const fetchFarmInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: farmData } = await supabase
          .from("farms")
          .select("id, farm_name, species")
          .eq("id", farmId)
          .eq("user_id", session.user.id)
          .single();

        if (farmData) setFarm(farmData);
        else {
          alert("ไม่พบข้อมูลฟาร์ม");
          router.push("/partner");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (farmId) fetchFarmInfo();
  }, [farmId, router]);

  // 🌟 ฟังก์ชันจัดการเลือกไฟล์รูป
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setShowCropper(true); // เปิดหน้าต่าง Crop ทันทีที่เลือกรูป
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: import('react-easy-crop').Area, croppedAreaPixels: import('react-easy-crop').Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropImage = useCallback(async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedBlob) {
        const croppedUrl = URL.createObjectURL(croppedBlob);
        setCroppedImage({ blob: croppedBlob, url: croppedUrl });
        setShowCropper(false);
      }
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, croppedAreaPixels]);

  // 🌟 ฟังก์ชันบันทึกข้อมูล (รวมอัปโหลดรูป)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalBreed = formData.breed;
    if (formData.breed === "อื่นๆ") {
      if (!formData.customBreed.trim()) {
        alert("กรุณาระบุสายพันธุ์");
        return;
      }
      finalBreed = formData.customBreed.trim();
    } else if (!formData.breed) {
      alert("กรุณาระบุสายพันธุ์");
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let imageUrl = null;

      // 📸 1. ถ้ามีการเลือกรูป ให้ Upload ขึ้น Supabase Storage ก่อน
      if (croppedImage) {
        const fileName = `farm-${farm.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("pet-photos")
          .upload(`${session.user.id}/${fileName}`, croppedImage.blob, {
            contentType: "image/jpeg",
          });

        if (uploadError) throw uploadError;

        // ดึงลิงก์รูปสาธารณะมาใช้งาน
        const { data: publicUrlData } = supabase.storage
          .from("pet-photos")
          .getPublicUrl(`${session.user.id}/${fileName}`);

        imageUrl = publicUrlData.publicUrl;
      }

      // 📝 2. บันทึกข้อมูลลงตาราง pets
      const { error } = await supabase
        .from("pets")
        .insert([{
          user_id: session.user.id,
          farm_id: farm.id,           
          species: farm.species,      
          name: formData.name,
          breed: finalBreed,
          gender: formData.gender,
          birth_date: formData.birthDate || null,
          status: formData.status,    
          price: formData.price ? parseInt(formData.price) : null,
          image_url: imageUrl // 🌟 เพิ่มลิงก์รูปลงไป
        }]);

      if (error) throw error;

      alert("🎉 เพิ่มสัตว์เลี้ยงเข้าฟาร์มเรียบร้อยแล้ว!");
      router.push(`/farm-dashboard/${farm.id}/pets`); 
      router.refresh();
    } catch (error: unknown) {
      console.error("Error creating pet:", error);
      alert(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'กรุณาลองใหม่'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังโหลดข้อมูล... ⏳</div>;
  if (!farm) return null;

  const availableBreeds = breedData[farm.species];

  return (
    <div className="max-w-xl mx-auto py-8 md:py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex items-start gap-3 mb-6 md:mb-8">
        
        {/* ปุ่มย้อนกลับ */}
        <Link 
          href={`/farm-dashboard/${farm.id}/pets/`} 
          className="mt-0.5 p-2.5 bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-500 rounded-xl transition shadow-sm border border-gray-100 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        
        {/* กลุ่มข้อความหัวข้อ (เรียงบน-ล่าง) */}
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
            เพิ่มสมาชิกในฟาร์ม
          </h1>
          <p className="text-xs md:text-sm font-bold text-pink-500 mt-1">
            ลงทะเบียนเข้าสังกัด: {farm.farm_name}
          </p>
        </div>

      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-pink-100 p-8 md:p-10 relative">

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 📸 อัปโหลดรูประบบใหม่ */}
          <div className="flex flex-col items-center justify-center mb-8">
            <label className="relative cursor-pointer group">
              <div className="w-32 h-32 rounded-full border-4 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center overflow-hidden shadow-sm group-hover:border-pink-400 transition-all">
                {croppedImage ? (
                  <img src={croppedImage.url} alt="Pet Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-pink-400">
                    <span className="text-3xl mb-1">📸</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">ใส่รูปน้อง</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
            
            {/* ปุ่มกดเปิดปรับตำแหน่งรูปใหม่ */}
            {croppedImage && (
              <button 
                type="button" 
                onClick={() => setShowCropper(true)} 
                className="mt-3 text-[11px] font-bold text-gray-400 hover:text-pink-500 bg-gray-50 hover:bg-pink-50 px-3 py-1.5 rounded-full transition-colors"
              >
                ✎ ปรับตำแหน่งรูป
              </button>
            )}
          </div>
          
          {/* ชื่อ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">ชื่อ<span className="text-pink-500">*</span></label>
            <input 
              required
              type="text" 
              placeholder="เช่น ลูน่า"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          {/* สายพันธุ์ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">สายพันธุ์ <span className="text-pink-500">*</span></label>
            {availableBreeds ? (
              <select 
                required
                className={`w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold appearance-none cursor-pointer ${formData.breed === '' ? 'text-gray-400' : 'text-gray-800'}`}
                value={formData.breed}
                onChange={(e) => setFormData({...formData, breed: e.target.value, customBreed: ""})}
              >
                <option value="" disabled>เลือกสายพันธุ์</option>
                {availableBreeds.map((breed, idx) => (
                  <option key={idx} value={breed}>{breed}</option>
                ))}
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            ) : (
              <input 
                required
                type="text" 
                placeholder="ระบุสายพันธุ์..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800"
                value={formData.breed}
                onChange={(e) => setFormData({...formData, breed: e.target.value})}
              />
            )}
          </div>

          {formData.breed === "อื่นๆ" && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">พิมพ์สายพันธุ์ที่ต้องการ <span className="text-pink-500">*</span></label>
              <input 
                required
                type="text" 
                placeholder="เช่น พันธุ์ผสม, ชอร์ตแฮร์ผสมเปอร์เซีย..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800"
                value={formData.customBreed}
                onChange={(e) => setFormData({...formData, customBreed: e.target.value})}
              />
            </div>
          )}

          <div className="grid grid-cols-5 gap-3 md:gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">เพศ</label>
              <select 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-2 md:px-4 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800 appearance-none"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="male">♂ ตัวผู้</option>
                <option value="female">♀ ตัวเมีย</option>
              </select>
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">วันเกิด</label>
              <input 
                type="date" 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-0 md:px-4 py-3 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800"
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">สถานะ</label>
              <select 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800 appearance-none"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="" disabled>เลือกประเภท</option>
                <option value="พ่อพันธุ์ / แม่พันธุ์">พ่อพันธุ์ / แม่พันธุ์</option>
                <option value="เด็ก">เด็ก</option>               
                <option value="พร้อมย้ายบ้าน">พร้อมย้ายบ้าน</option>
                <option value="ติดจอง">ติดจอง</option>  
                <option value="ทำหมัน / ปลดระวาง">ทำหมัน / ปลดระวาง</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">ราคา (บาท)</label>
              <input 
                type="number" 
                placeholder="เช่น 15000"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800"
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              disabled={saving}
              type="submit"
              className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg active:scale-[0.98] flex justify-center items-center gap-2 ${saving ? 'bg-gray-400 shadow-none' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-200'}`}
            >
              {saving ? '⏳ กำลังบันทึกข้อมูล...' : '✨ เพิ่มเข้าสู่ฟาร์ม'}
            </button>
          </div>
        </form>
      </div>

      {/* 🌟 Modal สำหรับคร็อปรูปภาพ (แสดงขึ้นมาเมื่อเลือกรูป) */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col animate-in fade-in duration-300">
          <div className="relative flex-1">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1} // ล็อคสัดส่วน 1:1 (สี่เหลี่ยมจัตุรัส/วงกลม)
              cropShape="round" // คร็อปเป็นวงกลมให้ดูสวยงาม
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          
          {/* แถบเครื่องมือด้านล่าง */}
          <div className="p-6 pb-10 bg-white rounded-t-[2rem] flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="text-xl">🔍</span>
              <input 
                type="range" 
                min={1} 
                max={3} 
                step={0.1} 
                value={zoom} 
                onChange={(e) => setZoom(Number(e.target.value))} 
                className="w-full accent-pink-500"
              />
            </div>
            <div className="flex justify-between gap-4">
              <button 
                type="button" 
                onClick={() => setShowCropper(false)}
                className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition"
              >
                ยกเลิก
              </button>
              <button 
                type="button" 
                onClick={handleCropImage}
                className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 transition"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}