"use client";

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DateRangePreset, PRESET_LABELS } from '@/lib/adminDateRange';

const PRESETS: DateRangePreset[] = ['today', 'last7', 'last30', 'this_month', 'prev_month', 'custom', 'all'];

export default function DateRangePicker({
  preset, customFrom, customTo,
}: {
  preset: DateRangePreset;
  customFrom?: string;
  customTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null) params.delete(k);
      else params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {PRESETS.map(p => (
        <button
          key={p}
          onClick={() => setParam({ range: p, from: p === 'custom' ? customFrom || null : null, to: p === 'custom' ? customTo || null : null })}
          className="px-3 py-1.5 rounded-full text-xs font-bold border"
          style={preset === p
            ? { background: '#FDE2EA', borderColor: '#E84677', color: '#E84677' }
            : { background: 'white', borderColor: '#E5E7EB', color: '#4B5563' }}
        >
          {PRESET_LABELS[p]}
        </button>
      ))}
      {preset === 'custom' && (
        <div className="flex items-center gap-1.5 ml-1">
          <input
            type="date"
            value={customFrom || ''}
            onChange={e => setParam({ range: 'custom', from: e.target.value })}
            className="px-2 py-1.5 rounded-lg border text-xs"
            style={{ borderColor: '#E5E7EB' }}
          />
          <span className="text-xs" style={{ color: '#9CA3AF' }}>ถึง</span>
          <input
            type="date"
            value={customTo || ''}
            onChange={e => setParam({ range: 'custom', to: e.target.value })}
            className="px-2 py-1.5 rounded-lg border text-xs"
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>
      )}
    </div>
  );
}
