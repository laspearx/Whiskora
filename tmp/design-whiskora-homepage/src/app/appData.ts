export type Pet = {
  id: string;
  name: string;
  species: "Cat" | "Dog" | "Rabbit" | "Bird";
  breed: string;
  gender: "Male" | "Female";
  dob: string;
  age: string;
  color: string;
  weight: string;
  photo: string;
  healthStatus: "Healthy" | "Due for Vaccine" | "Needs Attention";
  verified: boolean;
  chipId: string;
  ownerId: string;
};

export type VaccineRecord = {
  id: string;
  petId: string;
  name: string;
  date: string;
  nextDue: string;
  clinic: string;
  status: "Done" | "Due" | "Overdue";
};

export type ActivityItem = {
  id: string;
  petId: string;
  type: "Vaccine" | "Deworming" | "Checkup" | "Weight" | "Document";
  title: string;
  subtitle: string;
  date: string;
  icon: string;
};

export const OWNER = {
  id: "USR-001",
  name: "Sarah Chen",
  nameLocal: "สาริน เจริญ",
  phone: "+66 89 123 4567",
  email: "sarah@example.com",
  avatar: null,
  memberSince: "Jan 2023",
};

export const PETS: Pet[] = [
  {
    id: "WK-2024-0042",
    name: "Mochi",
    species: "Cat",
    breed: "Scottish Fold",
    gender: "Female",
    dob: "2022-04-15",
    age: "2 yrs 2 mo",
    color: "Gray Tabby",
    weight: "3.5 kg",
    photo: "https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=300&h=300",
    healthStatus: "Healthy",
    verified: true,
    chipId: "TH040924060042",
    ownerId: "USR-001",
  },
  {
    id: "WK-2024-0089",
    name: "Milo",
    species: "Dog",
    breed: "Golden Retriever",
    gender: "Male",
    dob: "2021-08-20",
    age: "3 yrs 10 mo",
    color: "Golden",
    weight: "28.0 kg",
    photo: "https://images.unsplash.com/photo-1592769606534-fe78d27bf450?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=300&h=300",
    healthStatus: "Due for Vaccine",
    verified: true,
    chipId: "TH040924060089",
    ownerId: "USR-001",
  },
  {
    id: "WK-2024-0156",
    name: "Luna",
    species: "Cat",
    breed: "Persian",
    gender: "Female",
    dob: "2023-11-05",
    age: "8 months",
    color: "White",
    weight: "2.8 kg",
    photo: "https://images.unsplash.com/photo-1614035030394-b6e5b01e0737?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=300&h=300",
    healthStatus: "Needs Attention",
    verified: false,
    chipId: "",
    ownerId: "USR-001",
  },
];

export const VACCINES: VaccineRecord[] = [
  { id: "V001", petId: "WK-2024-0042", name: "FVRCP (Combo)", date: "2024-04-15", nextDue: "2025-04-15", clinic: "Paws & Care Clinic", status: "Done" },
  { id: "V002", petId: "WK-2024-0042", name: "Rabies", date: "2024-04-15", nextDue: "2025-04-15", clinic: "Paws & Care Clinic", status: "Done" },
  { id: "V003", petId: "WK-2024-0042", name: "FeLV", date: "2023-10-10", nextDue: "2024-10-10", clinic: "Happy Paws Vet", status: "Due" },
  { id: "V004", petId: "WK-2024-0089", name: "DA2PP (Combo)", date: "2024-08-20", nextDue: "2025-08-20", clinic: "BKK Pet Hospital", status: "Done" },
  { id: "V005", petId: "WK-2024-0089", name: "Rabies", date: "2024-02-01", nextDue: "2024-08-01", clinic: "BKK Pet Hospital", status: "Overdue" },
  { id: "V006", petId: "WK-2024-0089", name: "Bordetella", date: "2023-12-15", nextDue: "2024-12-15", clinic: "Happy Paws Vet", status: "Due" },
  { id: "V007", petId: "WK-2024-0156", name: "FVRCP", date: "2024-01-05", nextDue: "2025-01-05", clinic: "Central Vet", status: "Done" },
];

export const ACTIVITIES: ActivityItem[] = [
  { id: "A001", petId: "WK-2024-0042", type: "Vaccine", title: "FVRCP Vaccine", subtitle: "Paws & Care Clinic", date: "Apr 15, 2024", icon: "💉" },
  { id: "A002", petId: "WK-2024-0042", type: "Checkup", title: "Annual Checkup", subtitle: "Weight: 3.5 kg · Healthy", date: "Apr 15, 2024", icon: "🩺" },
  { id: "A003", petId: "WK-2024-0042", type: "Deworming", title: "Deworming Dose", subtitle: "Drontal Cat", date: "Mar 10, 2024", icon: "💊" },
  { id: "A004", petId: "WK-2024-0089", type: "Checkup", title: "Routine Checkup", subtitle: "Weight: 28 kg · Good", date: "Aug 20, 2024", icon: "🩺" },
  { id: "A005", petId: "WK-2024-0089", type: "Vaccine", title: "DA2PP Vaccine", subtitle: "BKK Pet Hospital", date: "Aug 20, 2024", icon: "💉" },
];

export const UPCOMING = [
  { petId: "WK-2024-0042", pet: "Mochi", event: "FeLV Vaccine Due", date: "Oct 10, 2024", urgent: true, type: "vaccine" },
  { petId: "WK-2024-0089", pet: "Milo", event: "Rabies Booster Overdue", date: "Aug 1, 2024", urgent: true, type: "vaccine" },
  { petId: "WK-2024-0089", pet: "Milo", event: "Bordetella Vaccine Due", date: "Dec 15, 2024", urgent: false, type: "vaccine" },
  { petId: "WK-2024-0156", pet: "Luna", event: "Microchip Registration", date: "Pending", urgent: false, type: "document" },
];

export function getPetById(id: string | null): Pet | undefined {
  if (!id) return undefined;
  return PETS.find((p) => p.id === id);
}

export function getPetVaccines(petId: string): VaccineRecord[] {
  return VACCINES.filter((v) => v.petId === petId);
}

export function getPetActivities(petId: string): ActivityItem[] {
  return ACTIVITIES.filter((a) => a.petId === petId);
}
