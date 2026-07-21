"use client";

import { usePathname, useRouter } from 'next/navigation';

export default function FarmBottomNav({ farmId }: { farmId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const go = (path: string) => router.push(path);

  const base = `/farm-dashboard/${farmId}`;
  const littersActive = pathname.startsWith(`${base}/litters`) || pathname.startsWith(`${base}/babies`);

  // Main dashboard has its own embedded action nav — let it handle itself
  if (pathname === base) return null;

  return (
    <nav
      aria-label="เมนูฟาร์ม"
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
          label="หน้าหลัก"
          active={pathname === base}
          onClick={() => go(base)}
          icon={<img src="/icons/icon-tab-home.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

        <TabBtn
          label="สัตว์เลี้ยง"
          active={pathname.startsWith(`${base}/pets`)}
          onClick={() => go(`${base}/pets`)}
          icon={<img src="/icons/icon-tab-pets.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

        {/* ครอก — elevated center button */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{ position: 'relative' }}>
          <button
            onClick={() => go(`${base}/litters`)}
            aria-label="ครอก"
            style={{
              position: 'absolute',
              top: -22,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: littersActive ? '#E84677' : '#fde2ea',
              boxShadow: '0 2px 10px rgba(232,70,119,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid white',
              transition: 'background .15s',
            }}
          >
            <img src="/icons/icon-tab-add.png" alt="ครอก" width={64} height={64} style={{ objectFit: 'contain' }} />
          </button>
          <span style={{
            marginTop: 40,
            fontSize: 10,
            fontWeight: littersActive ? 700 : 600,
            color: littersActive ? '#e84677' : '#b0a0a8',
            lineHeight: 1,
          }}>ครอก</span>
        </div>

        <TabBtn
          label="นัดหมาย"
          active={pathname.startsWith(`${base}/appointments`)}
          onClick={() => go(`${base}/appointments`)}
          icon={<img src="/icons/icon-tab-explore.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

        <TabBtn
          label="โปรไฟล์ฟาร์ม"
          active={pathname === `${base}/edit`}
          onClick={() => go(`${base}/edit`)}
          icon={<img src="/icons/icon-tab-profile.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />}
        />

      </div>
    </nav>
  );
}

function TabBtn({ label, active, onClick, icon }: {
  label: string; active: boolean; onClick: () => void; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className="flex-1 flex flex-col items-center justify-center gap-0.5"
      style={{ color: active ? '#e84677' : '#b0a0a8' }}
    >
      <span style={{
        width: 72,
        height: 48,
        borderRadius: 14,
        background: active ? 'rgba(232,70,119,0.09)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background .15s',
      }}>
        {icon}
      </span>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, lineHeight: 1.2 }}>
        {label}
      </span>
    </button>
  );
}
