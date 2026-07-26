"use client";

import React, { useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  requireNote?: boolean;
  notePlaceholder?: string;
  noteValue?: string;
  onNoteChange?: (value: string) => void;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'ยกเลิก',
  tone = 'default',
  requireNote = false,
  notePlaceholder,
  noteValue,
  onNoteChange,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [localNote, setLocalNote] = useState('');
  const note = noteValue !== undefined ? noteValue : localNote;
  const setNote = onNoteChange ?? setLocalNote;

  if (!open) return null;

  const confirmDisabled = busy || (requireNote && !note.trim());
  const confirmColor = tone === 'danger' ? '#EF4444' : '#10B981';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="font-bold text-base mb-1" style={{ color: '#111827' }}>{title}</div>
        {description && <div className="text-sm mb-3" style={{ color: '#6B7280' }}>{description}</div>}
        {requireNote && (
          <textarea
            className="w-full rounded-xl border px-3 py-2.5 text-sm mb-3 outline-none"
            style={{ borderColor: '#E5E7EB', minHeight: 80, color: '#111827' }}
            placeholder={notePlaceholder}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold border"
            style={{ borderColor: '#E5E7EB', color: '#4B5563' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: confirmColor }}
          >
            {busy ? 'กำลังดำเนินการ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
