# Whiskora Public Beta — Navigation & Feature Visibility Phase 1

Baseline `095a6a6`; local branch `fix/public-beta-navigation-phase1`, worktree เดิม. เป็น UI implementation ไม่ใช่ Independent Review หรือ Production Release Approval. ไม่มี push/PR/merge/deploy/DB/config changes

## 1. เมนูก่อนและหลัง

ก่อน: Home → Explore(farm/shop/services/community/tools/about), Pet ID, Knowledge, Partners. หลัง: Home → Pet ID → ค้นหาสัตว์และฟาร์ม / Find pets & farms → สำหรับฟาร์ม / For farms → Explore เฉพาะ Knowledge/Tools/About. Account dropdown เพิ่มทางไปสัตว์ของฉัน `/profile/pets` ใน session branch เดิม. Mobile dropdown มีทางหลักชุดเดียวกัน

Global mobile bottom nav คง Home/Pets/QR/Weight/Profile เพื่อรักษาทางเดิมของผู้ใช้. FarmBottomNav และ farm tools ไม่ถูกแก้. Shop/service ใช้ DefaultBottomNav เดิมที่แปล label เป็น TH/EN และแทน promotion Services ด้วย Find pets & farms; ซ่อนเฉพาะ global bottom nav ที่ซ้อนกับ workspace nav ไม่ปิด route หรือสิทธิ์ใด

Header อนุญาตให้ขึ้นแถวเมื่อพื้นที่ไม่พอ หลังพบ overflow ที่ 768px ใน signed-in/multi-workspace test. รักษา role/session/workspace switching logic เดิม. ไม่พบ shared Sidebar กลางที่ต้องแก้; ไม่แก้ sidebar/layout guard ของ dashboard

## 2. สิ่งที่ซ่อนจาก Navigation/Promotion

นำ Marketplace, Clinics/Services, Community ออกจากเมนูหลัก/Explore และนำ clinic booking, shop registration, Community/Coming Soon และ Genesis promotion ออกจาก Footer. Knowledge/Tools/About ยังคงเป็น secondary resources. ไม่รวม Experimental Discovery branch เข้ามาและไม่สร้าง route ใหม่

Partner แสดง farm card เสมอ ส่วน shop/service cards แสดงเมื่อ owner query เดิมคืนกิจการที่มีอยู่เท่านั้น จึงไม่ชวนผู้ใช้ใหม่สมัคร shop/service ผ่าน Partner landing. เก็บ route metadata และ translation keys เดิมไว้ แล้วกรองเฉพาะ promotion ที่ render ไม่ลบโมดูลและไม่สร้าง feature-flag system/env switch ใหม่

## 3. สิ่งที่ยังเข้าถึงได้

ทุก route/API เดิมคงอยู่ Marketplace/service-hub/community เปิด direct URL ได้; register-shop/register-service ยังคง session redirect และ backend behavior เดิม. Existing shop/service owners ยังเข้าจัดการผ่าน cards ของตนและ workspace chooser; สมาชิกใช้ workspace chooser ตาม memberships เดิม ไม่มีการกรอง workspace types ออกจาก context

Advanced family tree/litters/breeding/team/privacy/verification/reservations/transfers/calendar/finance/admin คงเดิมตามบทบาท. ไม่เพิ่ม Admin entry ให้บัญชีทั่วไป ไม่แก้ role checks หรือ server checks

## 4. Routes ของผู้ใช้เดิมที่รักษา

`/partner`, `/partner/register-farm`, `/farm-dashboard/[id]/**`, `/profile/invitations`, `/profile/transfers`, `/profile/finance`, `/profile/calendar`, `/pets/**`, `/shop-dashboard/[id]/**`, `/service-dashboard/[id]/**`, `/shops/[id]`, `/services/[id]`, `/marketplace`, `/service-hub`, `/community`, `/partner/register-shop`, `/partner/register-service` และ `/admin/**` ไม่ถูกลบ/redirect/gate ใหม่. ไม่แก้ existing business records หรือ memberships

Direct URL tests ยืนยัน discovery/static pages และ session redirects ของ registration; legacy dashboard tests ยืนยัน existing owner/team access ด้วย synthetic sessions. ไม่อ้างว่าทดสอบทุก backend operation ของทุก route จริง

## 5. ผลต่อระบบฟาร์ม

Farm เป็น Core ต่อไป Partner header/copy เน้นเริ่มข้อมูลสัตว์ตัวแรก และบอกสมาชิกทีมใช้ workspace menu ตามสิทธิ์เดิม. คง Farm Registration/RPC-required fields, dashboard owner/team guard, Add Pet/bulk management, verification, reservation/transfer behavior และ existing farm data

ไม่เปลี่ยน queries ของ Partner หรือ Farm Hub (หลักฐาน `query-preservation.json`), ไม่เปลี่ยน workspace provider/access contexts/layout guards. Owner/non-owner create behavior ใช้กฎเดิม ไม่มีสิทธิ์สร้างสัตว์เพิ่มให้ manager/staff/viewer

## 6. Buyer Links

