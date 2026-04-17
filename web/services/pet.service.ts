import { supabase } from '@/lib/supabase';
import type { Pet, Vaccine, PetStats, PetWithFarm } from '@/types';

export const petService = {
  async getPetById(petId: string, userId?: string): Promise<Pet | null> {
    let query = supabase.from('pets').select('*').eq('id', petId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  async getPetsByUser(userId: string): Promise<Pet[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data ?? [];
  },

  async createPet(petData: Omit<Pet, 'id'>): Promise<Pet> {
    const { data, error } = await supabase
      .from('pets')
      .insert(petData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePet(petId: string, petData: Partial<Omit<Pet, 'id'>>): Promise<Pet> {
    const { data, error } = await supabase
      .from('pets')
      .update(petData)
      .eq('id', petId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getVaccinesByPet(petId: string): Promise<Vaccine[]> {
    const { data, error } = await supabase
      .from('vaccines')
      .select('*')
      .eq('pet_id', petId)
      .order('date_given', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getPetsByFarm(farmId: string): Promise<Pet[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('farm_id', farmId);
    if (error) throw error;
    return data ?? [];
  },

  async getPetStatsByFarm(farmId: string): Promise<PetStats> {
    const { data, error } = await supabase
      .from('pets')
      .select('status')
      .eq('farm_id', farmId);
    if (error) throw error;
    const stats: PetStats = { breeders: 0, kids: 0, ready: 0, retired: 0, booked: 0 };
    for (const pet of data ?? []) {
      if (pet.status === 'พ่อพันธุ์ / แม่พันธุ์') stats.breeders++;
      else if (pet.status === 'เด็ก') stats.kids++;
      else if (pet.status === 'พร้อมย้ายบ้าน') stats.ready++;
      else if (pet.status === 'ทำหมัน / ปลดระวาง') stats.retired++;
      else if (pet.status === 'ติดจอง') stats.booked++;
    }
    return stats;
  },

  async getAvailablePets(): Promise<PetWithFarm[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('*, farms(farm_name)')
      .eq('status', 'พร้อมย้ายบ้าน')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PetWithFarm[];
  },

  async uploadPetPhoto(userId: string, file: Blob, fileName?: string): Promise<string> {
    const name = fileName ?? `temp_${Date.now()}`;
    const filePath = `${userId}/${name}`;
    const { error } = await supabase.storage
      .from('pet-photos')
      .upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('pet-photos')
      .getPublicUrl(filePath);
    return publicUrl;
  },
};
