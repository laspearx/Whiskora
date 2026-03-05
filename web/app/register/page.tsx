"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🌟 State สำหรับเช็คเงื่อนไขรหัสผ่าน
  const [validation, setValidation] = useState({
    lowercase: false,
    uppercase: false,
    digit: false,
    symbol: false,
  });

  useEffect(() => {
    setValidation({
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      digit: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const isAllValid = Object.values(validation).every(Boolean);
    if (!isAllValid) {
      alert("กรุณาตั้งรหัสผ่านให้ตรงตามเงื่อนไขที่กำหนด");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    
    if (error) {
      alert(error.message);
    } else {
      alert("สมัครสมาชิกสำเร็จ! โปรดเช็คอีเมลเพื่อยืนยันตัวตน");
      router.push("/login");
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // 🌟 ต้องระบุ redirectTo เหมือนหน้า Login เพื่อให้วิ่งไปที่ route.ts ตัวเดียวกัน
      redirectTo: `${window.location.origin}/auth/callback`,
    },
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

        <form onSubmit={handleRegister} className="space-y-4">
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
                placeholder="Example@1234"
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

            {/* 🌟 Password Validator UI */}
            <div className="mt-3 grid grid-cols-2 gap-y-1 gap-x-2 px-1">
              <ValidationItem label="Lowercase (a-z)" isValid={validation.lowercase} />
              <ValidationItem label="Uppercase (A-Z)" isValid={validation.uppercase} />
              <ValidationItem label="Digits (0-9)" isValid={validation.digit} />
              <ValidationItem label="Symbols (!@#$)" isValid={validation.symbol} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-gray-200 active:scale-[0.98] mt-2 disabled:opacity-50"
          >
            {loading ? "กำลังดำเนินการ..." : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="mt-8 space-y-3">
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-gray-100 w-full"></div>
            <span className="bg-white px-3 text-[10px] font-bold text-gray-300 uppercase absolute">หรือเชื่อมต่อด้วย</span>
          </div>

          <button 
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center justify-center gap-3 py-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all font-bold text-gray-600 text-sm shadow-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            ดำเนินการต่อด้วย Google
          </button>

          <button 
            onClick={() => handleSocialLogin('facebook')}
            className="w-full flex items-center justify-center gap-3 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-2xl transition-all font-bold text-sm shadow-sm shadow-blue-100"
          >
            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5 brightness-0 invert" alt="Facebook" />
            ดำเนินการต่อด้วย Facebook
          </button>
        </div>

        <div className="mt-8 text-center border-t border-gray-50 pt-6">
          <p className="text-gray-400 text-sm font-medium">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="text-pink-500 font-bold hover:underline">
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

// 🌟 Component ย่อยสำหรับแสดงผลเงื่อนไขแต่ละข้อ
function ValidationItem({ label, isValid }: { label: string; isValid: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 transition-colors duration-300 ${isValid ? 'text-teal-500' : 'text-gray-300'}`}>
      <span className="text-[10px] font-bold">{isValid ? '✓' : '✕'}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </div>
  );
}