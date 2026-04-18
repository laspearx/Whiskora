import { supabase } from '@/lib/supabase';
import type { Profile, Farm, Shop, Service, Pet, Appointment } from '@/types';

interface DashboardData {
  profile: Profile | null;
  farms: Farm[];
  shops: Shop[];
  services: Service[];
  pets: Pet[];
}

export const profileService = {
  async getDashboardData(userId: string): Promise<DashboardData> {
    const [profileRes, farmRes, shopRes, serviceRes, petsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('farms').select('*').eq('user_id', userId),
      supabase.from('shops').select('*').eq('user_id', userId),
      supabase.from('services').select('*').eq('user_id', userId),
      supabase.from('pets').select('*').eq('user_id', userId),
    ]);
    return {
      profile: profileRes.data ?? null,
      farms: farmRes.data ?? [],
      shops: shopRes.data ?? [],
      services: serviceRes.data ?? [],
      pets: petsRes.data ?? [],
    };
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsertProfile(userId: string, profileData: Partial<Omit<Profile, 'id'>>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profileData });
    if (error) throw error;
  },

  async getAppointments(petIds: string[]): Promise<Appointment[]> {
    if (petIds.length === 0) return [];
    const { data, error } = await supabase
      .from('vaccines')
      .select('pet_id, vaccine_name, next_due')
      .in('pet_id', petIds)
      .not('next_due', 'is', null);
    if (error) throw error;
    return data ?? [];
  },

  async uploadAvatar(userId: string, file: Blob): Promise<string> {
    const filePath = `${userId}/avatar`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    return publicUrl;
  },
};
