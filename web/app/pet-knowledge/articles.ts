export type TopicKey =
  | "all"
  | "getting-started"
  | "health"
  | "behavior"
  | "nutrition"
  | "breed"
  | "farm-transparency"
  | "pet-id"
  | "lifestyle";

export type AnimalKey =
  | "all"
  | "cat"
  | "dog"
  | "small-pet"
  | "bird"
  | "aquatic"
  | "reptile"
  | "exotic";

export type LifeStageKey = "all" | "baby" | "adult" | "senior" | "pregnant";

export type SituationKey =
  | "all"
  | "new-pet"
  | "health-vaccine"
  | "moving-home"
  | "boarding"
  | "travel"
  | "vet"
  | "choose-breeder"
  | "ownership-transfer"
  | "condo"
  | "grooming"
  | "lost-pet";

export type KnowledgeArticle = {
  id: string;
  title: string;
  summary: string;
  topic: Exclude<TopicKey, "all">;
  animals: Exclude<AnimalKey, "all">[];
  lifeStages: Exclude<LifeStageKey, "all">[];
  situations: Exclude<SituationKey, "all">[];
  readMin: number;
  updated: string;
  author: string;
  answer: string;
  keywords: string[];
  featured?: boolean;
};

export const topicFilters: {
  key: TopicKey;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
  bg: string;
}[] = [
  {
    key: "all",
    label: "ทุกหัวข้อ",
    shortLabel: "ทั้งหมด",
    description: "รวมบทความทั้งหมดใน Whiskora Knowledge Hub",
    accent: "#2B2545",
    bg: "#F5F3F7",
  },
  {
    key: "getting-started",
    label: "เริ่มเลี้ยงสัตว์ & การเตรียมตัว",
    shortLabel: "เริ่มเลี้ยง",
    description: "เตรียมบ้าน เลือกสัตว์ให้เหมาะกับไลฟ์สไตล์ และดูแลช่วงแรก",
    accent: "#E84677",
    bg: "#FFF1F6",
  },
  {
    key: "health",
    label: "สุขภาพ วัคซีน & การดูแลประจำวัน",
    shortLabel: "สุขภาพ",
    description: "วัคซีน ถ่ายพยาธิ เห็บหมัด สุขภาพช่องปาก และประวัติสุขภาพ",
    accent: "#BE123C",
    bg: "#FFF1F2",
  },
  {
    key: "behavior",
    label: "พฤติกรรม การฝึก & ความเข้าใจสัตว์เลี้ยง",
    shortLabel: "พฤติกรรม",
    description: "นิสัย ภาษากาย ความเครียด การฝึก และการอยู่ร่วมกัน",
    accent: "#6D28D9",
    bg: "#F5F3FF",
  },
  {
    key: "nutrition",
    label: "อาหาร โภชนาการ & การใช้ชีวิต",
    shortLabel: "อาหาร",
    description: "เลือกอาหาร อ่านฉลาก ปริมาณอาหาร อาหารต้องห้าม และน้ำหนัก",
    accent: "#047857",
    bg: "#ECFDF5",
  },
  {
    key: "breed",
    label: "สายพันธุ์ การเลือกสัตว์ & ข้อมูลเฉพาะชนิด",
    shortLabel: "สายพันธุ์",
    description: "บุคลิก การดูแล โรคที่ควรระวัง และความเหมาะสมกับบ้าน",
    accent: "#0369A1",
    bg: "#F0F9FF",
  },
  {
    key: "farm-transparency",
    label: "ฟาร์ม การรับเลี้ยง & ความโปร่งใส",
    shortLabel: "ฟาร์ม",
    description: "เลือกฟาร์ม เอกสาร pedigree ประวัติสุขภาพ และการรับเลี้ยงอย่างรับผิดชอบ",
    accent: "#B45309",
    bg: "#FFFBEB",
  },
  {
    key: "pet-id",
    label: "Pet ID ข้อมูลดิจิทัล & การดูแลต่อเนื่อง",
    shortLabel: "Pet ID",
    description: "QR Profile ข้อมูลสาธารณะ ความเป็นส่วนตัว และการส่งต่อข้อมูล",
    accent: "#DB2777",
    bg: "#FDF2F8",
  },
  {
    key: "lifestyle",
    label: "ไลฟ์สไตล์ การเดินทาง & บริการสัตว์เลี้ยง",
    shortLabel: "ไลฟ์สไตล์",
    description: "เดินทาง ฝากเลี้ยง groomer โรงแรมสัตว์ และ emergency contact",
    accent: "#0F766E",
    bg: "#F0FDFA",
  },
];

