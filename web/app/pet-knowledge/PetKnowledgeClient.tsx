"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import {
  animalFilters,
  articles,
  healthDisclaimer,
  lifeStageFilters,
  situationFilters,
  topicFilters,
  type AnimalKey,
  type KnowledgeArticle,
  type LifeStageKey,
  type SituationKey,
  type TopicKey,
} from "./articles";

const F = {
  ink: "#241A3A",
  inkSoft: "#574B6E",
  muted: "#81768E",
  pink: "#E84677",
  pinkDeep: "#C72562",
  blush: "#FFF7FA",
  line: "#F3C8D8",
  paper: "#FFFFFF",
};

const Icon = {
  Search: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.2 16.2 4 4" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  ),
  Book: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4.8A2.8 2.8 0 0 1 7.8 2H20v17H7.8A2.8 2.8 0 0 0 5 21.8V4.8Z" />
      <path d="M5 4.8A2.8 2.8 0 0 0 2.2 2H2v17h.2A2.8 2.8 0 0 1 5 21.8" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 20 6v5.7c0 4.8-3.2 7.7-8 9.3-4.8-1.6-8-4.5-8-9.3V6l8-3Z" />
      <path d="m8.8 12 2.1 2.1 4.5-4.8" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 10h16" />
    </svg>
  ),
  Spark: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 9.8 9.8 3 12l6.8 2.2L12 21l2.2-6.8L21 12l-6.8-2.2L12 3Z" />
    </svg>
  ),
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function countArticlesByTopic(topic: TopicKey) {
  if (topic === "all") return articles.length;
  return articles.filter((article) => article.topic === topic).length;
}

function findTopic(topic: TopicKey) {
  return topicFilters.find((item) => item.key === topic) || topicFilters[0];
}

function findAnimal(animal: Exclude<AnimalKey, "all">) {
  return animalFilters.find((item) => item.key === animal)?.label || animal;
}

function findStage(stage: Exclude<LifeStageKey, "all">) {
  return lifeStageFilters.find((item) => item.key === stage)?.label || stage;
}

function findSituation(situation: Exclude<SituationKey, "all">) {
  return situationFilters.find((item) => item.key === situation)?.label || situation;
}

function matchesSearch(article: KnowledgeArticle, search: string) {
  if (!search.trim()) return true;
  const q = search.trim().toLowerCase();
  const searchable = [
    article.title,
    article.summary,
    article.answer,
    article.author,
    ...article.keywords,
    findTopic(article.topic).label,
    ...article.animals.map(findAnimal),
    ...article.lifeStages.map(findStage),
    ...article.situations.map(findSituation),
  ]
    .join(" ")
    .toLowerCase();
  return searchable.includes(q);
}

