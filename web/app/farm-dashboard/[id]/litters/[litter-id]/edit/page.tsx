"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';

interface Pet {
  id: number;
  name: string;
  gender: string;
}

export default function EditLitterPage() {
  const router = useRouter();
  const params = useParams();

  const farmId = params.id as string;
  const litterId = params['litter-id'] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [maleBreeders, setMaleBreeders] = useState<Pet[]>([]);
  const [femaleBreeders, setFemaleBreeders] = useState<Pet[]>([]);

  const [formData, setFormData] = useState({
    litter_code: '',
    sire_id: '',
    dam_id: '',
    mating_date: '',
    expected_birth_date: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push('/login');

        const { data: litterData, error: litterError } = await supabase
          .from('litters')
          .select('*')
          .eq('id', litterId)
          .single();

        if (litterError) throw litterError;

        if (litterData) {
          setFormData({
            litter_code: litterData.litter_code,
            sire_id: litterData.sire_id.toString(),
            dam_id: litterData.dam_id.toString(),
            mating_date: litterData.mating_date,
            expected_birth_date: litterData.expected_birth_date
          });
        }

        const { data: petsData } = await supabase
          .from('pets')
          .select('id, name, gender')
          .eq('farm_id', farmId)
          .in('status', ['พ่อพันธุ์ / แม่พันธุ์', 'พ่อพันธุ์', 'แม่พันธุ์']);

        if (petsData) {
          setMaleBreeders(petsData.filter(p => p.gender === 'male' || p.gender === 'ตัวผู้'));
          setFemaleBreeders(petsData.filter(p => p.gender === 'female' || p.gender === 'ตัวเมีย'));
        }

      } catch (error) {
        console.error('Error:', error);
        alert('ไม่พบข้อมูลครอกนี้ครับ');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    if (litterId && farmId) fetchData();
  }, [litterId, farmId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMatingDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    if (dateVal) {
      const matingDate = new Date(dateVal);
      matingDate.setDate(matingDate.getDate() + 65);
      const expectedDate = matingDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, mating_date: dateVal, expected_birth_date: expectedDate }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('litters')
        .update({
          litter_code: formData.litter_code,
          sire_id: parseInt(formData.sire_id),
          dam_id: parseInt(formData.dam_id),
          mating_date: formData.mating_date,
          expected_birth_date: formData.expected_birth_date
        })
        .eq('id', litterId);

      if (error) throw error;

      alert('อัปเดตข้อมูลการจับคู่เรียบร้อย!');
      router.replace(`/farm-dashboard/${farmId}`);
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `คุณต้องการยกเลิกการจับคู่ครอก "${formData.litter_code}" ใช่หรือไม่?\n\nข้อมูลจะถูกลบถาวรและรหัสครอกนี้จะถูกนำกลับมาใช้ใหม่ได้ทันที`
    );

    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('litters')
        .delete()
        .eq('id', litterId);

      if (error) throw error;

      alert('ยกเลิกการจับคู่และคืนรหัสครอกเรียบร้อยแล้ว');
      router.push(`/farm-dashboard/${farmId}`);
    } catch (error: any) {
      alert('ล้มเหลว: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .le-page { font-family: inherit; min-height: 100vh; color: #111827; background: #fffafc; }
        .le-body { max-width: 560px; margin: 0 auto; padding: 20px 16px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .le-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; }
        .le-back { width: 40px; height: 40px; border-radius: 12px; background: white; border: 1px solid #E5E7EB; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280; flex-shrink: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .15s; }
        .le-back:hover { background: #F9FAFB; color: #111827; }
        .le-title { font-size: 20px; font-weight: 800; color: #111827; margin: 0; }
        .le-code { font-size: 12px; font-weight: 700; color: #E84677; margin-top: 4px; }
        .le-card { background: white; border-radius: 24px; border: 1px solid #FBCFE8; padding: 28px; margin-bottom: 14px; }
        .le-label { display: block; font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px; margin-left: 4px; }
        .le-input { width: 100%; background: #F9FAFB; border: 1px solid #F3F4F6; border-radius: 16px; padding: 14px 20px; outline: none; font-size: 14px; font-weight: 700; color: #E84677; text-align: center; transition: border-color .15s; font-family: inherit; }
        .le-input:focus { border-color: #FBCFE8; background: white; }
        .le-select { width: 100%; background: #F9FAFB; border: 1px solid #F3F4F6; border-radius: 16px; padding: 14px 20px; outline: none; font-size: 14px; font-weight: 700; color: #111827; appearance: none; cursor: pointer; transition: border-color .15s; font-family: inherit; }
        .le-select:focus { border-color: #FBCFE8; background: white; }
        .le-date { width: 100%; background: #F9FAFB; border: 1px solid #F3F4F6; border-radius: 16px; padding: 0 16px; height: 48px; outline: none; font-size: 14px; font-weight: 700; color: #111827; text-align: center; transition: border-color .15s; font-family: inherit; }
        .le-date:focus { border-color: #FBCFE8; background: white; }
        .le-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .le-field { margin-bottom: 16px; }
        .le-field:last-child { margin-bottom: 0; }
        .le-delete { display: flex; justify-content: center; margin-top: 8px; }
        .le-delete-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 10px; border: 1px solid #FCA5A5; background: white; color: #DC2626; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background .15s; }
        .le-delete-btn:hover { background: #FEF2F2; }
        .le-delete-btn:disabled { opacity: .5; cursor: not-allowed; }
        .le-actions { display: flex; gap: 12px; margin-top: 24px; }
        .le-cancel-btn { flex: 0 0 auto; padding: 14px 22px; background: white; color: #4B5563; border: 1.5px solid #E5E7EB; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .le-save-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 14px; background: #E84677; color: white; font-size: 15px; font-weight: 700; border: none; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(232,70,119,0.3); transition: background .15s; }
        .le-save-btn:hover { background: #D63F6A; }
        .le-save-btn:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 480px) { .le-grid2 { grid-template-columns: 1fr; } }
      `}</style>

      <div className="le-page">
        <div className="le-body">
          <div className="le-header">
            <button onClick={() => router.back()} className="le-back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <h1 className="le-title">แก้ไขการจับคู่</h1>
              <p className="le-code">Litter Code: {formData.litter_code}</p>
            </div>
          </div>

          <div className="le-card">
            <form onSubmit={handleSubmit}>
              <div className="le-field">
                <label className="le-label">รหัสครอก (Litter Code)</label>
                <input required type="text" name="litter_code" value={formData.litter_code} onChange={handleChange} className="le-input" />
              </div>

              <div className="le-grid2">
                <div className="le-field">
                  <label className="le-label"><img src="/icons/icon-men.png" alt="" style={{width:14,height:14,objectFit:'contain',verticalAlign:'middle',marginRight:4}} />พ่อพันธุ์</label>
                  <select name="sire_id" value={formData.sire_id} onChange={handleChange} className="le-select">
                    {maleBreeders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="le-field">
                  <label className="le-label"><img src="/icons/icon-women.png" alt="" style={{width:14,height:14,objectFit:'contain',verticalAlign:'middle',marginRight:4}} />แม่พันธุ์</label>
                  <select name="dam_id" value={formData.dam_id} onChange={handleChange} className="le-select">
                    {femaleBreeders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="le-grid2">
                <div className="le-field">
                  <label className="le-label">วันที่บรีด</label>
                  <input type="date" name="mating_date" value={formData.mating_date} onChange={handleMatingDateChange} className="le-date" />
                </div>
                <div className="le-field" style={{ marginBottom: 0 }}>
                  <label className="le-label">กำหนดคลอด</label>
                  <input type="date" name="expected_birth_date" value={formData.expected_birth_date} onChange={handleChange} className="le-date" />
                </div>
              </div>
            </form>
          </div>

          <div className="le-delete">
            <button type="button" onClick={handleDelete} disabled={isSaving} className="le-delete-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              ยกเลิกการจับคู่บรีดนี้
            </button>
          </div>

          <div className="le-actions">
            <button type="button" className="le-cancel-btn" onClick={() => router.back()}>ยกเลิก</button>
            <button type="button" className="le-save-btn" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
