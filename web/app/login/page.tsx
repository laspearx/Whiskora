"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false); // เปิดฟอร์มอีเมลสำหรับผู้ใช้เดิม
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/profile";
  useEffect(() => {
    const err = searchParams.get("auth_error");
    if (err) setAuthError(decodeURIComponent(err));
  }, [searchParams]);
  // กันไม่ให้ redirect ออกไปนอกเว็บ (เปิดเฉพาะ path ภายใน)
  const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/profile";

  // ดักจับ Session ที่ติดมากับ URL (เด้งกลับจาก OAuth)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { router.push(safeRedirect); router.refresh(); }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { router.push(safeRedirect); router.refresh(); }
    });
    return () => subscription.unsubscribe();
  }, [router, safeRedirect]);

  // เข้าสู่ระบบด้วยอีเมล (เฉพาะผู้ใช้เดิมที่เคยสมัครด้วยอีเมล)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } else {
      router.push(safeRedirect);
      router.refresh();
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'custom:line-login') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeRedirect)}` },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-[2.5rem] shadow-xl shadow-pink-100/50 border border-pink-50 animate-in fade-in zoom-in duration-500">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-pink-500 tracking-tight mb-2">Whiskora</h1>
          <p className="text-gray-400 text-sm font-medium">เข้าสู่ระบบเพื่อดูแลเพื่อนรักของคุณ</p>
        </div>

        {/* เข้าสู่ระบบด้วย Social (ช่องทางหลัก) */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-100 py-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] text-sm font-bold text-gray-700 shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            ดำเนินการต่อด้วย Google
          </button>

          <button
            onClick={() => { window.location.href = `/api/auth/line?next=${encodeURIComponent(safeRedirect)}` }}
            className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b34d] py-4 rounded-2xl transition-all active:scale-[0.98] text-sm font-bold text-white shadow-sm shadow-green-100"
          >
            <svg className="w-5 h-5" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M36 19.5C36 13.149 29.732 8 22 8S8 13.149 8 19.5c0 5.87 5.21 10.783 12.244 11.72.477.103 1.126.314 1.29.722.148.37.097.952.047 1.328l-.208 1.248c-.064.37-.291 1.452 1.273.791C24.84 34.002 36 27.231 36 19.5z" fill="white"/>
              <path d="M30.5 22h-3.6v-5.4h-.9V23H30.5v-1zM19.5 16.6h-.9V23h.9v-6.4zM25.7 16.6h-.95L22.5 20.3v-3.7h-.9V23h.9v-3.4L24.75 23h.95l-2-3.5 2-2.9zM18.8 16.6h-3.8V23h3.8v-.9H16v-1.9h2.8v-.9H16v-1.8h2.8v-.9z" fill="white"/>
            </svg>
            ดำเนินการต่อด้วย LINE
          </button>
        </div>

        {authError && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-semibold text-red-600 break-words">
            {authError}
          </div>
        )}

        {/* ทางเข้าด้วยอีเมล (สำหรับผู้ใช้เดิม) */}
        {!showEmailLogin ? (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowEmailLogin(true)}
              className="text-xs font-bold text-gray-400 hover:text-pink-500 transition-colors underline underline-offset-2"
            >
              เคยสมัครด้วยอีเมล? เข้าสู่ระบบที่นี่
            </button>
          </div>
        ) : (
          <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative flex items-center justify-center mb-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <span className="relative px-4 bg-white text-[10px] font-bold text-gray-300 uppercase tracking-widest">เข้าสู่ระบบด้วยอีเมล</span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase">อีเมล</label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12.002a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-gray-200 active:scale-[0.98] mt-2 disabled:opacity-50"
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 text-center border-t border-gray-50 pt-6">
          <p className="text-gray-400 text-sm font-medium">
            ยังไม่มีบัญชีใช่ไหม?{" "}
            <Link href={`/register${safeRedirect !== '/profile' ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}`} className="text-pink-500 font-bold hover:underline">
              สมัครสมาชิก
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}