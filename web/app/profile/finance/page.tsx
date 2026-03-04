"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UniversalPetFinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<any[]>([]);
  const [allLitters, setAllLitters] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🌟 State สำหรับฟอร์ม
  const [formData, setFormData] = useState({
    transaction_type: "expense",
    expense_context: "PERSONAL", // PERSONAL, ALL_FARMS, หรือ Farm ID
    category: "ค่าอาหาร",
    amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    litter_id: "", 
    description: "",
  });

  const categories = {
    personal: ["ค่าอาหาร", "ค่าทรายแมว", "ของเล่น/ของใช้", "ค่าวัคซีน/หาหมอ", "ค่าอาบน้ำตัดขน", "อื่นๆ"],
    farm: ["ค่าอาหาร", "ค่าทรายแมว", "ค่าอุปกรณ์ต่างๆ", "ค่าวัคซีน/ยารักษา", "ค่ารักษาพยาบาล", "ค่าผสมพันธุ์", "ค่าใบเพ็ดดีกรี", "ค่ากรูมมิ่ง", "ค่าประกวด", "ค่าน้ำ/ค่าไฟ", "อื่นๆ"],
    income: ["ขายสัตว์เลี้ยง", "ค่ามัดจำ", "ค่ารับผสมพันธุ์", "รายรับอื่นๆ"]
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");
        const uid = session.user.id;

        // 1. ดึงฟาร์มทั้งหมดของผู้ใช้
        const { data: farmData } = await supabase.from("farms").select("id, farm_name").eq("user_id", uid);
        if (farmData) setFarms(farmData);

        // 2. ดึงครอกทั้งหมด (เพื่อกรองตามฟาร์มที่เลือก)
        const { data: litterData } = await supabase.from("litters").select("id, litter_code, farm_id").eq("user_id", uid);
        if (litterData) setAllLitters(litterData);

        // 3. ดึงประวัติบัญชีทั้งหมดของผู้ใช้
        const { data: txData } = await supabase
          .from("farm_transactions")
          .select("*")
          .eq("user_id", uid)
          .order("transaction_date", { ascending: false });
        if (txData) setTransactions(txData);

      } catch (error) {
        console.error("Finance Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // 🌟 กรองครอกตามฟาร์มที่เลือก
  const availableLitters = allLitters.filter(l => l.farm_id?.toString() === formData.expense_context);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // ถ้าเปลี่ยนบริบท ให้รีเซ็ตหมวดหมู่ให้เหมาะสม
      if (name === "expense_context") {
        updated.category = value === "PERSONAL" ? "ค่าอาหาร" : "ค่าอาหารฟาร์ม";
        updated.litter_id = ""; // ล้างค่าครอก
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return alert("กรุณาระบุจำนวนเงิน");
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isFarmBusiness = formData.expense_context !== "PERSONAL";

      const { data, error } = await supabase.from("farm_transactions").insert([{
        user_id: session?.user.id,
        farm_id: formData.expense_context, // เก็บเป็น 'PERSONAL', 'ALL_FARMS' หรือ 'FarmUUID'
        transaction_type: formData.transaction_type,
        category: formData.category,
        amount: Number(formData.amount),
        transaction_date: formData.transaction_date,
        litter_id: formData.litter_id ? Number(formData.litter_id) : null,
        description: formData.description,
      }]).select().single();

      if (error) throw error;

      alert("บันทึกสำเร็จ!");
      router.push("/profile");
      setTransactions([data, ...transactions]);
      setFormData(prev => ({ ...prev, amount: "", description: "", litter_id: "" }));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🌟 คำนวณสรุปยอด (เดือนปัจจุบัน)
  const currentMonth = new Date().getMonth();
  const personalSpending = transactions
    .filter(t => t.farm_id === 'PERSONAL' && t.transaction_type === 'expense' && new Date(t.transaction_date).getMonth() === currentMonth)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const farmSpending = transactions
    .filter(t => t.farm_id !== 'PERSONAL' && t.transaction_type === 'expense' && new Date(t.transaction_date).getMonth() === currentMonth)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-emerald-500 font-bold animate-pulse">กำลังโหลดสมุดบัญชี... 💸</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-20 animate-in fade-in duration-700">
      
      {/* 🔙 Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-emerald-500 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">บัญชีสัตว์เลี้ยง 📝</h1>
          <p className="text-sm font-bold text-emerald-500">จัดการค่าใช้จ่ายส่วนตัวและธุรกิจฟาร์ม</p>
        </div>
      </div>

      {/* 📊 Summary Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">สัตว์เลี้ยงส่วนตัว (เดือนนี้)</p>
          <p className="text-3xl font-black text-blue-500">฿{personalSpending.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-pink-50 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">ต้นทุนฟาร์ม (เดือนนี้)</p>
          <p className="text-3xl font-black text-pink-500">฿{farmSpending.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* 📝 Form Section */}
        <div className="md:col-span-5 bg-white rounded-[2.5rem] p-6 md:p-8 border border-emerald-50 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2"><span>✍🏻</span> บันทึกรายการใหม่</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* รายรับ / รายจ่าย */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-1.5 rounded-2xl">
              <button type="button" onClick={() => setFormData({ ...formData, transaction_type: "expense" })} className={`py-2.5 rounded-xl font-bold text-sm transition-all ${formData.transaction_type === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-400'}`}>รายจ่าย</button>
              <button type="button" onClick={() => setFormData({ ...formData, transaction_type: "income" })} className={`py-2.5 rounded-xl font-bold text-sm transition-all ${formData.transaction_type === 'income' ? 'bg-white text-green-500 shadow-sm' : 'text-gray-400'}`}>รายรับ</button>
            </div>

            {/* 🌟 เลือกบริบท (PERSONAL / ALL_FARMS / SPECIFIC FARM) */}
            <div>
              <label className="block text-xs font-black text-emerald-600 mb-1.5 ml-1">รายการนี้เป็นของส่วนไหน?</label>
              <select name="expense_context" value={formData.expense_context} onChange={handleChange} className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-3 outline-none focus:border-emerald-400 font-bold text-gray-800">
                <option value="PERSONAL">🏠 สัตว์เลี้ยงส่วนตัว (Home Pet)</option>
                {farms.length > 0 && (
                  <optgroup label="ธุรกิจฟาร์ม">
                    <option value="ALL_FARMS">🏢 รวมทุกฟาร์ม (ค่าน้ำ/ไฟ/อื่นๆ)</option>
                    {farms.map(f => <option key={f.id} value={f.id}>🏡 ฟาร์ม: {f.farm_name}</option>)}
                  </optgroup>
                )}
              </select>
            </div>

            {/* 🌟 ถ้าเลือกฟาร์ม ให้เลือกครอกได้ */}
            {formData.expense_context !== "PERSONAL" && formData.expense_context !== "ALL_FARMS" && (
              <div className="p-3 bg-pink-50 rounded-xl border border-pink-100 animate-in zoom-in-95">
                <label className="block text-xs font-bold text-pink-600 mb-1">ผูกกับครอก (ถ้ามี)</label>
                <select name="litter_id" value={formData.litter_id} onChange={handleChange} className="w-full bg-white rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none">
                  <option value="">-- ไม่ระบุครอก (รายจ่ายรวมฟาร์มนี้) --</option>
                  {availableLitters.map(l => <option key={l.id} value={l.id}>🐾 ครอก: {l.litter_code}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">จำนวนเงิน</label>
                <input required type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="0" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-black text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">วันที่</label>
                <input required type="date" name="transaction_date" value={formData.transaction_date} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">หมวดหมู่</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-800">
                {formData.transaction_type === "income" 
                  ? categories.income.map(c => <option key={c} value={c}>{c}</option>)
                  : (formData.expense_context === "PERSONAL" ? categories.personal : categories.farm).map(c => <option key={c} value={c}>{c}</option>)
                }
              </select>
            </div>

            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="รายละเอียดเพิ่มเติม..." className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800" rows={2} />

            <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-xl font-black text-white shadow-xl transition-all active:scale-95 ${isSubmitting ? 'bg-gray-300' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100'}`}>
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ 💾'}
            </button>
          </form>
        </div>

        {/* 📋 History Section */}
        <div className="md:col-span-7 bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm h-[750px] flex flex-col">
          <h2 className="text-lg font-black text-gray-800 mb-4">ประวัติล่าสุด</h2>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {transactions.map(tx => {
              const isIncome = tx.transaction_type === 'income';
              const farmObj = farms.find(f => f.id === tx.farm_id);
              return (
                <div key={tx.id} className="p-4 border border-gray-50 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-400'}`}>
                      {isIncome ? '➕' : '➖'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-gray-800 truncate">{tx.category}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${tx.farm_id === 'PERSONAL' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-pink-50 text-pink-500 border-pink-100'}`}>
                          {tx.farm_id === 'PERSONAL' ? '🏠 ส่วนตัว' : (tx.farm_id === 'ALL_FARMS' ? '🏢 ทุกฟาร์ม' : `🏡 ${farmObj?.farm_name || 'ฟาร์ม'}`)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">{tx.description || tx.transaction_date}</p>
                    </div>
                  </div>
                  <div className={`font-black text-sm ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                    {isIncome ? '+' : '-'}฿{Number(tx.amount).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}