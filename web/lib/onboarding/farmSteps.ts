import { PET_STATUS } from "@/lib/constants";
import type { OnboardingStep } from "./types";

export interface FarmStepsInput {
  farmId: number;
  farm: {
    farm_name: string | null;
    bio: string | null;
    phone: string | null;
    facebook_link: string | null;
    line_id: string | null;
    image_url: string | null;
    cover_url: string | null;
  } | null;
  visibilitySettingsCount: number;
  pets: Array<{
    id: number;
    status: string | null;
    image_url: string | null;
    birth_date: string | null;
  }>;
  littersCount: number;
  skippedSteps: string[];
  sharedProfileAt: string | null | undefined;
}

/** Minimum "good enough" data-completeness bar — matches data-check's 3 predicates
 *  (status/photo/birth) but doesn't require 100%, per product requirement. */
const DATA_CHECK_PASS_RATIO = 0.7;

export function deriveFarmSteps(input: FarmStepsInput): OnboardingStep[] {
  const farm = input.farm;
  const hasFarmInfo = !!(
    farm?.farm_name &&
    farm?.bio &&
    (farm?.phone || farm?.facebook_link || farm?.line_id)
  );
  const hasImage = !!(farm?.image_url || farm?.cover_url);
  const hasPrivacySettings = input.visibilitySettingsCount > 0;

  const hasAnyPet = input.pets.length > 0;
  const breederCount = input.pets.filter((p) => p.status === PET_STATUS.BREEDER).length;
  const readyCount = input.pets.filter(
    (p) => p.status === PET_STATUS.OPEN_RESERVE || p.status === PET_STATUS.AVAILABLE
  ).length;

  const totalFields = input.pets.length * 3;
  const missingFields = input.pets.reduce((sum, p) => {
    let missing = 0;
    if (!p.status) missing++;
    if (!p.image_url) missing++;
    if (!p.birth_date) missing++;
    return sum + missing;
  }, 0);
  const completenessRatio = totalFields > 0 ? (totalFields - missingFields) / totalFields : 0;
  const dataCheckPassed = hasAnyPet && completenessRatio >= DATA_CHECK_PASS_RATIO;

  const litterSkipped = input.skippedSteps.includes("litter");

  const steps: OnboardingStep[] = [
    {
      key: "farm_info",
      title: "เพิ่มข้อมูลฟาร์ม",
      description: "ชื่อฟาร์ม คำอธิบาย และช่องทางติดต่ออย่างน้อยหนึ่งช่องทาง",
      status: hasFarmInfo ? "done" : "not_started",
      optional: false,
      ctaLabel: "แก้ไขข้อมูลฟาร์ม",
      ctaHref: `/farm-dashboard/${input.farmId}/edit`,
      icon: "/icons/icon-farm.png",
    },
    {
      key: "farm_image",
      title: "เพิ่มโลโก้หรือภาพปก",
      description: "ช่วยให้โปรไฟล์ฟาร์มดูน่าเชื่อถือมากขึ้น",
      status: hasImage ? "done" : "not_started",
      optional: true,
      ctaLabel: "เพิ่มรูปฟาร์ม",
      ctaHref: `/farm-dashboard/${input.farmId}/edit`,
      icon: "/icons/icon-edit.png",
    },
    {
      key: "privacy",
      title: "ตั้งค่าความเป็นส่วนตัว",
      description: "คุณเลือกได้ว่าจะเปิดเผยข้อมูลสายเลือด สุขภาพ เอกสาร และข้อมูลอื่นในระดับใด",
      status: hasPrivacySettings ? "done" : "not_started",
      optional: false,
      ctaLabel: "ตั้งค่าความเป็นส่วนตัว",
      ctaHref: `/farm-dashboard/${input.farmId}/privacy`,
      icon: "/icons/icon-barrier.png",
    },
    {
      key: "first_farm_pet",
      title: "เพิ่มสัตว์ตัวแรกเข้าสู่ฟาร์ม",
      description: "เริ่มเก็บข้อมูลสัตว์ในฟาร์มของคุณ",
      status: hasAnyPet ? "done" : "not_started",
      optional: false,
      ctaLabel: "เพิ่มสัตว์",
      ctaHref: `/farm-dashboard/${input.farmId}/pets/create`,
      icon: "/icons/icon-pets.png",
    },
    {
      key: "breeder_pet",
      title: "เพิ่มพ่อพันธุ์หรือแม่พันธุ์",
      description: "ระบุสัตว์ที่เป็นพ่อพันธุ์/แม่พันธุ์ เพื่อใช้สร้างคู่บรีดในภายหลัง",
      status: !hasAnyPet ? "not_started" : breederCount > 0 ? "done" : "in_progress",
      optional: false,
      ctaLabel: "จัดการสัตว์ในฟาร์ม",
      ctaHref: `/farm-dashboard/${input.farmId}/pets?status=${encodeURIComponent(PET_STATUS.BREEDER)}`,
      icon: "/icons/icon-breeding.png",
    },
    {
      key: "first_litter",
      title: "สร้างคู่บรีดหรือครอกแรก",
      description: "ไม่จำเป็นต้องทำตอนนี้ ถ้ายังไม่มีแผนผสมพันธุ์",
      status: litterSkipped ? "skipped" : input.littersCount > 0 ? "done" : "not_started",
      optional: true,
      skippable: true,
      ctaLabel: "สร้างคู่บรีด",
      ctaHref: `/farm-dashboard/${input.farmId}/litters/create`,
      icon: "/icons/icon-foster-home.png",
    },
    {
      key: "data_check",
      title: "ตรวจความครบถ้วนของข้อมูล",
      description: "ไม่จำเป็นต้องครบ 100% แค่ผ่านเกณฑ์ขั้นต่ำก็พอ",
      status: !hasAnyPet ? "not_started" : dataCheckPassed ? "done" : "in_progress",
      optional: false,
      ctaLabel: "ตรวจสอบข้อมูล",
      ctaHref: `/farm-dashboard/${input.farmId}/data-check`,
      icon: "/icons/icon-pet-records.png",
    },
    {
      key: "ready_to_reserve",
      title: "ตั้งสถานะสัตว์ที่พร้อมเปิดจอง",
      description: "เมื่อพร้อมหาบ้านให้น้อง ค่อยเปิดจองก็ได้",
      status: !hasAnyPet ? "not_started" : readyCount > 0 ? "done" : "not_started",
      optional: true,
      ctaLabel: "จัดการสัตว์พร้อมหาบ้าน",
      ctaHref: `/farm-dashboard/${input.farmId}/pets?group=forsale`,
      icon: "/icons/icon-price-tag.png",
    },
    {
      key: "view_share_farm",
      title: "ดูและแชร์โปรไฟล์ฟาร์ม",
      description: "ลองดูว่าโปรไฟล์ฟาร์มของคุณหน้าตาเป็นอย่างไรเมื่อลูกค้าเข้ามาดู",
      status: !hasFarmInfo ? "not_started" : input.sharedProfileAt ? "done" : "in_progress",
      optional: false,
      ctaLabel: "ดูโปรไฟล์สาธารณะ",
      ctaHref: `/farm/${input.farmId}`,
      icon: "/icons/icon-share.png",
    },
  ];

  return steps;
}

export function summarizeFarmSteps(steps: OnboardingStep[]) {
  const relevant = steps.filter((s) => !s.optional);
  const done = relevant.filter((s) => s.status === "done").length;
  return { done, total: relevant.length, allDone: done === relevant.length && relevant.length > 0 };
}
