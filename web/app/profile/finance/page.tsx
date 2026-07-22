"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#1f1a1c", inkSoft: "#4a3f44", muted: "#8e7e84",
  pink: "#e84677", pinkSoft: "#fde2ea", pinkBorder: "#FBCFE8",
  green: "#16A34A", greenSoft: "#F0FDF4", greenBorder: "#BBF7D0",
  red: "#EF4444", redSoft: "#FEF2F2", redBorder: "#FECACA",
  line: "#f3dde3", lineMid: "#E5E7EB", bg: "#fffafc",
};

const EXPENSE_CATS = ["ค่าอาหาร", "ค่าทรายแมว", "ค่าอุปกรณ์", "ค่าวัคซีน/ยา", "ค่ารักษาพยาบาล", "ค่าผสมพันธุ์", "ค่าใบเพ็ดดีกรี", "ค่ากรูมมิ่ง", "ค่าน้ำ/ค่าไฟ", "อื่นๆ"];
const INCOME_CATS  = ["ขายสัตว์เลี้ยง", "ค่ามัดจำ", "ค่ารับผสมพันธุ์", "รายรับอื่นๆ"];

const fmtMoney = (n: number) => `฿${Math.abs(n).toLocaleString()}`;
const fmtDate  = (d: string) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

function FinancePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockedFarmId = searchParams.get("farm_id");
  const [loading,      setLoading]      = useState(true);
  const [farms,        setFarms]        = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tab,          setTab]          = useState<"expense" | "income">("expense");
  const [saving,       setSaving]       = useState(false);
  const [showForm,     setShowForm]     = useState(false);

  const [form, setForm] = useState({
    farm_id:          "",
    category:         EXPENSE_CATS[0],
    amount:           "",
    transaction_date: new Date().toISOString().split("T")[0],
    description:      "",
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const uid = session.user.id;
      const [{ data: farmData }, { data: txData }] = await Promise.all([
        supabase.from("farms").select("id, farm_name").eq("user_id", uid),
        supabase.from("farm_transactions").select("*").eq("user_id", uid).order("transaction_date", { ascending: false }),
      ]);
      const loadedFarms = farmData || [];
      setFarms(loadedFarms);
      if (lockedFarmId) {
        setForm(f => ({ ...f, farm_id: lockedFarmId }));
      } else if (loadedFarms.length > 0) {
        setForm(f => ({ ...f, farm_id: String(loadedFarms[0].id) }));
      }
      setTransactions(txData || []);
      setLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    setForm(f => ({ ...f, category: tab === "income" ? INCOME_CATS[0] : EXPENSE_CATS[0] }));
  }, [tab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { alert("กรุณาระบุจำนวนเงิน"); return; }
    if (!form.farm_id) { alert("กรุณาเลือกฟาร์ม"); return; }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.from("farm_transactions").insert([{
        user_id:          session!.user.id,
        farm_id:          form.farm_id,
        transaction_type: tab,
        category:         form.category,
        amount:           Number(form.amount),
        transaction_date: form.transaction_date,
        description:      form.description || null,
      }]).select().single();
      if (error) throw error;
      setTransactions(prev => [data, ...prev]);
      setForm(f => ({ ...f, amount: "", description: "" }));
      setShowForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally { setSaving(false); }
  };

  const thisYear  = new Date().getFullYear();
  const thisMonth = new Date().getMonth();
  const yearTx    = transactions.filter(t => new Date(t.transaction_date).getFullYear() === thisYear);
  const monthTx   = transactions.filter(t => {
    const d = new Date(t.transaction_date);
    return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
  });
  const sumI = (txs: any[]) => txs.filter(t => t.transaction_type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const sumE = (txs: any[]) => txs.filter(t => t.transaction_type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const mI = sumI(monthTx), mE = sumE(monthTx), mNet = mI - mE;
  const yI = sumI(yearTx),  yE = sumE(yearTx),  yNet = yI - yE;
  const farmName = (id: string) => farms.find(f => String(f.id) === id)?.farm_name || "ฟาร์ม";

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .fin-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .fin-body { max-width: 640px; margin: 0 auto; padding: 20px 16px 100px; }

        /* header */
        .fin-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .fin-back { width: 38px; height: 38px; border-radius: 11px; background: white; border: 1px solid ${F.line}; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${F.inkSoft}; flex-shrink: 0; }
        .fin-h1 { font-size: 20px; font-weight: 700; color: ${F.ink}; margin: 0; }

        /* stat row */
        .fin-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .fin-stat { background: white; border: 1px solid ${F.line}; border-radius: 14px; padding: 14px; }
        .fin-stat-label { font-size: 10px; font-weight: 500; color: ${F.muted}; margin-bottom: 4px; }
        .fin-stat-val { font-size: 20px; font-weight: 700; line-height: 1; }
        .fin-stat-sub { font-size: 10px; color: ${F.muted}; margin-top: 4px; font-weight: 400; }

        /* section */
        .fin-sec { background: white; border: 1px solid ${F.line}; border-radius: 14px; padding: 14px; margin-bottom: 10px; }
        .fin-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .fin-sec-h { font-size: 14px; font-weight: 600; color: ${F.ink}; margin: 0; }
        .fin-add-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; color: ${F.pink}; background: ${F.pinkSoft}; border: 1px solid ${F.pinkBorder}; padding: 5px 12px; border-radius: 8px; cursor: pointer; font-family: inherit; }

        /* tabs */
        .fin-tabs { display: flex; background: #F3F4F6; border-radius: 10px; padding: 3px; margin-bottom: 14px; }
        .fin-tab { flex: 1; padding: 8px; border-radius: 8px; border: none; background: transparent; font-family: inherit; font-size: 12px; font-weight: 600; color: ${F.muted}; cursor: pointer; transition: all .15s; }
        .fin-tab.active-expense { background: white; color: ${F.red}; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
        .fin-tab.active-income  { background: white; color: ${F.green}; box-shadow: 0 1px 3px rgba(0,0,0,.1); }

        /* form */
        .fin-field { margin-bottom: 12px; }
        .fin-label { font-size: 11px; font-weight: 500; color: ${F.inkSoft}; margin-bottom: 5px; display: block; }
        .fin-input { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1.5px solid ${F.line}; background: white; font-family: inherit; font-size: 14px; color: ${F.ink}; outline: none; transition: border-color .15s; }
        .fin-input:focus { border-color: ${F.pink}; }
        .fin-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .fin-save { width: 100%; padding: 13px; border-radius: 12px; border: none; font-family: inherit; font-size: 14px; font-weight: 600; color: white; cursor: pointer; margin-top: 4px; transition: opacity .15s; }
        .fin-save:disabled { opacity: .6; cursor: not-allowed; }
        .fin-cancel { width: 100%; padding: 11px; border-radius: 12px; border: 1px solid ${F.lineMid}; background: #F9FAFB; font-family: inherit; font-size: 13px; font-weight: 500; color: ${F.muted}; cursor: pointer; margin-top: 6px; }

        /* tx list */
        .fin-tx { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid ${F.line}; }
        .fin-tx:last-child { border-bottom: none; padding-bottom: 0; }
        .fin-tx-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .fin-tx-info { flex: 1; min-width: 0; }
        .fin-tx-cat { font-size: 13px; font-weight: 500; color: ${F.ink}; }
        .fin-tx-meta { font-size: 11px; color: ${F.muted}; font-weight: 400; margin-top: 1px; }
        .fin-tx-amt { font-size: 14px; font-weight: 600; flex-shrink: 0; }
        .fin-empty { font-size: 12px; color: ${F.muted}; text-align: center; padding: 20px 0; font-weight: 400; }
      `}</style>

      <div className="fin-page">
        <div className="fin-body">

          {/* Header */}
          <div className="fin-header">
            <button className="fin-back" onClick={() => router.back()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 className="fin-h1">รายรับรายจ่าย</h1>
          </div>

          {/* Monthly Stats */}
          <div className="fin-stats">
            <div className="fin-stat">
              <div className="fin-stat-label">รายรับเดือนนี้</div>
              <div className="fin-stat-val" style={{ color: F.green }}>{fmtMoney(mI)}</div>
              <div className="fin-stat-sub">รายจ่าย {fmtMoney(mE)}</div>
            </div>
            <div className="fin-stat">
              <div className="fin-stat-label">กำไรสุทธิเดือนนี้</div>
              <div className="fin-stat-val" style={{ color: mNet >= 0 ? F.green : F.red }}>
                {mNet >= 0 ? "+" : "-"}{fmtMoney(mNet)}
              </div>
              <div className="fin-stat-sub">ปีนี้สะสม {yNet >= 0 ? "+" : "-"}{fmtMoney(yNet)}</div>
            </div>
          </div>

          {/* Annual Summary */}
          <div className="fin-stats" style={{ marginBottom: 10 }}>
            <div className="fin-stat">
              <div className="fin-stat-label">รายรับปี {thisYear}</div>
              <div className="fin-stat-val" style={{ color: F.green, fontSize: 16 }}>{fmtMoney(yI)}</div>
            </div>
            <div className="fin-stat">
              <div className="fin-stat-label">รายจ่ายปี {thisYear}</div>
              <div className="fin-stat-val" style={{ color: F.red, fontSize: 16 }}>{fmtMoney(yE)}</div>
            </div>
          </div>

          {/* Add Transaction */}
          <div className="fin-sec">
            <div className="fin-sec-head">
              <h2 className="fin-sec-h">บันทึกรายการ</h2>
            </div>

            <div className="fin-tabs">
              <button className={`fin-tab ${tab === "expense" ? "active-expense" : ""}`} onClick={() => setTab("expense")}>
                รายจ่าย
              </button>
              <button className={`fin-tab ${tab === "income" ? "active-income" : ""}`} onClick={() => setTab("income")}>
                รายรับ
              </button>
            </div>

            <form onSubmit={handleSave}>
              {!lockedFarmId && farms.length > 1 && (
                <div className="fin-field">
                  <label className="fin-label">ฟาร์ม</label>
                  <select className="fin-input" value={form.farm_id}
                    onChange={e => setForm(f => ({ ...f, farm_id: e.target.value }))}>
                    {farms.map(fm => <option key={fm.id} value={String(fm.id)}>{fm.farm_name}</option>)}
                  </select>
                </div>
              )}

              <div className="fin-row2">
                <div className="fin-field">
                  <label className="fin-label">หมวดหมู่</label>
                  <select className="fin-input" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {(tab === "income" ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fin-field">
                  <label className="fin-label">จำนวนเงิน (บาท)</label>
                  <input className="fin-input" type="number" placeholder="0" min="0" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>

              <div className="fin-field">
                <label className="fin-label">วันที่</label>
                <input className="fin-input" type="date" value={form.transaction_date}
                  onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} />
              </div>

              <div className="fin-field">
                <label className="fin-label">หมายเหตุ (ไม่บังคับ)</label>
                <input className="fin-input" placeholder="รายละเอียดเพิ่มเติม..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <button type="submit" className="fin-save" disabled={saving}
                style={{ background: tab === "income" ? F.green : F.red }}>
                {saving ? "กำลังบันทึก..." : `บันทึก${tab === "income" ? "รายรับ" : "รายจ่าย"}`}
              </button>
            </form>
          </div>

          {/* Transaction List */}
          <div className="fin-sec">
            <div className="fin-sec-head">
              <h2 className="fin-sec-h">รายการล่าสุด</h2>
              <span style={{ fontSize: 11, color: F.muted }}>{transactions.length} รายการ</span>
            </div>

            {transactions.length === 0 ? (
              <div className="fin-empty">ยังไม่มีรายการ — เริ่มบันทึกรายรับรายจ่ายได้เลย</div>
            ) : (
              transactions.slice(0, 30).map(tx => {
                const isIncome = tx.transaction_type === "income";
                return (
                  <div key={tx.id} className="fin-tx">
                    <div className="fin-tx-dot" style={{ background: isIncome ? F.green : F.red }} />
                    <div className="fin-tx-info">
                      <div className="fin-tx-cat">{tx.category}</div>
                      <div className="fin-tx-meta">
                        {fmtDate(tx.transaction_date)}
                        {tx.farm_id && ` · ${farmName(tx.farm_id)}`}
                        {tx.description && ` · ${tx.description}`}
                      </div>
                    </div>
                    <div className="fin-tx-amt" style={{ color: isIncome ? F.green : F.red }}>
                      {isIncome ? "+" : "-"}{fmtMoney(Number(tx.amount))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FinancePageContent />
    </Suspense>
  );
}
