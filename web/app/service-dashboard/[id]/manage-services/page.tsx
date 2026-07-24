"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";
import { Suspense } from "react";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  green: '#16A34A', greenSoft: '#F0FDF4',
  line: '#F3F4F6', lineMid: '#E5E7EB',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  Eye: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
};

type ServiceItem = { id: number; name: string; description: string | null; price: number | null; duration_min: number | null };
type Draft = { name: string; description: string; price: string; duration_min: string };

const blankDraft = (): Draft => ({ name: '', description: '', price: '', duration_min: '' });

function ManageServicesContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const serviceId = params.id as string;
  const fromPage = searchParams.get("from") || "profile";

  const [service, setService] = useState<any>(null);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: svc } = await supabase.from("services").select("*").eq("id", serviceId).eq("user_id", session.user.id).single();
      if (!svc) { router.push("/partner"); return; }
      setService(svc);
      const { data: its } = await supabase.from("service_items").select("*").eq("service_id", serviceId).order("id");
      setItems(its || []);
      setLoading(false);
    };
    if (serviceId) load();
  }, [serviceId, router]);

  const openAdd = () => { setDraft(blankDraft()); setEditId(null); setShowForm(true); };
  const openEdit = (item: ServiceItem) => {
    setDraft({ name: item.name, description: item.description || '', price: item.price?.toString() || '', duration_min: item.duration_min?.toString() || '' });
    setEditId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) return alert("กรุณาใส่ชื่อบริการ");
    setSaving(true);
    try {
      const payload = {
        service_id: Number(serviceId),
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price: draft.price ? parseInt(draft.price) : null,
        duration_min: draft.duration_min ? parseInt(draft.duration_min) : null,
      };
      if (editId) {
        const { error } = await supabase.from("service_items").update(payload).eq("id", editId);
        if (error) throw error;
        setItems(prev => prev.map(i => i.id === editId ? { ...i, ...payload } : i));
      } else {
        const { data, error } = await supabase.from("service_items").insert(payload).select().single();
        if (error) throw error;
        setItems(prev => [...prev, data]);
      }
      setShowForm(false);
    } catch (e: any) { alert("บันทึกไม่สำเร็จ: " + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบรายการนี้?")) return;
    const { error } = await supabase.from("service_items").delete().eq("id", id);
    if (!error) setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleTogglePublish = async () => {
    if (!service) return;
    if (!service.is_published && items.length === 0) {
      alert("กรุณาเพิ่มรายการบริการอย่างน้อย 1 รายการก่อนเปิดให้แสดง");
      return;
    }
    setToggling(true);
    const { error } = await supabase.from("services").update({ is_published: !service.is_published }).eq("id", serviceId);
    if (!error) setService((prev: any) => ({ ...prev, is_published: !prev.is_published }));
    else alert("เกิดข้อผิดพลาด: " + error.message);
    setToggling(false);
  };

  if (loading) return <PageLoader />;

  const isPublished = service?.is_published;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ms-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: #FDF6F8; }
        .ms-body { max-width: 640px; margin: 0 auto; padding: 24px 20px 80px; }
        .ms-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .ms-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .ms-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .ms-title { font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.1; }
        .ms-sub { font-size: 12px; font-weight: 700; color: ${F.blue}; margin-top: 2px; }

        /* publish banner */
        .ms-banner { border-radius: 18px; padding: 16px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .ms-banner.off { background: #FFF7ED; border: 1px solid #FDE68A; }
        .ms-banner.on { background: ${F.greenSoft}; border: 1px solid #BBF7D0; }
        .ms-banner-text { font-size: 13px; font-weight: 600; }
        .ms-banner.off .ms-banner-text { color: #92400E; }
        .ms-banner.on .ms-banner-text { color: #166534; }
        .ms-banner-label { font-size: 11px; font-weight: 700; opacity: 0.7; display: block; margin-bottom: 2px; }
        .ms-toggle-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 11px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .18s; white-space: nowrap; flex-shrink: 0; }
        .ms-toggle-btn.publish { background: ${F.green}; color: white; }
        .ms-toggle-btn.publish:hover { background: #15803D; }
        .ms-toggle-btn.unpublish { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
        .ms-toggle-btn.unpublish:hover { background: #FEE2E2; }
        .ms-toggle-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* section */
        .ms-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .ms-sec-title { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .ms-add-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 11px; background: ${F.blue}; color: white; border: none; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .15s; }
        .ms-add-btn:hover { background: #1D4ED8; }

        /* item list */
        .ms-empty { background: white; border: 1.5px dashed ${F.lineMid}; border-radius: 16px; padding: 40px; text-align: center; color: ${F.muted}; font-size: 14px; font-weight: 600; }
        .ms-item { background: white; border: 1px solid ${F.line}; border-radius: 16px; padding: 16px 18px; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 14px; }
        .ms-item-body { flex: 1; min-width: 0; }
        .ms-item-name { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .ms-item-desc { font-size: 12px; color: ${F.muted}; margin-top: 2px; line-height: 1.5; }
        .ms-item-meta { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
        .ms-item-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .ms-item-badge.price { background: ${F.pinkSoft}; color: ${F.pink}; }
        .ms-item-badge.dur { background: ${F.blueSoft}; color: ${F.blue}; }
        .ms-item-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .ms-icon-btn { width: 32px; height: 32px; border-radius: 9px; border: 1px solid ${F.lineMid}; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; color: ${F.muted}; }
        .ms-icon-btn:hover { color: ${F.blue}; border-color: ${F.blueBorder}; background: ${F.blueSoft}; }
        .ms-icon-btn.del:hover { color: #EF4444; border-color: #FECACA; background: #FEF2F2; }

        /* modal */
        .ms-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; padding: 0; }
        @media (min-width: 500px) { .ms-overlay { align-items: center; padding: 20px; } }
        .ms-modal { background: white; width: 100%; max-width: 480px; border-radius: 24px 24px 0 0; padding: 24px 20px 32px; }
        @media (min-width: 500px) { .ms-modal { border-radius: 24px; } }
        .ms-modal-title { font-size: 17px; font-weight: 700; color: ${F.ink}; margin-bottom: 20px; }
        .ms-mfield { margin-bottom: 14px; }
        .ms-mlabel { display: block; font-size: 12px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; }
        .ms-req { color: ${F.pink}; }
        .ms-minput, .ms-mtextarea { width: 100%; padding: 11px 13px; border: 1px solid ${F.lineMid}; border-radius: 11px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; background: #F9FAFB; }
        .ms-minput:focus, .ms-mtextarea:focus { border-color: ${F.pinkBorder}; background: white; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .ms-mtextarea { resize: none; }
        .ms-mgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ms-mbtns { display: flex; gap: 10px; margin-top: 20px; }
        .ms-mcancel { flex: 0 0 auto; padding: 13px 20px; border-radius: 13px; background: ${F.line}; color: ${F.inkSoft}; border: none; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .ms-msave { flex: 1; padding: 13px; border-radius: 13px; background: ${F.pink}; color: white; border: none; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(232,70,119,0.25); }
        .ms-msave:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="ms-page">
        <div className="ms-body">
          <div className="ms-header">
            <button className="ms-back" onClick={() => router.push(`/service-dashboard/${serviceId}?from=${fromPage}`)} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="ms-title">รายการบริการ</h1>
              <p className="ms-sub">{service?.service_name}</p>
            </div>
          </div>

          {/* Publish toggle */}
          <div className={`ms-banner ${isPublished ? 'on' : 'off'}`}>
            <div>
              <span className="ms-banner-label">สถานะการแสดงผล</span>
              <div className="ms-banner-text">
                {isPublished ? 'แสดงอยู่ในหน้ารวมบริการแล้ว' : 'ยังไม่แสดงในหน้ารวมบริการ — เพิ่มบริการและกด "เปิดแสดง"'}
              </div>
            </div>
            <button
              className={`ms-toggle-btn ${isPublished ? 'unpublish' : 'publish'}`}
              onClick={handleTogglePublish}
              disabled={toggling}
            >
              {isPublished ? <><Icon.EyeOff /> ซ่อน</> : <><Icon.Eye /> เปิดแสดง</>}
            </button>
          </div>

          {/* Service items */}
          <div className="ms-sec-head">
            <h2 className="ms-sec-title">บริการและราคา</h2>
            <button className="ms-add-btn" onClick={openAdd}><Icon.Plus /> เพิ่มบริการ</button>
          </div>

          {items.length === 0 ? (
            <div className="ms-empty">ยังไม่มีรายการบริการ<br />กด "เพิ่มบริการ" เพื่อเริ่มต้น</div>
          ) : (
            items.map(item => (
              <div key={item.id} className="ms-item">
                <div className="ms-item-body">
                  <div className="ms-item-name">{item.name}</div>
                  {item.description && <div className="ms-item-desc">{item.description}</div>}
                  <div className="ms-item-meta">
                    {item.price != null && <span className="ms-item-badge price">฿{item.price.toLocaleString()}</span>}
                    {item.duration_min != null && <span className="ms-item-badge dur">{item.duration_min} นาที</span>}
                  </div>
                </div>
                <div className="ms-item-actions">
                  <button className="ms-icon-btn" onClick={() => openEdit(item)} title="แก้ไข">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                  </button>
                  <button className="ms-icon-btn del" onClick={() => handleDelete(item.id)} title="ลบ"><Icon.Trash /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="ms-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="ms-modal">
            <div className="ms-modal-title">{editId ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่'}</div>
            <div className="ms-mfield">
              <label className="ms-mlabel">ชื่อบริการ <span className="ms-req">*</span></label>
              <input className="ms-minput" placeholder="เช่น อาบน้ำแมว, ฉีดวัคซีนรายปี" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="ms-mfield">
              <label className="ms-mlabel">รายละเอียดเพิ่มเติม</label>
              <textarea className="ms-mtextarea" rows={2} placeholder="เช่น รวมบริการตัดเล็บและเช็ดหู" value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
            </div>
            <div className="ms-mgrid">
              <div className="ms-mfield" style={{ marginBottom: 0 }}>
                <label className="ms-mlabel">ราคา (บาท)</label>
                <input type="number" className="ms-minput" placeholder="เช่น 350" value={draft.price} onChange={e => setDraft(d => ({ ...d, price: e.target.value }))} />
              </div>
              <div className="ms-mfield" style={{ marginBottom: 0 }}>
                <label className="ms-mlabel">ระยะเวลา (นาที)</label>
                <input type="number" className="ms-minput" placeholder="เช่น 60" value={draft.duration_min} onChange={e => setDraft(d => ({ ...d, duration_min: e.target.value }))} />
              </div>
            </div>
            <div className="ms-mbtns">
              <button className="ms-mcancel" onClick={() => setShowForm(false)}>ยกเลิก</button>
              <button className="ms-msave" onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ManageServicesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ManageServicesContent />
    </Suspense>
  );
}
