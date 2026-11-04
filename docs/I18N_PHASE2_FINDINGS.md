# i18n Phase 2 — ผลแก้ review findings (2026-11-04)

แก้ครบทั้ง 4 ข้อบน local branch `fix/i18n-phase2-review-findings` จาก `aa1b03e`
ใน active worktree `/workspaces/Whiskora-codex` เดิม ไม่มี worktree เพิ่ม
ไม่มี push/merge/deploy/migration หรือการเปลี่ยน Production/Staging, auth settings,
secrets, F4/H2, UX #33 หรือ Security #37

## Findings และ root cause

| Finding | Root cause | การแก้ |
| --- | --- | --- |
| Production build | Dashboard layouts export context/hooks ที่ Next.js route module ไม่อนุญาต | ใช้ web diff จาก `45b8bd7..cde9927`; ย้าย definitions ไป `lib/*-access.ts` และเปลี่ยน imports เท่านั้น |
| RootChrome catalogue | Client component import `messages/th.json` ทั้งไฟล์ แม้ HTML จะ scoped แล้ว | Root server layout เลือกเฉพาะ fallback globals ส่งผ่าน props; RootChrome ไม่ import catalogue; เพิ่ม `server-only` ที่ ScopedMessages |
| Marketplace / Service Hub race | ทุก request เขียน data/error/loading ได้ แม้มี request ใหม่หรือ component unmount แล้ว | แต่ละ load/retry มี sequence; guard ทั้ง success, error/rejection และ finally; cleanup invalidate sequence; useCallback ผูกกับ filters |
| คะแนนรีวิวจำลอง | Literal `4.9 (120)` และ star ใน JSX ไม่ได้มาจากข้อมูล | ลบคะแนน/count/star และจัด action ชิดขวา ไม่มีคะแนนหรือระบบรีวิวใหม่ |

RootChrome ส่ง fallback `nav/footer/common` ผ่าน server props เสมอ เพื่อให้ client navigation
ยังใช้ fallback ได้แม้ root layout ถูก cache; locale layout และ page-level ScopedMessages
คงโครงสร้างเดิม ไม่เลือก page namespaces จาก pathname ใน cached layout
`login` ยังอยู่ใน locale layout extras เพื่อ compatibility กับ #37

API queries, select/order, stored Thai category values, species values,
`services.is_published` predicate และ client-side search logic คงเดิม
ไม่มี AbortSignal หรือ API contract ใหม่ ใช้การปฏิเสธผลเก่าเฉพาะ UI lifecycle

## Shared build fix และ production validation

Local commit **`e5e3273`** นำ shared build fix มาใช้ หลัง `git apply --check` ผ่าน
dashboard source ก่อน apply เท่ากับ shared fix baseline ไม่มี compatibility conflict
ใช้ final code/whitespace จาก `cde9927` ไม่ได้นำ F4 integration หรือ security logic เข้ามา

ทำ clean optimized production build สองรอบ: baseline `aa1b03e + e5e3273` และ final findings
แต่ละรอบเริ่มโดยไม่มี `.next`; output ก่อนหน้าเก็บแยกใน `/tmp` โดยไม่สร้าง worktree
ทั้งสองรอบผ่าน compile, TypeScript validation, static generation และ build traces exit 0
ใช้ **Node 24.21.0 / Next 16.2.10 / `next build --webpack`** ไม่ใช้ compile-only,
ignoreBuildErrors หรือปิด type validation ไม่ได้ทดสอบ default Turbopack bundler

Standalone TypeScript `tsc --noEmit --incremental false` ผ่าน รวม generated build validators
ไฟล์ `next-env.d.ts` ที่ Next สร้างถูกคืนเป็น tracked ต้นฉบับและไม่ commit;
TypeScript หลังคืนไฟล์ผ่านด้วย ใช้ loopback Supabase/ค่าจำลองเท่านั้น

## Unit, namespace และ race tests

| ชุด | ผล |
| --- | --- |
| i18n consistency | 6/6 |
| i18n formatting | 13/13 |
| i18n namespaces | 7/7 |
| Marketplace / Service Hub race unit | 16/16 |
| Shared dashboard layout regression | 8/8 |
| รวม | **50/50**, ไม่มี failure/skip |

