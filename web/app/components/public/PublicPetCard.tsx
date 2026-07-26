import Link from 'next/link';
import { F } from '@/lib/publicProfile/tokens';
import { getStatusLabel, type Locale } from '@/lib/publicProfile/statusLabels';

export interface PublicPetCardData {
  id: number | string;
  name: string | null;
  breed: string | null;
  image_url: string | null;
  gender: string | null;
  status: string | null;
  price?: number | null;
  birth_date?: string | null;
}

function calcAge(birthDate?: string | null, locale: Locale = 'th'): string {
  if (!birthDate) return '';
  const dob = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years === 0 && months === 0) return locale === 'th' ? 'เพิ่งเกิด' : 'Newborn';
  if (locale === 'en') return `${years > 0 ? years + 'y ' : ''}${months > 0 ? months + 'm' : ''}`.trim();
  return `${years > 0 ? years + ' ปี ' : ''}${months > 0 ? months + ' เดือน' : ''}`.trim();
}

/**
 * Reused by /p/[id]'s "other pets from this farm" section and /farm/[id]'s
 * adoptable/breeder grids — replaces markup that was previously duplicated
 * inline on the farm page only.
 */
export default function PublicPetCard({
  pet,
  isFarmPet,
  locale = 'th',
}: {
  pet: PublicPetCardData;
  isFarmPet: boolean;
  locale?: Locale;
}) {
  const isMale = pet.gender === 'male' || pet.gender === 'ตัวผู้';
  const label = getStatusLabel(pet.status, isFarmPet);
  const age = calcAge(pet.birth_date, locale);

  return (
    <Link
      href={`/p/${pet.id}`}
      style={{
        display: 'block', textDecoration: 'none', background: 'white',
        border: `1px solid ${F.line}`, borderRadius: 16, overflow: 'hidden',
        transition: 'box-shadow .15s, transform .15s',
      }}
      className="public-pet-card"
    >
      <div style={{ aspectRatio: '1 / 1', background: F.pinkSoft, position: 'relative' }}>
        {pet.image_url
          ? <img src={pet.image_url} alt={pet.name || ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain', opacity: 0.5 }} />
            </div>}
        <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.92)', color: F.ink }}>
          {label[locale]}
        </span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: F.ink }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pet.name || '-'}</span>
          <img src={isMale ? '/icons/icon-men.png' : '/icons/icon-women.png'} alt="" style={{ width: 14, height: 14, objectFit: 'contain', flexShrink: 0 }} />
        </div>
        <div style={{ fontSize: 11, color: F.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {[pet.breed, age].filter(Boolean).join(' · ') || '-'}
        </div>
        {pet.price != null && Number(pet.price) > 0 ? (
          <div style={{ fontSize: 12, fontWeight: 800, color: '#C2410C', marginTop: 4 }}>฿{Number(pet.price).toLocaleString()}</div>
        ) : (
          <div style={{ fontSize: 11, fontWeight: 600, color: F.muted, marginTop: 4 }}>{locale === 'th' ? 'สอบถามราคา' : 'Ask for price'}</div>
        )}
      </div>
    </Link>
  );
}
