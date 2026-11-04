# Whiskora Public Beta — UX & i18n Local Integration

วันที่ 2026-11-04 · Branch `integration/public-beta-ux-i18n` · Local only

## Provenance และขอบเขต

- Local main / origin/main ที่ตรวจพบ: `a86b35a4548ff9edf26f94bf5e1d7059904f7a34`.
  ต่างจาก production baseline `45b8bd7` เฉพาะเอกสาร 3 ไฟล์ ไม่ได้ fetch หรือยืนยัน live alias ในรอบนี้
- สร้าง Branch ใหม่จาก main แล้ว merge i18n `08b1a8990e2321c0dccd24701d526e3f9b524161`
  แบบ no-ff → `2ef1dfe`; merge UX `ce4be20c30401246ab5cf77dba4aad8421ff609b`
  แบบ no-ff → `fa740d6`.
- Shared build fix มีอยู่แล้วผ่าน `e5e3273` ใน i18n ancestry ไม่ cherry-pick `cde9927` ซ้ำ
- ไม่มี textual conflict และไม่มีการแก้ Application Source เพิ่มหลัง merge
  package.json รวม scripts UX ได้และรักษา version 1.14.1 จาก main/i18n
- UX pet detail / PetHealthSummary / vaccine-summary ตรงกับ `ce4be20` ทุก byte
  ส่วน RootChrome, ScopedMessages, catalogues และ dashboard access modules ตรงกับ `08b1a89`
- เมื่อเทียบ i18n เดิม Application Source ต่างเพียง UX 3 ไฟล์ดังกล่าว
  เมื่อเทียบ UX เดิม ได้ i18n foundation/Phase 2/findings และ shared layout fix เพิ่ม
- ไม่รวม F4, H2, Security #37, Explore หรือ R1/R4 ไม่แก้ Auth/API, authorization,
  RLS, migrations, secrets หรือ environment configuration

## Integration test harness

- เพิ่ม 4 cases ต่อ viewport ใน UX mock spec: locale + refresh + QR,
  locale + browser history, history error และ empty history
- เพิ่ม Farm Dashboard case ต่อ viewport: access-module import/provider, synthetic owner,
  TH/EN routing, refresh และภาพหน้าจอ ไม่ใช่การรับรองสิทธิ์ backend
- UX server เลือก `next start` ได้ด้วย `UX_PRODUCTION=1`; fixtures รองรับ loopback
  URL ที่ใช้ production build ของ i18n โดยไม่ติดต่อ backend จริง
- i18n findings config และ bundle measurement เลือก evidence directory ได้ผ่าน
  `I18N_EVIDENCE_DIR`; default เดิมคงเดิม วิธีวัด JavaScript ไม่เปลี่ยน
- ทุก Browser suite ใช้ข้อมูลจำลองและ intercept/abort backend/external requests;
  synthetic SDK session ใช้ตรวจ UI เท่านั้น ไม่มี provider login, real token หรือ database
- หน้าเจ้าของสัตว์และ Farm Dashboard ยังเป็นภาษาไทยตาม coverage เดิม
  การเปลี่ยน locale อาจ remount และกลับแท็บเริ่มต้น; ไม่อ้างคงทุก transient UI state

## ผลตรวจ

**INTEGRATION PASSED — PENDING INDEPENDENT REVIEW**

| Check | ผล final |
|---|---|
| Clean optimized build | `next build --webpack` exit 0; Node 24.21.0 / Next 16.2.10; เริ่มโดยไม่มี .next |
| TypeScript | Build validators ผ่าน และ `tsc --noEmit --incremental false` exit 0 ทั้งก่อน/หลังคืน next-env.d.ts |
| Unit | **72/72**: consistency 6, format 13, namespace 7, race 16, dashboard 8, vaccine 22 |
| UX เดิม | **36/36** |
| Pet locale integration | **8/8** (4 cases × Desktop/Mobile) |
| Farm integration | **2/2** (Desktop/Mobile; TH/EN route + refresh) |
| i18n regression | **72/72** (Desktop 36/Mobile 36) |
| Browser flows รวม | **118/118** (Desktop 59/Mobile 59); failures/skips/flaky/retries = 0 |
| Bundle measurement | **1/1** แยกจาก flow total |
| ESLint เฉพาะ harness ที่แก้/เพิ่ม | exit 0 |

รอบ final ใช้ full optimized production build + next start ทั้ง UX/Farm/i18n.
เก็บภาพ Farm Desktop/Mobile และตรวจภาพ Mobile EN ด้วยตาแล้ว; ไม่อ้าง full real-device UAT.
ไม่พบ regression ภายใน final test scope; ข้อจำกัด dev attempt และ backend อยู่ด้านล่าง

## Performance เทียบ i18n findings เดิม

วัดด้วย `bundle.spec.ts` เดิม: actual JS response bodies ใน fresh browser contexts,
static JS ทั้ง build และ Node gzipSync ต่อไฟล์; ไม่รวม HTML/RSC/CSS และไม่อ้าง wire bytes.

| JavaScript | i18n เดิม raw / gzip bytes | Integration raw / gzip bytes |
|---|---|---|
| Root layout | 2,232 / 1,027 | **2,232 / 1,027**; chunk hash เดิม |
| ทั้ง build | 3,460,932 / 1,034,430 | **3,463,902 / 1,035,788** |
| Cold terms TH/EN | 762,346 / 219,019 | เท่าเดิม |
| Cold marketplace TH/EN | 724,735 / 212,710 | เท่าเดิม |
| Cold service-hub TH/EN | 723,638 / 212,280 | เท่าเดิม |
| Cold about TH/EN | 720,709 / 210,476 | เท่าเดิม |