export const animalFilters: { key: AnimalKey; label: string; description: string }[] = [
  { key: "all", label: "สัตว์ทั้งหมด", description: "ค้นหาข้ามชนิดสัตว์" },
  { key: "cat", label: "แมว", description: "แกนหลักของเนื้อหา Whiskora ช่วงแรก" },
  { key: "dog", label: "สุนัข", description: "สุขภาพ การฝึก และการใช้ชีวิต" },
  { key: "small-pet", label: "สัตว์เลี้ยงขนาดเล็ก", description: "กระต่าย หนูแฮมสเตอร์ หนูแกสบี้ ชินชิลลา" },
  { key: "bird", label: "นก", description: "การเลี้ยง อาหาร และสภาพแวดล้อม" },
  { key: "aquatic", label: "ปลาและสัตว์น้ำ", description: "ระบบน้ำ อาหาร และการดูแลพื้นฐาน" },
  { key: "reptile", label: "สัตว์เลื้อยคลาน", description: "แสง อุณหภูมิ อาหาร และ habitat" },
  { key: "exotic", label: "Exotic Pets", description: "สัตว์เลี้ยงพิเศษที่ต้องดูแลเฉพาะทาง" },
];

export const lifeStageFilters: { key: LifeStageKey; label: string }[] = [
  { key: "all", label: "ทุกช่วงวัย" },
  { key: "baby", label: "ลูกสัตว์" },
  { key: "adult", label: "โตเต็มวัย" },
  { key: "senior", label: "สูงวัย" },
  { key: "pregnant", label: "ตั้งครรภ์/ให้นม" },
];

export const situationFilters: { key: SituationKey; label: string }[] = [
  { key: "all", label: "ทุกสถานการณ์" },
  { key: "new-pet", label: "เพิ่งรับมาใหม่" },
  { key: "health-vaccine", label: "สุขภาพและวัคซีน" },
  { key: "moving-home", label: "ย้ายบ้าน" },
  { key: "boarding", label: "ฝากเลี้ยง" },
  { key: "travel", label: "เดินทาง" },
  { key: "vet", label: "หาสัตวแพทย์" },
  { key: "choose-breeder", label: "เลือกฟาร์ม" },
  { key: "ownership-transfer", label: "ส่งต่อเจ้าของ" },
  { key: "condo", label: "อยู่คอนโด" },
  { key: "grooming", label: "กรูมมิ่ง" },
  { key: "lost-pet", label: "สัตว์หลง/เหตุฉุกเฉิน" },
];

