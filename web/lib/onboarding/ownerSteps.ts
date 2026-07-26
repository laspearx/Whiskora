import type { OnboardingStep } from "./types";

export interface OwnerStepsInput {
  fullName: string | null | undefined;
  pets: Array<{
    id: number;
    name: string | null;
    species: string | null;
    gender: string | null;
    birth_date: string | null;
  }>;
  hasHealthRecord: boolean;
  viewedOwnPublicProfileAt: string | null | undefined;
}

function firstPetId(pets: OwnerStepsInput["pets"]): number | null {
  return pets.length > 0 ? pets[0].id : null;
}

function firstIncompletePetId(pets: OwnerStepsInput["pets"]): number | null {
  const incomplete = pets.find(
    (p) => !p.name || !p.species || !p.gender || !p.birth_date
  );
  return incomplete ? incomplete.id : firstPetId(pets);
}

export function deriveOwnerSteps(input: OwnerStepsInput): OnboardingStep[] {
  const hasPet = input.pets.length > 0;
  const hasBasicInfo = input.pets.some(
    (p) => p.name && p.species && p.gender && p.birth_date
  );
  const petForHealth = firstPetId(input.pets);
  const petForDetail = firstIncompletePetId(input.pets);
  const petForProfile = firstPetId(input.pets);

  const steps: OnboardingStep[] = [
    {
      key: "profile",
      title: "ตั้งค่าโปรไฟล์ของคุณ",
      description: "ใส่ชื่อที่ใช้แสดงผล เพื่อให้โปรไฟล์ของคุณพร้อมใช้งาน",
      status: input.fullName && input.fullName.trim() ? "done" : "not_started",
      optional: false,
      ctaLabel: "ตั้งค่าโปรไฟล์",
      ctaHref: "/profile/edit",
      icon: "/icons/icon-nav-profile.png",
    },
    {
      key: "first_pet",
      title: "เพิ่มสัตว์เลี้ยงตัวแรก",
      description: "สร้างพื้นที่สำหรับสัตว์เลี้ยงของคุณ เก็บข้อมูลสำคัญไว้ในที่เดียว",
      status: hasPet ? "done" : "not_started",
      optional: false,
      ctaLabel: "เพิ่มสัตว์เลี้ยง",
      ctaHref: "/pets/create",
      icon: "/icons/icon-my-pets.png",
    },
    {
      key: "basic_info",
      title: "เติมข้อมูลพื้นฐานของสัตว์",
      description: "ชื่อ ประเภทสัตว์ เพศ และวันเกิดหรืออายุโดยประมาณ",
      status: !hasPet ? "not_started" : hasBasicInfo ? "done" : "in_progress",
      optional: false,
      ctaLabel: "เพิ่มข้อมูลสัตว์",
      ctaHref: petForDetail ? `/pets/${petForDetail}` : "/pets/create",
      icon: "/icons/icon-pet-records.png",
    },
    {
      key: "health_record",
      title: "บันทึกข้อมูลสุขภาพครั้งแรก",
      description: "วัคซีน น้ำหนัก หรือนัดหมาย อย่างใดอย่างหนึ่งก็เริ่มได้",
      status: !hasPet ? "not_started" : input.hasHealthRecord ? "done" : "in_progress",
      optional: false,
      ctaLabel: "เพิ่มข้อมูลสุขภาพ",
      ctaHref: petForHealth ? `/pets/${petForHealth}/vaccines` : "/pets/create",
      icon: "/icons/icon-vaccine.png",
    },
    {
      key: "view_share_profile",
      title: "ดูหรือแชร์โปรไฟล์สัตว์",
      description: "ลองดูว่าโปรไฟล์ของน้องหน้าตาเป็นอย่างไรเมื่อแชร์ให้คนอื่น",
      status: !hasPet ? "not_started" : input.viewedOwnPublicProfileAt ? "done" : "in_progress",
      optional: false,
      ctaLabel: "ดูโปรไฟล์ของน้อง",
      ctaHref: petForProfile ? `/p/${petForProfile}` : "/pets/create",
      icon: "/icons/icon-share.png",
    },
  ];

  return steps;
}

export function summarizeSteps(steps: OnboardingStep[]) {
  const relevant = steps.filter((s) => !s.optional);
  const done = relevant.filter((s) => s.status === "done").length;
  return { done, total: relevant.length, allDone: done === relevant.length && relevant.length > 0 };
}
