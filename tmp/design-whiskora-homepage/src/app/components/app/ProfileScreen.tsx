import { User, Bell, Shield, HelpCircle, ChevronRight, LogOut, Settings, Star } from "lucide-react";
import { A } from "../../appConstants";
import { PETS, OWNER } from "../../appData";
import miniLogoImg from "../../../imports/Photoroom_20260428_155346.png";
import verifiedImg from "../../../imports/Photoroom_20260428_155413.png";

export function ProfileScreen() {
  const menuGroups = [
    {
      title: "Account",
      items: [
        { icon: <User size={18} />, label: "Edit Profile", color: A.indigo, bg: A.indigoBg },
        { icon: <Bell size={18} />, label: "Notifications", color: A.amber, bg: A.amberBg },
        { icon: <Shield size={18} />, label: "Security & Privacy", color: A.green, bg: A.greenBg },
        { icon: <Settings size={18} />, label: "Preferences", color: A.gray, bg: A.surface },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: <HelpCircle size={18} />, label: "Help Center", color: A.blue, bg: A.blueBg },
        { icon: <Star size={18} />, label: "Rate Whiskora", color: A.amber, bg: A.amberBg },
      ],
    },
  ];

  return (
    <div style={{ background: A.surface, minHeight: "100%", paddingBottom: 24 }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(160deg, ${A.indigo} 0%, ${A.indigoDark} 100%)`,
        padding: "20px 20px 40px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", fontWeight: 800, color: A.white,
            border: "2px solid rgba(255,255,255,0.25)",
          }}>
            {OWNER.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: A.white }}>{OWNER.name}</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{OWNER.email}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                <img src={verifiedImg} alt="Whiskora Verified" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Verified Member · {OWNER.memberSince}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Stats card */}
        <div style={{
          background: A.white, borderRadius: 18, padding: "16px 20px",
          border: `1px solid ${A.border}`, boxShadow: A.shadowMd,
          display: "flex", justifyContent: "space-around",
          marginTop: -20, position: "relative", zIndex: 2,
          marginBottom: 20,
        }}>
          {[
            { value: PETS.length, label: "Pets" },
            { value: "8", label: "Health Records" },
            { value: "3", label: "ID Cards" },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: A.ink }}>{value}</div>
              <div style={{ fontSize: "0.68rem", color: A.gray, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Menu groups */}
        {menuGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: A.grayLight, marginBottom: 8, paddingLeft: 4, letterSpacing: "0.05em" }}>
              {group.title.toUpperCase()}
            </div>
            <div style={{ background: A.white, borderRadius: 16, border: `1px solid ${A.border}`, overflow: "hidden", boxShadow: A.shadow }}>
              {group.items.map(({ icon, label, color, bg }, i) => (
                <div
                  key={label}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px",
                    borderBottom: i < group.items.length - 1 ? `1px solid ${A.borderLight}` : "none",
                    cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: bg, color: color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600, color: A.ink }}>{label}</span>
                  <ChevronRight size={16} color={A.grayLight} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <button style={{
          width: "100%", padding: "14px",
          background: A.redBg, border: `1px solid ${A.red}22`,
          borderRadius: 14, display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8,
          color: A.red, fontWeight: 700, fontSize: "0.88rem",
          cursor: "pointer", fontFamily: "'Prompt', sans-serif",
        }}>
          <LogOut size={18} /> Sign Out
        </button>

        {/* Brand footer */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <img src={miniLogoImg} alt="Whiskora" style={{ width: 36, height: 36, objectFit: "contain", margin: "0 auto 6px" }} />
          <div style={{ fontSize: "0.65rem", color: A.grayLight }}>Whiskora v1.0.0 · เวอร์ชั่น Beta</div>
        </div>
      </div>
    </div>
  );
}
