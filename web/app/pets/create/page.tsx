"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Cropper from "react-easy-crop";
import { OTHER_SPECIES, speciesTh } from "@/lib/species";
import { PET_GENDER } from "@/lib/constants";

// โ”€โ”€โ”€ Premium CI Tokens โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

// โ”€โ”€โ”€ เธชเธฒเธขเธเธฑเธเธเธธเนเธ•เธฒเธกเธเธเธดเธ”เธชเธฑเธ•เธงเน โ”€โ”€โ”€
const breedData: Record<string, string[]> = {
  cat: ["เนเธกเธงเธเนเธฒเธ / เธเธฑเธเธเธธเนเธเธชเธก (Domestic / Mix)", "เนเธเธเธเธฒ (Konja)", "เธเธฒเธงเธกเธ“เธต (Khao Manee)", "เนเธเธฃเธฒเธ / เธชเธตเธชเธงเธฒเธ” (Korat)", "เธ”เธตเธงเธญเธ เน€เธฃเนเธเธเน (Devon Rex)", "เธเธฃเธดเธ•เธดเธ เธเนเธญเธ•เนเธฎเธฃเน (British Shorthair)", "เน€เธเธเธเธญเธฅ (Bengal)", "เน€เธเธญเธฃเนเน€เธเธตเธข (Persian)", "เธกเธฑเธเธเนเธเธดเนเธ (Munchkin)", "เน€เธกเธเธเธนเธ (Maine Coon)", "เนเธฃเนเธเธ”เธญเธฅ (Ragdoll)", "เธงเธดเน€เธเธตเธขเธฃเธกเธฒเธจ (Siamese)", "เธจเธธเธ เธฅเธฑเธเธฉเธ“เน (Suphalak)", "เธชเธเนเธญเธ•เธ•เธดเธ เนเธเธฅเธ”เน (Scottish Fold)", "เธชเธเธดเธเธเน (Sphynx)", "เธญเน€เธกเธฃเธดเธเธฑเธ เธเธญเธฃเนเธ•เนเธฎเธฃเน (American Shorthair)", "เน€เธญเนเธเนเธเธ•เธดเธ เธเธญเธฃเนเธ•เนเธฎเธฃเน (Exotic Shorthair)", "เธญเธทเนเธเน"],
  dog: ["เธเธฑเธเธเธธเนเธ—เธฒเธ / เธเธฑเธเธเธธเนเธเธชเธก (Mixed)", "เธเธญเธฃเนเธเธตเน (Corgi)", "เธเธดเธเธฐ เธญเธดเธเธธ (Shiba Inu)", "เธเธดเธงเธฒเธงเธฒ (Chihuahua)", "เธเธดเธชเธธ (Shih Tzu)", "เธเธฒเธกเธญเธขเธ”เน (Samoyed)", "เนเธเธเธตเน€เธฃเธตเธขเธ เธฎเธฑเธชเธเธตเน (Siberian Husky)", "เนเธเนเธเธฃเธฑเธชเน€เธเธฅเธฅเน เน€เธ—เธญเธฃเนเน€เธฃเธตเธข (Jack Russell)", "เนเธ—เธขเธเธฒเธเนเธเนเธง (Thai Bangkaew)", "เนเธ—เธขเธซเธฅเธฑเธเธญเธฒเธ (Thai Ridgeback)", "เธเธตเน€เธเธดเนเธฅ (Beagle)", "เธเธญเธกเน€เธกเธญเน€เธฃเน€เธเธตเธขเธ (Pomeranian)", "เธเธธเธ”เน€เธ”เธดเนเธฅเธ—เธญเธข (Toy Poodle)", "เน€เธเธฃเธเธเน เธเธนเธฅเธ”เนเธญเธ (French Bulldog)", "เธขเธญเธฃเนเธเน€เธเธตเธขเธฃเน เน€เธ—เธญเธฃเนเน€เธฃเธตเธข (Yorkshire Terrier)", "เธฅเธฒเธเธฃเธฒเธ”เธญเธฃเน เธฃเธตเธ—เธฃเธตเธเน€เธงเธญเธฃเน (Labrador)", "เนเธเธฅเน€เธ”เนเธ เธฃเธตเธ—เธฃเธตเธเน€เธงเธญเธฃเน (Golden Retriever)", "เธญเน€เธกเธฃเธดเธเธฑเธ เธเธนเธฅเธฅเธตเน (American Bully)", "เธญเธฅเธฒเธชเธเธฑเธ เธกเธฒเธฅเธฒเธกเธดเธงเธ—เน (Alaskan Malamute)", "เธญเธทเนเธเน"],
  rabbit: ["เธฎเธญเธฅเนเธฅเธเธ”เน เธฅเธญเธ (Holland Lop)", "เน€เธเน€เธเธญเธฃเนเนเธฅเธเธ”เน เธ”เธงเธญเธฃเนเธ (Netherland Dwarf)", "เธกเธดเธเธดเน€เธฃเนเธเธเน (Mini Rex)", "เนเธฅเธญเนเธญเธเน€เธฎเธ” (Lionhead)", "เธญเธดเธเธฅเธดเธ เนเธญเธเนเธเธฃเนเธฒ (English Angora)", "เน€เธเธฃเธเธเน เธฅเธญเธ (French Lop)", "เธญเธทเนเธเน"],
  hamster: ["เธงเธดเธเน€เธ—เธญเธฃเนเนเธงเธ—เน (Winter White)", "เนเธเน€เธฃเธตเธขเธ (Syrian)", "เนเธฃเนเธเธฃเธญเธเธชเธเธต (Roborovski)", "เนเธเธกเธเนเน€เธเธฅเธฅเน (Campbell)", "เธญเธทเนเธเน"],
  bird: ["เธเธญเธเธฑเธช (Forpus)", "เธเนเธญเธเธเธฒเน€เธ—เธฅ (Cockatiel)", "เธเธฑเธเธเธญเธเธฑเธงเธฃเน (Sun Conure)", "เน€เธฅเธดเธเน€เธเธดเธฃเนเธ” (Lovebird)", "เธซเธเธชเนเธซเธขเธ (Budgerigar)", "เนเธญเธเธฃเธดเธเธฑเธเน€เธเธฃเธขเน (African Grey)", "เธกเธฒเธเธญเธงเน (Macaw)", "เธเธฃเธตเธเธเธตเธ (Green Cheek)", "เธญเธทเนเธเน"],
  squirrel: ["เธเธฃเธฐเธฃเธญเธเธเธดเธ (Flying Squirrel)", "เธเธนเธเธฒเธฃเนเนเธเธฅเน€เธ”เธญเธฃเน (Sugar Glider)", "เนเธเธฃเธตเนเธ”เนเธญเธ (Prairie Dog)", "เธเธฃเธฐเธฃเธญเธเธ”เธ (Finlayson's)", "เธญเธทเนเธเน"],
  hedgehog: ["เน€เธกเนเธเนเธเธฃเธฐเนเธญเธเธฃเธดเธเธฑเธ (African Pygmy)", "เธญเธทเนเธเน"],
  fish: ["เธเธฅเธฒเธเธฑเธ” (Betta)", "เธเธฅเธฒเธเธฒเธฃเนเธ (Koi)", "เธเธฅเธฒเธ—เธญเธ (Goldfish)", "เธเธฅเธฒเธซเธฒเธเธเธเธขเธนเธ (Guppy)", "เธเธฅเธฒเธซเธกเธญเธชเธต (Flowerhorn)", "เธเธฅเธฒเธกเธฑเธเธเธฃ (Arowana)", "เธญเธทเนเธเน"],
  turtle: ["เธเธนเธเธฒเธ•เนเธฒ (Sulcata)", "เธ”เธฒเธงเธญเธดเธเน€เธ”เธตเธข (Indian Star)", "เธญเธฑเธฅเธ”เธฃเธฒเธเธฃเนเธฒ (Aldabra)", "เน€เธ•เนเธฒเธเธตเนเธเธธเนเธ (Red-eared Slider)", "เน€เธ•เนเธฒเธซเธกเธนเธเธดเธ (Pig-nosed)", "เธญเธทเนเธเน"],
  frog: ["เธฎเธญเธฃเนเธเธเธฃเนเธญเธ (Horned Frog)", "เนเธงเธ—เนเธ—เธฃเธตเธเธฃเนเธญเธ (White's Tree Frog)", "เธญเธถเนเธเนเธกเนเธซเธเธฒเธง (Chubby Frog)", "เธเธเธฅเธนเธเธจเธฃเธเธดเธฉ (Poison Dart)", "เธญเธทเนเธเน"],
  lizard: ["เน€เธเธตเธขเธฃเนเธ”เธ”เธฃเธฒเธเนเธญเธ (Bearded Dragon)", "เน€เธ•เธเธน (Tegu)", "เธญเธตเธเธฑเธงเธเนเธฒ (Iguana)", "เธเธฒเน€เธกเน€เธฅเธตเนเธขเธ (Chameleon)", "เน€เธเธฃเธชเน€เธ•เธ”เน€เธเธ•เธธเนเธ (Crested Gecko)", "เน€เธฅเธเน€เธเธดเธฃเนเธ”เน€เธเธ•เธธเนเธ (Leopard Gecko)", "เธญเธทเนเธเน"],
  snake: ["เธเธญเธฃเนเธเธชเน€เธเธ (Corn Snake)", "เธเธญเธฅเนเธเธเธญเธ (Ball Python)", "เธฎเนเธญเธเนเธเธช (Hognose)", "เธเธดเธเธชเน€เธเธ (King Snake)", "เธกเธดเธฅเธเนเธชเน€เธเธ (Milk Snake)", "เธญเธทเนเธเน"],
  raccoon: ["เนเธฃเนเธเธเธนเธ (Raccoon)", "เธญเธทเนเธเน"],
  other: ["เน€เธกเธตเธขเธฃเนเนเธเธ• (Meerkat)", "เน€เธเธญเธฃเนเน€เธฃเธ— (Ferret)", "เธเธดเธเธเธดเธฅเธฅเนเธฒ (Chinchilla)", "เธเธธเธเน€เธเธเธตเน (Bushbaby)", "เธญเธทเนเธเน"],
};

