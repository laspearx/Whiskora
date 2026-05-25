"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  green: '#16A34A', greenSoft: '#F0FDF4', greenBorder: '#BBF7D0',
  red: '#EF4444', redSoft: '#FEF2F2', redBorder: '#FECACA',
  blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  indigo: '#6366F1', indigoSoft: '#EEF2FF', indigoBorder: '#C7D2FE',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  TrendingUp: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  TrendingDown: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>,
  Receipt: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  FileText: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

export default function UniversalPetFinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<any[]>([]);
  const [allLitters, setAllLitters] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const [formData, setFormData] = useState({
    expense_context: "PERSONAL", category: "เธเนเธฒเธญเธฒเธซเธฒเธฃ", amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    litter_id: "", description: "", receipt_url: "",
  });

  const categories = {
    personal: ["เธเนเธฒเธญเธฒเธซเธฒเธฃ", "เธเนเธฒเธ—เธฃเธฒเธขเนเธกเธง", "เธเธญเธเน€เธฅเนเธ/เธเธญเธเนเธเน", "เธเนเธฒเธงเธฑเธเธเธตเธ/เธซเธฒเธซเธกเธญ", "เธเนเธฒเธญเธฒเธเธเนเธณเธ•เธฑเธ”เธเธ", "เธญเธทเนเธเน"],
    farm: ["เธเนเธฒเธญเธฒเธซเธฒเธฃ", "เธเนเธฒเธ—เธฃเธฒเธขเนเธกเธง", "เธเนเธฒเธญเธธเธเธเธฃเธ“เนเธ•เนเธฒเธเน", "เธเนเธฒเธงเธฑเธเธเธตเธ/เธขเธฒเธฃเธฑเธเธฉเธฒ", "เธเนเธฒเธฃเธฑเธเธฉเธฒเธเธขเธฒเธเธฒเธฅ", "เธเนเธฒเธเธชเธกเธเธฑเธเธเธธเน", "เธเนเธฒเนเธเน€เธเนเธ”เธ”เธตเธเธฃเธต", "เธเนเธฒเธเธฃเธนเธกเธกเธดเนเธ", "เธเนเธฒเธเนเธณ/เธเนเธฒเนเธ", "เธญเธทเนเธเน"],
    income: ["เธเธฒเธขเธชเธฑเธ•เธงเนเน€เธฅเธตเนเธขเธ", "เธเนเธฒเธกเธฑเธ”เธเธณ", "เธเนเธฒเธฃเธฑเธเธเธชเธกเธเธฑเธเธเธธเน", "เธฃเธฒเธขเธฃเธฑเธเธญเธทเนเธเน"],
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push(`/login?redirect=${encodeURIComponent('/profile/finance')}`);
        const uid = session.user.id;
        const { data: farmData } = await supabase.from("farms").select("id, farm_name").eq("user_id", uid);
        if (farmData) setFarms(farmData);
        const { data: litterData } = await supabase.from("litters").select("id, litter_code, farm_id").eq("user_id", uid);
        if (litterData) setAllLitters(litterData);
        const { data: txData } = await supabase.from("farm_transactions").select("*").eq("user_id", uid).order("transaction_date", { ascending: false });
        if (txData) setTransactions(txData);
      } catch (error) { console.error("Finance Load Error:", error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [router]);

  const availableLitters = allLitters.filter((l) => l.farm_id?.toString() === formData.expense_context);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "expense_context") { updated.category = "เธเนเธฒเธญเธฒเธซเธฒเธฃ"; updated.litter_id = ""; }
      return updated;
    });
  };

  useEffect(() => {
    if (activeTab === "income") setFormData((prev) => ({ ...prev, category: "เธเธฒเธขเธชเธฑเธ•เธงเนเน€เธฅเธตเนเธขเธ" }));
    else setFormData((prev) => ({ ...prev, category: "เธเนเธฒเธญเธฒเธซเธฒเธฃ" }));
  }, [activeTab]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return alert("เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธเธณเธเธงเธเน€เธเธดเธ");
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.from("farm_transactions").insert([{
        user_id: session?.user.id, farm_id: formData.expense_context, transaction_type: activeTab,
        category: formData.category, amount: Number(formData.amount), transaction_date: formData.transaction_date,
        litter_id: formData.litter_id ? Number(formData.litter_id) : null,
        description: formData.description, receipt_url: formData.receipt_url || null,
      }]).select().single();
      if (error) throw error;
      setTransactions([data, ...transactions]);
      setFormData((prev) => ({ ...prev, amount: "", description: "", receipt_url: "", litter_id: "" }));
      alert("โ… เธเธฑเธเธ—เธถเธเธฃเธฒเธขเธเธฒเธฃเธชเธณเน€เธฃเนเธ!");
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  };

  const currentYear = new Date().getFullYear();
  const yearTransactions = transactions.filter((t) => new Date(t.transaction_date).getFullYear() === currentYear);
  const totalIncome = yearTransactions.filter((t) => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = yearTransactions.filter((t) => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpense;
  const taxDeductible = yearTransactions.filter((t) => t.farm_id !== 'PERSONAL' && t.transaction_type === 'expense' && t.receipt_url).reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <>
      <style>{`

        * { box-sizing: border-box; }
        .fin-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .fin-body { max-width: 1080px; margin: 0 auto; padding: 28px 20px 80px; }
        .fin-top { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
        .fin-top-left { display: flex; align-items: center; gap: 14px; }
        .fin-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.pinkBorder}; box-shadow: 0 2px 8px rgba(232,70,119,0.1); transition: all .18s ease; flex-shrink: 0; }
        .fin-back:hover { color: ${F.pink}; border-color: ${F.pink}; transform: translateX(-1px); }
        .fin-title { font-family: inherit; font-size: 24px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .fin-sub { font-size: 12px; font-weight: 700; color: ${F.muted}; margin-top: 3px; }
        .fin-export { display: inline-flex; align-items: center; gap: 7px; background: ${F.ink}; color: white; padding: 11px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; transition: all .15s; font-family: inherit; }
        .fin-export:hover { background: #1F2937; }
        /* KPI */
        .fin-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .fin-kpi { background: white; border: 1px solid ${F.line}; border-radius: 18px; padding: 18px; position: relative; overflow: hidden; }
        .fin-kpi.tax { background: ${F.blueSoft}; border-color: ${F.blueBorder}; }
        .fin-kpi-icon { position: absolute; top: 12px; right: 12px; opacity: 0.12; }
        .fin-kpi-label { font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .fin-kpi.tax .fin-kpi-label { color: ${F.blue}; opacity: 0.7; }
        .fin-kpi-value { font-family: inherit; font-size: 24px; font-weight: 700; }
        .fin-cols { display: grid; grid-template-columns: 5fr 7fr; gap: 20px; align-items: start; }
        /* form */
        .fin-form-card { background: white; border: 1px solid ${F.line}; border-radius: 22px; padding: 22px; }
        .fin-tabs { display: flex; background: #FAFAFA; padding: 4px; border-radius: 12px; margin-bottom: 20px; border: 1px solid ${F.line}; }
        .fin-tab { flex: 1; padding: 10px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; background: none; color: ${F.muted}; transition: all .15s; font-family: inherit; }
        .fin-tab.active.expense { background: white; color: ${F.red}; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .fin-tab.active.income { background: white; color: ${F.green}; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .fin-field { margin-bottom: 14px; }
        .fin-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .fin-label { display: block; font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; margin-left: 2px; }
        .fin-label.req::after { content: ' *'; color: ${F.pink}; }
        .fin-input, .fin-select, .fin-textarea { width: 100%; padding: 11px 13px; background: #FAFAFA; border: 1px solid ${F.line}; border-radius: 11px; font-size: 13px; font-weight: 600; color: ${F.ink}; outline: none; transition: all .18s; font-family: inherit; }
        .fin-input:focus, .fin-select:focus, .fin-textarea:focus { border-color: ${F.lineMid}; background: white; }
        .fin-select { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 11px center; background-size: 16px; padding-right: 34px; cursor: pointer; }
        .fin-amount { background: white; border: 1px solid ${F.lineMid}; font-family: inherit; font-size: 18px; font-weight: 700; padding: 9px 13px; }
        .fin-litter { background: ${F.indigoSoft}; border-color: ${F.indigoBorder}; color: ${F.indigo}; }
        .fin-textarea { resize: none; }
        .fin-receipt-label { display: flex; align-items: center; gap: 5px; }
        .fin-submit { width: 100%; padding: 14px; border-radius: 13px; font-size: 15px; font-weight: 700; color: white; cursor: pointer; border: none; transition: all .15s; font-family: inherit; margin-top: 4px; }
        .fin-submit.expense { background: ${F.red}; box-shadow: 0 4px 14px rgba(239,68,68,0.25); }
        .fin-submit.expense:hover { background: #DC2626; }
        .fin-submit.income { background: ${F.green}; box-shadow: 0 4px 14px rgba(22,163,74,0.25); }
        .fin-submit.income:hover { background: #15803D; }
        .fin-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        /* list */
        .fin-list-card { background: white; border: 1px solid ${F.line}; border-radius: 22px; padding: 22px; display: flex; flex-direction: column; max-height: 680px; }
        .fin-list-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; }
        .fin-list-title { font-family: inherit; font-size: 18px; font-weight: 700; color: ${F.ink}; }
        .fin-list-count { font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.05em; }
        .fin-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px; }
        .fin-empty { text-align: center; padding: 48px 20px; color: ${F.muted}; font-size: 14px; font-weight: 600; }
        .fin-tx { padding: 14px; border: 1px solid ${F.line}; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; transition: background .15s; }
        .fin-tx:hover { background: #FAFAFA; }
        .fin-tx-left { display: flex; align-items: center; gap: 13px; min-width: 0; }
        .fin-tx-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid; }
        .fin-tx-icon.income { background: ${F.greenSoft}; color: ${F.green}; border-color: ${F.greenBorder}; }
        .fin-tx-icon.expense { background: ${F.redSoft}; color: ${F.red}; border-color: ${F.redBorder}; }
        .fin-tx-cat-row { display: flex; align-items: center; gap: 7px; margin-bottom: 3px; }
        .fin-tx-cat { font-size: 14px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fin-tx-tax { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; background: ${F.blueSoft}; color: ${F.blue}; border: 1px solid ${F.blueBorder}; border-radius: 5px; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; }
        .fin-tx-meta { display: flex; align-items: center; gap: 7px; font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.04em; }
        .fin-tx-amount { font-family: inherit; font-size: 16px; font-weight: 700; flex-shrink: 0; }
        .fin-tx-amount.income { color: ${F.green}; }
        .fin-tx-amount.expense { color: ${F.ink}; }
        .fin-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .fin-spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${F.pinkBorder}; border-top-color: ${F.pink}; animation: finspin 1s linear infinite; }
        @keyframes finspin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) { .fin-kpis { grid-template-columns: 1fr 1fr; } .fin-cols { grid-template-columns: 1fr; } .fin-list-card { max-height: none; } }
      `}</style>

      {loading ? (
        <div className="fin-loading">
          <div className="fin-spinner" />
          <p style={{ fontSize: 13, fontWeight: 700, color: F.muted }}>เธเธณเธฅเธฑเธเนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเธเธฒเธฃเน€เธเธดเธ...</p>
        </div>
      ) : (
        <div className="fin-page">
          <div className="fin-body">
            <div className="fin-top">
              <div className="fin-top-left">
                <button className="fin-back" onClick={() => router.back()} aria-label="เธขเนเธญเธเธเธฅเธฑเธ"><Icon.ArrowLeft /></button>
                <div>
                  <h1 className="fin-title">เธเธฑเธเธเธตเธฃเธฒเธขเธฃเธฑเธ-เธฃเธฒเธขเธเนเธฒเธข</h1>
                  <p className="fin-sub">เธเธฑเธเธเธตเธเธฒเธฃเนเธก &amp; เธ เธฒเธฉเธต เธเธฃเธฐเธเธณเธเธต {currentYear}</p>
                </div>
              </div>
              <button className="fin-export" onClick={() => alert('เธเธตเน€เธเธญเธฃเน Export Excel เธเธณเธฅเธฑเธเธเธฑเธ’เธเธฒ เธเธฐเน€เธเธดเธ”เนเธซเนเนเธเนเน€เธฃเนเธงเน เธเธตเนเธเธฃเธฑเธ')}>
                <Icon.Download /> Export เธ เธฒเธฉเธต (Excel)
              </button>
            </div>

            <div className="fin-kpis">
              <div className="fin-kpi">
                <div className="fin-kpi-icon" style={{ color: F.green }}><Icon.TrendingUp /></div>
                <div className="fin-kpi-label">เธฃเธฒเธขเธฃเธฑเธเธเธฒเธฃเนเธก (เธเธตเธเธตเน)</div>
                <div className="fin-kpi-value" style={{ color: F.green }}>เธฟ{totalIncome.toLocaleString()}</div>
              </div>
              <div className="fin-kpi">
                <div className="fin-kpi-icon" style={{ color: F.red }}><Icon.TrendingDown /></div>
                <div className="fin-kpi-label">เธฃเธฒเธขเธเนเธฒเธขเธ—เธฑเนเธเธซเธกเธ” (เธเธตเธเธตเน)</div>
                <div className="fin-kpi-value" style={{ color: F.red }}>เธฟ{totalExpense.toLocaleString()}</div>
              </div>
              <div className="fin-kpi">
                <div className="fin-kpi-label">เธเธณเนเธฃเธชเธธเธ—เธเธด</div>
                <div className="fin-kpi-value" style={{ color: netProfit >= 0 ? F.ink : F.red }}>{netProfit >= 0 ? '' : '-'}เธฟ{Math.abs(netProfit).toLocaleString()}</div>
              </div>
              <div className="fin-kpi tax">
                <div className="fin-kpi-icon" style={{ color: F.blue }}><Icon.Receipt /></div>
                <div className="fin-kpi-label">เธฃเธฒเธขเธเนเธฒเธขเธกเธตเนเธเน€เธชเธฃเนเธ (เธซเธฑเธเธ เธฒเธฉเธตเนเธ”เน)</div>
                <div className="fin-kpi-value" style={{ color: F.blue }}>เธฟ{taxDeductible.toLocaleString()}</div>
              </div>
            </div>

            <div className="fin-cols">
              <div className="fin-form-card">
                <div className="fin-tabs">
                  <button className={`fin-tab expense ${activeTab === 'expense' ? 'active' : ''}`} onClick={() => setActiveTab('expense')}>เธฅเธเธฃเธฒเธขเธเนเธฒเธข</button>
                  <button className={`fin-tab income ${activeTab === 'income' ? 'active' : ''}`} onClick={() => setActiveTab('income')}>เธฅเธเธฃเธฒเธขเธฃเธฑเธ</button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="fin-field fin-grid2">
                    <div>
                      <label className="fin-label">เธเธฑเธเธเธตเธเธญเธ</label>
                      <select name="expense_context" className="fin-select" value={formData.expense_context} onChange={handleChange}>
                        <option value="PERSONAL">๐  เธชเธฑเธ•เธงเนเน€เธฅเธตเนเธขเธเธชเนเธงเธเธ•เธฑเธง</option>
                        {farms.length > 0 && (
                          <optgroup label="เธเธธเธฃเธเธดเธเธเธฒเธฃเนเธก">
                            <option value="ALL_FARMS">๐ข เธฃเธงเธกเธ—เธธเธเธเธฒเธฃเนเธก</option>
                            {farms.map((f) => <option key={f.id} value={f.id}>๐ก {f.farm_name}</option>)}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="fin-label">เธซเธกเธงเธ”เธซเธกเธนเน</label>
                      <select name="category" className="fin-select" value={formData.category} onChange={handleChange}>
                        {activeTab === "income"
                          ? categories.income.map((c) => <option key={c} value={c}>{c}</option>)
                          : (formData.expense_context === "PERSONAL" ? categories.personal : categories.farm).map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {formData.expense_context !== "PERSONAL" && formData.expense_context !== "ALL_FARMS" && (
                    <div className="fin-field">
                      <select name="litter_id" className="fin-select fin-litter" value={formData.litter_id} onChange={handleChange}>
                        <option value="">โ€” เนเธกเนเธฃเธฐเธเธธเธเธฃเธญเธ (เธฃเธงเธกเธเธญเธเธเธฒเธฃเนเธก) โ€”</option>
                        {availableLitters.map((l) => <option key={l.id} value={l.id}>๐พ เธเธฃเธญเธ: {l.litter_code}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="fin-field fin-grid2">
                    <div>
                      <label className="fin-label req">เธเธณเธเธงเธเน€เธเธดเธ (เธเธฒเธ—)</label>
                      <input required type="number" name="amount" className="fin-input fin-amount" value={formData.amount} onChange={handleChange} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="fin-label req">เธงเธฑเธเธ—เธตเนเธ—เธณเธฃเธฒเธขเธเธฒเธฃ</label>
                      <input required type="date" name="transaction_date" className="fin-input" value={formData.transaction_date} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="fin-field">
                    <textarea name="description" className="fin-textarea" rows={2} value={formData.description} onChange={handleChange} placeholder="เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธก (เน€เธเนเธ เธเธทเนเธญเธฃเนเธฒเธเธเนเธฒ, เธฃเธฒเธขเธเธฒเธฃเธชเธดเธเธเนเธฒ)..." />
                  </div>

                  <div className="fin-field">
                    <label className="fin-label fin-receipt-label"><Icon.FileText /> เน€เธญเธเธชเธฒเธฃเธญเนเธฒเธเธญเธดเธ / เนเธเธเธณเธเธฑเธเธ เธฒเธฉเธต</label>
                    <input type="text" name="receipt_url" className="fin-input" value={formData.receipt_url} onChange={handleChange} placeholder="เธงเธฒเธเธฅเธดเธเธเนเธฃเธนเธเนเธเน€เธชเธฃเนเธ เธซเธฃเธทเธญเน€เธฅเธเธ—เธตเนเน€เธญเธเธชเธฒเธฃ" />
                  </div>

                  <button type="button" className={`fin-submit ${activeTab}`} onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'เธเธณเธฅเธฑเธเธเธฑเธเธ—เธถเธ...' : `เธเธฑเธเธ—เธถเธ${activeTab === 'income' ? 'เธฃเธฒเธขเธฃเธฑเธ' : 'เธฃเธฒเธขเธเนเธฒเธข'} ๐’พ`}
                  </button>
                </form>
              </div>

              <div className="fin-list-card">
                <div className="fin-list-head">
                  <h2 className="fin-list-title">เธฃเธฒเธขเธเธฒเธฃเธฅเนเธฒเธชเธธเธ”</h2>
                  <span className="fin-list-count">{transactions.length} เธฃเธฒเธขเธเธฒเธฃ</span>
                </div>
                <div className="fin-list">
                  {transactions.length === 0 ? (
                    <div className="fin-empty">เธขเธฑเธเนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเธเธฑเธเธ—เธถเธ</div>
                  ) : transactions.map((tx) => {
                    const isIncome = tx.transaction_type === 'income';
                    const farmObj = farms.find((f) => f.id === tx.farm_id);
                    const hasReceipt = !!tx.receipt_url;
                    const ctxLabel = tx.farm_id === 'PERSONAL' ? 'เธชเนเธงเธเธ•เธฑเธง' : (tx.farm_id === 'ALL_FARMS' ? 'เธฃเธงเธกเธ—เธธเธเธเธฒเธฃเนเธก' : farmObj?.farm_name || 'เธเธฒเธฃเนเธก');
                    return (
                      <div key={tx.id} className="fin-tx">
                        <div className="fin-tx-left">
                          <div className={`fin-tx-icon ${isIncome ? 'income' : 'expense'}`}>{isIncome ? <Icon.TrendingUp /> : <Icon.TrendingDown />}</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fin-tx-cat-row">
                              <span className="fin-tx-cat">{tx.category}</span>
                              {hasReceipt && <span className="fin-tx-tax"><Icon.FileText /> TAX</span>}
                            </div>
                            <div className="fin-tx-meta">
                              <span>{new Date(tx.transaction_date).toLocaleDateString('th-TH')}</span>
                              <span>โ€ข</span>
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ctxLabel}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`fin-tx-amount ${isIncome ? 'income' : 'expense'}`}>
                          {isIncome ? '+' : '-'}เธฟ{Number(tx.amount).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}