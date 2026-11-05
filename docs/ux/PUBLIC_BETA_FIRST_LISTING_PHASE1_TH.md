# Whiskora Public Beta — First Listing Experience (UX Phase 1)

งาน Local UX บน `fix/public-beta-first-listing-ux` เริ่มจาก `bef061d` โดยตรง ไม่ใช่ Security Approval หรือ Production Release Approval ไม่มี Push, Merge, Deploy หรือเปลี่ยนฐานข้อมูล

## 1. เส้นทางก่อนและหลัง

ก่อน: Dashboard → หาเมนูเพิ่มสัตว์ → เลือกเพิ่มทีละตัว → ฟอร์มทุกส่วน → บันทึก → รายการสัตว์ → ค้นหาสัตว์ที่เพิ่งเพิ่ม → รายละเอียด → แชร์

หลัง: เจ้าของที่ผ่าน layout guard เดิมเข้า Dashboard → ปุ่ม “เพิ่มสัตว์เลี้ยง” ใกล้ส่วนหัว หรือเมนูล่างที่เปิดฟอร์มรายตัวโดยตรง → ข้อมูลหลัก → บันทึก → ผลสำเร็จพร้อมทางไปรายละเอียดของสัตว์ที่เพิ่มจริง

## 2. สิ่งที่ค้นพบง่ายขึ้นและขั้นตอนที่ลดลง

เพิ่ม CTA บน Dashboard สำหรับ owner ตาม context เดิม เมนูล่างข้าม sheet เลือกทีละตัว/หลายตัวไปฟอร์มรายตัวได้ทันที ทางเพิ่มหลายตัวยังอยู่เป็นลิงก์รองบน Dashboard ไม่แก้ bulk-create workflow ปุ่มใน empty state ซ่อนจากผู้ไม่มีสิทธิ์สร้างด้วย ฟอร์มระบุว่าพ่อแม่/ครอกไม่ใช่สิ่งที่ต้องสร้างก่อน

## 3. ข้อบังคับจริง

ยังต้องล็อกอินและเป็นเจ้าของฟาร์มตาม layout เดิม ไม่เพิ่มบทบาทหรือสิทธิ์ใด ๆ ไม่แก้ guard, Auth, RLS, RPC หรือ ownership ขั้นตอนเปิดฟาร์มและข้อมูลที่ create_business บังคับคงเดิม

ชื่อและสายพันธุ์ยังบังคับ หากเลือก “อื่นๆ” ต้องกรอกสายพันธุ์เอง วันเกิดต้องไม่เป็นอนาคต รอบนี้เปลี่ยนค่าเริ่มต้นในฟอร์มของเพศจาก male เป็นค่าว่างและให้เลือก male/female ก่อนส่ง ค่า payload หลังเลือกเหมือนเดิม ไม่ส่งค่าว่างหรือเพิ่ม enum ใหม่ ไม่ต้องเปลี่ยน schema หากต้องการรองรับ unknown sex ต้องพิจารณา Business Rules/Schema แยก

## 4. ฟอร์มใหม่

ลำดับ: ชื่อ → สายพันธุ์/custom breed → รูปพร้อม crop เดิม → เพศที่ต้องเลือกเอง → วันเกิด → สถานะและราคา คงทุกสถานะและฟิลด์ราคาไว้ ไม่ตีความว่าสัตว์ทุกตัวเป็นประกาศขาย

ลักษณะเพิ่มเติม พ่อแม่พันธุ์ และหมายเหตุเป็น native details/summary ปิดเริ่มต้น ใช้คีย์บอร์ดเปิดได้และไม่ล้างค่าที่กรอกเมื่อพับ เพิ่ม accessible names ให้ controls และใช้ form submit เพื่อรองรับ Enter

ก่อนบันทึกแจ้งว่าไม่ใช่ร่างส่วนตัวและอาจเข้าถึงสาธารณะตามสิทธิ์/สถานะเดิม `is_public: true` คงเดิม ไม่มี draft/publish/approval workflow ใหม่ Validation อื่นและการแปลง payload เดิมคงไว้ รวมถึงราคาเดิมที่ parseInt จึงยังต้อง review ความหมายราคา/เศษสตางค์แยกหากต้องการเปลี่ยน

## 5. หลังบันทึก