แก้ **หนึ่งตำแหน่ง**: การ์ดสัตว์ใน `web/app/farm-hub/page.tsx` จาก `/pets/${pet.id}` เป็น `/p/${pet.id}` ใช้ ID ของสัตว์เดิม ไม่ใช้ farm ID. `/farm/[id]` ใช้ `/p/${pet.id}` ถูกต้องอยู่แล้วจึงไม่แก้. Search ลิงก์หน้าฟาร์มเดิม; Pet ID/owner creation/management links ไม่ใช่ buyer links จึงคงเส้นทาง owner

ใช้ public page ที่ไม่มี UI login gate สำหรับข้อมูล public อยู่แล้ว ไม่เปลี่ยน public query/SELECT policies/API/isPublicListing/status/is_public. ข้อมูลอ่านได้เท่าที่ backend อนุญาต หาก policy ไม่ให้ read ยังคง failure/not-found เดิม ไม่ fallback ไปดึงด้วย owner session หรือขยายสิทธิ์. Anonymous mock journey ยืนยัน Farm Hub → pet ID จริง → Public Detail/contact UI โดยไม่เปลี่ยน auth

Public Share Pending Review ใน First Listing ยังคงเดิม และไม่ได้รับรอง public visibility ของ deployed DB โดยการแก้ href นี้

## 7. Homepage

คง layout เดิม เพิ่ม CTA ค้นหาสัตว์และฟาร์ม กับ สำหรับฟาร์ม ถัดจาก Create Pet ID; sample/demo link เดิมยังอยู่. ลด transfer promotion ใน problem/farm feature cards, ไม่แสดง roadmap booking/community/articles และไม่แสดง clinic FAQ บน landing. คง feature metadata/translation keys สำหรับระบบเดิมไว้และ filter เฉพาะสิ่งที่โปรโมต รวม structured-data feature/FAQ lists ให้ตรงกับส่วนที่แสดง

ไม่สร้างสถิติ/ratings/Verified claims/บริการใหม่ และไม่เปลี่ยน Trust Copy ที่ตรวจแล้ว ไม่มี homepage redesign หรือ seed real/fake business records

## 8. TH/EN และ i18n scope

เพิ่ม copy ใน namespaces เดิม `nav`, `footer`, `landing` ทั้งสองภาษา ไม่เพิ่ม global namespace ไม่ import catalogue JSON เข้า client. Partner และ DefaultBottomNav ใช้ nav ที่ locale layout จ่ายอยู่แล้ว. Labels/copy ที่แก้มี TH/EN; ไม่อ้างว่า Farm Suite/Tools/Knowledge ทั้งระบบแปลครบ เพราะข้อความเดิมนอก scope บางส่วนยังเป็นไทย

## 9. Desktop/Mobile และ regressions ที่พบ

พบ overflow ที่ 768px เมื่อ signed-in/multi-workspace ในรอบแรก แก้ header ให้ wrap แล้ว assertions เดิมผ่าน 768/1024/1440px. Navigation tests ตรวจ Desktop/Mobile ทั้ง TH/EN, เปิด/ปิดเมนู, anonymous buyer path, direct hidden routes, owner/manager/staff/viewer และ single workspace bottom nav

เก็บ failures รอบแรกไว้: unit structural assertions 2 จุดแก้โดยรักษา metadata เดิมและ filter promotion (ไม่เปลี่ยน unit tests); test selector ใหม่ที่นับ Footer รวมกับ Partner แก้ให้ scope หน้า Partner; selector ปิดเมนูแก้ให้ใช้ aria-label ปิดเมนูและเพิ่ม expanded-state assertions. ไม่ลด/skip assertions. Physical device/camera/native mobile share UAT ยัง NOT RUN

ภาพ full-page อาจมีพื้นที่ว่างจาก IntersectionObserver reveal และตำแหน่ง fixed/sticky nav ขณะ capture ให้ดูภาพ viewport และ tests ประกอบ ไม่ตีความภาพยาวอย่างเดียวว่าเป็น layout ที่ผู้ใช้เห็นขณะ scroll

## 10. Build และ Tests

ผลใหม่ของ source ชุดนี้: **Browser 168/168, Unit 77/77**, TypeScript และ clean production build `--webpack` ผ่าน. ไม่มี skipped/flaky/unexpected ใน completed browser reports

| Suite | ผ่าน/รัน |
|---|---:|
| Navigation ใหม่ (TH/EN Desktop/Mobile, legacy roles, direct URLs, responsive) | 18/18 |
| First Listing + Public Image + Farm Dashboard + Pet Profile เดิม | 60/60 |
| i18n findings/foundation/language/phase2 + Trust Copy | 76/76 |
| Pet ID Card/PNG/QR/share | 13/13 |
| RootChrome production bundle | 1/1 |
| Unit (catalogue/i18n/format/namespaces/vaccine/layout/business forms) | 77/77 |

