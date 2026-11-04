# Whiskora Pet ID Mobile Card & QR Quality

Local only · baseline `dfd6bc1b3b6070ac9151aabc552c2066f6441a1b` · 2026-11-04.
Branch `fix/public-beta-pet-id-mobile-card`. Integration `0ded068` และ Trust Copy เดิมคงเดิม.

## Root cause — แยก application กับ capture

Baseline production artifact ของ Trust Copy ใช้ synthetic pet และวัดหลัง animation จบ:

| Viewport | Card width | Scaler width | Right clip | Bottom clip |
|---|---:|---:|---:|---:|
| 320 | 360 | 256 | 104 | 152.64 |
| 360 | 360 | 296 | 64 | 91.59 |
| 375 | 360 | 311 | 49 | 68.69 |
| 390 | 360 | 326 | 34 | 45.80 |
| 430 | 360 | 360 | 0 | 0 |
| 1440 | 360 | 360 | 0 | 0 |

เป็น Application clipping จริงจาก DOM ไม่ใช่เพียง screenshot:
`card-in` animation + fill both คง `transform:scale(1)` ทับ inline responsive scale;
formula ใช้ window-40/380 ทั้งที่ card width 360 และมี parent padding/flex shrink.

QR baseline actual card เรียก api.qrserver.com; offline browser บล็อก external network ตามแผน.
ไม่ได้ทดสอบ availability ของบริการภายนอกและไม่อ้างว่า provider เสีย.

ระหว่างตรวจ QR หลังแก้ พบ screenshots บางภาพมี fixed Navbar วาดทับ QR ที่ด้านบน
(มี logo Whiskora ในภาพ crop); Decoder อ่านไม่ได้แม้ลอง preprocess ภาพเดิม.
แยกเป็น capture obstruction ไม่ใช่ encoding error; final test scroll QR กลางจอและ assert top>100
ก่อน capture โดยไม่เปลี่ยน expected decoded URL หรือเอา assertions ออก.

## Changes

### Actual card

- วัด stage.clientWidth ด้วย ResizeObserver, ใช้ native width 360 และ cap scale≤1
- animation เปลี่ยน opacity เท่านั้น ไม่ทับ scale; scaler ไม่ flex-shrink
- วัด native card.offsetHeight; ปกติคง 360×580, ข้อความยาวขยายความสูงตามจริง
  แทนการตัดข้อมูลหรือย่อ font จนอ่านยาก ไม่บังคับ aspect ratio เดิมเมื่อเนื้อหายาวเกิน
- name/breed/color และ tag ห่อบรรทัดแทน ellipsis; ภาพยัง object-fit:cover ตาม design
- สร้าง QR ด้วย qrcode library ที่มีอยู่แล้ว: same origin + `/p/{petId}` ไม่ผ่าน external QR service
  quiet zone 4 / error correction H และ pixelated rendering; cancel old generation เมื่อเปลี่ยน petId/unmount
- ไม่เปลี่ยน query, getSession, health RPC, fields, access rules, share URL หรือสิทธิ์ public profile

### Demo / image export ที่มีอยู่

- canonical capture source 400×600, pixelRatio 3 → actual PNG 1200×1800
- typography/card spacing ไม่ขึ้นกับ viewport; rendered PNG ย่อ max-width:100% ภายใน Container
- แยก offscreen wrapper ออกจาก node ที่ html-to-image clone เพื่อไม่ให้ offset ติดไปใน SVG/PNG
- แหล่ง capture คง mounted; ไม่ display:none แล้ว clone; เปิดเผย error หาก renderer throws
- reselect theme เดิมไม่ล้างภาพแล้วรอ effect ที่ไม่มี dependency เปลี่ยน
- demo QR ใช้ current origin + `/pet-id-card-preview#demo-profile` ยังคงเป็น demo ไม่ใช่ pet จริง
- ไม่เพิ่ม export feature ให้ actual card; ไม่สร้าง API/schema/dependencies ใหม่

## Preview vs Export vs Share

