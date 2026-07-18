"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { speciesToId, speciesIcon } from "@/lib/species";
import { useRouter, useParams } from "next/navigation";
import Cropper from "react-easy-crop";
import { PET_GENDER, PET_STATUS, type PetGender } from "@/lib/constants";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: '#1f1a1c', inkSoft: '#4a3f44', muted: '#8e7e84',
  pink: '#e84677', pinkSoft: '#fde2ea', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#f3dde3', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#fffafc',
};

const PET_DATA = {
  cat: {
    label: "แมว",
    breeds: ["แมวบ้าน / พันธุ์ผสม (Domestic / Mix Breed)", "โกนจา (Konja)", "ขาวมณี (Khao Manee)", "โคราช / สีสวาด (Korat)", "ดีวอน เร็กซ์ (Devon Rex)", "บริติช ช็อตแฮร์ (British Shorthair)", "เบงกอล (Bengal)", "เปอร์เซีย (Persian)", "มันช์กิ้น (Munchkin)", "เมนคูน (Maine Coon)", "แร็กดอล (Ragdoll)", "วิเชียรมาศ (Siamese)", "ศุภลักษณ์ (Suphalak)", "สก็อตติช โฟลด์ (Scottish Fold)", "สฟิงซ์ (Sphynx)", "อเมริกัน ชอร์ตแฮร์ (American Shorthair)", "เอ็กโซติก ชอร์ตแฮร์ (Exotic Shorthair)", "อื่นๆ"],
  },
  dog: {
    label: "หมา",
    breeds: ["พันธุ์ทาง / พันธุ์ผสม (Mixed Breed)", "คอร์กี้ (Corgi)", "ชิบะ อินุ (Shiba Inu)", "ชิวาวา (Chihuahua)", "ชิสุ (Shih Tzu)", "ซามอยด์ (Samoyed)", "ไซบีเรียน ฮัสกี้ (Siberian Husky)", "แจ็ครัสเซลล์ เทอร์เรีย (Jack Russell)", "ไทยบางแก้ว (Thai Bangkaew)", "ไทยหลังอาน (Thai Ridgeback)", "บีเกิ้ล (Beagle)", "ปอมเมอเรเนียน (Pomeranian)", "พุดเดิ้ลทอย (Toy Poodle)", "เฟรนช์ บูลด็อก (French Bulldog)", "ยอร์กเชียร์ เทอร์เรีย (Yorkshire Terrier)", "ลาบราดอร์ รีทรีฟเวอร์ (Labrador)", "โกลเด้น รีทรีฟเวอร์ (Golden Retriever)", "อเมริกัน บูลลี่ (American Bully)", "อลาสกัน มาลามิวท์ (Alaskan Malamute)", "อื่นๆ"],
  },
  other_pets: [
    { id: "rabbit", label: "กระต่าย" }, { id: "hamster", label: "แฮมสเตอร์" },
    { id: "bird", label: "นก" }, { id: "squirrel", label: "กระรอก" },
    { id: "hedgehog", label: "เม่นแคระ" }, { id: "fish", label: "ปลา" },
    { id: "turtle", label: "เต่า" }, { id: "frog", label: "กบ" },
    { id: "lizard", label: "กิ้งก่า" }, { id: "snake", label: "งู" },
    { id: "raccoon", label: "แร็กคูน" }, { id: "other", label: "อื่นๆ" },
  ],
};

const CAT_EYE_OPTIONS = ["เขียว", "เหลือง", "ส้ม/คอปเปอร์", "ฟ้า", "ตาสองสี", "อื่นๆ"];

const BLOOD_TYPES = ["A","B","AB","Unknown"];

