"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Cropper from "react-easy-crop";
import { OTHER_SPECIES, speciesTh, speciesIcon } from "@/lib/species";
import { PET_GENDER, type PetGender } from "@/lib/constants";

const F = {
  ink: '#1f1a1c', inkSoft: '#4a3f44', muted: '#8e7e84',
  pink: '#e84677', pinkDeep: '#c4325f', pinkSoft: '#fde2ea',
  line: '#f3dde3', lineMid: '#ead6de', paper: '#fdf0f3', cream: '#fffafc',
};

// ─── สายพันธุ์ตามชนิดสัตว์ ───
const breedData: Record<string, string[]> = {
  cat: ["แมวบ้าน / พันธุ์ผสม (Domestic / Mix)", "โกนจา (Konja)", "ขาวมณี (Khao Manee)", "โคราช / สีสวาด (Korat)", "ดีวอน เร็กซ์ (Devon Rex)", "บริติช ช็อตแฮร์ (British Shorthair)", "เบงกอล (Bengal)", "เปอร์เซีย (Persian)", "มันช์กิ้น (Munchkin)", "เมนคูน (Maine Coon)", "แร็กดอล (Ragdoll)", "วิเชียรมาศ (Siamese)", "ศุภลักษณ์ (Suphalak)", "สก็อตติช โฟลด์ (Scottish Fold)", "สฟิงซ์ (Sphynx)", "อเมริกัน ชอร์ตแฮร์ (American Shorthair)", "เอ็กโซติก ชอร์ตแฮร์ (Exotic Shorthair)", "อื่นๆ"],
  dog: ["พันธุ์ทาง / พันธุ์ผสม (Mixed)", "คอร์กี้ (Corgi)", "ชิบะ อินุ (Shiba Inu)", "ชิวาวา (Chihuahua)", "ชิสุ (Shih Tzu)", "ซามอยด์ (Samoyed)", "ไซบีเรียน ฮัสกี้ (Siberian Husky)", "แจ็ครัสเซลล์ เทอร์เรีย (Jack Russell)", "ไทยบางแก้ว (Thai Bangkaew)", "ไทยหลังอาน (Thai Ridgeback)", "บีเกิ้ล (Beagle)", "ปอมเมอเรเนียน (Pomeranian)", "พุดเดิ้ลทอย (Toy Poodle)", "เฟรนช์ บูลด็อก (French Bulldog)", "ยอร์กเชียร์ เทอร์เรีย (Yorkshire Terrier)", "ลาบราดอร์ รีทรีฟเวอร์ (Labrador)", "โกลเด้น รีทรีฟเวอร์ (Golden Retriever)", "อเมริกัน บูลลี่ (American Bully)", "อลาสกัน มาลามิวท์ (Alaskan Malamute)", "อื่นๆ"],
  rabbit: ["ฮอลแลนด์ ลอป (Holland Lop)", "เนเธอร์แลนด์ ดวอร์ฟ (Netherland Dwarf)", "มินิเร็กซ์ (Mini Rex)", "ไลอ้อนเฮด (Lionhead)", "อิงลิช แองโกร่า (English Angora)", "เฟรนช์ ลอป (French Lop)", "อื่นๆ"],
  hamster: ["วินเทอร์ไวท์ (Winter White)", "ไซเรียน (Syrian)", "โรโบรอฟสกี (Roborovski)", "แคมป์เบลล์ (Campbell)", "อื่นๆ"],
  bird: ["ฟอพัส (Forpus)", "ค็อกคาเทล (Cockatiel)", "ซันคอนัวร์ (Sun Conure)", "เลิฟเบิร์ด (Lovebird)", "หงส์หยก (Budgerigar)", "แอฟริกันเกรย์ (African Grey)", "มาคอว์ (Macaw)", "กรีนชีค (Green Cheek)", "อื่นๆ"],
  squirrel: ["กระรอกบิน (Flying Squirrel)", "ชูการ์ไกลเดอร์ (Sugar Glider)", "แพรี่ด็อก (Prairie Dog)", "กระรอกดง (Finlayson's)", "อื่นๆ"],
  hedgehog: ["เม่นแคระแอฟริกัน (African Pygmy)", "อื่นๆ"],
  fish: ["ปลากัด (Betta)", "ปลาคาร์ป (Koi)", "ปลาทอง (Goldfish)", "ปลาหางนกยูง (Guppy)", "ปลาหมอสี (Flowerhorn)", "ปลามังกร (Arowana)", "อื่นๆ"],
  turtle: ["ซูคาต้า (Sulcata)", "ดาวอินเดีย (Indian Star)", "อัลดราบร้า (Aldabra)", "เต่าญี่ปุ่น (Red-eared Slider)", "เต่าหมูบิน (Pig-nosed)", "อื่นๆ"],
  frog: ["ฮอร์นฟร็อก (Horned Frog)", "ไวท์ทรีฟร็อก (White's Tree Frog)", "อึ่งแม่หนาว (Chubby Frog)", "กบลูกศรพิษ (Poison Dart)", "อื่นๆ"],
  lizard: ["เบียร์ดดราก้อน (Bearded Dragon)", "เตกู (Tegu)", "อีกัวน่า (Iguana)", "คาเมเลี่ยน (Chameleon)", "เครสเตดเกตุโก (Crested Gecko)", "เลพเพิร์ดเกตุโก (Leopard Gecko)", "อื่นๆ"],
  snake: ["คอร์นสเนค (Corn Snake)", "บอลไพธอน (Ball Python)", "ฮ็อกโนส (Hognose)", "คิงสเนค (King Snake)", "มิลค์สเนค (Milk Snake)", "อื่นๆ"],
  raccoon: ["แร็กคูน (Raccoon)", "อื่นๆ"],
  other: ["เมียร์แคต (Meerkat)", "เฟอร์เรท (Ferret)", "ชินชิลล่า (Chinchilla)", "บุชเบบี้ (Bushbaby)", "อื่นๆ"],
};

