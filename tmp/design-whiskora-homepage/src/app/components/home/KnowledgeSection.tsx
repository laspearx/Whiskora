import { motion } from "motion/react";
import { ArrowRight, Clock } from "lucide-react";
import { W, IMG } from "../../homeConstants";

const FEATURED = {
  tag: "สุขภาพ",
  title: "วิธีดูแลสุขภาพฟันของแมวให้ถูกต้อง ป้องกันปัญหาที่มักถูกมองข้าม",
  excerpt: "ปัญหาฟันของแมวเป็นปัญหาที่พบบ่อยแต่เจ้าของมักไม่ทราบ การดูแลสุขภาพช่องปากตั้งแต่อายุยังน้อยช่วยลดความเสี่ยงโรคเหงือกและการสูญเสียฟัน...",
  readTime: "5 นาที",
  img: IMG.tabbyCat,
  author: "Dr. สมหญิง",
};

const ARTICLES = [
  {
    tag: "โภชนาการ",
    title: "อาหารสุนัขที่ดีที่สุดในปี 2024 ตามคำแนะนำสัตวแพทย์",
    img: IMG.goldenPuppy,
    readTime: "4 นาที",
  },
  {
    tag: "พฤติกรรม",
    title: "ทำความเข้าใจภาษากาย: สัญญาณที่แมวส่งให้คุณทุกวัน",
    img: IMG.catCouch,
    readTime: "6 นาที",
  },
  {
    tag: "สายพันธุ์",
    title: "Scottish Fold: สายพันธุ์แมวยอดนิยมที่ควรรู้ก่อนเลี้ยง",
    img: IMG.whitePersian,
    readTime: "7 นาที",
  },
];

export function KnowledgeSection() {
  return (
    <section id="knowledge" style={{ background: W.cream, padding: "clamp(64px,10vw,120px) 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(20px,4vw,48px)" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 56, flexWrap: "wrap", gap: 24,
          }}
        >
          <div>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: W.pink, textTransform: "uppercase" }}>
              Knowledge Center
            </span>
            <h2 style={{
              fontSize: "clamp(2.2rem, 3.5vw, 4rem)",
              fontWeight: 800, color: W.ink,
              marginTop: 12, lineHeight: 1.1, letterSpacing: "-0.035em",
            }}>
              ความรู้สัตว์เลี้ยง<br />
              <span style={{ color: W.pink }}>จากผู้เชี่ยวชาญ</span>
            </h2>
          </div>
          <a href="#" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: "0.9rem", fontWeight: 700, color: W.pink,
            textDecoration: "none", borderBottom: `1.5px solid ${W.pink}`,
            paddingBottom: 3, fontFamily: "'Prompt', sans-serif",
          }}>
            อ่านทั้งหมด <ArrowRight size={16} />
          </a>
        </motion.div>

        {/* Magazine layout: featured + 3 small */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ alignItems: "start" }}
        >
          {/* Featured article */}
          <motion.a
            href="#"
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: W.ease }}
            viewport={{ once: true }}
            style={{
              background: W.white,
              borderRadius: 28,
              overflow: "hidden",
              boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
              border: `1px solid ${W.border}`,
              textDecoration: "none",
              display: "block",
            }}
          >
            <div style={{ position: "relative", height: 300, overflow: "hidden" }}>
              <motion.img
                src={FEATURED.img}
                alt={FEATURED.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.6 }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
              }} />
              <div style={{
                position: "absolute", top: 16, left: 16,
                background: W.pink, borderRadius: 20, padding: "4px 12px",
                fontSize: "0.68rem", fontWeight: 700, color: W.white,
              }}>
                {FEATURED.tag}
              </div>
            </div>
            <div style={{ padding: "28px 28px 32px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: W.ink, lineHeight: 1.35, marginBottom: 12 }}>
                {FEATURED.title}
              </h3>
              <p style={{ fontSize: "0.85rem", color: W.muted, lineHeight: 1.7, marginBottom: 20 }}>
                {FEATURED.excerpt}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: W.muted }}>
                  <Clock size={13} />
                  {FEATURED.readTime}
                </div>
                <span style={{
                  fontSize: "0.78rem", fontWeight: 700, color: W.pink,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  อ่านบทความ <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </motion.a>

          {/* 3 small articles */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {ARTICLES.map(({ tag, title, img, readTime }, i) => (
              <motion.a
                key={title}
                href="#"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: W.ease }}
                viewport={{ once: true }}
                style={{
                  background: W.white,
                  borderRadius: 20,
                  overflow: "hidden",
                  border: `1px solid ${W.border}`,
                  textDecoration: "none",
                  display: "flex",
                  boxShadow: "0 2px 20px rgba(0,0,0,0.05)",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 32px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "none";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 20px rgba(0,0,0,0.05)";
                }}
              >
                <div style={{ flex: "0 0 120px", overflow: "hidden" }}>
                  <img
                    src={img}
                    alt={title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{
                      display: "inline-block",
                      background: W.pinkBg, color: W.pink,
                      fontSize: "0.62rem", fontWeight: 700,
                      padding: "3px 10px", borderRadius: 20, marginBottom: 8,
                    }}>
                      {tag}
                    </div>
                    <h3 style={{ fontSize: "0.88rem", fontWeight: 700, color: W.ink, lineHeight: 1.45 }}>
                      {title}
                    </h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: W.muted, marginTop: 10 }}>
                    <Clock size={11} />
                    {readTime}
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
