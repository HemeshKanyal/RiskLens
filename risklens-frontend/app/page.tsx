import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";

export default function Home() {
  return (
    <main className="bg-[#0B0F19] text-white min-h-screen">
      <Navbar />
      <HeroSection />
      <ProblemSection />
    </main>
  );
}