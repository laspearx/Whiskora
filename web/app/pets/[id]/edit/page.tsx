"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
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
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Dna: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.598 3.597-1.198 5.397 0"/><path d="M9 2c1.798 1.598 3.597 1.198 5.397 0"/><path d="M2 9c6.667 6 13.333 0 20 6"/><path d="M12 10v4"/><path d="M16 11v2"/><path d="M8 11v2"/></svg>,
  Shop: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
};

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
    { id: "rabbit", label: "กระต่าย", emoji: "🐰" }, { id: "hamster", label: "หนูแฮมสเตอร์", emoji: "🐹" },
    { id: "bird", label: "นก", emoji: "🦜" }, { id: "squirrel", label: "กระรอก", emoji: "🐿️" },
    { id: "hedgehog", label: "เม่นแคระ", emoji: "🦔" }, { id: "fish", label: "ปลา", emoji: "🐟" },
    { id: "turtle", label: "เต่า", emoji: "🐢" }, { id: "frog", label: "กบ", emoji: "🐸" },
    { id: "lizard", label: "กิ้งก่า", emoji: "🦎" }, { id: "snake", label: "งู", emoji: "🐍" },
    { id: "raccoon", label: "แร็กคูน", emoji: "🦝" }, { id: "other", label: "สัตว์แปลกอื่นๆ", emoji: "🐾" },
  ]
};

