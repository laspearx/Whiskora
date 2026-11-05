"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Cropper from "react-easy-crop";
import { PET_GENDER, PET_STATUS, type PetGender, type PetStatus } from "@/lib/constants";
import Link from 'next/link';
import { useLocale } from '@/i18n/context';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#fffafc',
};

const breedData: Record<string, string[]> = {
  cat: ["โกนจา (Konja)", "ขาวมณี (Khao Manee)", "โคราช / สีสวาด (Korat)", "ดีวอน เร็กซ์ (Devon Rex)", "บริติช ช็อตแฮร์ (British Shorthair)", "เบงกอล (Bengal)", "เปอร์เซีย (Persian)", "มันช์กิ้น (Munchkin)", "เมนคูน (Maine Coon)", "แร็กดอล (Ragdoll)", "วิเชียรมาศ (Siamese)", "ศุภลักษณ์ (Suphalak)", "สก็อตติช โฟลด์ (Scottish Fold)", "สฟิงซ์ (Sphynx)", "อเมริกัน ชอร์ตแฮร์ (American Shorthair)", "เอ็กโซติก ชอร์ตแฮร์ (Exotic Shorthair)"],
  dog: ["คอร์กี้ (Corgi)", "ชิบะ อินุ (Shiba Inu)", "ชิวาวา (Chihuahua)", "ชิสุ (Shih Tzu)", "ซามอยด์ (Samoyed)", "ไซบีเรียน ฮัสกี้ (Siberian Husky)", "แจ็ครัสเซลล์ เทอร์เรีย (Jack Russell)", "ไทยบางแก้ว (Thai Bangkaew)", "ไทยหลังอาน (Thai Ridgeback)", "บีเกิ้ล (Beagle)", "ปอมเมอเรเนียน (Pomeranian)", "พุดเดิ้ลทอย (Toy Poodle)", "เฟรนช์ บูลด็อก (French Bulldog)", "ยอร์กเชียร์ เทอร์เรีย (Yorkshire Terrier)", "ลาบราดอร์ รีทรีฟเวอร์ (Labrador)", "โกลเด้น รีทรีฟเวอร์ (Golden Retriever)", "อเมริกัน บูลลี่ (American Bully)", "อลาสกัน มาลามิวท์ (Alaskan Malamute)"],
  rabbit: ["ฮอลแลนด์ ลอป (Holland Lop)", "เนเธอร์แลนด์ ดวอร์ฟ (Netherland Dwarf)", "มินิเร็กซ์ (Mini Rex)", "ไลอ้อนเฮด (Lionhead)", "อิงลิช แองโกร่า (English Angora)", "เฟรนช์ ลอป (French Lop)"],
  hamster: ["วินเทอร์ไวท์ (Winter White)", "ไซเรียน (Syrian / ไจแอนท์)", "โรโบรอฟสกี (Roborovski)", "แคมป์เบลล์ (Campbell)"],
  bird: ["ฟอพัส (Forpus)", "ค็อกคาเทล (Cockatiel)", "ซันคอนัวร์ (Sun Conure)", "เลิฟเบิร์ด (Lovebird)", "หงส์หยก (Budgerigar)", "แอฟริกันเกรย์ (African Grey)", "มาคอว์ (Macaw)", "กรีนชีค (Green Cheek)"],
  squirrel: ["กระรอกบิน (Flying Squirrel)", "ชูการ์ไกลเดอร์ (Sugar Glider)", "แพรี่ด็อก (Prairie Dog)", "กระรอกดง (Finlayson's)"],
  hedgehog: ["เม่นแคระแอฟริกัน (African Pygmy)"],
  fish: ["ปลากัด (Betta)", "ปลาคาร์ป (Koi)", "ปลาทอง (Goldfish)", "ปลาหางนกยูง (Guppy)", "ปลาหมอสี (Flowerhorn)", "ปลามังกร (Arowana)"],
  turtle: ["ซูคาต้า (Sulcata)", "ดาวอินเดีย (Indian Star)", "อัลดราบร้า (Aldabra)", "เต่าญี่ปุ่น (Red-eared Slider)", "เต่าหมูบิน (Pig-nosed)"],
  frog: ["ฮอร์นฟร็อก (Horned Frog)", "ไวท์ทรีฟร็อก (White's Tree Frog)", "อึ่งแม่หนาว (Chubby Frog)", "กบลูกศรพิษ (Poison Dart)"],
  lizard: ["เบียร์ดดราก้อน (Bearded Dragon)", "เตกู (Tegu)", "อีกัวน่า (Iguana)", "คาเมเลี่ยน (Chameleon)", "เครสเตดเกตุโก (Crested Gecko)", "เลพเพิร์ดเกตุโก (Leopard Gecko)"],
  snake: ["คอร์นสเนค (Corn Snake)", "บอลไพธอน (Ball Python)", "ฮ็อกโนส (Hognose)", "คิงสเนค (King Snake)", "มิลค์สเนค (Milk Snake)"],
  raccoon: ["แร็กคูน (Raccoon)"],
  other: ["เมียร์แคต (Meerkat)", "เฟอร์เรท (Ferret)", "ชินชิลล่า (Chinchilla)", "บุชเบบี้ (Bushbaby)"],
};