Insert เดิมเพิ่มการขอคืนเฉพาะ `id` ด้วย `.select("id")` เพื่อไม่เดา ID จากลำดับรายการ ไม่ใช้ farm ID เป็น pet ID เมื่อ server ตอบสำเร็จแสดงชื่อสัตว์และทางไป `/pets/{returned-id}` สำหรับเจ้าของ, รายการสัตว์ของฟาร์ม, และเพิ่มตัวถัดไป (reload ฟอร์มเพื่อเริ่มใหม่)

หากตอบสำเร็จแต่ไม่มี ID จะไม่สร้างลิงก์รายละเอียดที่เดาขึ้นเอง ยังกลับรายการหรือเพิ่มตัวถัดไปได้ หากบันทึกผิดพลาดแสดง error ในฟอร์มและคงค่าที่กรอก ไม่แสดงผลสำเร็จ ปุ่มบันทึก disabled ระหว่างรอ

## 6. Share Link ภายใต้สิทธิ์เดิม

Source เดิมใช้ `origin + /p/{petId}` ใน owner pet detail นำเส้นทางกลับไปรายละเอียดเดิมมาใช้ได้ แต่ไม่ถือว่าการอ่านสำเร็จด้วย owner session เป็นหลักฐานว่า anonymous อ่านได้

ผลสำเร็จรอบนี้แสดง **Public Share: Pending Review** และไม่มีปุ่มดูหน้าสาธารณะ/คัดลอกลิงก์ใหม่ทุกสถานะ ไม่อ้างว่าอนุมัติหรือเผยแพร่สำเร็จ ปุ่มแชร์เดิมใน owner detail ไม่ถูกแก้ ต้อง review แยกก่อนถือว่าเป็น public-access confirmation

เหตุผล: helper `isPublicListing` รวมพร้อมย้ายบ้าน/เปิดจอง ขณะที่ migration public SELECT ที่ audit อ้างถึงระบุพร้อมย้ายบ้าน และไม่มีการตรวจ deployed schema/policies ในงานนี้ ไม่ควรรับรอง anonymous access จาก helper หรือ mock tests ต้องผ่าน Security/Visibility Review และ Synthetic UAT ใน environment ที่ได้รับอนุญาตก่อนเปิด CTA แชร์ใหม่

## 7. Public Pet Detail

คง query pets, farms, profiles, field-access RPC และเงื่อนไข contact/reservation เดิมทั้งหมด แสดงราคาบวกที่มีอยู่แล้วทั้งพร้อมย้ายบ้านและเปิดจองให้สอดคล้องกับรายการฟาร์ม เพิ่มข้อความเฉพาะสัตว์ของฟาร์มว่า status มาจากฟาร์ม ให้ติดต่อยืนยันความพร้อม/ราคา หากราคา null/0/ไม่เป็นค่าบวก ไม่แสดงว่าให้ฟรี เพิ่ม min-height ปุ่มติดต่อเป็น 44px

ข้อมูล seller ยังจำกัดตาม SELECT เดิม: farm id/name/phone/Facebook/LINE/verified และ profile id/full_name/avatar_url ไม่เพิ่มเบอร์ส่วนตัว ที่อยู่ อีเมล หรือข้อมูลอื่น ไม่มีการเพิ่มช่องทางเมื่อฟาร์มไม่ได้ตั้งค่า Public detail ยังไม่เพิ่ม login gate; reservation ยังคงเงื่อนไขเดิม

## 8. Backend/Security dependencies และข้อเสนอ contact_leads

- ยืนยัน anonymous SELECT/visibility ของแต่ละ status และ `is_public` ด้วย policies/schema จริงที่ได้รับอนุญาตก่อนเปิด share CTA ใหม่ รวมถึงเช็กผล INSERT RETURNING id ตามสิทธิ์ owner จริง ไม่ขยายสิทธิ์เพียงเพื่อให้ UX ผ่าน
- `logLeadAndOpen` ยัง await insert contact_leads ก่อน window.open หาก logging ช้าหรือ popup ถูก browser block การติดต่ออาจสะดุด ไม่มี backend change รอบนี้
- ข้อเสนอแยก: review ข้อมูล/consent/สิทธิ์ contact_leads แล้วออกแบบเปิดช่องทางที่ฟาร์มอนุญาตจาก user gesture โดยไม่ผูกความสำเร็จกับ analytics write พร้อมทดสอบ anonymous/authenticated, rejected insert, offline/timeout และ popup policy ไม่ควรถอด RLS หรือเพิ่มสิทธิ์เพื่อแก้ปุ่มติดต่อ
- ต้อง review การยินยอมเผยแพร่ข้อมูลฟาร์ม/ช่องทางเดิมและ public farm address/map, note และ field groups ตาม Security work ที่แยกอยู่ ไม่ใช้ UX candidate นี้รับรองว่าแก้ findings เหล่านั้นแล้ว
- ไม่เปลี่ยน LINE linking, booking/reservation backend หรือ security branches

