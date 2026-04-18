export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export interface Pet {
  id: string;
  user_id: string;
  farm_id: string | null;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
  gender: string;
  birth_date: string | null;
  image_url: string | null;
  status: string;
  allergies: string | null;
  traits: string | null;
}

export interface Vaccine {
  id: string;
  pet_id: string;
  vaccine_name: string;
  date_given: string;
  next_due: string | null;
}

export interface Farm {
  id: string;
  user_id: string;
  farm_name: string;
}

export interface Litter {
  id: string;
  farm_id: string;
  sire_id: string | null;
  dam_id: string | null;
  litter_code: string | null;
  mating_date: string | null;
  expected_birth_date: string | null;
  status: string;
  sire?: Pick<Pet, 'name' | 'image_url'>;
  dam?: Pick<Pet, 'name' | 'image_url'>;
}

export interface FarmTransaction {
  id: string;
  farm_id: string;
  transaction_type: 'income' | 'expense';
  amount: number;
}

export interface Shop {
  id: string;
  user_id: string;
  shop_name: string;
}

export interface Service {
  id: string;
  user_id: string;
  service_name: string;
}

export interface Appointment {
  pet_id: string;
  vaccine_name: string;
  next_due: string;
}

export interface PetStats {
  breeders: number;
  kids: number;
  ready: number;
  retired: number;
  booked: number;
}

export interface PetWithFarm extends Omit<Pet, 'farm_id'> {
  farm_id: string | null;
  farms: { farm_name: string } | null;
  price?: number;
}
