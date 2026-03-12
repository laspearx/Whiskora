"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Cropper from "react-easy-crop";

// 🎮 ข้อมูลสายพันธุ์
const PET_DATA = {
  cat: {
    label: "แมว",
    breeds: [
      "แมวบ้าน / พันธุ์ผสม (Domestic / Mix Breed)", "โกนจา (Konja)", "ขาวมณี (Khao Manee)",
      "โคราช / สีสวาด (Korat)", "ดีวอน เร็กซ์ (Devon Rex)", "บริติช ช็อตแฮร์ (British Shorthair)",
      "เบงกอล (Bengal)", "เปอร์เซีย (Persian)", "มันช์กิ้น (Munchkin)", "เมนคูน (Maine Coon)",
      "แร็กดอล (Ragdoll)", "วิเชียรมาศ (Siamese)", "ศุภลักษณ์ (Suphalak)", "สก็อตติช โฟลด์ (Scottish Fold)",
      "สฟิงซ์ (Sphynx)", "อเมริกัน ชอร์ตแฮร์ (American Shorthair)", "เอ็กโซติก ชอร์ตแฮร์ (Exotic Shorthair)", "อื่นๆ"
    ]
  },
  dog: {
    label: "หมา",
    breeds: [
      "พันธุ์ทาง / พันธุ์ผสม (Mixed Breed)", "คอร์กี้ (Corgi)", "ชิบะ อินุ (Shiba Inu)", "ชิวาวา (Chihuahua)",
      "ชิสุ (Shih Tzu)", "ซามอยด์ (Samoyed)", "ไซบีเรียน ฮัสกี้ (Siberian Husky)", "แจ็ครัสเซลล์ เทอร์เรีย (Jack Russell)",
      "ไทยบางแก้ว (Thai Bangkaew)", "ไทยหลังอาน (Thai Ridgeback)", "บีเกิ้ล (Beagle)", "ปอมเมอเรเนียน (Pomeranian)",
      "พุดเดิ้ลทอย (Toy Poodle)", "เฟรนช์ บูลด็อก (French Bulldog)", "ยอร์กเชียร์ เทอร์เรีย (Yorkshire Terrier)",
      "ลาบราดอร์ รีทรีฟเวอร์ (Labrador)", "โกลเด้น รีทรีฟเวอร์ (Golden Retriever)", "อเมริกัน บูลลี่ (American Bully)",
      "อลาสกัน มาลามิวท์ (Alaskan Malamute)", "อื่นๆ"
    ]
  },
  other_pets: [
    { id: "rabbit", label: "กระต่าย", emoji: "🐰" }, { id: "hamster", label: "หนูแฮมสเตอร์", emoji: "🐹" },
    { id: "bird", label: "นก", emoji: "🦜" }, { id: "squirrel", label: "กระรอก", emoji: "🐿️" },
    { id: "hedgehog", label: "เม่นแคระ", emoji: "🦔" }, { id: "fish", label: "ปลา", emoji: "🐟" },
    { id: "turtle", label: "เต่า", emoji: "🐢" }, { id: "frog", label: "กบ", emoji: "🐸" },
    { id: "lizard", label: "กิ้งก่า", emoji: "🦎" }, { id: "snake", label: "งู", emoji: "🐍" },
    { id: "raccoon", label: "แร็กคูน", emoji: "🦝" }, { id: "other", label: "สัตว์แปลกอื่นๆ", emoji: "🐾" },
  ]
};

// 🎨 ข้อมูลสีเบื้องต้น (สำหรับหมาและสัตว์อื่นๆ)
const COLOR_DATA = {
  dog: [
    "ดำ (Black)", "ขาว (White)", "น้ำตาล / ช็อกโกแลต (Brown / Chocolate / Liver)",
    "ทอง / เหลือง (Golden / Yellow)", "ครีม (Cream)", "แดง / น้ำตาลแดง (Red)",
    "เทา / บลู (Grey / Blue)", "ฟอว์น / น้ำตาลอ่อน (Fawn)", "สามสี (Tricolor)",
    "ลายหินอ่อน (Merle / Dapple)", "ลายเสือ (Brindle)", "อื่นๆ"
  ],
  other: [
    "สีเดียวล้วน (Solid Color)", "สองสี (Bicolor)", "หลายสี / ลวดลายผสม (Multi-color)",
    "เผือก (Albino)", "อื่นๆ"
  ]
};

