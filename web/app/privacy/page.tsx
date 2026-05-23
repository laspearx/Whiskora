"use client";

import React from "react";
import Link from "next/link";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#F3F4F6', lineMid: '#E5E7EB',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Shield: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const LAST_UPDATED = "23 พฤษภาคม 2569";
const CONTACT_EMAIL = "whiskora.pet@gmail.com";

export default function PrivacyPolicyPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=Prompt:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .pv-page { font-family: 'Sarabun', sans-serif; color: ${F.ink}; }
        .pv-body { max-width: 820px; margin: 0 auto; padding: 24px 20px 80px; }
        .pv-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.pinkBorder}; box-shadow: 0 2px 8px rgba(232,70,119,0.1); transition: all .18s ease; flex-shrink: 0; text-decoration: none; }
        .pv-back:hover { color: ${F.pink}; border-color: ${F.pink}; transform: translateX(-1px); }
        .pv-hero { display: flex; align-items: center; gap: 16px; margin: 8px 0 22px; }
        .pv-hero-icon { width: 56px; height: 56px; border-radius: 18px; background: ${F.pink}; color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(232,70,119,0.3); }
        .pv-title { font-family: 'Prompt', sans-serif; font-size: 28px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.5px; }
        .pv-updated { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 4px; }
        .pv-intro { background: ${F.pinkSoft}; border: 1px solid ${F.pinkBorder}; border-radius: 16px; padding: 18px 20px; font-size: 14px; color: ${F.inkSoft}; line-height: 1.7; margin-bottom: 28px; }
        .pv-section { margin-bottom: 26px; }
        .pv-h2 { font-family: 'Prompt', sans-serif; font-size: 18px; font-weight: 700; color: ${F.ink}; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .pv-h2-num { width: 26px; height: 26px; border-radius: 8px; background: ${F.pinkSoft}; color: ${F.pink}; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pv-p { font-size: 14px; color: ${F.inkSoft}; line-height: 1.75; margin-bottom: 10px; }
        .pv-ul { margin: 6px 0 12px; padding-left: 4px; list-style: none; }
        .pv-ul li { font-size: 14px; color: ${F.inkSoft}; line-height: 1.7; padding-left: 22px; position: relative; margin-bottom: 6px; }
        .pv-ul li::before { content: '🐾'; position: absolute; left: 0; font-size: 11px; top: 3px; }
        .pv-p b, .pv-ul b { color: ${F.ink}; font-weight: 700; }
        .pv-callout { background: white; border: 1px solid ${F.pinkBorder}; border-left: 4px solid ${F.pink}; border-radius: 12px; padding: 16px 18px; margin: 12px 0; }
        .pv-callout-title { font-family: 'Prompt', sans-serif; font-size: 14px; font-weight: 700; color: ${F.pink}; margin-bottom: 6px; }
        .pv-link { color: ${F.pink}; font-weight: 700; text-decoration: none; }
        .pv-link:hover { text-decoration: underline; }
        .pv-divider { height: 1px; background: ${F.lineMid}; border: none; margin: 28px 0; }
        @media (max-width: 600px) {
          .pv-title { font-size: 23px; }
          .pv-body { padding: 16px 16px 60px; }
        }
      `}</style>

      <div className="pv-page">
        <div className="pv-body">
          <Link href="/" className="pv-back" aria-label="กลับหน้าแรก"><Icon.ArrowLeft /></Link>

          <div className="pv-hero">
            <div className="pv-hero-icon"><Icon.Shield /></div>
            <div>
              <h1 className="pv-title">นโยบายความเป็นส่วนตัว</h1>
              <p className="pv-updated">Privacy Policy · ปรับปรุงล่าสุด {LAST_UPDATED}</p>
            </div>
          </div>

          <div className="pv-intro">
            Whiskora (“เรา”) ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้งานทุกท่าน
            นโยบายนี้อธิบายว่าเราเก็บรวบรวมข้อมูลอะไร นำไปใช้อย่างไร และคุณมีสิทธิ์อะไรบ้าง
            การใช้งาน Whiskora ถือว่าคุณยอมรับแนวทางในนโยบายฉบับนี้
          </div>

          <div className="pv-section">
            <h2 className="pv-h2"><span className="pv-h2-num">1</span> ข้อมูลที่เราเก็บรวบรวม</h2>
            <p className="pv-p">เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการ ดังนี้:</p>
            <ul className="pv-ul">
              <li><b>ข้อมูลบัญชี</b> — ชื่อ อีเมล รูปโปรไฟล์ และข้อมูลพื้นฐานที่ได้รับเมื่อคุณสมัครหรือเข้าสู่ระบบผ่าน Google หรือ Facebook</li>
              <li><b>ข้อมูลโปรไฟล์</b> — ชื่อผู้ใช้ เบอร์โทรศัพท์ ที่อยู่ และข้อมูลติดต่อที่คุณกรอกเอง</li>
              <li><b>ข้อมูลสัตว์เลี้ยงและฟาร์ม</b> — ชื่อ สายพันธุ์ ประวัติสุขภาพ วัคซีน รูปภาพ และข้อมูลอื่นที่คุณบันทึกเข้าระบบ</li>
              <li><b>ข้อมูลการใช้งาน</b> — ข้อมูลทางเทคนิค เช่น ประเภทอุปกรณ์และเบราว์เซอร์ เพื่อปรับปรุงประสบการณ์การใช้งาน</li>
            </ul>
            <div className="pv-callout">
              <div className="pv-callout-title">การเข้าสู่ระบบผ่าน Google และ Facebook</div>
              <p className="pv-p" style={{ marginBottom: 0 }}>
                เมื่อคุณเข้าสู่ระบบด้วย Google หรือ Facebook เราจะได้รับเพียง <b>ชื่อ อีเมล และรูปโปรไฟล์สาธารณะ</b> เท่านั้น
                เรา<b>ไม่</b>เข้าถึงรหัสผ่าน รายชื่อเพื่อน หรือโพสต์ของคุณ และไม่โพสต์สิ่งใดลงบัญชีของคุณ
              </p>
            </div>
          </div>

          <div className="pv-section">
            <h2 className="pv-h2"><span className="pv-h2-num">2</span> เราใช้ข้อมูลของคุณอย่างไร</h2>
            <ul className="pv-ul">
              <li>เพื่อสร้างและจัดการบัญชีผู้ใช้ของคุณ</li>
              <li>เพื่อให้บริการหลัก เช่น สร้างโปรไฟล์สัตว์เลี้ยง บัตรประจำตัว ระบบจัดการฟาร์ม และตลาดสัตว์เลี้ยง</li>
              <li>เพื่อแสดงข้อมูลสัตว์เลี้ยงหรือฟาร์มที่คุณตั้งค่าให้เป็นสาธารณะ</li>
              <li>เพื่อติดต่อสื่อสาร แจ้งเตือน และปรับปรุงคุณภาพบริการ</li>
              <li>เพื่อความปลอดภัยและป้องกันการใช้งานที่ผิดวัตถุประสงค์</li>
            </ul>
          </div>

          <div className="pv-section">
            <h2 className="pv-h2"><span className="pv-h2-num">3</span> การเปิดเผยและแบ่งปันข้อมูล</h2>
            <p className="pv-p">
              เรา<b>ไม่ขาย</b>ข้อมูลส่วนบุคคลของคุณให้บุคคลที่สาม เราจะเปิดเผยข้อมูลเฉพาะกรณีต่อไปนี้:
            </p>
            <ul className="pv-ul">
              <li><b>ข้อมูลที่คุณตั้งเป็นสาธารณะ</b> — เช่น โปรไฟล์สัตว์หรือฟาร์มที่เปิดให้คนอื่นดูได้</li>
              <li><b>ผู้ให้บริการที่จำเป็น</b> — เช่น ผู้ให้บริการฐานข้อมูลและระบบยืนยันตัวตน เพื่อให้บริการทำงานได้</li>
              <li><b>ตามกฎหมาย</b> — เมื่อมีคำขอที่ชอบด้วยกฎหมายจากหน่วยงานราชการ</li>
            </ul>
          </div>

          <div className="pv-section">
            <h2 className="pv-h2"><span className="pv-h2-num">4</span> การจัดเก็บและความปลอดภัย</h2>
            <p className="pv-p">
              เราจัดเก็บข้อมูลบนระบบที่มีมาตรการรักษาความปลอดภัยตามมาตรฐาน และเก็บข้อมูลไว้เท่าที่จำเป็นต่อการให้บริการ
              หรือตามที่กฎหมายกำหนด เมื่อไม่มีความจำเป็นแล้ว เราจะลบหรือทำให้ข้อมูลไม่สามารถระบุตัวตนได้
            </p>
          </div>

          <div className="pv-section">
            <h2 className="pv-h2"><span className="pv-h2-num">5</span> สิทธิ์ของคุณ</h2>
            <ul className="pv-ul">
              <li>เข้าถึง แก้ไข หรือปรับปรุงข้อมูลส่วนตัวของคุณได้ผ่านหน้าโปรไฟล์</li>
              <li>ขอสำเนาข้อมูล หรือขอให้ลบบัญชีและข้อมูลทั้งหมดของคุณ</li>
              <li>ถอนความยินยอมในการใช้ข้อมูลได้ทุกเมื่อ</li>
            </ul>
          </div>

          <div className="pv-section">
            <h2 className="pv-h2"><span className="pv-h2-num">6</span> การลบข้อมูลและบัญชี</h2>
            <div className="pv-callout">
              <div className="pv-callout-title">วิธีขอลบข้อมูลของคุณ</div>
              <p className="pv-p" style={{ marginBottom: 8 }}>
                หากต้องการลบบัญชีและข้อมูลส่วนบุคคลทั้งหมด (รวมถึงข้อมูลที่ได้จากการเข้าสู่ระบบผ่าน Google/Facebook)
                คุณสามารถ:
              </p>
              <ul className="pv-ul" style={{ marginBottom: 0 }}>
                <li>ส่งอีเมลแจ้งคำขอลบข้อมูลมาที่ <a className="pv-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> โดยระบุอีเมลบัญชีของคุณ</li>
                <li>เราจะดำเนินการลบข้อมูลของคุณภายใน <b>30 วัน</b> นับจากได้รับคำขอ และยืนยันกลับเมื่อเสร็จสิ้น</li>
              </ul>
            </div>
          </div>

          <div className="pv-section">
            <h2 className="pv-h2"><span className="pv-h2-num">7</span> ข้อมูลของผู้เยาว์</h2>
            <p className="pv-p">
              Whiskora ไม่ได้มุ่งให้บริการแก่ผู้ที่มีอายุต่ำกว่าเกณฑ์ตามกฎหมาย หากพบว่ามีการเก็บข้อมูลของผู้เยาว์
              โดยไม่ได้รับความยินยอมจากผู้ปกครอง เราจะดำเนินการลบข้อมูลนั้นทันที
            </p>
          </div>

          <div className="pv-section">
            <h2 className="pv-h2"><span className="pv-h2-num">8</span> การเปลี่ยนแปลงนโยบาย</h2>
            <p className="pv-p">
              เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว หากมีการเปลี่ยนแปลงสำคัญ เราจะแจ้งให้ทราบผ่านเว็บไซต์
              วันที่ปรับปรุงล่าสุดจะแสดงไว้ที่ด้านบนของหน้านี้เสมอ
            </p>
          </div>

          <hr className="pv-divider" />

          <div className="pv-section" style={{ marginBottom: 0 }}>
            <h2 className="pv-h2"><span className="pv-h2-num">9</span> ติดต่อเรา</h2>
            <p className="pv-p">
              หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวหรือต้องการใช้สิทธิ์ของคุณ ติดต่อได้ที่:<br />
              อีเมล: <a className="pv-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />
              เว็บไซต์: <a className="pv-link" href="https://whiskora.pet">whiskora.pet</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}