รวมเพิ่ม raw 2,970 bytes (~0.086%) / gzip 1,358 bytes (~0.131%).
raw ที่เพิ่มอยู่ใน pet-detail shared chunk (`1764` → `6074`): 110,545 → 113,515 bytes;
gzip chunk เพิ่ม 1,356 bytes อีก 2 bytes จาก manifest ของ build ID ที่เปลี่ยน (raw manifest เท่าเดิม).
เป็นผลเพิ่มโค้ด UX ไม่ใช่ catalogue เต็มกลับเข้า RootChrome; catalogue sentinel ไม่พบใน client chunks,
namespace/static tests ผ่าน และ RootChrome source/chunk ตรงกับ i18n เดิม

Machine-readable summary + hashes: [summary.json](public-beta-integration-evidence/summary.json).

## ทำซ้ำ Local validation

ใช้ Node/dependencies/Chromium ที่มีอยู่ ไม่ใช้ Production/Staging environment หรือ credential.
ก่อน build ย้าย .next ที่มีอยู่ไปที่เก็บแยก ไม่ลบหลักฐานเดิม.

```bash
# จาก web/ — dummy loopback values เฉพาะ process
NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_ANON_KEY=i18n-tests-no-key NEXT_PUBLIC_SITE_URL=http://localhost:3132 node node_modules/next/dist/bin/next build --webpack
node node_modules/typescript/bin/tsc --noEmit --incremental false
# ทุก browser command ใช้ PLAYWRIGHT_BROWSERS_PATH=/tmp/whiskora-playwright-browsers
UX_PRODUCTION=1 node node_modules/@playwright/test/cli.js test -c playwright.vaccine-mock.config.ts
UX_PRODUCTION=1 node node_modules/@playwright/test/cli.js test -c playwright.integration-farm.config.ts
I18N_PRODUCTION=1 I18N_RUN_LABEL=integration I18N_EVIDENCE_DIR=../local-evidence/public-beta-ux-i18n-20261104 node node_modules/@playwright/test/cli.js test -c playwright.i18n-findings.config.ts
# bundle: คำสั่ง i18n เดิมพร้อม I18N_BUNDLE_ONLY=1 และ label ใหม่
```

ใช้ label/evidence directory ใหม่หากรันซ้ำเพื่อไม่ทับหลักฐาน.
ตัว orchestrator ที่ใช้จริงอยู่ใน local evidence: sanitized child environment และ log แยกต่อชุด


## Attempts ที่ไม่ผ่านและข้อจำกัด

- Sandbox attempt เปิด local port ไม่ได้ (`EPERM`) จึงใช้ authorized local execution
- Dev attempt: 17 passed, 2 failed, 25 not run; พบ `Invalid or unexpected token`
  ขณะโหลดหน้า และ browser crash (`target-crash:killed:15`). ไม่ปิด assertion หรือเพิ่ม retry
  เก็บ logs/traces ไว้; ไม่สรุปสาเหตุแน่นอนหรืออ้างว่าเป็น environment fault ที่พิสูจน์แล้ว
- ตรวจซ้ำด้วย clean production build; ผล final ระบุด้านบนแยกจาก dev attempt
- Server exit 143 หลัง Playwright ส่ง SIGTERM เพื่อ teardown ไม่ใช่ test assertion failure
- Warning เดิม: multiple lockfiles/workspace root และ middleware convention deprecated
- ไม่ใช่ real database persistence/RLS/storage/ownership-transfer/provider/security certification
  การแปลยัง Complete 13 / Partial 1 / Pending 65 จาก 79 routes

## Preservation

ก่อน switch มีเฉพาะ untracked local-evidence; ไม่มี tracked changes.
เก็บ SHA-256 inventory ของหลักฐานเดิม 462 ไฟล์และ refs ทั้งหมดไว้ก่อนเริ่ม
ไม่สร้าง/ลบ worktree; ไม่ลบ Branch หรือหลักฐาน; main และ Branch ต้นทางไม่เปลี่ยน
raw evidence อยู่ `local-evidence/public-beta-ux-i18n-20261104/` ไม่เพิ่ม raw traces ใน Git
ไฟล์ next-env.d.ts ที่ Next สร้างถูกคืนเป็น tracked ต้นฉบับก่อนส่งงาน

## Claude: Independent Review checklist

1. ตรวจ provenance ของสอง merge, package scripts/version และ build fix ที่ไม่ได้นำซ้ำ
2. ตรวจ UI state lifecycle/async guards ของ UX หลัง locale navigation, history และ refresh
3. ตรวจ QR, health/vaccine/timeline ว่าไม่แสดง stale content และยังรักษา access gating เดิม
4. ตรวจ RootChrome server props, server-only ScopedMessages, page namespaces และ bundle evidence
5. ตรวจ Farm Dashboard access imports/provider; synthetic owner smoke ไม่แทน role/RLS review
6. ตรวจ fixtures และ production-mode harness ว่าไม่มีการลด assertion หรือหลุดไป real backend
7. ตรวจ failed dev evidence แยกจาก final production-mode results
8. ประสาน Security integration ภายหลัง: UX ยังมี select note เดิม; ต้องเก็บการตัด note
   ของ M4 และ dashboard changes ของ H1 เมื่อรวม #37 ห้ามใช้ชุดนี้แทน Security RC

## Release gate

ยังไม่ได้ Independent Review หรือ Release Approval.
ยังไม่อนุมัติ Push, PR, Preview deployment, merge main หรือ production/staging changes.
หลัง Independent Review ต้องเลือก exact RC SHA, ตรวจ Preview→Staging binding และ schema
compatibility อีกครั้งก่อน Staging UAT; ผล Local integration ไม่รับรองความปลอดภัย
