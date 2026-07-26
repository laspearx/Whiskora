import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import PetProfileClient from './PetProfileClient';

// Plain anon-key client for server-side metadata — no cookies/session needed,
// and RLS already gates what an anon read can see (matches the client fetch).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface PublicPetMeta {
  id: number;
  name: string | null;
  species: string | null;
  breed: string | null;
  image_url: string | null;
  farm: { farm_name: string | null } | null;
}

async function getPublicPetMeta(id: string): Promise<PublicPetMeta | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from('pets')
    .select('id, name, species, breed, image_url, farm:farm_id(farm_name)')
    .eq('id', id)
    .maybeSingle();
  return data as unknown as PublicPetMeta | null;
}

// This function is re-exported verbatim by app/[locale]/p/[id]/page.tsx, so at
// runtime `params` also carries `locale` there even though the canonical
// (unprefixed) route only has `id` — accept it as optional and default to
// 'th' so the canonical/og:url/og:locale are correct for whichever prefix
// actually served the request (previously always hardcoded to /th/...).
export async function generateMetadata({ params }: { params: Promise<{ id: string; locale?: string }> }): Promise<Metadata> {
  const { id, locale = 'th' } = await params;
  const pet = await getPublicPetMeta(id);

  if (!pet) {
    return { title: 'ไม่พบข้อมูลสัตว์เลี้ยง' };
  }

  const breedOrSpecies = pet.breed || pet.species || '';
  const farmName = pet.farm?.farm_name || undefined;
  const title = `${pet.name}${breedOrSpecies ? ` — ${breedOrSpecies}` : ''}`;
  const description = farmName
    ? `ดูข้อมูลของ ${pet.name}${breedOrSpecies ? ` (${breedOrSpecies})` : ''} จาก ${farmName} พร้อมข้อมูลที่ฟาร์มเปิดเผยบน Whiskora`
    : `ดูข้อมูลของ ${pet.name}${breedOrSpecies ? ` (${breedOrSpecies})` : ''} บน Whiskora`;
  const image = pet.image_url || '/home/hero-visual-desktop-v1.png';
  const canonicalPath = `/${locale}/p/${id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title, description, url: canonicalPath, type: 'website', siteName: 'Whiskora', locale: locale === 'en' ? 'en_US' : 'th_TH',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default function Page() {
  return <PetProfileClient />;
}