// โ”€โ”€โ”€ เธชเธต (เธชเธตเธเธทเนเธ) / เธฅเธฒเธข / เธซเธน / เธเธฒ / เธเธ / เธชเธตเธ•เธฒ (เธญเนเธฒเธเธญเธดเธเธเธฒเธฃเนเธ• Housecat) โ”€โ”€โ”€
const COLOR_DATA: Record<string, string[]> = {
  cat: ["เธ”เธณ (Black)", "เธเธฅเธน / เน€เธ—เธฒ (Blue / Grey)", "เธเนเธญเธเนเธเนเธฅเธ• (Chocolate)", "เนเธฅเนเธฅเธ (Lilac)", "เธเธดเธเธเธฒเธกเธญเธ (Cinnamon)", "เธเธญเธงเนเธ (Fawn)", "เนเธ”เธ / เธชเนเธก (Red / Orange)", "เธเธฃเธตเธก (Cream)", "เธเธฒเธง (White)", "เธ—เธญเธฃเนเธ•เธตเน / เธชเธตเน€เธเธฃเธญเธฐ (Tortoiseshell)", "เธญเธทเนเธเน"],
  dog: ["เธ”เธณ (Black)", "เธเธฒเธง (White)", "เธเนเธณเธ•เธฒเธฅ / เธเนเธญเธเนเธเนเธฅเธ• (Brown / Chocolate)", "เธ—เธญเธ / เน€เธซเธฅเธทเธญเธ (Golden / Yellow)", "เธเธฃเธตเธก (Cream)", "เนเธ”เธ / เธเนเธณเธ•เธฒเธฅเนเธ”เธ (Red)", "เน€เธ—เธฒ / เธเธฅเธน (Grey / Blue)", "เธเธญเธงเนเธ (Fawn)", "เธชเธฒเธกเธชเธต (Tricolor)", "เธฅเธฒเธขเธซเธดเธเธญเนเธญเธ (Merle)", "เธฅเธฒเธขเน€เธชเธทเธญ (Brindle)", "เธญเธทเนเธเน"],
  other: ["เธ”เธณ (Black)", "เธเธฒเธง (White)", "เธเนเธณเธ•เธฒเธฅ (Brown)", "เน€เธ—เธฒ (Grey)", "เธเธฃเธตเธก (Cream)", "เธซเธฅเธฒเธขเธชเธต (Multi-color)", "เน€เธเธทเธญเธ (Albino)", "เธญเธทเนเธเน"],
};
const PATTERN_DATA: Record<string, string[]> = {
  cat: ["เธชเธตเน€เธ”เธตเธขเธงเธฅเนเธงเธ (Solid)", "เธฅเธฒเธขเธชเธฅเธดเธ”-เนเธกเธเน€เธเธญเน€เธฃเธฅ (Mackerel Tabby)", "เธฅเธฒเธขเธชเธฅเธดเธ”-เธเธฅเธฒเธชเธชเธดเธ (Classic Tabby)", "เธฅเธฒเธขเธเธธเธ” (Spotted Tabby)", "เธฅเธฒเธขเธ—เธดเธเธ•เน (Ticked Tabby)", "เธชเธตเนเธ•เนเธก / เธเนเธญเธขเธ—เน (Colorpoint)", "เธชเธญเธเธชเธต / เธเธฒเธงเนเธ•เนเธก (Bicolor)", "เธ—เธญเธฃเนเธ•เธตเน (Tortie)", "เธชเธฒเธกเธชเธต / เนเธเธฅเธดเนเธ (Calico)", "เธ—เธดเธเธเธดเนเธ-เธเธดเธเธเธดเธฅเธฅเนเธฒ (Chinchilla)", "เธ—เธดเธเธเธดเนเธ-เน€เธเธ”เน€เธ”เธ” (Shaded)", "เธ—เธดเธเธเธดเนเธ-เธชเนเธกเธ (Smoke)", "เธญเธทเนเธเน"],
  default: ["เธชเธตเน€เธ”เธตเธขเธงเธฅเนเธงเธ (Solid)", "เธชเธญเธเธชเธต (Bicolor)", "เธซเธฅเธฒเธขเธชเธต / เธฅเธงเธ”เธฅเธฒเธขเธเธชเธก (Multi-color)", "เน€เธเธทเธญเธ (Albino)", "เธญเธทเนเธเน"],
};
const EYE_OPTIONS = ["เน€เธเธตเธขเธง (Green)", "เน€เธฎเน€เธเธฅ (Hazel)", "เธ—เธญเธ (Gold)", "เน€เธซเธฅเธทเธญเธ (Yellow)", "เธญเธณเธเธฑเธ (Amber)", "เธชเนเธก (Orange)", "เธเธญเธเน€เธเธญเธฃเน (Copper)", "เธเนเธฒ (Blue)", "เธ•เธฒเธชเธญเธเธชเธต (Odd-eyed)", "เธ•เธฒเธซเธฅเธฒเธขเธชเธตเนเธเธ”เธงเธเน€เธ”เธตเธขเธง (Dichroic)", "เธญเธทเนเธเน"];
const EAR_OPTIONS = ["เธซเธนเธ•เธฑเนเธ", "เธซเธนเธเธฑเธ", "เธซเธนเธเธฅเธดเธ"];
const LEG_OPTIONS = ["เธเธฒเธชเธฑเนเธ", "เธเธฒเธขเธฒเธง"];
const COAT_OPTIONS = ["เธเธเธชเธฑเนเธ", "เธเธเธขเธฒเธง", "เธเธเธซเธขเธดเธ", "เนเธกเนเธกเธตเธเธ"];

