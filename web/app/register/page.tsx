"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// ─── Password strength rules ──────────────────────────────────────────────────
const RULES = [
  { id: 'len',   label: 'อย่างน้อย 8 ตัวอักษร',          test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'มีตัวพิมพ์ใหญ่ (A–Z)',            test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'มีตัวพิมพ์เล็ก (a–z)',            test: (p: string) => /[a-z]/.test(p) },
  { id: 'num',   label: 'มีตัวเลข (0–9)',                  test: (p: string) => /[0-9]/.test(p) },
  { id: 'sym',   label: 'มีสัญลักษณ์ (!@#$%^&*...)',        test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function strength(p: string): number {
  return RULES.filter(r => r.test(p)).length;
}

const STRENGTH_LABEL = ['', 'อ่อนมาก', 'อ่อน', 'พอใช้', 'ดี', 'แข็งแรงมาก'];
const STRENGTH_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/profile";
  const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/profile";

  const [tab, setTab] = useState<'social' | 'email'>('social');
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [pwFocus, setPwFocus]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  const score = strength(password);
  const allPass = RULES.every(r => r.test(password));
  const passwordsMatch = password === confirm && confirm.length > 0;

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { router.push(safeRedirect); router.refresh(); }
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) { router.push(safeRedirect); router.refresh(); }
    });
    return () => subscription.unsubscribe();
  }, [router, safeRedirect]);

  const handleSocialSignup = async (provider: 'google' | 'custom:line-login') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeRedirect)}` },
    });
    if (error) setError(error.message);
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!allPass) { setError("รหัสผ่านไม่ผ่านเงื่อนไขความปลอดภัย"); return; }
    if (!passwordsMatch) { setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน"); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) {
      if (err.message.includes("already registered")) setError("อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ");
      else setError(err.message);
    } else {
      setSuccess(true);
    }
  };

  const eyeOpen = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12.002a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  const eyeOff = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-xl shadow-pink-100/50 border border-pink-50 animate-in fade-in zoom-in duration-500 overflow-hidden">

        {/* Header */}
        <div className="text-center pt-8 pb-6 px-8">
          <h1 className="text-3xl font-black text-pink-500 tracking-tight mb-2">สร้างบัญชีใหม่</h1>
          <p className="text-gray-400 text-sm font-medium">เริ่มต้นดูแลสัตว์เลี้ยงของคุณด้วย Whiskora</p>
        </div>

        {/* Tab switcher */}
        <div className="flex mx-8 mb-6 bg-gray-50 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setTab('social')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'social' ? 'bg-white shadow-sm text-pink-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Social Login
          </button>
          <button
            onClick={() => setTab('email')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'email' ? 'bg-white shadow-sm text-pink-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            อีเมล & รหัสผ่าน
          </button>
        </div>

        <div className="px-8 pb-8">

          {/* ── Social tab ── */}
          {tab === 'social' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <button
                onClick={() => handleSocialSignup('google')}
                className="w-full flex items-center justify-center gap-3 py-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] font-bold text-gray-700 text-sm shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                สมัครด้วย Google
              </button>

              <button
                onClick={() => { window.location.href = `/api/auth/line?next=${encodeURIComponent(safeRedirect)}` }}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[#06C755] hover:bg-[#05b34d] rounded-2xl transition-all active:scale-[0.98] font-bold text-white text-sm shadow-sm shadow-green-100"
              >
                <svg className="w-5 h-5" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36 19.5C36 13.149 29.732 8 22 8S8 13.149 8 19.5c0 5.87 5.21 10.783 12.244 11.72.477.103 1.126.314 1.29.722.148.37.097.952.047 1.328l-.208 1.248c-.064.37-.291 1.452 1.273.791C24.84 34.002 36 27.231 36 19.5z" fill="white"/>
                  <path d="M30.5 22h-3.6v-5.4h-.9V23H30.5v-1zM19.5 16.6h-.9V23h.9v-6.4zM25.7 16.6h-.95L22.5 20.3v-3.7h-.9V23h.9v-3.4L24.75 23h.95l-2-3.5 2-2.9zM18.8 16.6h-3.8V23h3.8v-.9H16v-1.9h2.8v-.9H16v-1.8h2.8v-.9z" fill="white"/>
                </svg>
                สมัครด้วย LINE
              </button>

              <p className="text-xs text-gray-400 text-center leading-relaxed pt-2">
                การสมัครถือว่าคุณยอมรับ{" "}
                <Link href="/privacy" className="text-pink-400 hover:underline">นโยบายความเป็นส่วนตัว</Link>
              </p>
            </div>
          )}

          {/* ── Email tab ── */}
          {tab === 'email' && !success && (
            <form onSubmit={handleEmailRegister} className="space-y-4 animate-in fade-in duration-200">

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wide">อีเมล</label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wide">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPwFocus(true)}
                    onBlur={() => setPwFocus(false)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm pr-12"
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 transition-colors">
                    {showPw ? eyeOff : eyeOpen}
                  </button>
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300" style={{ background: i <= score ? STRENGTH_COLOR[score] : '#e5e7eb' }} />
                      ))}
                    </div>
                    <p className="text-xs font-bold" style={{ color: STRENGTH_COLOR[score] || '#9ca3af' }}>
                      {STRENGTH_LABEL[score]}
                    </p>
                  </div>
                )}

                {/* Rules checklist */}
                {(pwFocus || password.length > 0) && (
                  <div className="mt-3 space-y-1.5 bg-gray-50 rounded-2xl p-3">
                    {RULES.map(r => {
                      const pass = r.test(password);
                      return (
                        <div key={r.id} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${pass ? 'bg-green-500' : 'bg-gray-200'}`}>
                            {pass && (
                              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className={`text-xs font-medium transition-colors ${pass ? 'text-green-600' : 'text-gray-400'}`}>{r.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wide">ยืนยันรหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showCf ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl bg-gray-50 border outline-none transition-all text-sm pr-12 ${
                      confirm.length > 0
                        ? passwordsMatch ? 'border-green-300 focus:border-green-400' : 'border-red-300 focus:border-red-400'
                        : 'border-gray-100 focus:border-pink-300 focus:bg-white'
                    }`}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowCf(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 transition-colors">
                    {showCf ? eyeOff : eyeOpen}
                  </button>
                </div>
                {confirm.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-500 font-medium mt-1.5 ml-1">รหัสผ่านไม่ตรงกัน</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-600 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !allPass || !passwordsMatch}
                className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-pink-100 active:scale-[0.98] mt-2 disabled:shadow-none"
              >
                {loading ? "กำลังสมัคร..." : "สร้างบัญชี"}
              </button>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                การสมัครถือว่าคุณยอมรับ{" "}
                <Link href="/privacy" className="text-pink-400 hover:underline">นโยบายความเป็นส่วนตัว</Link>
              </p>
            </form>
          )}

          {/* ── Success state ── */}
          {tab === 'email' && success && (
            <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-2">สมัครสำเร็จ!</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                ระบบส่งลิงก์ยืนยันไปที่ <strong className="text-gray-700">{email}</strong> แล้ว<br />
                กรุณาตรวจสอบอีเมลและกดยืนยันก่อนเข้าสู่ระบบ
              </p>
              <Link
                href={`/login?redirect=${encodeURIComponent(safeRedirect)}`}
                className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-2xl transition-all text-sm"
              >
                ไปหน้าเข้าสู่ระบบ →
              </Link>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="text-center border-t border-gray-50 py-5 px-8">
          <p className="text-gray-400 text-sm font-medium">
            มีบัญชีอยู่แล้ว?{" "}
            <Link
              href={`/login${safeRedirect !== '/profile' ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}`}
              className="text-pink-500 font-bold hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>

      <Link href="/" className="mt-6 text-gray-400 text-xs font-bold hover:text-pink-500 transition">
        ← กลับหน้าแรก
      </Link>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[90vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
