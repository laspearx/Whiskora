"use client";

import { useState } from "react";
import Link from "next/link";
import { F } from "@/lib/farmDashboard/theme";
import EmptySection from "./EmptySection";
import type { AttentionItem } from "@/lib/farmDashboard/types";

const VISIBLE_LIMIT = 6;

export default function AttentionList({ items, farmId }: { items: AttentionItem[]; farmId: string }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, VISIBLE_LIMIT);

  return (
    <section className="fd-sec">
      <style>{`
        .fd-att-row { display:flex; align-items:center; gap:9px; padding:7px 4px; border-bottom:1px solid ${F.line}; text-decoration:none; }
        .fd-att-row:last-child { border-bottom:none; }
        .fd-att-avatar { width:34px; height:34px; border-radius:50%; overflow:hidden; background:${F.pinkSoft}; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .fd-att-avatar img { width:100%; height:100%; object-fit:cover; }
        .fd-att-text { flex:1; min-width:0; }
        .fd-att-name { font-size:12px; font-weight:600; color:${F.ink}; }
        .fd-att-reason { font-size:11px; color:${F.muted}; font-weight:400; }
      `}</style>
      <div className="fd-sec-head">
        <div className="fd-sec-title">
          <img src="/icons/icon-my-pets.png" alt="" style={{ width: 28, height: 28 }} />
          <h2 className="fd-sec-h">สัตว์ที่ต้องดูแล</h2>
          {items.length > 0 && (
            <span className="fd-sec-badge" style={{ background: F.amberSoft, color: F.amber }}>{items.length}</span>
          )}
        </div>
        <Link href={`/farm-dashboard/${farmId}/data-check`} className="fd-link-sm">ตรวจสอบข้อมูล</Link>
      </div>

      {items.length === 0 ? (
        <EmptySection text="ไม่มีสัตว์ที่ต้องดูแลเพิ่มเติมตอนนี้" />
      ) : (
        <>
          {visible.map((item) => (
            <Link key={item.id} href={item.href} className="fd-att-row">
              <div className="fd-att-avatar">
                {item.petImage
                  ? <img src={item.petImage} alt="" />
                  : <img src="/icons/icon-my-pets.png" alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />}
              </div>
              <div className="fd-att-text">
                <div className="fd-att-name">{item.petName}</div>
                <div className="fd-att-reason">{item.reason}</div>
              </div>
            </Link>
          ))}
          {items.length > VISIBLE_LIMIT && (
            <button className="fd-show-more" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "ย่อ ▲" : `ดูทั้งหมด ${items.length} รายการ ▼`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
