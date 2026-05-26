"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#E5E7EB', paper: '#FFFFFF',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Clock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

type AnimalType = 'all' | 'cat' | 'dog' | 'exotic';
type SubCategory = 'all' | 'health' | 'nutrition' | 'behavior' | 'genetics';

const ANIMALS: { key: AnimalType; label: string; emoji: string }[] = [
  { key: 'all', label: 'ทั้งหมด', emoji: '🐾' },
  { key: 'cat', label: 'แมว', emoji: '🐱' },
  { key: 'dog', label: 'หมา', emoji: '🐶' },
  { key: 'exotic', label: 'สัตว์ Exotic', emoji: '🦎' },
];

const SUBCATS: { key: SubCategory; label: string; color: string; bg: string }[] = [
  { key: 'all', label: 'ทุกหมวด', color: F.ink, bg: '#F3F4F6' },
  { key: 'health', label: 'สุขภาพ', color: '#DC2626', bg: '#FEF2F2' },
  { key: 'nutrition', label: 'โภชนาการ', color: '#16A34A', bg: '#F0FDF4' },
  { key: 'behavior', label: 'พฤติกรรม', color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'genetics', label: 'พันธุกรรม', color: '#0369A1', bg: '#F0F9FF' },
];

interface Article {
  id: number;
  title: string;
  summary: string;
  animal: AnimalType;
  subcat: SubCategory;
  readMin: number;
  emoji: string;
  tag: string;
}

const ARTICLES: Article[] = [
  {
    id: 1, animal: 'cat', subcat: 'health', readMin: 5, emoji: '💉',
    tag: 'สุขภาพ',
    title: 'วัคซีนแมวที่จำเป็น 5 ชนิด ที่ทุกบ้านต้องรู้',
    summary: 'รู้จักวัคซีนหลักสำหรับแมว ตั้งแต่อายุเท่าไหร่ควรฉีด และทำไมถึงสำคัญ',
  },
  {
    id: 2, animal: 'cat', subcat: 'nutrition', readMin: 4, emoji: '🍗',
    tag: 'โภชนาการ',
    title: 'อาหารแมวแบบไหนดีที่สุด? เปรียบเทียบ Dry vs Wet Food',
    summary: 'ข้อดีข้อเสียของอาหารแมวแบบเม็ดและแบบเปียก และวิธีเลือกให้เหมาะกับน้อง',
  },
  {
    id: 3, animal: 'cat', subcat: 'behavior', readMin: 3, emoji: '🧶',
    tag: 'พฤติกรรม',
    title: 'ทำไมแมวชอบนอนในกล่อง? เข้าใจพฤติกรรมการหาพื้นที่ปลอดภัย',
    summary: 'อธิบายเหตุผลเบื้องหลังพฤติกรรมแปลกๆ ของแมวที่เจ้าของทุกคนต้องเจอ',
  },
  {
    id: 4, animal: 'cat', subcat: 'genetics', readMin: 6, emoji: '🧬',
    tag: 'พันธุกรรม',
    title: 'Scottish Fold โรคทางพันธุกรรมที่นักเพาะต้องระวัง',
    summary: 'ทำความเข้าใจกับ Osteochondrodysplasia และผลกระทบต่อสุขภาพแมว Scottish Fold',
  },
  {
    id: 5, animal: 'dog', subcat: 'health', readMin: 5, emoji: '🦷',
    tag: 'สุขภาพ',
    title: 'ดูแลฟันหมา ป้องกันโรคเหงือกก่อนลุกลาม',
    summary: 'วิธีแปรงฟันหมาที่ถูกวิธี อาหารที่ช่วยทำความสะอาดฟัน และสัญญาณอันตรายที่ต้องพาไปหาหมอ',
  },
  {
    id: 6, animal: 'dog', subcat: 'nutrition', readMin: 4, emoji: '🥩',
    tag: 'โภชนาการ',
    title: 'อาหาร Raw Diet สำหรับสุนัข ดีจริงหรือแค่กระแส?',
    summary: 'วิเคราะห์อาหารดิบสำหรับสุนัข ข้อดี ข้อเสีย และสิ่งที่ต้องระวังหากจะเริ่มต้น',
  },
  {
    id: 7, animal: 'dog', subcat: 'behavior', readMin: 5, emoji: '🎓',
    tag: 'พฤติกรรม',
    title: 'เทคนิค Positive Reinforcement ฝึกสุนัขอย่างมีประสิทธิภาพ',
    summary: 'หลักการฝึกหมาโดยไม่ใช้การลงโทษ ที่ผู้เชี่ยวชาญแนะนำทั่วโลก',
  },
  {
    id: 8, animal: 'dog', subcat: 'genetics', readMin: 7, emoji: '🧬',
    tag: 'พันธุกรรม',
    title: 'โรค Hip Dysplasia ในสุนัขพันธุ์ใหญ่ ป้องกันได้ถ้ารู้ทัน',
    summary: 'ทำความเข้าใจปัจจัยทางพันธุกรรมและสิ่งแวดล้อมที่ส่งผลต่อข้อสะโพกในสุนัขพันธุ์ใหญ่',
  },
  {
    id: 9, animal: 'exotic', subcat: 'health', readMin: 5, emoji: '🦜',
    tag: 'สุขภาพ',
    title: 'เลี้ยงนกแก้วอย่างไรให้ไม่ป่วยบ่อย',
    summary: 'สภาพแวดล้อม อาหาร และสัญญาณเตือนที่บอกว่านกแก้วของคุณกำลังป่วย',
  },
  {
    id: 10, animal: 'exotic', subcat: 'nutrition', readMin: 4, emoji: '🐇',
    tag: 'โภชนาการ',
    title: 'กระต่ายกินอะไรได้บ้าง? ผักผลไม้ที่อันตรายที่เจ้าของมักไม่รู้',
    summary: 'รายการอาหารที่ปลอดภัยและอันตรายสำหรับกระต่าย พร้อมสัดส่วนอาหารที่เหมาะสม',
  },
  {
    id: 11, animal: 'exotic', subcat: 'behavior', readMin: 4, emoji: '🦔',
    tag: 'พฤติกรรม',
    title: 'เข้าใจภาษากายเม่นแคระ อ่านความรู้สึกน้องผ่านหนามและเสียง',
    summary: 'คู่มือถอดรหัสพฤติกรรมเม่นแคระสำหรับเจ้าของมือใหม่ที่อยากผูกพันกับน้อง',
  },
  {
    id: 12, animal: 'exotic', subcat: 'genetics', readMin: 6, emoji: '🦎',
    tag: 'พันธุกรรม',
    title: 'Morph ของ Leopard Gecko มีกี่แบบ และเลือกซื้ออย่างไรอย่างรับผิดชอบ',
    summary: 'อธิบาย genetic morphs ของกิ้งก่าและความเสี่ยงทางพันธุกรรมที่ผู้เพาะต้องรู้',
  },
];

