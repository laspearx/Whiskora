import { Nav } from "./components/home/Nav";
import { HeroSection } from "./components/home/HeroSection";
import { ProblemSection } from "./components/home/ProblemSection";
import { IdentitySection } from "./components/home/IdentitySection";
import { EcosystemSection } from "./components/home/EcosystemSection";
import { FarmsSection } from "./components/home/FarmsSection";
import { ServicesSection } from "./components/home/ServicesSection";
import { KnowledgeSection } from "./components/home/KnowledgeSection";
import { CtaSection } from "./components/home/CtaSection";
import { HomeFooter } from "./components/home/HomeFooter";

export default function App() {
  return (
    <div style={{ fontFamily: "'Prompt', 'Noto Sans Thai', sans-serif", overflowX: "hidden", position: "relative" }}>
      <Nav />
      <main style={{ position: "relative" }}>
        <HeroSection />
        <ProblemSection />
        <IdentitySection />
        <EcosystemSection />
        <FarmsSection />
        <ServicesSection />
        <KnowledgeSection />
        <CtaSection />
      </main>
      <HomeFooter />
    </div>
  );
}
