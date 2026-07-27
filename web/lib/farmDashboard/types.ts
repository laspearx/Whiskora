// Shared types for the Farm Operations Dashboard, sourced from the get_farm_dashboard_summary RPC.

export interface DashboardPet {
  id: number;
  name: string | null;
  status: string | null;
  gender: string | null;
  image_url: string | null;
  birth_date: string | null;
  litter_id: number | null;
  species: string | null;
  price: number | null;
  sire_id: number | null;
  dam_id: number | null;
}

export interface DashboardLitter {
  id: number;
  litter_code: string | null;
  sire_id: number | null;
  dam_id: number | null;
  mating_date: string | null;
  expected_birth_date: string | null;
  status: string | null;
  total_born: number | null;
  total_survived: number | null;
  actual_birth_date: string | null;
  puppy_count: number | null;
  sire: { id: number; name: string | null; image_url: string | null } | null;
  dam: { id: number; name: string | null; image_url: string | null; species: string | null } | null;
}

export interface DashboardVaccineDue {
  id: number;
  pet_id: number;
  vaccine_name: string;
  next_due: string;
}

export interface DashboardLatestWeight {
  pet_id: number;
  weight: number;
  recorded_date: string;
}

export interface DashboardPendingReservation {
  id: number;
  pet_id: number;
  buyer_id: string;
  created_at: string;
  expires_at: string | null;
}

export interface DashboardPendingTransfer {
  id: number;
  pet_id: number;
  to_user_id: string;
  initiated_at: string;
}

export interface DashboardOpenAppointment {
  id: number;
  title: string;
  appt_date: string;
  appt_type: string | null;
}

export interface FarmDashboardSummary {
  pets: DashboardPet[];
  litters: DashboardLitter[];
  vaccines_due: DashboardVaccineDue[];
  latest_weights: DashboardLatestWeight[];
  pending_reservations: DashboardPendingReservation[];
  pending_transfers_out: DashboardPendingTransfer[];
  open_appointments: DashboardOpenAppointment[];
  member_count: number;
  contact_leads_30d: number;
  contact_leads_prior_30d: number;
  reservations_30d: number;
  reservations_prior_30d: number;
  litters_born_90d: number;
  analytics_since: string | null;
  profile_views_30d: number;
  profile_views_prior_30d: number;
  generated_at: string;
}

export type TaskUrgency = 'overdue' | 'today' | 'upcoming' | 'info';

export interface Task {
  id: string;
  urgency: TaskUrgency;
  label: string;
  action: string;
  href: string;
  icon: string;
}

export interface AttentionItem {
  id: string;
  petId: number;
  petName: string;
  petImage: string | null;
  reason: string;
  href: string;
}

export interface BusinessInsight {
  id: string;
  text: string;
  trend: 'up' | 'down' | 'flat' | null;
  available: boolean;
  unavailableReason?: string;
  href?: string;
}

export interface StatTrend {
  value: number;
  previous?: number | null;
}