export default function EditPetPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [isFetching, setIsFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [petName, setPetName] = useState("");

  const [name, setName] = useState("");
  const [species, setSpecies] = useState<"cat" | "dog" | "other">("cat");
  const [otherPetText, setOtherPetText] = useState("");
  const [breed, setBreed] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [color, setColor] = useState("");

  const [gender, setGender] = useState<PetGender>(PET_GENDER.MALE);
  const [birthdate, setBirthdate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [allergies, setAllergies] = useState("");
  const [traits, setTraits] = useState("");
  const [isNeutered, setIsNeutered] = useState(false);
  const [bloodType, setBloodType] = useState("");
  const [microchip, setMicrochip] = useState("");

  const [status, setStatus] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [pattern, setPattern] = useState("");
  const [coat, setCoat] = useState("");
  const [ear, setEar] = useState("");
  const [leg, setLeg] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [customEyeColor, setCustomEyeColor] = useState("");

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPetData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      setUserId(session.user.id);

      const { data, error } = await supabase.from("pets").select("*").eq("id", petId).eq("user_id", session.user.id).single();
      if (error || !data) {
        router.push("/profile");
        return;
      }

      setName(data.name || "");
      setPetName(data.name || "");
      setGender(data.gender || "male");
      setBirthdate(data.birth_date || data.birthdate || "");
      setAllergies(data.allergies || "");
      setTraits(data.traits || "");
      setIsNeutered(!!data.is_neutered);
      setBloodType(data.blood_type || "");
      setMicrochip(data.microchip_number || "");
      setStatus(data.status || "");
      setPrice(data.price || "");
      setPattern(data.pattern || "");
      setCoat(data.coat || "");
      setEar(data.ear || "");
      setLeg(data.leg || "");
      const savedEye = data.eye_color || "";
      const CAT_EYE_PRESET = ["เขียว", "เหลือง", "ส้ม/คอปเปอร์", "ฟ้า", "ตาสองสี"];
      if (savedEye && !CAT_EYE_PRESET.includes(savedEye)) {
        setEyeColor("อื่นๆ"); setCustomEyeColor(savedEye);
      } else { setEyeColor(savedEye); }

      if (data.image_url) {
        setAvatarUrl(data.image_url);
        setOriginalImageSrc(data.image_url);
      }

      let currentSpecies: "cat" | "dog" | "other" = "other";
      if (data.species === "แมว" || data.species === "cat") { currentSpecies = "cat"; setSpecies("cat"); }
      else if (data.species === "หมา" || data.species === "dog") { currentSpecies = "dog"; setSpecies("dog"); }
      else { setSpecies("other"); setOtherPetText(speciesToId(data.species) || ""); }

      const petBreed = data.breed || "";
      if (currentSpecies === "cat" || currentSpecies === "dog") {
        if (PET_DATA[currentSpecies].breeds.includes(petBreed)) setBreed(petBreed);
        else if (petBreed) { setBreed("อื่นๆ"); setCustomBreed(petBreed); }
      } else setCustomBreed(petBreed);

      setColor(data.color || "");
      setIsFetching(false);
    };
    if (petId) fetchPetData();
  }, [petId, router]);

  const handleSpeciesChange = (type: "cat" | "dog" | "other") => {
    setSpecies(type);
    setOtherPetText(""); setBreed(""); setCustomBreed(""); setColor(""); setEyeColor(""); setCustomEyeColor("");
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

  const getCroppedImg = async (src: string, pixelCrop: any): Promise<Blob> => {
    const image = new Image(); image.src = src;
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
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const fileName = `pet-${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;
      const file = new File([croppedBlob], fileName, { type: "image/jpeg" });
      const { error: uploadError } = await supabase.storage.from("pet-photos").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("pet-photos").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      setImageSrc(null);
    } catch (error: any) {
      alert("อัปโหลดรูปไม่สำเร็จ: " + (error.message || ""));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("กรุณากรอกชื่อสัตว์เลี้ยง");
    if (species === 'other' && !otherPetText) return alert("กรุณาเลือกประเภทสัตว์เลี้ยง");
    setSaving(true);
    const finalSpecies = species === 'other' ? otherPetText : species;
    const finalBreed = breed === 'อื่นๆ' ? customBreed : (breed || customBreed);
    const finalColor = color;
    const finalEyeColor = eyeColor === 'อื่นๆ' ? customEyeColor : eyeColor;

    const { error } = await supabase.from("pets").update({
      name: name.trim(), species: finalSpecies, breed: finalBreed || null, color: finalColor || null, eye_color: finalEyeColor || null,
      gender, birth_date: birthdate || null, image_url: avatarUrl,
      allergies: allergies || null, traits: traits || null,
      is_neutered: isNeutered,
      blood_type: bloodType || null,
      microchip_number: microchip || null,
      status: status || null, price: price === "" ? null : Number(price),
      pattern: null, coat: coat || null, ear: ear || null, leg: leg || null,
    }).eq("id", petId);

    if (error) {
      alert("บันทึกไม่สำเร็จ: " + error.message);
      setSaving(false);
    } else {
      router.replace(`/pets/${petId}`);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("pets").delete().eq("id", petId).eq("user_id", userId);
      if (error) throw error;
      router.push('/profile');
    } catch (error: any) {
      alert("ลบไม่สำเร็จ: " + error.message);
      setIsDeleting(false);
    }
  };

  if (isFetching) return <PageLoader />;

  const selectArrow = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ZTdlODQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')`;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ep-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .ep-body { max-width: 560px; margin: 0 auto; padding: 20px 16px 160px; }

        .ep-header { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .ep-back { width: 38px; height: 38px; border-radius: 11px; background: white; border: 1px solid ${F.line}; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${F.inkSoft}; flex-shrink: 0; }
        .ep-title { font-size: 20px; font-weight: 700; color: ${F.ink}; margin: 0; }

        /* Photo */
        .ep-photo-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 28px; }
        .ep-photo { position: relative; display: inline-block; }
        .ep-avatar { width: 100px; height: 100px; border-radius: 50%; background: ${F.pinkSoft}; border: 3px solid ${F.pinkBorder}; overflow: hidden; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(232,70,119,0.15); }
        .ep-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ep-avatar-placeholder { width: 44px; height: 44px; object-fit: contain; opacity: .5; }
        .ep-camera-btn { width: 32px; height: 32px; border-radius: 50%; background: ${F.pink}; border: 3px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; position: absolute; bottom: 2px; right: 2px; color: white; transition: background .15s; }
        .ep-camera-btn:hover { background: #D63F6A; }
        .ep-photo-hint { font-size: 11px; font-weight: 600; color: ${F.muted}; }

        /* Section Card */
        .ep-card { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 20px; margin-bottom: 16px; }
        .ep-card-title { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; padding-bottom: 12px; border-bottom: 1px solid ${F.line}; }
        .ep-card-title img { width: 22px; height: 22px; object-fit: contain; }

        /* Fields */
        .ep-label { font-size: 11px; font-weight: 600; color: ${F.muted}; margin-bottom: 7px; display: block; }
        .ep-field { margin-bottom: 16px; }
        .ep-field:last-child { margin-bottom: 0; }
        .ep-input { width: 100%; padding: 11px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 14px; color: ${F.ink}; outline: none; transition: border-color .15s; }
        .ep-input:focus { border-color: ${F.pink}; }
        .ep-select { width: 100%; padding: 11px 36px 11px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white ${selectArrow} no-repeat right 12px center / 18px; font-family: inherit; font-size: 14px; color: ${F.ink}; outline: none; appearance: none; cursor: pointer; transition: border-color .15s; }
        .ep-select:focus { border-color: ${F.pink}; }
        .ep-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ep-grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }

        /* Species picker */
        .ep-species-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .ep-species-btn { border: 1.5px solid ${F.line}; background: white; border-radius: 12px; padding: 10px 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: all .15s; font-family: inherit; }
        .ep-species-btn.active { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .ep-species-btn img { width: 32px; height: 32px; object-fit: contain; }
        .ep-species-label { font-size: 11px; font-weight: 700; color: ${F.inkSoft}; }
        .ep-species-btn.active .ep-species-label { color: ${F.pink}; }

        /* Other pets grid */
        .ep-other-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
        .ep-other-btn { border: 1.5px solid ${F.line}; background: white; border-radius: 10px; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; transition: all .15s; font-family: inherit; }
        .ep-other-btn.active { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .ep-other-btn img { width: 26px; height: 26px; object-fit: contain; }
        .ep-other-label { font-size: 10px; font-weight: 600; color: ${F.inkSoft}; }
        .ep-other-btn.active .ep-other-label { color: ${F.pink}; }

        /* Gender */
        .ep-gender-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .ep-gender-btn { border: 1.5px solid ${F.line}; background: white; border-radius: 12px; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; color: ${F.muted}; transition: all .15s; }
        .ep-gender-btn.male.active { border-color: #93C5FD; background: #EFF6FF; color: #2563EB; }
        .ep-gender-btn.female.active { border-color: ${F.pinkBorder}; background: ${F.pinkSoft}; color: ${F.pink}; }

        /* Neutered toggle */
        .ep-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; cursor: pointer; }
        .ep-toggle-label { font-size: 14px; font-weight: 500; color: ${F.ink}; }
        .ep-toggle-sub { font-size: 11px; color: ${F.muted}; margin-top: 1px; }
        .ep-toggle-pill { width: 44px; height: 24px; border-radius: 12px; transition: background .2s; flex-shrink: 0; position: relative; }
        .ep-toggle-pill.on { background: ${F.teal}; }
        .ep-toggle-pill.off { background: ${F.line}; }
        .ep-toggle-dot { width: 18px; height: 18px; border-radius: 50%; background: white; position: absolute; top: 3px; transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,.15); }
        .ep-toggle-dot.on { left: 23px; }
        .ep-toggle-dot.off { left: 3px; }

        /* Price highlight */
        .ep-price-input { background: #FFF0F5; border-color: ${F.pinkBorder}; color: ${F.pink}; font-weight: 700; }
        .ep-price-input:focus { border-color: ${F.pink}; }

        /* Delete zone */
        .ep-delete-zone { margin-top: 8px; display: flex; justify-content: center; }
        .ep-delete-btn { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 12px; border: 1.5px solid #FCA5A5; background: white; color: #DC2626; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
        .ep-delete-btn:hover { background: #FEF2F2; }
        .ep-delete-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* Confirm overlay */
        .ep-confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
        .ep-confirm-sheet { background: white; border-radius: 20px 20px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; }
        .ep-confirm-title { font-size: 16px; font-weight: 700; color: ${F.ink}; margin-bottom: 8px; }
        .ep-confirm-sub { font-size: 13px; color: ${F.muted}; margin-bottom: 20px; line-height: 1.5; }
        .ep-confirm-actions { display: flex; gap: 10px; }
        .ep-confirm-cancel { flex: 1; padding: 13px; border-radius: 12px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 14px; font-weight: 600; color: ${F.inkSoft}; cursor: pointer; }
        .ep-confirm-ok { flex: 1; padding: 13px; border-radius: 12px; border: none; background: #EF4444; color: white; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
        .ep-confirm-ok:disabled { opacity: .6; }

        /* Save bar */
        .ep-save-bar { position: fixed; bottom: calc(68px + env(safe-area-inset-bottom,0px)); left: 0; right: 0; padding: 12px 16px; background: rgba(255,255,255,.95); backdrop-filter: blur(12px); border-top: 1px solid ${F.line}; z-index: 60; }
        @media (min-width: 768px) { .ep-save-bar { bottom: 0; padding-bottom: 16px; } }
        .ep-save-btn { width: 100%; max-width: 560px; margin: 0 auto; display: block; padding: 14px; border-radius: 14px; background: ${F.pink}; color: white; font-family: inherit; font-size: 15px; font-weight: 700; border: none; cursor: pointer; transition: opacity .15s; }
        .ep-save-btn:disabled { opacity: .6; cursor: not-allowed; }

        @media (max-width: 480px) { .ep-grid4 { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div className="ep-page">
        <div className="ep-body">

          {/* Header */}
          <div className="ep-header">
            <button className="ep-back" onClick={() => router.back()} type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 className="ep-title">แก้ไขโปรไฟล์{petName ? ` ${petName}` : ""}</h1>
          </div>

          <form onSubmit={handleSave}>

            {/* Photo */}
            <div className="ep-photo-wrap">
              <div className="ep-photo">
                <div className="ep-avatar" onClick={() => originalImageSrc ? setImageSrc(originalImageSrc) : fileInputRef.current?.click()}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Pet" />
                    : <img className="ep-avatar-placeholder" src={speciesIcon(species === 'other' ? (otherPetText || 'other') : species)} alt="" />
                  }
                </div>
                <button type="button" className="ep-camera-btn" onClick={() => fileInputRef.current?.click()}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </button>
              </div>
              <span className="ep-photo-hint">แตะเพื่อเปลี่ยนรูป</span>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} onClick={(e) => (e.currentTarget.value = "")} style={{ display: 'none' }} />
            </div>

            {/* Card 1 — ข้อมูลพื้นฐาน */}
            <div className="ep-card">
              <div className="ep-card-title">
                <img src="/icons/icon-pet-id-card.png" alt="" />
                ข้อมูลพื้นฐาน
              </div>

              <div className="ep-field">
                <label className="ep-label">ชื่อสัตว์เลี้ยง</label>
                <input className="ep-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="เช่น น้องถุงทอง" required />
              </div>

              <div className="ep-field">
                <label className="ep-label">ประเภทสัตว์</label>
                <div className="ep-species-row">
                  {[{ id: "cat", label: "แมว" }, { id: "dog", label: "หมา" }, { id: "other", label: "อื่นๆ" }].map(t => (
                    <button key={t.id} type="button" className={`ep-species-btn ${species === t.id ? 'active' : ''}`} onClick={() => handleSpeciesChange(t.id as any)}>
                      <img src={speciesIcon(t.id)} alt="" />
                      <span className="ep-species-label">{t.label}</span>
                    </button>
                  ))}
                </div>
                {species === 'other' && (
                  <div className="ep-other-grid">
                    {PET_DATA.other_pets.map(o => (
                      <button key={o.id} type="button" className={`ep-other-btn ${otherPetText === o.id ? 'active' : ''}`} onClick={() => setOtherPetText(o.id)}>
                        <img src={speciesIcon(o.id)} alt="" />
                        <span className="ep-other-label">{o.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {species !== 'other' && (
                <div className="ep-field">
                  <label className="ep-label">สายพันธุ์</label>
                  <select className="ep-select" value={breed} onChange={e => setBreed(e.target.value)}>
                    <option value="">เลือกสายพันธุ์...</option>
                    {PET_DATA[species].breeds.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {breed === "อื่นๆ" && (
                    <input className="ep-input" style={{ marginTop: 8 }} type="text" value={customBreed} onChange={e => setCustomBreed(e.target.value)} placeholder="ระบุสายพันธุ์..." />
                  )}
                </div>
              )}
              {species === 'other' && (
                <div className="ep-field">
                  <label className="ep-label">สายพันธุ์ (ถ้ามี)</label>
                  <input className="ep-input" type="text" value={customBreed} onChange={e => setCustomBreed(e.target.value)} placeholder="ระบุสายพันธุ์..." />
                </div>
              )}

              <div className="ep-field">
                <label className="ep-label">เพศ</label>
                <div className="ep-gender-row">
                  <button type="button" className={`ep-gender-btn male ${gender === PET_GENDER.MALE ? 'active' : ''}`} onClick={() => setGender(PET_GENDER.MALE)}>
                    <img src="/icons/icon-men.png" alt="" style={{width:16,height:16,objectFit:'contain'}} />
                    ตัวผู้
                  </button>
                  <button type="button" className={`ep-gender-btn female ${gender === PET_GENDER.FEMALE ? 'active' : ''}`} onClick={() => setGender(PET_GENDER.FEMALE)}>
                    <img src="/icons/icon-women.png" alt="" style={{width:16,height:16,objectFit:'contain'}} />
                    ตัวเมีย
                  </button>
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label">วันเกิด</label>
                <input className="ep-input" type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
              </div>

              <div className="ep-field" style={{ marginBottom: 0 }}>
                <label className="ep-label">ทำหมัน</label>
                <div className="ep-toggle-row" onClick={() => setIsNeutered(!isNeutered)}>
                  <div>
                    <div className="ep-toggle-label">{isNeutered ? 'ทำหมันแล้ว' : 'ยังไม่ทำหมัน'}</div>
                    <div className="ep-toggle-sub">{isNeutered ? 'สัตว์เลี้ยงได้รับการทำหมัน' : 'กดเพื่อระบุว่าทำหมันแล้ว'}</div>
                  </div>
                  <div className={`ep-toggle-pill ${isNeutered ? 'on' : 'off'}`}>
                    <div className={`ep-toggle-dot ${isNeutered ? 'on' : 'off'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 — ลักษณะภายนอก */}
            <div className="ep-card">
              <div className="ep-card-title">
                <img src="/icons/icon-breeding.png" alt="" />
                ลักษณะภายนอก
              </div>

              <div className="ep-field">
                <label className="ep-label">สี</label>
                <input className="ep-input" type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="เช่น ดำ, ขาว, ส้ม, สามสี..." />
              </div>
              {species === 'cat' ? (
                <>
                  <div className="ep-grid4">
                    <div className="ep-field" style={{ marginBottom: 0 }}>
                      <label className="ep-label">ขน</label>
                      <select className="ep-select" value={coat} onChange={e => setCoat(e.target.value)}>
                        <option value="">เลือก...</option>
                        <option>Shorthair</option><option>Longhair</option>
                      </select>
                    </div>
                    <div className="ep-field" style={{ marginBottom: 0 }}>
                      <label className="ep-label">หู</label>
                      <select className="ep-select" value={ear} onChange={e => setEar(e.target.value)}>
                        <option value="">เลือก...</option>
                        <option>Straight</option><option>Fold</option><option>Curl</option>
                      </select>
                    </div>
                    <div className="ep-field" style={{ marginBottom: 0 }}>
                      <label className="ep-label">ขา</label>
                      <select className="ep-select" value={leg} onChange={e => setLeg(e.target.value)}>
                        <option value="">เลือก...</option>
                        <option>Long Leg</option><option>Short Leg</option>
                      </select>
                    </div>
                    <div className="ep-field" style={{ marginBottom: 0 }}>
                      <label className="ep-label">สีตา</label>
                      <select className="ep-select" value={eyeColor} onChange={e => { setEyeColor(e.target.value); if (e.target.value !== 'อื่นๆ') setCustomEyeColor(''); }}>
                        <option value="">เลือก...</option>
                        {CAT_EYE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      {eyeColor === 'อื่นๆ' && (
                        <input className="ep-input" style={{ marginTop: 8 }} type="text" value={customEyeColor} onChange={e => setCustomEyeColor(e.target.value)} placeholder="ระบุสีตา..." />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="ep-field" style={{ marginBottom: 0 }}>
                  <label className="ep-label">สีตา</label>
                  <input className="ep-input" type="text" value={eyeColor} onChange={e => setEyeColor(e.target.value)} placeholder="เช่น ดำ, น้ำตาล" />
                </div>
              )}
            </div>

            {/* Card 3 — สุขภาพ & ข้อมูลการแพทย์ */}
            <div className="ep-card">
              <div className="ep-card-title">
                <img src="/icons/icon-health.png" alt="" />
                สุขภาพ & ข้อมูลการแพทย์
              </div>

              <div className="ep-grid2">
                <div className="ep-field">
                  <label className="ep-label">กรุ๊ปเลือด</label>
                  <select className="ep-select" value={bloodType} onChange={e => setBloodType(e.target.value)}>
                    <option value="">ไม่ทราบ...</option>
                    {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="ep-field">
                  <label className="ep-label">ไมโครชิพ</label>
                  <input className="ep-input" type="text" value={microchip} onChange={e => setMicrochip(e.target.value)} placeholder="หมายเลขไมโครชิพ" style={{ fontFamily: 'monospace' }} />
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label">สิ่งที่แพ้</label>
                <input className="ep-input" type="text" value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="เช่น อาหารทะเล, ยา..." />
              </div>

              <div className="ep-field" style={{ marginBottom: 0 }}>
                <label className="ep-label">นิสัย / หมายเหตุ</label>
                <input className="ep-input" type="text" value={traits} onChange={e => setTraits(e.target.value)} placeholder="เช่น ขี้อ้อน ชอบนอนตัก" />
              </div>
            </div>

            {/* Card 4 — ข้อมูลฟาร์ม */}
            <div className="ep-card">
              <div className="ep-card-title">
                <img src="/icons/icon-breeding.png" alt="" />
                ข้อมูลฟาร์ม & สถานะ
              </div>

              <div className="ep-field">
                <label className="ep-label">สถานะ</label>
                <select className="ep-select" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value={PET_STATUS.UNSPECIFIED}>-- ไม่ระบุ --</option>
                  <option value={PET_STATUS.KID}>เด็ก</option>
                  <option value={PET_STATUS.BREEDER}>พ่อพันธุ์ / แม่พันธุ์</option>
                  <option value={PET_STATUS.AVAILABLE}>พร้อมย้ายบ้าน</option>
                  <option value={PET_STATUS.RESERVED}>ติดจอง</option>
                  <option value={PET_STATUS.RETIRED}>ทำหมัน / ปลดระวาง</option>
                </select>
              </div>

              {(status === PET_STATUS.AVAILABLE || status === PET_STATUS.RESERVED) && (
                <div className="ep-field" style={{ marginBottom: 0 }}>
                  <label className="ep-label" style={{ color: F.pink }}>ค่าตัว / สินสอด (บาท)</label>
                  <input className="ep-input ep-price-input" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="เช่น 15000" />
                </div>
              )}
            </div>

            {/* Delete */}
            <div className="ep-delete-zone">
              <button type="button" className="ep-delete-btn" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting || saving}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                ลบโปรไฟล์สัตว์เลี้ยง
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Fixed Save Bar */}
      <div className="ep-save-bar">
        <button className="ep-save-btn" onClick={handleSave as any} disabled={saving || isDeleting}>
          {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
        </button>
      </div>

      {/* Delete Confirm Sheet */}
      {showDeleteConfirm && (
        <div className="ep-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="ep-confirm-sheet" onClick={e => e.stopPropagation()}>
            <div className="ep-confirm-title">ลบโปรไฟล์ "{petName}"?</div>
            <div className="ep-confirm-sub">ข้อมูลทั้งหมดของสัตว์เลี้ยงตัวนี้จะถูกลบถาวร ไม่สามารถกู้คืนได้</div>
            <div className="ep-confirm-actions">
              <button className="ep-confirm-cancel" onClick={() => setShowDeleteConfirm(false)}>ยกเลิก</button>
              <button className="ep-confirm-ok" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? "กำลังลบ..." : "ลบถาวร"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {imageSrc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)', padding: 16 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 360, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', height: 300, background: '#111' }}>
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div style={{ padding: '20px 20px 24px' }}>
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={e => setZoom(Number(e.target.value))} style={{ width: '100%', accentColor: F.pink, marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setImageSrc(null)} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${F.line}`, background: 'white', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: F.inkSoft, cursor: 'pointer' }}>ยกเลิก</button>
                <button type="button" onClick={handleUploadCroppedImage} disabled={isUploading} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: F.ink, color: 'white', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: isUploading ? .6 : 1 }}>{isUploading ? "กำลังอัปโหลด..." : "ยืนยัน"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