const colorOptionsFor = (s: string) => COLOR_DATA[s] || COLOR_DATA.other;
const patternOptionsFor = (s: string) => PATTERN_DATA[s] || PATTERN_DATA.default;


// โ”€โ”€โ”€ Icons โ”€โ”€โ”€
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

  // เธเธญเธฃเนเธก
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<string>("cat"); // cat / dog / (เธเธเธดเธ”เธญเธทเนเธเน€เธเนเธ string เธ•เธฃเธเน)
  const [pickOther, setPickOther] = useState(false);      // เน€เธเธดเธ”เนเธซเธกเธ”เน€เธฅเธทเธญเธเธชเธฑเธ•เธงเนเธญเธทเนเธ
  const [breed, setBreed] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [color, setColor] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [pattern, setPattern] = useState("");
  const [ear, setEar] = useState("");
  const [leg, setLeg] = useState("");
  const [coat, setCoat] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [gender, setGender] = useState(PET_GENDER.MALE);
  const [birthdate, setBirthdate] = useState("");
  const [weight, setWeight] = useState("");
  const [allergies, setAllergies] = useState("");
  const [traits, setTraits] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // เธเธฃเธญเธเธฃเธนเธ
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
      if (!session) router.push(`/login?redirect=${encodeURIComponent('/pets/create')}`);
      else setUserId(session.user.id);
    };
    checkUser();
  }, [router]);

  // เธเธเธดเธ”เธ—เธตเนเนเธเนเน€เธฅเธทเธญเธเธเธธเธ” dropdown (species เน€เธเนเธ id เธญเธฑเธเธเธคเธฉเธฅเนเธงเธ)
  const speciesKey = breedData[species] ? species : 'other';
  const colorKey = species === 'cat' ? 'cat' : species === 'dog' ? 'dog' : 'other';
  const isCat = species === 'cat';

  const pickSpecies = (s: string) => {
    setSpecies(s); setPickOther(false);
    setBreed(""); setCustomBreed(""); setColor(""); setCustomColor("");
    setPattern(""); setEar(""); setLeg(""); setCoat(""); setEyeColor("");
  };

  // โ”€โ”€ เธฃเธนเธ โ”€โ”€
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
      alert("เธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเนเธกเนเธชเธณเน€เธฃเนเธ: " + (err.message || ''));
    } finally { setIsUploading(false); }
  };

  // โ”€โ”€ เธเธฑเธเธ—เธถเธ (เนเธกเนเธกเธต status โ€” เธชเธฑเธ•เธงเนเธชเนเธงเธเธ•เธฑเธง) โ”€โ”€
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธชเธฑเธ•เธงเนเน€เธฅเธตเนเธขเธ");
    setSaving(true);

    const finalSpecies = species; // เน€เธเนเธเน€เธเนเธ id เธญเธฑเธเธเธคเธฉ (cat/dog/rabbit...) เธ•เธฒเธกเธกเธฒเธ•เธฃเธเธฒเธเธเธฅเธฒเธ
    const finalBreed = breed === 'เธญเธทเนเธเน' ? customBreed : breed;
    const finalColor = color === 'เธญเธทเนเธเน' ? customColor : color;

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
      alert("เธเธฑเธเธ—เธถเธเนเธกเนเธชเธณเน€เธฃเนเธ: " + error.message);
      setSaving(false);
    } else if (data && data.length > 0) {
      router.push(`/pets/${data[0].id}`);
      router.refresh();
    }
  };

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .cp-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .cp-body { max-width: 680px; margin: 0 auto; padding: 24px 20px 120px; }
        /* header */
        .cp-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .cp-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.pinkBorder}; box-shadow: 0 2px 8px rgba(232,70,119,0.1); transition: all .18s ease; flex-shrink: 0; }
        .cp-back:hover { color: ${F.pink}; border-color: ${F.pink}; transform: translateX(-1px); }
        .cp-title { font-family: inherit; font-size: 24px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .cp-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        /* photo */
        .cp-photo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 22px; }
        .cp-photo { position: relative; }
        .cp-photo-circle { width: 120px; height: 120px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; border: 3px solid white; box-shadow: 0 4px 16px rgba(232,70,119,0.15); display: flex; align-items: center; justify-content: center; font-size: 44px; cursor: pointer; transition: all .18s; }
        .cp-photo-circle:hover { box-shadow: 0 6px 22px rgba(232,70,119,0.25); }
        .cp-photo-circle img { width: 100%; height: 100%; object-fit: cover; }
        .cp-photo-btn { position: absolute; bottom: 2px; right: 2px; width: 38px; height: 38px; border-radius: 50%; background: ${F.pink}; color: white; border: 3px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; }
        .cp-photo-btn:hover { background: #D63F6A; }
        .cp-photo-btn:active { transform: scale(0.9); }
        .cp-photo-hint { margin-top: 10px; font-size: 11px; font-weight: 700; color: ${F.muted}; letter-spacing: 0.04em; }
        /* card */
        .cp-card { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 22px; margin-bottom: 16px; }
        .cp-card-title { font-family: inherit; font-size: 15px; font-weight: 700; color: ${F.ink}; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .cp-card-title::before { content: ''; width: 4px; height: 16px; background: ${F.pink}; border-radius: 2px; }
        /* fields */
        .cp-field { margin-bottom: 16px; }
        .cp-field:last-child { margin-bottom: 0; }
        .cp-label { display: block; font-size: 12px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; margin-left: 2px; }
        .cp-label .opt { color: ${F.muted}; font-weight: 500; }
        .cp-input, .cp-select { width: 100%; padding: 11px 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .cp-input:focus, .cp-select:focus { border-color: ${F.pink}; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .cp-select { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 18px; padding-right: 38px; cursor: pointer; }
        .cp-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .cp-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        /* species picker */
        .cp-species { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .cp-species-btn { padding: 14px 8px; border-radius: 14px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all .15s; font-family: inherit; }
        .cp-species-btn.active { border-color: ${F.teal}; background: ${F.tealSoft}; }
        .cp-species-btn .emoji { font-size: 24px; }
        .cp-species-btn .lbl { font-size: 12px; font-weight: 700; color: ${F.inkSoft}; }
        .cp-species-btn.active .lbl { color: ${F.teal}; }
        /* other pets grid */
        .cp-other-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
        .cp-other-btn { padding: 10px 4px; border-radius: 11px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; transition: all .15s; font-family: inherit; }
        .cp-other-btn.active { border-color: ${F.teal}; background: ${F.tealSoft}; }
        .cp-other-btn .emoji { font-size: 20px; }
        .cp-other-btn .lbl { font-size: 9px; font-weight: 700; color: ${F.inkSoft}; text-align: center; line-height: 1.2; }
        .cp-other-btn.active .lbl { color: ${F.teal}; }
        /* gender toggle */
        .cp-gender { display: flex; gap: 8px; }
        .cp-gender-btn { flex: 1; padding: 11px 6px; border-radius: 12px; border: 1.5px solid ${F.lineMid}; background: white; cursor: pointer; font-size: 13px; font-weight: 700; color: ${F.muted}; transition: all .15s; font-family: inherit; white-space: nowrap; text-align: center; }
        .cp-gender-btn.male.active { border-color: #2563EB; background: #EFF6FF; color: #2563EB; }
        .cp-gender-btn.female.active { border-color: ${F.pink}; background: ${F.pinkSoft}; color: ${F.pink}; }
        /* save bar */
        .cp-savebar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .cp-savebar-inner { max-width: 680px; margin: 0 auto; display: flex; gap: 12px; }
        .cp-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; text-decoration: none; }
        .cp-btn-cancel { flex: 0 0 auto; padding: 14px 22px; background: white; color: ${F.inkSoft}; border: 1px solid ${F.lineMid}; }
        .cp-btn-cancel:hover { background: ${F.line}; }
        .cp-btn-save { background: ${F.pink}; color: white; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .cp-btn-save:hover { background: #D63F6A; }
        .cp-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        /* crop modal */
        .cp-modal { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); padding: 16px; }
        .cp-modal-card { background: white; width: 100%; max-width: 380px; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .cp-crop-area { position: relative; width: 100%; height: 320px; background: #111; }
        .cp-modal-body { padding: 20px; }
        .cp-zoom { width: 100%; accent-color: ${F.pink}; margin-bottom: 16px; }
        .cp-modal-btns { display: flex; gap: 10px; }
        @media (max-width: 480px) {
          .cp-grid3 { grid-template-columns: 1fr 1fr; }
          .cp-other-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div className="cp-page">
        <div className="cp-body">
          {/* Header */}
          <div className="cp-header">
            <button className="cp-back" onClick={() => router.push(fromRedirect && fromRedirect.startsWith('/') ? fromRedirect : '/profile')} aria-label="เธขเนเธญเธเธเธฅเธฑเธ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="cp-title">เน€เธเธดเนเธกเธชเธฑเธ•เธงเนเน€เธฅเธตเนเธขเธ</h1>
              <p className="cp-sub">เน€เธเธดเนเธกเน€เธเธทเนเธญเธเธฃเธฑเธเน€เธเนเธฒเธชเธนเนเธเธฃเธญเธเธเธฃเธฑเธงเธเธญเธเธเธธเธ“</p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            {/* เธฃเธนเธ */}
            <div className="cp-photo-wrap">
              <div className="cp-photo">
                <div className="cp-photo-circle" onClick={() => originalImageSrc ? setImageSrc(originalImageSrc) : fileInputRef.current?.click()}>
                  {avatarUrl ? <img src={avatarUrl} alt="เธฃเธนเธเธชเธฑเธ•เธงเนเน€เธฅเธตเนเธขเธ" /> : (species === 'cat' ? '๐ฑ' : species === 'dog' ? '๐ถ' : '๐พ')}
                </div>
                <button type="button" className="cp-photo-btn" onClick={() => fileInputRef.current?.click()}><Icon.Camera /></button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} onClick={(e) => (e.currentTarget.value = "")} style={{ display: 'none' }} />
              </div>
              <p className="cp-photo-hint">{originalImageSrc ? "เนเธ•เธฐเน€เธเธทเนเธญเธเธฃเธฑเธเธ•เธณเนเธซเธเนเธเธฃเธนเธ" : "เธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเธ เธฒเธ"}</p>
            </div>

            {/* เธเธฒเธฃเนเธ” 1: เธเนเธญเธกเธนเธฅเธเธทเนเธเธเธฒเธ */}
            <div className="cp-card">
              <div className="cp-card-title">เธเนเธญเธกเธนเธฅเธเธทเนเธเธเธฒเธ</div>

              <div className="cp-field">
                <label className="cp-label">เธเธทเนเธญเธชเธฑเธ•เธงเนเน€เธฅเธตเนเธขเธ</label>
                <input className="cp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="เน€เธเนเธ เธเนเธญเธเธ–เธธเธเธ—เธญเธ" required />
              </div>

              <div className="cp-field">
                <label className="cp-label">เธเธฃเธฐเน€เธ เธ—</label>
                <div className="cp-species">
                  {[{ id: 'cat', emoji: '๐ฑ', lbl: 'เนเธกเธง' }, { id: 'dog', emoji: '๐ถ', lbl: 'เธซเธกเธฒ' }, { id: 'other', emoji: '๐พ', lbl: 'เธญเธทเนเธเน' }].map((t) => {
                    const active = t.id === 'other' ? (pickOther || (species !== 'cat' && species !== 'dog')) : species === t.id;
                    return (
                      <button key={t.id} type="button" className={`cp-species-btn ${active ? 'active' : ''}`}
                        onClick={() => t.id === 'other' ? (setPickOther(true), setSpecies(''), setBreed(''), setColor(''), setPattern(''), setEar(''), setLeg(''), setCoat(''), setEyeColor('')) : pickSpecies(t.id)}>
                        <span className="emoji">{t.emoji}</span>
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
                        <span className="emoji">{o.emoji}</span>
                        <span className="lbl">{o.th}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="cp-grid2">
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">เน€เธเธจ</label>
                  <div className="cp-gender">
                    <button type="button" className={`cp-gender-btn male ${gender === PET_GENDER.MALE ? 'active' : ''}`} onClick={() => setGender(PET_GENDER.MALE)}>โ เธ•เธฑเธงเธเธนเน</button>
                    <button type="button" className={`cp-gender-btn female ${gender === PET_GENDER.FEMALE ? 'active' : ''}`} onClick={() => setGender(PET_GENDER.FEMALE)}>โ€ เธ•เธฑเธงเน€เธกเธตเธข</button>
                  </div>
                </div>
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">เธงเธฑเธเน€เธเธดเธ” <span className="opt">(เธ–เนเธฒเธ—เธฃเธฒเธ)</span></label>
                  <input type="date" className="cp-input" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* เธเธฒเธฃเนเธ” 2: เธฅเธฑเธเธฉเธ“เธฐ */}
            <div className="cp-card">
              <div className="cp-card-title">เธฅเธฑเธเธฉเธ“เธฐเนเธฅเธฐเธฃเธนเธเธเธฃเธฃเธ“</div>

              {(species === 'cat' || species === 'dog' || breedData[species]) && (
                <div className="cp-field">
                  <label className="cp-label">เธชเธฒเธขเธเธฑเธเธเธธเน</label>
                  <select className="cp-select" value={breed} onChange={(e) => setBreed(e.target.value)}>
                    <option value="">เน€เธฅเธทเธญเธเธชเธฒเธขเธเธฑเธเธเธธเน...</option>
                    {(breedData[speciesKey] || []).map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {breed === 'เธญเธทเนเธเน' && (
                    <input className="cp-input" style={{ marginTop: 8 }} value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} placeholder="เธฃเธฐเธเธธเธชเธฒเธขเธเธฑเธเธเธธเนเน€เธเธดเนเธกเน€เธ•เธดเธก..." />
                  )}
                </div>
              )}

              <div className="cp-grid2">
                <div className="cp-field">
                  <label className="cp-label">เธชเธต (เธชเธตเธเธทเนเธ)</label>
                  <select className="cp-select" value={color} onChange={(e) => setColor(e.target.value)}>
                    <option value="">เน€เธฅเธทเธญเธเธชเธต...</option>
                    {colorOptionsFor(colorKey).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="cp-field">
                  <label className="cp-label">เธฅเธฒเธข / เธฅเธงเธ”เธฅเธฒเธข</label>
                  <select className="cp-select" value={pattern} onChange={(e) => setPattern(e.target.value)}>
                    <option value="">เน€เธฅเธทเธญเธเธฅเธฒเธข...</option>
                    {patternOptionsFor(speciesKey === 'cat' ? 'cat' : 'default').map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              {color === 'เธญเธทเนเธเน' && (
                <input className="cp-input" style={{ marginTop: -6, marginBottom: 16 }} value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="เธฃเธฐเธเธธเธชเธตเธ”เนเธงเธขเธ•เธเน€เธญเธ..." />
              )}

              <div className="cp-grid3">
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">เธฅเธฑเธเธฉเธ“เธฐเธซเธน</label>
                  <select className="cp-select" value={ear} onChange={(e) => setEar(e.target.value)}>
                    <option value="">-</option>
                    {EAR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">เธฅเธฑเธเธฉเธ“เธฐเธเธฒ</label>
                  <select className="cp-select" value={leg} onChange={(e) => setLeg(e.target.value)}>
                    <option value="">-</option>
                    {LEG_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">เธฅเธฑเธเธฉเธ“เธฐเธเธ</label>
                  <select className="cp-select" value={coat} onChange={(e) => setCoat(e.target.value)}>
                    <option value="">-</option>
                    {COAT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="cp-grid2" style={{ marginTop: 16 }}>
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">เธชเธตเธ•เธฒ</label>
                  <select className="cp-select" value={eyeColor} onChange={(e) => setEyeColor(e.target.value)}>
                    <option value="">เน€เธฅเธทเธญเธเธชเธตเธ•เธฒ...</option>
                    {EYE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="cp-field" style={{ marginBottom: 0 }}>
                  <label className="cp-label">เธเนเธณเธซเธเธฑเธ (เธเธ.) <span className="opt">(เธ–เนเธฒเธ—เธฃเธฒเธ)</span></label>
                  <input type="number" step="0.1" min="0" className="cp-input" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="เน€เธเนเธ 3.5" />
                </div>
              </div>
            </div>

            {/* เธเธฒเธฃเนเธ” 3: เน€เธเธดเนเธกเน€เธ•เธดเธก */}
            <div className="cp-card">
              <div className="cp-card-title">เธเนเธญเธกเธนเธฅเน€เธเธดเนเธกเน€เธ•เธดเธก</div>
              <div className="cp-field">
                <label className="cp-label">เธชเธดเนเธเธ—เธตเนเนเธเน <span className="opt">(เธ–เนเธฒเธกเธต)</span></label>
                <input className="cp-input" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="เน€เธเนเธ เนเธเนเธญเธฒเธซเธฒเธฃเธ—เธฐเน€เธฅ, เนเธเนเธขเธฒเธเธฒเธเธเธเธดเธ”" />
              </div>
              <div className="cp-field">
                <label className="cp-label">เธเธดเธชเธฑเธข / เธซเธกเธฒเธขเน€เธซเธ•เธธ <span className="opt">(เธ–เนเธฒเธกเธต)</span></label>
                <input className="cp-input" value={traits} onChange={(e) => setTraits(e.target.value)} placeholder="เน€เธเนเธ เธเธตเนเธญเนเธญเธ เธเธญเธเธเธญเธเธ•เธฑเธ" />
              </div>
            </div>
          </form>
        </div>

        {/* Save bar */}
        <div className="cp-savebar">
          <div className="cp-savebar-inner">
            <button type="button" className="cp-btn cp-btn-cancel" onClick={() => router.push('/profile')}>เธขเธเน€เธฅเธดเธ</button>
            <button type="button" className="cp-btn cp-btn-save" onClick={handleSave} disabled={saving}>
              <Icon.Save /> {saving ? "เธเธณเธฅเธฑเธเธเธฑเธเธ—เธถเธ..." : "เน€เธเธดเนเธกเธชเธฑเธ•เธงเนเน€เธฅเธตเนเธขเธ"}
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
                <button type="button" className="cp-btn cp-btn-cancel" style={{ flex: 1 }} onClick={() => setImageSrc(null)}>เธขเธเน€เธฅเธดเธ</button>
                <button type="button" className="cp-btn cp-btn-save" onClick={handleUploadCropped} disabled={isUploading}>
                  {isUploading ? 'เธเธณเธฅเธฑเธเธญเธฑเธเนเธซเธฅเธ”...' : 'เธขเธทเธเธขเธฑเธ'}
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