// ─── สี (สีพื้น) / ลาย / หู / ขา / ขน / สีตา (อ้างอิงชาร์ต Housecat) ───
const COLOR_DATA: Record<string, string[]> = {
  cat: ["ดำ (Black)", "บลู / เทา (Blue / Grey)", "ช็อกโกแลต (Chocolate)", "ไลแลค (Lilac)", "ซินนามอน (Cinnamon)", "ฟอว์น (Fawn)", "แดง / ส้ม (Red / Orange)", "ครีม (Cream)", "ขาว (White)", "ทอร์ตี้ / สีเปรอะ (Tortoiseshell)", "อื่นๆ"],
  dog: ["ดำ (Black)", "ขาว (White)", "น้ำตาล / ช็อกโกแลต (Brown / Chocolate)", "ทอง / เหลือง (Golden / Yellow)", "ครีม (Cream)", "แดง / น้ำตาลแดง (Red)", "เทา / บลู (Grey / Blue)", "ฟอว์น (Fawn)", "สามสี (Tricolor)", "ลายหินอ่อน (Merle)", "ลายเสือ (Brindle)", "อื่นๆ"],
  other: ["ดำ (Black)", "ขาว (White)", "น้ำตาล (Brown)", "เทา (Grey)", "ครีม (Cream)", "หลายสี (Multi-color)", "เผือก (Albino)", "อื่นๆ"],
};
const PATTERN_DATA: Record<string, string[]> = {
  cat: ["สีเดียวล้วน (Solid)", "ลายสลิด-แมคเคอเรล (Mackerel Tabby)", "ลายสลิด-คลาสสิก (Classic Tabby)", "ลายจุด (Spotted Tabby)", "ลายทิคต์ (Ticked Tabby)", "สีแต้ม / พ้อยท์ (Colorpoint)", "สองสี / ขาวแต้ม (Bicolor)", "ทอร์ตี้ (Tortie)", "สามสี / แคลิโค (Calico)", "ทิปปิ้ง-ชินชิลล่า (Chinchilla)", "ทิปปิ้ง-เฉดเดด (Shaded)", "ทิปปิ้ง-สโมก (Smoke)", "อื่นๆ"],
  default: ["สีเดียวล้วน (Solid)", "สองสี (Bicolor)", "หลายสี / ลวดลายผสม (Multi-color)", "เผือก (Albino)", "อื่นๆ"],
};
const EYE_OPTIONS = ["เขียว (Green)", "เฮเซล (Hazel)", "ทอง (Gold)", "เหลือง (Yellow)", "อำพัน (Amber)", "ส้ม (Orange)", "คอปเปอร์ (Copper)", "ฟ้า (Blue)", "ตาสองสี (Odd-eyed)", "ตาหลายสีในดวงเดียว (Dichroic)", "อื่นๆ"];
const EAR_OPTIONS = ["หูตั้ง", "หูพับ", "หูพลิก"];
const LEG_OPTIONS = ["ขาสั้น", "ขายาว"];
const COAT_OPTIONS = ["ขนสั้น", "ขนยาว", "ขนหยิก", "ไม่มีขน"];