## 9. ผล Tests

หลักฐานอยู่ที่ `local-evidence/first-listing-ux-20261105/` ไม่มีการลด assertions หรือ skip failures เพื่อให้ผ่าน Mock browser tests ยืนยัน UX/request/response contract เท่านั้น ไม่พิสูจน์ RLS หรือ deployed DB

- Clean production build ของ source สุดท้ายบน Node 22: ผ่าน (`clean-build-node22.log`) รวม TypeScript และ static generation 47/47
- Trust Copy เดิม: ผ่าน 4/4 (`trust-regression.log`)
- `contracts.json`: source ของ public fetch/access และ insert payload ตรงกับ bef061d ทุกบรรทัด
- First Listing: ผ่าน 14/14 (`journey-production-final.log`): TH/EN × Desktop/Mobile, dashboard/navigation, validations, optional sections, insert failure/retained fields, success ID/URL, no-ID fallback, add-next reset, owner/manager/staff/viewer และ anonymous public/detail contact visibility
- Pet Profile/vaccine UX regression เดิม: ผ่าน 44/44 (`profile-regression.log`)
- Dashboard integration เดิม: ผ่าน 2/2 (`dashboard-regression.log`) รวม TH/EN และ refresh
- TypeScript รวม test fixture ล่าสุด: ผ่าน (`typescript-with-photo-fixture.log`)
- Unit vaccine summary/business profile: ผ่าน 2/2 (`unit-tests.log`); dashboard layout regression ผ่าน 1/1 (`layout-test.log`)
- Public Detail พร้อมภาพ SVG จำลองที่เสิร์ฟในเครื่อง: ผ่านเพิ่ม 4/4 (`public-local-photo.log`) ทั้ง TH/EN Desktop/Mobile และตรวจ naturalWidth ของรูป; ภาพอยู่ใน `screenshots-public-local-image/`
- Pet ID Card regression เดิม: ผ่าน 13/13 (`card-regression.log`), 320/360/375/390/430/1440px × TH/EN, หกธีม, long text, export PNG และถอด QR จริง รวม native share URL/clipboard fallback
- ESLint tests/config ใหม่: ผ่าน (`new-tests-eslint-final.log`); UI lint มี baseline errors เดิมตามหัวข้อ 11
- หลังคืน generated file ให้ตรงต้นฉบับ TypeScript ยังผ่าน (`typescript-restored-generated-file.log`); `git diff --check` ผ่าน

สรุปชุด browser หลักผ่าน 77/77 กรณี (14 + 44 + 2 + 4 + 13) และรัน public cases ที่เพิ่ม local-photo assertion อีก 4/4 ไม่มี skipped cases ในรอบสำเร็จ ไม่พบ UX regression ในชุดที่รัน ไม่ได้ทดสอบฐานข้อมูลจริงหรือยืนยัน readiness ด้าน Security

## 10. Mobile/Desktop

ตรวจ TH/EN ด้วย Desktop Chrome และ Pixel 7 emulation ผ่านทั้งสองขนาดหน้าจอ ตรวจ horizontal overflow ในผลสำเร็จและ public detail, ปุ่มติดต่อสูงอย่างน้อย 44px และ navigation สำหรับ owner/roles อื่น มี screenshots 20 ภาพพร้อม index ที่ `local-evidence/first-listing-ux-20261105/screenshots-final/` รวม Dashboard, ฟอร์มเริ่มต้นที่ส่วน optional พับไว้, optional sections, ผลสำเร็จ และ public detail

ภาพ full-page จับ fixed/sticky navigation ที่ตำแหน่ง scroll ขณะ capture จึงอาจเห็นแถบเมนูคั่นกลางภาพยาว ไม่ได้เป็นตำแหน่งปกติของแถบใน viewport ให้ดูร่วมกับ browser assertions และ trace ไม่ใช่สรุปจากภาพยาวเพียงอย่างเดียว

## 11. Regression และข้อจำกัด

