import { BookOpen, Wrench, ArrowRight } from "lucide-react";
import { C } from "../constants";

const KNOWLEDGE_TOPICS = ["สุขภาพสัตว์เลี้ยง", "โภชนาการ", "พฤติกรรม", "สายพันธุ์", "การดูแล", "โรคและการรักษา"];
const TOOLS = ["คำนวณอายุ", "คำนวณวันคลอด", "คำนวณแคลอรี", "ตรวจสอบน้ำหนัก", "ตารางวัคซีน", "ปฏิทินสุขภาพ"];

export function KnowledgeTools() {
  return (
    <section style={{ padding: "0 24px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{
            display: "inline-block",
            background: C.yellowLight,
            color: C.yellow,
            fontSize: "0.78rem",
            fontWeight: 600,
            padding: "5px 14px",
            borderRadius: 100,
            marginBottom: 12,
            border: `1px solid ${C.yellow}44`,
          }}>
            📚 ความรู้ & เครื่องมือ
          </span>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: C.ink, marginBottom: 8 }}>
            ทุกอย่างที่คุณต้องการ
          </h2>
          <p style={{ fontSize: "0.92rem", color: C.grayText }}>
            ความรู้และเครื่องมือที่ออกแบบมาเพื่อผู้เลี้ยงสัตว์โดยเฉพาะ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Knowledge card */}
          <div style={{
            background: `linear-gradient(135deg, ${C.yellowLight} 0%, #FFFBF0 100%)`,
            borderRadius: 28,
            padding: "36px",
            border: `1px solid ${C.yellow}33`,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -20, right: -20, width: 160, height: 160,
              background: `radial-gradient(circle, ${C.yellow}22 0%, transparent 70%)`,
              borderRadius: "50%",
            }} />
            <div style={{
              width: 56, height: 56,
              background: C.white,
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 20,
              boxShadow: C.shadow,
            }}>
              <BookOpen size={28} color={C.yellow} />
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: C.ink, marginBottom: 10 }}>
              ความรู้สัตว์เลี้ยง
            </h3>
            <p style={{ fontSize: "0.88rem", color: C.inkMuted, lineHeight: 1.7, marginBottom: 24 }}>
              บทความ คู่มือ และความรู้จากผู้เชี่ยวชาญด้านสัตวแพทย์และผู้เพาะพันธุ์มืออาชีพ
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              {KNOWLEDGE_TOPICS.map((t) => (
                <span key={t} style={{
                  background: C.white,
                  color: C.inkMuted,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: `1px solid ${C.border}`,
                }}>
                  {t}
                </span>
              ))}
            </div>
            <a href="#" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: C.yellow,
              fontWeight: 700,
              fontSize: "0.88rem",
              textDecoration: "none",
              fontFamily: "'Prompt', sans-serif",
            }}>
              อ่านบทความทั้งหมด <ArrowRight size={16} />
            </a>
          </div>

          {/* Tools card */}
          <div style={{
            background: `linear-gradient(135deg, ${C.purpleLight} 0%, #F8F4FE 100%)`,
            borderRadius: 28,
            padding: "36px",
            border: `1px solid ${C.purple}33`,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -20, right: -20, width: 160, height: 160,
              background: `radial-gradient(circle, ${C.purple}22 0%, transparent 70%)`,
              borderRadius: "50%",
            }} />
            <div style={{
              width: 56, height: 56,
              background: C.white,
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 20,
              boxShadow: C.shadow,
            }}>
              <Wrench size={28} color={C.purple} />
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: C.ink, marginBottom: 10 }}>
              Pet Tools
            </h3>
            <p style={{ fontSize: "0.88rem", color: C.inkMuted, lineHeight: 1.7, marginBottom: 24 }}>
              เครื่องมือคำนวณและติดตามสุขภาพสัตว์เลี้ยง ง่าย ใช้งานได้ทันที
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              {TOOLS.map((t) => (
                <span key={t} style={{
                  background: C.white,
                  color: C.inkMuted,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: `1px solid ${C.border}`,
                }}>
                  {t}
                </span>
              ))}
            </div>
            <a href="#" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: C.purple,
              fontWeight: 700,
              fontSize: "0.88rem",
              textDecoration: "none",
              fontFamily: "'Prompt', sans-serif",
            }}>
              เข้าใช้ Tools <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
