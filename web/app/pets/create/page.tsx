"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cropper from "react-easy-crop";

// 🎮 ข้อมูลสายพันธุ์
const PET_DATA = {
  cat: {
    label: "แมว",
    breeds: [
      "แมวบ้าน / พันธุ์ผสม (Domestic / Mix Breed)",
      "โกนจา (Konja)",
      "ขาวมณี (Khao Manee)",
      "โคราช / สีสวาด (Korat)",
      "ดีวอน เร็กซ์ (Devon Rex)",
      "บริติช ช็อตแฮร์ (British Shorthair)",
      "เบงกอล (Bengal)",
      "เปอร์เซีย (Persian)",
      "มันช์กิ้น (Munchkin)",
      "เมนคูน (Maine Coon)",
      "แร็กดอล (Ragdoll)",
      "วิเชียรมาศ (Siamese)",
      "ศุภลักษณ์ (Suphalak)",
      "สก็อตติช โฟลด์ (Scottish Fold)",
      "สฟิงซ์ (Sphynx)",
      "อเมริกัน ชอร์ตแฮร์ (American Shorthair)",
      "เอ็กโซติก ชอร์ตแฮร์ (Exotic Shorthair)",
      "อื่นๆ"
    ]
  },
  dog: {
    label: "หมา",
    breeds: [
      "พันธุ์ทาง / พันธุ์ผสม (Mixed Breed)",
      "คอร์กี้ (Corgi)",
      "ชิบะ อินุ (Shiba Inu)",
      "ชิวาวา (Chihuahua)",
      "ชิสุ (Shih Tzu)",
      "ซามอยด์ (Samoyed)",
      "ไซบีเรียน ฮัสกี้ (Siberian Husky)",
      "แจ็ครัสเซลล์ เทอร์เรีย (Jack Russell)",
      "ไทยบางแก้ว (Thai Bangkaew)",
      "ไทยหลังอาน (Thai Ridgeback)",
      "บีเกิ้ล (Beagle)",
      "ปอมเมอเรเนียน (Pomeranian)",
      "พุดเดิ้ลทอย (Toy Poodle)",
      "เฟรนช์ บูลด็อก (French Bulldog)",
      "ยอร์กเชียร์ เทอร์เรีย (Yorkshire Terrier)",
      "ลาบราดอร์ รีทรีฟเวอร์ (Labrador)",
      "โกลเด้น รีทรีฟเวอร์ (Golden Retriever)",
      "อเมริกัน บูลลี่ (American Bully)",
      "อลาสกัน มาลามิวท์ (Alaskan Malamute)",
      "อื่นๆ"
    ]
  },
  other_pets: [
    { id: "rabbit", label: "กระต่าย", emoji: "🐰" },
    { id: "hamster", label: "หนูแฮมสเตอร์", emoji: "🐹" },
    { id: "bird", label: "นก", emoji: "🦜" },
    { id: "squirrel", label: "กระรอก", emoji: "🐿️" },
    { id: "hedgehog", label: "เม่นแคระ", emoji: "🦔" },
    { id: "fish", label: "ปลา", emoji: "🐟" },
    { id: "turtle", label: "เต่า", emoji: "🐢" },
    { id: "frog", label: "กบ", emoji: "🐸" },
    { id: "lizard", label: "กิ้งก่า", emoji: "🦎" },
    { id: "snake", label: "งู", emoji: "🐍" },
    { id: "raccoon", label: "แร็กคูน", emoji: "🦝" },
    { id: "other", label: "สัตว์อื่นๆ", emoji: "🐾" },
  ]
};