TypeScript ผ่านรอบแรก Unit tests vaccine summary/business profile ผ่าน 2/2 และ dashboard layout regression ผ่าน 1/1 ESLint ของสี่ไฟล์ UI มีข้อผิดพลาดเดิมรวม 17 จุดเท่ากับ bef061d (9 dashboard, 6 create, 2 public) warning ลดจาก 48 เหลือ 46 ไม่ปิด rule ไม่ลด assertion ผล browser รอบสุดท้ายผ่านครบตามหัวข้อ 9; ปัญหา lint เดิมและความไม่แน่นอนของ public access/DB ยังเป็นข้อจำกัด ไม่อ้างว่าหายไปจากการทดสอบ UX

รอบ browser แรกไม่มี Chromium จึงติดตั้ง browser; รอบ dev ถัดไปพบ selector alert ชน Next.js route announcer แก้ให้ scope ในฟอร์ม และมี dev overlay บังปุ่มบน Mobile ระหว่างการปรับ source จึงหยุดรอบนั้นและทดสอบใหม่บน clean production build ในเครื่อง รอบ production-local พบ test selector ชื่อสัตว์ซ้ำใน header/timeline จึง scope ไปที่ header โดยคงการตรวจชื่อและ visibility ครบ และรันใหม่ทั้ง suite เก็บ failures/cancelled artifacts ไว้ทั้งหมด

ภาพ public fixture รอบแรกไม่มีรูปและ test block placeholder ภายนอก จึงเห็น broken placeholder ใน snapshot เก็บภาพเดิมไว้ และเพิ่ม fixture รูป SVG ที่เสิร์ฟในเครื่องพร้อม assertion naturalWidth แยก ไม่ได้แก้ fallback รูปของแอปหรือสร้างภาพสัตว์จริง

Build บน Node 24 สองรอบก่อนหน้าผ่าน แต่รอบถัดไปพบ Webpack WasmHash TypeError จึงเก็บ log (`clean-build-release-candidate.log`) และใช้ Node 22 ที่ติดตั้งอยู่รันจาก cache ว่างสำเร็จ ไม่แก้ compiler config หรือปิด TypeScript

## 12. ความเข้ากันได้กับ bef061d

เป็น descendant ของ bef061d คืนไฟล์ next-env.d.ts ที่ build สร้างใหม่ให้ตรงต้นฉบับและเก็บสำเนาที่ generate ใน evidence ไม่รวม generated file ใน commit ไม่แตะ Pet ID card, trust copy catalog, owner pet profile implementation, Auth/RPC/SQL หรือ public queries Candidates bef061d, dfd6bc1, 0ded068 และ worktrees/security branches เดิมต้องคงเดิม Evidence เดิมไม่ลบ/รีเซ็ต

## 13. สิ่งที่ Claude ต้องตรวจ

ตรวจ diff เฉพาะ UX รวมเพศที่ต้องเลือกเอง, ค่า payload และ validation เดิม, owner-only CTA, permission guard ที่ไม่เปลี่ยน, semantics ของราคา/สถานะ, ข้อความก่อน save, INSERT RETURNING id และ fallback เมื่อไม่มี id, เส้นทางหลัง save และ locale cookie, การไม่แสดง public CTA โดยอาศัย owner response, screenshots ทั้งสองขนาด และความเข้ากันได้กับ security candidates ที่ยังไม่รวม ห้ามถือผล mock เป็น approval ด้าน RLS หรือ production

## 14. สิ่งที่ควรทดลองกับฟาร์มจริงหลัง Readiness Gates

หลัง Independent Review, Security/visibility review, environment/schema ตรง SHA, Synthetic UAT และ approval ด้าน privacy/content/support แล้ว ให้ฟาร์มล็อกอินและบันทึกเองด้วยข้อมูล/รูปที่อนุญาต วัดเวลาจาก Dashboard ถึงสัตว์ตัวแรก การค้นพบ CTA ความเข้าใจเพศ/สถานะ/ราคา/การเผยแพร่ การเปิด optional sections ความเข้าใจผลสำเร็จ และการกลับไปจัดการสัตว์

หลังยืนยัน public access แล้วค่อยวัดการเปิดลิงก์แบบไม่สมัครและการติดต่อจริงผ่านช่องทางที่ตั้งค่าไว้ ไม่เริ่ม pilot/deploy จากรายงานนี้ และไม่โฆษณา booking ครบวงจรโดยยังไม่ผ่าน gate แยก
