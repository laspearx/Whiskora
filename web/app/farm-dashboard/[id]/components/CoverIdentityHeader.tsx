"use client";

import { useRef } from "react";
import Link from "next/link";
import { speciesTh } from "@/lib/species";
import { F } from "@/lib/farmDashboard/theme";

const Icon = {
  Eye: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

interface CoverIdentityHeaderProps {
  farm: {
    farm_name: string; species: string | null; cover_url: string | null; image_url: string | null;
    is_verified: boolean; verification_status: string | null;
  };
  farmId: string;
  farmCompletion: number;
  uploadingCover: boolean;
  uploadingAvatar: boolean;
  latestVerificationStatus: string | null;
  latestVerificationNote: string | null;
  onImageSelected: (dataUrl: string, type: "avatar" | "cover") => void;
}

export default function CoverIdentityHeader({
  farm, farmId, farmCompletion, uploadingCover, uploadingAvatar,
  latestVerificationStatus, latestVerificationNote, onImageSelected,
}: CoverIdentityHeaderProps) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const readAndSelect = (file: File, type: "avatar" | "cover") => {
    const reader = new FileReader();
    reader.onload = () => onImageSelected(reader.result as string, type);
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Cover */}
      <div className="fd-cover">
        {farm.cover_url && (
          <img className="fd-cover-img" src={farm.cover_url} alt={farm.farm_name} />
        )}
        <div className="fd-cover-overlay" />
        <button className="fd-cover-cam" onClick={() => coverInputRef.current?.click()} aria-label="เปลี่ยนรูปปก">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </button>
        {uploadingCover && <div className="fd-cover-spin">กำลังอัพโหลด...</div>}
        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) readAndSelect(f, "cover"); if (coverInputRef.current) coverInputRef.current.value = ""; }} />
      </div>

      {/* Identity */}
      <div className="fd-identity">
        <div className="fd-id-row">
          <div className="fd-avatar-wrap">
            <div className="fd-avatar" onClick={() => avatarInputRef.current?.click()}>
              {farm.image_url
                ? <img src={farm.image_url} alt={farm.farm_name} />
                : <img src="/icons/icon-farm.png" alt="" style={{ width: 38, height: 38, objectFit: 'contain' }} />}
              {uploadingAvatar && <div className="fd-avatar-spin"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={F.pink} strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div>}
            </div>
            <div className="fd-avatar-edit">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) readAndSelect(f, "avatar"); if (avatarInputRef.current) avatarInputRef.current.value = ""; }} />
          </div>
          <div className="fd-id-main">
            <div className="fd-id-text">
              <h1 className="fd-name">
                {farm.farm_name}
                {farm.is_verified && <img src="/icons/icon-verified-badge.png" alt="ยืนยันแล้ว" />}
              </h1>
              <div className="fd-tagline">{speciesTh(farm.species) || 'ฟาร์มสัตว์เลี้ยง'}</div>
              {farmCompletion < 100 && (
                <div className="fd-prog-bar">
                  <div className="fd-prog-track">
                    <div className="fd-prog-fill" style={{ width: `${farmCompletion}%` }} />
                  </div>
                  <span className="fd-prog-text">{farmCompletion}%</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, alignSelf: 'flex-start' }}>
              <Link href={`/farm/${farmId}`} className="fd-view-btn">
                <Icon.Eye /> ดูหน้าฟาร์ม
              </Link>
              <Link href={`/farm-dashboard/${farmId}/edit`} className="fd-edit-icon" aria-label="แก้ไขโปรไฟล์">
                <img src="/icons/icon-setting.png" style={{ width: 36, height: 36 }} alt="ตั้งค่า" />
              </Link>
            </div>
          </div>
        </div>

        {!farm.is_verified && latestVerificationStatus === 'needs_more_info' && (
          <Link href={`/farm-dashboard/${farmId}/verify`} className="fd-verify-btn" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
            <img src="/icons/icon-non-verified.png" alt="" />
            <div className="fd-verify-btn-text">
              <div className="fd-verify-btn-title" style={{ color: '#D97706' }}>แอดมินขอข้อมูลเพิ่มเติม</div>
              <div className="fd-verify-btn-sub">{latestVerificationNote || 'แตะเพื่อดูรายละเอียดและส่งเอกสารเพิ่ม'}</div>
            </div>
            <Icon.ChevronRight />
          </Link>
        )}
        {/* Standalone "ยืนยันตัวตนฟาร์ม" CTA removed (2026-07-27) — the onboarding checklist's
            verify-nudge button (FARM_ONBOARDING_TH.verifyNudgeTitle, shown once onboarding is
            complete) already covers "increase credibility via farm verification"; having both
            was a duplicate prompt. */}
        {farm.verification_status === 'pending' && latestVerificationStatus !== 'needs_more_info' && (
          <div className="fd-pending-badge">
            <img src="/icons/icon-non-verified.png" alt="" style={{ width: 22, height: 22 }} />
            รอการตรวจสอบจากแอดมิน — เราจะแจ้งผลเร็วๆ นี้
          </div>
        )}
      </div>
    </>
  );
}