const CAT_EYE_OPTIONS = ["เขียว", "เหลือง", "ส้ม/คอปเปอร์", "ฟ้า", "ตาสองสี", "อื่นๆ"];
const OPTION_LABELS: Record<string, string> = {"เขียว": "Green", "เหลือง": "Yellow", "ส้ม/คอปเปอร์": "Orange / copper", "ฟ้า": "Blue", "ตาสองสี": "Odd eyes", "อื่นๆ": "Other", "หูตั้ง": "Upright", "หูพับ": "Folded", "หูพลิก": "Curled", "ขาสั้น": "Short legs", "ขายาว": "Long legs", "ขนสั้น": "Short coat", "ขนยาว": "Long coat", "ขนหยิก": "Curly coat", "ไม่มีขน": "Hairless"};
const EAR_OPTIONS = ["หูตั้ง", "หูพับ", "หูพลิก"];
const LEG_OPTIONS = ["ขาสั้น", "ขายาว"];
const COAT_OPTIONS = ["ขนสั้น", "ขนยาว", "ขนหยิก", "ไม่มีขน"];

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), "image/jpeg", 0.9));
}

type FormData = {
  name: string; breed: string; customBreed: string;
  gender: PetGender | ''; birthDate: string; status: PetStatus; price: string;
  color: string; ear: string; leg: string; coat: string; eye_color: string; custom_eye_color: string;
  sire_id: string; dam_id: string; note: string;
};