const colorOptionsFor = (s: string) => COLOR_DATA[s] || COLOR_DATA.other;
const patternOptionsFor = (s: string) => PATTERN_DATA[s] || PATTERN_DATA.default;


// ─── Icons ───
const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

function CreatePetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRedirect = searchParams.get("redirect");

  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // ฟอร์ม
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<string>("cat");
  const [pickOther, setPickOther] = useState(false);
  const [breed, setBreed] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [color, setColor] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [pattern, setPattern] = useState("");
  const [ear, setEar] = useState("");
  const [leg, setLeg] = useState("");
  const [coat, setCoat] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [gender, setGender] = useState<PetGender>(PET_GENDER.MALE);
  const [birthdate, setBirthdate] = useState("");
  const [weight, setWeight] = useState("");
  const [allergies, setAllergies] = useState("");
  const [traits, setTraits] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // ครอปรูป
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
      if (!session) router.push(`/register?redirect=${encodeURIComponent('/pets/create')}`);
      else setUserId(session.user.id);
    };
    checkUser();
  }, [router]);

  const speciesKey = breedData[species] ? species : 'other';
  const colorKey = species === 'cat' ? 'cat' : species === 'dog' ? 'dog' : 'other';
  const isCat = species === 'cat';

  const pickSpecies = (s: string) => {
    setSpecies(s); setPickOther(false);
    setBreed(""); setCustomBreed(""); setColor(""); setCustomColor("");
    setPattern(""); setEar(""); setLeg(""); setCoat(""); setEyeColor("");
  };

  // ── รูป ──
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => { setImageSrc(reader.result as string); setOriginalImageSrc(reader.result as string); });
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  const onCropComplete = useCallback((_ca: any, cap: any) => setCroppedAreaPixels(cap), []);
  const getCroppedImg = async (src: string, pc: any): Promise<Blob> => {
    const image = new Image(); image.src = src;
    await new Promise((res) => (image.onload = res));
    const canvas = document.createElement("canvas");
    canvas.width = pc.width; canvas.height = pc.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");
    ctx.drawImage(image, pc.x, pc.y, pc.width, pc.height, 0, 0, pc.width, pc.height);
    return new Promise((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("empty")), "image/jpeg", 0.9));
  };
  const handleUploadCropped = async () => {
    try {
      setIsUploading(true);
      if (!userId || !imageSrc || !croppedAreaPixels) return;
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const fileName = `pet-${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;
      const file = new File([blob], fileName, { type: "image/jpeg" });
      const { error } = await supabase.storage.from("pet-photos").upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("pet-photos").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      setImageSrc(null);
    } catch (err: any) {
      alert("อัปโหลดรูปไม่สำเร็จ: " + (err.message || ''));
    } finally { setIsUploading(false); }
  };

  // ── บันทึก (ไม่มี status — สัตว์ส่วนตัว) ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("กรุณากรอกชื่อสัตว์เลี้ยง");
    setSaving(true);

    const finalSpecies = species;
    const finalBreed = breed === 'อื่นๆ' ? customBreed : breed;
    const finalColor = color === 'อื่นๆ' ? customColor : color;

    const { data, error } = await supabase.from("pets").insert({
      user_id: userId,
      name: name.trim(),
      species: finalSpecies,
      breed: finalBreed || null,
      color: finalColor || null,
      pattern: pattern || null,
      ear: ear || null,
      leg: leg || null,
      coat: coat || null,
      eye_color: eyeColor || null,
      gender,
      birth_date: birthdate || null,
      weight: weight ? Number(weight) : null,
      image_url: avatarUrl,
      allergies: allergies.trim() || null,
      traits: traits.trim() || null,
      is_public: true,
    }).select();

    if (error) {
      alert("บันทึกไม่สำเร็จ: " + error.message);
      setSaving(false);
    } else if (data && data.length > 0) {
      router.push(`/pets/${data[0].id}`);
      router.refresh();
    }
  };

  return (
    <>
      <style>{`
        @keyframes cp-rise { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing: border-box; }
        .cp-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .cp-body { max-width: 680px; margin: 0 auto; padding: 24px 20px 120px; animation: cp-rise .4s ease both; }

        /* ── header ── */
        .cp-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .cp-back { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 12px; background: white; color: ${F.ink}; cursor: pointer; border: 1px solid ${F.line}; transition: all .15s; flex-shrink: 0; }
        .cp-back:hover { background: ${F.paper}; transform: translateX(-1px); }
        .cp-title { font-family: inherit; font-size: 22px; font-weight: 600; color: ${F.ink}; line-height: 1.2; letter-spacing: -0.01em; }
        .cp-sub { font-size: 13px; font-weight: 400; color: ${F.muted}; margin-top: 2px; }

        /* ── photo ── */
        .cp-photo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
        .cp-photo { position: relative; }
        .cp-photo-circle { width: 110px; height: 110px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; border: 3px solid white; box-shadow: 0 4px 16px rgba(232,70,119,0.12); display: flex; align-items: center; justify-content: center; font-size: 40px; cursor: pointer; transition: box-shadow .18s; }
        .cp-photo-circle:hover { box-shadow: 0 6px 22px rgba(232,70,119,0.2); }
        .cp-photo-circle img { width: 100%; height: 100%; object-fit: cover; }
        .cp-photo-btn { position: absolute; bottom: 2px; right: 2px; width: 34px; height: 34px; border-radius: 50%; background: ${F.pink}; color: white; border: 2px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
        .cp-photo-btn:hover { background: ${F.pinkDeep}; }
        .cp-photo-hint { margin-top: 10px; font-size: 12px; font-weight: 400; color: ${F.muted}; }

        /* ── card ── */
        .cp-card { background: rgba(255,255,255,.94); border: 1px solid ${F.line}; border-radius: 18px; padding: 20px; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(31,26,28,.03); }
        .cp-card-title { font-family: inherit; font-size: 14px; font-weight: 600; color: ${F.ink}; margin-bottom: 16px; }

        /* ── fields ── */
        .cp-field { margin-bottom: 14px; }
        .cp-field:last-child { margin-bottom: 0; }
        .cp-label { display: block; font-size: 12px; font-weight: 500; color: ${F.muted}; margin-bottom: 6px; margin-left: 1px; }
        .cp-label .opt { font-weight: 400; }
        .cp-input, .cp-select { width: 100%; padding: 11px 14px; background: white; border: 1px solid ${F.line}; border-radius: 12px; font-size: 14px; font-weight: 400; color: ${F.ink}; outline: none; transition: border-color .15s, box-shadow .15s; font-family: inherit; }
        .cp-input::placeholder { color: ${F.muted}; }
        .cp-input:focus, .cp-select:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .cp-select { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238e7e84' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; padding-right: 36px; cursor: pointer; }
        .cp-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cp-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

        /* ── species picker ── */
        .cp-species { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .cp-species-btn { padding: 14px 8px; border-radius: 14px; border: 1px solid ${F.line}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all .15s; font-family: inherit; }
        .cp-species-btn.active { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .cp-species-btn .lbl { font-size: 12px; font-weight: 500; color: ${F.muted}; }
        .cp-species-btn.active .lbl { color: ${F.pinkDeep}; font-weight: 600; }

        /* ── other pets grid ── */
        .cp-other-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin-top: 10px; }
        .cp-other-btn { padding: 10px 4px; border-radius: 11px; border: 1px solid ${F.line}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; transition: all .15s; font-family: inherit; }
        .cp-other-btn.active { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .cp-other-btn .lbl { font-size: 9px; font-weight: 400; color: ${F.muted}; text-align: center; line-height: 1.2; }
        .cp-other-btn.active .lbl { color: ${F.pinkDeep}; font-weight: 500; }

        /* ── gender toggle ── */
        .cp-gender { display: flex; gap: 8px; }
        .cp-gender-btn { flex: 1; padding: 11px 6px; border-radius: 12px; border: 1px solid ${F.line}; background: white; cursor: pointer; font-size: 13px; font-weight: 400; color: ${F.muted}; transition: all .15s; font-family: inherit; white-space: nowrap; text-align: center; }
        .cp-gender-btn.male.active { border-color: #93c5fd; background: #eff6ff; color: #2563eb; font-weight: 500; }
        .cp-gender-btn.female.active { border-color: ${F.pink}; background: ${F.pinkSoft}; color: ${F.pinkDeep}; font-weight: 500; }

        /* ── save bar ── */
        .cp-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,0.92); backdrop-filter: blur(16px); border-top: 1px solid ${F.line}; padding: 12px 20px; }
        .cp-savebar-inner { max-width: 680px; margin: 0 auto; display: flex; gap: 10px; }
        .cp-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px; border-radius: 14px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all .15s; font-family: inherit; text-decoration: none; }
        .cp-btn-cancel { flex: 0 0 auto; padding: 13px 20px; background: white; color: ${F.muted}; border: 1px solid ${F.line}; }
        .cp-btn-cancel:hover { background: ${F.paper}; color: ${F.ink}; }
        .cp-btn-save { background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.25); font-weight: 600; }
        .cp-btn-save:hover { background: ${F.pinkDeep}; }
        .cp-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── crop modal ── */
        .cp-modal { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(31,26,28,0.55); backdrop-filter: blur(6px); padding: 16px; }
        .cp-modal-card { background: white; width: 100%; max-width: 380px; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(31,26,28,0.25); }
        .cp-crop-area { position: relative; width: 100%; height: 320px; background: #111; }
        .cp-modal-body { padding: 18px; }
        .cp-zoom { width: 100%; accent-color: ${F.pink}; margin-bottom: 14px; }
        .cp-modal-btns { display: flex; gap: 10px; }

        @media (max-width: 480px) {
          .cp-grid2 { grid-template-columns: 1fr; }
          .cp-grid3 { grid-template-columns: 1fr 1fr; }
          .cp-other-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div className="cp-page">
        <div className="cp-body">
          {/* Header */}
          <div className="cp-header">
            <button className="cp-back" onClick={() => router.push(fromRedirect && fromRedirect.startsWith('/') ? fromRedirect : '/profile')} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="cp-title">เพิ่มสัตว์เลี้ยง</h1>
              <p className="cp-sub">เพิ่มเพื่อนรักเข้าสู่ครอบครัวของคุณ</p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            {/* รูป */}
            <div className="cp-photo-wrap">
              <div className="cp-photo">
                <div className="cp-photo-circle" onClick={() => originalImageSrc ? setImageSrc(originalImageSrc) : fileInputRef.current?.click()}>
                  {avatarUrl ? <img src={avatarUrl} alt="รูปสัตว์เลี้ยง" /> : <img src={speciesIcon(species || 'other')} alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />}
                </div>
                <button type="button" className="cp-photo-btn" onClick={() => fileInputRef.current?.click()}><Icon.Camera /></button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} onClick={(e) => (e.currentTarget.value = "")} style={{ display: 'none' }} />
              </div>
              <p className="cp-photo-hint">{originalImageSrc ? "แตะเพื่อปรับตำแหน่งรูป" : "อัปโหลดรูปภาพ"}</p>
            </div>

            {/* การ์ด 1: ข้อมูลพื้นฐาน */}
            <div className="cp-card">
              <div className="cp-card-title">ข้อมูลพื้นฐาน</div>

              <div className="cp-field">
                <label className="cp-label">ชื่อสัตว์เลี้ยง</label>
                <input className="cp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น น้องถุงทอง" required />
              </div>

              <div className="cp-field">
                <label className="cp-label">ประเภท</label>
                <div className="cp-species">
                  {[{ id: 'cat', icon: speciesIcon('cat'), lbl: 'แมว' }, { id: 'dog', icon: speciesIcon('dog'), lbl: 'หมา' }, { id: 'other', icon: speciesIcon('other'), lbl: 'อื่นๆ' }].map((t) => {
                    const active = t.id === 'other' ? (pickOther || (species !== 'cat' && species !== 'dog')) : species === t.id;
                    return (
                      <button key={t.id} type="button" className={`cp-species-btn ${active ? 'active' : ''}`}
                        onClick={() => t.id === 'other' ? (setPickOther(true), setSpecies(''), setBreed(''), setColor(''), setPattern(''), setEar(''), setLeg(''), setCoat(''), setEyeColor('')) : pickSpecies(t.id)}>
                        <img src={t.icon} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                        <span className="lbl">{t.lbl}</span>
                      </button>
                    );
                  })}
                </div>

                {(pickOther || (species !== 'cat' && species !== 'dog')) && (
                  <div className="cp-other-grid">
                    {OTHER_SPECIES.map((o) => (
                      <button key={o.id} type="button" className={`cp-other-btn ${species === o.id ? 'active' : ''}`}
                        onClick={() => { setSpecies(o.id); setPickOther(false); setBreed(''); setColor(''); setPattern(''); setEar(''); setLeg(''); setCoat(''); setEyeColor(''); }}>
                        <img src={o.icon} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                        <span className="lbl">{o.th}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="cp-grid2">
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">เพศ</label>
                  <div className="cp-gender">
                    <button type="button" className={`cp-gender-btn male ${gender === PET_GENDER.MALE ? 'active' : ''}`} onClick={() => setGender(PET_GENDER.MALE)}>♂ ตัวผู้</button>
                    <button type="button" className={`cp-gender-btn female ${gender === PET_GENDER.FEMALE ? 'active' : ''}`} onClick={() => setGender(PET_GENDER.FEMALE)}>♀ ตัวเมีย</button>
                  </div>
                </div>
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">วันเกิด <span className="opt">(ถ้าทราบ)</span></label>
                  <input type="date" className="cp-input" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* การ์ด 2: ลักษณะ */}
            <div className="cp-card">
              <div className="cp-card-title">ลักษณะและรูปพรรณ</div>

              {(species === 'cat' || species === 'dog' || breedData[species]) && (
                <div className="cp-field">
                  <label className="cp-label">สายพันธุ์</label>
                  <select className="cp-select" value={breed} onChange={(e) => setBreed(e.target.value)}>
                    <option value="">เลือกสายพันธุ์...</option>
                    {(breedData[speciesKey] || []).map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {breed === 'อื่นๆ' && (
                    <input className="cp-input" style={{ marginTop: 8 }} value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} placeholder="ระบุสายพันธุ์เพิ่มเติม..." />
                  )}
                </div>
              )}

              <div className="cp-grid2">
                <div className="cp-field">
                  <label className="cp-label">สี (สีพื้น)</label>
                  <select className="cp-select" value={color} onChange={(e) => setColor(e.target.value)}>
                    <option value="">เลือกสี...</option>
                    {colorOptionsFor(colorKey).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="cp-field">
                  <label className="cp-label">ลาย / ลวดลาย</label>
                  <select className="cp-select" value={pattern} onChange={(e) => setPattern(e.target.value)}>
                    <option value="">เลือกลาย...</option>
                    {patternOptionsFor(speciesKey === 'cat' ? 'cat' : 'default').map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              {color === 'อื่นๆ' && (
                <input className="cp-input" style={{ marginTop: -6, marginBottom: 16 }} value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="ระบุสีด้วยตนเอง..." />
              )}

              <div className="cp-grid3">
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">ลักษณะหู</label>
                  <select className="cp-select" value={ear} onChange={(e) => setEar(e.target.value)}>
                    <option value="">-</option>
                    {EAR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">ลักษณะขา</label>
                  <select className="cp-select" value={leg} onChange={(e) => setLeg(e.target.value)}>
                    <option value="">-</option>
                    {LEG_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">ลักษณะขน</label>
                  <select className="cp-select" value={coat} onChange={(e) => setCoat(e.target.value)}>
                    <option value="">-</option>
                    {COAT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="cp-grid2" style={{ marginTop: 16 }}>
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">สีตา</label>
                  <select className="cp-select" value={eyeColor} onChange={(e) => setEyeColor(e.target.value)}>
                    <option value="">เลือกสีตา...</option>
                    {EYE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">น้ำหนัก (กก.) <span className="opt">(ถ้าทราบ)</span></label>
                  <input type="number" step="0.1" min="0" className="cp-input" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="เช่น 3.5" />
                </div>
              </div>
            </div>

            {/* การ์ด 3: เพิ่มเติม */}
            <div className="cp-card">
              <div className="cp-card-title">ข้อมูลเพิ่มเติม</div>
              <div className="cp-field">
                <label className="cp-label">สิ่งที่แพ้ <span className="opt">(ถ้ามี)</span></label>
                <input className="cp-input" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="เช่น แพ้อาหารทะเล, แพ้ยาบางชนิด" />
              </div>
              <div className="cp-field">
                <label className="cp-label">นิสัย / หมายเหตุ <span className="opt">(ถ้ามี)</span></label>
                <input className="cp-input" value={traits} onChange={(e) => setTraits(e.target.value)} placeholder="เช่น ขี้อ้อน ชอบนอนตัก" />
              </div>
            </div>
          </form>
        </div>

        {/* Save bar */}
        <div className="cp-savebar">
          <div className="cp-savebar-inner">
            <button type="button" className="cp-btn cp-btn-cancel" onClick={() => router.push(fromRedirect && fromRedirect.startsWith('/') ? fromRedirect : '/profile')}>ยกเลิก</button>
            <button type="button" className="cp-btn cp-btn-save" onClick={handleSave} disabled={saving}>
              <Icon.Save /> {saving ? "กำลังบันทึก..." : "เพิ่มสัตว์เลี้ยง"}
            </button>
          </div>
        </div>
      </div>

      {/* Crop modal */}
      {imageSrc && (
        <div className="cp-modal">
          <div className="cp-modal-card">
            <div className="cp-crop-area">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="cp-modal-body">
              <input type="range" className="cp-zoom" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} />
              <div className="cp-modal-btns">
                <button type="button" className="cp-btn cp-btn-cancel" style={{ flex: 1 }} onClick={() => setImageSrc(null)}>ยกเลิก</button>
                <button type="button" className="cp-btn cp-btn-save" onClick={handleUploadCropped} disabled={isUploading}>
                  {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยัน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CreatePetPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #FBCFE8', borderTopColor: '#E84677', animation: 'spin 1s linear infinite' }} /></div>}>
      <CreatePetContent />
    </Suspense>
  );
}
