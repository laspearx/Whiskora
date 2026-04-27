"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827',
  inkSoft: '#4B5563',
  muted: '#9CA3AF',
  pink: '#E84677',
  pinkSoft: '#FDF2F5',
  teal: '#0D9488',
  tealSoft: '#F0FDFA',
  line: '#E5E7EB',
  paper: '#FFFFFF',
};

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  IDCard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="12" y2="16"/></svg>,
  Paw: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>,
  Syringe: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>,
  History: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
  Male: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><line x1="13.5" y1="10.5" x2="21" y2="3"/><polyline points="16 3 21 3 21 8"/></svg>,
  Female: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  Alert: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  ShieldCheck: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  Dna: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.598 3.597-1.198 5.397 0"/><path d="M9 2c1.798 1.598 3.597 1.198 5.397 0"/><path d="M2 9c6.667 6 13.333 0 20 6"/><path d="M12 10v4"/><path d="M16 11v2"/><path d="M8 11v2"/></svg>,
  HeartPulse: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>,
};

export default function PetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<any>(null);
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const splitThaiEnglish = (text: string | null) => {
    if (!text) return { th: '-', en: null };
    const parts = text.split('(');
    if (parts.length > 1) {
      return { th: parts[0].trim(), en: `(${parts[1].trim()}` };
    }
    return { th: text, en: null };
  };

  const displayVal = (val: string | number | null | undefined, suffix = '') => {
    if (val === null || val === undefined || val === '') return '-';
    return `${val}${suffix}`;
  };

  const renderBool = (val: boolean | null | undefined) => {
    if (val === true) return <span className="text-green-600 font-black">Yes</span>;
    if (val === false) return <span className="text-gray-400 font-bold">No</span>;
    return '-';
  };

  useEffect(() => {
    if (petId) fetchPetData();
  }, [petId]);

  const fetchPetData = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data: petData, error: petError } = await supabase
        .from('pets') 
        .select('*')
        .eq('id', petId)
        .eq('user_id', session.user.id) 
        .single();
        
      if (petError) throw petError;
      setPet(petData);

      const { data: vaccineData } = await supabase
        .from('vaccines')
        .select('*')
        .eq('pet_id', petId)
        .order('date_given', { ascending: false }); 
        
      if (vaccineData) setVaccines(vaccineData);
    } catch (error) {
      console.error("Fetch Error:", error);
      router.push('/profile');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAgeDetail = (birthDate: string | null) => {
    if (!birthDate) return '-';
    const dob = new Date(birthDate);
    if (isNaN(dob.getTime())) return '-';
    const today = new Date();
    
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const ageParts = [];
    if (years > 0) ageParts.push(`${years} ปี`);
    if (months > 0) ageParts.push(`${months} เดือน`);
    if (days > 0 && years === 0) ageParts.push(`${days} วัน`);

    return ageParts.length === 0 ? "เพิ่งเกิด" : ageParts.join(' ');
  };

  const groupedVaccines = [...new Set(vaccines.map(v => v.vaccine_name))].map(type => {
    const records = vaccines.filter(v => v.vaccine_name === type);
    return { name: type, latestRecord: records[0], totalCount: records.length };
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-sm font-semibold tracking-widest text-gray-400 animate-pulse uppercase">Loading Profile...</div>;
  if (!pet) return null;

  const breedData = splitThaiEnglish(pet.breed);
  const colorData = splitThaiEnglish(pet.color);

  return (
    <div className="min-h-screen pb-24 animate-in fade-in duration-500" style={{ fontFamily: 'var(--font-ui)', color: F.ink }}>
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        
        {/* 🔙 Sleek Header */}
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => router.push('/profile/pets')}
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl transition-all border border-gray-100 shadow-sm"
          >
            <Icon.ArrowLeft />
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight">Pet Profile</h1>
        </div>
        
        {/* 🌟 1. Pet Hero Card & Physical Attributes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
            <div className="w-32 h-32 md:w-36 md:h-36 shrink-0 relative rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-md">
              {pet.image_url ? (
                <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200"><Icon.Paw /></div>
              )}
            </div>
            
            <div className="flex-1 w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">{pet.name}</h1>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                      pet.gender === 'male' || pet.gender === 'ตัวผู้' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                    }`}>
                      {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? <><Icon.Male /> Male</> : <><Icon.Female /> Female</>}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-400">
                    {pet.species === 'cat' ? 'Cat' : pet.species === 'dog' ? 'Dog' : pet.species || 'Pet'}
                  </p>
                </div>

                {/* 🔘 Management Buttons */}
                <div className="flex items-center gap-3">
                  <Link href={`/pets/${pet.id}/edit`} className="bg-white hover:bg-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border border-gray-200 shadow-sm flex items-center gap-2">
                    <Icon.Edit /> Edit
                  </Link>
                  <Link href={`/pets/${pet.id}/id-card`} className="bg-white hover:bg-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border border-gray-200 shadow-sm flex items-center gap-2">
                    <Icon.IDCard /> ID Card
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Physical Attributes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Breed', val: breedData.th, sub: breedData.en },
              { label: 'Color', val: colorData.th, sub: colorData.en },
              { label: 'Birthdate', val: pet.birth_date ? new Date(pet.birth_date).toLocaleDateString('th-TH') : '-' },
              { label: 'Age', val: calculateAgeDetail(pet.birth_date), highlight: true },
              { label: 'Weight', val: displayVal(pet.weight, ' kg') },
              { label: 'Pattern', val: displayVal(pet.pattern) },
              { label: 'Coat', val: displayVal(pet.coat) },
              { label: 'Eye Color', val: displayVal(pet.eye_color) },
              { label: 'Ear Type', val: displayVal(pet.ear) },
              { label: 'Leg Type', val: displayVal(pet.leg) },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 flex flex-col justify-center">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">{item.label}</p>
                <p className={`text-sm font-bold truncate ${item.highlight ? 'text-pink-600' : 'text-gray-900'}`}>{item.val}</p>
                {item.sub && <p className="text-[10px] font-medium text-gray-400 truncate mt-0.5">{item.sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* 🛡️ 2. Official Identity & Lineage (Split Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
              <span className="text-gray-400"><Icon.ShieldCheck /></span> Official Identity
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Microchip Number</p>
                <p className={`text-sm font-mono tracking-wider ${pet.microchip_number ? 'text-gray-900 font-bold' : 'text-gray-300 font-medium'}`}>
                  {pet.microchip_number || 'NOT REGISTERED'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Pedigree Number</p>
                <p className={`text-sm font-mono tracking-wider ${pet.pedigree_number ? 'text-gray-900 font-bold' : 'text-gray-300 font-medium'}`}>
                  {pet.pedigree_number || 'NOT REGISTERED'}
                </p>
              </div>
            </div>
          </div>

          {/* Lineage Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
              <span className="text-pink-400"><Icon.Dna /></span> Lineage
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Sire (พ่อพันธุ์)</p>
                <p className="text-sm font-bold text-gray-800">{displayVal(pet.sire_id)}</p>
              </div>
              <div>
                <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest mb-1">Dam (แม่พันธุ์)</p>
                <p className="text-sm font-bold text-gray-800">{displayVal(pet.dam_id)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🏥 3. Medical & Care Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2 mb-6">
            <span className="p-1.5 bg-red-50 text-red-500 rounded-lg"><Icon.HeartPulse /></span>
            Medical & Care Profile
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Neutered (ทำหมัน)</p>
              <div className="text-sm">{renderBool(pet.is_neutered)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Blood Type</p>
              <p className="text-sm font-bold text-red-600">{displayVal(pet.blood_type)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 col-span-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Chronic Diseases (โรคประจำตัว)</p>
              <p className="text-sm font-bold text-gray-800 truncate">{displayVal(pet.chronic_diseases)}</p>
            </div>
          </div>

          {/* Warnings & Notes inside Medical Profile */}
          {(pet.allergies || pet.traits) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              {pet.allergies && (
                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0"><Icon.Alert /></div>
                  <div>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-0.5">Allergies (สิ่งที่แพ้)</p>
                    <p className="text-sm font-bold text-red-900">{pet.allergies}</p>
                  </div>
                </div>
              )}
              {pet.traits && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Icon.Edit /></div>
                  <div>
                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-0.5">General Notes (หมายเหตุ)</p>
                    <p className="text-sm font-bold text-blue-900">{pet.traits}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 💉 4. Vaccine Dashboard */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <h2 className="text-lg font-extrabold flex items-center gap-3">
              <span className="p-2 bg-teal-50 text-teal-600 rounded-lg border border-teal-100"><Icon.Syringe /></span>
              Vaccine Record
            </h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href={`/pets/${pet.id}/vaccines`} className="flex-1 sm:flex-none text-center text-xs bg-white text-gray-600 px-5 py-2.5 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                <Icon.History /> Full History
              </Link>
              <Link href={`/pets/${pet.id}/vaccines/create`} className="flex-1 sm:flex-none text-center text-xs bg-white text-gray-600 px-5 py-2.5 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                <Icon.Plus /> New Record
              </Link>
            </div>
          </div>

          {groupedVaccines.length === 0 ? (
            <div className="text-center py-12 text-gray-300 font-semibold text-xs border border-dashed border-gray-200 rounded-2xl uppercase tracking-widest">
              No vaccination records found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedVaccines.map((group, idx) => {
                const isLiquid = group.name.includes('เห็บ') || group.name.includes('หยด');
                const isPill = group.name.includes('พยาธิ');
                
                return (
                  <Link 
                    key={idx} 
                    href={`/pets/${pet.id}/vaccines?type=${encodeURIComponent(group.name)}`} 
                    className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-teal-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-lg border border-teal-100 group-hover:scale-105 transition-transform">
                        {isLiquid ? '💧' : isPill ? '💊' : <Icon.Syringe />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{group.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">{group.totalCount} times recorded</p>
                      </div>
                      <div className="text-gray-300 group-hover:text-teal-500 transition-colors"><Icon.ChevronRight /></div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3.5 flex justify-between items-center">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Latest</p>
                        <p className="text-xs font-bold text-gray-700">{new Date(group.latestRecord.date_given).toLocaleDateString('th-TH')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${group.latestRecord.next_due ? 'text-pink-500' : 'text-gray-400'}`}>Next Appointment</p>
                        <p className={`text-xs font-bold ${group.latestRecord.next_due ? 'text-pink-600 font-extrabold' : 'text-gray-400'}`}>
                          {group.latestRecord.next_due ? new Date(group.latestRecord.next_due).toLocaleDateString('th-TH') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}