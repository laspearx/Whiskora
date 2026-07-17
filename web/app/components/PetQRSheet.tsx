"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { useRouter } from "@/i18n/navigation";

const F = {
  ink: "#1f1a1c",
  muted: "#8e7e84",
  pink: "#e84677",
  pinkSoft: "#fde2ea",
  line: "#f3dde3",
};

type Step = "choose" | "select" | "show" | "scan";

export default function PetQRSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loadingPets, setLoadingPets] = useState(false);
  const [scanError, setScanError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const handleShowMyQr = async () => {
    setLoadingPets(true);
    setStep("select");
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("pets")
        .select("id, name, image_url")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) setPets(data);
    }
    setLoadingPets(false);
  };

  const handleSelectPet = async (pet: any) => {
    setSelectedPet(pet);
    setStep("show");
    const url = `${window.location.origin}/p/${pet.id}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 260,
      margin: 2,
      color: { dark: "#1f1a1c", light: "#ffffff" },
    });
    setQrDataUrl(dataUrl);
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startScan = async () => {
    setScanError("");
    setScanResult("");
    setStep("scan");
  };

  useEffect(() => {
    if (step !== "scan") return;

    let active = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        if (active) setScanError("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้กล้องในเบราว์เซอร์");
      }
    };

    const tick = async () => {
      if (!active || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        if (!("BarcodeDetector" in window)) {
          if (active) setScanError("เบราว์เซอร์นี้ไม่รองรับการสแกน QR กรุณาใช้ Chrome บน Android หรือ Safari บน iOS 17+");
          return;
        }
        // @ts-ignore — BarcodeDetector is not in all TS libs yet
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const codes = await detector.detect(canvas);
        if (codes.length > 0 && active) {
          const url: string = codes[0].rawValue;
          if (url.includes("/p/")) {
            active = false;
            stopCamera();
            onClose();
            router.push(url.replace(window.location.origin, "") as any);
            return;
          }
        }
      } catch {
        // detector failed silently, keep scanning
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    init();

    return () => {
      active = false;
      stopCamera();
    };
  }, [step]);

  const goBack = () => {
    if (step === "scan") stopCamera();
    setStep("choose");
    setScanError("");
  };

  return (
    <>
      <style>{`
        @keyframes qr-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes qrs-scan-line { 0%,100% { top: 10%; } 50% { top: 85%; } }
        .qrs-overlay { position: fixed; inset: 0; z-index: 500; display: flex; flex-direction: column; justify-content: flex-end; }
        .qrs-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.48); backdrop-filter: blur(4px); }
        .qrs-sheet { position: relative; background: white; border-radius: 24px 24px 0 0; padding: 8px 20px env(safe-area-inset-bottom, 40px); max-height: 82vh; overflow-y: auto; animation: qr-sheet-up 0.28s cubic-bezier(0.32,0.72,0,1) both; }
        .qrs-handle { width: 40px; height: 4px; background: #e5e7eb; border-radius: 999px; margin: 12px auto 20px; }
        .qrs-title { margin: 0 0 20px; font-size: 20px; font-weight: 700; color: ${F.ink}; text-align: center; }
        .qrs-back { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 999px; line-height: 0; }
        .qrs-row-title { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .qrs-opt { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: 18px; cursor: pointer; text-align: left; width: 100%; margin-bottom: 12px; transition: opacity .15s; border: none; }
        .qrs-opt:active { opacity: .75; }
        .qrs-opt-primary { border: 2px solid ${F.pink} !important; background: ${F.pinkSoft}; }
        .qrs-opt-secondary { border: 2px solid #e5e7eb !important; background: #fafafa; }
        .qrs-opt-label { font-weight: 700; font-size: 16px; color: ${F.ink}; }
        .qrs-opt-sub { font-size: 13px; color: ${F.muted}; margin-top: 3px; }
        .qrs-empty { text-align: center; padding: 40px 0; color: ${F.muted}; font-size: 14px; }
        .qrs-pet-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px 8px; padding: 4px 0 8px; }
        .qrs-pet-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0; }
        .qrs-pet-btn:active .qrs-pet-circle { transform: scale(0.93); }
        .qrs-pet-circle { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; background: ${F.pinkSoft}; border: 2.5px solid ${F.line}; display: flex; align-items: center; justify-content: center; transition: border-color .15s, transform .12s; }
        .qrs-pet-btn:hover .qrs-pet-circle { border-color: ${F.pink}; }
        .qrs-pet-circle img { width: 100%; height: 100%; object-fit: cover; }
        .qrs-pet-name { font-weight: 600; font-size: 11px; color: ${F.ink}; text-align: center; line-height: 1.3; word-break: break-word; max-width: 72px; }
        .qrs-qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 20px; padding-bottom: 8px; }
        .qrs-qr-box { padding: 20px; background: white; border: 2px solid ${F.line}; border-radius: 24px; box-shadow: 0 12px 32px rgba(232,70,119,.12); }
        .qrs-qr-pet-name { font-weight: 700; font-size: 16px; color: ${F.ink}; }
        .qrs-qr-desc { font-size: 13px; color: ${F.muted}; text-align: center; line-height: 1.6; margin: 4px 0 0; }
        .qrs-placeholder { width: 220px; height: 220px; background: ${F.pinkSoft}; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: ${F.muted}; font-size: 14px; }
        .qrs-viewfinder { position: relative; width: 100%; aspect-ratio: 1; border-radius: 20px; overflow: hidden; background: #000; }
        .qrs-video { width: 100%; height: 100%; object-fit: cover; }
        .qrs-corners { position: absolute; inset: 0; pointer-events: none; }
        .qrs-corner { position: absolute; width: 28px; height: 28px; border-color: ${F.pink}; border-style: solid; border-radius: 4px; }
        .qrs-corner-tl { top: 16px; left: 16px; border-width: 3px 0 0 3px; }
        .qrs-corner-tr { top: 16px; right: 16px; border-width: 3px 3px 0 0; }
        .qrs-corner-bl { bottom: 16px; left: 16px; border-width: 0 0 3px 3px; }
        .qrs-corner-br { bottom: 16px; right: 16px; border-width: 0 3px 3px 0; }
        .qrs-scan-line { position: absolute; left: 16px; right: 16px; height: 2px; background: linear-gradient(90deg, transparent, ${F.pink}, transparent); animation: qrs-scan-line 2s ease-in-out infinite; border-radius: 999px; }
        .qrs-scan-hint { text-align: center; font-size: 13px; color: ${F.muted}; margin-top: 16px; }
        .qrs-scan-error { text-align: center; font-size: 13px; color: #ef4444; margin-top: 12px; padding: 12px; background: #fef2f2; border-radius: 12px; }
      `}</style>

      <div className="qrs-overlay">
        <div className="qrs-backdrop" onClick={onClose} />
        <div className="qrs-sheet">
          <div className="qrs-handle" />

          {/* ── Step: choose ── */}
          {step === "choose" && (
            <>
              <h2 className="qrs-title">QR สัตว์เลี้ยง</h2>
              <button className="qrs-opt qrs-opt-primary" onClick={handleShowMyQr}>
                <img src="/icons/icon-qr-code.png" alt="" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
                <div>
                  <div className="qrs-opt-label">โชว์ QR สัตว์เลี้ยงของฉัน</div>
                  <div className="qrs-opt-sub">ให้คนอื่นสแกนเพื่อดูข้อมูลสัตว์เลี้ยง</div>
                </div>
              </button>
              <button className="qrs-opt qrs-opt-secondary" onClick={startScan}>
                <img src="/icons/icon-scan.png" alt="" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
                <div>
                  <div className="qrs-opt-label">สแกน QR สัตว์เลี้ยงของคนอื่น</div>
                  <div className="qrs-opt-sub">เปิดกล้องสแกน QR เพื่อดูโปรไฟล์สัตว์เลี้ยง</div>
                </div>
              </button>
            </>
          )}

          {/* ── Step: select ── */}
          {step === "select" && (
            <>
              <div className="qrs-row-title">
                <button className="qrs-back" onClick={() => setStep("choose")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={F.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: F.ink }}>เลือกสัตว์เลี้ยง</h2>
              </div>
              {loadingPets ? (
                <div className="qrs-empty">กำลังโหลด...</div>
              ) : pets.length === 0 ? (
                <div className="qrs-empty">ยังไม่มีสัตว์เลี้ยงในบัญชี</div>
              ) : (
                <div className="qrs-pet-grid">
                  {pets.map((pet) => (
                    <button key={pet.id} className="qrs-pet-btn" onClick={() => handleSelectPet(pet)}>
                      <div className="qrs-pet-circle">
                        {pet.image_url
                          ? <img src={pet.image_url} alt={pet.name} />
                          : <img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />}
                      </div>
                      <span className="qrs-pet-name">{pet.name || "ยังไม่มีชื่อ"}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Step: show QR ── */}
          {step === "show" && selectedPet && (
            <>
              <div className="qrs-row-title">
                <button className="qrs-back" onClick={() => { setStep("select"); setQrDataUrl(""); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={F.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: F.ink }}>QR ของ {selectedPet.name || "สัตว์เลี้ยง"}</h2>
              </div>
              <div className="qrs-qr-wrap">
                {qrDataUrl ? (
                  <div className="qrs-qr-box">
                    <img src={qrDataUrl} alt={`QR สำหรับ ${selectedPet.name}`} style={{ width: 220, height: 220, display: "block" }} />
                  </div>
                ) : (
                  <div className="qrs-placeholder">กำลังสร้าง QR...</div>
                )}
                <div style={{ textAlign: "center" }}>
                  <div className="qrs-qr-pet-name">{selectedPet.name || "สัตว์เลี้ยง"}</div>
                  <p className="qrs-qr-desc">ให้คนอื่นสแกน QR เพื่อดูข้อมูลของ {selectedPet.name}</p>
                </div>
              </div>
            </>
          )}

          {/* ── Step: scan ── */}
          {step === "scan" && (
            <>
              <div className="qrs-row-title">
                <button className="qrs-back" onClick={goBack}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={F.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: F.ink }}>สแกน QR สัตว์เลี้ยง</h2>
              </div>
              <div className="qrs-viewfinder">
                <video ref={videoRef} className="qrs-video" playsInline muted />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <div className="qrs-corners">
                  <div className="qrs-corner qrs-corner-tl" />
                  <div className="qrs-corner qrs-corner-tr" />
                  <div className="qrs-corner qrs-corner-bl" />
                  <div className="qrs-corner qrs-corner-br" />
                  <div className="qrs-scan-line" />
                </div>
              </div>
              {scanError
                ? <div className="qrs-scan-error">{scanError}</div>
                : <p className="qrs-scan-hint">จ่อกล้องไปที่ QR Code ของสัตว์เลี้ยง</p>
              }
            </>
          )}
        </div>
      </div>
    </>
  );
}
