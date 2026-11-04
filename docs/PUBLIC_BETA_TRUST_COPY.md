# Whiskora Public Beta — Trust Copy Corrections

Local branch `fix/public-beta-trust-copy`, baseline `0ded0682b80e7a78e5703e02f19179c01e13e943`.
วันที่ 2026-11-04. งาน UI copy เท่านั้น ไม่ใช่ Legal/Security/Release Approval.

## Before / after

| จุด | เดิม | ใหม่ / เหตุผล |
|---|---|---|
| Footer TH/EN | PDPA compliant | เอาคำรับรองและ message key ออก; ลิงก์ Privacy เดิมยังอยู่ ไม่เพิ่ม certification ใหม่ |
| Owner Pet detail | Verified by Whiskora | TH ลงทะเบียน Pet ID แล้ว / EN Pet ID registered พร้อม hint ว่าไม่รับรอง health/lineage/documents |
| Pet ID marketing | ตราพิสูจน์ตัวตน / WHISKORA VERIFIED รับรองความถูกต้อง | registered label/hint ตามข้อมูลจริง ไม่รับรองสัตว์หรือข้อมูลทั้งหมด |
| Pet ID marketing QR | สแกนดูข้อมูลได้ทุกที่ทุกเวลา | QR เชื่อมโยงโปรไฟล์ตามข้อมูล/สิทธิ์ที่ระบบรองรับ (TH/EN) |
| Owner QR modal | สแกนเปิดโปรไฟล์สาธารณะ | อธิบาย existing access และ QR ไม่ใช่ certificate health/lineage/ownership (TH/EN) |
| Actual/demo card Rose Gold theme | caption Verified | caption Rose Gold; ชื่อธีมสีไม่ใช่ผลตรวจ |

## Implementation boundaries

- เพิ่ม page-scoped namespace `trustCopy` 5 keys ใน TH/EN; ส่งผ่าน ScopedMessages
  เฉพาะ locale shims ของ `/pets/[id]` และ `/pet-id-card`
- ไม่เพิ่ม global namespaces, ไม่ import full catalogue ใน client, ไม่แก้ RootChrome/ScopedMessages implementation
- ไม่แปล owner/marketing ทั้งหน้าใหม่: เปลี่ยนเฉพาะตำแหน่ง Trust Copy ที่อนุมัติ; route coverage เดิมยังใช้
- คง public pet badge hints และ farm identity badge/verification logic เดิมไว้;
  `รับป้าย Whiskora Verified` บนหน้า farm verification เป็นบริบทฟาร์ม ไม่ใช่รับรองสัตว์
- หน้า demo/actual ID card เปลี่ยนเฉพาะ caption ไม่มีการแก้รูปแบบ card data, QR URL, rendering/export หรือ auth checks
- ไม่เปลี่ยน query/mutation/effect/session/fieldAccess, is_public default, API, RLS, migrations,
  Auth, signup, LINE, support, Terms หรือ Privacy
- ไม่มี F4/H2/#37 changes; ต้องประสาน review/integration ของ Security แยกตามเดิม

## Validation

**PASSED — PENDING INDEPENDENT REVIEW**

| Check | ผล |
|---|---|
| Clean optimized build | `next build --webpack` exit 0; dummy loopback backend; ไม่มี .next ก่อนเริ่ม |
| TypeScript | build validators ผ่าน; standalone tsc หลังคืน next-env.d.ts exit 0 |
| Unit | **72/72**, no fail/skip: consistency 6, format 13, namespaces 7, race 16, dashboard 8, vaccine 22 |
| Trust copy browser | **4/4** Desktop/Mobile TH/EN; marketing/Footer, demo/actual card captions, refresh/history |
| UX regression | **44/44**, เพิ่ม assertions registered labels/hint/QR copy โดยไม่ลด assertions เดิม |
| Farm regression | **2/2** |
| i18n regression | **72/72** รวม language switching/navigation/hydration/layout 1440/768/390/360 |
| Browser flows รวม | **122/122** Desktop 61/Mobile 61; failures/skips/flaky/retries = 0 |
| Bundle measurement | **1/1**, ไม่มี catalogue sentinel ใน production client chunks |
| Namespace boundary | existing 7 tests ผ่าน; ไม่เพิ่ม full catalogue import ใน client |
| ESLint new test/config | exit 0 จาก web cwd; รอบแรกเรียกจาก root ไม่มี config เก็บ log ไว้และแก้ invocation ไม่เปลี่ยน config |
| Static copy scan | ไม่พบ PDPA compliant/Verified by Whiskora/WHISKORA VERIFIED/รับรองความถูกต้อง ใน affected UI/messages |

