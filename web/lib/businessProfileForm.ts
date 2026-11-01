// Map a stored business row (select('*') or the profile returned by update_business_profile) to the edit-form state.
// Every value is taken from the row as it is — including 0, '' and null — so nothing from the previous state survives
// a reload (no truthy checks). Pure; unit-tested in supabase/tests/business_profile_form_unit.test.mts.

export type ProfileAddress = {
  house_no: string; room_no: string; moo: string; soi: string; road: string;
  sub_district: string; district: string; province: string; postal_code: string;
};
export type ProfileFormState = {
  name: string; owner_name: string; phone: string; bio: string; category: string;
  addr: ProfileAddress;
  lat: number | null; lng: number | null;
  species: string[];
};

const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const coord = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
};

/** supported_species is stored comma-joined; older shop rows may hold a JSON-ish array text or a real array. */
export function parseSpecies(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string' && x !== '');
  if (typeof v !== 'string' || v.trim() === '') return [];
  return v.replace(/^[[{]|[\]}]$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
}

export function profileRowToForm(row: Record<string, unknown>, nameKey: 'farm_name' | 'shop_name' | 'service_name'): ProfileFormState {
  return {
    name: str(row[nameKey]),
    owner_name: str(row.owner_name),
    phone: str(row.phone),
    bio: str(row.bio),
    category: str(row.category),
    addr: {
      house_no: str(row.house_no), room_no: str(row.room_no), moo: str(row.moo), soi: str(row.soi), road: str(row.road),
      sub_district: str(row.sub_district), district: str(row.district), province: str(row.province), postal_code: str(row.postal_code),
    },
    lat: coord(row.lat),
    lng: coord(row.lng),
    species: parseSpecies(row.supported_species),
  };
}
