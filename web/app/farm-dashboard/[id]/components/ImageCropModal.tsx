"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { F } from "@/lib/farmDashboard/theme";

async function getCroppedBlob(imageSrc: string, pixelCrop: Area, maxDim = 1200): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve) => { image.onload = () => resolve(); });
  const scale = Math.min(1, maxDim / Math.max(pixelCrop.width, pixelCrop.height));
  const outW = Math.round(pixelCrop.width * scale);
  const outH = Math.round(pixelCrop.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outW, outH);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85));
}

interface ImageCropModalProps {
  cropSrc: string;
  cropType: "avatar" | "cover";
  uploading: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

/** Owns crop position/zoom/pixel-selection state internally — the parent only cares about the
 * final cropped blob (via onConfirm) since upload target/bucket/path is caller-specific. */
export default function ImageCropModal({ cropSrc, cropType, uploading, onCancel, onConfirm }: ImageCropModalProps) {
  const [cropPos, setCropPos] = useState<Point>({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedPixels(pixels), []);

  const handleConfirm = async () => {
    if (!croppedPixels) return;
    const blob = await getCroppedBlob(cropSrc, croppedPixels, cropType === "avatar" ? 480 : 1200);
    onConfirm(blob);
  };

  return (
    <div className="fd-crop-overlay">
      <style>{`
        .fd-crop-overlay { position:fixed; inset:0; z-index:500; display:flex; flex-direction:column; background:#000; }
        .fd-crop-area { flex:1; position:relative; min-height:260px; }
        .fd-crop-controls { padding:16px 20px env(safe-area-inset-bottom,24px); background:#111; display:flex; flex-direction:column; gap:14px; }
        .fd-crop-zoom-row { display:flex; align-items:center; gap:10px; }
        .fd-crop-zoom-label { font-size:12px; color:rgba(255,255,255,.6); flex-shrink:0; }
        .fd-crop-zoom-input { flex:1; accent-color:${F.pink}; cursor:pointer; }
        .fd-crop-actions { display:flex; gap:12px; }
        .fd-crop-cancel { flex:1; padding:13px; border:1.5px solid rgba(255,255,255,.25); border-radius:14px; background:transparent; color:white; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; }
        .fd-crop-confirm { flex:2; padding:13px; border:none; border-radius:14px; background:${F.pink}; color:white; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; }
        .fd-crop-confirm:disabled { opacity:.6; cursor:not-allowed; }
      `}</style>
      <div className="fd-crop-area">
        <Cropper
          image={cropSrc}
          crop={cropPos}
          zoom={cropZoom}
          aspect={cropType === "cover" ? 16 / 9 : 1}
          cropShape={cropType === "cover" ? "rect" : "round"}
          showGrid={false}
          onCropChange={setCropPos}
          onZoomChange={setCropZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="fd-crop-controls">
        <div className="fd-crop-zoom-row">
          <span className="fd-crop-zoom-label">ย่อ/ขยาย</span>
          <input type="range" className="fd-crop-zoom-input" min={1} max={3} step={0.01}
            value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} />
        </div>
        <div className="fd-crop-actions">
          <button className="fd-crop-cancel" type="button" onClick={onCancel}>ยกเลิก</button>
          <button className="fd-crop-confirm" type="button" onClick={handleConfirm} disabled={uploading}>
            {uploading ? "กำลังบันทึก..." : "ตกลง"}
          </button>
        </div>
      </div>
    </div>
  );
}