export default function EditPetPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [isFetching, setIsFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState<"cat" | "dog" | "other">("cat");
  const [otherPetText, setOtherPetText] = useState("");
  const [breed, setBreed] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  
  const [color, setColor] = useState("");
  const [customColor, setCustomColor] = useState("");

  const [gender, setGender] = useState("male");
  const [birthdate, setBirthdate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [allergies, setAllergies] = useState("");
  const [traits, setTraits] = useState("");

  // 🌟 ข้อมูลฟาร์มและพันธุกรรม
  const [status, setStatus] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [pattern, setPattern] = useState("");
  const [coat, setCoat] = useState("");
  const [ear, setEar] = useState("");
  const [leg, setLeg] = useState("");
  const [eyeColor, setEyeColor] = useState("");

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPetData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("id", petId)
        .eq("user_id", session.user.id)
        .single();

      if (error || !data) {
        alert("หาข้อมูลสัตว์เลี้ยงไม่พบ หรือคุณไม่มีสิทธิ์แก้ไข");
        router.push("/profile");
        return;
      }

      setName(data.name || "");
      setGender(data.gender || "male");
      setBirthdate(data.birth_date || data.birthdate || "");
      setAllergies(data.allergies || "");
      setTraits(data.traits || "");

      setStatus(data.status || "");
      setPrice(data.price || "");
      setPattern(data.pattern || "");
      setCoat(data.coat || "");
      setEar(data.ear || "");
      setLeg(data.leg || "");
      setEyeColor(data.eye_color || "");

      if (data.image_url) {
        setAvatarUrl(data.image_url);
        setOriginalImageSrc(data.image_url);
      }

      let currentSpecies: "cat" | "dog" | "other" = "other";
      if (data.species === "แมว" || data.species === "cat") {
        currentSpecies = "cat";
        setSpecies("cat");
      } else if (data.species === "หมา" || data.species === "dog") {
        currentSpecies = "dog";
        setSpecies("dog");
      } else {
        setSpecies("other");
        setOtherPetText(data.species || "");
      }

      const petBreed = data.breed || "";
      if (currentSpecies === "cat" || currentSpecies === "dog") {
        if (PET_DATA[currentSpecies].breeds.includes(petBreed)) {
          setBreed(petBreed);
        } else {
          setBreed("อื่นๆ");
          setCustomBreed(petBreed);
        }
      } else {
        setCustomBreed(petBreed);
      }

      const petColor = data.color || "";
      if (currentSpecies !== "cat" && COLOR_DATA[currentSpecies]?.includes(petColor)) {
        setColor(petColor);
      } else if (petColor) {
        // แมว หรือสีที่ไม่ตรงในลิสต์ จะมาตกตรงนี้
        setColor(petColor);
      }

      setIsFetching(false);
    };

    if (petId) fetchPetData();
  }, [petId, router]);

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

      if (uploadError) throw uploadError;

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

    const { error } = await supabase.from("pets").update({
      name,
      species: finalSpecies,
      breed: finalBreed || null,
      color: finalColor || null,
      gender,
      birth_date: birthdate || null,
      image_url: avatarUrl,
      allergies: allergies || null,
      traits: traits || null,
      status: status || null,
      price: price === "" ? null : Number(price),
      pattern: pattern || null,
      coat: coat || null,
      ear: ear || null,
      leg: leg || null,
      eye_color: eyeColor || null,
    }).eq("id", petId);

    if (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setSaving(false);
    } else {
      alert("✏️ แก้ไขข้อมูลเรียบร้อยแล้ว!");
      router.push(`/pets/${petId}`);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    const isConfirm = window.confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบประวัติของ "${name}" ทิ้ง?\n\n(หากลบแล้ว ข้อมูลจะไม่สามารถกู้คืนได้ครับ)`);
    if (!isConfirm || !userId) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", petId)
        .eq("user_id", userId);

      if (error) throw error;

      alert(`🗑️ ลบประวัติ ${name} ออกจากระบบเรียบร้อยแล้วครับ!`);
      router.back(); 
    } catch (error: any) {
      alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
      console.error(error);
      setIsDeleting(false);
    }
  };

  if (isFetching) return <div className="min-h-screen bg-white flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังดึงข้อมูล... ⏳</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-1 md:pt-12 pb-10 animate-in fade-in duration-700">
      <div className="flex items-center gap-3 mb-5 md:mb-8">
        <button onClick={() => router.back()} className="p-2 bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-500 rounded-xl transition shadow-sm border border-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
           </svg>
        </button>
        <h1 className="text-xl md:text-3xl font-black text-gray-800 tracking-tight">แก้ไขข้อมูลสัตว์เลี้ยง</h1>
      </div>

      <div className="max-w-xl mx-auto"> 
        <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-pink-50 space-y-6 md:space-y-8">
          
          {/* 1. รูปสัตว์เลี้ยง */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative group">
              <div 
                className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-full overflow-hidden border-4 border-white shadow-md group-hover:opacity-80 transition cursor-pointer"
                onClick={() => {
                  if (originalImageSrc) {
                    setImageSrc(originalImageSrc);
                  } else {
                    fileInputRef.current?.click();
                  }
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

            {/* สายพันธุ์ */}
            <div className="bg-gray-50/50 rounded-[2rem] p-5 md:p-6 space-y-5 border border-gray-100">
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

              {(breed === "อื่นๆ" || (species === 'other' && otherPetText === "สัตว์แปลกอื่นๆ")) && (
                <input type="text" value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-white border border-pink-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm animate-in fade-in" placeholder="ระบุสายพันธุ์เพิ่มเติม..." />
              )}

              {/* 🌟 เลือกสี (โชว์เฉพาะหมาและสัตว์อื่น ส่วนแมวจะย้ายไปอยู่หมวดพันธุกรรมด้านล่าง) */}
              {species !== 'cat' && (
                <>
                  <hr className="border-gray-100" />
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">สี (Color)</label>
                    <div className="relative">
                      <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm appearance-none">
                        <option value="" disabled>เลือกสีจากรายการ...</option>
                        {COLOR_DATA[species as 'dog' | 'other']?.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  {color === "อื่นๆ" && (
                    <input type="text" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="w-full px-4 py-3 md:py-3.5 rounded-xl bg-white border border-pink-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm animate-in fade-in" placeholder="พิมพ์ระบุสีด้วยตัวเอง..." />
                  )}
                </>
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
                <input 
                  type="date" 
                  value={birthdate} 
                  onChange={(e) => setBirthdate(e.target.value)} 
                  className="w-full h-[42px] md:h-[48px] px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 md:text-sm font-medium text-gray-700 appearance-none block min-w-0" 
                />
              </div>
            </div>

            {/* สิ่งที่แพ้ และ นิสัย */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">สิ่งที่แพ้ <span className="text-gray-300 font-normal">(ถ้ามี)</span></label>
                <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm font-medium text-gray-800" placeholder="เช่น แพ้ไข่, แพ้อาหารทะเล" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">หมายเหตุ <span className="text-gray-300 font-normal">(เพิ่มเติม)</span></label>
                <input type="text" value={traits} onChange={(e) => setTraits(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm font-medium text-gray-800" placeholder="เช่น นิสัยส่วนตัว หรือโน้ตเพิ่มเติม" />
              </div>
            </div>

            {/* 🌟🌟 ข้อมูลฟาร์มและพันธุกรรม 🌟🌟 */}
            <div className="space-y-5 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded text-xs">👑</span>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">ข้อมูลฟาร์ม & พันธุกรรม</h3>
              </div>

              {/* สถานะ และ ราคา */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">สถานะในฟาร์ม</label>
                  <div className="relative">
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm font-bold text-gray-700 appearance-none">
                      <option value="">เด็กในบ้าน (ทั่วไป)</option>
                      <option value="พ่อพันธุ์ / แม่พันธุ์">พ่อพันธุ์ / แม่พันธุ์</option>
                      <option value="พร้อมย้ายบ้าน">พร้อมย้ายบ้าน</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {status === "พร้อมย้ายบ้าน" && (
                  <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-300">
                    <label className="text-[10px] md:text-xs font-bold text-pink-500 uppercase ml-1 tracking-wider">ค่าตัว / สินสอด (บาท) *</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-pink-50 border border-pink-200 outline-none focus:border-pink-400 focus:bg-white transition-all text-sm font-black text-pink-600" placeholder="เช่น 15000" />
                  </div>
                )}
              </div>

              {/* 🧬 ลักษณะพันธุกรรม (Traits) */}
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mb-2">
                  🧬 ลักษณะทางพันธุกรรม (Traits)
                </h3>
                
                {species === 'cat' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">สี (Color)</label>
                        <div className="relative">
                          <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm appearance-none">
                            <option value="">เลือกสี...</option>
                            <option>Black</option><option>Black White</option><option>Black Tortie</option><option>Black Tortie White</option>
                            <option>Blue</option><option>Blue White</option><option>Blue Tortie</option><option>Blue Tortie White</option>
                            <option>Chocolate</option><option>Chocolate White</option><option>Chocolate Tortie</option><option>Chocolate Tortie White</option>
                            <option>Cinnamon</option><option>Cinnamon White</option><option>Cinnamon Tortie</option><option>Cinnamon Tortie White</option>
                            <option>Cream</option><option>Cream White</option><option>Cream Tortie</option><option>Cream Tortie White</option>
                            <option>Fawn</option><option>Fawn White</option><option>Fawn Tortie</option><option>Fawn Tortie White</option>
                            <option>Golden</option><option>Lilac</option><option>Lilac White</option><option>Lilac Tortie</option><option>Lilac Tortie White</option>
                            <option>Red</option><option>Red White</option><option>Silver</option><option>White</option>
                            <option value="อื่นๆ">อื่นๆ (พิมพ์ระบุเอง)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                        </div>
                        {color === "อื่นๆ" && (
                          <input type="text" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="w-full mt-2 px-4 py-3 rounded-xl bg-white border border-pink-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm animate-in fade-in" placeholder="พิมพ์ระบุสีด้วยตัวเอง..." />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">แพทเทิร์น (Pattern)</label>
                        <div className="relative">
                          <select value={pattern} onChange={(e) => setPattern(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm appearance-none">
                            <option value="">เลือกแพทเทิร์น...</option>
                            <option>Solid</option><option>Bicolour</option><option>Van</option><option>Harlequin</option>
                            <option>Classic Tabby</option><option>Mackerel Tabby</option><option>Spotted Tabby</option>
                            <option>Ticked Tabby</option><option>Shaded</option><option>Shell</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">ขน (Coat)</label>
                        <div className="relative">
                          <select value={coat} onChange={(e) => setCoat(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm appearance-none">
                            <option value="">เลือกขน...</option>
                            <option>Shorthair</option><option>Longhair</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">หู (Ear)</label>
                        <div className="relative">
                          <select value={ear} onChange={(e) => setEar(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm appearance-none">
                            <option value="">เลือกหู...</option>
                            <option>Straight</option><option>Fold</option><option>Curl</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">ขา (Leg)</label>
                        <div className="relative">
                          <select value={leg} onChange={(e) => setLeg(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm appearance-none">
                            <option value="">เลือกขา...</option>
                            <option>Long Leg</option><option>Short Leg</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">สีตา (Eye)</label>
                        <div className="relative">
                          <select value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:border-pink-400 text-sm font-medium text-gray-700 shadow-sm appearance-none">
                            <option value="">เลือกสีตา...</option>
                            <option>Orange</option><option>Blue</option><option>Green</option><option>Yellow</option><option>Odd Eyed</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* สำหรับหมาและสัตว์อื่นๆ ให้เป็นช่องพิมพ์ปกติเผื่อไว้ครับ */
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">ลวดลาย (Pattern)</label>
                      <input type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-pink-300 text-xs font-medium text-gray-700 shadow-sm" placeholder="เช่น ลายจุด, ทักซิโด้" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">สีตา (Eye Color)</label>
                      <input type="text" value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-pink-300 text-xs font-medium text-gray-700 shadow-sm" placeholder="เช่น ดำ, น้ำตาล" />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ปุ่มบันทึก และ ลบ */}
          <div className="space-y-6 pt-4">
            <div className="flex gap-3">
              <button type="button" onClick={() => router.back()} className="flex-1 text-center py-3.5 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition text-sm">
                ยกเลิก
              </button>
              <button type="submit" disabled={saving || isDeleting} className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-200 transition-all active:scale-95 disabled:opacity-50 text-sm">
                {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข 💾"}
              </button>
            </div>

            {/* ปุ่มลบประวัติ */}
            <div className="pt-6 border-t border-red-50 flex justify-center">
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={isDeleting || saving}
                className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl transition font-bold disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? '⏳ กำลังลบ...' : '🗑️ ลบประวัติน้องถาวร'}
              </button>
            </div>
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