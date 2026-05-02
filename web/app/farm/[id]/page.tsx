"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicFarmProfile() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [farm, setFarm] = useState<import('@/lib/types').Farm | null>(null);
  const [pets, setPets] = useState<import('@/lib/types').Pet[]>([]);
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

        // 🌟 ดึงข้อมูลสัตว์เลี้ยง "ทุกตัว" ในฟาร์ม (เอา .in('status') ออกแล้ว)
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

  // 🌟 ฟังก์ชันอัจฉริยะ: คำนวณตัวเลือกฟิลเตอร์ที่ "มีอยู่จริง" ตามเงื่อนไขที่เลือกไว้
  const getAvailableOptions = (field: keyof typeof filters) => {
    const matchingPets = pets.filter(p => {
      // เช็คว่าแมวตัวนี้ตรงกับฟิลเตอร์ "อื่นๆ" ที่กำลังเลือกอยู่ไหม (ยกเว้นตัวมันเอง)
      return Object.keys(filters).every(key => {
        const filterKey = key as keyof typeof filters;
        if (filterKey === field) return true; // ข้ามฟิลด์ที่กำลังหาตัวเลือก
        if (!filters[filterKey]) return true; // ถ้าไม่ได้เลือกฟิลเตอร์นี้ ให้ผ่าน
        return p[filterKey] === filters[filterKey];
      });
    });
    // ดึงค่าที่ไม่ซ้ำกันออกมา
    return [...new Set(matchingPets.map(p => p[field]).filter(Boolean))];
  };

  // ดึงตัวเลือกที่แสดงได้จริง
  const availableBreeds = getAvailableOptions('breed');
  const availableGenders = getAvailableOptions('gender');
  const availableColors = getAvailableOptions('color');
  const availablePatterns = getAvailableOptions('pattern');
  const availableCoats = getAvailableOptions('coat');
  const availableEars = getAvailableOptions('ear');

  // 🌟 ฟังก์ชันอัปเดตฟิลเตอร์ และล้างค่าลูกข่ายหากค่าที่เลือกไว้ไม่มีแล้ว
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 🌟 ฟังก์ชันกรองสัตว์เลี้ยงตามฟิลเตอร์ทั้งหมด
  const filteredPets = pets.filter(pet => {
    if (filters.breed && pet.breed !== filters.breed) return false;
    if (filters.gender && pet.gender !== filters.gender) return false;
    if (filters.color && pet.color !== filters.color) return false;
    if (filters.pattern && pet.pattern !== filters.pattern) return false;
    if (filters.coat && pet.coat !== filters.coat) return false;
    if (filters.ear && pet.ear !== filters.ear) return false;
    return true;
  });

  // 🌟 แยกหมวดหมู่หลังจากกรองแล้ว
  const readyToMovePets = filteredPets.filter(p => p.status === 'พร้อมย้ายบ้าน' || p.status === 'พร้อมย้าย');
  const breederPets = filteredPets.filter(p => p.status?.includes('พันธุ์'));
  // แมวทั่วไป คือตัวที่ไม่ได้พร้อมย้าย และไม่ใช่พ่อแม่พันธุ์
  const otherPets = filteredPets.filter(p => !p.status?.includes('พันธุ์') && p.status !== 'พร้อมย้ายบ้าน' && p.status !== 'พร้อมย้าย');

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700">
      
      {/* 🌟 Header ปรับสัดส่วนให้สมูทขึ้น ไม่เทอะทะ */}
      <div className="h-32 md:h-48 bg-gradient-to-r from-pink-400 to-rose-400 relative">
        <button onClick={() => router.back()} className="absolute top-6 left-4 md:left-8 w-10 h-10 flex items-center justify-center bg-white/30 backdrop-blur-md hover:bg-white/50 text-white rounded-xl transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-10 relative z-10">
        
        {/* กล่องโปรไฟล์ฟาร์ม */}
        <div className="bg-white rounded-[2rem] p-5 md:p-8 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-4xl shrink-0 -mt-10 sm:-mt-14 overflow-hidden">
               🏡
            </div>
            
            <div className="flex-1 space-y-1.5 w-full">
              <h1 className="text-xl md:text-3xl font-black text-gray-800 tracking-tight">{farm.farm_name}</h1>
              <p className="text-xs md:text-sm font-medium text-gray-500">{farm.description || 'ฟาร์มคุณภาพบนระบบ Whiskora'}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                {farm.phone && (
                  <span className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    📞 {farm.phone}
                  </span>
                )}
                <span className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  📍 {farm.address || 'ไม่ระบุที่อยู่'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 ตัวกรอง (Filters) อัจฉริยะ */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔍</span>
              <div>
                <h3 className="text-sm font-bold text-gray-800">ค้นหาสัตว์เลี้ยงในฟาร์ม</h3>
                <p className="text-[10px] text-gray-400 font-medium">มีสมาชิกทั้งหมด {pets.length} ตัว</p>
              </div>
            </div>

            {/* ปุ่มเคลียร์ฟิลเตอร์ (โชว์เมื่อมีการเลือกฟิลเตอร์) */}
            {Object.values(filters).some(val => val !== '') && (
              <button 
                onClick={() => setFilters({breed: '', gender: '', color: '', pattern: '', coat: '', ear: ''})} 
                className="bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] uppercase font-bold rounded-lg px-3 py-2 transition-all self-start md:self-auto"
              >
                ล้างตัวกรอง ✕
              </button>
            )}
          </div>
          
          {/* ตัวกรองพื้นฐาน */}
          <div className="flex flex-wrap gap-3">
            <select value={filters.breed} onChange={e => handleFilterChange('breed', e.target.value)} className="bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:border-pink-300 min-w-[140px] cursor-pointer appearance-none flex-1 md:flex-none">
              <option value="">ทุกสายพันธุ์</option>
              {availableBreeds.map(b => <option key={b as string} value={b as string}>{b as string}</option>)}
            </select>

            <select value={filters.gender} onChange={e => handleFilterChange('gender', e.target.value)} className="bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:border-pink-300 min-w-[120px] cursor-pointer appearance-none flex-1 md:flex-none">
              <option value="">ทุกเพศ</option>
              {availableGenders.includes('male') && <option value="male">ตัวผู้ ♂️</option>}
              {availableGenders.includes('female') && <option value="female">ตัวเมีย ♀️</option>}
            </select>

            {/* ปุ่มเปิด/ปิด ตัวกรองขั้นสูง */}
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`text-xs font-bold rounded-xl px-4 py-3 transition-all flex items-center gap-2 border w-full md:w-auto justify-center ${showAdvancedFilters ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
              🧬 {showAdvancedFilters ? 'ซ่อนตัวกรองละเอียด' : 'กรองละเอียด (พันธุกรรม)'}
              <svg className={`w-3 h-3 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          {/* ตัวกรองขั้นสูง (พันธุกรรม) */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-50 animate-in slide-in-from-top-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 ml-1">สี (Color)</label>
                <select value={filters.color} onChange={e => handleFilterChange('color', e.target.value)} className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-pink-300 appearance-none">
                  <option value="">ทั้งหมด</option>
                  {availableColors.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 ml-1">ลวดลาย (Pattern)</label>
                <select value={filters.pattern} onChange={e => handleFilterChange('pattern', e.target.value)} className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-pink-300 appearance-none">
                  <option value="">ทั้งหมด</option>
                  {availablePatterns.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 ml-1">ความยาวขน (Coat)</label>
                <select value={filters.coat} onChange={e => handleFilterChange('coat', e.target.value)} className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-pink-300 appearance-none">
                  <option value="">ทั้งหมด</option>
                  {availableCoats.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 ml-1">ลักษณะหู (Ear)</label>
                <select value={filters.ear} onChange={e => handleFilterChange('ear', e.target.value)} className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-pink-300 appearance-none">
                  <option value="">ทั้งหมด</option>
                  {availableEars.map(e => <option key={e as string} value={e as string}>{e as string}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {filteredPets.length === 0 ? (
           <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 mt-6 shadow-sm">
             <div className="text-4xl mb-3 opacity-50">🔍</div>
             <h3 className="text-gray-800 font-bold">ไม่พบน้องๆ ที่ตรงกับเงื่อนไขค้นหา</h3>
             <p className="text-gray-400 text-xs mt-1">ลองล้างตัวกรอง แล้วค้นหาใหม่อีกครั้งนะครับ</p>
           </div>
        ) : (
          <div className="space-y-10">
            
            {/* 🌟 โซนที่ 1: สัตว์เลี้ยงพร้อมย้ายบ้าน */}
            {readyToMovePets.length > 0 && (
              <div className="space-y-4 bg-pink-50/30 p-4 md:p-6 rounded-[2rem] border border-pink-50">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 shadow-sm border border-pink-200">🏠</div>
                  <h2 className="text-lg font-black text-gray-800 tracking-tight">เด็กๆ พร้อมย้ายบ้าน ({readyToMovePets.length})</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {readyToMovePets.map(pet => (
                    <Link href={`/p/${pet.id}`} key={pet.id} className="bg-white rounded-[1.5rem] p-4 border border-pink-100 shadow-sm flex flex-col items-center text-center hover:border-pink-300 hover:shadow-md transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-pink-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl z-10">
                        พร้อมย้าย
                      </div>
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gray-50 mb-3 group-hover:scale-105 transition-transform border-2 border-pink-50">
                        {pet.image_url ? (
                          <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
                        )}
                      </div>
                      <h3 className="font-black text-gray-800 text-sm md:text-base">{pet.name}</h3>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5 truncate w-full">{pet.breed || 'ไม่ระบุสายพันธุ์'}</p>
                      
                      <div className="mt-3 w-full bg-pink-50/50 rounded-xl py-2 px-2 border border-pink-100/50">
                        <p className="text-[9px] text-pink-400 font-bold uppercase tracking-wider mb-0.5">ค่าตัว / สินสอด</p>
                        <p className="text-sm font-black text-pink-600">
                          {pet.price ? `฿${pet.price.toLocaleString()}` : 'ทักแชทสอบถาม'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 🌟 โซนที่ 2: พ่อแม่พันธุ์ */}
            {breederPets.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 shadow-sm border border-blue-200">👑</div>
                  <h2 className="text-lg font-black text-gray-800 tracking-tight">พ่อแม่พันธุ์ประจำฟาร์ม ({breederPets.length})</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {breederPets.map(pet => (
                    <Link href={`/p/${pet.id}`} key={pet.id} className="bg-white rounded-[1.5rem] p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-blue-300 hover:shadow-md transition-all group">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gray-50 mb-3 group-hover:scale-105 transition-transform border-2 border-blue-50">
                        {pet.image_url ? (
                          <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
                        )}
                      </div>
                      <h3 className="font-black text-gray-800 text-sm md:text-base">{pet.name}</h3>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5 truncate w-full">{pet.breed || 'ไม่ระบุสายพันธุ์'}</p>
                      
                      <div className="mt-3 w-full">
                        <div className={`rounded-xl py-1.5 px-2 ${pet.gender === 'male' || pet.gender === 'ตัวผู้' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
                          <p className="text-[10px] font-black">
                            {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? '👑 พ่อพันธุ์' : 
                             pet.gender === 'female' || pet.gender === 'ตัวเมีย' ? '👑 แม่พันธุ์' : 
                             '👑 พ่อแม่พันธุ์'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 🌟 โซนที่ 3: สมาชิกอื่นๆ ในบ้าน (ตัวที่ไม่ได้ตั้งสถานะพิเศษ) */}
            {otherPets.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shadow-sm border border-gray-300">🐾</div>
                  <h2 className="text-lg font-black text-gray-800 tracking-tight">สมาชิกอื่นๆ ในฟาร์ม ({otherPets.length})</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {otherPets.map(pet => (
                    <Link href={`/p/${pet.id}`} key={pet.id} className="bg-white rounded-[1.5rem] p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-gray-300 hover:shadow-md transition-all group">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-50 mb-3 group-hover:scale-105 transition-transform border border-gray-100">
                        {pet.image_url ? (
                          <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm">{pet.name}</h3>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5 truncate w-full">{pet.breed || 'ไม่ระบุสายพันธุ์'}</p>
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