const SUB_COLORS: Record<SubCategory, { color: string; bg: string }> = {
  all: { color: F.ink, bg: '#F3F4F6' },
  health: { color: '#DC2626', bg: '#FEF2F2' },
  nutrition: { color: '#16A34A', bg: '#F0FDF4' },
  behavior: { color: '#7C3AED', bg: '#F5F3FF' },
  genetics: { color: '#0369A1', bg: '#F0F9FF' },
};

export default function PetKnowledgePage() {
  const router = useRouter();
  const [animal, setAnimal] = useState<AnimalType>('all');
  const [subcat, setSubcat] = useState<SubCategory>('all');
  const [search, setSearch] = useState('');

  const filtered = ARTICLES.filter(a => {
    if (animal !== 'all' && a.animal !== animal) return false;
    if (subcat !== 'all' && a.subcat !== subcat) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.summary.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <style>{`
        .kb-page { font-family: inherit; min-height: 100vh; background: #FFFAFC; }
        .kb-wrap { max-width: 680px; margin: 0 auto; padding: 24px 20px 80px; }

        .kb-topbar { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .kb-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .kb-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .kb-head h1 { font-size: 22px; font-weight: 800; color: ${F.ink}; }
        .kb-head p { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.1em; }

        /* search */
        .kb-search { position: relative; margin-bottom: 18px; }
        .kb-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: ${F.muted}; pointer-events: none; }
        .kb-search input { width: 100%; background: white; border: 1.5px solid ${F.line}; border-radius: 14px; padding: 12px 14px 12px 40px; font-size: 14px; font-family: inherit; color: ${F.ink}; outline: none; transition: border-color .18s; }
        .kb-search input:focus { border-color: #FBCFE8; }
        .kb-search input::placeholder { color: ${F.muted}; }

        /* animal tabs */
        .kb-animal-tabs { display: flex; gap: 8px; margin-bottom: 14px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .kb-animal-tabs::-webkit-scrollbar { display: none; }
        .kb-animal-tab { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; cursor: pointer; border: 2px solid transparent; white-space: nowrap; transition: all .18s; font-family: inherit; }
        .kb-animal-tab.active { background: ${F.pink}; color: white; }
        .kb-animal-tab.inactive { background: white; color: ${F.inkSoft}; border-color: ${F.line}; }
        .kb-animal-tab.inactive:hover { border-color: #FBCFE8; color: ${F.pink}; }

        /* subcat pills */
        .kb-subcats { display: flex; gap: 8px; margin-bottom: 22px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .kb-subcats::-webkit-scrollbar { display: none; }
        .kb-subcat { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1.5px solid transparent; white-space: nowrap; transition: all .18s; font-family: inherit; }

        /* count */
        .kb-count { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-bottom: 14px; }

        /* article list */
        .kb-articles { display: flex; flex-direction: column; gap: 12px; }
        .kb-article { background: white; border: 1.5px solid ${F.line}; border-radius: 18px; padding: 16px 18px; cursor: pointer; transition: all .18s; display: flex; gap: 14px; align-items: flex-start; }
        .kb-article:hover { border-color: #FBCFE8; transform: translateX(3px); box-shadow: 0 4px 12px rgba(232,70,119,0.08); }
        .kb-article-emoji { font-size: 28px; flex-shrink: 0; width: 46px; height: 46px; background: ${F.pinkSoft}; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .kb-article-body { flex: 1; min-width: 0; }
        .kb-article-tags { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
        .kb-article-tag { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
        .kb-article-title { font-size: 14px; font-weight: 800; color: ${F.ink}; line-height: 1.4; margin-bottom: 5px; }
        .kb-article-summary { font-size: 12px; font-weight: 500; color: ${F.inkSoft}; line-height: 1.5; }
        .kb-article-meta { display: flex; align-items: center; gap: 4px; margin-top: 8px; color: ${F.muted}; font-size: 11px; font-weight: 600; }
        .kb-article-arrow { margin-left: auto; color: ${F.muted}; flex-shrink: 0; margin-top: 2px; }

        /* empty */
        .kb-empty { text-align: center; padding: 48px 20px; }
        .kb-empty-emoji { font-size: 40px; margin-bottom: 12px; }
        .kb-empty-text { font-size: 14px; color: ${F.muted}; font-weight: 600; }

        @media (max-width: 480px) {
          .kb-wrap { padding: 16px 14px 60px; }
        }
      `}</style>

      <div className="kb-page">
        <div className="kb-wrap">

          <div className="kb-topbar">
            <button onClick={() => router.back()} className="kb-back"><Icon.ArrowLeft /></button>
            <div className="kb-head">
              <h1>Pet Knowledge Base</h1>
              <p>คลังความรู้สัตว์เลี้ยง</p>
            </div>
          </div>

          {/* Search */}
          <div className="kb-search">
            <span className="kb-search-icon"><Icon.Search /></span>
            <input
              placeholder="ค้นหาบทความ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Animal tabs */}
          <div className="kb-animal-tabs">
            {ANIMALS.map(a => (
              <button
                key={a.key}
                className={`kb-animal-tab ${animal === a.key ? 'active' : 'inactive'}`}
                onClick={() => setAnimal(a.key)}
              >
                <span>{a.emoji}</span> {a.label}
              </button>
            ))}
          </div>

          {/* Subcategory pills */}
          <div className="kb-subcats">
            {SUBCATS.map(s => {
              const isActive = subcat === s.key;
              return (
                <button
                  key={s.key}
                  className="kb-subcat"
                  style={{
                    background: isActive ? s.color : s.bg,
                    color: isActive ? 'white' : s.color,
                    borderColor: isActive ? s.color : 'transparent',
                  }}
                  onClick={() => setSubcat(s.key)}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="kb-count">พบ {filtered.length} บทความ</div>

          {/* Articles */}
          <div className="kb-articles">
            {filtered.length === 0 ? (
              <div className="kb-empty">
                <div className="kb-empty-emoji">📭</div>
                <div className="kb-empty-text">ไม่พบบทความที่ค้นหา</div>
              </div>
            ) : filtered.map(a => {
              const sub = SUBCATS.find(s => s.key === a.subcat)!;
              const animalInfo = ANIMALS.find(x => x.key === a.animal)!;
              return (
                <div key={a.id} className="kb-article">
                  <div className="kb-article-emoji">{a.emoji}</div>
                  <div className="kb-article-body">
                    <div className="kb-article-tags">
                      <span
                        className="kb-article-tag"
                        style={{ background: sub.bg, color: sub.color }}
                      >
                        {a.tag}
                      </span>
                      <span
                        className="kb-article-tag"
                        style={{ background: '#F9FAFB', color: F.muted }}
                      >
                        {animalInfo.emoji} {animalInfo.label}
                      </span>
                    </div>
                    <div className="kb-article-title">{a.title}</div>
                    <div className="kb-article-summary">{a.summary}</div>
                    <div className="kb-article-meta">
                      <Icon.Clock /> อ่าน {a.readMin} นาที
                    </div>
                  </div>
                  <div className="kb-article-arrow"><Icon.ChevronRight /></div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}
