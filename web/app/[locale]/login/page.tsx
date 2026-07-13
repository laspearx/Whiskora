"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useTranslations } from '@/i18n/context';
import { Link, useRouter } from '@/i18n/navigation';
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('login');

  useEffect(() => {
    const err = searchParams.get("auth_error");
    if (err) setAuthError(decodeURIComponent(err));
  }, [searchParams]);

  const redirectTo = searchParams.get("redirect") || "/profile";
  const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/profile";

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { router.push(safeRedirect as any); router.refresh(); }
    };
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { router.push(safeRedirect as any); router.refresh(); }
    });
    return () => subscription.unsubscribe();
  }, [router, safeRedirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(t('wrongCredentials'));
    } else {
      router.push(safeRedirect as any);
      router.refresh();
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeRedirect)}` },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-[2.5rem] shadow-xl shadow-pink-100/50 border border-pink-50 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-pink-500 tracking-tight mb-2">เข้าสู่ระบบ</h1>
          <p className="text-gray-400 text-sm font-medium">{t('subtitle')}</p>
        </div>

        <div className="space-y-3">
          <button onClick={() => handleSocialLogin('google')} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-100 py-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] text-sm font-bold text-gray-700 shadow-sm">
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            {t('googleBtn')}
          </button>

          <button
            onClick={() => { window.location.href = `/api/auth/line?next=${encodeURIComponent(safeRedirect)}` }}
            className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b34d] py-4 rounded-2xl transition-all active:scale-[0.98] text-sm font-bold text-white shadow-sm shadow-green-100"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="white" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            ดำเนินการต่อด้วย LINE
          </button>
        </div>

        {authError && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-semibold text-red-600 break-words">
            {authError}
          </div>
        )}

        {!showEmailLogin ? (
          <div className="mt-6 text-center">
            <button onClick={() => setShowEmailLogin(true)} className="text-xs font-bold text-gray-400 hover:text-pink-500 transition-colors underline underline-offset-2">
              {t('emailToggle')}
            </button>
          </div>
        ) : (
          <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative flex items-center justify-center mb-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <span className="relative px-4 bg-white text-[10px] font-bold text-gray-300 uppercase tracking-widest">{t('divider')}</span>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase">{t('emailLabel')}</label>
                <input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase">{t('passwordLabel')}</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-pink-300 focus:bg-white transition-all text-sm pr-12" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 transition-colors">
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12.002a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-gray-200 active:scale-[0.98] mt-2 disabled:opacity-50">
                {loading ? t('loadingBtn') : t('submitBtn')}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 text-center border-t border-gray-50 pt-6">
          <p className="text-gray-400 text-sm font-medium">
            {t('noAccount')}{" "}
            <Link href={`/register${safeRedirect !== '/profile' ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}` as any} className="text-pink-500 font-bold hover:underline">
              {t('registerLink')}
            </Link>
          </p>
        </div>
      </div>
      <Link href="/" className="mt-8 text-gray-400 text-xs font-bold hover:text-pink-500 transition">
        {t('backHome')}
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
