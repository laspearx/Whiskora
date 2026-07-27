"use client";

import Link from "next/link";
import { F } from "@/lib/farmDashboard/theme";
import { trackEvent } from "@/lib/analytics/trackEvent";
import type { BusinessInsight } from "@/lib/farmDashboard/types";

const TREND_COLOR: Record<string, string> = { up: F.green, down: F.red, flat: F.muted };
const TREND_ICON: Record<string, string> = { up: "▲", down: "▼", flat: "▬" };

export default function BusinessInsights({ insights, farmId }: { insights: BusinessInsight[]; farmId: string }) {
  const available = insights.filter((i) => i.available);
  const unavailable = insights.filter((i) => !i.available);

  return (
    <section className="fd-sec">
      <style>{`
        .fd-ins-row { display:flex; align-items:flex-start; gap:8px; padding:9px 4px; border-bottom:1px solid ${F.line}; }
        .fd-ins-row:last-child { border-bottom:none; }
        .fd-ins-icon { font-size:12px; font-weight:700; margin-top:1px; flex-shrink:0; }
        .fd-ins-text { flex:1; font-size:12px; color:${F.ink}; line-height:1.5; }
        .fd-ins-unavailable { font-size:11px; color:${F.muted}; font-style:normal; }
      `}</style>
      <div className="fd-sec-head">
        <div className="fd-sec-title">
          <img src="/icons/icon-home.png" alt="" style={{ width: 26, height: 26 }} />
          <h2 className="fd-sec-h">อินไซต์ธุรกิจ</h2>
        </div>
      </div>

      {available.map((i) => {
        const content = (
          <div className="fd-ins-row" key={i.id}>
            <span className="fd-ins-icon" style={{ color: i.trend ? TREND_COLOR[i.trend] : F.pink }}>
              {i.trend ? TREND_ICON[i.trend] : "•"}
            </span>
            <span className="fd-ins-text">{i.text}</span>
          </div>
        );
        if (!i.href) return content;
        return (
          <Link
            key={i.id}
            href={i.href}
            style={{ textDecoration: "none", display: "block" }}
            onClick={() => trackEvent({ eventName: "insight_clicked", entityType: "insight", entityId: i.id, farmId: Number(farmId) })}
          >
            {content}
          </Link>
        );
      })}

      {unavailable.length > 0 && (
        <div style={{ marginTop: available.length > 0 ? 8 : 0 }}>
          {unavailable.map((i) => (
            <div className="fd-ins-row" key={i.id}>
              <span className="fd-ins-icon" style={{ color: F.lineMid }}>•</span>
              <span className="fd-ins-text fd-ins-unavailable">{i.unavailableReason}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
