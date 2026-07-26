"use client";

import React from 'react';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, totalCount, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <button
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="px-4 py-2 rounded-lg text-xs font-bold border disabled:opacity-40"
        style={{ borderColor: '#E5E7EB', color: '#4B5563' }}
      >
        ก่อนหน้า
      </button>
      <span className="text-xs" style={{ color: '#9CA3AF' }}>หน้า {page + 1} จาก {totalPages} ({totalCount.toLocaleString()} รายการ)</span>
      <button
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="px-4 py-2 rounded-lg text-xs font-bold border disabled:opacity-40"
        style={{ borderColor: '#E5E7EB', color: '#4B5563' }}
      >
        ถัดไป
      </button>
    </div>
  );
}