// 🎨 ข้อมูลสีและลวดลาย (แยกตามประเภทสัตว์)
const COLOR_DATA = {
  cat: [
    "ขาว (White)",
    "ดำ (Black)",
    "เทา / บลู (Grey / Blue)",
    "ส้ม / แดง (Orange / Red)",
    "ครีม (Cream)",
    "น้ำตาล / ช็อกโกแลต (Brown / Chocolate)",
    "ไลแลค / เทาอมม่วง (Lilac / Lavender)",
    "สามสี (Calico)",
    "สีเปรอะ (Tortoiseshell / Tortie)",
    "สองสี / ลายวัว (Bicolor / Tuxedo)",
    "สีพ้อยท์ / ลายแต้ม (Colorpoint)",
    "ลายสลิด / ลายเสือ (Tabby)",
    "อื่นๆ"
  ],
  dog: [
    "ดำ (Black)",
    "ขาว (White)",
    "น้ำตาล / ช็อกโกแลต (Brown / Chocolate / Liver)",
    "ทอง / เหลือง (Golden / Yellow)",
    "ครีม (Cream)",
    "แดง / น้ำตาลแดง (Red)",
    "เทา / บลู (Grey / Blue)",
    "ฟอว์น / น้ำตาลอ่อน (Fawn)",
    "สามสี (Tricolor)",
    "ลายหินอ่อน (Merle / Dapple)",
    "ลายเสือ (Brindle)",
    "อื่นๆ"
  ],
  other: [
    "สีเดียวล้วน (Solid Color)",
    "สองสี (Bicolor)",
    "หลายสี / ลวดลายผสม (Multi-color)",
    "เผือก (Albino)",
    "อื่นๆ"
  ]
};

