"use client";

import React from 'react';
import Link from 'next/link';

interface KpiCardProps {
  title: string;
  value: number;
  previous?: number | null;
  showComparison?: boolean;
  tooltip: string;
  href?: string;
  unavailable?: boolean;
  unavailableNote?: string;
  suffix?: string;
}

function Trend({ value, previous }: { value: number; previous: number }) {
  if (previous === 0) {
    if (value === 0) return <span className="text-xs" style={{ color: '#9CA3AF' }}>ไม่มีการเปลี่ยนแปลง</span>;
    return <span className="text-xs font-semibold" style={{ color: '#16A34A' }}>▲ ใหม่ทั้งหมด</span>;
  }
  const pct = Math.round(((value - previous) / previous) * 100);
  if (pct === 0) return <span className="text-xs" style={{ color: '#9CA3AF' }}>▬ ไม่เปลี่ยนแปลง</span>;
  const up = pct > 0;
  return (
    <span className="text-xs font-semibold" style={{ color: up ? '#16A34A' : '#DC2626' }}>
      {up ? '▲' : '▼'} {up ? '+' : ''}{pct}% จากช่วงก่อนหน้า
    </span>
  );
}

export default function KpiCard({
  title, value, previous, showComparison = true, tooltip, href, unavailable, unavailableNote, suffix,
}: KpiCardProps) {
  const body = (
    <div
      className="group relative rounded-2xl border bg-white p-4"
      style={{ borderColor: '#E5E7EB', opacity: unavailable ? 0.65 : 1 }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-xs font-semibold" style={{ color: '#4B5563' }}>{title}</div>
        <span
          tabIndex={0}
          className="text-[10px] w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-help"
          style={{ borderColor: '#D1D5DB', color: '#9CA3AF' }}
          title={tooltip}
        >
          i
        </span>
      </div>
      {unavailable ? (
        <div className="text-xs" style={{ color: '#9CA3AF' }}>{unavailableNote || 'ยังไม่เริ่มเก็บข้อมูล'}</div>
      ) : (
        <>
          <div className="text-2xl font-extrabold" style={{ color: '#111827' }}>
            {value.toLocaleString()}{suffix}
          </div>
          {showComparison && previous !== undefined && previous !== null && (
            <div className="mt-1"><Trend value={value} previous={previous} /></div>
          )}
        </>
      )}
    </div>
  );

  if (href && !unavailable) {
    return <Link href={href} className="block hover:-translate-y-0.5 transition-transform">{body}</Link>;
  }
  return body;
}