export default function PetKnowledgeClient() {
  const [topic, setTopic] = useState<TopicKey>("all");
  const [animal, setAnimal] = useState<AnimalKey>("all");
  const [lifeStage, setLifeStage] = useState<LifeStageKey>("all");
  const [situation, setSituation] = useState<SituationKey>("all");
  const [search, setSearch] = useState("");

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (topic !== "all" && article.topic !== topic) return false;
      if (animal !== "all" && !article.animals.includes(animal)) return false;
      if (lifeStage !== "all" && !article.lifeStages.includes(lifeStage)) return false;
      if (situation !== "all" && !article.situations.includes(situation)) return false;
      return matchesSearch(article, search);
    });
  }, [animal, lifeStage, search, situation, topic]);

  const featuredArticles = filteredArticles.filter((article) => article.featured).slice(0, 3);
  const regularArticles = filteredArticles.filter((article) => !article.featured || !featuredArticles.includes(article));
  const hasActiveFilters =
    topic !== "all" || animal !== "all" || lifeStage !== "all" || situation !== "all" || Boolean(search.trim());

  const resetFilters = () => {
    setTopic("all");
    setAnimal("all");
    setLifeStage("all");
    setSituation("all");
    setSearch("");
  };

  return (
    <>
      <style>{`
        .knowledge-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 14% 0%, rgba(255, 221, 232, 0.62), transparent 34%),
            linear-gradient(180deg, #fffafd 0%, #ffffff 44%, #fff7fa 100%);
          color: ${F.ink};
          font-family: var(--font-ui), inherit;
        }

        .knowledge-shell {
          width: min(1180px, calc(100vw - 32px));
          margin: 0 auto;
          padding: 34px 0 90px;
        }

        .knowledge-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
          gap: 24px;
          align-items: stretch;
          margin-bottom: 28px;
        }

        .hero-copy {
          padding: 22px 0 8px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 7px 13px;
          border: 1px solid ${F.line};
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.86);
          color: ${F.pinkDeep};
          font-size: 12px;
          font-weight: 800;
        }

        .eyebrow svg,
        .hero-metric svg,
        .input-icon svg,
        .article-meta svg,
        .care-note svg,
        .cta-link svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          flex: 0 0 auto;
        }

        .hero-copy h1 {
          margin: 18px 0 14px;
          max-width: 760px;
          font-size: clamp(34px, 5.2vw, 64px);
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: 0;
        }

        .hero-copy h1 span {
          color: ${F.pink};
        }

        .hero-copy p {
          max-width: 720px;
          margin: 0;
          color: ${F.inkSoft};
          font-size: 17px;
          line-height: 1.85;
          font-weight: 500;
        }

        .hero-panel {
          border: 1px solid ${F.line};
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.9);
          padding: 20px;
          box-shadow: 0 18px 50px rgba(232, 70, 119, 0.11);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .hero-panel-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: ${F.pinkDeep};
          font-size: 13px;
          font-weight: 800;
        }

        .hero-panel p {
          margin: 8px 0 0;
          color: ${F.inkSoft};
          font-size: 14px;
          line-height: 1.7;
          font-weight: 500;
        }

        .hero-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .hero-metric {
          border: 1px solid #f5d3df;
          border-radius: 8px;
          padding: 12px;
          background: #fffafd;
        }

        .hero-metric strong {
          display: block;
          color: ${F.ink};
          font-size: 20px;
          line-height: 1;
          margin-bottom: 4px;
        }

        .hero-metric span {
          color: ${F.muted};
          font-size: 11px;
          font-weight: 700;
        }

        .search-band {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          margin: 8px 0 28px;
        }

        .search-field {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: ${F.pink};
          display: inline-flex;
        }

        .search-field input {
          width: 100%;
          min-height: 56px;
          border: 1px solid ${F.line};
          border-radius: 8px;
          background: ${F.paper};
          color: ${F.ink};
          font: inherit;
          font-size: 15px;
          font-weight: 600;
          outline: none;
          padding: 0 18px 0 48px;
          box-shadow: 0 12px 32px rgba(232, 70, 119, 0.08);
        }

        .search-field input:focus {
          border-color: ${F.pink};
          box-shadow: 0 0 0 4px rgba(232, 70, 119, 0.1);
        }

        .reset-btn {
          min-height: 56px;
          border: 1px solid ${F.line};
          border-radius: 8px;
          background: ${F.paper};
          color: ${F.inkSoft};
          padding: 0 18px;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .reset-btn:disabled {
          cursor: default;
          opacity: 0.45;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin: 28px 0 14px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 22px;
          line-height: 1.25;
          font-weight: 800;
          letter-spacing: 0;
        }

        .section-heading p {
          margin: 5px 0 0;
          color: ${F.muted};
          font-size: 13px;
          line-height: 1.6;
          font-weight: 600;
        }

        .result-count {
          color: ${F.pinkDeep};
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .topic-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .topic-card {
          min-height: 168px;
          border: 1px solid ${F.line};
          border-radius: 8px;
          background: ${F.paper};
          text-align: left;
          padding: 16px;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
          font: inherit;
          color: ${F.ink};
        }

        .topic-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(36, 26, 58, 0.08);
        }

        .topic-card.is-active {
          border-color: var(--topic-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--topic-accent) 14%, transparent);
        }

        .topic-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: var(--topic-bg);
          color: var(--topic-accent);
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .topic-card h3 {
          margin: 0 0 8px;
          font-size: 15px;
          line-height: 1.35;
          font-weight: 800;
          letter-spacing: 0;
        }

        .topic-card p {
          margin: 0;
          color: ${F.inkSoft};
          font-size: 12px;
          line-height: 1.6;
          font-weight: 500;
        }

        .topic-count {
          display: block;
          margin-top: 12px;
          color: var(--topic-accent);
          font-size: 12px;
          font-weight: 800;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 1fr;
          gap: 12px;
          align-items: start;
          min-width: 0;
        }

        .filter-group {
          border: 1px solid ${F.line};
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.82);
          padding: 14px;
          min-width: 0;
          overflow: hidden;
        }

        .filter-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          color: ${F.ink};
          font-size: 13px;
          font-weight: 900;
        }

        .filter-title svg {
          width: 15px;
          height: 15px;
          fill: none;
          stroke: ${F.pink};
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          max-width: 100%;
          min-width: 0;
        }

        .chip {
          border: 1px solid #ead8df;
          border-radius: 999px;
          background: ${F.paper};
          color: ${F.inkSoft};
          min-height: 34px;
          padding: 7px 12px;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .chip.is-active {
          border-color: ${F.pink};
          background: ${F.pink};
          color: white;
        }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 310px;
          gap: 22px;
          align-items: start;
          margin-top: 22px;
        }

        .article-stack {
          display: grid;
          gap: 12px;
        }

        .featured-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .article-card {
          border: 1px solid ${F.line};
          border-radius: 8px;
          background: ${F.paper};
          padding: 18px;
          box-shadow: 0 14px 36px rgba(36, 26, 58, 0.06);
        }

        .article-card.is-featured {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background:
            linear-gradient(180deg, rgba(255, 241, 246, 0.86), rgba(255, 255, 255, 0.96));
        }

        .article-kicker {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 12px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          min-height: 25px;
          border-radius: 999px;
          padding: 4px 9px;
          background: #fff1f6;
          color: ${F.pinkDeep};
          font-size: 11px;
          font-weight: 850;
        }

        .tag.is-muted {
          background: #f7f3f6;
          color: ${F.muted};
        }

        .article-card h3 {
          margin: 0 0 10px;
          color: ${F.ink};
          font-size: 19px;
          line-height: 1.45;
          font-weight: 850;
          letter-spacing: 0;
        }

        .article-card:not(.is-featured) h3 {
          font-size: 17px;
        }

        .article-card p {
          margin: 0;
          color: ${F.inkSoft};
          font-size: 14px;
          line-height: 1.75;
          font-weight: 500;
        }

        .answer-box {
          margin-top: 14px;
          border-left: 3px solid ${F.pink};
          padding-left: 12px;
          color: ${F.ink};
          font-size: 13px;
          line-height: 1.65;
          font-weight: 700;
        }

        .article-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-top: 16px;
          color: ${F.muted};
          font-size: 12px;
          font-weight: 800;
        }

        .article-meta span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .side-stack {
          display: grid;
          gap: 12px;
          position: sticky;
          top: 16px;
        }

        .side-card {
          border: 1px solid ${F.line};
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.9);
          padding: 18px;
        }

        .side-card h3 {
          margin: 0 0 10px;
          color: ${F.ink};
          font-size: 16px;
          font-weight: 850;
        }

        .side-card p,
        .side-card li {
          color: ${F.inkSoft};
          font-size: 13px;
          line-height: 1.7;
          font-weight: 600;
        }

        .side-card ul {
          margin: 0;
          padding-left: 18px;
        }

        .care-note {
          display: flex;
          gap: 10px;
          color: #7f1d1d;
          background: #fff7ed;
          border-color: #fed7aa;
        }

        .care-note svg {
          color: #c2410c;
          margin-top: 2px;
        }

        .cta-card {
          background: ${F.ink};
          color: white;
          border-color: ${F.ink};
        }

        .cta-card h3,
        .cta-card p {
          color: white;
        }

        .cta-card p {
          opacity: 0.78;
        }

        .cta-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          min-height: 40px;
          border-radius: 999px;
          background: ${F.pink};
          color: white;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
        }

        .empty-state {
          border: 1px dashed ${F.line};
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.72);
          padding: 40px 18px;
          text-align: center;
        }

        .empty-state h3 {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 850;
        }

        .empty-state p {
          max-width: 520px;
          margin: 0 auto;
          color: ${F.inkSoft};
          font-size: 14px;
          line-height: 1.7;
        }

        @media (max-width: 980px) {
          .knowledge-hero,
          .content-grid,
          .filter-grid {
            grid-template-columns: 1fr;
          }

          .topic-grid,
          .featured-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .side-stack {
            position: static;
          }
        }

        @media (max-width: 640px) {
          .knowledge-shell {
            width: min(100vw - 24px, 1180px);
            padding-top: 18px;
          }

          .hero-copy {
            padding-top: 8px;
          }

          .hero-copy h1 {
            font-size: 36px;
          }

          .hero-copy p {
            font-size: 15px;
            line-height: 1.75;
          }

          .hero-metrics,
          .search-band,
          .topic-grid,
          .featured-grid {
            grid-template-columns: 1fr;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
          }

          .topic-card {
            min-height: auto;
          }

          .filter-group {
            padding: 12px;
          }

          .chip-row {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 3px;
            scrollbar-width: none;
          }

          .chip-row::-webkit-scrollbar {
            display: none;
          }

          .chip {
            flex: 0 0 auto;
          }

          .article-card {
            padding: 15px;
          }

          .article-card h3 {
            font-size: 17px;
          }
        }
      `}</style>

      <main className="knowledge-page">
        <div className="knowledge-shell">
          <section className="knowledge-hero" aria-labelledby="knowledge-title">
            <div className="hero-copy">
              <div className="eyebrow">
                <Icon.Book />
                Whiskora Knowledge Hub
              </div>
              <h1 id="knowledge-title">
                คลังความรู้สัตว์เลี้ยงที่เชื่อมกับ <span>การดูแลจริง</span>
              </h1>
              <p>
                รวมบทความสำหรับเจ้าของสัตว์เลี้ยง ฟาร์ม และผู้ให้บริการ ตั้งแต่ก่อนรับน้องเข้าบ้าน
                สุขภาพ วัคซีน พฤติกรรม โภชนาการ สายพันธุ์ ไปจนถึง Pet ID และการส่งต่อข้อมูลอย่างปลอดภัย
              </p>
            </div>

            <aside className="hero-panel" aria-label="Knowledge hub overview">
              <div>
                <div className="hero-panel-title">
                  <Icon.Spark />
                  จัดหมวดให้ค้นเจอคำตอบได้เร็ว เชื่อมกับการดูแลจริง
                </div>
                <p>
                  บทความถูกจัดด้วยหัวข้อ ชนิดสัตว์ ช่วงวัย และสถานการณ์ เพื่อให้คนอ่านเจอคำตอบได้จากหลายเส้นทาง
                  และช่วยให้ Whiskora เติบโตเป็นศูนย์กลางข้อมูลสัตว์เลี้ยงระยะยาว
                </p>
              </div>
              <div className="hero-metrics">
                <div className="hero-metric">
                  <strong>8</strong>
                  <span>หมวดหลัก</span>
                </div>
                <div className="hero-metric">
                  <strong>4</strong>
                  <span>มิติการค้นหา</span>
                </div>
                <div className="hero-metric">
                  <strong>{articles.length}</strong>
                  <span>บทความเริ่มต้น</span>
                </div>
              </div>
            </aside>
          </section>

          <section className="search-band" aria-label="ค้นหาบทความ">
            <div className="search-field">
              <span className="input-icon">
                <Icon.Search />
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหา เช่น รับลูกแมว วัคซีน เลือกฟาร์ม Pet ID ฝากเลี้ยง"
              />
            </div>
            <button className="reset-btn" type="button" onClick={resetFilters} disabled={!hasActiveFilters}>
              ล้างตัวกรอง
            </button>
          </section>

          <section aria-labelledby="topic-filter-title">
            <div className="section-heading">
              <div>
                <h2 id="topic-filter-title">เลือกตามหัวข้อ</h2>
                <p>หมวดหลักถูกวางตามเส้นทางชีวิตของเจ้าของสัตว์เลี้ยง ตั้งแต่เริ่มเลี้ยงไปจนถึงการดูแลต่อเนื่อง</p>
              </div>
              <div className="result-count">พบ {filteredArticles.length} บทความ</div>
            </div>

            <div className="topic-grid">
              {topicFilters.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  className={`topic-card ${topic === item.key ? "is-active" : ""}`}
                  style={
                    {
                      "--topic-accent": item.accent,
                      "--topic-bg": item.bg,
                    } as CSSProperties
                  }
                  onClick={() => setTopic(item.key)}
                >
                  <span className="topic-index">{item.key === "all" ? "All" : String(index).padStart(2, "0")}</span>
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                  <span className="topic-count">{countArticlesByTopic(item.key)} บทความ</span>
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="advanced-filter-title">
            <div className="section-heading">
              <div>
                <h2 id="advanced-filter-title">ค้นหาแบบเจาะจง</h2>
                <p>บทความเดียวกันเข้าถึงได้หลายเส้นทาง เช่น แมว ลูกสัตว์ และเพิ่งรับมาใหม่</p>
              </div>
            </div>

            <div className="filter-grid">
              <div className="filter-group">
                <div className="filter-title">
                  <Icon.Filter />
                  เลือกตามชนิดสัตว์
                </div>
                <div className="chip-row">
                  {animalFilters.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`chip ${animal === item.key ? "is-active" : ""}`}
                      onClick={() => setAnimal(item.key)}
                      title={item.description}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-title">
                  <Icon.Filter />
                  เลือกตามช่วงวัย
                </div>
                <div className="chip-row">
                  {lifeStageFilters.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`chip ${lifeStage === item.key ? "is-active" : ""}`}
                      onClick={() => setLifeStage(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-title">
                  <Icon.Filter />
                  เลือกตามสถานการณ์
                </div>
                <div className="chip-row">
                  {situationFilters.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`chip ${situation === item.key ? "is-active" : ""}`}
                      onClick={() => setSituation(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="content-grid" aria-labelledby="article-list-title">
            <div>
              <div className="section-heading">
                <div>
                  <h2 id="article-list-title">บทความแนะนำ</h2>
                  <p>เนื้อหาเริ่มต้นสำหรับทำให้ Whiskora เป็นฐานความรู้ที่ใช้ได้จริงและต่อยอดไปยังฟีเจอร์ของระบบ</p>
                </div>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="empty-state">
                  <h3>ยังไม่พบบทความที่ตรงกับตัวกรองนี้</h3>
                  <p>ลองล้างตัวกรอง หรือเลือกชนิดสัตว์และสถานการณ์ที่กว้างขึ้นเพื่อดูบทความที่เกี่ยวข้อง</p>
                </div>
              ) : (
                <>
                  {featuredArticles.length > 0 && (
                    <div className="featured-grid">
                      {featuredArticles.map((article) => (
                        <ArticleCard key={article.id} article={article} featured />
                      ))}
                    </div>
                  )}

                  <div className="article-stack">
                    {regularArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <aside className="side-stack" aria-label="ข้อมูลประกอบ">
              <div className="side-card care-note">
                <Icon.Shield />
                <div>
                  <h3>หมายเหตุด้านสุขภาพ</h3>
                  <p>{healthDisclaimer}</p>
                </div>
              </div>

              <div className="side-card">
                <h3>คำถามที่ควรตอบให้ได้</h3>
                <ul>
                  <li>รับสัตว์เข้าบ้านต้องเตรียมอะไร</li>
                  <li>วัคซีนและประวัติสุขภาพควรเก็บข้อมูลอะไร</li>
                  <li>เลือกฟาร์มอย่างไรให้ตรวจสอบได้</li>
                  <li>Pet ID และ QR Profile ควรเปิดข้อมูลแค่ไหน</li>
                </ul>
              </div>

              <div className="side-card cta-card">
                <h3>เริ่มจากโปรไฟล์ของน้อง</h3>
                <p>เมื่ออ่านบทความเตรียมตัวแล้ว เจ้าของสามารถสร้าง Pet ID เพื่อเก็บข้อมูลพื้นฐาน วัคซีน และ QR Profile ได้ต่อทันที</p>
                <Link className="cta-link" href="/pet-id-card">
                  ไปที่ Pet ID
                  <Icon.ArrowRight />
                </Link>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </>
  );
}

function ArticleCard({ article, featured = false }: { article: KnowledgeArticle; featured?: boolean }) {
  const topic = findTopic(article.topic);

  return (
    <article className={`article-card ${featured ? "is-featured" : ""}`}>
      <div>
        <div className="article-kicker">
          <span className="tag" style={{ background: topic.bg, color: topic.accent }}>
            {topic.shortLabel}
          </span>
          {article.animals.slice(0, 2).map((item) => (
            <span className="tag is-muted" key={item}>
              {findAnimal(item)}
            </span>
          ))}
          {article.animals.length > 2 && <span className="tag is-muted">+{article.animals.length - 2}</span>}
        </div>

        <h3>{article.title}</h3>
        <p>{article.summary}</p>
        <div className="answer-box">{article.answer}</div>
      </div>

      <div className="article-meta">
        <span>
          <Icon.Clock />
          อ่าน {article.readMin} นาที
        </span>
        <span>
          <Icon.Calendar />
          อัปเดต {formatDate(article.updated)}
        </span>
      </div>
    </article>
  );
}
