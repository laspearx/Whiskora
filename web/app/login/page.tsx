"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// เพิ่ม useEffect และเรียกใช้ที่ด้านบนของ LoginPage
import { useEffect } from "react"; // 🌟 เพิ่ม import

export default function LoginPage() {
  // ... state เดิมของชัช ...
  const router = useRouter();

  // 🌟 เพิ่มส่วนนี้เข้าไปครับ เพื่อดักจับ Session ที่แอบเข้ามา
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // ถ้าเจอ Session (แม้จะมาจาก fragment #) ให้พาวิ่งไปหน้าแรกเลย
        router.push("/");
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // ... rest of your code ...
} 

{
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  };

const handleSocialLogin = async (provider: 'google' | 'facebook') => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // 🌟 ใช้แค่ redirectTo อย่างเดียวเหมือนหน้า Register ครับ
      redirectTo: `${window.location.origin}/auth/callback`, 
    },
  });
  if (error) alert(error.message);
};

  (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-[2.5rem] shadow-xl shadow-pink-100/50 border border-pink-50 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-pink-500 tracking-tight mb-2">Whiskora</h1>
          <p className="text-gray-400 text-sm font-medium">เข้าสู่ระบบเพื่อดูแลเพื่อนรักของคุณ</p>
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

        {/* 🌟 ส่วนที่เพิ่มเข้ามา: ปุ่ม Social Login */}
        <div className="mt-6">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative px-4 bg-white text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              หรือเชื่อมต่อด้วย
            </span>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-100 py-3.5 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] text-sm font-bold text-gray-700"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              ดำเนินการต่อด้วย Google
            </button>

            <button
              onClick={() => handleSocialLogin('facebook')}
              className="w-full flex items-center justify-center gap-3 bg-[#1877F2] py-3.5 rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] text-sm font-bold text-white shadow-lg shadow-blue-100"
            >
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              ดำเนินการต่อด้วย Facebook
            </button>
          </div>
        </div>

        <div className="mt-8 text-center border-t border-gray-50 pt-6">
          <p className="text-gray-400 text-sm font-medium">
            ยังไม่มีบัญชีใช่ไหม?{" "}
            <Link href="/register" className="text-pink-500 font-bold hover:underline">
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