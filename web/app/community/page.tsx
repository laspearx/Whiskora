"use client";

import { useRouter } from "next/navigation";

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827',
  inkSoft: '#4B5563',
  muted: '#9CA3AF',
  pink: '#E84677',
  pinkSoft: '#FDF2F5',
  line: '#E5E7EB',
  paper: '#FFFFFF',
};

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  Community: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Sparkle: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  )
};

export default function CommunityComingSoonPage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        .premium-glass {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.03);
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 relative overflow-hidden font-sans" style={{ color: F.ink }}>
        
        {/* ✨ Premium Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#E5E7EB 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }}></div>
          {/* Whiskora Pink Glow */}
          <div className="absolute w-[600px] h-[600px] rounded-full animate-glow" style={{ background: 'radial-gradient(circle, rgba(232,70,119,0.08) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>
        </div>

        {/* 💳 Main Content Card */}
        <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          {/* 🌟 Visual Icon Section */}
          <div className="relative mb-8 animate-float">
            <div className="absolute inset-0 rounded-full blur-xl opacity-50" style={{ background: F.pinkSoft }}></div>
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white border border-gray-100 shadow-xl shadow-gray-100/50 flex items-center justify-center relative z-10 text-gray-800">
              <Icon.Community />
            </div>
            {/* Sparkle Details */}
            <div className="absolute -top-4 -right-4" style={{ color: F.pink }}><Icon.Sparkle /></div>
            <div className="absolute bottom-0 -left-6 text-gray-300 transform scale-75"><Icon.Sparkle /></div>
          </div>

          {/* 🏷️ Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6" style={{ background: F.paper, borderColor: F.line }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: F.pink }}></span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: F.pink }}>Coming Soon</span>
          </div>

          {/* 📝 Text Content */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
            Whiskora <span className="ml-3" style={{ WebkitTextStroke: `1px ${F.pink}`, color: 'transparent' }}>Community</span>
          </h1>
          
          <p className="max-w-lg mx-auto text-sm md:text-base font-medium leading-relaxed mb-10" style={{ color: F.inkSoft }}>
            เตรียมพบกับพื้นที่แลกเปลี่ยนประสบการณ์ระดับพรีเมียมของคนรักสัตว์ แหล่งรวมกูรูสายบรีด และพื้นที่แชร์ความน่ารักของเด็กๆ ที่ปลอดภัยและอบอุ่นที่สุด
            <span className="block mt-4 italic font-medium" style={{ color: F.muted }}>
              "เพราะเราเชื่อว่ามิตรภาพที่ดี เริ่มต้นที่ความใส่ใจ"
            </span>
          </p>

          {/* 🔙 Action Button */}
          <button 
            onClick={() => router.push('/')}
            className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 hover:-translate-y-1"
            style={{ background: F.ink, color: '#fff', boxShadow: '0 10px 25px rgba(17, 24, 39, 0.15)' }}
          >
            <span className="group-hover:-translate-x-1 transition-transform opacity-70"><Icon.ArrowLeft /></span>
            กลับสู่หน้าหลัก
          </button>

        </div>
      </div>
    </>
  );
}