export default function CreatePetPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState<"cat" | "dog" | "other">("cat");
  const [otherPetText, setOtherPetText] = useState("");
  const [breed, setBreed] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  
  // 🌟 State สำหรับสี
  const [color, setColor] = useState("");
  const [customColor, setCustomColor] = useState("");

  const [gender, setGender] = useState("male");
  const [birthdate, setBirthdate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [allergies, setAllergies] = useState("");
  const [traits, setTraits] = useState("");

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
      else setUserId(session.user.id);
    };
    checkUser();
  }, [router]);

  // 🌟 รีเซ็ตสายพันธุ์และสี เมื่อเปลี่ยนประเภทสัตว์
  const handleSpeciesChange = (type: "cat" | "dog" | "other") => {
    setSpecies(type);
    setOtherPetText("");
    setBreed("");
    setCustomBreed("");
    setColor("");
    setCustomColor("");
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
        setOriginalImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((ca: any, cap: any) => setCroppedAreaPixels(cap), []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = new Image(); image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => { if (!blob) reject(new Error("Canvas is empty")); else resolve(blob); }, "image/jpeg", 0.9);
    });
  };

  const handleUploadCroppedImage = async () => {
    try {
      setIsUploading(true);
      if (!userId || !imageSrc || !croppedAreaPixels) return;

      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const fileName = `pet-${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;
      const file = new File([croppedImageBlob], fileName, { type: "image/jpeg" });

      const { error: uploadError } = await supabase.storage
        .from("pet-photos") 
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Storage Error Details:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("pet-photos")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setImageSrc(null); 
    } catch (error: any) {
      console.error("Upload process error:", error);
      alert("เกิดข้อผิดพลาด: " + (error.message || "อัปโหลดรูปภาพไม่ได้"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("กรุณากรอกชื่อสัตว์เลี้ยง");
    if (species === 'other' && !otherPetText) return alert("กรุณาเลือกประเภทสัตว์เลี้ยง");
    
    setSaving(true);
    const finalSpecies = species === 'other' ? otherPetText : (species === 'cat' ? 'แมว' : 'หมา');
    const finalBreed = breed === 'อื่นๆ' ? customBreed : breed;
    const finalColor = color === 'อื่นๆ' ? customColor : color;

    // 🌟 แก้ไขตรงนี้: เพิ่ม .select() เพื่อให้ Supabase คืนค่า data กลับมา
    const { data, error } = await supabase.from("pets").insert({
      user_id: userId,
      name,
      species: finalSpecies,
      breed: finalBreed || null,
      color: finalColor || null,
      gender,
      birth_date: birthdate || null,
      image_url: avatarUrl,
      status: "personal",
      allergies: allergies || null,
      traits: traits || null,
    }).select(); // <--- ใส่ .select() เพิ่มเข้าไปครับ

    if (error) {
      console.error("Insert Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setSaving(false);
    } else if (data && data.length > 0) {
      // 🌟 ดึง ID ของสัตว์เลี้ยงที่เพิ่งสร้างเสร็จ
      const newPetId = data[0].id;
      
      // 🚀 เด้งไปหน้าดูรายละเอียดสัตว์เลี้ยงตัวนั้นทันที เพื่อให้ชัชเห็นปุ่มสร้างบัตรต่อได้เลย
      router.push(`/pets/${newPetId}`);
      router.refresh();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 md:mb-8 max-w-xl mx-auto">
        <Link href="/profile" className="p-2 bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-500 rounded-xl transition shadow-sm border border-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
           </svg>
        </Link>
        <h1 className="text-xl md:text-3xl font-black text-gray-800 tracking-tight">เพิ่มสัตว์เลี้ยง</h1>
      </div>

      <div className="max-w-xl mx-auto"> 
        <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-pink-50 space-y-6 md:space-y-8">
          
          {/* 1. รูปสัตว์เลี้ยง */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative group">
              <div 
                className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-full overflow-hidden border-4 border-white shadow-md group-hover:opacity-80 transition cursor-pointer"
                onClick={() => {
                  if (originalImageSrc) setImageSrc(originalImageSrc);
                  else fileInputRef.current?.click();
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Pet Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">
                    {species === 'cat' ? '🐱' : species === 'dog' ? '🐶' : '🐾'}
                  </div>
                )}
              </div>
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 md:p-2.5 rounded-full shadow-lg border-2 border-white active:scale-90 transition cursor-pointer z-10 hover:bg-pink-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} onClick={(e) => (e.currentTarget.value = "")} className="hidden" />
            </div>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center">
              {originalImageSrc ? "แตะรูปเพื่อปรับตำแหน่งใหม่" : "แตะเพื่อเลือกรูปภาพ"}
            </p>
          </div>

          <div className="space-y-6">
            {/* ชื่อสัตว์เลี้ยง */}
            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">ชื่อสัตว์เลี้ยง</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-5 py-3 md:py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm md:text-base font-bold text-gray-800" placeholder="กรอกชื่อน้อง" />
            </div>

            {/* ประเภทสัตว์เลี้ยง */}
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">น้องเป็นตัวอะไร?</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "cat", label: "แมว", icon: "🐱" },
                  { id: "dog", label: "หมา", icon: "🐶" },
                  { id: "other", label: "อื่นๆ", icon: "🐾" }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleSpeciesChange(type.id as any)}
                    className={`py-3 rounded-2xl border-2 font-black text-xs md:text-sm flex flex-col items-center gap-1 transition-all ${
                      species === type.id ? 'border-pink-500 bg-pink-50 text-pink-600 scale-105 shadow-sm' : 'border-gray-100 bg-white text-gray-400 hover:border-pink-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl md:text-2xl">{type.icon}</span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ส่วนเลือกสายพันธุ์ และ สี (จับรวมไว้ในกล่องเดียวกัน) */}
            <div className="bg-gray-50/50 rounded-[2rem] p-5 md:p-6 space-y-5 border border-gray-100">
              
              {/* สายพันธุ์ / ประเภทสัตว์แปลก */}
              {species === 'other' ? (
                <div className="space-y-3">
                  <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider italic">โปรดเลือกประเภทสัตว์อื่นๆ</label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {PET_DATA.other_pets.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setOtherPetText(o.label)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all
                          ${otherPetText === o.label ? 'border-pink-500 bg-white ring-2 ring-pink-200 shadow-sm' : 'border-gray-200 bg-white/60 hover:border-pink-300'}`}
                      >
                        <span className="text-xl md:text-2xl">{o.emoji}</span>
                        <span className={`text-[9px] md:text-[10px] font-bold ${otherPetText === o.label ? 'text-pink-600' : 'text-gray-500'}`}>{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">สายพันธุ์</label>
                  <div className="relative">
                    <select value={breed} onChange={(e) => setBreed(e.target.value)} className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm appearance-none">
                      <option value="" disabled>เลือกสายพันธุ์จากรายการ...</option>
                      {PET_DATA[species].breeds.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
              )}

              {/* กรณีพิมพ์สายพันธุ์เอง */}
              {(breed === "อื่นๆ" || (species === 'other' && otherPetText === "สัตว์อื่นๆ")) && (
                <input type="text" value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-white border border-pink-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm animate-in fade-in" placeholder="ระบุสายพันธุ์ หรือชนิดสัตว์เพิ่มเติม..." />
              )}

              <hr className="border-gray-100" />

              {/* 🌟 เลือกสี */}
              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">สี / ลวดลาย</label>
                <div className="relative">
                  <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm appearance-none">
                    <option value="" disabled>เลือกสีจากรายการ...</option>
                    {COLOR_DATA[species].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* 🌟 กรณีพิมพ์สีเอง */}
              {color === "อื่นๆ" && (
                <input type="text" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-white border border-pink-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm animate-in fade-in" placeholder="พิมพ์ระบุสีด้วยตัวเอง (แนะนำใส่ภาษาอังกฤษต่อท้าย เช่น ขาวดำ (Black & White))..." />
              )}
            </div>

            {/* เพศและวันเกิด */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">เพศ</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setGender('male')} className={`flex-1 py-2.5 rounded-xl border-2 font-black text-xs md:text-sm transition-all ${gender === 'male' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 bg-white text-gray-400'}`}>ตัวผู้</button>
                  <button type="button" onClick={() => setGender('female')} className={`flex-1 py-2.5 rounded-xl border-2 font-black text-xs md:text-sm transition-all ${gender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-100 bg-white text-gray-400'}`}>ตัวเมีย</button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">วันเกิด</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={birthdate} 
                    onChange={(e) => setBirthdate(e.target.value)} 
                    className="w-full h-[42px] md:h-[48px] px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 md:text-sm font-medium text-gray-700 appearance-none block min-w-0" 
                  />
                </div>
              </div>
            </div>

            {/* สิ่งที่แพ้ และ โน้ตเพิ่มเติม */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">สิ่งที่แพ้ <span className="text-gray-300 font-normal">(ถ้ามี)</span></label>
                <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm font-medium text-gray-800" placeholder="เช่น แพ้ไก่, แพ้อาหารทะเล" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">หมายเหตุ <span className="text-gray-300 font-normal">(เพิ่มเติม)</span></label>
                <input type="text" value={traits} onChange={(e) => setTraits(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm font-medium text-gray-800" placeholder="เช่น นิสัยส่วนตัว" />
              </div>
            </div>

          </div>

          {/* ปุ่มบันทึก */}
          <div className="flex gap-3 pt-4">
            <Link href="/profile" className="flex-1 text-center py-3.5 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition text-sm">
              ยกเลิก
            </Link>
            <button type="submit" disabled={saving} className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-200 transition-all active:scale-95 disabled:opacity-50 text-sm">
              {saving ? "กำลังบันทึก..." : "เพิ่มสัตว์เลี้ยง ✨"}
            </button>
          </div>
        </form>
      </div>

      {/* คร็อปรูป */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden flex flex-col">
            <div className="relative w-full h-64 bg-gray-900">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 text-center">ซูมรูปภาพ</label>
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-pink-500" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setImageSrc(null)} className="flex-1 py-2.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition text-xs">ยกเลิก</button>
                <button type="button" onClick={handleUploadCroppedImage} disabled={isUploading} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-pink-500 hover:bg-pink-600 transition text-xs">ยืนยัน</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}