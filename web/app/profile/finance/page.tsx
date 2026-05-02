"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ─── Minimal Icons ─────────────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  TrendingUp: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  TrendingDown: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>,
  Receipt: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  FileText: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
};

export default function UniversalPetFinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<any[]>([]);
  const [allLitters, setAllLitters] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  // 🌟 Form State
  const [formData, setFormData] = useState({
    expense_context: "PERSONAL", 
    category: "ค่าอาหาร",
    amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    litter_id: "", 
    description: "",
    receipt_url: "",
  });

  const categories = {
    personal: ["ค่าอาหาร", "ค่าทรายแมว", "ของเล่น/ของใช้", "ค่าวัคซีน/หาหมอ", "ค่าอาบน้ำตัดขน", "อื่นๆ"],
    farm: ["ค่าอาหาร", "ค่าทรายแมว", "ค่าอุปกรณ์ต่างๆ", "ค่าวัคซีน/ยารักษา", "ค่ารักษาพยาบาล", "ค่าผสมพันธุ์", "ค่าใบเพ็ดดีกรี", "ค่ากรูมมิ่ง", "ค่าน้ำ/ค่าไฟ", "อื่นๆ"],
    income: ["ขายสัตว์เลี้ยง", "ค่ามัดจำ", "ค่ารับผสมพันธุ์", "รายรับอื่นๆ"]
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");
        const uid = session.user.id;

        const { data: farmData } = await supabase.from("farms").select("id, farm_name").eq("user_id", uid);
        if (farmData) setFarms(farmData);

        const { data: litterData } = await supabase.from("litters").select("id, litter_code, farm_id").eq("user_id", uid);
        if (litterData) setAllLitters(litterData);

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

  const availableLitters = allLitters.filter(l => l.farm_id?.toString() === formData.expense_context);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "expense_context") {
        updated.category = value === "PERSONAL" ? "ค่าอาหาร" : "ค่าอาหาร";
        updated.litter_id = ""; 
      }
      return updated;
    });
  };

  // เปลี่ยนหมวดหมู่ให้ตรงกับ Tab ที่เลือกอัตโนมัติ
  useEffect(() => {
    if (activeTab === "income") {
      setFormData(prev => ({ ...prev, category: "ขายสัตว์เลี้ยง" }));
    } else {
      setFormData(prev => ({ ...prev, category: prev.expense_context === "PERSONAL" ? "ค่าอาหาร" : "ค่าอาหาร" }));
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return alert("กรุณาระบุจำนวนเงิน");
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.from("farm_transactions").insert([{
        user_id: session?.user.id,
        farm_id: formData.expense_context,
        transaction_type: activeTab,
        category: formData.category,
        amount: Number(formData.amount),
        transaction_date: formData.transaction_date,
        litter_id: formData.litter_id ? Number(formData.litter_id) : null,
        description: formData.description,
        receipt_url: formData.receipt_url || null,
      }]).select().single();

      if (error) throw error;

      setTransactions([data, ...transactions]);
      setFormData(prev => ({ ...prev, amount: "", description: "", receipt_url: "", litter_id: "" }));
      alert("✅ บันทึกรายการสำเร็จ!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🌟 Dashboard Calculations (This Year)
  const currentYear = new Date().getFullYear();
  const yearTransactions = transactions.filter(t => new Date(t.transaction_date).getFullYear() === currentYear);
  
  const totalIncome = yearTransactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = yearTransactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpense;
  
  // ยอดที่นำไปลดหย่อนได้ (สมมติว่าต้องเป็นของ Farm และมีเอกสาร)
  const taxDeductible = yearTransactions.filter(t => t.farm_id !== 'PERSONAL' && t.transaction_type === 'expense' && t.receipt_url).reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm font-semibold tracking-widest text-gray-400 animate-pulse uppercase">Loading Financial Dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-24 animate-in fade-in duration-700 font-sans text-gray-900">
      
      {/* 🔙 Header & Export Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Financial Dashboard</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">บัญชีฟาร์ม & ภาษี ประจำปี {currentYear}</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-md">
          <Icon.Download /> Export for Tax (Excel)
        </button>
      </div>

      {/* 📊 KPI Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-green-500"><Icon.TrendingUp /></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">รายรับฟาร์ม (YTD)</p>
          <p className="text-2xl font-black text-green-500">฿{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500"><Icon.TrendingDown /></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">รายจ่ายทั้งหมด (YTD)</p>
          <p className="text-2xl font-black text-red-500">฿{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">กำไรสุทธิ (Net Profit)</p>
          <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
            {netProfit >= 0 ? '' : '-'}฿{Math.abs(netProfit).toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50/50 p-5 rounded-[1.5rem] border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500"><Icon.Receipt /></div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">รายจ่ายที่มีใบเสร็จ (หักภาษีได้)</p>
          <p className="text-2xl font-black text-blue-600">฿{taxDeductible.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 📝 Quick Add Form Section */}
        <div className="lg:col-span-5 bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
          
          {/* Tabs Control */}
          <div className="flex bg-gray-50 p-1 rounded-xl mb-6 border border-gray-100">
            <button 
              onClick={() => setActiveTab("expense")} 
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "expense" ? "bg-white text-red-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              ลงรายจ่าย (Expense)
            </button>
            <button 
              onClick={() => setActiveTab("income")} 
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "income" ? "bg-white text-green-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              ลงรายรับ (Income)
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Context & Category Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">บัญชีของ</label>
                <select name="expense_context" value={formData.expense_context} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-gray-300 text-xs font-bold text-gray-800 appearance-none">
                  <option value="PERSONAL">🏠 สัตว์เลี้ยงส่วนตัว</option>
                  {farms.length > 0 && (
                    <optgroup label="ธุรกิจฟาร์ม">
                      <option value="ALL_FARMS">🏢 รวมทุกฟาร์ม</option>
                      {farms.map(f => <option key={f.id} value={f.id}>🏡 {f.farm_name}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">หมวดหมู่</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-gray-300 text-xs font-bold text-gray-800 appearance-none">
                  {activeTab === "income" 
                    ? categories.income.map(c => <option key={c} value={c}>{c}</option>)
                    : (formData.expense_context === "PERSONAL" ? categories.personal : categories.farm).map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>
            </div>

            {/* Litter Context (Optional for Farm) */}
            {formData.expense_context !== "PERSONAL" && formData.expense_context !== "ALL_FARMS" && (
              <div className="animate-in fade-in zoom-in-95">
                <select name="litter_id" value={formData.litter_id} onChange={handleChange} className="w-full bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 text-xs font-bold text-indigo-700 outline-none appearance-none">
                  <option value="">-- ไม่ระบุครอก (รายรับ/จ่ายรวมของฟาร์ม) --</option>
                  {availableLitters.map(l => <option key={l.id} value={l.id}>🐾 ครอก: {l.litter_code}</option>)}
                </select>
              </div>
            )}

            {/* Amount & Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">จำนวนเงิน (บาท) *</label>
                <input required type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-black text-gray-900 text-lg outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">วันที่ทำรายการ *</label>
                <input required type="date" name="transaction_date" value={formData.transaction_date} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none h-[54px]" />
              </div>
            </div>

            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="รายละเอียดเพิ่มเติม (เช่น ชื่อร้านค้า, รายการสินค้า)..." className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 outline-none focus:border-gray-300" rows={2} />

            {/* 🧾 Tax Receipt Section */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                <Icon.FileText /> เอกสารอ้างอิง / ใบกำกับภาษี
              </label>
              <input type="text" name="receipt_url" value={formData.receipt_url} onChange={handleChange} placeholder="วางลิงก์รูปภาพใบเสร็จ หรือ เลขที่เอกสารอ้างอิง" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium text-gray-600 outline-none focus:border-gray-300" />
            </div>

            <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-xl font-black text-white shadow-xl transition-all active:scale-95 ${isSubmitting ? 'bg-gray-300' : (activeTab === 'income' ? 'bg-green-500 hover:bg-green-600 shadow-green-100' : 'bg-red-500 hover:bg-red-600 shadow-red-100')}`}>
              {isSubmitting ? 'กำลังบันทึก...' : `บันทึก${activeTab === 'income' ? 'รายรับ' : 'รายจ่าย'} 💾`}
            </button>
          </form>
        </div>

        {/* 📋 Recent Transactions List */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm h-[680px] flex flex-col">
          <div className="flex justify-between items-end mb-5">
            <h2 className="text-lg font-black text-gray-900">Recent Transactions</h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{transactions.length} records</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {transactions.map(tx => {
              const isIncome = tx.transaction_type === 'income';
              const farmObj = farms.find(f => f.id === tx.farm_id);
              const hasReceipt = !!tx.receipt_url;

              return (
                <div key={tx.id} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${isIncome ? 'bg-green-50 text-green-500 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                      {isIncome ? <Icon.TrendingUp /> : <Icon.TrendingDown />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{tx.category}</p>
                        {hasReceipt && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded border border-blue-100 flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider" title="มีเอกสารใบเสร็จ">
                            <Icon.FileText /> TAX
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>{new Date(tx.transaction_date).toLocaleDateString('en-GB')}</span>
                        <span>•</span>
                        <span className="truncate">{tx.farm_id === 'PERSONAL' ? 'PERSONAL' : (tx.farm_id === 'ALL_FARMS' ? 'ALL FARMS' : farmObj?.farm_name || 'FARM')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className={`font-black text-base ${isIncome ? 'text-green-500' : 'text-gray-900'}`}>
                      {isIncome ? '+' : '-'}฿{Number(tx.amount).toLocaleString()}
                    </div>
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