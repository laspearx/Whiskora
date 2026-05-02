"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cropper from "react-easy-crop";

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827',
  inkSoft: '#4B5563',
  muted: '#9CA3AF',
  pink: '#E84677',
  pinkSoft: '#FDF2F5',
  line: '#E5E7EB',
  paper: '#FFFFFF',
};

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Cat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5z"/></svg>,
  Dog: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2 .336-3.5 2-3.5 3.5 0 1.079.49 2.044 1.267 2.688L5 15h5V7c.667-.667 0-1.828 0-1.828z"/><path d="M14.267 9.188C15.044 8.544 15.5 7.579 15.5 6.5c0-1.5-1.5-3.164-3.5-3.5-1.923-.321-3.5.782-3.5 2.172 0 0-.667 1.161 0 1.828"/><path d="M5 15v3a2 2 0 0 0 4 0v-3"/><path d="M14 15v3a2 2 0 0 0 4 0v-3"/><path d="M9 15h6"/></svg>,
  Paw: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>,
};

// 🎮 ข้อมูลสายพันธุ์ (คงเดิม)
const PET_DATA = {
  cat: {
    label: "แมว",
    breeds: ["แมวบ้าน / พันธุ์ผสม (Domestic / Mix Breed)", "โกนจา (Konja)", "ขาวมณี (Khao Manee)", "โคราช / สีสวาด (Korat)", "ดีวอน เร็กซ์ (Devon Rex)", "บริติช ช็อตแฮร์ (British Shorthair)", "เบงกอล (Bengal)", "เปอร์เซีย (Persian)", "มันช์กิ้น (Munchkin)", "เมนคูน (Maine Coon)", "แร็กดอล (Ragdoll)", "วิเชียรมาศ (Siamese)", "ศุภลักษณ์ (Suphalak)", "สก็อตติช โฟลด์ (Scottish Fold)", "สฟิงซ์ (Sphynx)", "อเมริกัน ชอร์ตแฮร์ (American Shorthair)", "เอ็กโซติก ชอร์ตแฮร์ (Exotic Shorthair)", "อื่นๆ"]
  },
  dog: {
    label: "หมา",
    breeds: ["พันธุ์ทาง / พันธุ์ผสม (Mixed Breed)", "คอร์กี้ (Corgi)", "ชิบะ อินุ (Shiba Inu)", "ชิวาวา (Chihuahua)", "ชิสุ (Shih Tzu)", "ซามอยด์ (Samoyed)", "ไซบีเรียน ฮัสกี้ (Siberian Husky)", "แจ็ครัสเซลล์ เทอร์เรีย (Jack Russell)", "ไทยบางแก้ว (Thai Bangkaew)", "ไทยหลังอาน (Thai Ridgeback)", "บีเกิ้ล (Beagle)", "ปอมเมอเรเนียน (Pomeranian)", "พุดเดิ้ลทอย (Toy Poodle)", "เฟรนช์ บูลด็อก (French Bulldog)", "ยอร์กเชียร์ เทอร์เรีย (Yorkshire Terrier)", "ลาบราดอร์ รีทรีฟเวอร์ (Labrador)", "โกลเด้น รีทรีฟเวอร์ (Golden Retriever)", "อเมริกัน บูลลี่ (American Bully)", "อลาสกัน มาลามิวท์ (Alaskan Malamute)", "อื่นๆ"]
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

const COLOR_DATA = {
  cat: ["ขาว (White)", "ดำ (Black)", "เทา / บลู (Grey / Blue)", "ส้ม / แดง (Orange / Red)", "ครีม (Cream)", "น้ำตาล / ช็อกโกแลต (Brown / Chocolate)", "ไลแลค / เทาอมม่วง (Lilac / Lavender)", "สามสี (Calico)", "สีเปรอะ (Tortoiseshell / Tortie)", "สองสี / ลายวัว (Bicolor / Tuxedo)", "สีพ้อยท์ / ลายแต้ม (Colorpoint)", "ลายสลิด / ลายเสือ (Tabby)", "อื่นๆ"],
  dog: ["ดำ (Black)", "ขาว (White)", "น้ำตาล / ช็อกโกแลต (Brown / Chocolate / Liver)", "ทอง / เหลือง (Golden / Yellow)", "ครีม (Cream)", "แดง / น้ำตาลแดง (Red)", "เทา / บลู (Grey / Blue)", "ฟอว์น / น้ำตาลอ่อน (Fawn)", "สามสี (Tricolor)", "ลายหินอ่อน (Merle / Dapple)", "ลายเสือ (Brindle)", "อื่นๆ"],
  other: ["สีเดียวล้วน (Solid Color)", "สองสี (Bicolor)", "หลายสี / ลวดลายผสม (Multi-color)", "เผือก (Albino)", "อื่นๆ"]
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
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<import('react-easy-crop').Area | null>(null);
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

  const onCropComplete = useCallback((ca: import('react-easy-crop').Area, cap: import('react-easy-crop').Area) => setCroppedAreaPixels(cap), []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: import('react-easy-crop').Area): Promise<Blob> => {
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
      const { error: uploadError } = await supabase.storage.from("pet-photos").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("pet-photos").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      setImageSrc(null); 
    } catch (error: unknown) {
      alert("เกิดข้อผิดพลาด: " + (error instanceof Error ? error.message : "อัปโหลดรูปภาพไม่ได้"));
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
    }).select();

    if (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setSaving(false);
    } else if (data && data.length > 0) {
      router.push(`/pets/${data[0].id}`);
      router.refresh();
    }
  };

  return (
    <>
      <style>{`
        .premium-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #ffffff;
          border: 1px solid ${F.line};
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: ${F.ink};
          outline: none;
          transition: all 0.2s;
        }
        .premium-input:focus {
          border-color: ${F.pink};
          box-shadow: 0 0 0 4px ${F.pinkSoft};
        }
        .premium-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: ${F.muted};
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
          margin-left: 0.25rem;
        }
      `}</style>

      <div className="max-w-xl mx-auto px-4 pt-8 pb-24 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/profile" className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
            <Icon.ArrowLeft />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: F.ink }}>Add New Pet</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* 1. Photo Upload Section */}
          <section className="flex flex-col items-center">
            <div className="relative group">
              <div 
                className="w-28 h-28 md:w-32 md:h-32 bg-gray-50 rounded-full overflow-hidden border border-gray-200 shadow-inner flex items-center justify-center cursor-pointer transition-all hover:border-pink-300"
                onClick={() => originalImageSrc ? setImageSrc(originalImageSrc) : fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Pet Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-300">
                    {species === 'cat' ? '🐱'  : species === 'dog' ? '🐶' : '🐾'}
                  </div>
                )}
              </div>
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white transition-transform active:scale-90 hover:opacity-90"
                style={{ background: F.pink }}
              >
                <Icon.Camera />
              </button>
              
              <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} onClick={(e) => (e.currentTarget.value = "")} className="hidden" />
            </div>
            <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {originalImageSrc ? "Tap to reposition" : "Upload Photo"}
            </p>
          </section>

          {/* 2. Basic Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            
            {/* Name */}
            <div>
              <label className="premium-label">ชื่อสัตว์เลี้ยง</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="premium-input" 
                placeholder="เช่น น้องถุงทอง" 
              />
            </div>

            {/* Species Selection */}
            <div>
              <label className="premium-label">ประเภท</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cat", label: "แมว", icon: '🐱'  },
                  { id: "dog", label: "หมา", icon: '🐶' },
                  { id: "other", label: "อื่นๆ", icon: '🐾' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleSpeciesChange(type.id as "cat" | "dog" | "other")}
                    className={`py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      species === type.id 
                      ? 'bg-teal-200 text-teal border-teal-500 shadow-md' 
                      : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <span className="scale-110">{type.icon}</span>
                    <span className="text-[11px] font-bold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Other Pet Types Sub-selection */}
            {species === 'other' && (
              <div className="pt-2">
                <label className="premium-label italic">โปรดเลือกประเภท</label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {PET_DATA.other_pets.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOtherPetText(o.label)}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all
                        ${otherPetText === o.label ? 'border-teal-500 bg-teal-50' : 'border-gray-100 bg-gray-50/50'}`}
                    >
                      <span className="text-xl">{o.emoji}</span>
                      <span className={`text-[9px] font-bold ${otherPetText === o.label ? 'text-teal-600' : 'text-gray-500'}`}>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Detail Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            
            {/* Breed & Color Group */}
            <div className="space-y-6">
              {species !== 'other' && (
                <div>
                  <label className="premium-label">สายพันธุ์</label>
                  <select 
                    value={breed} 
                    onChange={(e) => setBreed(e.target.value)} 
                    className="premium-input appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-[length:20px] bg-[right_10px_center] bg-no-repeat"
                  >
                    <option value="" disabled>เลือกสายพันธุ์...</option>
                    {PET_DATA[species].breeds.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}

              {(breed === "อื่นๆ" || (species === 'other' && otherPetText === "สัตว์อื่นๆ")) && (
                <input type="text" value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} className="premium-input mt-2" placeholder="ระบุสายพันธุ์เพิ่มเติม..." />
              )}

              <div>
                <label className="premium-label">สี / ลวดลาย</label>
                <select 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className="premium-input appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-[length:20px] bg-[right_10px_center] bg-no-repeat"
                >
                  <option value="" disabled>เลือกสี...</option>
                  {COLOR_DATA[species === 'other' ? 'other' : species].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {color === "อื่นๆ" && (
                <input type="text" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="premium-input mt-2" placeholder="ระบุสีด้วยตนเอง..." />
              )}
            </div>

            {/* Gender & Birthdate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="premium-label">เพศ</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setGender('male')} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${gender === 'male' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-100 text-gray-400'}`}>Male</button>
                  <button type="button" onClick={() => setGender('female')} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${gender === 'female' ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-gray-100 text-gray-400'}`}>Female</button>
                </div>
              </div>
              <div>
                <label className="premium-label">วันเกิด</label>
                <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="premium-input h-[42px]" />
              </div>
            </div>

            {/* Health & Traits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="premium-label">สิ่งที่แพ้</label>
                <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} className="premium-input" placeholder="ถ้ามี..." />
              </div>
              <div>
                <label className="premium-label">หมายเหตุ</label>
                <input type="text" value={traits} onChange={(e) => setTraits(e.target.value)} className="premium-input" placeholder="นิสัยส่วนตัว..." />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Link href="/profile" className="flex-1 text-center py-4 rounded-xl font-bold text-sm text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={saving} 
              className="flex-[2] py-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
              style={{ background: F.ink }}
            >
              {saving ? "Saving..." : "Add to My Pets"}
            </button>
          </div>
        </form>
      </div>

      {/* Image Crop Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative w-full h-80 bg-gray-900">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-6 space-y-6">
              <div className="px-2">
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-pink-600" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setImageSrc(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition text-xs uppercase tracking-widest">Cancel</button>
                <button type="button" onClick={handleUploadCroppedImage} disabled={isUploading} className="flex-1 py-3 rounded-xl font-bold text-white transition text-xs uppercase tracking-widest" style={{ background: F.pink }}>
                  {isUploading ? 'Uploading...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}