export default function CreateFarmPetPage() {
  const router = useRouter();
  const locale = useLocale();
  const copy = (th: string, en: string) => locale === 'en' ? en : th;
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const params = useParams();
  const farmId = params.id as string;

  const [farm, setFarm] = useState<any>(null);
  const [existingPets, setExistingPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    name: '', breed: '', customBreed: '', gender: '', birthDate: '',
    status: PET_STATUS.UNSPECIFIED, price: '',
    color: '', ear: '', leg: '', coat: '', eye_color: '', custom_eye_color: '',
    sire_id: '', dam_id: '', note: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push(`/login?redirect=${encodeURIComponent(`/farm-dashboard/${farmId}/pets/create`)}`); return; }
        const { data: farmData, error } = await supabase.from("farms").select("*").eq("id", farmId).single();
        if (error || !farmData) { router.push("/partner"); return; }
        setFarm(farmData);
        const { data: petsData } = await supabase.from("pets").select("id, name, gender, breed").eq("farm_id", farmId).order("created_at", { ascending: false });
        if (petsData) setExistingPets(petsData);
      } catch { router.push("/partner"); }
      finally { setLoading(false); }
    };
    if (farmId) fetchData();
  }, [farmId, router]);

  const sireOptions = existingPets.filter(p => p.gender === 'male');
  const damOptions = existingPets.filter(p => p.gender === 'female');

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => { setImageSrc(reader.result as string); setShowCropper(true); });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_: any, cap: any) => setCroppedAreaPixels(cap), []);

  const handleCropImage = useCallback(async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (blob) {
        if (croppedImage?.url) URL.revokeObjectURL(croppedImage.url);
        setCroppedImage({ blob, url: URL.createObjectURL(blob) });
      }
      setShowCropper(false);
    } catch (e) { console.error(e); }
  }, [imageSrc, croppedAreaPixels, croppedImage]);

  const set = (field: keyof FormData, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving || saved) return;
    setSaveError('');
    if (!form.name.trim()) return alert(copy("กรุณาใส่ชื่อสัตว์เลี้ยง", "Please enter a pet name."));
    let finalBreed = form.breed;
    if (form.breed === "อื่นๆ") {
      if (!form.customBreed.trim()) return alert(copy("กรุณาระบุสายพันธุ์", "Please enter a breed."));
      finalBreed = form.customBreed.trim();
    } else if (!form.breed) return alert(copy("กรุณาระบุสายพันธุ์", "Please enter a breed."));
    if (form.birthDate && form.birthDate > new Date().toISOString().split('T')[0]) return alert(copy("วันเกิดต้องไม่ใช่วันในอนาคต", "Date of birth cannot be in the future."));

    if (!form.gender) return alert(copy('กรุณาเลือกเพศด้วยตัวเอง', 'Please select the pet’s sex.'));
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(copy('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง', 'Session expired. Please sign in again.'));
      let imageUrl = null;
      if (croppedImage) {
        const fileName = `farm-${farm.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("pet-photos").upload(`${session.user.id}/${fileName}`, croppedImage.blob, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("pet-photos").getPublicUrl(`${session.user.id}/${fileName}`);
        imageUrl = publicUrl;
      }
      const { data: createdPets, error } = await supabase.from("pets").insert([{
        user_id: session.user.id, farm_id: farm.id, species: farm.species,
        name: form.name.trim(), breed: finalBreed, gender: form.gender,
        birth_date: form.birthDate || null, status: form.status || null,
        price: form.price ? parseInt(form.price) : null, image_url: imageUrl,
        color: form.color || null, pattern: null,
        ear: form.ear || null, leg: form.leg || null, coat: form.coat || null,
        eye_color: (form.eye_color === 'อื่นๆ' ? form.custom_eye_color : form.eye_color) || null,
        sire_id: form.sire_id || null, dam_id: form.dam_id || null,
        note: form.note.trim() || null, is_public: true,
      }]).select("id");
      if (error) throw error;
      setSavedId(createdPets?.[0]?.id != null ? String(createdPets[0].id) : null);
      setSaved(true);
    } catch (error: any) {
      setSaveError(copy('บันทึกไม่สำเร็จ: ', 'Could not save: ') + error.message);
    } finally { setSaving(false); }
  };

  const availableBreeds = farm ? breedData[farm.species] : undefined;

  if (loading || !farm) return <PageLoader />;

  if (saved) return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 120px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{copy('บันทึกข้อมูลสัตว์แล้ว', 'Pet saved')}</h1>
      <p>{form.name}</p>
      <p>{copy('Public Share: Pending Review — ยังไม่ยืนยันการเข้าถึงของผู้ชมสาธารณะ การบันทึกนี้ไม่ใช่ร่างส่วนตัวหรือการอนุมัติประกาศ', 'Public Share: Pending Review — public access has not been confirmed. This save is not a private draft or listing approval.')}</p>
      <nav aria-label={copy('ขั้นตอนถัดไป', 'Next steps')} style={{ display: 'grid', gap: 20, marginTop: 24 }}>
        {savedId && <Link href={`/pets/${savedId}`}>{copy('ดูรายละเอียดสัตว์ที่เพิ่งเพิ่ม', 'View the pet you added')}</Link>}
        <Link href={`/farm-dashboard/${farm.id}/pets`}>{copy('กลับไปจัดการสัตว์ของฟาร์ม', 'Manage farm pets')}</Link>
        <button type="button" style={{ padding: 14, borderRadius: 12, background: F.pink, color: F.paper, fontWeight: 700 }} onClick={() => window.location.reload()}>{copy('เพิ่มสัตว์ตัวถัดไป', 'Add another pet')}</button>
      </nav>
    </main>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .fpc-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: ${F.bg}; }
        .fpc-body { max-width: 640px; margin: 0 auto; padding: 24px 20px 120px; }
        .fpc-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
        .fpc-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .fpc-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .fpc-title { font-family: inherit; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.15; }
        .fpc-sub { font-size: 13px; font-weight: 700; color: ${F.pink}; margin-top: 4px; }

        /* Photo */
        .fpc-photo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
        .fpc-photo { width: 120px; height: 120px; border-radius: 50%; border: 3px dashed ${F.pinkBorder}; background: ${F.pinkSoft}; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; color: ${F.pink}; transition: all .18s; }
        .fpc-photo:hover { border-color: ${F.pink}; }
        .fpc-photo img { width: 100%; height: 100%; object-fit: cover; }
        .fpc-photo-hint { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }
        .fpc-photo-edit { margin-top: 10px; font-size: 11px; font-weight: 700; color: ${F.muted}; background: ${F.line}; padding: 6px 14px; border-radius: 999px; cursor: pointer; border: none; transition: all .15s; font-family: inherit; }
        .fpc-photo-edit:hover { background: ${F.pinkSoft}; color: ${F.pink}; }

        /* Cards */
        .fpc-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 20px 22px; margin-bottom: 14px; }
        .fpc-card-title { font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px; }

        /* Grid layout */
        .fpc-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .fpc-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .fpc-stack { display: flex; flex-direction: column; gap: 14px; }

        /* Fields */
        .fpc-field { display: flex; flex-direction: column; gap: 6px; }
        .fpc-label { font-size: 12px; font-weight: 700; color: ${F.inkSoft}; }
        .fpc-req { color: ${F.pink}; }
        .fpc-input, .fpc-select, .fpc-textarea { width: 100%; padding: 11px 13px; background: #F9FAFB; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .fpc-input:focus, .fpc-select:focus, .fpc-textarea:focus { border-color: ${F.pinkBorder}; background: white; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .fpc-select { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 12px; padding-right: 32px; cursor: pointer; }
        .fpc-textarea { resize: none; }
        .fpc-hint { font-size: 10px; color: ${F.muted}; line-height: 1.5; }

        /* Save bar */
        .fpc-actions { display: flex; gap: 12px; margin-top: 24px; }
        .fpc-cancel-btn { flex: 0 0 auto; padding: 14px 22px; background: white; color: #4B5563; border: 1.5px solid #E5E7EB; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .fpc-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .fpc-btn:hover { background: #D63F6A; }
        .fpc-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Crop modal */
        .fpc-crop-modal { position: fixed; inset: 0; z-index: 70; display: flex; flex-direction: column; background: rgba(0,0,0,0.92); }
        .fpc-crop-area { position: relative; flex: 1; }
        .fpc-crop-tools { padding: 22px 22px 34px; background: white; border-radius: 24px 24px 0 0; display: flex; flex-direction: column; gap: 18px; }
        .fpc-zoom { width: 100%; accent-color: ${F.pink}; }
        .fpc-crop-btns { display: flex; gap: 12px; }
        .fpc-crop-cancel { flex: 1; padding: 13px; background: ${F.line}; color: ${F.inkSoft}; border: none; border-radius: 13px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .fpc-crop-ok { flex: 1; padding: 13px; background: ${F.pink}; color: white; border: none; border-radius: 13px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }

        @media (max-width: 480px) {
          .fpc-grid2, .fpc-grid3 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="fpc-page">
        <div className="fpc-body">
          <div className="fpc-header">
            <button className="fpc-back" onClick={() => router.back()} aria-label={copy("ย้อนกลับ", "Back")}><Icon.ArrowLeft /></button>
            <div>
              <h1 className="fpc-title">{copy("เพิ่มสัตว์เลี้ยง", "Add a pet")}</h1>
              <p className="fpc-sub">{farm.farm_name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
          {/* ข้อมูลพื้นฐาน */}
          <div className="fpc-card">
            <p className="fpc-card-title">{copy('ข้อมูลพื้นฐาน', 'Basic information')}</p>
            <div className="fpc-stack">
              <div className="fpc-field">
                <label className="fpc-label">{copy("ชื่อ", "Name")} <span className="fpc-req">*</span></label>
                <input type="text" className="fpc-input" placeholder={copy('เช่น ลูน่า', 'e.g. Luna')} aria-label={copy('ชื่อ', 'Name')} value={form.name} onChange={e => set('name', e.target.value)} />
              </div>

              <div className="fpc-field">
                <label className="fpc-label">{copy("สายพันธุ์", "Breed")} <span className="fpc-req">*</span></label>
                {availableBreeds ? (
                  <select className="fpc-select" aria-label={copy('สายพันธุ์', 'Breed')} value={form.breed} onChange={e => set('breed', e.target.value)}>
                    <option value="" disabled>{copy('เลือกสายพันธุ์', 'Select breed')}</option>
                    {availableBreeds.map((b, i) => <option key={i} value={b}>{b}</option>)}
                    <option value="อื่นๆ">{copy('อื่นๆ', 'Other')}</option>
                  </select>
                ) : (
                  <input type="text" className="fpc-input" placeholder={copy('ระบุสายพันธุ์...', 'Enter breed')} aria-label={copy('สายพันธุ์', 'Breed')} value={form.breed} onChange={e => set('breed', e.target.value)} />
                )}
              </div>

              {form.breed === "อื่นๆ" && (
                <div className="fpc-field">
                  <label className="fpc-label">{copy("พิมพ์สายพันธุ์", "Enter breed")} <span className="fpc-req">*</span></label>
                  <input type="text" className="fpc-input" placeholder={copy('เช่น พันธุ์ผสม', 'e.g. Mixed breed')} aria-label={copy('พิมพ์สายพันธุ์', 'Enter breed')} value={form.customBreed} onChange={e => set('customBreed', e.target.value)} />
                </div>
              )}

          {/* รูปโปรไฟล์ */}
          <div className="fpc-photo-wrap">
            <button type="button" aria-label={copy("เลือกรูปสัตว์", "Choose pet photo")} className="fpc-photo" onClick={() => fileInputRef.current?.click()}>
              {croppedImage
                ? <img src={croppedImage.url} alt={copy("ตัวอย่างรูปสัตว์", "Pet photo preview")} />
                : <><Icon.Camera /><span className="fpc-photo-hint">{copy('ใส่รูปน้อง', 'Add photo')}</span></>}
            </button>
            {croppedImage && (
              <button type="button" className="fpc-photo-edit" onClick={() => fileInputRef.current?.click()}>{copy('เปลี่ยนรูป', 'Change photo')}</button>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileChange} onClick={e => (e.currentTarget.value = '')} />
          </div>

              <div className="fpc-grid2">
                <div className="fpc-field">
                  <label className="fpc-label">{copy('เพศ', 'Sex')} <span className="fpc-req">*</span></label>
                  <select className="fpc-select" aria-label={copy('เพศ', 'Sex')} value={form.gender} onChange={e => set('gender', e.target.value as PetGender)}>
                    <option value="" disabled>{copy("เลือกเพศ", "Select sex")}</option>
                    <option value={PET_GENDER.MALE}>{copy('ตัวผู้', 'Male')}</option>
                    <option value={PET_GENDER.FEMALE}>{copy('ตัวเมีย', 'Female')}</option>
                  </select>
                </div>
                <div className="fpc-field">
                  <label className="fpc-label">{copy('วันเกิด', 'Date of birth')}</label>
                  <input type="date" className="fpc-input" aria-label={copy('วันเกิด', 'Date of birth')} value={form.birthDate} max={new Date().toISOString().split('T')[0]} onChange={e => set('birthDate', e.target.value)} />
                </div>
              </div>

              <div className="fpc-grid2">
                <div className="fpc-field">
                  <label className="fpc-label">{copy('สถานะ', 'Status')}</label>
                  <select className="fpc-select" aria-label={copy('สถานะ', 'Status')} value={form.status} onChange={e => set('status', e.target.value as PetStatus)}>
                    <option value={PET_STATUS.UNSPECIFIED}>{copy('-- ไม่ระบุ --', 'Unspecified')}</option>
                    <option value={PET_STATUS.KID}>{copy('เด็ก', 'Young')}</option>
                    <option value={PET_STATUS.BREEDER}>{copy('พ่อพันธุ์ / แม่พันธุ์', 'Breeder')}</option>
                    <option value={PET_STATUS.AVAILABLE}>{copy('พร้อมย้ายบ้าน', 'Available')}</option>
                    <option value={PET_STATUS.OPEN_RESERVE}>{copy('เปิดจอง', 'Open for reservation')}</option>
                    <option value={PET_STATUS.RESERVED}>{copy('ติดจอง', 'Reserved')}</option>
                    <option value={PET_STATUS.RETIRED}>{copy('ทำหมัน / ปลดระวาง', 'Neutered / retired')}</option>
                  </select>
                </div>
                <div className="fpc-field">
                  <label className="fpc-label">{copy('ราคา (บาท)', 'Price (THB)')}</label>
                  <input type="number" className="fpc-input" placeholder={copy('เช่น 15000', 'e.g. 15000')} aria-label={copy('ราคา (บาท)', 'Price (THB)')} value={form.price} onChange={e => set('price', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* ลักษณะภายนอก */}
          <details className="fpc-card">
            <summary className="fpc-card-title" style={{ cursor: "pointer", fontSize: 13, color: F.inkSoft }}>{copy('ลักษณะภายนอก', 'Appearance (optional)')}</summary>
            <div className="fpc-stack">
              <div className="fpc-field">
                <label className="fpc-label">{copy('สี', 'Colour')}</label>
                <input type="text" className="fpc-input" placeholder={copy('เช่น ดำ, ขาว, ส้ม, สามสี...', 'e.g. Black, white, calico')} aria-label={copy('สี', 'Colour')} value={form.color} onChange={e => set('color', e.target.value)} />
              </div>
              <div className="fpc-grid3">
                <div className="fpc-field">
                  <label className="fpc-label">{copy('ลักษณะหู', 'Ears')}</label>
                  <select className="fpc-select" aria-label={copy('ลักษณะหู', 'Ears')} value={form.ear} onChange={e => set('ear', e.target.value)}>
                    <option value="">{copy('เลือก', 'Select')}</option>
                    {EAR_OPTIONS.map(o => <option key={o} value={o}>{copy(o, OPTION_LABELS[o] || o)}</option>)}
                  </select>
                </div>
                <div className="fpc-field">
                  <label className="fpc-label">{copy('ลักษณะขา', 'Legs')}</label>
                  <select className="fpc-select" aria-label={copy('ลักษณะขา', 'Legs')} value={form.leg} onChange={e => set('leg', e.target.value)}>
                    <option value="">{copy('เลือก', 'Select')}</option>
                    {LEG_OPTIONS.map(o => <option key={o} value={o}>{copy(o, OPTION_LABELS[o] || o)}</option>)}
                  </select>
                </div>
                <div className="fpc-field">
                  <label className="fpc-label">{copy('ลักษณะขน', 'Coat')}</label>
                  <select className="fpc-select" aria-label={copy('ลักษณะขน', 'Coat')} value={form.coat} onChange={e => set('coat', e.target.value)}>
                    <option value="">{copy('เลือก', 'Select')}</option>
                    {COAT_OPTIONS.map(o => <option key={o} value={o}>{copy(o, OPTION_LABELS[o] || o)}</option>)}
                  </select>
                </div>
              </div>
              <div className="fpc-field">
                <label className="fpc-label">{copy('สีตา', 'Eye colour')}</label>
                {farm.species === 'cat' ? (
                  <>
                    <select className="fpc-select" aria-label={copy('สีตา', 'Eye colour')} value={form.eye_color} onChange={e => { set('eye_color', e.target.value); if (e.target.value !== 'อื่นๆ') set('custom_eye_color', ''); }}>
                      <option value="">{copy('เลือกสีตา', 'Select eye colour')}</option>
                      {CAT_EYE_OPTIONS.map(o => <option key={o} value={o}>{copy(o, OPTION_LABELS[o] || o)}</option>)}
                    </select>
                    {form.eye_color === 'อื่นๆ' && (
                      <input type="text" className="fpc-input" style={{ marginTop: 8 }} placeholder={copy('ระบุสีตา...', 'Enter eye colour')} aria-label={copy('ระบุสีตา', 'Enter eye colour')} value={form.custom_eye_color} onChange={e => set('custom_eye_color', e.target.value)} />
                    )}
                  </>
                ) : (
                  <input type="text" className="fpc-input" placeholder={copy('เช่น ดำ, น้ำตาล, เหลือง...', 'e.g. Black, brown, yellow')} aria-label={copy('สีตา', 'Eye colour')} value={form.eye_color} onChange={e => set('eye_color', e.target.value)} />
                )}
              </div>
            </div>
          </details>

          {/* สายเลือด */}
          <details className="fpc-card">
            <summary className="fpc-card-title" style={{ cursor: "pointer", fontSize: 13, color: F.inkSoft }}>{copy('สายเลือด (ถ้ามี)', 'Parents (optional)')}</summary>
            <div className="fpc-stack">
              <div className="fpc-grid2">
                <div className="fpc-field">
                  <label className="fpc-label">{copy('พ่อ', 'Sire')}</label>
                  <select className="fpc-select" aria-label={copy('พ่อ', 'Sire')} value={form.sire_id} onChange={e => set('sire_id', e.target.value)} disabled={sireOptions.length === 0}>
                    <option value="">{sireOptions.length === 0 ? copy('ยังไม่มีตัวผู้ในฟาร์ม', 'No male pets in this farm') : copy('— ไม่ระบุ —', 'Unspecified')}</option>
                    {sireOptions.map(p => <option key={p.id} value={p.id}>{p.name}{p.breed ? ` · ${p.breed.split('(')[0].trim()}` : ''}</option>)}
                  </select>
                </div>
                <div className="fpc-field">
                  <label className="fpc-label">{copy('แม่', 'Dam')}</label>
                  <select className="fpc-select" aria-label={copy('แม่', 'Dam')} value={form.dam_id} onChange={e => set('dam_id', e.target.value)} disabled={damOptions.length === 0}>
                    <option value="">{damOptions.length === 0 ? copy('ยังไม่มีตัวเมียในฟาร์ม', 'No female pets in this farm') : copy('— ไม่ระบุ —', 'Unspecified')}</option>
                    {damOptions.map(p => <option key={p.id} value={p.id}>{p.name}{p.breed ? ` · ${p.breed.split('(')[0].trim()}` : ''}</option>)}
                  </select>
                </div>
              </div>
              {existingPets.length === 0 && (
                <p className="fpc-hint">{copy("ไม่จำเป็นต้องเพิ่มพ่อแม่พันธุ์ก่อน สามารถเพิ่มข้อมูลสายเลือดภายหลังได้", "Parents are optional and can be added later.")}</p>
              )}
            </div>
          </details>

          {/* หมายเหตุ */}
          <details className="fpc-card">
            <summary className="fpc-card-title" style={{ cursor: "pointer", fontSize: 13, color: F.inkSoft }}>{copy('หมายเหตุ', 'Notes (optional)')}</summary>
            <div className="fpc-field">
              <textarea className="fpc-textarea" rows={3} placeholder={copy('บันทึกเพิ่มเติม เช่น ประวัติสุขภาพ, ลักษณะนิสัย...', 'Additional information, e.g. health history or temperament')} aria-label={copy('หมายเหตุ', 'Notes')} value={form.note} onChange={e => set('note', e.target.value)} />
            </div>
          </details>

          <p>{copy('ก่อนบันทึก: ข้อมูลนี้ไม่ใช่ร่างส่วนตัว และอาจแสดงต่อสาธารณะตามสิทธิ์และสถานะที่ระบบรองรับ โปรดตรวจข้อมูลและสิทธิ์ใช้รูปก่อนบันทึก', 'Before saving: this is not a private draft. Data may be publicly accessible under existing permissions and status rules. Check the information and your rights to use the photo.')}</p>
          {saveError && <p role="alert">{saveError}</p>}
          <div className="fpc-actions">
            <button type="button" className="fpc-cancel-btn" onClick={() => router.back()}>{copy('ยกเลิก', 'Cancel')}</button>
            <button type="submit" className="fpc-btn" disabled={saving}>
              <Icon.Save /> {saving ? copy("กำลังบันทึกข้อมูล...", "Saving...") : copy("บันทึก", "Save")}
            </button>
          </div>
          </form>
        </div>
      </div>

      {showCropper && imageSrc && (
        <div className="fpc-crop-modal">
          <div className="fpc-crop-area">
            <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
          </div>
          <div className="fpc-crop-tools">
            <input type="range" className="fpc-zoom" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} />
            <div className="fpc-crop-btns">
              <button type="button" className="fpc-crop-cancel" onClick={() => setShowCropper(false)}>{copy('ยกเลิก', 'Cancel')}</button>
              <button type="button" className="fpc-crop-ok" onClick={handleCropImage}>{copy('ตกลง', 'Confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