Bundle ตรวจ cold routes 8 หน้า และ chunks 265 ไฟล์ ไม่พบ full-catalogue sentinel; ใช้ร่วมกับ unit/static scope tests ไม่อ้างจาก sentinel อย่างเดียว. ไม่ใช้ผล 150/150 ของ baseline มาบวก. Source hashes ตรง tested-source-sha256.json ก่อน commit

หลักฐาน/commands: `local-evidence/navigation-phase1-095a6a6-20261105/README_TH.md`, logs และ Playwright JSON ใน directory เดียวกัน. Build/test runner Node 22.23.2; production browser servers จาก PATH Node 24.21.0; dummy API http://127.0.0.1:9, local mocks/serviceWorkers blocked. เฉพาะ probe ภาพ viewport ใช้ Node22 เปิด server ของตัวเอง ไม่มี live DB/real-user records

NOT RUN: Staging/Production UAT, real RLS/authorization/database checks, real contact_leads writes/popup, real reservation/transfer transitions, physical devices/camera/native share และ F4/H2/#37 live flows เพราะอยู่นอก authorization รอบนี้

## 11. ESLint เทียบ baseline

Scope UI ที่แก้ 6 ไฟล์: **12 errors / 28 warnings** ทั้ง baseline 095a6a6 และ working tree เท่ากัน. New navigation test/config และ phase2 browser test ที่ปรับไม่มี lint errors/warnings. จึงมี new errors=0/new warnings=0 ใน scope ที่ตรวจ ไม่อ้างว่า whole-project ESLint clean. เทียบ rules/messages/source signature ใน evidence ประกอบ

## 12. QR Effect Finding

คง Finding `react-hooks/set-state-in-effect` ที่ `setQrUrl('')` ใน Pet ID Card ซึ่งเริ่มจาก bef061d และมีอยู่ใน baseline 095a6a6. ไฟล์ id-card ไม่ถูกแก้ในงานนี้ ไม่ suppress rule และไม่อ้างว่า finding ผ่าน Review แล้ว. Card/QR regression ยืนยันพฤติกรรมในขอบเขต mocks เท่านั้น

## 13. Security Dependencies

ไม่เพิ่ม backend/security dependency ใหม่จาก nav filter หรือ href change และไม่เปลี่ยน Auth, Authorization, RLS, Schema/Migration, Pet/Farm Ownership, is_public, booking/reservation backend, LINE, F4/H2/#37 หรือ production/staging configuration. UI visibility ไม่ใช่ security gate

ยังมี dependencies เดิม: actual anonymous SELECT ของแต่ละ status/is_public, field tiers/consent, contact_leads wait-before-open, reservation/transfer fallback/transitions, F4/H2/#37 integration และ legal/support readiness. ไม่ทดสอบ real DB หรือเปิดสิทธิ์เพื่อให้ public route อ่านได้. First Listing Public Share Pending Review ยังอยู่

## 14. สิ่งที่ Claude ต้องตรวจ

ตรวจ primary/resource filtering, Partner farm/legacy card conditions และ memberships chooser ที่ไม่ถูกกรอง; mobile global/workspace bars ไม่ซ้อนและยังเข้าถึง actions ได้; header wrap/keyboard/axe/navigation history; TH/EN keys และ scope; hero/JSON-LD ที่ลด promotion; Farm Hub public href ใช้ pet.id จริงและไม่มี query/policy delta; Role/access guards เดิม; no-feature-disable assumption; no new lint diagnostics และ QR effect finding เดิม

phase2.spec.ts เปลี่ยน entry method ของ regression case ที่เคยอาศัย Shop/Service promotion: direct URL legacy page → client-navigation ไป About → browser back. คง URL/heading/translated content/raw-key/pageerror assertions เดิม เพิ่ม negative promotion และ back-to-service assertions ไม่ลด assertions หรือเปลี่ยนให้ยอมรับ failures. Unit tests เดิมไม่แก้

ก่อนรวม F4/H2/#37 ต้อง review บน integrated SHA ใหม่พร้อมทดสอบ auth/locale redirect compatibility แยก ไม่ใช้ผล UI นี้แทน Security Approval

## 15. Owner Decision Required

การหยุดรับสมัคร shop/service จริงหรือปิด direct URLs/APIs ยังไม่ได้ทำ ต้อง policy/server gates และแผนผู้ใช้เดิมก่อน. Empty-state/CTA ภายใน legacy modules และ direct registration routes ยังอยู่ตามเดิม; การลด promotion ไม่ได้ปิดธุรกิจหรือ backend

Legacy singular links `/shop/{id}`/`/service/{id}` และ shop/service tools บางหน้าที่ไม่มี route ยังเป็น Findings เดิม ไม่แก้ขยาย scope นี้; ผู้ใช้เดิมยังเข้าจัดการ dashboard/data ตาม routes ที่มี. การแก้ links/operations เหล่านั้นต้อง scope แยก

รอ Owner/Independent Review สำหรับ Public Share/actual visibility/contact/reservation rollout, Terms/Privacy/Support, physical-device UAT และ Security Integration/Staging UAT. ไม่เพิ่ม runtime flags/env changes และไม่เริ่ม deploy จากผลรายงานนี้