Race unit รัน source ของ page จริงด้วย controlled promises และ hook lifecycle จำลอง:
slow API error/rejection หลัง success ใหม่, older success หลัง error ใหม่, rapid category/species,
concurrent retries, unmount success/rejection และ mutants ที่ถอด stale guards ต้องถูกจับได้
Browser tests ตรวจซ้ำกับ React/Supabase client จริงบน backend จำลอง

Namespace tests ตรวจ TH/EN keys/placeholders, literal use, page scopes และห้าม client components
import catalogue เต็มโดยตรง; Next server-only boundary ป้องกัน ScopedMessages หลุดเข้าฝั่ง client

## Browser, switching, hydration และ layout

**72/72 ผ่าน**, Desktop 36 + Mobile 36; zero failed/skipped/flaky, retries 0, worker 1
ใช้ full production build ผ่าน `next start` ไม่ใช้ dev/compile-only artifact

- Language 18 + foundation 20 + Phase 2 16 + findings 18 cases
- TH→EN→TH, path/query/hash, locale cookie, refresh, client navigation, back/forward
- หลาย translated routes สลับไปมาพร้อม page scopes ไม่แสดง raw translation keys
- Rapid filters, pending retry, concurrent/out-of-order results และ unmount/back ทั้งสองหน้า
- ตรวจ error/empty/success และ API filter values เดิมด้วย synthetic products/services
- ตรวจ overflow/hydration ใน TH/EN ที่ 1440/768/390/360 รวม branded 404
- Service card TH/EN screenshots ทั้ง Desktop/Mobile ไม่มี invented rating/star;
  action อยู่ภายใน card ไม่มี horizontal page overflow; ตรวจภาพด้วยแล้ว
- Existing navbar axe WCAG 2.1 A/AA checks ผ่านตามขอบเขต test เดิม

Browser บล็อก external requests และตอบ loopback Supabase ด้วย synthetic rows เท่านั้น
ไม่ใช่ live provider, real-user, backend RLS หรือ combined security integration certification

## JavaScript bundle ก่อนและหลัง

วัด actual JavaScript response bodies จาก fresh browser context ต่อ route และ production
`.next/static/**/*.js`; ไม่ใช้ HTML/RSC เป็นตัวแทน JS ขนาด gzip คำนวณต่อไฟล์ด้วย gzipSync
เพื่อเปรียบเทียบ ไม่อ้างว่าเป็น wire transfer ที่ browser ใช้จริง

| JavaScript | ก่อน raw / gzip (bytes) | หลัง raw / gzip (bytes) |
| --- | --- | --- |
| Root layout chunk | 60,560 / 13,522 | **2,232 / 1,027** |
| ทุก production JS chunks รวม | 3,519,595 / 1,046,946 | **3,460,932 / 1,034,430** |
| Cold `/en/terms` | 820,674 / 231,514 | **762,346 / 219,019** |
| Cold `/en/marketplace` | 782,922 / 225,145 | **724,735 / 212,710** |
| Cold `/en/service-hub` | 782,442 / 224,856 | **723,638 / 212,280** |
| Cold `/en/about` | 779,037 / 222,971 | **720,709 / 210,476** |

TH routes วัดด้วย ผล JS เท่ากับ EN คู่กัน root layout ลด 58,328 raw / 12,495 gzip bytes
sentinel ข้อความเฉพาะจาก Thai catalogue พบใน baseline root chunk และไม่พบใน final client chunks
รายละเอียดทุกไฟล์/route อยู่ [javascript-comparison.json](i18n-phase2-findings-evidence/javascript-comparison.json)

## Static integration compatibility

ใช้ temporary partial source copies + three-way `git merge-file` เท่านั้น ไม่มี actual branch merge,
checkout ของ branch อื่น, worktree ใหม่ หรือ combined runtime/DB test

- **Explore `9d21e18`:** messages JSON ทั้งสองภาษารวมได้ ไม่มี production-code conflict
  แต่ route shim เดิมยังไม่ส่ง `explore` namespace: namespace tests จับได้ตามตั้งใจ
  เตรียม [integration patch](i18n-phase2-findings-evidence/explore-scoped-messages.patch)
  เพิ่ม ScopedMessages ให้ shim โดยเก็บ metadata/noindex เดิม หลังใช้ใน temporary copy
  namespace tests ผ่าน 7/7 ต้องนำ patch นี้ไปใช้ตอน integration
  `WHISKORA_PLATFORM_OVERVIEW.md` มี documentation conflict ที่ต้องเลือกข้อความตอน merge