| สิ่งที่ตรวจ | ขอบเขต |
|---|---|
| Actual card preview | DOM bounds/text/photo fit และ screenshot ทุก width/locale/theme |
| Actual QR | อ่านจาก screenshot pixels ของ QR ที่เห็นจริงด้วย ZXing; exact `/p/990001` |
| Actual native share | ทดสอบ handler delegation ด้วย mocked navigator.share และ clipboard; URL เดิม |
| Actual image export | **ไม่มีฟังก์ชันนี้ใน Source** มีเพียงแชร์ลิงก์ ไม่อ้างดาวน์โหลดภาพผ่านแล้ว |
| Demo image export | ตรวจ PNG จาก src ที่ Application สร้างด้วย html-to-image จริง ไม่สร้างภาพทดแทนใน test |
| Demo PNG | ขนาด, entropy, child text/QR/footer bounds, 6 theme variants และ decode QR จาก PNG crop |
| Save to Photos / native share sheet / camera scan | **Pending Device UAT** ไม่ใช่ผล emulator/local decoder |
| ด้านหลังบัตร | Source รองรับด้านเดียว ไม่มี flip/back layout ให้ทดสอบ |

## Final results

- Clean Production Build `next build --webpack`: **PASSED** (`build-third.log`, clean `.next`, loopback synthetic env)
- TypeScript `tsc --noEmit`: **PASSED**; scoped tests ESLint: **PASSED**
- Unit Tests: **72/72**, ไม่ skip (16 race + 6 consistency + 13 format + 7 namespaces + 22 vaccine + 8 layout)
- Card Browser Tests production-mode: **13/13**, 0 failed / flaky / skipped
- Trust Copy Regression **4/4**, UX Regression **44/44**, Farm Integration **2/2**
- i18n Regression: **72/72**
- Characterization ก่อนแก้: 1 case แยกจาก regression results

| Viewport | TH / EN | Themes | Card / demo bounds | PNG / local QR |
|---|---|---:|---|---|
| 320 | ผ่านทั้งคู่ | 6 | ผ่าน | ผ่าน |
| 360 | ผ่านทั้งคู่ | 6 | ผ่าน | ผ่าน |
| 375 | ผ่านทั้งคู่ | 6 | ผ่าน | ผ่าน |
| 390 | ผ่านทั้งคู่ | 6 | ผ่าน | ผ่าน |
| 430 | ผ่านทั้งคู่ | 6 | ผ่าน | ผ่าน |
| 1440 Desktop | ผ่านทั้งคู่ | 6 | ผ่าน | ผ่าน |

รวม actual QR decode จาก screenshot 72 ครั้ง + demo QR decode จาก actual PNG 72 ครั้ง.
PNG export จริง 72 ภาพ ขนาด 1200×1800; SHA-256 ต่อ theme เหมือนกันทุก viewport/locale,
และภาพทั้งหก theme แตกต่างกัน. ตรวจตัวแทน mobile/desktop และ PNG ด้วยสายตาประกอบ DOM/decoder.
รูปสัตว์ fixture 240×120 แสดงด้วย object-fit:cover ตามดีไซน์เดิม ไม่ยืดรูป;
demo ใช้ placeholder สัตว์ตาม source เดิม ไม่มี pet-image upload/export path ให้เพิ่มใน scope นี้.
Widths ทดสอบใน Chromium desktop viewport; regression เดิมมี Pixel 7 emulation
ไม่ใช่การทดสอบ physical device หรือ iOS Safari.

Browser รวม **135/135** (13 ใหม่ + 122 regression), 0 failed / flaky / skipped. ไม่พบ regression ในชุดที่รัน. บันทึกผลแบบ machine-readable: `pet-id-card-quality-evidence/summary.json`.
Raw evidence และ failed attempts อยู่ local-evidence ตามเดิม ไม่รวมใน commit.
References เดิมไม่เปลี่ยน; evidence เดิม 605 ไฟล์ยังมีอยู่และขนาดเท่าเดิม (ตรวจ presence/size ไม่ใช่ content hash).
Application fetch/session/health block และ share handler เปรียบเทียบกับ dfd6bc1 ได้ผลเหมือนเดิม.


## Attempts / evidence

