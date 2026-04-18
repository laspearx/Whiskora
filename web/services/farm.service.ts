import { supabase } from '@/lib/supabase';
import type { Farm, Litter, FarmTransaction } from '@/types';

export const farmService = {
  async getFarmById(farmId: string): Promise<Farm | null> {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .single();
    if (error) throw error;
    return data;
  },

  async getFarmByIdForUser(farmId: string, userId: string): Promise<Farm | null> {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .eq('user_id', userId)
      .single();
    if (error) return null;
    return data;
  },

  async getFarmsByUser(userId: string): Promise<Farm[]> {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data ?? [];
  },

  async getLittersByFarm(farmId: string): Promise<Litter[]> {
    const { data, error } = await supabase
      .from('litters')
      .select('*, sire:pets!sire_id(name, image_url), dam:pets!dam_id(name, image_url)')
      .eq('farm_id', farmId)
      .order('mating_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Litter[];
  },

  async getTransactionsByFarm(farmId: string): Promise<FarmTransaction[]> {
    const { data, error } = await supabase
      .from('farm_transactions')
      .select('*')
      .eq('farm_id', farmId);
    if (error) throw error;
    return data ?? [];
  },

  calcFinanceStats(transactions: FarmTransaction[]) {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.transaction_type === 'income') income += Number(tx.amount);
      else if (tx.transaction_type === 'expense') expense += Number(tx.amount);
    }
    return { income, expense, profit: income - expense };
  },
};