export const articles: KnowledgeArticle[] = [
  {
    id: "new-kitten-first-week-checklist",
    topic: "getting-started",
    animals: ["cat"],
    lifeStages: ["baby"],
    situations: ["new-pet", "health-vaccine"],
    readMin: 7,
    updated: "2026-06-16",
    author: "Whiskora Editorial",
    featured: true,
    title: "รับลูกแมวมาใหม่ต้องเตรียมอะไรบ้างใน 7 วันแรก",
    answer:
      "เตรียมพื้นที่ปลอดภัย อาหารเดิม ห้องน้ำแมว จุดซ่อนตัว ตารางวัคซีน และสร้าง Pet Profile เพื่อเก็บข้อมูลสุขภาพตั้งแต่วันแรก",
    summary:
      "เช็กลิสต์สำหรับบ้านที่เพิ่งรับลูกแมว ตั้งแต่การจัดพื้นที่ การสังเกตอาการเครียด อาหารเดิม ไปจนถึงข้อมูลที่ควรบันทึกใน Pet ID",
    keywords: ["รับลูกแมว", "เลี้ยงแมวครั้งแรก", "ลูกแมว", "Pet ID"],
  },
  {
    id: "choose-pet-for-condo-worker",
    topic: "getting-started",
    animals: ["cat", "dog", "small-pet"],
    lifeStages: ["baby", "adult"],
    situations: ["condo", "new-pet"],
    readMin: 6,
    updated: "2026-06-15",
    author: "Whiskora Editorial",
    title: "เลือกสัตว์เลี้ยงให้เหมาะกับคอนโดและคนทำงานต้องดูอะไรบ้าง",
    answer:
      "ดูเวลาอยู่บ้าน งบประมาณ พื้นที่ เสียงรบกวน พลังงานของสัตว์ และข้อกำหนดของที่พักก่อนตัดสินใจ",
    summary:
      "แนวทางประเมินไลฟ์สไตล์ก่อนรับสัตว์เข้าบ้าน เพื่อให้การเลี้ยงระยะยาวไม่กลายเป็นภาระของทั้งเจ้าของและสัตว์เลี้ยง",
    keywords: ["สัตว์เลี้ยงคอนโด", "คนทำงานเลี้ยงสัตว์", "เลือกสัตว์เลี้ยง"],
  },
  {
    id: "pet-health-record-why-important",
    topic: "health",
    animals: ["cat", "dog"],
    lifeStages: ["baby", "adult", "senior"],
    situations: ["health-vaccine", "boarding", "vet"],
    readMin: 6,
    updated: "2026-06-14",
    author: "Whiskora Editorial",
    featured: true,
    title: "ประวัติสุขภาพสัตว์เลี้ยงสำคัญอย่างไรเวลาฝากเลี้ยงหรือเปลี่ยนคลินิก",
    answer:
      "ประวัติสุขภาพช่วยให้ผู้ดูแลและสัตวแพทย์เห็นวัคซีน โรคเดิม ยา แพ้อาหาร และข้อมูลฉุกเฉินได้เร็วขึ้น",
    summary:
      "อธิบายข้อมูลที่ควรเก็บใน Health Records เช่น วัคซีน ถ่ายพยาธิ ยา โรคประจำตัว น้ำหนัก และเอกสารคลินิก",
    keywords: ["ประวัติสุขภาพสัตว์เลี้ยง", "สมุดวัคซีน", "ฝากเลี้ยง", "คลินิกสัตว์"],
  },
  {
    id: "cat-vaccine-core-guide",
    topic: "health",
    animals: ["cat"],
    lifeStages: ["baby", "adult"],
    situations: ["health-vaccine", "vet"],
    readMin: 6,
    updated: "2026-06-12",
    author: "Whiskora Editorial",
    title: "วัคซีนหลักของแมวต้องฉีดอะไรบ้าง และควรเริ่มเมื่ออายุเท่าไร",
    answer:
      "โดยทั่วไปลูกแมวควรเริ่มคุยเรื่องวัคซีนกับสัตวแพทย์ตั้งแต่ช่วงอายุประมาณ 6-8 สัปดาห์ และต้องมีการกระตุ้นตามแผน",
    summary:
      "สรุปวัคซีนพื้นฐานที่เจ้าของแมวควรรู้ พร้อมข้อมูลที่ควรบันทึกไว้เพื่อดูย้อนหลังหรือแชร์ให้คลินิกในอนาคต",
    keywords: ["วัคซีนแมว", "ลูกแมว", "สมุดวัคซีน", "สุขภาพแมว"],
  },
  {
    id: "body-language-stress-cat-dog",
    topic: "behavior",
    animals: ["cat", "dog"],
    lifeStages: ["baby", "adult", "senior"],
    situations: ["new-pet", "moving-home", "boarding"],
    readMin: 5,
    updated: "2026-06-11",
    author: "Whiskora Editorial",
    title: "อ่านภาษากายแมวและสุนัขอย่างไรเมื่อย้ายบ้านหรือเจอสภาพแวดล้อมใหม่",
    answer:
      "สังเกตท่าทาง การกิน การซ่อนตัว เสียง การเดินวน และการตอบสนองต่อคน เพื่อแยกความเครียดชั่วคราวจากอาการที่ควรปรึกษาผู้เชี่ยวชาญ",
    summary:
      "ช่วยเจ้าของเข้าใจสัญญาณเครียด ความกลัว และการปรับตัวของสัตว์เลี้ยงในบ้านใหม่หรือสถานที่ฝากเลี้ยง",
    keywords: ["ภาษากายสัตว์เลี้ยง", "แมวเครียด", "สุนัขเครียด", "ย้ายบ้าน"],
  },
  {
    id: "read-pet-food-label",
    topic: "nutrition",
    animals: ["cat", "dog"],
    lifeStages: ["baby", "adult", "senior"],
    situations: ["health-vaccine"],
    readMin: 6,
    updated: "2026-06-09",
    author: "Whiskora Editorial",
    title: "อ่านฉลากอาหารสัตว์เลี้ยงอย่างไรให้เลือกได้เหมาะกับวัยและน้ำหนัก",
    answer:
      "ดูชนิดสัตว์ ช่วงวัย พลังงานต่อหน่วย ส่วนผสมหลัก วิธีให้อาหาร และคำเตือนสำหรับสัตว์ที่มีเงื่อนไขสุขภาพเฉพาะ",
    summary:
      "คู่มืออ่านฉลากอาหารแบบใช้งานจริง ก่อนต่อยอดไปสู่การคำนวณปริมาณอาหารและการควบคุมน้ำหนัก",
    keywords: ["อ่านฉลากอาหารสัตว์", "อาหารแมว", "อาหารสุนัข", "โภชนาการ"],
  },
  {
    id: "scottish-fold-health-breed",
    topic: "breed",
    animals: ["cat"],
    lifeStages: ["baby", "adult"],
    situations: ["choose-breeder", "health-vaccine"],
    readMin: 7,
    updated: "2026-06-08",
    author: "Whiskora Breeder Desk",
    featured: true,
    title: "Scottish Fold เหมาะกับใคร และมีเรื่องสุขภาพอะไรที่ควรรู้ก่อนรับเลี้ยง",
    answer:
      "ควรดูประวัติพ่อแม่พันธุ์ เอกสารสุขภาพ การตรวจจากสัตวแพทย์ และเข้าใจความเสี่ยงทางพันธุกรรมก่อนตัดสินใจ",
    summary:
      "อธิบายบุคลิก การดูแล และความเสี่ยงที่ควรคุยกับฟาร์มอย่างโปร่งใส โดยไม่ตัดสินว่าสายพันธุ์ไหนดีกว่า",
    keywords: ["Scottish Fold", "สายพันธุ์แมว", "เลือกฟาร์มแมว", "pedigree"],
  },
  {
    id: "breeder-documents-checklist",
    topic: "farm-transparency",
    animals: ["cat", "dog"],
    lifeStages: ["baby"],
    situations: ["choose-breeder", "ownership-transfer", "health-vaccine"],
    readMin: 6,
    updated: "2026-06-06",
    author: "Whiskora Breeder Desk",
    featured: true,
    title: "รับสัตว์จากฟาร์มควรได้เอกสารอะไรบ้างเพื่อความโปร่งใส",
    answer:
      "ควรมีประวัติวัคซีน ประวัติสุขภาพ ข้อมูลพ่อแม่พันธุ์ เอกสารสายพันธุ์ สัญญาซื้อขาย และข้อมูลการส่งต่อเจ้าของ",
    summary:
      "เช็กลิสต์ข้อมูลที่ผู้ซื้อควรถามและฟาร์มควรเตรียม เพื่อช่วยลดความเสี่ยงการหลอกลวงและสร้างมาตรฐานการส่งมอบ",
    keywords: ["เอกสารฟาร์ม", "เลือกฟาร์ม", "Verified Breeder", "รับลูกแมว"],
  },
  {
    id: "digital-pet-id-public-private",
    topic: "pet-id",
    animals: ["cat", "dog", "small-pet", "bird", "exotic"],
    lifeStages: ["baby", "adult", "senior"],
    situations: ["lost-pet", "boarding", "travel", "ownership-transfer"],
    readMin: 5,
    updated: "2026-06-04",
    author: "Whiskora Product Team",
    featured: true,
    title: "QR Pet Profile ควรเปิดข้อมูลอะไรเป็นสาธารณะ และข้อมูลไหนควรเก็บเป็นส่วนตัว",
    answer:
      "ข้อมูลติดต่อฉุกเฉินและข้อมูลพื้นฐานใช้ช่วยตามหาได้ แต่ข้อมูลเจ้าของ เอกสารสำคัญ และประวัติละเอียดควรควบคุมสิทธิ์การเข้าถึง",
    summary:
      "อธิบายแนวคิดความปลอดภัยของ Pet ID, QR Profile และการแชร์ข้อมูลให้คลินิก โรงแรมสัตว์ หรือผู้ดูแลชั่วคราว",
    keywords: ["QR Pet Profile", "Pet ID", "ข้อมูลสัตว์เลี้ยง", "ความเป็นส่วนตัว"],
  },
  {
    id: "pet-travel-and-boarding-info",
    topic: "lifestyle",
    animals: ["cat", "dog"],
    lifeStages: ["adult", "senior"],
    situations: ["travel", "boarding", "grooming"],
    readMin: 5,
    updated: "2026-06-01",
    author: "Whiskora Editorial",
    title: "พาสัตว์เลี้ยงเดินทางหรือฝากเลี้ยง ต้องส่งข้อมูลอะไรให้ผู้ดูแลบ้าง",
    answer:
      "ควรส่งข้อมูลติดต่อฉุกเฉิน อาหาร ยา ประวัติวัคซีน โรคประจำตัว พฤติกรรมเฉพาะ และลิงก์โปรไฟล์สัตว์เลี้ยง",
    summary:
      "คู่มือเตรียมข้อมูลก่อนเดินทาง ฝากเลี้ยง หรือใช้บริการสัตว์เลี้ยง เพื่อให้ผู้ดูแลช่วยน้องได้ถูกต้องและปลอดภัย",
    keywords: ["ฝากเลี้ยงสัตว์", "เดินทางกับสัตว์เลี้ยง", "โรงแรมสัตว์", "Pet Profile"],
  },
  {
    id: "rabbit-safe-food",
    topic: "nutrition",
    animals: ["small-pet"],
    lifeStages: ["baby", "adult"],
    situations: ["new-pet", "health-vaccine"],
    readMin: 4,
    updated: "2026-05-28",
    author: "Whiskora Editorial",
    title: "กระต่ายกินอะไรได้บ้าง อาหารปลอดภัยและอาหารที่ควรหลีกเลี่ยง",
    answer:
      "หญ้าแห้งควรเป็นอาหารหลัก ผักบางชนิดให้ได้แบบพอดี และควรหลีกเลี่ยงอาหารที่กระทบระบบทางเดินอาหาร",
    summary:
      "บทความพื้นฐานสำหรับเจ้าของกระต่ายมือใหม่ เน้นข้อมูลใช้งานจริงและข้อควรระวังที่พบบ่อย",
    keywords: ["อาหารกระต่าย", "กระต่าย", "สัตว์เลี้ยงขนาดเล็ก"],
  },
  {
    id: "reptile-habitat-basics",
    topic: "getting-started",
    animals: ["reptile", "exotic"],
    lifeStages: ["baby", "adult"],
    situations: ["new-pet", "condo"],
    readMin: 6,
    updated: "2026-05-22",
    author: "Whiskora Editorial",
    title: "เริ่มเลี้ยงสัตว์เลื้อยคลานต้องเข้าใจเรื่องอุณหภูมิ แสง และพื้นที่อย่างไร",
    answer:
      "สัตว์เลื้อยคลานต้องมีสภาพแวดล้อมเฉพาะ ทั้งอุณหภูมิ แสง ความชื้น พื้นที่หลบซ่อน และอาหารที่เหมาะกับชนิดสัตว์",
    summary:
      "ภาพรวมสำหรับผู้เริ่มต้นที่สนใจสัตว์เลื้อยคลาน โดยเน้นว่าควรศึกษาข้อมูลชนิดสัตว์ให้ลึกก่อนรับเลี้ยงจริง",
    keywords: ["สัตว์เลื้อยคลาน", "exotic pets", "เริ่มเลี้ยงสัตว์"],
  },
];

export const healthDisclaimer =
  "บทความสุขภาพของ Whiskora เป็นข้อมูลเพื่อการดูแลเบื้องต้น ไม่ใช่การวินิจฉัยโรค หากสัตว์เลี้ยงมีอาการฉุกเฉิน ซึม ไม่กินอาหาร หายใจผิดปกติ บาดเจ็บ หรือมีอาการรุนแรง ควรพบสัตวแพทย์ทันที";

export const popularQuestions = articles
  .filter((article) => article.featured)
  .slice(0, 6)
  .map((article) => ({
    question: article.title,
    answer: article.answer,
  }));