- Baseline characterization 1 case, screenshot ทุกขนาดก่อนแก้, baseline-bounds.json
- Sandbox baseline attempt เปิด port ไม่ได้; authorized loopback run ผ่าน ไม่ใช่ product failure
- First intermediate export สร้าง PNG โปร่งใส entropy0 และ decode ไม่ผ่าน; เก็บ trace/PNG ไว้
  เป็น defect ระหว่างปรับ capture ที่แก้แล้ว ไม่อ้างว่าผ่านเพราะมีไฟล์หรือขนาดถูกต้องเท่านั้น
- Later intermediate QR screenshots มี navbar obstruction ตามด้านบน เก็บ failed attempts ทั้งหมด
- ไม่มีการลด assertions, skip failed cases หรือใช้ fake export เพื่อทำให้ผ่าน
- Final tests มี fixed-data sessions/API interception เท่านั้น; external font request ถูกบล็อก
  ไม่มี database/provider write, no auth/provider/security testing

## Files / review boundaries

- `web/app/pets/[id]/id-card/page.tsx`: scaling/rendering/local QR เท่านั้น
- `web/app/pet-id-card-preview/page.tsx`: canonical preview/export rendering และ demo QR
- `web/e2e/i18n/pet-card*.spec.ts`, `web/playwright.pet-card.config.ts`: baseline/quality/share diagnostics
- รายงาน/evidence summary นี้; raw screenshots/PNG/traces อยู่ local-evidence/pet-id-mobile-card-20261104/

Terms/Privacy, Trust Copy labels/namespaces/Footer, original UX pet detail, Auth/API/RLS/migrations
ไม่เปลี่ยน. F4/H2/#37 และ worktree อื่นไม่เปลี่ยน. Local tests ไม่แทน Security/Legal/Release Approval.

## Reproduce locally

จาก `web/` ใช้ dependency ที่ติดตั้งอยู่แล้ว ไม่ต้องติดตั้งเพิ่ม:

```sh
node node_modules/typescript/bin/tsc --noEmit
I18N_PRODUCTION=1 I18N_RUN_LABEL=pet-card-review PLAYWRIGHT_BROWSERS_PATH=/tmp/whiskora-playwright-browsers node node_modules/@playwright/test/cli.js test --config playwright.pet-card.config.ts
```

Browser config ใช้ production artifact ที่ build ด้วย loopback Supabase URL/fixture key ตามแผน local เดิม
ต้องจัดเตรียม artifact ด้วย synthetic environment ก่อน ไม่ใช้ production credentials หรือ `.env` ของระบบจริง.
`CARD_BASELINE=1` ใช้เก็บ characterization ของ baseline เท่านั้น; ไม่ใช่ regression assertion ว่าปัญหาหาย.
ผล 72 Unit Tests มาจากรัน 6 ไฟล์โดยตรง (16+6+13+7+22+8); node runner แบบรวมอาจรายงานจำนวนไฟล์เป็น 6.

การรันเส้นทาง TH/EN ยืนยันว่าบัตรแสดงและ QR/share ทำงานบนทั้งสองเส้นทาง
ไม่ถือเป็นการแปลข้อความเดิมของบัตรทั้งหมดเป็นอังกฤษ; ไม่ขยาย scope เปลี่ยน labels เดิม.

## Claude Independent Review

1. ตรวจ animation cascade, ResizeObserver cleanup/height feedback และ text wrapping/native size
2. ตรวจ actual QR payload คงเดิม, cancellation และ no external QR service; ไม่มี visibility/authorization change
3. ตรวจ html-to-image canonical clone ไม่ถูกซ่อน/offset, theme race/cancellation และ reselect behavior
4. ตรวจ actual PNG pixels/QR/text bounds และ screenshots ก่อน–หลัง ไม่ใช้แค่ชื่อไฟล์/ขนาดเป็นหลักฐาน
5. ตรวจ capture obstruction fixes ว่าไม่ปิดบัง Application defect; assertions และ failed evidence ยังครบ
6. ตรวจ normal-size layout เทียบเดิม และ long-text height ที่ยืดได้ ไม่ใช่ออกแบบบัตรใหม่
7. ติดตาม real Android/iOS Safari/Chrome, save/share sheet, actual camera scan บน approved Preview host

**PASSED — PENDING INDEPENDENT REVIEW**. พร้อมให้ Claude ตรวจชุดนี้; final checks ผ่านแล้ว ไม่อนุมัติ Push/Deploy/Merge main หรือ Staging writes.
