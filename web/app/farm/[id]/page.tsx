import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import FarmProfileClient from './FarmProfileClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getPublicFarmMeta(id: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from('farms')
    .select('id, farm_name, bio, image_url, cover_url')
    .eq('id', id)
    .maybeSingle();
  return data;
}

// Re-exported verbatim by app/[locale]/farm/[id]/page.tsx — see the matching
// comment in app/p/[id]/page.tsx for why `locale` is optional here.
export async function generateMetadata({ params }: { params: Promise<{ id: string; locale?: string }> }): Promise<Metadata> {
  const { id, locale = 'th' } = await params;
  const farm = await getPublicFarmMeta(id);

  if (!farm) {
    return { title: 'ไม่พบข้อมูลฟาร์ม' };
  }

  const title = farm.farm_name || 'ฟาร์มสัตว์เลี้ยง';
  const description = farm.bio
    ? farm.bio.slice(0, 160)
    : `รู้จัก ${title} ดูข้อมูลฟาร์มและสัตว์ที่เปิดเผยบน Whiskora`;
  const image = farm.cover_url || farm.image_url || '/home/hero-visual-desktop-v1.png';
  const canonicalPath = `/${locale}/farm/${id}`;

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
  return <FarmProfileClient />;
}