- **PR #37 local pinned `26e4b4f`:** overlapping farm dashboard page รวมได้ พร้อม retained
  access-hook import ใหม่; namespace tests ผ่าน 7/7 คง security changes และ login global scope
  ไม่แก้/reset PR #37 หรือ branch refs ไม่อ้างว่าเป็น remote head ล่าสุด
- ไม่มี actual merge, push, deployment หรือ migration; static pass ไม่แทน combined build/security review

## Environment / harness findings และข้อจำกัด

- Sandbox เปิด local webServer ไม่ได้; isolated listen probe ได้ `EPERM` รัน browser ด้วย
  authorized execution แล้วผ่าน ใช้ config worker 1 และ matching Chromium v1248 ที่มีอยู่แล้ว
- Unit harness รอบแรกมี recursion bug ใน test tree walker แก้ test helper แล้วรันใหม่ผ่าน
  เป็น test-harness defect ไม่ใช่ application failure และไม่จัดเป็น environment failure
- ESLint ไม่มี diagnostics เพิ่ม: RootChrome error 1→0; missing hook dependency warnings ถูกแก้
  ยังมี no-explicit-any เดิม 2 errors ในสองหน้ารายการ และ warnings เดิม 5 ไม่อ้าง whole-file lint pass
- Warning เดิม multiple lockfiles และ deprecated middleware convention ไม่ได้แก้ในงานนี้
- ทั้ง 4 findings ปิดแล้ว ขอบเขตแปล routes ที่เหลือยังตาม I18N_STATUS เดิม ไม่เพิ่ม feature/translation scope

## Preservation, commits และ review readiness

ก่อนสลับ branch เก็บเอกสาร UX เป็นสำเนาและ binary patch ใน durable evidence พร้อม
named stash เฉพาะเอกสารนั้น ไม่ stash/delete untracked evidence
ก่อนส่งงานตรวจ hashes ของ evidence เดิม 172 ไฟล์, refs ที่อยู่นอก review branch,
source/status ของ main + Claude F4 + F4 containment และจำนวน worktrees เดิม 4 ชุด
ผล machine-readable อยู่ local `preservation-final.json`

Source/tests/report commit อยู่บน `fix/i18n-phase2-review-findings` เท่านั้น SHA ล่าสุดระบุใน
ข้อความส่งงานและ local `final-summary.json` หลัง commit เอกสาร/evidence เดิมยังอยู่;
raw run logs, browser JSON, screenshots และ failed-attempt logs เก็บถาวรใน
`local-evidence/i18n-phase2-findings-20261104/` ไม่พึ่ง `/tmp` เป็นหลักฐานเพียงแห่งเดียว

**พร้อม Independent Review ของ findings fixes** ไม่ใช่ release/integration approval
ไม่มี push/merge/deploy หรือการเปลี่ยน Production/Staging หยุดรอคำสั่งหลังส่งรายงาน

คำสั่งหลัก (จาก `web/`, ใช้ dummy env ตาม harness):

```bash
node tests/i18n-consistency.test.mjs
node tests/i18n-format.test.mjs
node tests/i18n-namespaces.test.mjs
node tests/catalogue-race.test.mjs
node scripts/dashboard-layout-regression.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
# ต้องเริ่มจาก .next ว่าง; เก็บ generated output เก่าแยกก่อน
NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_ANON_KEY=i18n-tests-no-key NEXT_PUBLIC_SITE_URL=http://localhost:3132 npm run build -- --webpack
I18N_PRODUCTION=1 PLAYWRIGHT_BROWSERS_PATH=/tmp/whiskora-playwright-browsers node node_modules/@playwright/test/cli.js test -c playwright.i18n-findings.config.ts
# วัด JS แยก: I18N_BUNDLE_ONLY=1 I18N_RUN_LABEL=final พร้อม I18N_PRODUCTION=1
```
