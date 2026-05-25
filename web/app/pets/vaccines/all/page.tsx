"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// โ”€โ”€โ”€ Premium CI Tokens โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkLight: '#F472B6', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  teal: '#0D9488', tealSoft: '#F0FDFA',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

function AppointmentsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const [groupedAppointments, setGroupedAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!dateParam) { setLoading(false); return; }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push(`/login?redirect=${encodeURIComponent(`/pets/vaccines/all?date=${dateParam}`)}`);
          return;
        }

        // 1. เธชเธฑเธ•เธงเนเน€เธฅเธตเนเธขเธเธ—เธฑเนเธเธซเธกเธ”เธเธญเธเธเธนเนเนเธเน
        const { data: petsData } = await supabase
          .from("pets").select("id, name, image_url").eq("user_id", session.user.id);
        if (!petsData || petsData.length === 0) { setLoading(false); return; }

        const petIds = petsData.map((p) => p.id);

        // 2. เธงเธฑเธเธเธตเธ/เธเธฑเธ”เธซเธกเธฒเธขเธเธญเธเธชเธฑเธ•เธงเนเธ—เธธเธเธ•เธฑเธง
        const { data: vacData } = await supabase
          .from("vaccines").select("*").in("pet_id", petIds);

        if (vacData) {
          // 3. เธเธฃเธญเธเน€เธเธเธฒเธฐเธงเธฑเธเธ—เธตเนเธ•เธฃเธเธเธฑเธ
          const filteredAppts = vacData.filter(
            (a) => a.next_due && a.next_due.split("T")[0] === dateParam
          );
          // 4. เธเธนเธเธเนเธญเธกเธนเธฅเธชเธฑเธ•เธงเนเน€เธฅเธตเนเธขเธ
          const mergedData = filteredAppts.map((appt) => ({
            ...appt, pet: petsData.find((p) => p.id === appt.pet_id),
          }));
          // 5. เธเธฑเธ”เธเธฅเธธเนเธกเธ•เธฒเธกเธเธทเนเธญเธงเธฑเธเธเธตเธ/เธเธฃเธดเธเธฒเธฃ
          const groupedData = mergedData.reduce((acc: any, cur: any) => {
            const type = cur.vaccine_name || 'เธญเธทเนเธเน';
            if (!acc[type]) acc[type] = [];
            acc[type].push(cur);
            return acc;
          }, {});
          const finalArray = Object.keys(groupedData).map((key) => {
            let emoji = '๐’';
            if (key.includes('เน€เธซเนเธ') || key.includes('เธซเธขเธ”')) emoji = '๐’ง';
            else if (key.includes('เธเธขเธฒเธเธด')) emoji = '๐’';
            return { vaccineName: key, emoji, items: groupedData[key] };
          });
          setGroupedAppointments(finalArray);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [dateParam, router]);

  const formattedDate = dateParam
    ? new Date(dateParam).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'เนเธกเนเธฃเธฐเธเธธเธงเธฑเธเธ—เธตเน';

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .ap-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .ap-body { max-width: 760px; margin: 0 auto; padding: 24px 20px 80px; }
        .ap-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .ap-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.pinkBorder}; box-shadow: 0 2px 8px rgba(232,70,119,0.1); transition: all .18s ease; flex-shrink: 0; text-decoration: none; }
        .ap-back:hover { color: ${F.pink}; border-color: ${F.pink}; transform: translateX(-1px); }
        .ap-title { font-family: inherit; font-size: 23px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .ap-date { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: ${F.pink}; margin-top: 3px; }
        .ap-loading { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .ap-spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${F.pinkBorder}; border-top-color: ${F.pink}; animation: apspin 1s linear infinite; }
        @keyframes apspin { to { transform: rotate(360deg); } }
        .ap-loading-text { font-size: 13px; font-weight: 700; color: ${F.muted}; }
        /* empty */
        .ap-empty { background: white; border: 1px solid ${F.line}; border-radius: 24px; padding: 48px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .ap-empty-emoji { font-size: 48px; }
        .ap-empty-text { font-size: 15px; font-weight: 700; color: ${F.inkSoft}; }
        /* group card */
        .ap-group { background: white; border: 1px solid ${F.line}; border-radius: 22px; padding: 22px; margin-bottom: 18px; }
        .ap-group-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid ${F.line}; }
        .ap-group-icon { width: 42px; height: 42px; border-radius: 13px; background: ${F.pinkSoft}; border: 1px solid ${F.pinkBorder}; color: ${F.pink}; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; }
        .ap-group-title { font-family: inherit; font-size: 17px; font-weight: 700; color: ${F.ink}; letter-spacing: -0.2px; }
        .ap-group-count { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 1px; }
        /* pet items */
        .ap-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
        .ap-item { display: flex; align-items: center; gap: 12px; padding: 11px 13px; border-radius: 14px; border: 1px solid ${F.line}; background: #FAFAFA; text-decoration: none; transition: all .15s; }
        .ap-item:hover { background: white; border-color: ${F.pinkBorder}; box-shadow: 0 4px 14px rgba(232,70,119,0.1); }
        .ap-item-avatar { width: 46px; height: 46px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; }
        .ap-item-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ap-item-info { flex: 1; min-width: 0; }
        .ap-item-tag { font-size: 9px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.08em; }
        .ap-item-name { font-family: inherit; font-size: 15px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ap-item-arrow { color: ${F.muted}; flex-shrink: 0; display: flex; }
        .ap-item:hover .ap-item-arrow { color: ${F.pink}; }
        @media (max-width: 480px) { .ap-items { grid-template-columns: 1fr; } }
      `}</style>

      <div className="ap-page">
        <div className="ap-body">
          <div className="ap-header">
            <Link href="/profile" className="ap-back" aria-label="เธขเนเธญเธเธเธฅเธฑเธ"><Icon.ArrowLeft /></Link>
            <div>
              <h1 className="ap-title">เธฃเธฒเธขเธเธฒเธฃเธเธฑเธ”เธซเธกเธฒเธข</h1>
              <span className="ap-date"><Icon.Calendar /> เธเธฃเธฐเธเธณเธงเธฑเธเธ—เธตเน {formattedDate}</span>
            </div>
          </div>

          {loading ? (
            <div className="ap-loading">
              <div className="ap-spinner" />
              <p className="ap-loading-text">เธเธณเธฅเธฑเธเนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเธเธฑเธ”เธซเธกเธฒเธข...</p>
            </div>
          ) : groupedAppointments.length === 0 ? (
            <div className="ap-empty">
              <span className="ap-empty-emoji">๐“ญ</span>
              <p className="ap-empty-text">เนเธกเนเธกเธตเธเธฑเธ”เธซเธกเธฒเธขเนเธเธงเธฑเธเธเธตเน</p>
            </div>
          ) : (
            groupedAppointments.map((group, gi) => (
              <div key={gi} className="ap-group">
                <div className="ap-group-head">
                  <div className="ap-group-icon">{group.emoji}</div>
                  <div>
                    <div className="ap-group-title">{group.vaccineName}</div>
                    <div className="ap-group-count">{group.items.length} เธ•เธฑเธง</div>
                  </div>
                </div>
                <div className="ap-items">
                  {group.items.map((appt: any, idx: number) => (
                    <Link key={idx} href={`/pets/${appt.pet_id}`} className="ap-item">
                      <div className="ap-item-avatar">
                        {appt.pet?.image_url ? <img src={appt.pet.image_url} alt={appt.pet.name} /> : '๐พ'}
                      </div>
                      <div className="ap-item-info">
                        <div className="ap-item-tag">เธเธฑเธ”เธเธญเธเธเนเธญเธ</div>
                        <div className="ap-item-name">{appt.pet?.name || 'เนเธกเนเธ—เธฃเธฒเธเธเธทเนเธญ'}</div>
                      </div>
                      <span className="ap-item-arrow"><Icon.ChevronRight /></span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default function AllAppointmentsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #FBCFE8', borderTopColor: '#E84677', animation: 'apspin 1s linear infinite' }} /></div>}>
      <AppointmentsList />
    </Suspense>
  );
}