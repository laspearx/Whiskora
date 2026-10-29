# Whiskora E2E tests

```bash
npm ci
npx playwright install chromium      # once per machine
npm run build && npm run test:e2e    # starts `next start -p 3123` automatically
E2E_BASE_URL=https://<staging-url> npm run test:e2e   # against a deployed staging site
```

- `public.spec.ts` — anonymous visitor only (reads public pages). Runs on desktop and mobile (Pixel 7) viewports.
- `signed-in.spec.ts` — skipped unless staging test accounts are provided via env (see the header of the file). **Never point it at production.**
- Staging run (accounts from `supabase/staging/seed_synthetic.sql`): `E2E_{OWNER,MANAGER,STAFF,VIEWER,BUYER,STRANGER,NEW,ADMIN}_{EMAIL,PASSWORD}`,
  `E2E_FARM_ID=9001 E2E_LISTED_PET_ID=900004 E2E_LISTED_PET_ID_MOBILE=900005 E2E_FARM_PET_ID=900001 E2E_PRIVATE_PET_ID=900002
  E2E_PRIVATE_PET_ALLERGIES=QA-ALLERGY-P2`, and for the public spec `E2E_PET_ID=900001 E2E_FARM_NAME="QA Farm"`.
  Build/start with `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` of staging in the environment (they override `.env.production`).
  The reservation chain transfers P4/P5 away — reset them before re-running.
- If pages stay on the "Loading" spinner, a stale `next start`/`next-server` from an older build is probably still on port 3123 — stop it and rerun.

## Manual checklist (staging, synthetic data, test accounts only)

Record pass/fail + date + account role for each line.

| # | Role | Steps | Expected |
|---|---|---|---|
| 1 | Visitor | Open `/th/p/<pet>` of a farm that is verified and of one that is not | Hero shows "ลงทะเบียน Pet ID แล้ว"; farm badge matches `farms.is_verified`; pedigree is a tree, "ยังไม่มีข้อมูลพ่อแม่พันธุ์" or a locked message — never "Loading" |
| 2 | Visitor | Same page, health card | Empty fields say "ยังไม่ได้ระบุ"; restricted groups say the owner limited access |
| 3 | Owner | Add pet → edit (set neutered to each of the 3 options) → add vaccine with next due date → add weight → refresh | All values persist after refresh |
| 4 | Owner | `/pets/<id>/id-card` → download → scan QR in a private window | QR opens `/th/p/<id>` without login, shows only allowed groups, no owner address |
| 5 | Buyer | Reserve a listed pet | Buyer sees "รอฟาร์มยืนยันการจอง" |
| 6 | Farm owner/manager | Confirm (double-click) | Reservation "ยืนยันแล้ว" once; pet status "ติดจอง" on `/p/<id>` |
| 7 | Farm owner/manager | Cancel the confirmed reservation | Reservation cancelled; pet back to "เปิดจอง" |
| 8 | Farm owner | Confirm again → "ส่งคำขอโอนเจ้าของ" | Row shows "ส่งคำขอโอนแล้ว · รอผู้ซื้อยอมรับ"; second click does not create another transfer |
| 9 | Buyer | `/profile/transfers` → decline | Owner unchanged; reservation still confirmed |
| 10 | Buyer | Repeat 8, then accept | `pets.user_id` = buyer, `farm_id` cleared; reservation `converted` **only if the migration is applied** |
| 11 | Old owner | Open the pet after transfer | No owner tools (edit/transfer) any more |
| 12 | Staff / viewer | Farm overview, pets list, `/edit`, `/verify`, `/pets/create`, reservations | Overview and list open; owner-only pages show the notice; no confirm/cancel buttons |
| 13 | Manager | Reservations, service/shop settings | Can confirm/cancel; can edit service/shop settings; farm `/edit` still owner-only |
| 14 | Any | Switch to EN, click cards/footer links, sign in and out | URL stays under `/en/...` including after login redirect |
| 15 | Any | Repeat 1, 4, 6 on a phone-sized window | No sideways scrolling; buttons reachable |
| 16 | Owner | `/profile/settings` → turn on device reminders → set a vaccine due tomorrow → run the Edge Function on staging | One notification; clicking opens that pet's vaccine page; turning the toggle off stops further sends |
