"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Cropper from "react-easy-crop";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  blue: '#2563EB',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

// 🌟 breedData ใช้ species id อังกฤษเป็น key (ตรงกับ lib/species.ts)
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

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Camera: () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
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
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9));
}

export default function CreateFarmPetPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const [formData, setFormData] = useState({ name: "", breed: "", customBreed: "", gender: "male", birthDate: "", status: "", price: "" });

  useEffect(() => {
    const fetchFarmInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push(`/login?redirect=${encodeURIComponent(`/farm-dashboard/${farmId}/pets/create`)}`); return; }
        const { data, error } = await supabase.from("farms").select("*").eq("id", farmId).single();
        if (error || !data) { router.push("/partner"); return; }
        setFarm(data);
      } catch { router.push("/partner"); }
      finally { setLoading(false); }
    };
    if (farmId) fetchFarmInfo();
  }, [farmId, router]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => { setImageSrc(reader.result as string); setShowCropper(true); });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_ca: any, cap: any) => setCroppedAreaPixels(cap), []);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    let finalBreed = formData.breed;
    if (formData.breed === "อื่นๆ") {
      if (!formData.customBreed.trim()) return alert("กรุณาระบุสายพันธุ์");
      finalBreed = formData.customBreed.trim();
    } else if (!formData.breed) return alert("กรุณาระบุสายพันธุ์");

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      let imageUrl = null;
      if (croppedImage) {
        const fileName = `farm-${farm.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("pet-photos").upload(`${session.user.id}/${fileName}`, croppedImage.blob, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from("pet-photos").getPublicUrl(`${session.user.id}/${fileName}`);
        imageUrl = publicUrlData.publicUrl;
      }
      const { error } = await supabase.from("pets").insert([{
        user_id: session.user.id, farm_id: farm.id, species: farm.species,
        name: formData.name, breed: finalBreed, gender: formData.gender,
        birth_date: formData.birthDate || null, status: formData.status,
        price: formData.price ? parseInt(formData.price) : null, image_url: imageUrl,
      }]);
      if (error) throw error;
      alert("🎉 เพิ่มสัตว์เลี้ยงเข้าฟาร์มเรียบร้อยแล้ว!");
      router.push(`/farm-dashboard/${farm.id}/pets`);
      router.refresh();
    } catch (error: any) {
      console.error("Error creating pet:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally { setSaving(false); }
  };

  const availableBreeds = farm ? breedData[farm.species] : undefined;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=Prompt:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .fpc-page { font-family: 'Sarabun', sans-serif; min-height: 100vh; color: ${F.ink}; }
        .fpc-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 120px; }
        .fpc-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
        .fpc-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.pinkBorder}; box-shadow: 0 2px 8px rgba(232,70,119,0.1); transition: all .18s ease; flex-shrink: 0; }
        .fpc-back:hover { color: ${F.pink}; border-color: ${F.pink}; transform: translateX(-1px); }
        .fpc-title { font-family: 'Prompt', sans-serif; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.15; }
        .fpc-sub { font-size: 13px; font-weight: 700; color: ${F.pink}; margin-top: 4px; }
        .fpc-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; padding: 24px; }
        .fpc-photo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 22px; }
        .fpc-photo { width: 120px; height: 120px; border-radius: 50%; border: 3px dashed ${F.pinkBorder}; background: ${F.pinkSoft}; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; color: ${F.pink}; transition: all .18s; }
        .fpc-photo:hover { border-color: ${F.pink}; }
        .fpc-photo img { width: 100%; height: 100%; object-fit: cover; }
        .fpc-photo-hint { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }
        .fpc-photo-edit { margin-top: 10px; font-size: 11px; font-weight: 700; color: ${F.muted}; background: ${F.line}; padding: 6px 14px; border-radius: 999px; cursor: pointer; border: none; transition: all .15s; }
        .fpc-photo-edit:hover { background: ${F.pinkSoft}; color: ${F.pink}; }
        .fpc-field { margin-bottom: 16px; }
        .fpc-field:last-child { margin-bottom: 0; }
        .fpc-label { display: block; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .fpc-req { color: ${F.pink}; }
        .fpc-input, .fpc-select { width: 100%; padding: 12px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .fpc-input:focus, .fpc-select:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .fpc-select { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 18px; padding-right: 38px; cursor: pointer; }
        .fpc-grid-gender { display: grid; grid-template-columns: 2fr 3fr; gap: 12px; }
        .fpc-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .fpc-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .fpc-savebar-inner { max-width: 600px; margin: 0 auto; }
        .fpc-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .fpc-btn:hover { background: #D63F6A; }
        .fpc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .fpc-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .fpc-spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${F.pinkBorder}; border-top-color: ${F.pink}; animation: fpcspin 1s linear infinite; }
        @keyframes fpcspin { to { transform: rotate(360deg); } }
        /* cropper modal */
        .fpc-crop-modal { position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column; background: rgba(0,0,0,0.92); }
        .fpc-crop-area { position: relative; flex: 1; }
        .fpc-crop-tools { padding: 22px 22px 34px; background: white; border-radius: 24px 24px 0 0; display: flex; flex-direction: column; gap: 18px; }
        .fpc-zoom-row { display: flex; align-items: center; gap: 14px; }
        .fpc-zoom { width: 100%; accent-color: ${F.pink}; }
        .fpc-crop-btns { display: flex; gap: 12px; }
        .fpc-crop-cancel { flex: 1; padding: 13px; background: ${F.line}; color: ${F.inkSoft}; border: none; border-radius: 13px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .fpc-crop-ok { flex: 1; padding: 13px; background: ${F.pink}; color: white; border: none; border-radius: 13px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
      `}</style>

      {loading || !farm ? (
        <div className="fpc-loading">
          <div className="fpc-spinner" />
          <p style={{ fontSize: 13, fontWeight: 700, color: F.muted }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <div className="fpc-page">
          <div className="fpc-body">
            <div className="fpc-header">
              <button className="fpc-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
              <div>
                <h1 className="fpc-title">เพิ่มสมาชิกในฟาร์ม</h1>
                <p className="fpc-sub">ลงทะเบียนเข้าสังกัด: {farm.farm_name}</p>
              </div>
            </div>

            <div className="fpc-card">
              <form onSubmit={handleSubmit}>
                <div className="fpc-photo-wrap">
                  <label className="fpc-photo">
                    {croppedImage ? <img src={croppedImage.url} alt="ตัวอย่าง" /> : (<><Icon.Camera /><span className="fpc-photo-hint">ใส่รูปน้อง</span></>)}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} onClick={(e) => (e.currentTarget.value = "")} />
                  </label>
                  {croppedImage && <button type="button" className="fpc-photo-edit" onClick={() => setShowCropper(true)}>✎ ปรับตำแหน่งรูป</button>}
                </div>

                <div className="fpc-field">
                  <label className="fpc-label">ชื่อ <span className="fpc-req">*</span></label>
                  <input required type="text" className="fpc-input" placeholder="เช่น ลูน่า" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div className="fpc-field">
                  <label className="fpc-label">สายพันธุ์ <span className="fpc-req">*</span></label>
                  {availableBreeds ? (
                    <select required className="fpc-select" value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value, customBreed: "" })}>
                      <option value="" disabled>เลือกสายพันธุ์</option>
                      {availableBreeds.map((breed, idx) => <option key={idx} value={breed}>{breed}</option>)}
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  ) : (
                    <input required type="text" className="fpc-input" placeholder="ระบุสายพันธุ์..." value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} />
                  )}
                </div>

                {formData.breed === "อื่นๆ" && (
                  <div className="fpc-field">
                    <label className="fpc-label">พิมพ์สายพันธุ์ที่ต้องการ <span className="fpc-req">*</span></label>
                    <input required type="text" className="fpc-input" placeholder="เช่น พันธุ์ผสม, ชอร์ตแฮร์ผสมเปอร์เซีย..." value={formData.customBreed} onChange={(e) => setFormData({ ...formData, customBreed: e.target.value })} />
                  </div>
                )}

                <div className="fpc-field fpc-grid-gender">
                  <div>
                    <label className="fpc-label">เพศ</label>
                    <select className="fpc-select" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="male">♂ ตัวผู้</option>
                      <option value="female">♀ ตัวเมีย</option>
                    </select>
                  </div>
                  <div>
                    <label className="fpc-label">วันเกิด</label>
                    <input type="date" className="fpc-input" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
                  </div>
                </div>

                <div className="fpc-field fpc-grid2" style={{ marginBottom: 0 }}>
                  <div>
                    <label className="fpc-label">สถานะ</label>
                    <select className="fpc-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option value="">-- ไม่ระบุ --</option>
                      <option value="พ่อพันธุ์ / แม่พันธุ์">พ่อพันธุ์ / แม่พันธุ์</option>
                      <option value="เด็ก">เด็ก</option>
                      <option value="พร้อมย้ายบ้าน">พร้อมย้ายบ้าน</option>
                      <option value="ติดจอง">ติดจอง</option>
                      <option value="ทำหมัน / ปลดระวาง">ทำหมัน / ปลดระวาง</option>
                    </select>
                  </div>
                  <div>
                    <label className="fpc-label">ราคา (บาท)</label>
                    <input type="number" className="fpc-input" placeholder="เช่น 15000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="fpc-savebar">
            <div className="fpc-savebar-inner">
              <button type="button" className="fpc-btn" onClick={handleSubmit} disabled={saving}>
                <Icon.Save /> {saving ? "กำลังบันทึกข้อมูล..." : "เพิ่มเข้าสู่ฟาร์ม"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCropper && imageSrc && (
        <div className="fpc-crop-modal">
          <div className="fpc-crop-area">
            <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
          </div>
          <div className="fpc-crop-tools">
            <div className="fpc-zoom-row">
              <span style={{ fontSize: 18 }}>🔍</span>
              <input type="range" className="fpc-zoom" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            </div>
            <div className="fpc-crop-btns">
              <button type="button" className="fpc-crop-cancel" onClick={() => setShowCropper(false)}>ยกเลิก</button>
              <button type="button" className="fpc-crop-ok" onClick={handleCropImage}>ตกลง</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}