// ─── Whiskora shared TypeScript interfaces ────────────────────────────────────

import type { ReactNode } from "react";

// ── Farm ─────────────────────────────────────────────────────────────────────
export interface Farm {
  id: string;
  user_id: string;
  farm_name: string;
  description?: string | null;
  location?: string | null;
  province?: string | null;
  profile_image_url?: string | null;
  cover_image_url?: string | null;
  is_verified?: boolean;
  pet_type?: string | null;
  certification?: string | null;
  line_id?: string | null;
  phone?: string | null;
  website?: string | null;
  name?: string | null;
  created_at?: string;
}

// ── Pet ──────────────────────────────────────────────────────────────────────
export interface Pet {
  id: string;
  user_id: string;
  farm_id?: string | null;
  litter_id?: string | null;
  name: string;
  species?: string | null;
  breed?: string | null;
  gender?: string | null;
  status?: string | null;
  birth_date?: string | null;
  weight?: number | null;
  color?: string | null;
  pattern?: string | null;
  coat?: string | null;
  eye_color?: string | null;
  blood_type?: string | null;
  image_url?: string | null;
  gallery_urls?: string | null;
  microchip_number?: string | null;
  pedigree_number?: string | null;
  is_neutered?: boolean;
  chronic_diseases?: string | null;
  allergies?: string | null;
  traits?: string | null;
  health_notes?: string | null;
  sire_id?: string | null;
  dam_id?: string | null;
  paternal_grandsire?: string | null;
  paternal_granddam?: string | null;
  maternal_grandsire?: string | null;
  maternal_granddam?: string | null;
  created_at?: string;
  // Joined relations
  farm?: { farm_name: string } | null;
  sire?: PetParent | null;
  dam?: PetParent | null;
}

interface PetParent {
  id: string;
  name: string;
  image_url?: string | null;
  breed?: string | null;
  sire?: { id: string; name: string } | null;
  dam?: { id: string; name: string } | null;
}

// ── Litter ───────────────────────────────────────────────────────────────────
export interface Litter {
  id: string;
  user_id: string;
  farm_id: string;
  litter_code?: string | null;
  sire_id?: string | null;
  dam_id?: string | null;
  mating_date?: string | null;
  expected_birth_date?: string | null;
  actual_birth_date?: string | null;
  status?: string | null;
  notes?: string | null;
  created_at?: string;
  // Joined relations
  sire?: { name: string; image_url?: string | null } | null;
  dam?: { name: string; image_url?: string | null } | null;
}

// ── Transaction ───────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  user_id: string;
  farm_id?: string | null;
  litter_id?: string | null;
  transaction_type: "income" | "expense";
  category: string;
  amount: number;
  transaction_date: string;
  description?: string | null;
  receipt_url?: string | null;
  created_at?: string;
}

// ── Vaccine ──────────────────────────────────────────────────────────────────
export interface Vaccine {
  id: string;
  pet_id: string;
  vaccine_name: string;
  date_given: string;
  next_due?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface VaccineWithPet extends Vaccine {
  pet?: Pick<Pet, "id" | "name" | "image_url"> | null;
}

export interface VaccineGroup {
  vaccineName: string;
  emoji: string;
  items: VaccineWithPet[];
}

// ── Activity ─────────────────────────────────────────────────────────────────
export interface Activity {
  id: string;
  pet_id: string;
  activity_type: string;
  title: string;
  description?: string | null;
  activity_date: string;
  created_at?: string;
}

// ── User / Profile ───────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  created_at?: string;
}

// ── Shop ─────────────────────────────────────────────────────────────────────
export interface Shop {
  id: string;
  user_id: string;
  shop_name: string;
  name?: string | null;
  description?: string | null;
  location?: string | null;
  profile_image_url?: string | null;
  is_verified?: boolean;
  created_at?: string;
}

// ── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  stock?: number;
  image_url?: string | null;
  description?: string | null;
  category?: string | null;
  created_at?: string;
}

// ── Service ──────────────────────────────────────────────────────────────────
export interface Service {
  id: string;
  user_id: string;
  service_name: string;
  name?: string | null;
  description?: string | null;
  service_type?: string | null;
  location?: string | null;
  profile_image_url?: string | null;
  is_verified?: boolean;
  created_at?: string;
}

// ── ServiceBooking ────────────────────────────────────────────────────────────
export interface ServiceBooking {
  id: string;
  service_id: string;
  pet_id?: string | null;
  booking_date: string;
  booking_time?: string | null;
  service_type?: string | null;
  status: string;
  notes?: string | null;
  created_at?: string;
  pets?: { name: string; species?: string | null } | null;
}

// ── Partner business item (union for PartnerCategoryCard) ─────────────────────
export type BusinessItem = {
  id: string;
  farm_name?: string | null;
  shop_name?: string | null;
  service_name?: string | null;
  name?: string | null;
};

// ── Crop area (react-easy-crop) ───────────────────────────────────────────────
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── StatCard / ToolLink props ─────────────────────────────────────────────────
export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  icon?: ReactNode;
}

export interface ToolLinkProps {
  href: string;
  icon: ReactNode;
  title: string;
  desc: string;
}

export interface PartnerCategoryCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  colorTheme: "pink" | "teal" | "blue";
  items: BusinessItem[];
  registerUrl: string;
  dashboardUrlPrefix: string;
}
