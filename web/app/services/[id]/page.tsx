"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Share: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

const CATEGORY_LABEL: Record<string, string> = {
  grooming: 'อาบน้ำตัดขน', transport: 'รับส่งสัตว์เลี้ยง',
  cat_hotel: 'โรงแรมสัตว์', pet_care: 'บริการดูแลสัตว์เลี้ยง',
  clinic: 'คลินิก / โรงพยาบาลสัตว์',
};

export default function PublicServiceProfile() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [service, setService] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [myPets, setMyPets] = useState<{ id: number; name: string }[]>([]);
  const [myPendingBooking, setMyPendingBooking] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingItemId, setBookingItemId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingPetId, setBookingPetId] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingToast, setBookingToast] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data, error } = await supabase.from('services').select('*').eq('id', serviceId).single();
        if (error || !data) { router.push('/service-hub'); return; }
        setService(data);
        const { data: itemsData } = await supabase.from('service_items').select('*').eq('service_id', serviceId).order('id');
        setItems(itemsData || []);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionUserId(session.user.id);
          const { data: petsData } = await supabase.from('pets').select('id, name').eq('user_id', session.user.id).order('name');
          setMyPets(petsData || []);
          const { data: existingBooking } = await supabase
            .from('service_bookings')
            .select('id')
            .eq('service_id', serviceId)
            .eq('buyer_id', session.user.id)
            .eq('status', 'pending')
            .maybeSingle();
          setMyPendingBooking(!!existingBooking);
        }
      } catch { router.push('/service-hub'); }
      finally { setLoading(false); }
    };
    if (serviceId) fetchService();
  }, [serviceId, router]);

  const openBookingModal = () => {
    if (!sessionUserId) { router.push(`/login?redirect=${encodeURIComponent(`/services/${serviceId}`)}`); return; }
    setBookingError('');
    setBookingItemId(items[0] ? String(items[0].id) : '');
    setBookingDate('');
    setBookingTime('');
    setBookingPetId('');
    setBookingNotes('');
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async () => {
    if (!sessionUserId) return;
    if (!bookingDate) { setBookingError('กรุณาเลือกวันที่'); return; }
    setBookingSubmitting(true);
    setBookingError('');
    try {
      const selectedItem = items.find(i => String(i.id) === bookingItemId);
      const { error } = await supabase.from('service_bookings').insert({
        service_id: Number(serviceId),
        service_item_id: selectedItem ? selectedItem.id : null,
        buyer_id: sessionUserId,
        pet_id: bookingPetId ? Number(bookingPetId) : null,
        booking_date: bookingDate,
        booking_time: bookingTime || null,
        service_type: selectedItem ? selectedItem.name : null,
        notes: bookingNotes.trim() || null,
        status: 'pending',
      });
      if (error) throw error;
      setShowBookingModal(false);
      setMyPendingBooking(true);
      setBookingToast(true);
      setTimeout(() => setBookingToast(false), 2500);
    } catch (e: any) {
      setBookingError('ส่งคำขอจองไม่สำเร็จ: ' + e.message);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: service?.service_name, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };

  if (loading) return <PageLoader />;
  if (!service) return null;

  const mapQuery = service.lat && service.lng
    ? `${service.lat},${service.lng}`
    : encodeURIComponent(service.address || service.service_name);
  const mapsUrl = `https://maps.google.com/?q=${mapQuery}`;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .sp-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; background: transparent; }
        .sp-body { max-width: 960px; margin: 0 auto; padding-bottom: 100px; }
        .sp-cover { position: relative; aspect-ratio: 3/1; min-height: 140px; background: linear-gradient(135deg, ${F.blueSoft}, #DBEAFE); overflow: hidden; width: 100vw; left: 50%; transform: translateX(-50%); }
        .sp-cover img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
        .sp-cover-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.15), transparent 40%); }
        .sp-cover-top { position: absolute; top: 16px; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; z-index: 2; }
        .sp-cover-btn { width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); color: ${F.ink}; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; box-shadow: 0 2px 10px rgba(0,0,0,0.12); transition: all .15s; }
        .sp-identity { background: white; border-radius: 24px 24px 0 0; margin-top: -24px; position: relative; z-index: 3; padding: 0 24px 24px; }
        .sp-id-row { display: flex; align-items: flex-end; gap: 18px; padding-top: 14px; flex-wrap: wrap; }
        .sp-avatar { width: 100px; height: 100px; border-radius: 50%; border: 4px solid white; margin-top: -62px; overflow: hidden; background: ${F.blueSoft}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
        .sp-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sp-id-main { flex: 1; min-width: 160px; }
        .sp-name { font-family: inherit; font-size: 24px; font-weight: 700; color: ${F.ink}; line-height: 1.15; letter-spacing: -0.4px; }
        .sp-cat-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background: ${F.blueSoft}; color: ${F.blue}; border: 1px solid ${F.blueBorder}; margin-top: 6px; }
        .sp-bio { font-size: 13px; color: ${F.inkSoft}; line-height: 1.65; background: ${F.blueSoft}; border: 1px solid ${F.blueBorder}; border-radius: 16px; padding: 16px; margin-top: 16px; }
        .sp-section { max-width: 960px; margin: 0 auto; padding: 0 24px; margin-top: 20px; }
        .sp-card { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 22px; }
        .sp-sec-title { font-family: inherit; font-size: 16px; font-weight: 700; color: ${F.ink}; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .sp-info-grid { display: flex; flex-direction: column; gap: 0; }
        .sp-info-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px dotted ${F.lineMid}; }
        .sp-info-row:last-child { border-bottom: none; }
        .sp-info-row-link { text-decoration: none; cursor: pointer; border-radius: 10px; margin: 0 -8px; padding: 11px 8px; transition: background .15s; display: flex; align-items: center; gap: 12px; border-bottom: 1px dotted ${F.lineMid}; }
        .sp-info-row-link:last-child { border-bottom: none; }
        .sp-info-row-link:hover { background: ${F.blueSoft}; }
        .sp-info-icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; }
        .sp-info-label { font-size: 13px; color: ${F.muted}; font-weight: 400; min-width: 110px; }
        .sp-info-val { font-size: 13px; color: ${F.ink}; font-weight: 500; margin-left: auto; text-align: right; }
        .sp-info-val.link { color: ${F.blue}; }
        .sp-items-grid { display: flex; flex-direction: column; gap: 10px; }
        .sp-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: ${F.blueSoft}; border: 1px solid ${F.blueBorder}; border-radius: 14px; }
        .sp-item-name { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .sp-item-desc { font-size: 12px; color: ${F.muted}; margin-top: 2px; }
        .sp-item-price { font-size: 15px; font-weight: 800; color: ${F.blue}; white-space: nowrap; margin-left: 12px; }
        .sp-item-duration { font-size: 11px; color: ${F.muted}; text-align: right; margin-top: 2px; }
        .sp-cta-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 60; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-top: 1px solid ${F.lineMid}; padding: 14px 20px; }
        .sp-cta-inner { max-width: 960px; margin: 0 auto; display: flex; gap: 12px; }
        .sp-cta-btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 26px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .18s; font-family: inherit; text-decoration: none; }
        .sp-cta-primary { background: ${F.blue}; color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
        .sp-cta-ghost { background: white; color: ${F.blue}; border: 1px solid ${F.blueBorder}; }
        .sp-toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: ${F.ink}; color: white; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 60; }
        @media (max-width: 720px) { .sp-identity, .sp-section { padding-left: 16px; padding-right: 16px; } }

        .sp-modal-overlay { position: fixed; inset: 0; z-index: 80; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; }
        @media (min-width: 500px) { .sp-modal-overlay { align-items: center; padding: 20px; } }
        .sp-modal { background: white; width: 100%; max-width: 480px; border-radius: 24px 24px 0 0; padding: 24px 20px 32px; max-height: 90vh; overflow-y: auto; }
        @media (min-width: 500px) { .sp-modal { border-radius: 24px; } }
        .sp-modal-title { font-size: 17px; font-weight: 700; color: ${F.ink}; margin-bottom: 18px; }
        .sp-modal-error { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; border-radius: 10px; padding: 10px 14px; font-size: 12.5px; margin-bottom: 14px; }
        .sp-mfield { margin-bottom: 14px; }
        .sp-mlabel { display: block; font-size: 12px; font-weight: 700; color: ${F.inkSoft}; margin-bottom: 6px; }
        .sp-req { color: ${F.blue}; }
        .sp-minput, .sp-mtextarea { width: 100%; padding: 11px 13px; border: 1px solid ${F.lineMid}; border-radius: 11px; font-size: 14px; font-weight: 500; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; background: #F9FAFB; }
        .sp-minput:focus, .sp-mtextarea:focus { border-color: ${F.blueBorder}; background: white; box-shadow: 0 0 0 3px ${F.blueSoft}; }
        .sp-mtextarea { resize: none; }
        .sp-mgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .sp-mbtns { display: flex; gap: 10px; margin-top: 18px; }
        .sp-mcancel { flex: 0 0 auto; padding: 13px 20px; border-radius: 13px; background: ${F.line}; color: ${F.inkSoft}; border: none; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .sp-msave { flex: 1; padding: 13px; border-radius: 13px; background: ${F.blue}; color: white; border: none; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(37,99,235,0.25); }
        .sp-msave:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="sp-page">
        <div className="sp-body">
          {/* Cover */}
          <div className="sp-cover">
            {(service.cover_url || service.image_url) && <img src={service.cover_url || service.image_url} alt={service.service_name} />}
            <div className="sp-cover-overlay" />
            <div className="sp-cover-top">
              <button className="sp-cover-btn" onClick={() => router.back()}><Icon.ArrowLeft /></button>
              <button className="sp-cover-btn" onClick={handleShare}><Icon.Share /></button>
            </div>
          </div>

          {/* Identity */}
          <div className="sp-identity">
            <div className="sp-id-row">
              <div className="sp-avatar">
                {service.image_url
                  ? <img src={service.image_url} alt={service.service_name} />
                  : <img src="/icons/icon-vet-care.png" alt="" style={{ width: 48, height: 48, objectFit: 'contain', opacity: 0.4 }} />}
              </div>
              <div className="sp-id-main">
                <h1 className="sp-name">{service.service_name}</h1>
                <div className="sp-cat-badge">{CATEGORY_LABEL[service.category] || service.category}</div>
              </div>
            </div>
            {service.bio && <p className="sp-bio">{service.bio}</p>}
          </div>

          {/* Contact Info */}
          <div className="sp-section">
            <div className="sp-card">
              <div className="sp-sec-title">
                <img src="/icons/icon-nav-profile.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                ข้อมูลติดต่อ
              </div>
              <div className="sp-info-grid">
                {service.owner_name && (
                  <div className="sp-info-row">
                    <div className="sp-info-icon"><img src="/icons/icon-nav-profile.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} /></div>
                    <span className="sp-info-label">เจ้าของ</span>
                    <span className="sp-info-val">{service.owner_name}</span>
                  </div>
                )}
                {service.phone && (
                  <a className="sp-info-row-link" href={`tel:${service.phone}`}>
                    <div className="sp-info-icon"><img src="/icons/icon-phone.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} /></div>
                    <span className="sp-info-label">เบอร์โทรศัพท์</span>
                    <span className="sp-info-val link">{service.phone}</span>
                  </a>
                )}
                {service.address && (
                  <a className="sp-info-row-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <div className="sp-info-icon"><img src="/icons/icon-location.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} /></div>
                    <span className="sp-info-label">ที่อยู่</span>
                    <span className="sp-info-val link">{service.address}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Service Items */}
          {items.length > 0 && (
            <div className="sp-section">
              <div className="sp-card">
                <div className="sp-sec-title">
                  <img src="/icons/icon-vet-care.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                  รายการบริการและราคา
                </div>
                <div className="sp-items-grid">
                  {items.map(item => (
                    <div key={item.id} className="sp-item">
                      <div style={{ flex: 1 }}>
                        <div className="sp-item-name">{item.name}</div>
                        {item.description && <div className="sp-item-desc">{item.description}</div>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                        {item.price != null && <div className="sp-item-price">฿{Number(item.price).toLocaleString()}</div>}
                        {item.duration_min && <div className="sp-item-duration">{item.duration_min} นาที</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Bar */}
        <div className="sp-cta-bar">
          <div className="sp-cta-inner">
            <button
              className="sp-cta-btn sp-cta-primary"
              onClick={openBookingModal}
              disabled={myPendingBooking}
              style={myPendingBooking ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
            >
              {myPendingBooking ? 'รอทางร้านยืนยัน' : 'จองบริการ'}
            </button>
            {service.phone && (
              <a className="sp-cta-btn sp-cta-ghost" href={`tel:${service.phone}`}>
                <img src="/icons/icon-phone.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                โทรติดต่อ
              </a>
            )}
            {service.address && (
              <a className="sp-cta-btn sp-cta-ghost" href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                <img src="/icons/icon-location.png" alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                แผนที่
              </a>
            )}
          </div>
        </div>

        {copied && <div className="sp-toast">คัดลอกลิงก์แล้ว</div>}
        {bookingToast && <div className="sp-toast">ส่งคำขอจองแล้ว รอทางร้านยืนยัน</div>}

        {showBookingModal && (
          <div className="sp-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowBookingModal(false); }}>
            <div className="sp-modal">
              <div className="sp-modal-title">จองบริการ</div>
              {bookingError && <div className="sp-modal-error">{bookingError}</div>}
              {items.length > 0 && (
                <div className="sp-mfield">
                  <label className="sp-mlabel">เลือกบริการ</label>
                  <select className="sp-minput" value={bookingItemId} onChange={e => setBookingItemId(e.target.value)}>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}{item.price != null ? ` — ฿${Number(item.price).toLocaleString()}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sp-mgrid">
                <div className="sp-mfield">
                  <label className="sp-mlabel">วันที่ <span className="sp-req">*</span></label>
                  <input type="date" className="sp-minput" min={new Date().toISOString().split('T')[0]} value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                </div>
                <div className="sp-mfield">
                  <label className="sp-mlabel">เวลา</label>
                  <input type="time" className="sp-minput" value={bookingTime} onChange={e => setBookingTime(e.target.value)} />
                </div>
              </div>
              {myPets.length > 0 && (
                <div className="sp-mfield">
                  <label className="sp-mlabel">สัตว์เลี้ยงของคุณ</label>
                  <select className="sp-minput" value={bookingPetId} onChange={e => setBookingPetId(e.target.value)}>
                    <option value="">ไม่ระบุ</option>
                    {myPets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div className="sp-mfield">
                <label className="sp-mlabel">หมายเหตุเพิ่มเติม</label>
                <textarea className="sp-mtextarea" rows={2} placeholder="เช่น ขนยาว ดุนิดหน่อย" value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} />
              </div>
              <div className="sp-mbtns">
                <button className="sp-mcancel" onClick={() => setShowBookingModal(false)}>ยกเลิก</button>
                <button className="sp-msave" onClick={handleSubmitBooking} disabled={bookingSubmitting}>{bookingSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอจอง'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