const COLOR_DATA = {
  dog: ["ดำ (Black)", "ขาว (White)", "น้ำตาล / ช็อกโกแลต (Brown / Chocolate / Liver)", "ทอง / เหลือง (Golden / Yellow)", "ครีม (Cream)", "แดง / น้ำตาลแดง (Red)", "เทา / บลู (Grey / Blue)", "ฟอว์น / น้ำตาลอ่อน (Fawn)", "สามสี (Tricolor)", "ลายหินอ่อน (Merle / Dapple)", "ลายเสือ (Brindle)", "อื่นๆ"],
  other: ["สีเดียวล้วน (Solid Color)", "สองสี (Bicolor)", "หลายสี / ลวดลายผสม (Multi-color)", "เผือก (Albino)", "อื่นๆ"]
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
      if (!session) return router.push("/login");
      setUserId(session.user.id);

      const { data, error } = await supabase.from("pets").select("*").eq("id", petId).eq("user_id", session.user.id).single();

      if (error || !data) {
        alert("หาข้อมูลสัตว์เลี้ยงไม่พบ หรือคุณไม่มีสิทธิ์แก้ไข");
        return router.push("/profile");
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
      if (data.species === "แมว" || data.species === "cat") { currentSpecies = "cat"; setSpecies("cat"); } 
      else if (data.species === "หมา" || data.species === "dog") { currentSpecies = "dog"; setSpecies("dog"); } 
      else { setSpecies("other"); setOtherPetText(data.species || ""); }

      const petBreed = data.breed || "";
      if (currentSpecies === "cat" || currentSpecies === "dog") {
        if (PET_DATA[currentSpecies].breeds.includes(petBreed)) setBreed(petBreed);
        else { setBreed("อื่นๆ"); setCustomBreed(petBreed); }
      } else setCustomBreed(petBreed);

      const petColor = data.color || "";
      if (currentSpecies !== "cat" && COLOR_DATA[currentSpecies]?.includes(petColor)) setColor(petColor);
      else if (petColor) setColor(petColor);

      setIsFetching(false);
    };

    if (petId) fetchPetData();
  }, [petId, router]);

  const handleSpeciesChange = (type: "cat" | "dog" | "other") => {
    setSpecies(type);
    setOtherPetText(""); setBreed(""); setCustomBreed(""); setColor(""); setCustomColor("");
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
      const { error: uploadError } = await supabase.storage.from("pet-photos").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("pet-photos").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      setImageSrc(null);
    } catch (error: any) {
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
      name, species: finalSpecies, breed: finalBreed || null, color: finalColor || null,
      gender, birth_date: birthdate || null, image_url: avatarUrl, allergies: allergies || null,
      traits: traits || null, status: status || null, price: price === "" ? null : Number(price),
      pattern: pattern || null, coat: coat || null, ear: ear || null, leg: leg || null, eye_color: eyeColor || null,
    }).eq("id", petId);

    if (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      setSaving(false);
    } else {
      router.push(`/pets/${petId}`);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    const isConfirm = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประวัติของ "${name}" ทิ้ง?\n(หากลบแล้ว ข้อมูลจะไม่สามารถกู้คืนได้)`);
    if (!isConfirm || !userId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("pets").delete().eq("id", petId).eq("user_id", userId);
      if (error) throw error;
      router.push('/profile'); 
    } catch (error: any) {
      alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
      setIsDeleting(false);
    }
  };

  if (isFetching) return <div className="min-h-screen flex items-center justify-center text-sm font-semibold tracking-widest text-gray-400 animate-pulse uppercase">Loading Editor...</div>;

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
        .premium-input:focus { border-color: ${F.pink}; box-shadow: 0 0 0 4px ${F.pinkSoft}; }
        .premium-label {
          display: block; font-size: 0.75rem; font-weight: 700; color: ${F.muted};
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; margin-left: 0.25rem;
        }
        .select-icon {
          background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=');
          background-size: 20px; background-position: right 10px center; background-repeat: no-repeat; appearance: none;
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-24 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => router.back()} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
            <Icon.ArrowLeft />
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: F.ink }}>Edit Profile</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* 1. Photo Upload */}
          <section className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div 
                className="w-28 h-28 md:w-32 md:h-32 bg-gray-50 rounded-full overflow-hidden border border-gray-200 shadow-inner flex items-center justify-center cursor-pointer transition-all hover:border-pink-300"
                onClick={() => originalImageSrc ? setImageSrc(originalImageSrc) : fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Pet Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-300">
                    {species === 'cat' ? <Icon.Cat /> : species === 'dog' ? <Icon.Dog /> : <Icon.Paw />}
                  </div>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white transition-transform active:scale-90 hover:opacity-90"
                style={{ background: F.ink }}
              >
                <Icon.Camera />
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} onClick={(e) => (e.currentTarget.value = "")} className="hidden" />
            </div>
            <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {originalImageSrc ? "Tap to reposition" : "Change Photo"}
            </p>
          </section>

          {/* 2. Basic Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <label className="premium-label">ชื่อสัตว์เลี้ยง</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="premium-input" placeholder="เช่น น้องถุงทอง" />
            </div>

            <div>
              <label className="premium-label">ประเภท</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cat", label: "แมว", icon: '🐱' },
                  { id: "dog", label: "หมา", icon: '🐶' },
                  { id: "other", label: "อื่นๆ", icon: '🐾' }
                ].map((type) => (
                  <button
                    key={type.id} type="button" onClick={() => handleSpeciesChange(type.id as any)}
                    className={`py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      species === type.id ? 'bg-teal-200 text-teal border-teal-500 shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <span className="scale-110">{type.icon}</span>
                    <span className="text-[11px] font-bold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {species === 'other' && (
              <div className="pt-2">
                <label className="premium-label italic">โปรดเลือกประเภท</label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {PET_DATA.other_pets.map((o) => (
                    <button
                      key={o.id} type="button" onClick={() => setOtherPetText(o.label)}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all
                        ${otherPetText === o.label ? 'border-teal-500 bg-teal-50' : 'border-gray-100 bg-gray-50/50'}`}
                    >
                      <span className="text-xl">{o.emoji}</span>
                      <span className={`text-[9px] font-bold ${otherPetText === o.label ? 'text-pink-600' : 'text-gray-500'}`}>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Detail Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-6">
              {species !== 'other' && (
                <div>
                  <label className="premium-label">สายพันธุ์</label>
                  <select value={breed} onChange={(e) => setBreed(e.target.value)} className="premium-input select-icon">
                    <option value="" disabled>เลือกสายพันธุ์...</option>
                    {PET_DATA[species].breeds.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}
              {(breed === "อื่นๆ" || (species === 'other' && otherPetText === "สัตว์แปลกอื่นๆ")) && (
                <input type="text" value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} className="premium-input mt-2" placeholder="ระบุสายพันธุ์เพิ่มเติม..." />
              )}

              {species !== 'cat' && (
                <>
                  <div>
                    <label className="premium-label">สี (Color)</label>
                    <select value={color} onChange={(e) => setColor(e.target.value)} className="premium-input select-icon">
                      <option value="" disabled>เลือกสี...</option>
                      {COLOR_DATA[species as 'dog' | 'other']?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {color === "อื่นๆ" && (
                    <input type="text" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="premium-input mt-2" placeholder="ระบุสีด้วยตนเอง..." />
                  )}
                </>
              )}
            </div>

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

          {/* 4. Farm & Genetics Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold flex items-center gap-2 pb-2 border-b border-gray-50" style={{ color: F.ink }}>
              <span className="text-gray-400"><Icon.Shop /></span> ข้อมูลฟาร์ม & พันธุกรรม
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="premium-label">สถานะในฟาร์ม</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="premium-input select-icon">
                  <option value="">เด็กในบ้าน (ทั่วไป)</option>
                  <option value="พ่อพันธุ์ / แม่พันธุ์">พ่อพันธุ์ / แม่พันธุ์</option>
                  <option value="พร้อมย้ายบ้าน">พร้อมย้ายบ้าน</option>
                </select>
              </div>
              {status === "พร้อมย้ายบ้าน" && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <label className="premium-label" style={{ color: F.pink }}>ค่าตัว / สินสอด (บาท)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="premium-input bg-pink-50 border-pink-100 text-pink-700 font-bold focus:bg-white" placeholder="เช่น 15000" />
                </div>
              )}
            </div>

            <div className="pt-4 space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5"><Icon.Dna /> ลักษณะทางพันธุกรรม (Traits)</h4>
              
              {species === 'cat' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="premium-label">สี (Color)</label>
                      <select value={color} onChange={(e) => setColor(e.target.value)} className="premium-input select-icon">
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
                      {color === "อื่นๆ" && <input type="text" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="premium-input mt-2" placeholder="พิมพ์ระบุสีด้วยตัวเอง..." />}
                    </div>
                    <div>
                      <label className="premium-label">แพทเทิร์น (Pattern)</label>
                      <select value={pattern} onChange={(e) => setPattern(e.target.value)} className="premium-input select-icon">
                        <option value="">เลือกแพทเทิร์น...</option>
                        <option>Solid</option><option>Bicolour</option><option>Van</option><option>Harlequin</option>
                        <option>Classic Tabby</option><option>Mackerel Tabby</option><option>Spotted Tabby</option>
                        <option>Ticked Tabby</option><option>Shaded</option><option>Shell</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="premium-label">ขน (Coat)</label>
                      <select value={coat} onChange={(e) => setCoat(e.target.value)} className="premium-input select-icon"><option value="">เลือก...</option><option>Shorthair</option><option>Longhair</option></select>
                    </div>
                    <div>
                      <label className="premium-label">หู (Ear)</label>
                      <select value={ear} onChange={(e) => setEar(e.target.value)} className="premium-input select-icon"><option value="">เลือก...</option><option>Straight</option><option>Fold</option><option>Curl</option></select>
                    </div>
                    <div>
                      <label className="premium-label">ขา (Leg)</label>
                      <select value={leg} onChange={(e) => setLeg(e.target.value)} className="premium-input select-icon"><option value="">เลือก...</option><option>Long Leg</option><option>Short Leg</option></select>
                    </div>
                    <div>
                      <label className="premium-label">สีตา (Eye)</label>
                      <select value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} className="premium-input select-icon"><option value="">เลือก...</option><option>Orange</option><option>Blue</option><option>Green</option><option>Yellow</option><option>Odd Eyed</option></select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="premium-label">ลวดลาย (Pattern)</label>
                    <input type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} className="premium-input" placeholder="เช่น ลายจุด, ทักซิโด้" />
                  </div>
                  <div>
                    <label className="premium-label">สีตา (Eye Color)</label>
                    <input type="text" value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} className="premium-input" placeholder="เช่น ดำ, น้ำตาล" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => router.back()} className="flex-1 py-4 rounded-xl font-bold text-sm text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving || isDeleting} className="flex-[2] py-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all active:scale-95 disabled:opacity-50" style={{ background: F.ink }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Delete Action (Ghost Button) */}
          <div className="pt-6 pb-4 flex justify-center">
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={isDeleting || saving}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-colors border border-red-100 text-red-500 bg-white hover:bg-red-50 disabled:opacity-50"
            >
              <Icon.Trash /> {isDeleting ? 'Deleting...' : 'Delete Pet Profile'}
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
                <button type="button" onClick={handleUploadCroppedImage} disabled={isUploading} className="flex-1 py-3 rounded-xl font-bold text-white transition text-xs uppercase tracking-widest" style={{ background: F.ink }}>
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