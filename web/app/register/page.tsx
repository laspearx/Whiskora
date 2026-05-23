"use client";

import { useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/profile";
  const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/profile";

  // ถ้ามี session อยู่แล้ว (เช่นเด้งกลับจาก OAuth callback) ให้เข้าหน้าที่ตั้งใจ
  useEffect(() => {
    const initCheck = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { router.push(safeRedirect); router.refresh(); }
    };
    initCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { router.push(safeRedirect); router.refresh(); }
    });
    return () => subscription.unsubscribe();
  }, [router, safeRedirect]);

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeRedirect)}` },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-[2.5rem] shadow-xl shadow-pink-100/50 border border-pink-50 animate-in fade-in zoom-in duration-500">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-pink-500 tracking-tight mb-2">สร้างบัญชีใหม่</h1>
          <p className="text-gray-400 text-sm font-medium">เริ่มต้นดูแลสัตว์เลี้ยงของคุณด้วย Whiskora</p>
        </div>

        {/* สมัครด้วย Social เท่านั้น */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center justify-center gap-3 py-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] font-bold text-gray-700 text-sm shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            สมัครด้วย Google
          </button>

          <button
            onClick={() => handleSocialLogin('facebook')}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-2xl transition-all active:scale-[0.98] font-bold text-sm shadow-lg shadow-blue-100"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            สมัครด้วย Facebook
          </button>
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed px-2">
          การสมัครสมาชิกถือว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัวของ Whiskora
        </p>

        <div className="mt-8 text-center border-t border-gray-50 pt-6">
          <p className="text-gray-400 text-sm font-medium">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href={`/login${safeRedirect !== '/profile' ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}`} className="text-pink-500 font-bold hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>

      <Link href="/" className="mt-8 text-gray-400 text-xs font-bold hover:text-pink-500 transition">
        ← กลับหน้าแรก
      </Link>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[90vh] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}