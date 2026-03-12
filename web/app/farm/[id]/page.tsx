"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicFarmProfile() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [farm, setFarm] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 State สำหรับระบบฟิลเตอร์
  const [filters, setFilters] = useState({
    breed: '',
    gender: '',
    color: '',
    pattern: '',
    coat: '',
    ear: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const fetchFarmProfile = async () => {
      try {
        const { data: farmData, error: farmError } = await supabase
          .from('farms')
          .select('*')
          .eq('id', farmId)
          .single();
          
        if (farmError) throw farmError;
        setFarm(farmData);

        // ดึงข้อมูลสัตว์เลี้ยงทุกตัว
        const { data: petsData } = await supabase
          .from('pets')
          .select('id, name, breed, image_url, gender, status, price, color, pattern, coat, ear')
          .eq('farm_id', farmId);
          
        if (petsData) setPets(petsData);

      } catch (error) {
        console.error("Error fetching farm:", error);
        alert("ไม่พบข้อมูลฟาร์มนี้ครับ");
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (farmId) fetchFarmProfile();
  }, [farmId, router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังเปิดประตูฟาร์ม... 🏡</div>;
  if (!farm) return null;

  // 🌟 ฟังก์ชันช่วยเช็คค่า (รองรับทั้งภาษาไทยและอังกฤษ ป้องกันบั๊ก)
  const isMatch = (petVal: string, filterVal: string, key: string) => {
    if (!filterVal) return true;
    if (key === 'gender') {
      if (filterVal === 'male') return petVal === 'male' || petVal === 'ตัวผู้';
      if (filterVal === 'female') return petVal === 'female' || petVal === 'ตัวเมีย';
    }
    return petVal === filterVal;
  };

  // 🌟 ฟังก์ชันคำนวณตัวเลือกฟิลเตอร์ที่มีอยู่จริง ตัดตัวหลอกทิ้ง
  const getAvailableOptions = (field: keyof typeof filters) => {
    const matchingPets = pets.filter(p => {
      return Object.keys(filters).every(key => {
        if (key === field) return true; // ข้ามฟิลด์ที่กำลังหาตัวเลือก
        return isMatch(p[key], filters[key as keyof typeof filters], key);
      });
    });
    return [...new Set(matchingPets.map(p => p[field]).filter(Boolean))];
  };

  // ดึงตัวเลือกมาแสดง
  const availableBreeds = getAvailableOptions('breed');
  const availableGendersDB = getAvailableOptions('gender');
  const availableColors = getAvailableOptions('color');
  const availablePatterns = getAvailableOptions('pattern');
  const availableCoats = getAvailableOptions('coat');
  const availableEars = getAvailableOptions('ear');

  // เช็คเพศจาก DB ให้แสดงปุ่มได้ถูกต้อง
  const hasMale = availableGendersDB.includes('male') || availableGendersDB.includes('ตัวผู้');
  const hasFemale = availableGendersDB.includes('female') || availableGendersDB.includes('ตัวเมีย');

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 🌟 กรองสัตว์เลี้ยงไปแสดงผล
  const filteredPets = pets.filter(pet => {
    return Object.keys(filters).every(key => isMatch(pet[key], filters[key as keyof typeof filters], key));
  });

  const readyToMovePets = filteredPets.filter(p => p.status === 'พร้อมย้ายบ้าน' || p.status === 'พร้อมย้าย');
  const breederPets = filteredPets.filter(p => p.status?.includes('พันธุ์'));
  const otherPets = filteredPets.filter(p => !p.status?.includes('พันธุ์') && p.status !== 'พร้อมย้ายบ้าน' && p.status !== 'พร้อมย้าย');

  const hasAnyFilter = Object.values(filters).some(val => val !== '');

  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-in fade-in duration-700">
      
      {/* 🌟 Header ปรับให้กระทัดรัด ไม่เทอะทะ */}
      <div className="h-24 md:h-32 bg-gradient-to-r from-pink-400 to-rose-400 relative">
        <button onClick={() => router.back()} className="absolute top-6 left-4 md:left-8 w-8 h-8 flex items-center justify-center bg-white/30 backdrop-blur-md hover:bg-white/50 text-white rounded-full transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-8 relative z-10">
        
        {/* กล่องโปรไฟล์ฟาร์ม (ย่อขนาดลง) */}
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex gap-4 items-center sm:items-start text-left">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full border-2 border-white shadow flex items-center justify-center text-3xl shrink-0 -mt-8 md:-mt-10 overflow-hidden">
               🏡
            </div>
            <div className="flex-1 pt-1">
              <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight leading-none">{farm.farm_name}</h1>
              <p className="text-xs font-medium text-gray-500 mt-1">{farm.description || 'ฟาร์มคุณภาพบนระบบ Whiskora'}</p>
              
              <div className="flex flex-wrap gap-2 pt-2.5">
                {farm.phone && (
                  <span className="bg-pink-50 text-pink-600 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    📞 {farm.phone}
                  </span>
                )}
                <span className="bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                  📍 {farm.address || 'ไม่ระบุที่อยู่'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 แถบ Filter แนวนอน (สไตล์แคปซูล/Pill) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            
            {/* ปุ่มเปิด/ปิด กรองละเอียด */}
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm ${showAdvancedFilters ? 'bg-pink-500 text-white border-pink-500 shadow-pink-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              กรองละเอียด
            </button>

            {/* แคปซูล: สายพันธุ์ */}
            <div className="relative shrink-0">
              <select 
                value={filters.breed} 
                onChange={e => handleFilterChange('breed', e.target.value)} 
                className={`appearance-none text-xs font-bold rounded-full px-4 py-2 pr-8 outline-none cursor-pointer border shadow-sm transition-colors ${filters.breed ? 'bg-pink-50 text-pink-600 border-pink-300' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                <option value="">สายพันธุ์</option>
                {availableBreeds.map(b => <option key={b as string} value={b as string}>{b as string}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* แคปซูล: เพศ */}
            <div className="relative shrink-0">
              <select 
                value={filters.gender} 
                onChange={e => handleFilterChange('gender', e.target.value)} 
                className={`appearance-none text-xs font-bold rounded-full px-4 py-2 pr-8 outline-none cursor-pointer border shadow-sm transition-colors ${filters.gender ? 'bg-pink-50 text-pink-600 border-pink-300' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                <option value="">เพศ</option>
                {hasMale && <option value="male">ตัวผู้ ♂️</option>}
                {hasFemale && <option value="female">ตัวเมีย ♀️</option>}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* ปุ่มเคลียร์ */}
            {hasAnyFilter && (
              <button 
                onClick={() => setFilters({breed: '', gender: '', color: '', pattern: '', coat: '', ear: ''})} 
                className="shrink-0 text-[10px] font-bold text-gray-400 hover:text-pink-500 px-2 py-2"
              >
                ล้าง ✕
              </button>
            )}
          </div>

          {/* 🌟 ตัวกรองละเอียด (ลักษณะทางพันธุกรรม) */}
          {showAdvancedFilters && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-top-2">
              <div className="relative">
                <label className="text-[9px] font-bold text-gray-400 ml-2 uppercase tracking-widest absolute -top-1.5 left-2 bg-white px-1">สี (Color)</label>
                <select value={filters.color} onChange={e => handleFilterChange('color', e.target.value)} className="w-full appearance-none bg-transparent border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-pink-300">
                  <option value="">ทั้งหมด</option>
                  {availableColors.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 mt-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></div>
              </div>

              <div className="relative">
                <label className="text-[9px] font-bold text-gray-400 ml-2 uppercase tracking-widest absolute -top-1.5 left-2 bg-white px-1">ลวดลาย</label>
                <select value={filters.pattern} onChange={e => handleFilterChange('pattern', e.target.value)} className="w-full appearance-none bg-transparent border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-pink-300">
                  <option value="">ทั้งหมด</option>
                  {availablePatterns.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 mt-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></div>
              </div>

              <div className="relative">
                <label className="text-[9px] font-bold text-gray-400 ml-2 uppercase tracking-widest absolute -top-1.5 left-2 bg-white px-1">ความยาวขน</label>
                <select value={filters.coat} onChange={e => handleFilterChange('coat', e.target.value)} className="w-full appearance-none bg-transparent border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-pink-300">
                  <option value="">ทั้งหมด</option>
                  {availableCoats.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 mt-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></div>
              </div>

              <div className="relative">
                <label className="text-[9px] font-bold text-gray-400 ml-2 uppercase tracking-widest absolute -top-1.5 left-2 bg-white px-1">ลักษณะหู</label>
                <select value={filters.ear} onChange={e => handleFilterChange('ear', e.target.value)} className="w-full appearance-none bg-transparent border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-pink-300">
                  <option value="">ทั้งหมด</option>
                  {availableEars.map(e => <option key={e as string} value={e as string}>{e as string}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 mt-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></div>
              </div>
            </div>
          )}
        </div>

        {/* 🌟 แสดงผลการค้นหา */}
        {filteredPets.length === 0 ? (
           <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 mt-4 shadow-sm">
             <div className="text-3xl mb-2 opacity-50">🔍</div>
             <h3 className="text-gray-800 font-bold text-sm">ไม่พบน้องๆ ที่ตรงกับเงื่อนไข</h3>
             <button onClick={() => setFilters({breed: '', gender: '', color: '', pattern: '', coat: '', ear: ''})} className="text-pink-500 text-xs font-bold mt-2 hover:underline">
               เคลียร์ตัวกรองทั้งหมด
             </button>
           </div>
        ) : (
          <div className="space-y-8">
            
            {/* โซนที่ 1: สัตว์เลี้ยงพร้อมย้ายบ้าน */}
            {readyToMovePets.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-black text-gray-800 tracking-tight flex items-center gap-1.5 px-1">
                  <span className="text-pink-500">🏠</span> เด็กๆ พร้อมย้ายบ้าน ({readyToMovePets.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {readyToMovePets.map(pet => (
                    <Link href={`/p/${pet.id}`} key={pet.id} className="bg-white rounded-2xl p-3 border border-pink-100 shadow-sm flex flex-col items-center text-center hover:border-pink-300 hover:shadow-md transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-pink-500 text-white text-[8px] font-black px-2 py-1 rounded-bl-lg z-10">พร้อมย้าย</div>
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-50 mb-2 group-hover:scale-105 transition-transform border-2 border-pink-50">
                        {pet.image_url ? <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>}
                      </div>
                      <h3 className="font-black text-gray-800 text-sm">{pet.name}</h3>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5 truncate w-full">{pet.breed || '-'}</p>
                      
                      <div className="mt-2 w-full bg-pink-50 rounded-lg py-1.5 border border-pink-100/50">
                        <p className="text-sm font-black text-pink-600">{pet.price ? `฿${pet.price.toLocaleString()}` : 'ทักแชท'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* โซนที่ 2: พ่อแม่พันธุ์ */}
            {breederPets.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-black text-gray-800 tracking-tight flex items-center gap-1.5 px-1">
                  <span className="text-blue-500">👑</span> พ่อแม่พันธุ์ประจำฟาร์ม ({breederPets.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {breederPets.map(pet => (
                    <Link href={`/p/${pet.id}`} key={pet.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-blue-300 hover:shadow-md transition-all group">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-50 mb-2 group-hover:scale-105 transition-transform border border-gray-100">
                        {pet.image_url ? <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>}
                      </div>
                      <h3 className="font-black text-gray-800 text-sm">{pet.name}</h3>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5 truncate w-full">{pet.breed || '-'}</p>
                      <div className="mt-2 w-full">
                        <div className={`rounded-lg py-1 px-1 ${pet.gender === 'male' || pet.gender === 'ตัวผู้' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
                          <p className="text-[9px] font-black">{pet.gender === 'male' || pet.gender === 'ตัวผู้' ? '👑 พ่อพันธุ์' : pet.gender === 'female' || pet.gender === 'ตัวเมีย' ? '👑 แม่พันธุ์' : '👑 พ่อแม่พันธุ์'}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* โซนที่ 3: สมาชิกอื่นๆ */}
            {otherPets.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-black text-gray-800 tracking-tight flex items-center gap-1.5 px-1">
                  <span className="text-gray-400">🐾</span> สมาชิกอื่นๆ ({otherPets.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {otherPets.map(pet => (
                    <Link href={`/p/${pet.id}`} key={pet.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-gray-300 hover:shadow-md transition-all group">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-50 mb-2 group-hover:scale-105 transition-transform border border-gray-100">
                        {pet.image_url ? <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>}
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm">{pet.name}</h3>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5 truncate w-full">{pet.breed || '-'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}

      </div>
    </div>
  );
}