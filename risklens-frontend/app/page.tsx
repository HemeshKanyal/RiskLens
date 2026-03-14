import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import AIInsightsPreviewSection from "@/components/landing/AIInsightsPreviewSection";
import BlockchainVerificationSection from "@/components/landing/BlockchainVerificationSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="bg-[#0B0F19] text-white min-h-screen">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <AIInsightsPreviewSection />
      <BlockchainVerificationSection />
      <CTASection />
      <Footer />
    </main>
  );
}