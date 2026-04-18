# Architecture Guide — Whiskora

## Core Rule: Always Use the Service Layer

ทุกครั้งที่ต้องดึงหรือเขียนข้อมูล **ต้องผ่าน Service เท่านั้น** ห้ามเรียก `supabase` โดยตรงใน component หรือ page

```
❌  const { data } = await supabase.from('pets').select('*')...
✅  const pets = await petService.getPetsByUser(userId)
```

---

## Layer Structure

```
web/
├── types/index.ts          ← TypeScript interfaces (Pet, Farm, Vaccine …)
├── services/               ← Data access — ทุก Supabase call อยู่ที่นี่
│   ├── auth.service.ts
│   ├── pet.service.ts
│   └── farm.service.ts
├── hooks/                  ← React hooks สำหรับ auth state & data fetching
│   ├── useAuth.ts          ← ดึง current user
│   └── usePets.ts          ← ดึง pets list ของ user
├── middleware.ts            ← Route protection (Supabase SSR)
├── lib/supabase.ts          ← Supabase client singleton (อย่าแตะ)
└── app/                    ← Next.js pages — UI เท่านั้น ไม่มี DB logic
```

---

## Auth Pattern

Middleware (`middleware.ts`) ป้องกัน routes เหล่านี้โดยอัตโนมัติ:
`/profile`, `/pets`, `/farm-dashboard`, `/service-dashboard`, `/shop-dashboard`, `/partner`

ใน page/component ให้ใช้ `useAuth()` hook:
```tsx
const { user, loading } = useAuth();
```
**ไม่ต้องเขียน redirect ไป `/login` เองในทุกหน้าอีกต่อไป** middleware จัดการให้แล้ว

---

## Adding a New Feature

1. **เพิ่ม type** ใน `types/index.ts`
2. **เพิ่ม method** ใน service ที่เกี่ยวข้อง (หรือสร้าง service ใหม่ถ้าเป็น domain ใหม่)
3. **สร้าง hook** ถ้า logic มีการ subscribe หรือใช้ซ้ำหลายหน้า
4. **สร้าง page** ใน `app/` — import จาก service/hook เท่านั้น

---

## Services Available

| Service | Methods |
|---------|---------|
| `petService` | `getPetById(id, userId?)`, `getPetsByUser`, `getPetsByFarm`, `getPetStatsByFarm`, `getAvailablePets`, `createPet`, `updatePet`, `getVaccinesByPet`, `uploadPetPhoto` |
| `farmService` | `getFarmById`, `getFarmByIdForUser`, `getFarmsByUser`, `getLittersByFarm`, `getTransactionsByFarm`, `calcFinanceStats` |
| `profileService` | `getDashboardData`, `getProfile`, `upsertProfile`, `getAppointments`, `uploadAvatar` |
| `authService` | `getUser`, `getSession`, `signOut`, `onAuthStateChange` |

## Pages Migrated to Service Layer

| Page | Status |
|------|--------|
| `app/pets/[id]/page.tsx` | ✅ Migrated |
| `app/profile/page.tsx` | ✅ Migrated |
| `app/farm-dashboard/[id]/page.tsx` | ✅ Migrated |
| `app/farm-hub/page.tsx` | ✅ Migrated |
| Other pages | ⏳ Pending — follow prototype pattern above |
