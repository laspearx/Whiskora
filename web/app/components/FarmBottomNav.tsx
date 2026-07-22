"use client";

import { useState } from 'react';
import Link from 'next/link';

const F = {
  ink: '#1f1a1c', inkSoft: '#4a3f44', muted: '#8e7e84',
  pink: '#e84677', pinkSoft: '#fde2ea', pinkBorder: '#FBCFE8',
  line: '#f3dde3',
};

export default function FarmBottomNav({ farmId }: { farmId: string }) {
  const base = `/farm-dashboard/${farmId}`;

  const [showAddAnimalSheet, setShowAddAnimalSheet] = useState(false);
  const [showApptSheet, setShowApptSheet] = useState(false);

  return (
    <>
      <style>{`
        @keyframes fbn-sheet-up { from{transform:translateY(50px);opacity:0} to{transform:translateY(0);opacity:1} }
        .fbn-sheet-overlay { position:fixed; inset:0; z-index:60; background:rgba(31,26,28,.4); backdrop-filter:blur(4px); display:flex; align-items:flex-end; justify-content:center; }
        .fbn-add-sheet { background:white; border-radius:20px 20px 0 0; padding:18px 16px calc(env(safe-area-inset-bottom,0px)+20px); width:100%; max-width:480px; animation:fbn-sheet-up .2s ease; }
        .fbn-sheet-handle { width:36px; height:3px; border-radius:2px; background:#E5E7EB; margin:0 auto 14px; }
        .fbn-sheet-title { font-size:12px; font-weight:500; color:${F.muted}; margin-bottom:12px; text-align:center; text-transform:uppercase; letter-spacing:.05em; }
        .fbn-add-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; max-width:300px; margin-left:auto; margin-right:auto; }
        .fbn-add-card { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:20px 12px 16px; border-radius:16px; border:1.5px solid ${F.line}; background:white; text-decoration:none; cursor:pointer; transition:all .15s; }
        .fbn-add-card:hover { border-color:${F.pinkBorder}; background:${F.pinkSoft}; }
        .fbn-add-card img { width:64px; height:64px; object-fit:contain; }
        .fbn-add-card-title { font-size:13px; font-weight:600; color:${F.ink}; text-align:center; line-height:1.3; }
        .fbn-add-card-sub { font-size:10px; color:${F.muted}; font-weight:400; text-align:center; line-height:1.4; }
        .fbn-sheet-close { margin-top:12px; width:100%; padding:11px; border-radius:10px; border:none; background:#F3F4F6; color:${F.inkSoft}; font-size:13px; font-weight:500; cursor:pointer; font-family:inherit; }

        .fbn-nav { position:fixed; bottom:0; left:0; right:0; z-index:55; background:rgba(255,255,255,.92); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border-top:1px solid rgba(232,70,119,.10); box-shadow:0 -4px 24px rgba(31,26,28,.07); padding-bottom:env(safe-area-inset-bottom,0px); }
        .fbn-nav-inner { display:flex; align-items:stretch; height:68px; }
        .fbn-nav-tab { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; text-decoration:none; color:${F.inkSoft}; border:none; background:none; font-family:inherit; cursor:pointer; }
        .fbn-tab-icon { width:72px; height:40px; border-radius:14px; display:flex; align-items:center; justify-content:center; transition:background .15s; }
        .fbn-nav-tab:active .fbn-tab-icon { background:rgba(232,70,119,.09); }
        .fbn-tab-icon img { width:48px; height:48px; object-fit:contain; }
        .fbn-nav-tab span { font-size:10px; font-weight:400; line-height:1.2; }
        @media (prefers-reduced-motion:reduce) { .fbn-add-sheet { animation:none!important; } }
      `}</style>

      {showAddAnimalSheet && (
        <div className="fbn-sheet-overlay" onClick={() => setShowAddAnimalSheet(false)}>
          <div className="fbn-add-sheet" onClick={e => e.stopPropagation()}>
            <div className="fbn-sheet-handle" />
            <div className="fbn-sheet-title">เพิ่มสัตว์เลี้ยง</div>
            <div className="fbn-add-grid">
              <Link href={`${base}/pets/create`} className="fbn-add-card" onClick={() => setShowAddAnimalSheet(false)}>
                <img src="/icons/icon-foster-home.png" alt="" />
                <div className="fbn-add-card-title">เพิ่มทีละตัว</div>
                <div className="fbn-add-card-sub">บันทึกข้อมูลพร้อมประวัติครบถ้วน</div>
              </Link>
              <Link href={`${base}/pets/bulk-create`} className="fbn-add-card" onClick={() => setShowAddAnimalSheet(false)}>
                <img src="/icons/icon-vet-care.png" alt="" />
                <div className="fbn-add-card-title">เพิ่มหลายตัว</div>
                <div className="fbn-add-card-sub">เพิ่มลูกสัตว์ทั้งครอกในครั้งเดียว</div>
              </Link>
            </div>
            <button className="fbn-sheet-close" onClick={() => setShowAddAnimalSheet(false)}>ปิด</button>
          </div>
        </div>
      )}

      {showApptSheet && (
        <div className="fbn-sheet-overlay" onClick={() => setShowApptSheet(false)}>
          <div className="fbn-add-sheet" onClick={e => e.stopPropagation()}>
            <div className="fbn-sheet-handle" />
            <div className="fbn-sheet-title">เลือกประเภท</div>
            <div className="fbn-add-grid">
              <Link href={`${base}/appointments/create`} className="fbn-add-card" onClick={() => setShowApptSheet(false)}>
                <img src="/icons/icon-calendar.png" alt="" />
                <div className="fbn-add-card-title">นัดหมาย</div>
                <div className="fbn-add-card-sub">บันทึกนัดส่งมอบ ตรวจสุขภาพ กรูมมิ่ง ฯลฯ</div>
              </Link>
              <Link href={`${base}/appointments/create?type=activity`} className="fbn-add-card" onClick={() => setShowApptSheet(false)}>
                <img src="/icons/icon-health.png" alt="" />
                <div className="fbn-add-card-title">กิจกรรม</div>
                <div className="fbn-add-card-sub">บันทึกกิจกรรมประจำวัน ชั่งน้ำหนัก ฝึกพฤติกรรม ฯลฯ</div>
              </Link>
            </div>
            <button className="fbn-sheet-close" onClick={() => setShowApptSheet(false)}>ปิด</button>
          </div>
        </div>
      )}

      <nav aria-label="เมนูฟาร์ม" className="fbn-nav">
        <div className="fbn-nav-inner">
          <button className="fbn-nav-tab" onClick={() => setShowAddAnimalSheet(true)}>
            <div className="fbn-tab-icon"><img src="/icons/icon-tab-add.png" alt="" /></div>
            <span>เพิ่มสัตว์</span>
          </button>
          <Link href={`${base}/litters/create`} className="fbn-nav-tab">
            <div className="fbn-tab-icon"><img src="/icons/icon-my-pets.png" alt="" /></div>
            <span>จับคู่บรีด</span>
          </Link>
          <Link href={`${base}/babies`} className="fbn-nav-tab">
            <div className="fbn-tab-icon"><img src="/icons/icon-feeding.png" alt="" /></div>
            <span>เบบี๋</span>
          </Link>
          <Link href={`${base}/weights`} className="fbn-nav-tab">
            <div className="fbn-tab-icon"><img src="/icons/icon-weight.png" alt="" /></div>
            <span>ชั่งน้ำหนัก</span>
          </Link>
          <button className="fbn-nav-tab" onClick={() => setShowApptSheet(true)}>
            <div className="fbn-tab-icon"><img src="/icons/icon-calendar.png" alt="" /></div>
            <span>นัดหมาย/กิจกรรม</span>
          </button>
        </div>
      </nav>
    </>
  );
}
