"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { speciesTh } from "@/lib/species";
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  blue: '#2563EB', green: '#16A34A', orange: '#F97316',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  X: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
};

const calculateAge = (birthDate: string) => {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) { years--; months += 12; }
  if (today.getDate() < birth.getDate()) months--;
  if (years === 0 && months === 0) return "(อายุไม่ถึง 1 เดือน)";
  let ageStr = "(อายุ ";
  if (years > 0) ageStr += `${years} ปี `;
  if (months > 0) ageStr += `${months} เดือน`;
  return ageStr.trim() + ")";
};

const formatBreed = (breedStr: string, species?: string) => {
  if (!breedStr) return { thai: speciesTh(species) || 'พันธุ์ผสม / อื่นๆ', eng: '' };
  const parts = breedStr.split('(');
  if (parts.length > 1) return { thai: parts[0].trim(), eng: `(${parts[1].trim()}` };
  return { thai: breedStr.trim(), eng: '' };
};

export default function FarmPetsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const farmId = params.id as string;
  const statusFilter = searchParams.get("status");

  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarmPets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push(`/login?redirect=${encodeURIComponent(`/farm-dashboard/${farmId}/pets`)}`); return; }
        let query = supabase.from("pets").select("*").eq("farm_id", farmId).eq("user_id", session.user.id).order("created_at", { ascending: false });
        if (statusFilter) query = query.eq("status", statusFilter);
        const { data: petsData, error } = await query;
        if (error) throw error;
        if (petsData) setPets(petsData);
      } catch (error) {
        console.error("Error fetching farm pets:", error);
      } finally { setLoading(false); }
    };
    if (farmId) fetchFarmPets();
  }, [farmId, statusFilter, router]);

  const statusStyle = (s: string) => {
    if (s === 'พร้อมย้ายบ้าน') return { bg: '#F0FDF4', color: F.green, border: '#BBF7D0' };
    if (s === 'จองแล้ว') return { bg: '#FFF7ED', color: F.orange, border: '#FED7AA' };
    return { bg: F.pinkSoft, color: F.pink, border: F.pinkBorder };
  };

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .fpl-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .fpl-body { max-width: 900px; margin: 0 auto; padding: 24px 20px 80px; }
        .fpl-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .fpl-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .fpl-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .fpl-title { font-family: inherit; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.1; }
        .fpl-title .count { color: ${F.pink}; }
        .fpl-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
        .fpl-clear { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: ${F.muted}; background: ${F.line}; padding: 6px 12px; border-radius: 999px; text-decoration: none; transition: all .15s; margin-top: 8px; }
        .fpl-clear:hover { background: ${F.pinkSoft}; color: ${F.pink}; }
        .fpl-add { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: ${F.pink}; background: ${F.pinkSoft}; padding: 10px 16px; border-radius: 12px; text-decoration: none; transition: all .15s; white-space: nowrap; border: 1px solid ${F.pinkBorder}; }
        .fpl-add:hover { background: ${F.pink}; color: white; }
        /* empty */
        .fpl-empty { background: #FAFAFA; border: 2px dashed ${F.lineMid}; border-radius: 24px; padding: 56px 24px; text-align: center; }
        .fpl-empty-emoji { font-size: 56px; opacity: 0.3; margin-bottom: 14px; }
        .fpl-empty-title { font-family: inherit; font-size: 18px; font-weight: 700; color: ${F.inkSoft}; }
        .fpl-empty-text { font-size: 14px; color: ${F.muted}; margin: 8px 0 22px; }
        .fpl-empty-btn { display: inline-block; background: ${F.pink}; color: white; padding: 13px 28px; border-radius: 14px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 14px rgba(232,70,119,0.3); transition: all .15s; }
        .fpl-empty-btn:hover { background: #D63F6A; }
        /* grid */
        .fpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
        .fpl-card { display: flex; gap: 14px; background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 14px; text-decoration: none; transition: all .18s; }
        .fpl-card:hover { border-color: ${F.pinkBorder}; box-shadow: 0 6px 20px rgba(232,70,119,0.1); transform: translateY(-1px); }
        .fpl-photo { width: 96px; height: 96px; border-radius: 14px; overflow: hidden; background: ${F.pinkSoft}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 34px; }
        .fpl-photo img { width: 100%; height: 100%; object-fit: cover; }
        .fpl-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .fpl-name-row { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
        .fpl-name { font-family: inherit; font-size: 16px; font-weight: 700; color: ${F.ink}; }
        .fpl-age { font-size: 11px; font-weight: 500; color: ${F.muted}; }
        .fpl-tags { display: flex; gap: 6px; flex-wrap: wrap; margin: 7px 0; }
        .fpl-tag { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 999px; border: 1px solid; }
        .fpl-gender-f { background: ${F.pinkSoft}; color: ${F.pink}; border-color: ${F.pinkBorder}; }
        .fpl-gender-m { background: #EFF6FF; color: ${F.blue}; border-color: #BFDBFE; }
        .fpl-breed-row { display: flex; flex-direction: column; margin-top: auto; gap: 2px; }
        .fpl-breed-th { font-size: 13px; font-weight: 700; color: ${F.inkSoft}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fpl-breed-en { font-size: 11px; font-weight: 500; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="fpl-page">
          <div className="fpl-body">
            <div className="fpl-header">
              <button className="fpl-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
              <h1 className="fpl-title">{statusFilter ? statusFilter : 'สมาชิกทั้งหมด'} <span className="count">({pets.length})</span></h1>
            </div>

            <div className="fpl-bar">
              <div>
                {statusFilter && (
                  <Link href={`/farm-dashboard/${farmId}/pets`} className="fpl-clear"><Icon.X /> เลิกกรอง (ดูทั้งหมด)</Link>
                )}
              </div>
              <Link href={`/farm-dashboard/${farmId}/pets/create`} className="fpl-add"><Icon.Plus /> เพิ่มสมาชิกใหม่</Link>
            </div>

            {pets.length === 0 ? (
              <div className="fpl-empty">
                <div className="fpl-empty-emoji">🐾</div>
                <h3 className="fpl-empty-title">{statusFilter ? `ไม่พบสมาชิกสถานะ "${statusFilter}"` : 'ฟาร์มของคุณยังไม่มีสัตว์เลี้ยง'}</h3>
                {!statusFilter && (
                  <>
                    <p className="fpl-empty-text">เริ่มเพิ่มพ่อแม่พันธุ์หรือเด็กๆ ที่พร้อมย้ายบ้านได้เลย</p>
                    <Link href={`/farm-dashboard/${farmId}/pets/create`} className="fpl-empty-btn">เพิ่มสัตว์เลี้ยงตัวแรก</Link>
                  </>
                )}
              </div>
            ) : (
              <div className="fpl-grid">
                {pets.map((pet) => {
                  const breed = formatBreed(pet.breed, pet.species);
                  const isFemale = pet.gender === 'female' || pet.gender === 'ตัวเมีย';
                  const st = pet.status ? statusStyle(pet.status) : null;
                  return (
                    <Link key={pet.id} href={`/pets/${pet.id}`} className="fpl-card">
                      <div className="fpl-photo">
                        {pet.image_url ? <img src={pet.image_url} alt={pet.name} /> : '🐾'}
                      </div>
                      <div className="fpl-info">
                        <div className="fpl-name-row">
                          <span className="fpl-name">{pet.name}</span>
                          {pet.birth_date && <span className="fpl-age">{calculateAge(pet.birth_date)}</span>}
                        </div>
                        <div className="fpl-tags">
                          <span className={`fpl-tag ${isFemale ? 'fpl-gender-f' : 'fpl-gender-m'}`}>{isFemale ? '♀ ตัวเมีย' : '♂ ตัวผู้'}</span>
                          {pet.status && st && <span className="fpl-tag" style={{ background: st.bg, color: st.color, borderColor: st.border }}>{pet.status}</span>}
                        </div>
                        <div className="fpl-breed-row">
                          <div className="fpl-breed-th">{breed.thai}</div>
                          {breed.eng && <div className="fpl-breed-en">{breed.eng}</div>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}