ทุก browser suite ใช้ clean production build + next start, synthetic data/session และ intercept/abort
external requests. ไม่ติดต่อ real backend/providers. ผล copy tests ไม่ใช่ full real-device/export UAT.
Raw results/logs/screenshots: local-evidence/trust-copy-corrections-20261104/.
Machine summary/hashes: [summary.json](trust-copy-evidence/summary.json).


## Visual / test coverage limitations

ตรวจภาพ actual card Mobile EN แล้วพบ QR ภายนอกถูกบล็อกตาม offline harness
(source เดิมใช้ api.qrserver.com) และภาพบัตรถูกตัดขอบด้านขวาบางส่วน.
ไฟล์ actual card มี diff เฉพาะ caption ไม่มี CSS/QR generation diff; ยังไม่ได้ทำ baseline pixel comparison
จึงไม่ยืนยันสาเหตุหรือรับรอง full card layout/scan/export. ไม่แก้ rendering/provider นอก scope.
QR modal ที่สร้างใน owner detail ถูกตรวจใน UX suite แยก.
Owner ต้องพิจารณา external QR service ใน provider/privacy inventory ภายหลัง ไม่แก้ policy ที่นี่.

## Files

- web/app/components/Footer.tsx
- web/messages/{th,en}.json
- web/app/pets/[id]/page.tsx และ web/app/[locale]/pets/[id]/page.tsx
- web/app/pet-id-card/page.tsx และ web/app/[locale]/pet-id-card/page.tsx
- web/app/pets/[id]/id-card/page.tsx
- web/app/pet-id-card-preview/page.tsx
- web/e2e/local/vaccine-ux.spec.ts (เพิ่ม assertions ไม่ลดของเดิม)
- web/e2e/i18n/trust-copy.spec.ts, web/playwright.trust-copy.config.ts
- report นี้และ evidence summary ที่เกี่ยวข้อง; raw logs/traces อยู่ local-evidence แยก ไม่ commit

## ยังต้องให้เจ้าของ/ผู้ตรวจยืนยัน

Terms ยังเป็น placeholder; Privacy ยังมีคำมั่น deletion ภายใน 30 วัน/retention/มาตรฐาน
และข้อเท็จจริงผู้ให้บริการ/providers ที่ยังไม่ยืนยัน. งานนี้ไม่เปลี่ยน Privacy และไม่อ้างว่าพร้อมกฎหมายแล้ว.
ต้องยืนยัน contact mailbox/support process และ farm document SLA/handling แยก.
Signup confirmation/error copy ต้องอิง flow ที่ review แล้ว ไม่แก้ logic หรือสร้างข้อเท็จจริงเอง.
Vaccine Editing ยัง Deferred; ไม่สร้าง correction/support workflow ใหม่.

Terms/Privacy/owner facts/support operational readiness ยังเป็น release gates ตามรายงาน Trust เดิม;
ผล build/browser ชุดนี้ไม่ปิด gates เหล่านั้นหรือ Preview→Staging/Security gates.

## Claude Independent Review

1. ตรวจ diff จาก 0ded068 ว่ามีเพียง text, translation wiring และ tests/report; protected paths ไม่เปลี่ยน
2. ตรวจ copy TH/EN และ context ว่า registered ≠ farm identity verification ≠ veterinary/lineage/ownership certification
3. ตรวจ route-scoped trustCopy ไม่หลุดเป็น global/full catalogue และ locale navigation ยังทำงาน
4. ตรวจ Desktop/Mobile QR modal, long copy, actual/demo card และ Footer ว่าไม่ overflow/hydration
5. ตรวจ existing UX/i18n regressions และ new assertions ที่ไม่ลดเงื่อนไขเดิม
6. แยกคำรับรองที่เอาออกจาก Privacy/Terms ที่ยังรอ owner/legal review ไม่อนุมาน compliance

## Preservation / handoff

Candidate integration branch ยังชี้ 0ded068. ไม่มี push/merge main/PR/deploy/config/DB changes.
ไม่สร้าง worktree ไม่แก้ source ของ Claude ไม่ลบหลักฐาน. next-env.d.ts ที่ build สร้างคืนเป็นต้นฉบับ.
รอ Independent Review เท่านั้น ไม่ใช่อนุญาตนำขึ้น Production.
