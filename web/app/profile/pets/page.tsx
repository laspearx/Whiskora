"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { speciesTh } from "@/lib/species";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#1f1a1c",
  inkSoft: "#4a3f44",
  cream: "#fffafc",
  paper: "#fdf0f3",
  line: "#f3dde3",
  muted: "#8e7e84",
  pink: "#e84677",
  pinkSoft: "#fde2ea",
  pinkDeep: "#c4325f",
  sky: "#5b8dc7",
  leaf: "#5a9065",
  sun: "#e8a63a",
};

export default function MyPetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [personalPets, setPersonalPets] = useState<any[]>([]);
  const [farmPets, setFarmPets] = useState<Record<string, { name: string; pets: any[] }>>({});

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      const uid = session.user.id;

      const [{ data: farms }, { data: pets }] = await Promise.all([
        supabase.from("farms").select("id, farm_name").eq("user_id", uid),
        supabase.from("pets").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      ]);

      const personal: any[] = [];
      const grouped: Record<string, { name: string; pets: any[] }> = {};
      farms?.forEach(f => { grouped[f.id] = { name: f.farm_name, pets: [] }; });

      pets?.forEach(pet => {
        if (!pet.farm_id || pet.farm_id === "PERSONAL") personal.push(pet);
        else if (grouped[pet.farm_id]) grouped[pet.farm_id].pets.push(pet);
        else personal.push(pet);
      });

      setPersonalPets(personal);
      setFarmPets(grouped);
      setLoading(false);
    };
    load();
  }, [router]);

  const totalPets = personalPets.length + Object.values(farmPets).reduce((s, f) => s + f.pets.length, 0);

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        @keyframes page-rise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pets-page {
          max-width: 680px;
          margin: 0 auto;
          padding: 24px 0 80px;
          animation: page-rise .45s ease both;
          color: ${F.ink};
        }

        /* ── Page header ── */
        .page-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          padding: 0 2px;
        }

        .back-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid ${F.line};
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform .15s ease, background .15s ease;
          flex: 0 0 auto;
          color: ${F.ink};
        }

        .back-btn:hover { transform: translateY(-1px); background: ${F.paper}; }

        .page-header-text h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: ${F.ink};
          line-height: 1.2;
        }

        .page-header-text p {
          margin: 3px 0 0;
          font-size: 13px;
          color: ${F.muted};
          font-weight: 400;
        }

        /* ── Cards ── */
        .pet-section {
          border: 1px solid ${F.line};
          background: rgba(255,255,255,.94);
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 12px;
          box-shadow: 0 4px 14px rgba(31,26,28,.03);
          animation: page-rise .45s ease both;
        }

        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }

        .section-icon img {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }

        .section-head h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: ${F.ink};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .section-count {
          border-radius: 999px;
          background: ${F.paper};
          border: 1px solid ${F.line};
          color: ${F.muted};
          font-size: 11px;
          font-weight: 600;
          padding: 1px 8px;
          flex: 0 0 auto;
        }

        .add-btn {
          font-size: 12px;
          font-weight: 500;
          color: ${F.pink};
          text-decoration: none;
          border: 1px solid ${F.line};
          border-radius: 8px;
          padding: 5px 11px;
          background: white;
          white-space: nowrap;
          flex: 0 0 auto;
          transition: background .15s, border-color .15s;
        }

        .add-btn:hover {
          background: ${F.pinkSoft};
          border-color: ${F.pink};
        }

        /* ── Pet list ── */
        .pet-list {
          display: grid;
          gap: 8px;
        }

        .pet-row {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid ${F.line};
          border-radius: 14px;
          padding: 10px 14px;
          background: white;
          color: ${F.ink};
          text-decoration: none;
          transition: transform .15s ease, border-color .15s ease, box-shadow .15s ease;
          min-height: 62px;
        }

        .pet-row:hover {
          transform: translateY(-2px);
          border-color: ${F.pink};
          box-shadow: 0 4px 14px rgba(232,70,119,.08);
        }

        .pet-avatar {
          width: 48px;
          height: 48px;
          border-radius: 13px;
          overflow: hidden;
          background: ${F.pinkSoft};
          border: 1px solid ${F.line};
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }

        .pet-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pet-avatar-placeholder {
          width: 24px;
          height: 24px;
          object-fit: contain;
          opacity: .45;
        }

        .pet-info {
          flex: 1;
          min-width: 0;
        }

        .pet-name-row {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 3px;
        }

        .pet-name {
          font-size: 14px;
          font-weight: 500;
          color: ${F.ink};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .gender-badge {
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 600;
          flex: 0 0 auto;
          white-space: nowrap;
        }

        .gender-male {
          background: #e0f0ff;
          color: #2563eb;
        }

        .gender-female {
          background: ${F.pinkSoft};
          color: ${F.pinkDeep};
        }

        .pet-breed {
          font-size: 12px;
          color: ${F.muted};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pet-chevron {
          color: ${F.line};
          flex: 0 0 auto;
          transition: color .15s;
        }

        .pet-row:hover .pet-chevron {
          color: ${F.pink};
        }

        /* ── Empty state ── */
        .empty-state {
          padding: 32px 16px;
          text-align: center;
          border: 1.5px dashed ${F.line};
          border-radius: 14px;
          color: ${F.muted};
          font-size: 13px;
          font-weight: 500;
          background: ${F.cream};
        }

        @media (max-width: 560px) {
          .pets-page { padding: 16px 0 80px; }
          .pet-section { border-radius: 14px; padding: 14px; }
          .pet-avatar { width: 42px; height: 42px; border-radius: 11px; }
        }
      `}</style>

      <div className="pets-page">

          {/* Header */}
          <div className="page-header">
            <button className="back-btn" onClick={() => router.push('/profile')} aria-label="ย้อนกลับ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <div className="page-header-text">
              <h1>สัตว์เลี้ยงของฉัน</h1>
              <p>ทั้งหมด {totalPets} ตัว</p>
            </div>
          </div>

          {/* Personal pets */}
          <div className="pet-section">
            <div className="section-head">
              <div className="section-title">
                <div className="section-icon">
                  <img src="/icons/icon-my-pets.png" alt="" />
                </div>
                <h2>สัตว์เลี้ยงส่วนตัว</h2>
                <span className="section-count">{personalPets.length}</span>
              </div>
              <Link href="/pets/create?redirect=/profile/pets" className="add-btn">+ เพิ่ม</Link>
            </div>
            <div className="pet-list">
              {personalPets.length === 0 ? (
                <div className="empty-state">ยังไม่มีสัตว์เลี้ยง</div>
              ) : (
                personalPets.map(pet => <PetRow key={pet.id} pet={pet} />)
              )}
            </div>
          </div>

          {/* Farm pets */}
          {Object.entries(farmPets).map(([farmId, farm]) => (
            <div key={farmId} className="pet-section">
              <div className="section-head">
                <div className="section-title">
                  <div className="section-icon">
                    <img src="/icons/icon-farm.png" alt="" />
                  </div>
                  <h2>{farm.name}</h2>
                  <span className="section-count">{farm.pets.length}</span>
                </div>
                <Link href={`/farm-dashboard/${farmId}/pets/create`} className="add-btn">+ เพิ่ม</Link>
              </div>
              <div className="pet-list">
                {farm.pets.length === 0 ? (
                  <div className="empty-state">ยังไม่มีสมาชิกในฟาร์มนี้</div>
                ) : (
                  farm.pets.map(pet => <PetRow key={pet.id} pet={pet} />)
                )}
              </div>
            </div>
          ))}

        </div>
    </>
  );
}

function PetRow({ pet }: { pet: any }) {
  const isMale = pet.gender === "male" || pet.gender === "ตัวผู้";
  const breed = pet.breed || speciesTh(pet.species) || "ไม่ระบุสายพันธุ์";

  return (
    <Link href={`/pets/${pet.id}`} className="pet-row">
      <div className="pet-avatar">
        {pet.image_url ? (
          <img src={pet.image_url} alt={pet.name} />
        ) : (
          <img src="/icons/icon-my-pets.png" alt="" className="pet-avatar-placeholder" />
        )}
      </div>
      <div className="pet-info">
        <div className="pet-name-row">
          <span className="pet-name">{pet.name}</span>
          <span className={`gender-badge ${isMale ? "gender-male" : "gender-female"}`}>
            {isMale ? "ตัวผู้" : "ตัวเมีย"}
          </span>
        </div>
        <div className="pet-breed">{breed}</div>
      </div>
      <svg className="pet-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"/>
      </svg>
    </Link>
  );
}
