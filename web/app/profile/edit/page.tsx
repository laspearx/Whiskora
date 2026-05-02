"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cropper from "react-easy-crop";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  // 🌟 State สำหรับที่อยู่
  const [address, setAddress] = useState("");

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<import('react-easy-crop').Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setUsername(data.username || "");
        setFullName(data.full_name || "");
        setAvatarUrl(data.avatar_url || null);
        setPhone(data.phone || "");
        // 🌟 ดึงข้อมูลที่อยู่จาก DB
        setAddress(data.address || "");
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => setImageSrc(reader.result as string));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: import('react-easy-crop').Area, croppedAreaPixels: import('react-easy-crop').Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: import('react-easy-crop').Area): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No 2d context");

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

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error("Canvas is empty"));
        else resolve(blob);
      }, "image/jpeg", 0.9);
    });
  };

  const handleUploadCroppedImage = async () => {
    try {
      setIsUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !imageSrc || !croppedAreaPixels) return;

      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedImageBlob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" });
      const filePath = `${session.user.id}/profile.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
      setImageSrc(null);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    
    // 🌟 บันทึกข้อมูลที่อยู่ลงในคอลัมน์ address
    const { error } = await supabase.from("profiles").upsert({
      id: session?.user.id,
      username,
      full_name: fullName,
      avatar_url: avatarUrl,
      phone,
      address, // 🌟 เพิ่มที่นี่
      updated_at: new Date(),
    });

    if (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } else {
      alert("บันทึกข้อมูลเรียบร้อยแล้ว ✨");
      router.push("/profile");
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-pink-500 font-bold text-sm animate-pulse">🐾 กำลังโหลด...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-1 md:pt-12 pb-10 animate-in fade-in duration-700">
      
      <div className="flex items-center gap-3 mb-5 md:mb-8">
        <Link href="/profile" className="p-2 bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-50 rounded-xl transition shadow-sm border border-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
           </svg>
        </Link>
        <h1 className="text-lg md:text-2xl font-black text-gray-800 tracking-tight">แก้ไขโปรไฟล์</h1>
      </div>

      <div className="max-w-2xl mx-auto"> 
        <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-pink-50 space-y-6 md:space-y-8">
          
          {/* 📸 รูปโปรไฟล์ */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-full overflow-hidden border-4 border-white shadow-md group-hover:opacity-80 transition">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">👤</div>
                )}
              </div>
              <button type="button" className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 md:p-2.5 rounded-full shadow-lg border-2 border-white active:scale-90 transition pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} className="hidden" />
            </div>
            <p className="text-[9px] md:text-[10px] font-bold text-gray-300 uppercase tracking-widest">แตะที่รูปเพื่อเปลี่ยน</p>
          </div>

          {/* 📝 ฟิลด์ข้อมูล */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">ชื่อผู้ใช้งาน (Username)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm md:text-base font-medium text-gray-700"
                placeholder="@username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm md:text-base font-medium text-gray-700"
                placeholder="ชื่อจริงของคุณ"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm md:text-base font-medium text-gray-700"
                placeholder="08x-xxx-xxxx"
              />
            </div>

            {/* 🌟 ฟิลด์ที่อยู่ (เพิ่มใหม่) */}
            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">ที่อยู่ปัจจุบัน</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm md:text-base font-medium text-gray-700 resize-none"
                placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด..."
              />
              <p className="text-[9px] text-gray-300 ml-1 italic">* ข้อมูลนี้จะนำไปแสดงบนบัตรประจำตัวสัตว์เลี้ยง</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Link href="/profile" className="flex-1 text-center py-3 md:py-3.5 rounded-xl font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 transition text-xs md:text-sm">
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] py-3 md:py-3.5 rounded-xl font-bold text-white bg-gray-900 hover:bg-black shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-50 text-xs md:text-sm"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </form>
      </div>

      {/* ✂️ Modal คร็อปรูป */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden flex flex-col">
            <div className="relative w-full h-64 bg-gray-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-5 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">ซูมรูปภาพ</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setImageSrc(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleUploadCroppedImage}
                  disabled={isUploading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-pink-500 hover:bg-pink-600 transition shadow-md shadow-pink-200 text-xs"
                >
                  {isUploading ? "กำลัง..." : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}