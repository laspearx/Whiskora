"use client";

import { useRouter } from 'next/navigation';

export default function DefaultBottomNav() {
  const router = useRouter();
  const go = (path: string) => router.push(path);

  return (
    <nav
      aria-label="เมนูหลัก"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(232,70,119,0.10)',
        boxShadow: '0 -4px 24px rgba(31,26,28,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch h-[68px]">

        <TabBtn
          label="หน้าแรก"
          onClick={() => go('/')}
          icon={<img src="/icons/icon-tab-home.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

        <TabBtn
          label="สัตว์เลี้ยง"
          onClick={() => go('/profile/pets')}
          icon={<img src="/icons/icon-tab-pets.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

        {/* QR — elevated center button */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{ position: 'relative' }}>
          <button
            onClick={() => go('/pet-id-card')}
            aria-label="QR สัตว์เลี้ยง"
            style={{
              position: 'absolute',
              top: -22,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#fde2ea',
              boxShadow: '0 2px 10px rgba(232,70,119,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid white',
            }}
          >
            <img src="/icons/icon-scan-qr-code.png" alt="QR" width={64} height={64} style={{ objectFit: 'contain' }} />
          </button>
          <span style={{ marginTop: 40, fontSize: 10, fontWeight: 600, color: '#b0a0a8', lineHeight: 1 }}>QR</span>
        </div>

        <TabBtn
          label="บริการ"
          onClick={() => go('/service-hub')}
          icon={<img src="/icons/icon-tab-explore.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

        <TabBtn
          label="โปรไฟล์"
          onClick={() => go('/profile')}
          icon={<img src="/icons/icon-tab-profile.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

      </div>
    </nav>
  );
}

function TabBtn({ label, onClick, icon }: {
  label: string; onClick: () => void; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-0.5"
      style={{ color: '#b0a0a8' }}
    >
      <span style={{
        width: 72,
        height: 48,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </span>
      <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.2 }}>
        {label}
      </span>
    </button>
  );
}
